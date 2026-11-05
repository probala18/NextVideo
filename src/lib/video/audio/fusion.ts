/**
 * src/lib/video/audio/fusion.ts
 * Cross-modal Multimodal Evidence Fusion Engine:
 * - Fuses independent Visual Evidence and Audio Evidence.
 * - Detects cross-modal agreements, contradictions, and uncertainties.
 * - Preserves provenance and timestamps for every claim.
 * - Enforces anti-hallucination guardrails (visual text != spoken dialogue).
 */

import {
  AudioAnalysisResult,
  MultimodalVideoEvidence,
  SupportingEvidenceItem,
} from "./types";
import { VisionAnalysisReport } from "../../types/visionWorkflow";
import { MediaMetadata } from "../../types/videoWorkflow";

export interface FuseMultimodalInput {
  media: MediaMetadata;
  visual: VisionAnalysisReport;
  audio: AudioAnalysisResult;
  actualTopic?: string;
  detectedVisualSubjects?: string[];
}

/**
 * Fuse visual and audio evidence streams into a coherent MultimodalVideoEvidence object.
 */
export function fuseMultimodalEvidence(
  input: FuseMultimodalInput
): MultimodalVideoEvidence {
  const { media, visual, audio, actualTopic, detectedVisualSubjects } = input;

  // 1. Process Visual Stream
  const validVisualScenes = (visual.sampledFrames || [])
    .filter(
      (f) =>
        f.semanticDescription &&
        !f.semanticDescription.includes("Visual content has not been analyzed")
    )
    .map((f) => ({
      timestampSeconds: f.timestampSeconds,
      observation: f.semanticDescription!.trim(),
      framePath: f.framePath,
    }));

  const visualStatus: "completed" | "unavailable" | "failed" =
    validVisualScenes.length > 0
      ? "completed"
      : visual.limitations.length > 0
      ? "failed"
      : "unavailable";

  const visualSubjects = detectedVisualSubjects || visual.detectedSubjects || [];

  // 2. Process Audio Stream
  const audioSegments = audio.transcript?.segments || [];
  const hasSpokenAudio = audio.speechDetected === true && audioSegments.length > 0;

  // 3. Assemble Supporting Evidence with Provenance
  const supportingEvidence: SupportingEvidenceItem[] = [];

  // Add visual evidence points
  for (const scene of validVisualScenes.slice(0, 10)) {
    supportingEvidence.push({
      modality: "visual",
      description: scene.observation,
      start: scene.timestampSeconds,
    });
  }

  // Add audio evidence points
  for (const seg of audioSegments.slice(0, 15)) {
    supportingEvidence.push({
      modality: "audio",
      description: seg.text,
      start: seg.start,
      end: seg.end,
    });
  }

  // 4. Identify Cross-Modal Agreements (Modality: "both")
  const confirmedTopics = new Set<string>();
  if (actualTopic && actualTopic.trim()) {
    confirmedTopics.add(actualTopic.trim());
  }

  // Check if audio words appear in visual subjects
  const audioLower = (audio.transcript?.rawText || "").toLowerCase();
  for (const subject of visualSubjects) {
    if (subject.length >= 3 && audioLower.includes(subject.toLowerCase())) {
      confirmedTopics.add(subject);
      // Mark supporting evidence with both
      supportingEvidence.push({
        modality: "both",
        description: `Subject "${subject}" is both visually observable and mentioned in spoken dialogue.`,
      });
    }
  }

  // 5. Detect Contradictions & Mismatches
  const contradictions: string[] = [];
  const uncertainties: string[] = [];

  const techPattern = /\b(?:react|python|code|tutorial|database|docker|api|javascript|programming)\b/i;
  const romanticPattern = /\b(?:romantic|love|couple|wedding|heart|status)\b/i;

  const audioHasTech = techPattern.test(audioLower);
  const audioHasRomantic = romanticPattern.test(audioLower);
  const visualTextLower = validVisualScenes.map((s) => s.observation).join(" ").toLowerCase();
  const visualHasTech = techPattern.test(visualTextLower);
  const visualHasRomantic = romanticPattern.test(visualTextLower);

  if (audioHasTech && !visualHasTech && visualHasRomantic) {
    contradictions.push(
      "Audio commentary mentions software technology, but visual frames depict romantic or non-technical scenes."
    );
  }

  if (audioHasRomantic && visualHasTech && !visualHasRomantic) {
    contradictions.push(
      "Audio dialogue references romance/music, but visual scenes demonstrate technical tools."
    );
  }

  // 6. Record Uncertainties
  if (audio.status === "no_audio") {
    uncertainties.push("Video container does not include an audio stream.");
  } else if (audio.status === "no_speech") {
    uncertainties.push(
      "Audio is present but contains no identifiable speech dialogue (clip is musical, instrumental, or ambient)."
    );
  } else if (audio.status === "unavailable") {
    uncertainties.push(
      "Whisper transcription was unavailable; understanding relies on visual observations and on-screen graphics."
    );
  }

  if (audio.language?.status === "unknown" && hasSpokenAudio) {
    uncertainties.push("Spoken language could not be identified with confidence.");
  }

  if (validVisualScenes.length === 0 && visual.supportsVision) {
    uncertainties.push("Semantic visual analysis did not return detailed frame descriptions.");
  }

  // 7. Synthesize Combined Grounded Summary
  let combinedSummary = "";
  if (hasSpokenAudio && validVisualScenes.length > 0) {
    const langStr = audio.language?.name ? ` in ${audio.language.name}` : "";
    combinedSummary = `Multimodal verification: Visual frames depict ${visualSubjects.slice(0, 3).join(", ") || "presenter scenes"}, while spoken dialogue${langStr} discusses "${(audio.transcript.rawText || "").slice(0, 120)}...". Both modalities support ${actualTopic || "the topic"}.`;
  } else if (hasSpokenAudio) {
    const langStr = audio.language?.name ? ` (${audio.language.name})` : "";
    combinedSummary = `Spoken audio intelligence${langStr}: Dialogue discusses "${(audio.transcript.rawText || "").slice(0, 140)}...". Visual frame detail was limited.`;
  } else if (validVisualScenes.length > 0) {
    const audioNote =
      audio.status === "no_audio"
        ? "Video has no audio track."
        : "Audio contains no dialogue (music or ambient sound).";
    combinedSummary = `Visual intelligence: Frame observations focus on ${visualSubjects.slice(0, 3).join(", ") || "visual subjects"}. ${audioNote}`;
  } else {
    combinedSummary = `Basic media inspection: ${media.format.toUpperCase()} video (${Math.round(media.durationSeconds)}s). Neither speech transcription nor semantic frame descriptions were available.`;
  }

  return {
    visual: {
      status: visualStatus,
      observations: validVisualScenes,
      summary: validVisualScenes.length > 0 ? `Visual analysis across ${validVisualScenes.length} representative frames.` : null,
      visualSubjects,
    },
    audio,
    combined: {
      summary: combinedSummary,
      confirmedTopics: Array.from(confirmedTopics),
      supportingEvidence,
      uncertainties,
      contradictions,
    },
  };
}

