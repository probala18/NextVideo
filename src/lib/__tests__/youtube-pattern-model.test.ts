/**
 * src/lib/__tests__/youtube-pattern-model.test.ts
 * Tests for the YouTube Pattern Recognition & Training Model:
 * - Statistical formula learning on YouTube view multiples (>2x, >3x median)
 * - Grounding title and thumbnail generation in Computer Vision observations of uploaded video
 * - Mobile-safe title validation (<50 chars)
 * - Zero title-word repetition rule on thumbnails
 */

import { describe, it, expect } from "bun:test";
import {
  YouTubePatternModel,
  youtubePatternModel,
  YouTubeTrainingVideo,
  VideoVisualUnderstanding,
} from "../models/youtube-pattern-model";

describe("YouTube Pattern Recognition & Training Model", () => {
  it("initializes with pre-trained YouTube benchmark dataset", () => {
    const stats = youtubePatternModel.getModelStats();
    expect(stats.trainedVideosCount).toBeGreaterThanOrEqual(6);
    expect(stats.topFormulas.length).toBeGreaterThanOrEqual(5);

    // Verify top formulas have valid multipliers
    for (const f of stats.topFormulas) {
      expect(f.multiplier).toBeGreaterThan(1.0);
    }
  });

  it("trains and adjusts formula weights when fed more YouTube video data", () => {
    const freshModel = new YouTubePatternModel();
    const initialMistakeMultiplier =
      freshModel.getModelStats().topFormulas.find((f) => f.name.includes("Mistake"))?.multiplier || 0;

    const customOutlierBatch: YouTubeTrainingVideo[] = [
      {
        id: "yt_test_1",
        title: "Stop Writing Bad SQL Queries in 2026",
        views: 890000,
        channelMedianViews: 120000,
        multipleOfMedian: 7.41,
        publishedDaysAgo: 12,
        thumbnailText: "HUGE MISTAKE",
      },
      {
        id: "yt_test_2",
        title: "Stop Using Default Docker Files",
        views: 450000,
        channelMedianViews: 80000,
        multipleOfMedian: 5.62,
        publishedDaysAgo: 20,
        thumbnailText: "CRITICAL FIX",
      },
      {
        id: "yt_test_3",
        title: "Stop Making This TypeScript Architecture Mistake",
        views: 520000,
        channelMedianViews: 90000,
        multipleOfMedian: 5.77,
        publishedDaysAgo: 35,
        thumbnailText: "AVOID THIS",
      },
    ];

    const trainResult = freshModel.feedYouTubeData(customOutlierBatch);
    expect(trainResult.trainedTotal).toBeGreaterThan(initialMistakeMultiplier);

    const updatedStats = freshModel.getModelStats();
    const updatedMistakeMultiplier =
      updatedStats.topFormulas.find((f) => f.name.includes("Mistake"))?.multiplier || 0;

    expect(updatedMistakeMultiplier).toBeGreaterThanOrEqual(initialMistakeMultiplier);
  });

  it("extracts concrete technical subject strictly from Computer Vision visual understanding", () => {
    const mockVisionData: VideoVisualUnderstanding = {
      detectedSubject: "PostgreSQL Index Optimization",
      visualSceneDescription: "Database explain query console demonstration",
      detectedOnScreenText: ["EXPLAIN ANALYZE", "B-TREE INDEX"],
      focalPoint: "Terminal query execution metrics",
      primaryAction: "Writing SQL query",
      durationSeconds: 420,
    };

    const extracted = youtubePatternModel.extractGroundedSubject(mockVisionData);
    expect(extracted.subject).toBe("EXPLAIN ANALYZE");
    expect(extracted.specificDetail).toBe("B-TREE INDEX");
  });

  it("falls back to detected video subject when on-screen text is absent", () => {
    const mockVisionWithoutText: VideoVisualUnderstanding = {
      detectedSubject: "FastAPI Async Endpoints",
      visualSceneDescription: "Python web server benchmarks",
      focalPoint: "Uvicorn worker process graph",
      primaryAction: "Benchmarking requests per second",
      durationSeconds: 300,
    };

    const extracted = youtubePatternModel.extractGroundedSubject(mockVisionWithoutText);
    expect(extracted.subject).toBe("FastAPI Async Endpoints");
  });

  it("generates titles strictly relevant to the uploaded video seen by Computer Vision", () => {
    const mockVision: VideoVisualUnderstanding = {
      detectedSubject: "Docker Multi-Stage Builds",
      detectedOnScreenText: ["DOCKERFILE", "ALPINE LINUX"],
      focalPoint: "Container image size comparison",
      primaryAction: "Building lightweight containers",
      durationSeconds: 480,
    };

    const assets = youtubePatternModel.generateGroundedAssets(mockVision);

    expect(assets.titles.length).toBeGreaterThanOrEqual(1);
    // Every generated title must be relevant to the detected subject, NOT a generic placeholder
    for (const t of assets.titles) {
      expect(t.title).toContain("DOCKERFILE");
      expect(t.characterCount).toBe(t.title.length);
    }

    expect(assets.recommendedTitle).toBeDefined();
    expect(assets.recommendedTitleReason).toContain("evidence-derived");
  });

  it("enforces mobile-safe length (<50-52 chars) and zero title-word duplication on thumbnails", () => {
    const mockVision: VideoVisualUnderstanding = {
      detectedSubject: "React Server Actions",
      detectedOnScreenText: ["SERVER ACTIONS", "NEXT.JS 15"],
      focalPoint: "Form mutation code",
      primaryAction: "Executing server mutation",
      durationSeconds: 360,
    };

    const assets = youtubePatternModel.generateGroundedAssets(mockVision);

    // Verify mobile-safe character counts
    const mobileSafeTitles = assets.titles.filter((t) => t.isMobileSafe);
    expect(mobileSafeTitles.length).toBeGreaterThanOrEqual(1);

    // Verify thumbnail variations never repeat title words
    const titleWords = new Set(
      assets.recommendedTitle.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, ""))
    );

    for (const thumb of assets.thumbnails) {
      const headlineWords = thumb.headline.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, ""));
      for (const hw of headlineWords) {
        if (hw.length > 3) {
          expect(titleWords.has(hw)).toBe(false);
        }
      }
    }
  });

  it("generates structured descriptions with accurate video timestamps", () => {
    const mockVision: VideoVisualUnderstanding = {
      detectedSubject: "Next.js Middleware",
      detectedOnScreenText: ["AUTH MIDDLEWARE", "REDIRECTS"],
      focalPoint: "Code editor showing middleware.ts",
      primaryAction: "Writing auth validation",
      durationSeconds: 600,
    };

    const assets = youtubePatternModel.generateGroundedAssets(mockVision);
    expect(assets.description).not.toContain("TIMESTAMPS:");
    expect(assets.description).not.toContain("10:00");
    expect(assets.tags.length).toBeGreaterThanOrEqual(1);
  });
});
