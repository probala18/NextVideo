import { describe, expect, it, beforeEach } from "bun:test";
import fs from "fs";
import path from "path";
import {
  buildStructuredTitleEvidence,
  filterAndDeduplicateTitles,
  getVideoFingerprint,
  recordTitleHistory,
  getTitleHistory,
  clearTitleHistory,
  calculateTokenSimilarity,
  normalizeTitleForDeduplication,
  BANNED_GENERIC_PATTERNS,
  UNVERIFIED_CELEBRITY_ARTIST_NAMES,
  StructuredTitleEvidence,
} from "../video/generator";
import { MediaMetadata } from "../types/videoWorkflow";
import { VisionAnalysisReport, VideoUnderstandingEvidence, TitleOption } from "../types/visionWorkflow";

describe("Title Generation Improvements: Structured Evidence, Strategies, Quality Filtering & Repetition Prevention", () => {
  beforeEach(() => {
    clearTitleHistory();
  });

  const mockMedia: MediaMetadata = {
    durationSeconds: 28.38,
    filesizeBytes: 7_055_399,
    format: "mp4",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    hasVideoTrack: true,
    hasAudioTrack: true,
    codec: "h264",
    filename: "fine_time_status.mp4",
    inspectedWith: "atom_parser",
  };

  const mockVision: VisionAnalysisReport = {
    sampledFrames: [
      {
        index: 1,
        timestampSeconds: 0.9,
        relativePercent: 3,
        framePath: "/api/video/assets/sample/frames/cv_frame_1.jpg",
        label: "Frame at 0.9s",
        sceneType: "unknown",
        properties: {
          brightness: "balanced",
          dominantColors: ["#D4AF37", "#1A1A1A"],
          contrastScore: 78,
          complexityScore: 62,
          focalPoint: "Woman's face and golden earrings",
          detectedOnScreenText: ["FINE TIME MUSIC"],
          thumbnailSuitabilityScore: 85,
        },
        semanticDescription: "A close-up of a woman's face, focusing on her earrings and the hand of another person touching her necklace.",
      },
      {
        index: 2,
        timestampSeconds: 14.2,
        relativePercent: 50,
        framePath: "/api/video/assets/sample/frames/cv_frame_2.jpg",
        label: "Frame at 14.2s",
        sceneType: "action_demo",
        properties: {
          brightness: "balanced",
          dominantColors: ["#8B0000"],
          contrastScore: 70,
          complexityScore: 50,
          focalPoint: "Tender embrace",
          detectedOnScreenText: [],
          thumbnailSuitabilityScore: 80,
        },
        semanticDescription: "Cinematic medium shot of the couple holding hands under warm amber lighting.",
      },
    ],
    sampledFramesCount: 8,
    analyzedFramesCount: 2,
    detectedSubjects: ["woman", "hand", "jewelry", "couple"],
    detectedEnvironments: ["ambient warm room"],
    visualPacing: "moderate",
    onScreenTextCues: [
      { timestampSeconds: 0.9, text: "FINE TIME MUSIC", confidence: 0.95 },
      { timestampSeconds: 25.0, text: "Status Cut", confidence: 0.88 },
    ],
    candidateThumbnailMoments: [],
    limitations: [],
    confidenceScore: null,
    modelUsed: "qwen2.5vl:3b",
    supportsVision: true,
  };

  const mockEvidence: VideoUnderstandingEvidence = {
    actualTopic: "FINE TIME MUSIC",
    contentType: "romantic_status",
    primaryValueProposition: "Romantic visual scene featuring FINE TIME MUSIC.",
    detectedVisualSubjects: ["woman", "hand", "jewelry", "couple"],
    isAdequatelyUnderstood: true,
    targetAudience: "Music & Status Video Viewers",
    keyTakeaways: ["Lyrical Tamil status", "Aesthetic couple moments"],
    distinguishingFeatures: ["Vertical 9:16 aspect ratio", "Tamil vocal audio"],
    visualEvidence: [],
    audioEvidence: [
      { timestampSeconds: 1.2, cueText: "வீடியில் வந்தப் பின்னால் வீடியாதை இருக்கும்" },
      { timestampSeconds: 7.5, cueText: "பூ வாசமியில் சம்முந்தன்" },
    ],
    audioAnalysis: {
      status: "completed",
      provider: "local_whisper",
      model: "base",
      language: { code: "ta", name: "Tamil", status: "detected", probability: 0.72 },
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
    },
    untrustedInputProtection: true,
    narrativeClimaxSeconds: 14.2,
  };

  describe("1. Structured Evidence Building", () => {
    it("extracts visible text, visual scene, emotional context, audio language & meaning, and verified identity", () => {
      const structured = buildStructuredTitleEvidence(mockMedia, mockEvidence, mockVision);

      // Visible text extracted from on-screen cues and frame OCR
      expect(structured.visibleText).toContain("FINE TIME MUSIC");
      expect(structured.visibleText).toContain("Status Cut");

      // Visual scene describes what is visibly occurring
      expect(structured.visualScene).toContain("close-up of a woman's face");
      expect(structured.visualScene).toContain("earrings");

      // Emotional context reflects romantic status mood
      expect(structured.emotionalContext.toLowerCase()).toContain("romantic");
      expect(structured.emotionalContext.toLowerCase()).toContain("soulful");

      // Audio language detected as Tamil
      expect(structured.audioLanguage.isTamil).toBe(true);
      expect(structured.audioLanguage.confidenceCheck).toBe("reliable");
      expect(structured.audioLanguage.meaningConfidence).toBe("unverified");

      // Audio meaning conveys neutral transcription without assuming romantic or specific lyrical meaning
      expect(structured.audioMeaning).toContain("Tamil");
      expect(structured.audioMeaning).toContain("unverified");
      expect(structured.audioMeaning).toContain("Do NOT assume romantic");

      // Verified identity strictly marks song and artist as unverified
      expect(structured.verifiedIdentity.isVerified).toBe(false);
      expect(structured.verifiedIdentity.artist).toBeNull();
      expect(structured.verifiedIdentity.songTitle).toBeNull();
      expect(structured.verifiedIdentity.rule).toContain("UNVERIFIED");
    });

    it("handles silent or instructional videos with appropriate emotional context and audio meaning", () => {
      const tutorialEvidence: VideoUnderstandingEvidence = {
        ...mockEvidence,
        actualTopic: "Next.js Authentication with Auth0",
        contentType: "teaching",
        audioAnalysis: {
          status: "no_audio",
          provider: "none",
          model: "none",
          language: { code: null, name: null, status: "unknown" },
          speechDetected: false,
          transcript: { rawText: "", segments: [] },
          limitations: ["No audio stream found."],
          processing: { durationSeconds: 60, processingTimeMs: 0 },
        },
      };

      const structured = buildStructuredTitleEvidence(mockMedia, tutorialEvidence, mockVision);
      expect(structured.contentType).toBe("teaching");
      expect(structured.emotionalContext.toLowerCase()).toContain("instructional");
      expect(structured.audioLanguage.confidenceCheck).toBe("unavailable");
      expect(structured.audioMeaning.toLowerCase()).toContain("no speech");
    });
  });

  describe("2. Title Quality & Repetition Filter", () => {
    const structured = buildStructuredTitleEvidence(mockMedia, mockEvidence, mockVision);

    it("removes normalized exact duplicates and case/punctuation variations", () => {
      const candidates: TitleOption[] = [
        {
          title: "Fine Time Music | Tamil Romantic Status",
          formula: "Search-focused",
          characterCount: 39,
          isTruncated: false,
        },
        {
          title: "fine time music! - tamil romantic status",
          formula: "Search-focused duplicate",
          characterCount: 40,
          isTruncated: false,
        },
        {
          title: "Golden Earrings & Whispers of Love",
          formula: "Scene-focused",
          characterCount: 34,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(candidates, mockEvidence, structured);
      expect(filtered.length).toBe(2);
      expect(filtered.map((t) => t.title)).toEqual([
        "Fine Time Music | Tamil Romantic Status",
        "Golden Earrings & Whispers of Love",
      ]);
    });

    it("rejects generic banned phrases such as 'A Romantic Visual Status Clip' or 'Aesthetic Status Cut'", () => {
      const candidates: TitleOption[] = [
        {
          title: "Fine Time Music - A Romantic Visual Status Clip",
          formula: "Generic Template",
          characterCount: 45,
          isTruncated: false,
        },
        {
          title: "Fine Time Music | Aesthetic Status Cut",
          formula: "Generic Cut",
          characterCount: 38,
          isTruncated: false,
        },
        {
          title: "Fine Time Music Romantic Visual Scene",
          formula: "Generic Scene",
          characterCount: 38,
          isTruncated: false,
        },
        {
          title: "Tender Embrace in Amber Light",
          formula: "Scene-focused",
          characterCount: 29,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(candidates, mockEvidence, structured);
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe("Tender Embrace in Amber Light");
    });

    it("detects and rejects semantic near-duplicates that use different wording for the same meaning", () => {
      const candidates: TitleOption[] = [
        {
          title: "Fine Time Music Romantic Moments",
          formula: "Emotional Hook",
          characterCount: 33,
          isTruncated: false,
        },
        {
          title: "Romantic Moments in Fine Time Music",
          formula: "Rephrased Near Duplicate",
          characterCount: 35,
          isTruncated: false,
        },
        {
          title: "Touching the Necklace with Love",
          formula: "Scene-focused",
          characterCount: 31,
          isTruncated: false,
        },
      ];

      // "Fine Time Music Romantic Moments" matches banned pattern "romantic moments"
      // Let's test non-banned phrasing that shares identical token meaning
      const customCandidates: TitleOption[] = [
        {
          title: "Golden Earrings Sparkle in Tender Romance",
          formula: "Scene-focused",
          characterCount: 41,
          isTruncated: false,
        },
        {
          title: "Tender Romance with Sparkling Golden Earrings",
          formula: "Near Duplicate Reorder",
          characterCount: 45,
          isTruncated: false,
        },
        {
          title: "Fine Time Melodic Whispers",
          formula: "Clean & concise",
          characterCount: 26,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(customCandidates, mockEvidence, structured);
      expect(filtered.length).toBe(2);
      expect(filtered[0].title).toBe("Golden Earrings Sparkle in Tender Romance");
      expect(filtered[1].title).toBe("Fine Time Melodic Whispers");
    });

    it("rejects unsupported song names, artist names, and composers", () => {
      const candidates: TitleOption[] = [
        {
          title: "Fine Time Music | A.R. Rahman Romantic Hit",
          formula: "Hallucinated Composer",
          characterCount: 43,
          isTruncated: false,
        },
        {
          title: "Hariharan Soulful Voice in Fine Time",
          formula: "Hallucinated Singer",
          characterCount: 37,
          isTruncated: false,
        },
        {
          title: "Kandukondain Kandukondain Status Cut",
          formula: "Hallucinated Song Name",
          characterCount: 36,
          isTruncated: false,
        },
        {
          title: "Soulful Tamil Lyrical Feelings",
          formula: "Emotional hook",
          characterCount: 30,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(candidates, mockEvidence, structured);
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe("Soulful Tamil Lyrical Feelings");
    });

    it("does not fill missing options with generic fallback titles just to reach five", () => {
      // If only 3 valid titles pass filters, it returns exactly those 3
      const candidates: TitleOption[] = [
        {
          title: "Fine Time Music | Tamil Romantic Status",
          formula: "Search-focused",
          characterCount: 39,
          isTruncated: false,
        },
        {
          title: "A Gentle Touch of Golden Earrings",
          formula: "Scene-focused",
          characterCount: 33,
          isTruncated: false,
        },
        {
          title: "Sweet Lyrical Whispers",
          formula: "Clean and concise",
          characterCount: 22,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(candidates, mockEvidence, structured);
      expect(filtered.length).toBe(3);
      // Verify no generic synthetic padding was appended
      expect(filtered.some((t) => t.title.includes("Romantic Visual Scene"))).toBe(false);
      expect(filtered.some((t) => t.title.includes("Aesthetic Status Cut"))).toBe(false);
    });
  });

  describe("3. Cross-Generation Repetition Prevention", () => {
    it("generates stable video fingerprints based on assetId or media properties", () => {
      const fp1 = getVideoFingerprint({ assetId: "asset_abc123" });
      expect(fp1).toBe("asset_abc123");

      const fp2 = getVideoFingerprint({ filename: "clip.mp4", filesizeBytes: 12345 }, "Fine Time");
      const fp3 = getVideoFingerprint({ filename: "clip.mp4", filesizeBytes: 12345 }, "Fine Time");
      const fpOther = getVideoFingerprint({ filename: "other.mp4", filesizeBytes: 99999 }, "Coding");

      expect(fp2).toBe(fp3);
      expect(fp2).not.toBe(fpOther);
    });

    it("stores history by fingerprint and rejects titles repeating previously generated angles", () => {
      const structured = buildStructuredTitleEvidence(mockMedia, mockEvidence, mockVision);
      const fp = getVideoFingerprint(mockMedia, mockEvidence.actualTopic);

      // Generation 1 produces and records titles
      const gen1Titles = [
        "Fine Time Music | Tamil Romantic Status",
        "Golden Earrings Under Soft Light",
      ];
      recordTitleHistory(fp, gen1Titles);
      expect(getTitleHistory(fp)).toEqual(gen1Titles);

      // Generation 2 candidate titles contain one repetition and one new angle
      const gen2Candidates: TitleOption[] = [
        {
          title: "fine time music | tamil romantic status", // Exact repeat of Gen 1
          formula: "Repeat",
          characterCount: 39,
          isTruncated: false,
        },
        {
          title: "Soft Light on Golden Earrings", // Near duplicate of Gen 1
          formula: "Repeat Angle",
          characterCount: 29,
          isTruncated: false,
        },
        {
          title: "Tender Soulful Embrace", // Genuinely fresh angle
          formula: "Emotional hook",
          characterCount: 22,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(gen2Candidates, mockEvidence, structured, getTitleHistory(fp));
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe("Tender Soulful Embrace");
    });

    it("does not leak title history between unrelated videos with different fingerprints", () => {
      const fp1 = "video_status_clip";
      const fp2 = "video_tech_tutorial";

      recordTitleHistory(fp1, ["Title A", "Title B"]);
      expect(getTitleHistory(fp1)).toHaveLength(2);
      expect(getTitleHistory(fp2)).toHaveLength(0);
    });

    it("persists title history to durable disk storage and loads on cold access", () => {
      const fp = "durable_test_asset_999";
      recordTitleHistory(fp, ["Durable Title 1", "Durable Title 2"]);
      expect(getTitleHistory(fp)).toContain("Durable Title 1");

      // Verify file exists on disk in data/title_history.json
      const historyFile = path.join(process.cwd(), "data", "title_history.json");
      expect(fs.existsSync(historyFile)).toBe(true);
      const content = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
      expect(content[fp]).toContain("Durable Title 1");
    });
  });

  describe("4. Strategy Diversity & Evidence-Grounded Strategy Validation", () => {
    const structured = buildStructuredTitleEvidence(mockMedia, mockEvidence, mockVision);

    it("enforces strategy diversity by accepting at most one candidate per strategy", () => {
      const candidates: TitleOption[] = [
        {
          title: "Fine Time Music | Tamil Romantic Status",
          strategy: "search_focused",
          formula: "Search Keywords",
          characterCount: 39,
          isTruncated: false,
        },
        {
          title: "Fine Time Music Status Clip 2026",
          strategy: "search_focused", // Second search-focused option
          formula: "Search Keywords 2",
          characterCount: 32,
          isTruncated: false,
        },
        {
          title: "Golden Earrings Sparkle in Tender Romance",
          strategy: "scene_focused",
          formula: "Visual Scene",
          characterCount: 41,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(candidates, mockEvidence, structured, [], mockVision);
      expect(filtered.length).toBe(2);
      expect(filtered[0].strategy).toBe("search_focused");
      expect(filtered[1].strategy).toBe("scene_focused");
    });

    it("rejects audio_focused candidates when meaningConfidence is unverified", () => {
      // Audio is Tamil without bilingual verification -> meaningConfidence is unverified
      expect(structured.audioLanguage.meaningConfidence).toBe("unverified");

      const candidates: TitleOption[] = [
        {
          title: "Sweet Tamil Melody Lyrics Spoken",
          strategy: "audio_focused",
          formula: "Audio Lyrics",
          characterCount: 32,
          isTruncated: false,
        },
        {
          title: "Fine Time Soulful Whisper",
          strategy: "clean_concise",
          formula: "Clean & Concise",
          characterCount: 25,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(candidates, mockEvidence, structured, [], mockVision);
      // audio_focused must be rejected because meaningConfidence is unverified!
      expect(filtered.length).toBe(1);
      expect(filtered[0].strategy).toBe("clean_concise");
      expect(filtered[0].title).toBe("Fine Time Soulful Whisper");
    });

    it("rejects scene_focused candidates that claim ungrounded visual specifics not present in vision frames", () => {
      const candidates: TitleOption[] = [
        {
          title: "Fine Time Music Drone 4K Flight", // Drone is ungrounded
          strategy: "scene_focused",
          formula: "Scene Focus",
          characterCount: 32,
          isTruncated: false,
        },
        {
          title: "Woman with Golden Earrings in Soft Light", // Attested in vision
          strategy: "scene_focused",
          formula: "Scene Focus",
          characterCount: 41,
          isTruncated: false,
        },
      ];

      const filtered = filterAndDeduplicateTitles(candidates, mockEvidence, structured, [], mockVision);
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe("Woman with Golden Earrings in Soft Light");
    });
  });
});

