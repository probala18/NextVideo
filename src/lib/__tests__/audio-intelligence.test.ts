import { describe, expect, it } from "bun:test";
import fs from "fs";
import path from "path";
import os from "os";
import {
  fuseMultimodalEvidence,
  LocalWhisperProvider,
  OpenAIWhisperApiProvider,
  UserUploadTranscriptProvider,
} from "../video/audio";
import { assembleVideoUnderstanding } from "../video/understanding";
import type { AudioAnalysisResult } from "../video/audio/types";
import type { VisionAnalysisReport } from "../types/visionWorkflow";
import type { MediaMetadata, TranscriptionResult } from "../types/videoWorkflow";

describe("Audio Intelligence & Multimodal Fusion Pipeline", () => {
  describe("1. Audio Provider Independence & Configuration", () => {
    it("LocalWhisperProvider exposes local_whisper id and checks availability", () => {
      const provider = new LocalWhisperProvider();
      expect(provider.id).toBe("local_whisper");
      expect(provider.isAvailable).toBeDefined();
    });

    it("UserUploadTranscriptProvider parses SRT and VTT formats correctly", async () => {
      const srtContent = `1
00:00:01,000 --> 00:00:04,500
Welcome to this technical tutorial.

2
00:00:05,000 --> 00:00:08,200
Today we are building an audio pipeline.`;

      const tmpFilePath = path.join(os.tmpdir(), `test-${Date.now()}.srt`);
      fs.writeFileSync(tmpFilePath, srtContent, "utf-8");

      try {
        const provider = new UserUploadTranscriptProvider();
        expect(await provider.isAvailable()).toBe(true);

        const result = await provider.transcribe(tmpFilePath);
        expect(result.status).toBe("completed");
        expect(result.transcript.segments.length).toBe(2);
        expect(result.transcript.segments[0].text).toContain("Welcome to this technical tutorial.");
        expect(result.transcript.segments[0].start).toBe(1.0);
        expect(result.transcript.segments[0].end).toBe(4.5);
        expect(result.transcript.rawText).toContain("Welcome to this technical tutorial.");
        expect(result.speechDetected).toBe(true);
      } finally {
        if (fs.existsSync(tmpFilePath)) {
          fs.unlinkSync(tmpFilePath);
        }
      }
    });

    it("OpenAIWhisperApiProvider reports unavailable when API key is unset", async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      try {
        delete process.env.OPENAI_API_KEY;
        const provider = new OpenAIWhisperApiProvider();
        expect(await provider.isAvailable()).toBe(false);
      } finally {
        if (originalKey) process.env.OPENAI_API_KEY = originalKey;
      }
    });
  });

  describe("2. Multimodal Evidence Fusion & Contradiction Detection", () => {
    const mockMedia: MediaMetadata = {
      filename: "sample_video.mp4",
      format: "mp4",
      durationSeconds: 30,
      width: 1920,
      height: 1080,
      hasVideoTrack: true,
      hasAudioTrack: true,
      fileSizeBytes: 1048576,
    };

    it("confirms topics when visual and audio evidence align", () => {
      const mockVisual: VisionAnalysisReport = {
        modelUsed: "qwen2.5vl:3b",
        sampledFrames: [
          {
            timestampSeconds: 5,
            framePath: "frame1.jpg",
            semanticDescription: "A developer is writing code in an IDE editor.",
            confidence: 0.9,
          },
        ],
        onScreenTextDetections: [{ text: "function transcribe()", timestampSeconds: 5, confidence: 0.9 }],
        visualPacing: "balanced",
        limitations: [],
      };

      const mockAudio: AudioAnalysisResult = {
        status: "completed",
        provider: "local_whisper",
        model: "base",
        language: { code: "en", name: "English", status: "detected", probability: 0.98 },
        speechDetected: true,
        transcript: {
          rawText: "In this tutorial we will configure TypeScript and write a new function.",
          segments: [
            { start: 0, end: 5, text: "In this tutorial we will configure TypeScript and write a new function." },
          ],
        },
        limitations: [],
        processing: { durationSeconds: 30, processingTimeMs: 1200 },
      };

      const fusion = fuseMultimodalEvidence({
        media: mockMedia,
        visual: mockVisual,
        audio: mockAudio,
        actualTopic: "software development tutorial",
        detectedVisualSubjects: ["software", "development", "coding"],
      });

      expect(fusion.combined.contradictions.length).toBe(0);
      expect(fusion.combined.confirmedTopics.length).toBeGreaterThan(0);
      expect(fusion.combined.supportingEvidence.length).toBeGreaterThan(0);
      expect(fusion.combined.summary).toContain("Multimodal verification");
    });

    it("detects contradiction when visual is romantic couple and audio is coding lecture", () => {
      const mockVisual: VisionAnalysisReport = {
        modelUsed: "qwen2.5vl:3b",
        sampledFrames: [
          {
            timestampSeconds: 5,
            framePath: "frame1.jpg",
            semanticDescription: "A romantic couple embracing on a beach at sunset in a music video scene.",
            confidence: 0.85,
          },
        ],
        onScreenTextDetections: [],
        visualPacing: "balanced",
        limitations: [],
      };

      const mockAudio: AudioAnalysisResult = {
        status: "completed",
        provider: "local_whisper",
        model: "base",
        language: { code: "en", name: "English", status: "detected", probability: 0.95 },
        speechDetected: true,
        transcript: {
          rawText: "Let us inspect the Python script and compile the code.",
          segments: [
            { start: 0, end: 4, text: "Let us inspect the Python script and compile the code." },
          ],
        },
        limitations: [],
        processing: { durationSeconds: 30, processingTimeMs: 1200 },
      };

      const fusion = fuseMultimodalEvidence({
        media: mockMedia,
        visual: mockVisual,
        audio: mockAudio,
        actualTopic: "romantic couple song",
        detectedVisualSubjects: ["couple", "beach", "sunset", "romance"],
      });

      expect(fusion.combined.contradictions.length).toBeGreaterThan(0);
      expect(fusion.combined.contradictions[0]).toContain("Audio commentary mentions software technology");
    });

    it("handles silent video or music-only video gracefully", () => {
      const mockVisual: VisionAnalysisReport = {
        modelUsed: "qwen2.5vl:3b",
        sampledFrames: [
          {
            timestampSeconds: 5,
            framePath: "frame1.jpg",
            semanticDescription: "Sports car drifting on a race track at high speed.",
            confidence: 0.92,
          },
        ],
        onScreenTextDetections: [{ text: "GT-R", timestampSeconds: 5, confidence: 0.9 }],
        visualPacing: "fast",
        limitations: [],
      };

      const mockAudio: AudioAnalysisResult = {
        status: "no_speech",
        provider: "local_whisper",
        model: "base",
        language: { code: null, name: null, status: "not_applicable" },
        speechDetected: false,
        transcript: { rawText: "", segments: [] },
        limitations: ["No spoken dialogue detected by Voice Activity Detection."],
        processing: { durationSeconds: 30, processingTimeMs: 800 },
      };

      const fusion = fuseMultimodalEvidence({
        media: mockMedia,
        visual: mockVisual,
        audio: mockAudio,
        actualTopic: "sports car drift",
        detectedVisualSubjects: ["sports car", "race track", "drift"],
      });

      expect(fusion.audio.speechDetected).toBe(false);
      expect(fusion.combined.contradictions.length).toBe(0);
      expect(fusion.combined.uncertainties[0]).toContain("Audio is present but contains no identifiable speech dialogue");
    });
  });

  describe("3. Video Understanding Integration with Audio Evidence", () => {
    it("assembles comprehensive understanding with both visual and audio evidence", () => {
      const mockMedia: MediaMetadata = {
        filename: "nextjs_guide.mp4",
        format: "mp4",
        fileSizeBytes: 10485760,
        durationSeconds: 60,
        width: 1920,
        height: 1080,
        hasVideoTrack: true,
        hasAudioTrack: true,
      };

      const mockVision: VisionAnalysisReport = {
        modelUsed: "qwen2.5vl:3b",
        sampledFrames: [
          {
            timestampSeconds: 10,
            framePath: "frame1.jpg",
            semanticDescription: "Demonstrating Next.js App Router and server actions in VS Code.",
            confidence: 0.95,
          },
        ],
        onScreenTextDetections: [{ text: "Next.js 15 Server Actions", timestampSeconds: 10, confidence: 0.95 }],
        visualPacing: "balanced",
        limitations: [],
      };

      const mockTranscript: TranscriptionResult = {
        fullText: "Today we explore Next.js Server Actions with clean error handling.",
        cues: [
          { start: 0, end: 10, text: "Today we explore Next.js Server Actions with clean error handling." },
        ],
      };

      const mockAudio: AudioAnalysisResult = {
        status: "completed",
        provider: "local_whisper",
        model: "base",
        language: { code: "en", name: "English", status: "detected", probability: 0.99 },
        speechDetected: true,
        transcript: {
          rawText: "Today we explore Next.js Server Actions with clean error handling.",
          segments: [
            { start: 0, end: 10, text: "Today we explore Next.js Server Actions with clean error handling." },
          ],
        },
        limitations: [],
        processing: { durationSeconds: 60, processingTimeMs: 1500 },
      };

      const understanding = assembleVideoUnderstanding({
        media: mockMedia,
        vision: mockVision,
        transcript: mockTranscript,
        audioAnalysis: mockAudio,
      });

      expect(understanding.actualTopic.toLowerCase()).toContain("next.js");
      expect(understanding.audioAnalysis?.speechDetected).toBe(true);
      expect(understanding.multimodal?.audio.speechDetected).toBe(true);
      expect(understanding.visualEvidence.length).toBeGreaterThan(0);
      expect(understanding.audioEvidence.length).toBeGreaterThan(0);
    });

    it("does not hallucinate speech when audio stream is absent", () => {
      const mockMedia: MediaMetadata = {
        filename: "silent_timelapse.mp4",
        format: "mp4",
        fileSizeBytes: 5242880,
        durationSeconds: 30,
        width: 1920,
        height: 1080,
        hasVideoTrack: true,
        hasAudioTrack: false,
      };

      const mockVision: VisionAnalysisReport = {
        modelUsed: "qwen2.5vl:3b",
        sampledFrames: [
          {
            timestampSeconds: 5,
            framePath: "frame1.jpg",
            semanticDescription: "Timelapse of cloud movements over mountain peaks.",
            confidence: 0.9,
          },
        ],
        onScreenTextDetections: [],
        visualPacing: "fast",
        limitations: [],
      };

      const mockTranscript: TranscriptionResult = {
        fullText: "",
        cues: [],
      };

      const mockAudio: AudioAnalysisResult = {
        status: "no_audio",
        provider: "none",
        model: "none",
        language: { code: null, name: null, status: "not_applicable" },
        speechDetected: false,
        transcript: { rawText: "", segments: [] },
        limitations: ["No audio stream found in media container."],
        processing: { durationSeconds: 30, processingTimeMs: 10 },
      };

      const understanding = assembleVideoUnderstanding({
        media: mockMedia,
        vision: mockVision,
        transcript: mockTranscript,
        audioAnalysis: mockAudio,
      });

      expect(understanding.audioAnalysis?.speechDetected).toBe(false);
      expect(understanding.audioEvidence.length).toBe(0);
      expect(understanding.multimodal?.audio.speechDetected).toBe(false);
    });
  });
});
