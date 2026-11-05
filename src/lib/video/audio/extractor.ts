/**
 * src/lib/video/audio/extractor.ts
 * Safe, robust audio extraction using FFmpeg.
 * Extracts 16kHz 16-bit mono PCM WAV for Whisper consumption.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { AudioExtractionOptions, AudioExtractionResult } from "./types";
import { isFfmpegAvailable } from "../processor";

const execFileAsync = promisify(execFile);

/**
 * Extract audio track from video file safely using argument arrays.
 * Extracts 16kHz mono PCM WAV format optimal for OpenAI Whisper models.
 */
export async function extractAudioFromVideo(
  sourceVideoPath: string,
  options?: AudioExtractionOptions
): Promise<AudioExtractionResult> {
  const noopCleanup = async () => {};

  if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
    return {
      success: false,
      hasAudioTrack: false,
      cleanup: noopCleanup,
      error: "Source video file not found.",
    };
  }

  const ffmpegOk = await isFfmpegAvailable();
  if (!ffmpegOk) {
    return {
      success: false,
      hasAudioTrack: false,
      cleanup: noopCleanup,
      error: "FFmpeg executable is not available in the current environment.",
    };
  }

  const sampleRate = options?.sampleRate || 16000;
  const channels = options?.channels || 1;
  const timeoutMs = options?.timeoutMs || 60000;
  const binary = process.env.FFMPEG_PATH || "ffmpeg";

  const tempFilename = `whisper_extract_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.wav`;
  const outputAudioPath = path.join(os.tmpdir(), tempFilename);

  const cleanup = async () => {
    if (fs.existsSync(outputAudioPath)) {
      try {
        await fs.promises.unlink(outputAudioPath);
      } catch {
        // Ignore deletion errors during cleanup
      }
    }
  };

  // Safe argument array: ffmpeg -y -i input.mp4 -vn -ac 1 -ar 16000 -c:a pcm_s16le output.wav
  const args = [
    "-y",
    "-i",
    sourceVideoPath,
    "-vn", // disable video recording
    "-ac",
    String(channels),
    "-ar",
    String(sampleRate),
    "-c:a",
    "pcm_s16le",
    outputAudioPath,
  ];

  try {
    await execFileAsync(binary, args, { timeout: timeoutMs });

    if (!fs.existsSync(outputAudioPath)) {
      return {
        success: false,
        hasAudioTrack: false,
        cleanup,
        error: "FFmpeg exited without generating output audio file.",
      };
    }

    const stat = await fs.promises.stat(outputAudioPath);
    // If output file is negligible in size (< 100 bytes), container likely had no audio stream
    if (stat.size < 100) {
      await cleanup();
      return {
        success: false,
        hasAudioTrack: false,
        cleanup: noopCleanup,
        error: "Extracted audio file is empty; video container has no usable audio.",
      };
    }

    return {
      success: true,
      audioPath: outputAudioPath,
      hasAudioTrack: true,
      cleanup,
    };
  } catch (error: any) {
    await cleanup();
    const stderr = error.stderr || "";
    const isNoAudioStream =
      stderr.includes("does not contain any stream") ||
      stderr.includes("Output file does not contain any stream") ||
      stderr.includes("Stream map '0:a' matches no streams");

    if (isNoAudioStream) {
      return {
        success: false,
        hasAudioTrack: false,
        cleanup: noopCleanup,
        error: "Video file contains no audio track.",
      };
    }

    return {
      success: false,
      hasAudioTrack: true,
      cleanup: noopCleanup,
      error: error instanceof Error ? error.message : "FFmpeg audio extraction failed.",
    };
  }
}

