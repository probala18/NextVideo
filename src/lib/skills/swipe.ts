/**
 * swipe.ts - Outlier video ranker by multiple of channel median.
 * Ported from .agents/skills/yt-viral/swipe.py
 * Under MIT License (c) 2024 Jake Schincariol
 */

import { classifyHook } from "./hookscore";

export interface VideoInputItem {
  channel: string;
  title: string;
  views: number;
  url?: string;
  duration?: number | string;
}

export interface VideoOutlier {
  channel: string;
  title: string;
  views: number;
  median: number;
  multiple: number;
  formula: string;
  url?: string;
}

export interface ThinChannel {
  channel: string;
  count: number;
}

export interface SwipeAnalysisResult {
  totalAnalyzed: number;
  channelsCount: number;
  outliers: VideoOutlier[];
  skippedThinChannels: ThinChannel[];
  formulaDistribution: Record<string, number>;
}

export function calculateMedian(numbers: number[]): number {
  if (!numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function rankOutliers(videos: VideoInputItem[], minMultiple: number = 1.5): SwipeAnalysisResult {
  const byChannel: Record<string, VideoInputItem[]> = {};

  for (const v of videos) {
    const ch = v.channel || "Unknown Channel";
    if (!byChannel[ch]) byChannel[ch] = [];
    byChannel[ch].push(v);
  }

  const outliers: VideoOutlier[] = [];
  const thin: ThinChannel[] = [];
  const formulaCounts: Record<string, number> = {};

  for (const [ch, vids] of Object.entries(byChannel)) {
    if (vids.length < 4) {
      thin.push({ channel: ch, count: vids.length });
      continue;
    }

    const views = vids.map((v) => Number(v.views || 0));
    const med = calculateMedian(views);

    if (med <= 0) continue;

    for (const v of vids) {
      const vViews = Number(v.views || 0);
      const mult = vViews / med;

      if (mult >= minMultiple) {
        const { name: formula } = classifyHook(v.title);
        formulaCounts[formula] = (formulaCounts[formula] || 0) + 1;

        outliers.push({
          channel: ch,
          title: v.title,
          views: vViews,
          median: Math.round(med),
          multiple: Math.round(mult * 100) / 100,
          formula,
          url: v.url,
        });
      }
    }
  }

  outliers.sort((a, b) => b.multiple - a.multiple);

  return {
    totalAnalyzed: videos.length,
    channelsCount: Object.keys(byChannel).length,
    outliers,
    skippedThinChannels: thin,
    formulaDistribution: formulaCounts,
  };
}
