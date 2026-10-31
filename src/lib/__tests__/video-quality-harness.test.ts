/**
 * src/lib/__tests__/video-quality-harness.test.ts
 * Video Quality Evaluation Harness:
 * Evaluates Video Agent outputs against actual video evidence across 5 diverse content types:
 * 1. Coding Tutorial (Next.js & Prisma Fullstack App)
 * 2. Educational Lecture (Microservices & System Architecture)
 * 3. Product Demonstration (Sony Camera Setup & Workflow)
 * 4. Technical Explainer (HTTP Browser Caching Mechanics)
 * 5. Low-Evidence Video (Silent footage with no dialogue or readable graphics)
 */

import { describe, expect, it } from "bun:test";
import { assembleVideoUnderstanding } from "../video/understanding";
import { generatePublishingPackageWithAI } from "../video/generator";
import { MediaMetadata } from "../types/videoWorkflow";

describe("Video Agent Quality Evaluation Harness", () => {
  // -------------------------------------------------------------
  // Test Case 1: Coding Tutorial (Next.js & Prisma Fullstack App)
  // -------------------------------------------------------------
  it("Evaluation Case 1: Coding Tutorial correctly extracts tech stack, actions, and generates grounded titles", async () => {
    const media: MediaMetadata = {
      filename: "tutorial_recording_raw.mp4",
      filesizeBytes: 45_000_000,
      format: "mp4",
      durationSeconds: 420,
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      frameRate: 30,
      hasVideoTrack: true,
      hasAudioTrack: true,
      codec: "h264/aac",
      inspectedWith: "atom_parser",
    };

    const transcript = {
      source: "user_upload" as const,
      text: "Today we are going to build a fullstack app with Next.js and Prisma from scratch. First, we initialize the Next.js project and configure Tailwind CSS. Next, we define our database schema in prisma.schema and run the Prisma migration. Then, we implement Next.js server actions to handle CRUD operations. Finally, we test the live application in the browser.",
      cues: [
        { start: 0, end: 12, text: "Today we are going to build a fullstack app with Next.js and Prisma from scratch." },
        { start: 45, end: 70, text: "First, we initialize the Next.js project and configure Tailwind CSS." },
        { start: 120, end: 160, text: "Next, we define our database schema in prisma.schema and run the Prisma migration." },
        { start: 220, end: 270, text: "Then, we implement Next.js server actions to handle CRUD operations." },
        { start: 360, end: 410, text: "Finally, we test the live application in the browser and verify the results." },
      ],
    };

    const vision = {
      sampledFrames: [
        {
          index: 0,
          timestampSeconds: 5,
          relativePercent: 2,
          framePath: "/api/video/assets/case1/frame_1.jpg",
          label: "Opening Intro",
          sceneType: "talking_head" as const,
          properties: {
            brightness: "balanced" as const,
            dominantColors: ["#0F172A", "#3B82F6", "#FFFFFF"],
            contrastScore: 88,
            complexityScore: 50,
            focalPoint: "Presenter at desk",
            detectedOnScreenText: ["NEXTJS", "PRISMA"],
            thumbnailSuitabilityScore: 92,
          },
          semanticDescription: "Presenter introducing Next.js and Prisma build",
        },
        {
          index: 2,
          timestampSeconds: 140,
          relativePercent: 33,
          framePath: "/api/video/assets/case1/frame_2.jpg",
          label: "Database Schema Code",
          sceneType: "screencast" as const,
          properties: {
            brightness: "balanced" as const,
            dominantColors: ["#022C22", "#10B981", "#ECFDF5"],
            contrastScore: 85,
            complexityScore: 70,
            focalPoint: "VS Code with schema.prisma open",
            detectedOnScreenText: ["model User", "datasource db"],
            thumbnailSuitabilityScore: 90,
          },
          semanticDescription: "VS Code showing Prisma schema and database migrations",
        },
      ],
      detectedSubjects: ["VS Code", "Prisma Schema", "Next.js"],
      detectedEnvironments: ["Editor"],
      visualPacing: "moderate" as const,
      onScreenTextCues: [{ timestampSeconds: 5, text: "NEXTJS PRISMA", confidence: 0.9 }],
      candidateThumbnailMoments: [],
      limitations: [],
      confidenceScore: 95,
      modelUsed: "eval-model",
      supportsVision: true,
    };

    const understanding = assembleVideoUnderstanding({
      media,
      vision,
      transcript,
      creatorHintTopic: "Unverified Hint",
    });

    // 1. Semantic Evidence Validation
    expect(understanding.isAdequatelyUnderstood).toBe(true);
    expect(understanding.demonstratedTechnologies).toContain("next.js");
    expect(understanding.demonstratedTechnologies).toContain("prisma");
    expect(["teaching", "demonstration"]).toContain(understanding.contentType);
    expect(understanding.summary.toLowerCase()).toContain("next");
    expect(understanding.summary.toLowerCase()).toContain("prisma");

    // 2. Asset Generation Validation
    const pkg = await generatePublishingPackageWithAI({
      media,
      evidence: understanding,
      vision,
      thumbnails: [],
    });

    expect(pkg.titles.length).toBe(5);
    // Every title should accurately reference the video's actual topic
    pkg.titles.forEach((t) => {
      expect(t.title.length).toBeLessThanOrEqual(100);
      expect(t.fitReason).toBeDefined();
      expect(t.scores.contentRelevance).toBeGreaterThanOrEqual(80);
      expect(t.title).not.toContain("90% Fail");
    });

    // Description must reflect technologies and avoid fabricated links
    expect(pkg.description).toContain("Next.js");
    expect(pkg.description).toContain("Prisma");
    expect(pkg.description).not.toContain("https://github.com/fake-repo");

    // Chapters must cover the progression
    expect(pkg.chapters.length).toBeGreaterThanOrEqual(3);
    expect(pkg.chapters[0].timecode).toBe("0:00");
  });

  // -------------------------------------------------------------
  // Test Case 2: Educational Lecture (Microservices Architecture)
  // -------------------------------------------------------------
  it("Evaluation Case 2: Educational Lecture identifies architectural topics and rejects unsupported clickbait", async () => {
    const media: MediaMetadata = {
      filename: "lecture_microservices.mp4",
      filesizeBytes: 60_000_000,
      format: "mp4",
      durationSeconds: 500,
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      frameRate: 30,
      hasVideoTrack: true,
      hasAudioTrack: true,
      codec: "h264/aac",
      inspectedWith: "atom_parser",
    };

    const transcript = {
      source: "user_upload" as const,
      text: "In this lecture, we explain microservices system architecture and database sharding. We review trade-offs between monolithic databases and distributed event-driven services. We examine Docker container orchestration and API gateway routing.",
      cues: [
        { start: 0, end: 15, text: "In this lecture, we explain microservices system architecture and database sharding." },
        { start: 80, end: 130, text: "We review trade-offs between monolithic databases and distributed event-driven services." },
        { start: 200, end: 260, text: "We examine Docker container orchestration and API gateway routing." },
        { start: 380, end: 440, text: "Finally, we discuss fault tolerance and circuit breaker patterns." },
      ],
    };

    const vision = {
      sampledFrames: [
        {
          index: 0,
          timestampSeconds: 10,
          relativePercent: 2,
          framePath: "/api/video/assets/case2/frame_1.jpg",
          label: "Slide 1",
          sceneType: "presentation" as const,
          properties: {
            brightness: "balanced" as const,
            dominantColors: ["#1E1B4B", "#8B5CF6", "#F5F3FF"],
            contrastScore: 90,
            complexityScore: 40,
            focalPoint: "Slide diagram",
            detectedOnScreenText: ["MICROSERVICES", "ARCHITECTURE"],
            thumbnailSuitabilityScore: 92,
          },
          semanticDescription: "Slide diagram explaining microservices boundaries",
        },
      ],
      detectedSubjects: ["Architecture Diagram", "Slide Presentation"],
      detectedEnvironments: ["Lecture Hall"],
      visualPacing: "moderate" as const,
      onScreenTextCues: [{ timestampSeconds: 10, text: "MICROSERVICES ARCHITECTURE", confidence: 0.95 }],
      candidateThumbnailMoments: [],
      limitations: [],
      confidenceScore: 90,
      modelUsed: "eval-model",
      supportsVision: true,
    };

    const understanding = assembleVideoUnderstanding({
      media,
      vision,
      transcript,
    });

    expect(understanding.isAdequatelyUnderstood).toBe(true);
    expect(understanding.contentType).toBe("teaching");
    expect(understanding.actualTopic.toLowerCase()).toContain("microservices");

    const pkg = await generatePublishingPackageWithAI({
      media,
      evidence: understanding,
      vision,
      thumbnails: [],
    });

    expect(pkg.titles.length).toBe(5);
    // Ensure titles are professional educational titles without sensationalist nonsense
    pkg.titles.forEach((t) => {
      expect(t.title.toLowerCase()).not.toContain("this changed everything");
      expect(t.title.toLowerCase()).not.toContain("in 2 minutes");
      expect(t.scores.contentRelevance).toBeGreaterThanOrEqual(85);
    });
  });

  // -------------------------------------------------------------
  // Test Case 3: Product Demonstration (Sony Camera Workflow)
  // -------------------------------------------------------------
  it("Evaluation Case 3: Product Demonstration correctly identifies hardware subject without inventing software code", async () => {
    const media: MediaMetadata = {
      filename: "camera_hands_on.mp4",
      filesizeBytes: 30_000_000,
      format: "mp4",
      durationSeconds: 300,
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      frameRate: 60,
      hasVideoTrack: true,
      hasAudioTrack: true,
      codec: "h264/aac",
      inspectedWith: "atom_parser",
    };

    const transcript = {
      source: "user_upload" as const,
      text: "Today we are reviewing the Sony Alpha camera body and autofocus workflow. Let's inspect the physical dials, test the eye-tracking autofocus in low light, and evaluate the 4K 60fps recording output.",
      cues: [
        { start: 0, end: 12, text: "Today we are reviewing the Sony Alpha camera body and autofocus workflow." },
        { start: 40, end: 80, text: "Let's inspect the physical dials and custom buttons." },
        { start: 120, end: 180, text: "Now we test the eye-tracking autofocus tracking moving subjects." },
        { start: 220, end: 280, text: "Here is the final 4K 60fps recorded output with color grading." },
      ],
    };

    const vision = {
      sampledFrames: [
        {
          index: 0,
          timestampSeconds: 5,
          relativePercent: 2,
          framePath: "/api/video/assets/case3/frame_1.jpg",
          label: "Product Shot",
          sceneType: "action_demo" as const,
          properties: {
            brightness: "balanced" as const,
            dominantColors: ["#18181B", "#F59E0B", "#F8FAFC"],
            contrastScore: 92,
            complexityScore: 55,
            focalPoint: "Sony Alpha camera with lens mounted",
            detectedOnScreenText: ["SONY ALPHA"],
            thumbnailSuitabilityScore: 95,
          },
          semanticDescription: "Close-up of Sony camera body on tabletop",
        },
      ],
      detectedSubjects: ["Sony Camera", "Lens"],
      detectedEnvironments: ["Studio Desk"],
      visualPacing: "moderate" as const,
      onScreenTextCues: [{ timestampSeconds: 5, text: "SONY ALPHA", confidence: 0.95 }],
      candidateThumbnailMoments: [],
      limitations: [],
      confidenceScore: 92,
      modelUsed: "eval-model",
      supportsVision: true,
    };

    const understanding = assembleVideoUnderstanding({
      media,
      vision,
      transcript,
    });

    expect(understanding.isAdequatelyUnderstood).toBe(true);
    expect(understanding.contentType).toBe("review");
    expect(understanding.actualTopic.toLowerCase()).toContain("sony");

    // Make sure software entities are NOT fabricated for a camera video
    expect(understanding.demonstratedTechnologies).not.toContain("react");
    expect(understanding.demonstratedTechnologies).not.toContain("python");

    const pkg = await generatePublishingPackageWithAI({
      media,
      evidence: understanding,
      vision,
      thumbnails: [],
    });

    expect(pkg.titles.length).toBe(5);
    pkg.titles.forEach((t) => {
      expect(t.title.toLowerCase()).toContain("sony");
    });
  });

  // -------------------------------------------------------------
  // Test Case 4: Technical Explainer (HTTP Browser Caching)
  // -------------------------------------------------------------
  it("Evaluation Case 4: Technical Explainer identifies web protocol topic and constructs verified chapters", async () => {
    const media: MediaMetadata = {
      filename: "browser_caching_explained.mp4",
      filesizeBytes: 25_000_000,
      format: "mp4",
      durationSeconds: 240,
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      frameRate: 30,
      hasVideoTrack: true,
      hasAudioTrack: true,
      codec: "h264/aac",
      inspectedWith: "atom_parser",
    };

    const transcript = {
      source: "user_upload" as const,
      text: "In this video we explain how browser caching actually works. We look at Cache-Control headers, Max-Age directives, ETags, and 304 Not Modified responses in Chrome DevTools.",
      cues: [
        { start: 0, end: 10, text: "In this video we explain how browser caching actually works." },
        { start: 30, end: 70, text: "We inspect Cache-Control headers and max-age directives." },
        { start: 100, end: 150, text: "Here is how ETags and validation work with 304 Not Modified." },
        { start: 180, end: 230, text: "Testing cache invalidation directly in Chrome DevTools." },
      ],
    };

    const vision = {
      sampledFrames: [
        {
          index: 0,
          timestampSeconds: 5,
          relativePercent: 2,
          framePath: "/api/video/assets/case4/frame_1.jpg",
          label: "Network Tab",
          sceneType: "screencast" as const,
          properties: {
            brightness: "balanced" as const,
            dominantColors: ["#0F172A", "#3B82F6", "#FFFFFF"],
            contrastScore: 86,
            complexityScore: 60,
            focalPoint: "Chrome DevTools Network panel",
            detectedOnScreenText: ["CACHE-CONTROL", "MAX-AGE"],
            thumbnailSuitabilityScore: 89,
          },
          semanticDescription: "Chrome DevTools showing network request headers",
        },
      ],
      detectedSubjects: ["DevTools", "Network Panel"],
      detectedEnvironments: ["Browser"],
      visualPacing: "moderate" as const,
      onScreenTextCues: [{ timestampSeconds: 5, text: "CACHE-CONTROL", confidence: 0.9 }],
      candidateThumbnailMoments: [],
      limitations: [],
      confidenceScore: 90,
      modelUsed: "eval-model",
      supportsVision: true,
    };

    const understanding = assembleVideoUnderstanding({
      media,
      vision,
      transcript,
    });

    expect(understanding.isAdequatelyUnderstood).toBe(true);
    expect(understanding.actualTopic.toLowerCase()).toContain("browser caching");

    const pkg = await generatePublishingPackageWithAI({
      media,
      evidence: understanding,
      vision,
      thumbnails: [],
    });

    expect(pkg.titles.length).toBe(5);
    expect(pkg.chapters.length).toBeGreaterThanOrEqual(3);
    expect(pkg.chapters[0].timecode).toBe("0:00");
    pkg.chapters.forEach((ch) => {
      expect(ch.timestampSeconds).toBeLessThanOrEqual(240);
    });
  });

  // -------------------------------------------------------------
  // Test Case 5: Low-Evidence Video (Silent footage with no dialogue)
  // -------------------------------------------------------------
  it("Evaluation Case 5: Low-Evidence Video pauses generation and displays honest limitation notice without inventing content", async () => {
    const media: MediaMetadata = {
      filename: "mystery_silent_clip.mp4",
      filesizeBytes: 5_000_000,
      format: "mp4",
      durationSeconds: 90,
      width: 1280,
      height: 720,
      aspectRatio: "16:9",
      frameRate: 24,
      hasVideoTrack: true,
      hasAudioTrack: false,
      codec: "h264",
      inspectedWith: "atom_parser",
    };

    const emptyTranscript = {
      source: "unavailable" as const,
      text: "",
      cues: [],
    };

    const visionNoSemantics = {
      sampledFrames: [],
      detectedSubjects: [],
      detectedEnvironments: [],
      visualPacing: "moderate" as const,
      onScreenTextCues: [],
      candidateThumbnailMoments: [],
      limitations: ["No dialogue detected", "Visual semantics unavailable"],
      confidenceScore: 0,
      modelUsed: "eval-model",
      supportsVision: false,
    };

    const understanding = assembleVideoUnderstanding({
      media,
      vision: visionNoSemantics,
      transcript: emptyTranscript,
      creatorHintTopic: "Unverified Hint Claiming Video Is About AI",
    });

    // Must NOT declare adequate understanding when there is no speech or visual graphics
    expect(understanding.isAdequatelyUnderstood).toBe(false);
    expect(understanding.limitationNotice).toBeDefined();
    expect(understanding.limitationNotice).toContain("Limited audio/visual evidence");

    const pkg = await generatePublishingPackageWithAI({
      media,
      evidence: understanding,
      vision: visionNoSemantics,
      thumbnails: [],
    });

    // Inadequate evidence must pause generation rather than fabricating fake titles
    expect(pkg.titles).toEqual([]);
    expect(pkg.recommendedTitle).toBe("");
    expect(pkg.isAdequatelyUnderstood).toBe(false);
    expect(pkg.limitationNotice).toBeDefined();
  });
});
