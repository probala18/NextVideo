/**
 * src/lib/types/videoWorkflow.ts
 * Type definitions for the Autonomous Video Analysis, Processing & Publishing Workflow
 */

import { HookScoreResult } from "../skills/hookscore";
import { TitleCheckResult } from "../skills/title";
import { EdlResult, TranscriptCue } from "../skills/deadair";
import { ChaptersResult } from "../skills/chapters";
import { RetentionAnalysisResult } from "../skills/retention";
import { SwipeAnalysisResult } from "../skills/swipe";

export type VideoJobStatus =
  | "uploaded"
  | "queued"
  | "transcribing"
  | "analyzing"
  | "researching"
  | "generating_outputs"
  | "completed"
  | "partial"
  | "waiting_for_configuration"
  | "failed"
  | "cancelled";

export interface MediaMetadata {
  filename: string;
  filesizeBytes: number;
  format: string; // e.g. "mp4", "mov", "webm"
  durationSeconds: number;
  width?: number;
  height?: number;
  aspectRatio?: string; // e.g. "16:9", "9:16"
  frameRate?: number;
  hasVideoTrack: boolean;
  hasAudioTrack: boolean;
  codec?: string;
  inspectedWith: "ffprobe" | "atom_parser" | "fallback";
}

export interface ExtractedFrame {
  timestampSeconds: number;
  framePath: string;
  label: string;
  visualSummary?: string;
}

export interface ShortCandidate {
  id: string;
  rank: number;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  openingLine: string;
  hookScore: HookScoreResult;
  suggestedOnScreenText: string;
  aspectRatio: "9:16";
  renderedClipPath?: string;
  renderedDownloadUrl?: string;
  status: "identified" | "rendered" | "pending_render";
}

export interface ConsolidatedAnalysisReport {
  jobId: string;
  assetId: string;
  generatedAt: string;
  media: MediaMetadata;
  transcript: {
    source: "openrouter" | "whisper_api" | "user_upload" | "synthesized";
    text: string;
    cuesCount: number;
    cues: TranscriptCue[];
  };
  hookAnalysis: {
    first15SecondsSpeech: string;
    hookScore: HookScoreResult;
    proposedAlternativeHooks: string[];
    rewrittenOpening: string;
  };
  packaging: {
    titleAudit: TitleCheckResult;
    alternativeTitles: string[];
    thumbnailConcepts: {
      headline: string;
      visualDescription: string;
      colorPalette: string;
      reason: string;
    }[];
  };
  editing: {
    edl: EdlResult;
    renderedEditedVideoPath?: string;
    renderedDownloadUrl?: string;
    renderStatus: "rendered" | "edl_ready" | "failed" | "unsupported_in_environment";
    renderNotes: string;
  };
  shorts: {
    candidates: ShortCandidate[];
    renderedCount: number;
  };
  chapters: ChaptersResult;
  retentionDiagnosis: {
    hasRealAnalytics: boolean;
    analysis?: RetentionAnalysisResult;
    predictedPacingRisks: string[];
  };
  seo: {
    suggestedTitle: string;
    description: string;
    tags: string[];
    hashtags: string[];
    searchQueryOpportunities: string[];
  };
  nicheResearch?: SwipeAnalysisResult;
  auditConnection?: {
    channelHandle?: string;
    consistencyScore?: number;
    topImprovement: string;
  };
  highestPriorityRecommendation: string;
  followUpContentPlan: {
    topic: string;
    angle: string;
    format: "Shorts" | "Long-form";
  }[];
}

export interface VideoProcessingJob {
  id: string;
  assetId: string;
  filename: string;
  filesizeBytes: number;
  fileUrl: string;
  localFilePath?: string;
  transcriptPath?: string;
  retentionCsvPath?: string;
  channelId?: string;
  status: VideoJobStatus;
  progressPercent: number;
  currentStage: string;
  stagesCompleted: string[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  report?: ConsolidatedAnalysisReport;
  derivedAssets: {
    editedVideoUrl?: string;
    shortsUrls?: string[];
    framesUrls?: string[];
    edlDownloadUrl?: string;
  };
}

export interface YouTubePublishingConfig {
  channelId: string;
  channelTitle?: string;
  privacyStatus: "private" | "unlisted" | "public";
  autoPublishPolicy: "disabled" | "review_first" | "auto_private" | "auto_unlisted";
  hasOAuth: boolean;
  authorizedScopes: string[];
}
