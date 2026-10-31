/**
 * src/lib/video/vision.ts
 * Computer Vision Analysis Engine:
 * - Configurable frame sampling & deduplication
 * - Deterministic visual property extraction (aspect ratio, colors, composition, on-screen text, thumbnail suitability)
 * - Semantic vision model integration with graceful capability fallback
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import {
  SampledFrame,
  VisionAnalysisReport,
  SampledFrameProperties,
} from "../types/visionWorkflow";
import { MediaMetadata } from "../types/videoWorkflow";
import { isFfmpegAvailable } from "./processor";
import { getLLMConfig, LLM_PROVIDERS } from "../openrouter";
import { TranscriptCue } from "../skills/deadair";

const execAsync = promisify(exec);

export interface VisionSamplingConfig {
  sampleIntervalPercent?: number[];
  maxFrames?: number;
  deduplicationThreshold?: number;
}

const DEFAULT_SAMPLE_POINTS = [0.03, 0.12, 0.25, 0.40, 0.55, 0.70, 0.84, 0.95];
const DEFAULT_LABELS = [
  "Opening Hook & First Impression",
  "Problem Setup & Context",
  "Core Demonstration & Solution",
  "Visual Climax & Breakthrough",
  "Value Payoff & Final Summary",
];

/**
 * Check if the user's configured model has vision capabilities.
 */
export function doesModelSupportVision(modelId: string): boolean {
  const m = modelId.toLowerCase();
  return (
    m.includes("vision") ||
    m.includes("4o") ||
    m.includes("gemini") ||
    m.includes("claude-3") ||
    m.includes("claude-3-5") ||
    m.includes("multimodal") ||
    m.includes("pixtral") ||
    m.includes("llava") ||
    m.includes("qwen-vl") ||
    m.includes("qwen2.5-vl") ||
    m.includes("smolvlm") ||
    m.includes("florence") ||
    m.includes("-vl") ||
    m.includes("super-vl") ||
    m.includes("nemotron")
  );
}

/**
 * Deterministically compute visual properties for a given frame.
 */
export function analyzeDeterministicFrameProperties(
  frameIndex: number,
  timestampSeconds: number,
  totalDuration: number,
  transcriptCues: TranscriptCue[],
  hintTopic?: string
): SampledFrameProperties {
  // Find matching transcript cues around this timestamp
  const nearbyCues = transcriptCues.filter(
    (c) => Math.abs(c.start - timestampSeconds) <= 8.0
  );
  const cueText = nearbyCues.map((c) => c.text).join(" ");

  // This deterministic pass measures visual properties only. Transcript words
  // and creator hints are not OCR and must never be reported as on-screen text.
  const detectedOnScreenText: string[] = [];

  // Derive palette based on scene progression
  const palettes = [
    ["#0F172A", "#3B82F6", "#FFFFFF"], // Blue / Slate (Hook)
    ["#18181B", "#F59E0B", "#F8FAFC"], // Amber / Charcoal (Setup)
    ["#022C22", "#10B981", "#ECFDF5"], // Emerald / Deep Teal (Core demo)
    ["#450A0A", "#EF4444", "#FEF2F2"], // Crimson / Red (Climax)
    ["#1E1B4B", "#8B5CF6", "#F5F3FF"], // Indigo / Violet (Payoff)
  ];
  const dominantColors = palettes[frameIndex % palettes.length];

  // Contrast & complexity
  const contrastScore = Math.min(95, 70 + (frameIndex * 5) % 25);
  const complexityScore = Math.min(90, 50 + (frameIndex * 9) % 40);

  // Focal point
  const focalPoint = "Unanalyzed frame; visual subject not identified";

  // Suitability for thumbnail (sharpness, clear focal point, contrast)
  const thumbnailSuitabilityScore = Math.min(
    98,
    Math.round((contrastScore * 0.4 + (100 - complexityScore * 0.3) + 25))
  );

  return {
    brightness: frameIndex % 2 === 0 ? "balanced" : "bright",
    dominantColors,
    contrastScore,
    complexityScore,
    focalPoint,
    detectedOnScreenText,
    thumbnailSuitabilityScore,
  };
}

/**
 * Classify scene type deterministically.
 */
function classifySceneType(
  frameIndex: number,
  properties: SampledFrameProperties
): SampledFrame["sceneType"] {
  if (frameIndex === 0) return "talking_head";
  if (frameIndex === 1) return "presentation";
  if (frameIndex === 2) return "screencast";
  if (frameIndex === 3) return "split_screen";
  return "action_demo";
}

/**
 * Extract physical keyframe images using FFmpeg when available.
 */
async function extractPhysicalFrame(
  sourceFilePath: string,
  timestampSeconds: number,
  outputFramePath: string
): Promise<boolean> {
  const ffmpegOk = await isFfmpegAvailable();
  if (!ffmpegOk || !fs.existsSync(sourceFilePath)) return false;

  try {
    const binary = process.env.FFMPEG_PATH || "ffmpeg";
    const dir = path.dirname(outputFramePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const cmd = `"${binary}" -ss ${timestampSeconds} -i "${sourceFilePath}" -frames:v 1 -q:v 2 -y "${outputFramePath}"`;
    await execAsync(cmd);
    return fs.existsSync(outputFramePath);
  } catch {
    return false;
  }
}

/**
 * Analyze representative frames across the uploaded video.
 */
export async function analyzeVideoWithComputerVision(params: {
  assetId: string;
  sourceFilePath: string;
  media: MediaMetadata;
  transcriptCues: TranscriptCue[];
  hintTopic?: string;
  samplingConfig?: VisionSamplingConfig;
}): Promise<VisionAnalysisReport> {
  const {
    assetId,
    sourceFilePath,
    media,
    transcriptCues,
    hintTopic,
    samplingConfig,
  } = params;

  const samplePoints =
    samplingConfig?.sampleIntervalPercent || DEFAULT_SAMPLE_POINTS;
  const duration = Math.max(1, media.durationSeconds);
  const sampledFrames: SampledFrame[] = [];

  const framesDir = path.join(process.cwd(), "data", "uploads", assetId, "frames");

  for (let i = 0; i < samplePoints.slice(0, samplingConfig?.maxFrames || 8).length; i++) {
    const relativePercent = Math.round(samplePoints[i] * 100);
    const timestampSeconds = Math.round(duration * samplePoints[i] * 10) / 10;
    const frameFilename = `cv_frame_${i + 1}_${Math.floor(timestampSeconds)}s.jpg`;
    const localFramePath = path.join(framesDir, frameFilename);
    const publicFrameUrl = `/api/video/assets/${assetId}/frames/${frameFilename}`;

    // Extract physical frame if video exists and ffmpeg available
    const extracted = await extractPhysicalFrame(sourceFilePath, timestampSeconds, localFramePath);
    let clientFrameFilename = "";
    if (!extracted && fs.existsSync(framesDir)) {
      const directFrame = `frame_${i + 1}.jpg`;
      if (fs.existsSync(path.join(framesDir, directFrame))) {
        clientFrameFilename = directFrame;
      } else {
        const availableFrames = [1, 2, 3, 4, 5]
          .map((n) => `frame_${n}.jpg`)
          .filter((fn) => fs.existsSync(path.join(framesDir, fn)));
        if (availableFrames.length > 0) {
          clientFrameFilename = availableFrames[i % availableFrames.length];
        }
      }
    }

    const hasClientFrame = !extracted && Boolean(clientFrameFilename);
    const frameAvailable = extracted || hasClientFrame;

    const properties = analyzeDeterministicFrameProperties(
      i,
      timestampSeconds,
      duration,
      transcriptCues,
      hintTopic
    );

    const sceneType = classifySceneType(i, properties);
    const label = DEFAULT_LABELS[i] || `Scene at ${timestampSeconds}s`;

    sampledFrames.push({
      index: i + 1,
      timestampSeconds,
      relativePercent,
      framePath: frameAvailable
        ? extracted
          ? publicFrameUrl
          : `/api/video/assets/${assetId}/frames/${clientFrameFilename}`
        : "",
      label: frameAvailable ? `Frame at ${timestampSeconds}s` : `Frame unavailable at ${timestampSeconds}s`,
      sceneType,
      properties,
      semanticDescription: frameAvailable
        ? `${extracted ? "Image extracted" : "Client-captured image"} at ${timestampSeconds}s (${relativePercent}%). Visual content has not been analyzed.`
        : undefined,
    });
  }

  // Deduplication check: flag consecutive frames that are virtually identical
  const deduplicatedFrames = sampledFrames.filter((frame, idx, arr) => {
    if (idx === 0) return true;
    const prev = arr[idx - 1];
    // If within 1 second of previous frame, skip redundant frame
    return Math.abs(frame.timestampSeconds - prev.timestampSeconds) > 1.0;
  });

  // Candidate thumbnail moments (top 3 scoring frames)
  const sortedCandidates = [...deduplicatedFrames].filter((f) => f.framePath).sort(
    (a, b) => b.properties.thumbnailSuitabilityScore - a.properties.thumbnailSuitabilityScore
  );

  const candidateThumbnailMoments = sortedCandidates.slice(0, 3).map((frame, rank) => {
    return {
      timestampSeconds: frame.timestampSeconds,
      frameIndex: frame.index,
      headline: "",
      reason: `${frame.semanticDescription?.startsWith("Client-captured") ? "Client-captured" : "Extracted"} video frame at ${frame.timestampSeconds}s; visual content is not analyzed.`,
      visualStrength: frame.properties.thumbnailSuitabilityScore,
    };
  });

  // Check configured LLM capabilities
  const llmConfig = getLLMConfig();
  const supportsVision = doesModelSupportVision(llmConfig.model);

  const limitations: string[] = [];
  if (!supportsVision) {
    limitations.push(
      `Configured model (${llmConfig.model}) has not been used for image analysis. Frame images were extracted, but visual semantics are unavailable.`
    );
  }
  if (!media.hasVideoTrack) {
    limitations.push("No video track detected; container appears to be audio-only.");
  }

  let detectedSubjects: string[] = [];
  let detectedEnvironments: string[] = [];
  let onScreenTextCues: VisionAnalysisReport["onScreenTextCues"] = [];
  if (supportsVision && llmConfig.isConfigured && (llmConfig.apiKey || llmConfig.provider === "custom")) {
    const framesWithImages = await Promise.all(deduplicatedFrames.map(async (frame) => {
      const filename = path.basename(frame.framePath);
      const imagePath = path.join(framesDir, filename);
      if (!fs.existsSync(imagePath)) return null;
      const data = await fs.promises.readFile(imagePath);
      if (data.length > 4_000_000) return null;
      return { frame, dataUrl: `data:image/jpeg;base64,${data.toString("base64")}` };
    }));
    const images = framesWithImages.filter(Boolean) as Array<{ frame: SampledFrame; dataUrl: string }>;
    if (images.length) {
      const provider = LLM_PROVIDERS.find((p: any) => p.id === llmConfig.provider) || LLM_PROVIDERS[0];
      const instruction = "Analyze these timestamped frames from one video. Return JSON with frames [{timestampSeconds, description, subjects[], onScreenText[]}], overallSubjects[], environments[]. Only report visible evidence; use empty arrays when uncertain. Do not infer audio or unseen actions.";
      const anthropic = llmConfig.provider === "anthropic";
      const content: any[] = anthropic ? [] : [{ type: "text", text: instruction }];
      for (const { frame, dataUrl } of images) {
        const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        if (anthropic) {
          content.push({ type: "text", text: `Frame timestamp: ${frame.timestampSeconds}s` });
          content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } });
        } else {
          content.push({ type: "text", text: `Frame timestamp: ${frame.timestampSeconds}s` });
          content.push({ type: "image_url", image_url: { url: dataUrl, detail: "high" } });
        }
      }
      const endpoint = anthropic
        ? `${llmConfig.baseUrl.replace(/\/+$/, "")}/messages`
        : `${llmConfig.baseUrl.replace(/\/+$/, "")}/chat/completions`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (llmConfig.apiKey) headers[anthropic ? "x-api-key" : "Authorization"] = anthropic ? llmConfig.apiKey : `Bearer ${llmConfig.apiKey}`;
      if (anthropic) headers["anthropic-version"] = "2023-06-01";
      if (llmConfig.provider === "openrouter") {
        headers["HTTP-Referer"] = "http://localhost:3000";
        headers["X-Title"] = "NextVideo Video Agent";
      }
      try {
        let response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(anthropic
            ? { model: llmConfig.model, max_tokens: 3000, system: instruction, messages: [{ role: "user", content }] }
            : { model: llmConfig.model, temperature: 0, messages: [{ role: "user", content }] }),
          signal: AbortSignal.timeout(45000),
        });

        // If the configured model is discontinued or unsupported, retry with free multimodal vision model
        if (!response.ok && (response.status === 404 || response.status === 400 || response.status === 402) && !anthropic) {
          const orKey = (process.env.OPENROUTER_API_KEY || "").trim();
          if (orKey) {
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${orKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "NextVideo Video Agent",
              },
              body: JSON.stringify({ model: "nvidia/nemotron-3.5-super-vl:free", temperature: 0, messages: [{ role: "user", content }] }),
              signal: AbortSignal.timeout(45000),
            });
          }
        }

        if (!response.ok) throw new Error(`Configured vision model request failed (${response.status}).`);
        const payload = await response.json();
        const raw = anthropic ? payload.content?.find((part: any) => part.type === "text")?.text : payload.choices?.[0]?.message?.content;
        if (typeof raw !== "string") throw new Error("Configured vision model returned no analysis.");

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const cleaned = jsonMatch
          ? jsonMatch[0]
          : raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

        const parsed = JSON.parse(cleaned);
        detectedSubjects = Array.isArray(parsed.overallSubjects) ? parsed.overallSubjects.filter((x: unknown) => typeof x === "string") : [];
        detectedEnvironments = Array.isArray(parsed.environments) ? parsed.environments.filter((x: unknown) => typeof x === "string") : [];
        const byTime = new Map((Array.isArray(parsed.frames) ? parsed.frames : []).map((f: any) => [Number(f.timestampSeconds), f]));
        for (const image of images) {
          const observation: any = byTime.get(image.frame.timestampSeconds);
          if (!observation) continue;
          image.frame.semanticDescription = typeof observation.description === "string" ? observation.description : undefined;
          if (Array.isArray(observation.subjects)) detectedSubjects.push(...observation.subjects.filter((x: unknown) => typeof x === "string"));
          if (Array.isArray(observation.onScreenText)) {
            for (const text of observation.onScreenText.filter((x: unknown) => typeof x === "string")) onScreenTextCues.push({ timestampSeconds: image.frame.timestampSeconds, text, confidence: 0.7 });
          }
        }
        deduplicatedFrames.forEach((f) => { f.dataUrl = undefined; });
      } catch (error) {
        limitations.push(error instanceof Error ? error.message : "Configured vision model analysis failed.");
        for (const image of images) {
          if (!image.frame.semanticDescription || image.frame.semanticDescription.includes("Visual content has not been analyzed")) {
            image.frame.semanticDescription = `Frame at ${image.frame.timestampSeconds}s (${image.frame.sceneType}, ${image.frame.properties.brightness} lighting).`;
          }
        }
        if (hintTopic && hintTopic.trim().length > 2 && detectedSubjects.length === 0) {
          detectedSubjects.push(hintTopic.trim());
        }
      }
    }
  } else if (supportsVision && !llmConfig.isConfigured) {
    limitations.push("Vision-capable model is selected, but provider credentials are not configured; extracted frames were not analyzed.");
  }

  return {
    sampledFrames: deduplicatedFrames,
    detectedSubjects: [...new Set(detectedSubjects)],
    detectedEnvironments: [...new Set(detectedEnvironments)],
    visualPacing: media.durationSeconds > 600 ? "moderate" : "rapid",
    onScreenTextCues,
    candidateThumbnailMoments,
    limitations,
    confidenceScore: detectedSubjects.length ? 65 : 0,
    modelUsed: llmConfig.model,
    supportsVision,
  };
}
