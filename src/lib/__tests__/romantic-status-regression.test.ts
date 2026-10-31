import { describe, expect, it } from "bun:test";
import { assembleVideoUnderstanding, classifyContentType } from "../video/understanding";
import {
  generatePublishingPackageWithAI,
  buildCategoryFallbackTitles,
  calculateEvidenceRelevance,
} from "../video/generator";
import { YouTubePatternModel } from "../models/youtube-pattern-model";
import { MediaMetadata } from "../types/videoWorkflow";
import { VisionAnalysisReport } from "../types/visionWorkflow";

describe("Romantic Status Video Pipeline & Evidence Relevance (Regression Tests)", () => {
  // Fixture representing the exact uploaded clip: Santhana Thendralai Enna Solla Pogirai
  const mockMedia: MediaMetadata = {
    durationSeconds: 32.5,
    filesizeBytes: 8_500_000,
    format: "mp4",
    width: 1080,
    height: 1920, // 9:16 vertical fullscreen status video
    aspectRatio: "9:16",
    hasVideoTrack: true,
    hasAudioTrack: true,
  };

  const mockVision: VisionAnalysisReport = {
    sampledFrames: [
      {
        index: 1,
        timestampSeconds: 5.0,
        relativePercent: 15,
        framePath: "/api/video/assets/asset_status_1/frames/frame_1.jpg",
        label: "Aesthetic romantic visual scene",
        sceneType: "action_demo",
        properties: {
          palette: ["#F43F5E", "#1E293B"],
          contrastRatio: 4.8,
          focalPoint: "Aesthetic couple in nature with soft lighting",
          hasFaces: true,
          detectedOnScreenText: ["Santhana Thendralai"],
          thumbnailSuitabilityScore: 92,
        },
        semanticDescription: "Cinematic romantic visual presentation with soft natural lighting and on-screen lyrical title 'Santhana Thendralai'.",
      },
      {
        index: 2,
        timestampSeconds: 18.0,
        relativePercent: 55,
        framePath: "/api/video/assets/asset_status_1/frames/frame_2.jpg",
        label: "Melodic chorus visual climax",
        sceneType: "action_demo",
        properties: {
          palette: ["#EC4899", "#0F172A"],
          contrastRatio: 5.1,
          focalPoint: "Emotional aesthetic frame with bokeh lighting",
          hasFaces: true,
          detectedOnScreenText: ["Enna Solla Pogirai"],
          thumbnailSuitabilityScore: 95,
        },
        semanticDescription: "Expressive lyrical scene featuring emotive visual pacing and on-screen subtitle 'Enna Solla Pogirai'.",
      },
    ],
    onScreenTextCues: [
      { timestampSeconds: 5.0, text: "Santhana Thendralai", confidence: 0.9 },
      { timestampSeconds: 18.0, text: "Enna Solla Pogirai", confidence: 0.9 },
    ],
    visualPacing: "moderate",
    candidateThumbnailMoments: [
      {
        timestampSeconds: 18.0,
        frameIndex: 2,
        headline: "LOVE STATUS",
        reason: "Highest scoring emotional aesthetic visual scene.",
        visualStrength: 95,
      },
    ],
    limitations: [],
    confidenceScore: 94,
    modelUsed: "custom (qwen2.5vl:3b)",
    supportsVision: true,
  };

  const mockTranscript = {
    source: "whisper_api" as const,
    text: "[Music] ♪ Santhana Thendralai ♪ [Singing] ♪ Enna Solla Pogirai ♪",
    cues: [
      { start: 0.0, end: 8.0, text: "[Music] ♪ Melodic instrumental introduction ♪" },
      { start: 8.1, end: 18.0, text: "♪ Santhana thendralai enna solla pogirai ♪" },
      { start: 18.1, end: 32.0, text: "[Music] ♪ Soulful flute and violin cadence ♪" },
    ],
  };

  it("1. Classifies clip as romantic_status and removes universal tech defaults", () => {
    const contentType = classifyContentType(
      mockTranscript.text,
      mockVision.sampledFrames.map((f) => f.semanticDescription || ""),
      mockMedia.durationSeconds,
      { onScreenTexts: ["Santhana Thendralai", "Enna Solla Pogirai"] }
    );

    expect(contentType).toBe("romantic_status");

    const understanding = assembleVideoUnderstanding({
      media: mockMedia,
      vision: mockVision,
      transcript: mockTranscript,
      creatorHintTopic: "Santhana Thendralai Enna Solla Pogirai",
    });

    expect(understanding.contentType).toBe("romantic_status");
    expect(understanding.targetAudience).not.toContain("Builders");
    expect(understanding.targetAudience).not.toContain("Developers");
    expect(understanding.targetAudience).toContain("Music Lovers");
    expect(understanding.actualTopic).toContain("Santhana Thendralai");
  });

  it("2. Does NOT invent song lyrics, singers, or film credits absent from evidence", () => {
    const understanding = assembleVideoUnderstanding({
      media: mockMedia,
      vision: mockVision,
      transcript: mockTranscript,
      creatorHintTopic: "Santhana Thendralai Enna Solla Pogirai",
    });

    const combinedReportText = `${understanding.summary} ${understanding.primaryValueProposition} ${(understanding.keyTakeaways || []).join(" ")}`;

    // Must not hallucinate artist credits not present in the media stream
    expect(combinedReportText).not.toContain("A.R. Rahman");
    expect(combinedReportText).not.toContain("Hariharan");
    expect(combinedReportText).not.toContain("Kandukondain Kandukondain");
    expect(combinedReportText).not.toContain("Shankar Mahadevan");
  });

  it("3. Replaces tutorial templates with romantic status options and avoids #tutorial", async () => {
    const understanding = assembleVideoUnderstanding({
      media: mockMedia,
      vision: mockVision,
      transcript: mockTranscript,
      creatorHintTopic: "Santhana Thendralai Enna Solla Pogirai",
    });

    const fallbackTitles = buildCategoryFallbackTitles(understanding.actualTopic, understanding.contentType);
    expect(fallbackTitles.length).toBe(5);

    for (const option of fallbackTitles) {
      expect(option.title.length).toBeLessThanOrEqual(100);
      expect(option.title.toLowerCase()).not.toContain("how to build");
      expect(option.title.toLowerCase()).not.toContain("architecture");
      expect(option.title.toLowerCase()).not.toContain("implementation");
    }

    const pkg = await generatePublishingPackageWithAI({
      media: mockMedia,
      evidence: understanding,
      vision: mockVision,
      thumbnails: [],
    });

    expect(pkg.titles.length).toBe(5);
    expect(pkg.description).not.toContain("#tutorial");
    expect(pkg.tags).not.toContain("tutorial");
    expect(pkg.suggestedCategory.name).toBe("Music");
    expect(pkg.suggestedCategory.id).toBe("10");
  });

  it("4. Evaluates evidence-based relevance: rejects coding tutorial titles for romantic status", () => {
    const understanding = assembleVideoUnderstanding({
      media: mockMedia,
      vision: mockVision,
      transcript: mockTranscript,
      creatorHintTopic: "Santhana Thendralai Enna Solla Pogirai",
    });

    // Irrelevant coding tutorial title
    const codingTitle = "How to Build Next.js Full Stack Architecture (Step by Step)";
    const codingRelevance = calculateEvidenceRelevance(codingTitle, understanding);

    // Relevant romantic status title
    const romanticTitle = "Santhana Thendralai | Romantic Status Video (Fullscreen)";
    const romanticRelevance = calculateEvidenceRelevance(romanticTitle, understanding);

    // Hard quality requirement: coding title MUST fail relevance (<50)
    expect(codingRelevance).toBeLessThan(50);
    expect(romanticRelevance).toBeGreaterThanOrEqual(80);
  });

  it("5. YouTube Pattern Model generates category-adapted titles under 100 characters", () => {
    const model = new YouTubePatternModel();

    const assets = model.generateGroundedAssets({
      detectedSubject: "Santhana Thendralai",
      contentType: "romantic_status",
      visualSceneDescription: "Aesthetic couple in nature with soft lighting",
      durationSeconds: 32,
      frameDataUrl: "data:image/jpeg;base64,mock",
    });

    expect(assets.titles.length).toBe(5);
    for (const t of assets.titles) {
      expect(t.characterCount).toBeLessThanOrEqual(100);
      expect(t.title.toLowerCase()).not.toContain("how to master");
      expect(t.title.toLowerCase()).not.toContain("blueprint");
    }

    expect(assets.description).not.toContain("#tutorial");
    expect(assets.description).toContain("#status");
    expect(assets.thumbnails[0].headline).toBe("FEEL THE LOVE");
  });
});
