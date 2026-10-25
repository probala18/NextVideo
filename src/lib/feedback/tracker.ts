/**
 * src/lib/feedback/tracker.ts
 * Learning & Feedback Loop System
 * Tracks recommendation outcomes, approved edits, publication milestones, and performance snapshots.
 */

import fs from "fs";
import path from "path";

export interface OptimizationRecord {
  id: string;
  createdAt: string;
  assetId: string;
  originalTitle: string;
  approvedTitle: string;
  originalDescription?: string;
  approvedDescription?: string;
  approvedTags?: string[];
  appliedCutsCount: number;
  timeSavedSeconds: number;
  modelVersionUsed: string;
  providerUsed: string;
  publishedToYouTube: boolean;
  publishedVideoId?: string;
  publishedAt?: string;
  publishedPrivacy?: "public" | "private" | "unlisted";
  subsequentSnapshots: {
    recordedAt: string;
    daysActive: number;
    views: number;
    likes: number;
    comments: number;
    impressions?: number;
    ctrPercent?: number;
    avgViewDurationSecs?: number;
  }[];
  evaluationNotes: string[];
}

const FEEDBACK_DIR = path.join(process.cwd(), "data", "feedback");
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, "optimization_history.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(FEEDBACK_DIR)) {
    fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
  }
}

/**
 * Loads all historical optimization records.
 */
export function getOptimizationHistory(): OptimizationRecord[] {
  ensureDirectoryExists();
  if (!fs.existsSync(FEEDBACK_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(FEEDBACK_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves or updates an optimization outcome record.
 */
export function recordApprovedOptimization(record: Omit<OptimizationRecord, "id" | "createdAt" | "subsequentSnapshots" | "evaluationNotes">): OptimizationRecord {
  ensureDirectoryExists();
  const history = getOptimizationHistory();

  const newRecord: OptimizationRecord = {
    ...record,
    id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    subsequentSnapshots: [],
    evaluationNotes: [
      `User approved optimizations using ${record.providerUsed} (${record.modelVersionUsed}).`,
      `Applied ${record.appliedCutsCount} timeline cuts saving ${Math.round(record.timeSavedSeconds)}s.`,
    ],
  };

  history.unshift(newRecord);
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(history.slice(0, 100), null, 2), "utf-8");
  return newRecord;
}

/**
 * Appends a performance snapshot to a published video's learning record.
 */
export function recordSubsequentPerformance(
  recordId: string,
  snapshot: {
    views: number;
    likes: number;
    comments: number;
    impressions?: number;
    ctrPercent?: number;
    avgViewDurationSecs?: number;
  }
): OptimizationRecord | null {
  ensureDirectoryExists();
  const history = getOptimizationHistory();
  const idx = history.findIndex((r) => r.id === recordId || r.publishedVideoId === recordId);
  if (idx === -1) return null;

  const rec = history[idx];
  const publishedMs = rec.publishedAt ? new Date(rec.publishedAt).getTime() : new Date(rec.createdAt).getTime();
  const daysActive = Math.max(0.5, Math.round(((Date.now() - publishedMs) / 86400000) * 10) / 10);

  rec.subsequentSnapshots.push({
    recordedAt: new Date().toISOString(),
    daysActive,
    ...snapshot,
  });

  // Calculate learning insights
  if (rec.subsequentSnapshots.length >= 2) {
    const first = rec.subsequentSnapshots[0];
    const latest = rec.subsequentSnapshots[rec.subsequentSnapshots.length - 1];
    const deltaViews = latest.views - first.views;
    const viewVelocityPerDay = Math.round(deltaViews / Math.max(1, latest.daysActive - first.daysActive));

    rec.evaluationNotes.push(
      `Performance tracked over ${latest.daysActive} days: current velocity is ~${viewVelocityPerDay} views/day.`
    );
  }

  history[idx] = rec;
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(history, null, 2), "utf-8");
  return rec;
}

/**
 * Convenient aliases for agent and API workflows
 */
export function saveOptimizationRecord(params: {
  channelId?: string;
  videoTitle: string;
  targetNiche?: string;
  approvedTitle: string;
  approvedDescription?: string;
  approvedTags?: string[];
  cutsApplied?: number;
  deadAirSecondsSaved?: number;
  modelUsed?: string;
  providerUsed?: string;
}) {
  const rec = recordApprovedOptimization({
    assetId: params.channelId || "default_channel",
    originalTitle: params.videoTitle,
    approvedTitle: params.approvedTitle,
    approvedDescription: params.approvedDescription,
    approvedTags: params.approvedTags,
    appliedCutsCount: params.cutsApplied || 0,
    timeSavedSeconds: params.deadAirSecondsSaved || 0,
    modelVersionUsed: params.modelUsed || "default",
    providerUsed: params.providerUsed || "OpenRouter",
    publishedToYouTube: false,
  });
  return {
    ...rec,
    recordId: rec.id,
  };
}

export function recordPerformanceSnapshot(params: {
  recordId: string;
  publishedVideoId?: string;
  views: number;
  impressions?: number;
  ctrPercent?: number;
  watchTimeMinutes?: number;
  retentionPercentAt30s?: number;
}) {
  const updated = recordSubsequentPerformance(params.recordId, {
    views: params.views,
    likes: Math.round(params.views * 0.04),
    comments: Math.round(params.views * 0.005),
    impressions: params.impressions,
    ctrPercent: params.ctrPercent,
    avgViewDurationSecs: params.retentionPercentAt30s ? Math.round(params.retentionPercentAt30s * 3) : undefined,
  });
  if (!updated) return null;
  if (params.publishedVideoId) {
    updated.publishedVideoId = params.publishedVideoId;
    updated.publishedToYouTube = true;
  }
  return {
    ...updated,
    subsequentPerformance: updated.subsequentSnapshots[updated.subsequentSnapshots.length - 1],
  };
}

export function getChannelHistory(channelOrAssetId?: string) {
  const all = getOptimizationHistory();
  if (!channelOrAssetId) return all;
  return all
    .filter((r) => r.assetId === channelOrAssetId || !channelOrAssetId)
    .map((r) => ({ ...r, recordId: r.id }));
}

