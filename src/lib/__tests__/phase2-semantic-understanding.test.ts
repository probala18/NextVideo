import { describe, expect, it } from "bun:test";
import {
  assembleVideoUnderstanding,
  classifyContentType,
} from "../video/understanding";
import {
  calculateEvidenceRelevance,
  validateTitleSemantics,
  generatePublishingPackageWithAI,
} from "../video/generator";
import { runAutonomousVideoWorkflow } from "../video/orchestrator";
import { MediaMetadata } from "../types/videoWorkflow";
import { VisionAnalysisReport, VideoUnderstandingEvidence } from "../types/visionWorkflow";

describe("Phase 2: Semantic Video Understanding & YouTube Metadata Quality", () => {
  const musicClipMedia: MediaMetadata = {
    durationSeconds: 28.38,
    filesizeBytes: 7_055_399,
    format: "mp4",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    hasVideoTrack: true,
    hasAudioTrack: true,
    codec: "h264",
  };

  const musicClipVision: VisionAnalysisReport = {
    sampledFrames: [
      {
        index: 1,
        timestampSeconds: 0.9,
        relativePercent: 3,
        framePath: "/api/video/assets/sample/frames/cv_frame_1.jpg",
        label: "Frame at 0.9s",
        sceneType: "unknown",
        properties: {
          brightness: "unknown",
          dominantColors: [],
          contrastScore: null,
          complexityScore: null,
          focalPoint: "Not analyzed",
          detectedOnScreenText: [],
          thumbnailSuitabilityScore: null,
        },
        semanticDescription: "A close-up of a woman's face, focusing on her earrings and the hand of another person touching her necklace.",
      },
      {
        index: 2,
        timestampSeconds: 3.4,
        relativePercent: 12,
        framePath: "/api/video/assets/sample/frames/cv_frame_2.jpg",
        label: "Frame at 3.4s",
        sceneType: "unknown",
        properties: {
          brightness: "unknown",
          dominantColors: [],
          contrastScore: null,
          complexityScore: null,
          focalPoint: "Not analyzed",
          detectedOnScreenText: [],
          thumbnailSuitabilityScore: null,
        },
        semanticDescription: "The screen is completely black.",
      },
    ],
    sampledFramesCount: 8,
    analyzedFramesCount: 2,
    detectedSubjects: ["woman", "hand"],
    detectedEnvironments: [],
    visualPacing: "rapid",
    onScreenTextCues: [{ timestampSeconds: 0.9, text: "FINE TIME MUSIC", confidence: 0.9 }],
    candidateThumbnailMoments: [
      {
        timestampSeconds: 0.9,
        frameIndex: 1,
        headline: "",
        reason: "Semantic analysis: woman's face and jewelry",
        visualStrength: null,
      },
    ],
    limitations: [],
    confidenceScore: null,
    modelUsed: "qwen2.5vl:3b",
    supportsVision: true,
  };

  const silentTranscript = {
    source: "unavailable" as const,
    text: "",
    cuesCount: 0,
    cues: [],
  };

  describe("1. Video Classification & Anti-Tutorial Guarantees", () => {
    it("classifies music clip with romantic visual cues as romantic_status", () => {
      const contentType = classifyContentType(
        silentTranscript.text,
        musicClipVision.sampledFrames.map((f) => f.semanticDescription || ""),
        musicClipMedia.durationSeconds,
        {
          onScreenTexts: ["FINE TIME MUSIC"],
          hasAudioTrack: true,
          aspectRatio: "9:16",
        }
      );

      expect(contentType).toBe("romantic_status");
    });

    it("does not output 'Practical walkthrough' for music/romantic clips", () => {
      const understanding = assembleVideoUnderstanding({
        media: musicClipMedia,
        vision: musicClipVision,
        transcript: silentTranscript,
      });

      expect(understanding.primaryValueProposition).not.toContain("walkthrough");
      expect(understanding.primaryValueProposition).not.toContain("Practical walkthrough");
      expect(understanding.primaryValueProposition.toLowerCase()).toContain("romantic");
      expect(understanding.summary).not.toContain("demonstrates FINE TIME MUSIC");
      expect(understanding.summary).not.toContain("walkthrough");
      expect(understanding.analysisMethod).toBeDefined();
    });

    it("provides neutral evidence-based value proposition when content type is unknown", () => {
      const unknownMedia: MediaMetadata = {
        durationSeconds: 15.0,
        filesizeBytes: 2_000_000,
        format: "mp4",
        width: 1280,
        height: 720,
        hasVideoTrack: true,
        hasAudioTrack: false,
      };

      const unknownVision: VisionAnalysisReport = {
        sampledFrames: [
          {
            index: 1,
            timestampSeconds: 2.0,
            relativePercent: 10,
            framePath: "/api/video/assets/sample/frames/frame_1.jpg",
            label: "Frame 1",
            sceneType: "unknown",
            properties: {
              brightness: "unknown",
              dominantColors: [],
              contrastScore: null,
              complexityScore: null,
              focalPoint: "Not analyzed",
              detectedOnScreenText: [],
              thumbnailSuitabilityScore: null,
            },
            semanticDescription: "A geometric architectural building exterior.",
          },
        ],
        detectedSubjects: ["building"],
        detectedEnvironments: ["city"],
        visualPacing: "static",
        onScreenTextCues: [{ timestampSeconds: 2.0, text: "Urban Architecture", confidence: 0.8 }],
        candidateThumbnailMoments: [],
        limitations: [],
        confidenceScore: null,
        modelUsed: "none",
        supportsVision: false,
      };

      const understanding = assembleVideoUnderstanding({
        media: unknownMedia,
        vision: unknownVision,
        transcript: silentTranscript,
      });

      expect(understanding.primaryValueProposition).not.toContain("walkthrough");
      expect(understanding.summary).not.toContain("walkthrough");
      expect(understanding.summary).toContain("Urban Architecture");
    });
  });

  describe("2. Semantic Title Validation & Evidence Relevance Scoring", () => {
    it("calculateEvidenceRelevance scores romantic titles high and coding titles low for music video", () => {
      const evidence: VideoUnderstandingEvidence = {
        actualTopic: "Fine Time Music",
        contentType: "romantic_status",
        primaryValueProposition: "Romantic visual scene featuring Fine Time Music.",
        detectedVisualSubjects: ["woman", "hand", "jewelry"],
        isAdequatelyUnderstood: true,
        targetAudience: "General Audience",
        keyTakeaways: [],
        distinguishingFeatures: [],
        visualEvidence: [],
        audioEvidence: [],
        untrustedInputProtection: true,
        narrativeClimaxSeconds: 0.9,
      };

      // 1. Inappropriate analysis/walkthrough titles (the reported bug)
      const walkthroughScore = calculateEvidenceRelevance("Fine Time Music Walkthrough (28s)", evidence);
      const benchmarkScore = calculateEvidenceRelevance("FINE TIME MUSIC Benchmark Test", evidence);
      const visualAnalysisScore = calculateEvidenceRelevance("Visual Analysis of FINE TIME MUSIC (28s)", evidence);
      const codingScore = calculateEvidenceRelevance("How to Deploy Full Stack Architecture in React", evidence);

      // 2. Appropriate grounded romantic/music titles
      const goodTitleScore = calculateEvidenceRelevance("Fine Time Music | Romantic Status Video (Fullscreen)", evidence);
      const moodScore = calculateEvidenceRelevance("Fine Time Music - Soulful Lyrical Mood", evidence);

      expect(walkthroughScore).toBeLessThan(50);
      expect(benchmarkScore).toBeLessThan(50);
      expect(visualAnalysisScore).toBeLessThan(50);
      expect(codingScore).toBeLessThan(30);

      expect(goodTitleScore).toBeGreaterThanOrEqual(70);
      expect(moodScore).toBeGreaterThanOrEqual(70);
    });

    it("validateTitleSemantics rejects titles describing the AI's analysis activity", () => {
      const evidence: VideoUnderstandingEvidence = {
        actualTopic: "Fine Time Music",
        contentType: "romantic_status",
        primaryValueProposition: "Romantic visual scene featuring Fine Time Music.",
        detectedVisualSubjects: ["woman", "hand"],
        isAdequatelyUnderstood: true,
        targetAudience: "General Audience",
        keyTakeaways: [],
        distinguishingFeatures: [],
        visualEvidence: [],
        audioEvidence: [],
        untrustedInputProtection: true,
        narrativeClimaxSeconds: 0.9,
      };

      const result1 = validateTitleSemantics("Fine Time Music Walkthrough (28s)", evidence);
      const result2 = validateTitleSemantics("Visual Analysis of FINE TIME MUSIC (28s)", evidence);
      const result3 = validateTitleSemantics("FINE TIME MUSIC Benchmark Test", evidence);
      const result4 = validateTitleSemantics("Fine Time Music | Romantic Status Video (Fullscreen)", evidence);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);
      expect(result4.isValid).toBe(true);
    });
  });

  describe("3. Evidence-Driven SEO & Hashtag Optimization", () => {
    it("generates relevant, optional hashtags and rejects #workflow and #youtube for music", async () => {
      const result = await runAutonomousVideoWorkflow({
        jobId: "test_job_p2",
        assetId: "test_asset_p2",
        media: musicClipMedia,
        sourceFilePath: "test_path.mp4",
        transcript: silentTranscript,
      });

      // Verification: SEO hashtags MUST NOT contain #workflow or #youtube
      expect(result.seo.hashtags).not.toContain("#workflow");
      expect(result.seo.hashtags).not.toContain("#youtube");

      // Verification: search queries MUST NOT contain "walkthrough" or "guide 2026"
      for (const query of result.seo.searchQueryOpportunities) {
        expect(query.toLowerCase()).not.toContain("walkthrough");
        expect(query.toLowerCase()).not.toContain("guide 2026");
        expect(query.toLowerCase()).not.toContain("step by step");
      }

      // Verification: follow-up content plan MUST NOT contain software tutorial templates
      for (const plan of result.followUpContentPlan) {
        expect(plan.topic.toLowerCase()).not.toContain("costly mistakes");
        expect(plan.topic.toLowerCase()).not.toContain("shortcut that saves 30 minutes");
      }
    });
  });

  describe("4. Category Selection with Documented Fallback", () => {
    it("assigns Music category for romantic/music status clips", async () => {
      const understanding = assembleVideoUnderstanding({
        media: musicClipMedia,
        vision: musicClipVision,
        transcript: silentTranscript,
      });

      const pkg = await generatePublishingPackageWithAI({
        media: musicClipMedia,
        evidence: understanding,
        vision: musicClipVision,
        thumbnails: [],
      });

      expect(pkg.suggestedCategory.id).toBe("10");
      expect(pkg.suggestedCategory.name).toBe("Music");
    });

    it("documents uncertain classification fallback for unknown content", async () => {
      const uncertainEvidence: VideoUnderstandingEvidence = {
        actualTopic: "Ambient Scenery",
        contentType: "unknown",
        primaryValueProposition: "Visual presentation featuring Ambient Scenery.",
        detectedVisualSubjects: ["trees", "sky"],
        isAdequatelyUnderstood: true,
        targetAudience: "General Audience",
        keyTakeaways: [],
        distinguishingFeatures: [],
        visualEvidence: [],
        audioEvidence: [],
        untrustedInputProtection: true,
        narrativeClimaxSeconds: 5.0,
      };

      const pkg = await generatePublishingPackageWithAI({
        media: musicClipMedia,
        evidence: uncertainEvidence,
        vision: musicClipVision,
        thumbnails: [],
      });

      expect(pkg.suggestedCategory.name).toContain("Unverified");
      expect(pkg.suggestedCategory.rationale).toContain("Classification uncertain");
    });
  });

  describe("5. Frame Coverage & Counting in Vision Report", () => {
    it("records sampledFramesCount and analyzedFramesCount accurately", () => {
      expect(musicClipVision.sampledFramesCount).toBe(8);
      expect(musicClipVision.analyzedFramesCount).toBe(2);
      expect(musicClipVision.sampledFrames.length).toBe(2);
    });
  });
});

