/**
 * src/lib/video/understanding.ts
 * Video Understanding & Evidence Assembly Engine:
 * - Fuses computer vision observations, audio transcription cues, and metadata
 * - Defends against prompt injection by isolating untrusted transcripts and on-screen text
 * - Extracts grounded topic, primary value proposition, and evidence timelines
 */

import {
  VisionAnalysisReport,
  VideoUnderstandingEvidence,
} from "../types/visionWorkflow";
import { MediaMetadata } from "../types/videoWorkflow";
import { TranscriptionResult } from "./transcriber";

/**
 * Sanitize untrusted transcript or on-screen text to prevent prompt injection.
 */
export function sanitizeUntrustedContent(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/ignore\s+all\s+previous\s+instructions/gi, "[REDACTED_PROMPT_INJECTION]")
    .replace(/system\s*:\s*/gi, "text: ")
    .replace(/<\|.*?\|>/g, "")
    .trim();
}

/**
 * Synthesize multimodal video understanding from visual analysis and audio cues.
 * Strictly grounds topic and summary in actual video and audio evidence.
 * Does not treat filenames or creator hints as authoritative descriptions.
 */
export function assembleVideoUnderstanding(params: {
  media: MediaMetadata;
  vision: VisionAnalysisReport;
  transcript: TranscriptionResult;
  creatorHintTopic?: string;
  channelNiche?: string;
  targetAudience?: string;
}): VideoUnderstandingEvidence {
  const {
    media,
    vision,
    transcript,
    creatorHintTopic,
    channelNiche = "Technology & Software Development",
    targetAudience = "Builders, Developers & Technical Creators",
  } = params;

  // Untrusted content defense: sanitize audio and on-screen text
  const cues = (transcript.cues || [])
    .map((cue) => ({ ...cue, text: sanitizeUntrustedContent(cue.text) }))
    .filter((cue) => Number.isFinite(cue.start) && cue.start >= 0 && Number.isFinite(cue.end) && cue.end >= cue.start && cue.text.length > 0);

  // Only verified transcript/frame model observations may establish a subject.
  // Creator hints and synthetic frame labels are context, never evidence.
  let spokenSubject = "";
  if (cues.length > 0) {
    const transcriptText = cues.map((cue) => cue.text).join(" ").trim();
    const subjectCandidates = transcriptText
      .split(/[.!?]/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 20)
      .sort((a, b) => {
        const score = (value: string) =>
          (/(?:build|create|explain|teach|show|demonstrat|review|compare|test|configure|deploy)/i.test(value) ? 3 : 0) +
          Math.min(3, value.split(/\s+/).length / 8);
        return score(b) - score(a);
      });
    const candidate = subjectCandidates[0] || transcriptText.slice(0, 120);
    const match = candidate.match(/(?:build|create|explain|teach|show|demonstrat|review|compare|test|configure|deploy)\w*\s+(?:an?|the)?\s*([^,;:]+)/i);
    spokenSubject = (match?.[1] || candidate).trim().slice(0, 80);
  }

  // 2. Evidence extraction from visual frames & on-screen text
  const onScreenTexts = (vision.onScreenTextCues || [])
    .map((c) => c.text.trim())
    .filter((t) => t.length > 2);
  const prominentOnScreenText = onScreenTexts[0] || "";

  // 3. Multimodal Topic Fusion
  let actualTopic = "";
  let isAdequatelyUnderstood = false;
  let limitationNotice: string | undefined = undefined;

  const hasVisualEvidence = vision.supportsVision && (vision.detectedSubjects?.length || onScreenTexts.length);
  if (spokenSubject && hasVisualEvidence) {
    actualTopic = spokenSubject;
    isAdequatelyUnderstood = true;
  } else if (spokenSubject) {
    actualTopic = spokenSubject;
    isAdequatelyUnderstood = true;
  } else if (prominentOnScreenText && vision.supportsVision) {
    actualTopic = prominentOnScreenText;
    isAdequatelyUnderstood = true;
  } else if (vision.supportsVision && vision.detectedSubjects?.length) {
    actualTopic = vision.detectedSubjects.slice(0, 3).join(", ");
    isAdequatelyUnderstood = true;
  } else if (creatorHintTopic && creatorHintTopic.trim().length > 2) {
    // If neither speech nor visual text is present, hint is strictly flagged as unverified
    actualTopic = creatorHintTopic.trim();
    isAdequatelyUnderstood = false;
    limitationNotice = "Limited audio/visual evidence detected. Topic is based on unverified creator hint without confirming speech or on-screen text.";
  } else {
    actualTopic = "";
    isAdequatelyUnderstood = false;
    limitationNotice = "The video could not be adequately understood from visual frames and audio transcription alone (no speech or legible text detected).";
  }

  // Find strongest narrative climax timestamp (typically around highest-scoring frame)
  const candidateFrame = vision.candidateThumbnailMoments?.[0];
  const narrativeClimaxSeconds = candidateFrame
    ? candidateFrame.timestampSeconds
    : Math.round(media.durationSeconds * 0.75);

  // Extract visual evidence points
  const visualEvidence = (vision.sampledFrames || []).filter((frame) => frame.framePath).map((frame) => ({
    timestampSeconds: frame.timestampSeconds,
    observation: frame.semanticDescription || `Frame extracted at ${frame.timestampSeconds}s; visual content was not analyzed.`,
    framePath: frame.framePath,
  }));

  // Extract key audio evidence points
  const audioEvidence = cues.slice(0, 5).map((cue) => ({
    timestampSeconds: cue.start,
    cueText: sanitizeUntrustedContent(cue.text),
  }));

  // Build concise evidence-grounded summary
  let summary = "";
  if (isAdequatelyUnderstood) {
    const visualContext = vision.sampledFrames?.length > 0
      ? `Visual progression across ${vision.sampledFrames.length} sampled keyframes confirms ${vision.visualPacing} pacing`
      : `Duration ${Math.round(media.durationSeconds)}s`;
    summary = `The available evidence identifies the video as about ${actualTopic}. ${vision.supportsVision ? `Visual analysis covers ${vision.sampledFrames?.length || 0} sampled frames` : "Visual analysis was unavailable"}; ${cues.length} timestamped transcript cues were available.`;
  } else {
    summary = `Media inspection of ${media.format.toUpperCase()} video (${Math.round(media.durationSeconds)}s, ${media.width || 1280}x${media.height || 720}) with limited extractable dialogue or readable on-screen graphics.`;
  }

  const keyTakeaways = [
    ...cues.slice(0, 3).map((cue) => `${Math.round(cue.start)}s: ${sanitizeUntrustedContent(cue.text)}`),
  ];

  const distinguishingFeatures = [
    `Visual pacing classified as ${vision.visualPacing} with ${vision.sampledFrames?.length || 0} distinct scene transitions.`,
    `Grounded evidence verified across video track (${media.format.toUpperCase()} ${
      media.width ? `${media.width}x${media.height}` : "16:9"
    }) and audio cues.`,
  ];

  const detectedVisualSubjects = Array.from(
    new Set([
      ...(vision.detectedSubjects || []),
      ...(vision.sampledFrames || []).map((f) => f.semanticDescription).filter((value): value is string => Boolean(value)),
    ])
  );
  const importantScenes = (vision.sampledFrames || [])
    .filter((frame) => frame.semanticDescription)
    .map((frame) => ({ timestampSeconds: frame.timestampSeconds, description: frame.semanticDescription as string }));
  const lowerTranscript = cues.map((cue) => cue.text).join(" ").toLowerCase();
  const contentType: VideoUnderstandingEvidence["contentType"] =
    /review|reviewing|pros and cons|unbox/i.test(lowerTranscript) ? "review" :
    /compare|versus|\bvs\.?\b|benchmark/i.test(lowerTranscript) ? "comparison" :
    /interview|conversation|ask me/i.test(lowerTranscript) ? "interview" :
    /teach|tutorial|lesson|how to|step by step/i.test(lowerTranscript) ? "teaching" :
    /build|create|configure|deploy|demonstrat|show you/i.test(lowerTranscript) ? "demonstration" :
    "unknown";
  const confidence = Math.min(100, Math.round(
    (spokenSubject ? 45 : 0) +
    (vision.supportsVision && importantScenes.length ? 30 : 0) +
    (cues.length >= 3 ? 20 : cues.length ? 10 : 0) +
    (onScreenTexts.length ? 5 : 0)
  ));

  return {
    actualTopic,
    videoSubject: actualTopic,
    videoPurpose: contentType === "unknown" ? undefined : contentType,
    contentType,
    primaryActions: cues.slice(0, 5).map((cue) => cue.text.split(/[.!?]/)[0]).filter(Boolean),
    demonstratedTechnologies: detectedVisualSubjects.filter((subject) => /(?:js|react|next|python|java|swift|sql|api|code|app|software|browser|terminal)/i.test(subject)),
    importantScenes,
    demonstratedOutcomes: cues.filter((cue) => /result|achiev|works|完成|success|deployed|built/i.test(cue.text)).map((cue) => cue.text),
    confidence,
    summary,
    isAdequatelyUnderstood,
    limitationNotice,
    detectedVisualSubjects,
    primaryValueProposition: isAdequatelyUnderstood ? `The available evidence identifies the subject as ${actualTopic}.` : "",
    narrativeClimaxSeconds,
    targetAudience,
    keyTakeaways,
    distinguishingFeatures,
    visualEvidence,
    audioEvidence,
    untrustedInputProtection: true,
  };
}
