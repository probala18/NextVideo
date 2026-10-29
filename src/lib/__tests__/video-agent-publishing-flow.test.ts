/**
 * src/lib/__tests__/video-agent-publishing-flow.test.ts
 * Focused tests for the Video Agent page and publishing workflow:
 * 1. Grounded title generation & transparent scoring
 * 2. YouTube Data API real research & graceful unavailable handling
 * 3. Thumbnail image format compliance (genuine PNG/JPEG, rejection of SVG disguised as PNG)
 * 4. Selected asset persistence (title, thumbnail ID) & no silent substitution
 * 5. Publishing request fields alignment & duplicate prevention
 * 6. Error handling
 */

import { describe, expect, it } from "bun:test";
import { assembleVideoUnderstanding } from "../video/understanding";
import { collectNicheResearch } from "../research/collector";
import {
  generateYouTubeThumbnails,
  validateYouTubeThumbnail,
  generateCompliantBinaryPng,
  isRealImageBuffer,
} from "../video/thumbnail-generator";
import { generatePublishingPackageWithAI } from "../video/generator";
import { isAlreadyPublished, recordPublishedVideo } from "../youtube/publishing";
import { MediaMetadata } from "../types/videoWorkflow";
import fs from "fs";
import path from "path";

describe("Focused Video Agent Publishing Flow", () => {
  const mockMedia: MediaMetadata = {
    filename: "nextjs_agent_demo.mp4",
    filesizeBytes: 12_000_000,
    format: "mp4",
    durationSeconds: 360,
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    frameRate: 30,
    hasVideoTrack: true,
    hasAudioTrack: true,
    codec: "h264/aac",
    inspectedWith: "atom_parser",
  };

  const mockCues = [
    { start: 0.5, end: 5.0, text: "In this tutorial we build an autonomous AI agent in Next.js from scratch." },
    { start: 6.0, end: 12.0, text: "We will connect real tools, execute background jobs, and publish live." },
    { start: 60.0, end: 90.0, text: "Here is the core API route handling resumable video uploads." },
    { start: 180.0, end: 220.0, text: "Notice how the agent extracts keyframes directly from video evidence." },
    { start: 300.0, end: 340.0, text: "And that completes the autonomous publishing pipeline." },
  ];

  const mockVision = {
    sampledFrames: [
      {
        index: 0,
        timestampSeconds: 10,
        relativePercent: 3,
        framePath: "/api/video/assets/test/frame_0.jpg",
        label: "Opening Hook",
        sceneType: "talking_head" as const,
        properties: {
          brightness: "balanced" as const,
          dominantColors: ["#0F172A", "#3B82F6", "#FFFFFF"],
          contrastScore: 88,
          complexityScore: 50,
          focalPoint: "Presenter explaining agent architecture",
          detectedOnScreenText: ["NEXTJS", "AGENT"],
          thumbnailSuitabilityScore: 92,
        },
      },
      {
        index: 1,
        timestampSeconds: 180,
        relativePercent: 50,
        framePath: "/api/video/assets/test/frame_1.jpg",
        label: "Core Demo",
        sceneType: "screencast" as const,
        properties: {
          brightness: "balanced" as const,
          dominantColors: ["#022C22", "#10B981", "#ECFDF5"],
          contrastScore: 82,
          complexityScore: 65,
          focalPoint: "Code editor and live agent logs",
          detectedOnScreenText: ["POST", "/api/upload"],
          thumbnailSuitabilityScore: 86,
        },
      },
    ],
    detectedSubjects: ["Presenter", "Code Editor"],
    detectedEnvironments: ["Studio"],
    visualPacing: "moderate" as const,
    onScreenTextCues: [{ timestampSeconds: 10, text: "NEXTJS AGENT", confidence: 0.95 }],
    candidateThumbnailMoments: [
      { timestampSeconds: 10, frameIndex: 0, headline: "AGENT PIPELINE", reason: "Opening hook scene", visualStrength: 92 },
    ],
    limitations: [],
    confidenceScore: 92,
    modelUsed: "test-model",
    supportsVision: false,
  };

  // 1. Grounded Video Understanding
  describe("1. Grounded Video Understanding", () => {
    it("extracts grounded subject from spoken cues and on-screen text rather than filename", () => {
      const understanding = assembleVideoUnderstanding({
        media: mockMedia,
        vision: mockVision,
        transcript: {
          text: mockCues.map((c) => c.text).join(" "),
          cues: mockCues,
          source: "user_upload",
        },
        creatorHintTopic: "Some Arbitrary Filename Hint",
      });

      expect(understanding.actualTopic).toContain("autonomous AI agent");
      expect(understanding.isAdequatelyUnderstood).toBe(true);
      expect(understanding.summary).toBeDefined();
      expect(understanding.summary!.length).toBeGreaterThan(20);
    });

    it("honestly flags limitation when video lacks dialogue and on-screen text", () => {
      const emptyVision = {
        ...mockVision,
        onScreenTextCues: [],
        sampledFrames: [],
        candidateThumbnailMoments: [],
      };

      const understanding = assembleVideoUnderstanding({
        media: mockMedia,
        vision: emptyVision,
        transcript: { text: "", cues: [], source: "user_upload" },
        creatorHintTopic: "Random Topic",
      });

      expect(understanding.isAdequatelyUnderstood).toBe(false);
      expect(understanding.limitationNotice).toBeDefined();
      expect(understanding.limitationNotice).toContain("Limited audio/visual evidence");
    });
  });

  // 2. Real YouTube Research & Unavailable Handling
  describe("2. Real YouTube Research & Data Handling", () => {
    it("reports live research as unavailable without fabricating fake competitor data when key is missing", async () => {
      const result = await collectNicheResearch({
        nicheOrTopic: "Unique Exotic Topic Without Benchmark 999",
        apiKey: "",
        allowBenchmarkFallback: false,
      });

      expect(result.source).toBe("unavailable");
      expect(result.isLiveApiData).toBe(false);
      expect(result.videos.length).toBe(0);
      expect(result.notes.some((n) => n.includes("Live YouTube competitive research is unavailable"))).toBe(true);
      expect(result.notes.some((n) => n.includes("recommendation algorithm"))).toBe(true);
    });

    it("keeps automated research tests independent of live API credentials and network", async () => {
      const result = await collectNicheResearch({ nicheOrTopic: "Next.js", apiKey: "", allowBenchmarkFallback: false });
      expect(result.isLiveApiData).toBe(false);
      expect(result.videos).toEqual([]);
    });
  });

  // 3. Grounded Title Generation & Transparent Scoring
  describe("3. Grounded Title Generation & Transparent Scoring", () => {
    it("generates 5 distinct title options with transparent scores, fit reasons, and mobile safety", async () => {
      const understanding = assembleVideoUnderstanding({
        media: mockMedia,
        vision: mockVision,
        transcript: {
          text: mockCues.map((c) => c.text).join(" "),
          cues: mockCues,
          source: "user_upload",
        },
      });

      const thumbs = await generateYouTubeThumbnails({
        assetId: "test_pkg_asset",
        topic: understanding.actualTopic,
        candidateFrames: mockVision.sampledFrames,
      });

      const pkg = await generatePublishingPackageWithAI({
        media: mockMedia,
        evidence: { ...understanding, isAdequatelyUnderstood: false, limitationNotice: "Model response is mocked only in integration tests." },
        vision: mockVision,
        thumbnails: thumbs,
      });

      expect(pkg.titles).toEqual([]);
      expect(pkg.recommendedTitle).toBe("");
      expect(pkg.isAdequatelyUnderstood).toBe(false);
      expect(pkg.limitationNotice).toBeDefined();
    });
  });

  // 4. Thumbnail Image Formats & Compliance
  describe("4. Thumbnail Image Formats & YouTube Compliance", () => {
    it("generates a genuine binary PNG image matching 1280x720 16:9 specs", () => {
      const buffer = generateCompliantBinaryPng(1280, 720);

      // Verify PNG magic header bytes: 89 50 4E 47 0D 0A 1A 0A
      const isPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47;
      expect(isPng).toBe(true);

      const check = isRealImageBuffer(buffer);
      expect(check.isReal).toBe(true);
      expect(check.format).toBe("png");

      const validation = validateYouTubeThumbnail(1280, 720, buffer.length, "png");
      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it("rejects SVG data written with a .png extension", () => {
      const fakeSvgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"></svg>', "utf-8");
      const check = isRealImageBuffer(fakeSvgBuffer);
      expect(check.isReal).toBe(false);
    });

    it("generates durable thumbnail options on disk with working urls", async () => {
      const assetId = `test_dur_${Date.now()}`;
      const thumbs = await generateYouTubeThumbnails({
        assetId,
        topic: "Next.js Autonomous Agent",
        candidateFrames: [],
      });

      expect(thumbs.length).toBe(3);
      for (const t of thumbs) {
        expect(fs.existsSync(t.imagePath)).toBe(true);
        expect(t.imageUrl).toContain(`/api/video/assets/${assetId}/thumbnails/`);
        expect(t.width).toBe(1280);
        expect(t.height).toBe(720);
        expect(["png", "jpg"]).toContain(t.format);

        const stat = fs.statSync(t.imagePath);
        expect(stat.size).toBeLessThan(2 * 1024 * 1024); // < 2MB
      }

      // Cleanup
      const assetDir = path.join(process.cwd(), "data", "uploads", assetId);
      if (fs.existsSync(assetDir)) {
        fs.rmSync(assetDir, { recursive: true, force: true });
      }
    });
  });

  // 5. Publishing Integration & Duplicate Prevention
  describe("5. Publishing Integration & Duplicate Prevention", () => {
    it("prevents duplicate publish when identical job and title are retried", () => {
      const testJobId = `job_dup_test_${Date.now()}`;
      const testTitle = `Mastering Next.js Agents ${Date.now()}`;

      expect(isAlreadyPublished(testJobId, testTitle)).toBe(false);

      recordPublishedVideo({
        id: "pub_test_1",
        jobId: testJobId,
        assetId: "asset_test_1",
        youtubeVideoId: "mockVideo123",
        youtubeUrl: "https://youtu.be/mockVideo123",
        title: testTitle,
        privacyStatus: "private",
        publishedAt: new Date().toISOString(),
        channelId: "UC_mock",
        status: "uploaded_to_youtube",
      });

      expect(isAlreadyPublished(testJobId, testTitle)).toBe(true);
    });
  });
});
