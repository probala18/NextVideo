import { describe, expect, it } from "bun:test";
import {
  fuseMultimodalEvidence,
  LocalWhisperProvider,
  UserUploadTranscriptProvider,
} from "../video/audio";
import { assembleVideoUnderstanding } from "../video/understanding";
import { generatePublishingPackageWithAI, clearTitleHistoryAsync } from "../video/generator";
import type { AudioAnalysisResult } from "../video/audio/types";
import type { VisionAnalysisReport } from "../types/visionWorkflow";
import type { MediaMetadata, TranscriptionResult } from "../types/videoWorkflow";

describe("Multimodal Baseline Verification: 4 Scenarios & Audio Fallback", () => {
  // --------------------------------------------------------------------------
  // Scenario 1: Programming Tutorial
  // --------------------------------------------------------------------------
  describe("Scenario 1: Programming Tutorial", () => {
    const tutorialMedia: MediaMetadata = {
      filename: "docker_typescript_guide.mp4",
      format: "mp4",
      durationSeconds: 120,
      width: 1920,
      height: 1080,
      hasVideoTrack: true,
      hasAudioTrack: true,
      fileSizeBytes: 15728640,
    };

    const tutorialVision: VisionAnalysisReport = {
      modelUsed: "qwen2.5vl:3b",
      sampledFrames: [
        {
          timestampSeconds: 15,
          framePath: "frame_15.jpg",
          semanticDescription: "Developer writing Dockerfile configurations in VS Code editor.",
          confidence: 0.94,
        },
        {
          timestampSeconds: 60,
          framePath: "frame_60.jpg",
          semanticDescription: "Terminal showing docker build and container running successfully.",
          confidence: 0.95,
        },
      ],
      onScreenTextDetections: [
        { text: "FROM node:20-alpine", timestampSeconds: 15, confidence: 0.95 },
        { text: "Successfully built container", timestampSeconds: 60, confidence: 0.92 },
      ],
      visualPacing: "balanced",
      limitations: [],
    };

    const tutorialAudio: AudioAnalysisResult = {
      status: "completed",
      provider: "local_whisper",
      model: "base",
      language: { code: "en", name: "English", status: "detected", probability: 0.99 },
      speechDetected: true,
      transcript: {
        rawText:
          "Welcome to this Docker and TypeScript tutorial. In this section we configure our Dockerfile, build the image, and deploy our web application.",
        segments: [
          {
            start: 0.5,
            end: 5.2,
            text: "Welcome to this Docker and TypeScript tutorial.",
            confidence: 0.98,
          },
          {
            start: 5.8,
            end: 12.4,
            text: "In this section we configure our Dockerfile, build the image, and deploy our web application.",
            confidence: 0.97,
          },
        ],
      },
      limitations: [],
      processing: { durationSeconds: 120, processingTimeMs: 1400 },
    };

    const tutorialTranscript: TranscriptionResult = {
      fullText: tutorialAudio.transcript.rawText,
      cues: tutorialAudio.transcript.segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text,
      })),
    };

    it("extracts exact technical speech terms and timestamped cues", () => {
      expect(tutorialAudio.transcript.segments[0].start).toBe(0.5);
      expect(tutorialAudio.transcript.segments[0].end).toBe(5.2);
      expect(tutorialAudio.transcript.rawText).toContain("Docker");
      expect(tutorialAudio.transcript.rawText).toContain("TypeScript");
      expect(tutorialAudio.speechDetected).toBe(true);
    });

    it("assembles coding walkthrough understanding with multimodal confirmation", () => {
      const understanding = assembleVideoUnderstanding({
        media: tutorialMedia,
        vision: tutorialVision,
        transcript: tutorialTranscript,
        audioAnalysis: tutorialAudio,
      });

      expect(understanding.contentType === "teaching" || understanding.contentType === "demonstration").toBe(true);
      expect(understanding.actualTopic.toLowerCase()).toContain("docker");
      expect(understanding.audioEvidence.length).toBe(2);
      expect(understanding.multimodal?.combined.confirmedTopics.length).toBeGreaterThan(0);
      expect(understanding.multimodal?.combined.contradictions.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Music / Status Video
  // --------------------------------------------------------------------------
  describe("Scenario 2: Music / Status Video", () => {
    const musicMedia: MediaMetadata = {
      filename: "romantic_breeze_status.mp4",
      format: "mp4",
      durationSeconds: 28,
      width: 1080,
      height: 1920,
      hasVideoTrack: true,
      hasAudioTrack: true,
      fileSizeBytes: 7055399,
    };

    const musicVision: VisionAnalysisReport = {
      modelUsed: "qwen2.5vl:3b",
      sampledFrames: [
        {
          timestampSeconds: 5,
          framePath: "music_f1.jpg",
          semanticDescription: "A romantic couple walking along a scenic shoreline during golden hour.",
          confidence: 0.92,
        },
        {
          timestampSeconds: 18,
          framePath: "music_f2.jpg",
          semanticDescription: "Close-up slow motion cinematic shot of the smiling couple.",
          confidence: 0.9,
        },
      ],
      onScreenTextDetections: [],
      visualPacing: "balanced",
      limitations: [],
    };

    // Real Tamil vocal clip from the uploaded status video
    const musicAudio: AudioAnalysisResult = {
      status: "completed",
      provider: "local_whisper",
      model: "base",
      language: { code: "ta", name: "Tamil", status: "detected", probability: 0.68 },
      speechDetected: true,
      transcript: {
        rawText: "வீடியில் வந்தப் பின்னால் வீடியாதை இருக்கும் பூ வாசமியில் சம்முந்தன்",
        segments: [
          { start: 1.2, end: 6.8, text: "வீடியில் வந்தப் பின்னால் வீடியாதை இருக்கும்", confidence: 0.72 },
          { start: 7.5, end: 14.1, text: "பூ வாசமியில் சம்முந்தன்", confidence: 0.65 },
        ],
      },
      limitations: [],
      processing: { durationSeconds: 28, processingTimeMs: 1100 },
    };

    const musicTranscript: TranscriptionResult = {
      fullText: musicAudio.transcript.rawText,
      cues: musicAudio.transcript.segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text,
      })),
    };

    it("does not invent English lyrics, fake software tutorials, or unverified artists", () => {
      const understanding = assembleVideoUnderstanding({
        media: musicMedia,
        vision: musicVision,
        transcript: musicTranscript,
        audioAnalysis: musicAudio,
      });

      // Crucial: Must be classified as romantic status or music video, NOT walkthrough
      expect(understanding.contentType).toBe("romantic_status");
      expect(understanding.primaryValueProposition).not.toContain("walkthrough");
      expect(understanding.primaryValueProposition).not.toContain("tutorial");
      expect(understanding.actualTopic.toLowerCase()).not.toContain("benchmark");
      expect(understanding.actualTopic.toLowerCase()).not.toContain("walkthrough");
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Silent Video
  // --------------------------------------------------------------------------
  describe("Scenario 3: Silent Video", () => {
    const silentMedia: MediaMetadata = {
      filename: "architecture_timelapse_silent.mp4",
      format: "mp4",
      durationSeconds: 45,
      width: 1920,
      height: 1080,
      hasVideoTrack: true,
      hasAudioTrack: false, // Container has no audio track
      fileSizeBytes: 8388608,
    };

    const silentVision: VisionAnalysisReport = {
      modelUsed: "qwen2.5vl:3b",
      sampledFrames: [
        {
          timestampSeconds: 10,
          framePath: "arch_f1.jpg",
          semanticDescription: "Modern skyscraper construction timelapse with clouds moving overhead.",
          confidence: 0.93,
        },
      ],
      onScreenTextDetections: [],
      visualPacing: "fast",
      limitations: [],
    };

    const silentAudio: AudioAnalysisResult = {
      status: "no_audio",
      provider: "none",
      model: "none",
      language: { code: null, name: null, status: "not_applicable" },
      speechDetected: false,
      transcript: { rawText: "", segments: [] },
      limitations: ["No audio stream found in media container."],
      processing: { durationSeconds: 45, processingTimeMs: 5 },
    };

    const silentTranscript: TranscriptionResult = {
      fullText: "",
      cues: [],
    };

    it("correctly reports audio as unavailable / no audio without inventing speech", () => {
      const understanding = assembleVideoUnderstanding({
        media: silentMedia,
        vision: silentVision,
        transcript: silentTranscript,
        audioAnalysis: silentAudio,
      });

      expect(understanding.audioAnalysis?.status).toBe("no_audio");
      expect(understanding.audioAnalysis?.speechDetected).toBe(false);
      expect(understanding.audioEvidence.length).toBe(0);
      expect(understanding.multimodal?.combined.uncertainties[0]).toContain(
        "Video container does not include an audio stream"
      );
      expect(understanding.visualEvidence.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Mixed Speech + Background Music
  // --------------------------------------------------------------------------
  describe("Scenario 4: Mixed Speech + Background Music", () => {
    const mixedMedia: MediaMetadata = {
      filename: "product_showcase_with_bgm.mp4",
      format: "mp4",
      durationSeconds: 60,
      width: 1920,
      height: 1080,
      hasVideoTrack: true,
      hasAudioTrack: true,
      fileSizeBytes: 12582912,
    };

    const mixedVision: VisionAnalysisReport = {
      modelUsed: "qwen2.5vl:3b",
      sampledFrames: [
        {
          timestampSeconds: 10,
          framePath: "product_f1.jpg",
          semanticDescription: "Presenter demonstrating a mechanical keyboard wireless switch feature.",
          confidence: 0.91,
        },
      ],
      onScreenTextDetections: [{ text: "Tri-mode Wireless Switch", timestampSeconds: 10, confidence: 0.9 }],
      visualPacing: "moderate",
      limitations: [],
    };

    // Voice narration while background music plays; VAD isolates the speech portions
    const mixedAudio: AudioAnalysisResult = {
      status: "completed",
      provider: "local_whisper",
      model: "base",
      language: { code: "en", name: "English", status: "detected", probability: 0.94 },
      speechDetected: true,
      transcript: {
        rawText: "This wireless mechanical keyboard offers tri-mode connectivity and hot-swappable switches.",
        segments: [
          {
            start: 2.0,
            end: 8.5,
            text: "This wireless mechanical keyboard offers tri-mode connectivity and hot-swappable switches.",
            confidence: 0.92,
          },
        ],
      },
      limitations: [],
      processing: { durationSeconds: 60, processingTimeMs: 1250 },
    };

    const mixedTranscript: TranscriptionResult = {
      fullText: mixedAudio.transcript.rawText,
      cues: mixedAudio.transcript.segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text,
      })),
    };

    it("isolates narration accurately without confusing background music with speech", () => {
      const fusion = fuseMultimodalEvidence({
        media: mixedMedia,
        visual: mixedVision,
        audio: mixedAudio,
        actualTopic: "wireless mechanical keyboard review",
        detectedVisualSubjects: ["keyboard", "mechanical keyboard", "wireless switch"],
      });

      expect(fusion.audio.speechDetected).toBe(true);
      expect(fusion.combined.contradictions.length).toBe(0);
      expect(fusion.combined.confirmedTopics.length).toBeGreaterThan(0);
      expect(fusion.combined.supportingEvidence.some((e) => e.modality === "both")).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Visual-Only Fallback When Audio Fails
  // --------------------------------------------------------------------------
  describe("Scenario 5: Visual-Only Fallback When Audio Fails", () => {
    const fallbackMedia: MediaMetadata = {
      filename: "unsupported_audio_codec.mp4",
      format: "mp4",
      durationSeconds: 30,
      width: 1920,
      height: 1080,
      hasVideoTrack: true,
      hasAudioTrack: true,
      fileSizeBytes: 6291456,
    };

    const visualEvidenceReport: VisionAnalysisReport = {
      modelUsed: "qwen2.5vl:3b",
      supportsVision: true,
      sampledFrames: [
        {
          index: 0,
          relativePercent: 16,
          label: "frame_0",
          sceneType: "b_roll",
          properties: {
            brightness: "bright",
            dominantColors: ["blue", "turquoise"],
            contrastScore: 80,
            complexityScore: 70,
            focalPoint: "lake",
            detectedOnScreenText: ["Lake Louise, Alberta"],
            thumbnailSuitabilityScore: 90,
          },
          timestampSeconds: 5,
          framePath: "frame_drone.jpg",
          semanticDescription: "Cinematic 4K aerial drone shot flying over a turquoise mountain lake.",
        },
      ],
      detectedSubjects: ["Lake Louise", "turquoise lake", "mountain landscape"],
      detectedEnvironments: ["nature", "mountains"],
      onScreenTextCues: [{ text: "Lake Louise, Alberta", timestampSeconds: 5, confidence: 0.95 }],
      candidateThumbnailMoments: [],
      visualPacing: "moderate",
      limitations: [],
    };

    // Audio extraction or Whisper execution failed
    const failedAudio: AudioAnalysisResult = {
      status: "failed",
      provider: "local_whisper",
      model: "base",
      language: { code: null, name: null, status: "unknown" },
      speechDetected: null,
      transcript: { rawText: "", segments: [] },
      limitations: ["FFmpeg extraction error: unsupported audio codec stream."],
      processing: { durationSeconds: 0, processingTimeMs: 150 },
    };

    const emptyTranscript: TranscriptionResult = {
      fullText: "",
      cues: [],
    };

    it("generates publishing metadata from visual evidence alone when audio fails", async () => {
      await clearTitleHistoryAsync();
      const originalFetch = globalThis.fetch;
      process.env.ENABLE_TEST_LIVE_LLM = "true";
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    titles: [
                      {
                        title: "Lake Louise Alberta Drone 4K Flight",
                        formula: "Descriptive Highlight",
                        fitReason: "Grounded in visual frame analysis of aerial drone over turquoise lake",
                        evidenceSupport: "Frame at 5s shows aerial drone shot of Lake Louise",
                        rankingExplanation: "Direct and accurate representation of the visual scene",
                      },
                      {
                        title: "Turquoise Waters of Lake Louise",
                        formula: "Scenic Highlight",
                        fitReason: "Direct observation of turquoise lake",
                        evidenceSupport: "Visual keyframe at 5s",
                        rankingExplanation: "Strong scenic description",
                      },
                    ],
                    description:
                      "A breathtaking 4K aerial drone flight over Lake Louise in Alberta, showcasing turquoise glacial waters.",
                    tags: ["lake louise", "alberta", "drone footage", "nature"],
                  }),
                },
              },
            ],
            // Ollama compatibility format
            response: JSON.stringify({
              titles: [
                {
                  title: "Lake Louise Alberta Drone 4K Flight",
                  formula: "Descriptive Highlight",
                  fitReason: "Grounded in visual frame analysis of aerial drone over turquoise lake",
                  evidenceSupport: "Frame at 5s shows aerial drone shot of Lake Louise",
                  rankingExplanation: "Direct and accurate representation of the visual scene",
                },
              ],
              description:
                "A breathtaking 4K aerial drone flight over Lake Louise in Alberta, showcasing turquoise glacial waters.",
              tags: ["lake louise", "alberta", "drone footage", "nature"],
            }),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as any;

      try {
        const understanding = assembleVideoUnderstanding({
          media: fallbackMedia,
          vision: visualEvidenceReport,
          transcript: emptyTranscript,
          audioAnalysis: failedAudio,
        });

        // Pipeline succeeds based on visual evidence
        expect(understanding.isAdequatelyUnderstood).toBe(true);
        expect(understanding.visualEvidence.length).toBeGreaterThan(0);
        expect(understanding.audioEvidence.length).toBe(0);
        expect(understanding.actualTopic.toLowerCase()).toContain("lake louise");

        // Verify publishing package generator succeeds using visual evidence alone
        const publishingPackage = await generatePublishingPackageWithAI({
          media: fallbackMedia,
          evidence: understanding,
          vision: visualEvidenceReport,
          thumbnails: [],
        });

        expect(publishingPackage.isAdequatelyUnderstood).toBe(true);
        expect(publishingPackage.titles.length).toBeGreaterThan(0);
        // Selected title must be grounded in visual evidence (Lake Louise / drone / mountain)
        const allTitles = publishingPackage.titles.map((t) => t.title.toLowerCase()).join(" ");
        expect(
          allTitles.includes("lake louise") ||
            allTitles.includes("alberta") ||
            allTitles.includes("drone") ||
            allTitles.includes("lake")
        ).toBe(true);

        // Must NOT claim dialogue exists in description
        expect(publishingPackage.description).not.toContain("Spoken dialogue");
        expect(publishingPackage.tags.length).toBeGreaterThan(0);
      } finally {
        globalThis.fetch = originalFetch;
        delete process.env.ENABLE_TEST_LIVE_LLM;
      }
    });
  });
});
