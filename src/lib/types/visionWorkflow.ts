/**
 * src/lib/types/visionWorkflow.ts
 * Type definitions for Computer Vision analysis, Video Understanding evidence assembly,
 * and AI publishing asset generation.
 */

export interface SampledFrameProperties {
  brightness: "dark" | "balanced" | "bright" | "unknown";
  dominantColors: string[];
  contrastScore: number | null; // 0 - 100; null when not measured
  complexityScore: number | null; // 0 - 100; null when not measured
  focalPoint: string;
  detectedOnScreenText: string[];
  thumbnailSuitabilityScore: number | null; // 0 - 100; null when not measured
}

export interface SampledFrame {
  index: number;
  timestampSeconds: number;
  relativePercent: number; // 0 to 100%
  framePath: string;
  dataUrl?: string;
  label: string;
  sceneType:
    | "talking_head"
    | "screencast"
    | "split_screen"
    | "presentation"
    | "action_demo"
    | "b_roll"
    | "unknown";
  properties: SampledFrameProperties;
  semanticDescription?: string;
}

export interface VisionAnalysisReport {
  sampledFrames: SampledFrame[];
  detectedSubjects: string[];
  detectedEnvironments: string[];
  visualPacing: "rapid" | "moderate" | "static";
  onScreenTextCues: Array<{
    timestampSeconds: number;
    text: string;
    confidence: number | null;
  }>;
  candidateThumbnailMoments: Array<{
    timestampSeconds: number;
    frameIndex: number;
    headline: string;
    reason: string;
    visualStrength: number | null;
  }>;
  limitations: string[];
  confidenceScore: number | null; // 0 - 100; null when uncalibrated
  modelUsed: string;
  supportsVision: boolean;
}

export interface VideoUnderstandingEvidence {
  actualTopic: string;
  videoSubject?: string;
  videoPurpose?: string;
  contentType?:
    | "romantic_status"
    | "music_video"
    | "lyrics_video"
    | "cinematic_edit"
    | "teaching"
    | "demonstration"
    | "review"
    | "comparison"
    | "interview"
    | "presentation"
    | "narrative"
    | "unknown";
  musicOrAudioCues?: string[];
  primaryActions?: string[];
  demonstratedTechnologies?: string[];
  importantScenes?: Array<{ timestampSeconds: number; description: string }>;
  demonstratedOutcomes?: string[];
  confidence?: number | null;
  summary?: string;
  isAdequatelyUnderstood?: boolean;
  limitationNotice?: string;
  detectedVisualSubjects?: string[];
  primaryValueProposition: string;
  narrativeClimaxSeconds: number;
  targetAudience: string;
  keyTakeaways: string[];
  distinguishingFeatures: string[];
  visualEvidence: Array<{
    timestampSeconds: number;
    observation: string;
    framePath?: string;
  }>;
  audioEvidence: Array<{
    timestampSeconds: number;
    cueText: string;
  }>;
  untrustedInputProtection: boolean;
}

export interface GeneratedThumbnail {
  id: string;
  variationName: string; // e.g. "Curiosity & High Contrast", "Outcome & Proof", "Focal Close-Up"
  headline: string; // 2-4 punchy words
  imagePath: string;
  imageUrl: string;
  width: number; // 1280
  height: number; // 720
  aspectRatio: "16:9";
  format: "png" | "jpg";
  sizeBytes: number;
  source: "video_frame" | "frame_composition" | "vision_composite" | "ai_image_model";
  selected: boolean;
  promptUsed: string;
  colorPalette: string;
  focalPoint: string;
  rationale: string;
}

export interface PublishingEvidenceGrounding {
  assetType: "title" | "description" | "tags" | "category" | "chapters" | "thumbnail";
  value: string;
  rationale: string;
  supportingTimestamps: number[];
  supportingScenes: string[];
  confidence: number;
}

export interface TitleOption {
  title: string;
  formula: string;
  characterCount: number;
  isTruncated: boolean;
  fitReason?: string;
  evidenceSupport?: string;
  scores?: {
    contentRelevance: number | null;
    specificity: number | null;
    readability: number | null;
    searchIntent: number | null;
    comparablePatternSimilarity: number | null;
    overallScore: number | null;
  };
  rankingExplanation?: string;
}

export interface FullPublishingPackage {
  titles: TitleOption[];
  recommendedTitle: string;
  recommendedTitleReason: string;
  description: string;
  tags: string[];
  suggestedCategory: {
    id: string;
    name: string;
    rationale: string;
  };
  chapters: Array<{
    timecode: string;
    timestampSeconds: number;
    title: string;
    visualSupport: string;
  }>;
  thumbnails: GeneratedThumbnail[];
  selectedThumbnailId: string;
  evidenceGrounding: PublishingEvidenceGrounding[];
  modelUsed: string;
  generatedAt: string;
  summary?: string;
  isAdequatelyUnderstood?: boolean;
  limitationNotice?: string;
  researchSummary?: {
    isLiveApiData: boolean;
    videosAnalyzedCount: number;
    notice: string;
  };
}
