/**
 * src/lib/video/transcriber.ts
 * Real speech transcription pipeline with timestamped cues.
 * Modularly powered by OpenAI Whisper (local CPU faster-whisper, cloud Whisper API, and user transcripts).
 */

import { TranscriptCue } from "../skills/deadair";
import { analyzeVideoAudio } from "./audio/audio-analyzer";
import { AudioAnalysisResult } from "./audio/types";

export interface TranscriptionResult {
  source: "whisper_api" | "openrouter" | "user_upload" | "unavailable";
  text: string;
  cues: TranscriptCue[];
  language?: string;
  durationSeconds?: number;
  audioAnalysis?: AudioAnalysisResult;
}

/**
 * Transcribe media file using OpenAI Whisper (local CPU or API) or user upload.
 */
export async function transcribeMedia(
  filePath: string,
  userTranscriptPath?: string,
  hintTopic?: string
): Promise<TranscriptionResult> {
  const { transcript, audioResult } = await analyzeVideoAudio({
    videoFilePath: filePath,
    userTranscriptPath,
  });

  return {
    ...transcript,
    audioAnalysis: audioResult,
  };
}
