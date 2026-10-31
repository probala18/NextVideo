/**
 * src/lib/video/transcriber.ts
 * Real speech transcription pipeline with timestamped cues.
 * Supports OpenAI Whisper API and user-uploaded SRT/VTT/JSON.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { TranscriptCue, loadCuesFromText } from "../skills/deadair";
import { isFfmpegAvailable } from "./processor";

const execAsync = promisify(exec);

export interface TranscriptionResult {
  source: "whisper_api" | "openrouter" | "user_upload" | "unavailable";
  text: string;
  cues: TranscriptCue[];
  language?: string;
  durationSeconds?: number;
}

export async function transcribeMedia(
  filePath: string,
  userTranscriptPath?: string,
  hintTopic?: string
): Promise<TranscriptionResult> {
  // Option 1: User-uploaded transcript file (SRT, VTT, or JSON)
  if (userTranscriptPath && fs.existsSync(userTranscriptPath)) {
    const raw = await fs.promises.readFile(userTranscriptPath, "utf-8");
    const cues = loadCuesFromText(raw);
    const text = cues.map((c) => c.text).join(" ");
    return {
      source: "user_upload",
      text,
      cues,
      durationSeconds: cues.length > 0 ? cues[cues.length - 1].end : undefined,
    };
  }

  // Option 2: OpenAI Whisper API if configured
  const openaiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (openaiKey && fs.existsSync(filePath)) {
    let audioToSendPath = filePath;
    let tempAudioPath: string | null = null;

    try {
      const ffmpegOk = await isFfmpegAvailable();
      if (ffmpegOk) {
        // Extract low-bitrate mono MP3 to guarantee small payload under 25MB even for long videos
        const tmpFile = path.join(os.tmpdir(), `nextvideo_audio_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
        const binary = process.env.FFMPEG_PATH || "ffmpeg";
        await execAsync(`"${binary}" -y -i "${filePath}" -vn -ar 16000 -ac 1 -b:a 64k "${tmpFile}"`);
        if (fs.existsSync(tmpFile)) {
          tempAudioPath = tmpFile;
          audioToSendPath = tmpFile;
        }
      }

      const stat = await fs.promises.stat(audioToSendPath);
      // Whisper has 25MB request limit
      if (stat.size <= 24 * 1024 * 1024) {
        const fileBuffer = await fs.promises.readFile(audioToSendPath);
        const boundary = `----NextVideoFormBoundary${Date.now()}`;
        const filename = path.basename(audioToSendPath);
        const mimeType = filename.endsWith(".mp3") ? "audio/mp3" : "video/mp4";

        const bodyParts: Buffer[] = [];

        // File field
        bodyParts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
          )
        );
        bodyParts.push(fileBuffer);
        bodyParts.push(Buffer.from("\r\n"));

        // Model field
        bodyParts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`
          )
        );

        // Response format
        bodyParts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`
          )
        );

        bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
        const body = Buffer.concat(bodyParts);

        const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
          },
          body,
        });

        if (res.ok) {
          const data = await res.json();
          const cues: TranscriptCue[] = (data.segments || []).map((s: any) => ({
            start: Math.round(parseFloat(s.start) * 100) / 100,
            end: Math.round(parseFloat(s.end) * 100) / 100,
            text: String(s.text || "").trim(),
          }));

          return {
            source: "whisper_api",
            text: data.text || cues.map((c) => c.text).join(" "),
            cues,
            language: data.language,
            durationSeconds: data.duration,
          };
        } else {
          const errText = await res.text().catch(() => "");
          console.warn("[Whisper API Warning] Transcription request failed:", res.status, errText.slice(0, 150));
        }
      }
    } catch (err: any) {
      console.warn("[Transcription Pipeline Notice]", err?.message || "Failed to transcribe audio stream.");
    } finally {
      if (tempAudioPath && fs.existsSync(tempAudioPath)) {
        try {
          await fs.promises.unlink(tempAudioPath);
        } catch {}
      }
    }
  }

  return {
    source: "unavailable",
    text: "",
    cues: [],
  };
}
