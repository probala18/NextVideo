/**
 * src/lib/video/audio/types.ts
 * Strongly typed schemas and interfaces for Audio Intelligence & Whisper Integration.
 */

import { TranscriptCue } from "../../skills/deadair";

export type AudioAnalysisStatus =
  | "completed"
  | "no_audio"
  | "no_speech"
  | "unavailable"
  | "failed";

export type AudioProviderType =
  | "local_whisper"
  | "openai_whisper_api"
  | "user_upload"
  | "none";

export interface AudioLanguageInfo {
  code: string | null;
  name: string | null;
  status: "detected" | "unknown" | "not_applicable";
  probability?: number | null;
}

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number | null;
}

export interface AudioAnalysisResult {
  status: AudioAnalysisStatus;
  provider: AudioProviderType;
  model: string;
  language: AudioLanguageInfo;
  speechDetected: boolean | null;
  transcript: {
    rawText: string;
    normalizedText?: string;
    segments: AudioSegment[];
  };
  limitations: string[];
  processing: {
    durationSeconds: number;
    processingTimeMs: number;
  };
}

export interface AudioExtractionOptions {
  sampleRate?: number; // default 16000
  channels?: number; // default 1 (mono)
  format?: "wav" | "mp3";
  timeoutMs?: number;
}

export interface AudioExtractionResult {
  success: boolean;
  audioPath?: string;
  durationSeconds?: number;
  hasAudioTrack: boolean;
  cleanup: () => Promise<void>;
  error?: string;
}

export interface AudioTranscriptionOptions {
  model?: string; // "tiny" | "base" | "small"
  language?: string; // "auto" or ISO code
  temperature?: number;
  timeoutMs?: number;
}

export interface AudioTranscriptionProvider {
  id: AudioProviderType;
  isAvailable(): Promise<boolean>;
  transcribe(
    audioPath: string,
    options?: AudioTranscriptionOptions
  ): Promise<AudioAnalysisResult>;
}

export interface SupportingEvidenceItem {
  modality: "visual" | "audio" | "both";
  description: string;
  start?: number;
  end?: number;
}

export interface MultimodalVideoEvidence {
  visual: {
    status: "completed" | "unavailable" | "failed";
    observations: Array<{
      timestampSeconds: number;
      observation: string;
      framePath?: string;
    }>;
    summary: string | null;
    visualSubjects: string[];
  };
  audio: AudioAnalysisResult;
  combined: {
    summary: string | null;
    confirmedTopics: string[];
    supportingEvidence: SupportingEvidenceItem[];
    uncertainties: string[];
    contradictions: string[];
  };
}

/**
 * Convert Whisper AudioSegments to deadair TranscriptCue format for backward compatibility.
 */
export function convertAudioSegmentsToCues(segments: AudioSegment[]): TranscriptCue[] {
  return segments.map((s) => ({
    start: Math.round(s.start * 100) / 100,
    end: Math.round(s.end * 100) / 100,
    text: s.text.trim(),
  }));
}

