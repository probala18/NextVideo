/**
 * src/lib/video/transcriber.ts
 * Real speech transcription pipeline with timestamped cues.
 * Supports OpenAI Whisper API and user-uploaded SRT/VTT/JSON.
 */

import fs from "fs";
import { TranscriptCue, loadCuesFromText } from "../skills/deadair";

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
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && fs.existsSync(filePath)) {
    try {
      const stat = await fs.promises.stat(filePath);
      // Whisper has 25MB request limit
      if (stat.size <= 24 * 1024 * 1024) {
        const fileBuffer = await fs.promises.readFile(filePath);
        const boundary = `----NextVideoFormBoundary${Date.now()}`;
        const filename = filePath.split(/[\/\\]/).pop() || "audio.mp4";

        const bodyParts: Buffer[] = [];

        // File field
        bodyParts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: video/mp4\r\n\r\n`
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
        }
      }
    } catch {
      // Preserve the transcription failure as unavailable evidence.
    }
  }

  return {
    source: "unavailable",
    text: "",
    cues: [],
  };
}
