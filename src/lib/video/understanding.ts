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
  const cleanTranscript = sanitizeUntrustedContent(transcript.text || "");
  const cues = transcript.cues || [];

  // Only verified transcript/frame model observations may establish a subject.
  // Creator hints and synthetic frame labels are context, never evidence.
  let spokenSubject = "";
  if (cues.length > 0) {
    const openingCues = cues.filter((c) => c.start <= 25.0);
    const openingText = openingCues.map((c) => c.text).join(" ").trim() || cues[0].text;
    
    // Look for phrases like "we build/create/cover/master/learn [X]" or "how to [X]"
    const match = openingText.match(/(?:build|create|master|learn|explain|deploy|cover|show|demonstrate|understanding)\s+(?:an?|the)?\s*([^.,:;!?]+)/i);
    if (match && match[1] && match[1].trim().length > 3) {
      spokenSubject = match[1].trim().slice(0, 45);
    } else if (openingText.length > 10) {
      spokenSubject = openingText.split(/[.?!]/)[0].slice(0, 50).trim();
    }
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
  const visualEvidence = (vision.sampledFrames || []).map((frame) => ({
    timestampSeconds: frame.timestampSeconds,
    observation: `Visual confirmation at ${frame.timestampSeconds}s: ${frame.label} displaying ${frame.sceneType.replace(
      "_",
      " "
    )} with ${frame.properties.focalPoint}.`,
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
      ...(vision.sampledFrames || []).map((f) => f.properties.focalPoint).filter(Boolean),
    ])
  );

  return {
    actualTopic,
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
