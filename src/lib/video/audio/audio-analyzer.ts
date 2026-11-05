/**
 * src/lib/video/audio/audio-analyzer.ts
 * High-level Audio Intelligence Engine:
 * - Coordinates extraction, transcription, and status evaluation.
 * - Handles videos without audio cleanly.
 * - Manages temporary file lifecycle and cleanup.
 * - Returns structured AudioAnalysisResult and backward-compatible TranscriptionResult.
 */

import { extractAudioFromVideo } from "./extractor";
import {
  LocalWhisperProvider,
  OpenAIWhisperApiProvider,
  UserUploadTranscriptProvider,
} from "./whisper-provider";
import {
  AudioAnalysisResult,
  AudioTranscriptionOptions,
  convertAudioSegmentsToCues,
} from "./types";
import { TranscriptionResult } from "../transcriber";

export interface AnalyzeAudioInput {
  videoFilePath: string;
  userTranscriptPath?: string;
  hasAudioTrack?: boolean;
  options?: AudioTranscriptionOptions;
}

/**
 * Perform end-to-end Audio Intelligence analysis on a video file.
 */
export async function analyzeVideoAudio(
  input: AnalyzeAudioInput
): Promise<{
  audioResult: AudioAnalysisResult;
  transcript: TranscriptionResult;
}> {
  const { videoFilePath, userTranscriptPath, hasAudioTrack, options } = input;
  const startTime = Date.now();

  // Option A: User transcript file provided explicitly
  if (userTranscriptPath) {
    const userProvider = new UserUploadTranscriptProvider();
    const result = await userProvider.transcribe(userTranscriptPath);
    const cues = convertAudioSegmentsToCues(result.transcript.segments);
    return {
      audioResult: result,
      transcript: {
        source: "user_upload",
        text: result.transcript.rawText,
        cues,
        durationSeconds: result.processing.durationSeconds,
      },
    };
  }

  // Option B: Quick container check - if metadata already confirmed no audio track exists
  if (hasAudioTrack === false) {
    const noAudioResult: AudioAnalysisResult = {
      status: "no_audio",
      provider: "none",
      model: "none",
      language: { code: null, name: null, status: "not_applicable" },
      speechDetected: false,
      transcript: { rawText: "", segments: [] },
      limitations: ["Video container has no audio track."],
      processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
    };
    return {
      audioResult: noAudioResult,
      transcript: { source: "unavailable", text: "", cues: [] },
    };
  }

  // Extract 16kHz mono WAV for Whisper
  const extraction = await extractAudioFromVideo(videoFilePath, {
    format: "wav",
    sampleRate: 16000,
    channels: 1,
    timeoutMs: options?.timeoutMs || 60000,
  });

  if (!extraction.success || !extraction.audioPath) {
    await extraction.cleanup();
    const isNoAudio = !extraction.hasAudioTrack;
    const failureResult: AudioAnalysisResult = {
      status: isNoAudio ? "no_audio" : "failed",
      provider: "none",
      model: "none",
      language: { code: null, name: null, status: "not_applicable" },
      speechDetected: isNoAudio ? false : null,
      transcript: { rawText: "", segments: [] },
      limitations: [extraction.error || "Failed to extract audio track."],
      processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
    };
    return {
      audioResult: failureResult,
      transcript: { source: "unavailable", text: "", cues: [] },
    };
  }

  try {
    const localProvider = new LocalWhisperProvider();
    const isLocalAvailable = await localProvider.isAvailable();

    const openaiProvider = new OpenAIWhisperApiProvider();
    const isOpenAiAvailable = await openaiProvider.isAvailable();

    let result: AudioAnalysisResult;

    if (isLocalAvailable) {
      result = await localProvider.transcribe(extraction.audioPath, options);
    } else if (isOpenAiAvailable) {
      result = await openaiProvider.transcribe(extraction.audioPath, options);
    } else {
      result = {
        status: "unavailable",
        provider: "none",
        model: "whisper-base",
        language: { code: null, name: null, status: "not_applicable" },
        speechDetected: null,
        transcript: { rawText: "", segments: [] },
        limitations: [
          "Whisper audio intelligence is unavailable. To transcribe spoken speech, configure local Whisper (faster-whisper) or set OPENAI_API_KEY.",
        ],
        processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
      };
    }

    const cues = convertAudioSegmentsToCues(result.transcript.segments);
    const transcriptSource: TranscriptionResult["source"] =
      result.provider === "local_whisper"
        ? "whisper_api"
        : result.provider === "openai_whisper_api"
        ? "whisper_api"
        : result.provider === "user_upload"
        ? "user_upload"
        : "unavailable";

    return {
      audioResult: result,
      transcript: {
        source: transcriptSource,
        text: result.transcript.rawText,
        cues,
        language: result.language.name || result.language.code || undefined,
        durationSeconds: result.processing.durationSeconds,
      },
    };
  } finally {
    // Crucial: Clean up temporary WAV file unconditionally
    await extraction.cleanup();
  }
}

