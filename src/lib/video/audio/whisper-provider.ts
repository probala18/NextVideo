/**
 * src/lib/video/audio/whisper-provider.ts
 * Modular OpenAI Whisper providers:
 * - Local Whisper Provider (using CPU int8 faster-whisper / whisper runtime)
 * - OpenAI Whisper API Provider (using OPENAI_API_KEY)
 * - User Upload Transcript Provider (SRT / VTT / JSON)
 * - Vercel / Cloud safe fallback
 */

import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  AudioAnalysisResult,
  AudioTranscriptionOptions,
  AudioTranscriptionProvider,
  AudioProviderType,
} from "./types";
import { loadCuesFromText } from "../../skills/deadair";

const execFileAsync = promisify(execFile);

const ISO_LANG_MAP: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ta: "Tamil",
  hi: "Hindi",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  ar: "Arabic",
  ru: "Russian",
};

/**
 * Safely resolves the absolute path to whisper-cli.py.
 * Resolves against process.cwd() to support Next.js bundled API routes (.next/server/...)
 * and supports Windows paths containing spaces.
 */
export function resolveWhisperScriptPath(): string {
  if (process.env.WHISPER_SCRIPT_PATH) {
    const custom = path.resolve(process.env.WHISPER_SCRIPT_PATH);
    if (fs.existsSync(custom)) return custom;
  }

  const candidates = [
    path.join(process.cwd(), "src", "lib", "video", "audio", "whisper-cli.py"),
    path.join(process.cwd(), "lib", "video", "audio", "whisper-cli.py"),
    path.join(__dirname, "whisper-cli.py"),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return path.resolve(candidate);
      }
    } catch {}
  }

  return path.resolve(candidates[0]);
}

/**
 * Local Whisper Provider executing through lightweight CPU-quantized runner.
 */
export class LocalWhisperProvider implements AudioTranscriptionProvider {
  public readonly id: AudioProviderType = "local_whisper";
  private isAvailableCache: boolean | null = null;

  public async isAvailable(): Promise<boolean> {
    // Vercel / serverless functions do not host local python runtimes
    if (process.env.VERCEL) return false;

    if (process.env.WHISPER_ENABLED === "false") return false;

    if (this.isAvailableCache !== null) return this.isAvailableCache;

    const scriptPath = resolveWhisperScriptPath();
    if (!fs.existsSync(scriptPath)) {
      console.warn(`[Whisper Provider] Runner script not found at: ${scriptPath}`);
      this.isAvailableCache = false;
      return false;
    }

    try {
      const pythonBin = process.env.PYTHON_PATH || "python";
      const { stdout } = await execFileAsync(pythonBin, [
        "-c",
        "import faster_whisper; print('OK')",
      ], { timeout: 8000 });

      this.isAvailableCache = stdout.trim() === "OK";
      return this.isAvailableCache;
    } catch {
      this.isAvailableCache = false;
      return false;
    }
  }

  public async transcribe(
    audioPath: string,
    options?: AudioTranscriptionOptions
  ): Promise<AudioAnalysisResult> {
    const startTime = Date.now();
    const model = options?.model || process.env.WHISPER_MODEL || "base";
    const language = options?.language || process.env.WHISPER_LANGUAGE || "auto";
    const timeoutMs = options?.timeoutMs || parseInt(process.env.WHISPER_TIMEOUT_MS || "120000", 10);
    const pythonBin = process.env.PYTHON_PATH || "python";
    const scriptPath = resolveWhisperScriptPath();

    if (!fs.existsSync(scriptPath)) {
      console.warn(`[Whisper Provider] Runner script missing at: ${scriptPath}`);
      return {
        status: "unavailable",
        provider: "none",
        model,
        language: { code: null, name: null, status: "not_applicable" },
        speechDetected: null,
        transcript: { rawText: "", segments: [] },
        limitations: [`Whisper script not found at "${scriptPath}". Ensure src/lib/video/audio/whisper-cli.py exists.`],
        processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
      };
    }

    const available = await this.isAvailable();
    if (!available) {
      return {
        status: "unavailable",
        provider: "none",
        model,
        language: { code: null, name: null, status: "not_applicable" },
        speechDetected: null,
        transcript: { rawText: "", segments: [] },
        limitations: ["Local Whisper runtime is not available in the current environment."],
        processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
      };
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        pythonBin,
        [
          scriptPath,
          audioPath,
          "--model",
          model,
          "--language",
          language,
          "--temperature",
          String(options?.temperature ?? 0.0),
        ],
        { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }
      );

      if (stderr && stderr.trim()) {
        console.info(`[Whisper Notice] ${stderr.trim().slice(0, 200)}`);
      }

      const trimmedStdout = stdout.trim();
      if (!trimmedStdout) {
        throw new Error("Whisper runner produced no output on stdout.");
      }

      let parsed: any;
      try {
        parsed = JSON.parse(trimmedStdout);
      } catch (parseErr: any) {
        throw new Error(`Failed to parse Whisper runner output: ${parseErr.message} (Raw: ${trimmedStdout.slice(0, 150)})`);
      }
      if (!parsed.success) {
        return {
          status: "failed",
          provider: this.id,
          model,
          language: { code: null, name: null, status: "unknown" },
          speechDetected: null,
          transcript: { rawText: "", segments: [] },
          limitations: [parsed.error || "Whisper transcription failed."],
          processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
        };
      }

      const segments = Array.isArray(parsed.segments)
        ? parsed.segments.map((s: any) => ({
            start: Number(s.start),
            end: Number(s.end),
            text: String(s.text || "").trim(),
            confidence: s.confidence !== undefined ? Number(s.confidence) : null,
          }))
        : [];

      const rawText = String(parsed.text || "").trim();
      const speechDetected = segments.length > 0 && rawText.length > 0;
      const langCode = parsed.language ? String(parsed.language) : null;
      const langName = langCode ? (ISO_LANG_MAP[langCode.toLowerCase()] || langCode) : null;

      return {
        status: speechDetected ? "completed" : "no_speech",
        provider: this.id,
        model,
        language: {
          code: langCode,
          name: langName,
          status: langCode ? "detected" : "unknown",
          probability: parsed.language_probability ?? null,
        },
        speechDetected,
        transcript: {
          rawText,
          normalizedText: rawText.replace(/\s+/g, " ").trim(),
          segments,
        },
        limitations: speechDetected
          ? []
          : ["Audio was analyzed by Whisper; no usable spoken speech was detected (clip appears to be music, instrumental, or ambient)."],
        processing: {
          durationSeconds: parsed.duration || 0,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const stderr = error?.stderr ? String(error.stderr).trim() : "";
      console.warn(`[Whisper Provider Error] Exit code: ${error?.code ?? "unknown"} | ${stderr || errMsg}`);

      return {
        status: "failed",
        provider: this.id,
        model,
        language: { code: null, name: null, status: "unknown" },
        speechDetected: null,
        transcript: { rawText: "", segments: [] },
        limitations: [stderr ? `Whisper runner error: ${stderr.slice(0, 200)}` : `Whisper failed: ${errMsg.slice(0, 200)}`],
        processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
      };
    }
  }
}

/**
 * Cloud OpenAI Whisper API Provider.
 */
export class OpenAIWhisperApiProvider implements AudioTranscriptionProvider {
  public readonly id: AudioProviderType = "openai_whisper_api";

  public async isAvailable(): Promise<boolean> {
    return Boolean((process.env.OPENAI_API_KEY || "").trim());
  }

  public async transcribe(
    audioPath: string,
    options?: AudioTranscriptionOptions
  ): Promise<AudioAnalysisResult> {
    const startTime = Date.now();
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();

    if (!apiKey) {
      return {
        status: "unavailable",
        provider: "none",
        model: "whisper-1",
        language: { code: null, name: null, status: "not_applicable" },
        speechDetected: null,
        transcript: { rawText: "", segments: [] },
        limitations: ["OPENAI_API_KEY is not configured."],
        processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
      };
    }

    try {
      const stat = await fs.promises.stat(audioPath);
      if (stat.size > 24 * 1024 * 1024) {
        return {
          status: "failed",
          provider: this.id,
          model: "whisper-1",
          language: { code: null, name: null, status: "unknown" },
          speechDetected: null,
          transcript: { rawText: "", segments: [] },
          limitations: ["Audio file exceeds OpenAI 25MB request limit."],
          processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
        };
      }

      const fileBuffer = await fs.promises.readFile(audioPath);
      const boundary = `----NextVideoWhisperBoundary${Date.now()}`;
      const filename = path.basename(audioPath);
      const mimeType = filename.endsWith(".wav") ? "audio/wav" : "audio/mpeg";

      const bodyParts: Buffer[] = [
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
        fileBuffer,
        Buffer.from("\r\n"),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`),
      ];

      if (options?.language && options.language !== "auto") {
        bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${options.language}\r\n`));
      }

      bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
      const body = Buffer.concat(bodyParts);

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
        signal: AbortSignal.timeout(options?.timeoutMs || 120000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          status: "failed",
          provider: this.id,
          model: "whisper-1",
          language: { code: null, name: null, status: "unknown" },
          speechDetected: null,
          transcript: { rawText: "", segments: [] },
          limitations: [`OpenAI Whisper API error (${res.status}): ${errText.slice(0, 150)}`],
          processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
        };
      }

      const data = await res.json();
      const segments = (data.segments || []).map((s: any) => ({
        start: Math.round(parseFloat(s.start) * 100) / 100,
        end: Math.round(parseFloat(s.end) * 100) / 100,
        text: String(s.text || "").trim(),
        confidence: s.avg_logprob !== undefined ? Math.round(parseFloat(s.avg_logprob) * 100) / 100 : null,
      }));

      const rawText = String(data.text || segments.map((s: any) => s.text).join(" ")).trim();
      const speechDetected = segments.length > 0 && rawText.length > 0;
      const langCode = data.language ? String(data.language) : null;
      const langName = langCode ? (ISO_LANG_MAP[langCode.toLowerCase()] || langCode) : null;

      return {
        status: speechDetected ? "completed" : "no_speech",
        provider: this.id,
        model: "whisper-1",
        language: {
          code: langCode,
          name: langName,
          status: langCode ? "detected" : "unknown",
        },
        speechDetected,
        transcript: {
          rawText,
          normalizedText: rawText.replace(/\s+/g, " ").trim(),
          segments,
        },
        limitations: speechDetected ? [] : ["No usable spoken speech detected in audio stream."],
        processing: {
          durationSeconds: data.duration || 0,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        status: "failed",
        provider: this.id,
        model: "whisper-1",
        language: { code: null, name: null, status: "unknown" },
        speechDetected: null,
        transcript: { rawText: "", segments: [] },
        limitations: [error instanceof Error ? error.message : "OpenAI Whisper API error."],
        processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
      };
    }
  }
}

/**
 * User Upload Transcript Provider for user-supplied SRT/VTT/JSON files.
 */
export class UserUploadTranscriptProvider implements AudioTranscriptionProvider {
  public readonly id: AudioProviderType = "user_upload";

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async transcribe(
    transcriptFilePath: string
  ): Promise<AudioAnalysisResult> {
    const startTime = Date.now();

    if (!transcriptFilePath || !fs.existsSync(transcriptFilePath)) {
      return {
        status: "unavailable",
        provider: "none",
        model: "user_file",
        language: { code: null, name: null, status: "not_applicable" },
        speechDetected: null,
        transcript: { rawText: "", segments: [] },
        limitations: ["User transcript file not found."],
        processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
      };
    }

    try {
      const raw = await fs.promises.readFile(transcriptFilePath, "utf-8");
      const cues = loadCuesFromText(raw);
      const segments = cues.map((c) => ({
        start: c.start,
        end: c.end,
        text: c.text,
      }));
      const rawText = segments.map((s) => s.text).join(" ").trim();
      const speechDetected = segments.length > 0 && rawText.length > 0;

      return {
        status: speechDetected ? "completed" : "no_speech",
        provider: this.id,
        model: "user_file",
        language: { code: null, name: null, status: "unknown" },
        speechDetected,
        transcript: {
          rawText,
          normalizedText: rawText.replace(/\s+/g, " ").trim(),
          segments,
        },
        limitations: [],
        processing: {
          durationSeconds: segments.length > 0 ? segments[segments.length - 1].end : 0,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        status: "failed",
        provider: this.id,
        model: "user_file",
        language: { code: null, name: null, status: "unknown" },
        speechDetected: null,
        transcript: { rawText: "", segments: [] },
        limitations: [error instanceof Error ? error.message : "Failed to parse user transcript file."],
        processing: { durationSeconds: 0, processingTimeMs: Date.now() - startTime },
      };
    }
  }
}

