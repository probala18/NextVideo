/**
 * retention.ts - Audience retention analyzer for YouTube Studio CSV exports.
 * Ported from .agents/skills/yt-retention/retention.py
 * Under MIT License (c) 2024 Jake Schincariol
 */

import { TranscriptCue } from "./deadair";

export interface RetentionPoint {
  position: number;
  retentionPercent: number;
}

export interface RetentionCliff {
  fromPosition: number;
  toPosition: number;
  percentLost: number;
  atSeconds?: number;
  spokenContext?: string;
}

export interface RetentionAnalysisResult {
  pointsCount: number;
  startPercent: number;
  endPercent: number;
  hookLeakPercent: number;
  hookVerdict: "healthy" | "leaking" | "severe";
  cliffs: RetentionCliff[];
  slidePerUnit: number;
  observations: string[];
}

export function parseRetentionCsv(csvContent: string): RetentionPoint[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const points: RetentionPoint[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((c) => c.trim().replace(/%/g, "").replace(/"/g, ""));
    const num0 = parseFloat(parts[0]);
    const num1 = parseFloat(parts[1]);

    if (!isNaN(num0) && !isNaN(num1)) {
      points.push({ position: num0, retentionPercent: num1 });
    }
  }

  return points;
}

export function analyzeRetention(
  points: RetentionPoint[],
  durationSeconds?: number,
  cues?: TranscriptCue[]
): RetentionAnalysisResult {
  if (!points || points.length < 8) {
    throw new Error("Could not read at least 8 retention data points from CSV data.");
  }

  const xs = points.map((p) => p.position);
  const ys = points.map((p) => p.retentionPercent);

  const pctAxis = Math.max(...xs) <= 100.5;
  const dur = durationSeconds;

  const toSeconds = (x: number): number | undefined => {
    if (!pctAxis) return x;
    if (dur) return (x / 100.0) * dur;
    return undefined;
  };

  const start = ys[0] || 100.0;
  const cutoff = !pctAxis ? 30.0 : dur ? (30.0 / dur) * 100 : 10.0;

  const openingPoints = points.filter((p) => p.position <= cutoff).map((p) => p.retentionPercent);
  const hookEnd = openingPoints.length > 0 ? Math.min(...openingPoints) : start;
  const hookLeak = Math.max(0, start - hookEnd);

  const drops: { rate: number; x0: number; x1: number; d: number }[] = [];

  for (let i = 1; i < points.length; i++) {
    const d = ys[i - 1] - ys[i];
    const span = xs[i] - xs[i - 1] || 1;
    drops.push({ rate: d / span, x0: xs[i - 1], x1: xs[i], d });
  }

  drops.sort((a, b) => b.rate - a.rate);

  const cliffs: RetentionCliff[] = drops
    .filter((drop) => drop.d > 0.8)
    .slice(0, 5)
    .map((drop) => {
      const atSec = toSeconds(drop.x0);
      let spokenContext: string | undefined = undefined;

      if (atSec !== undefined && cues && cues.length > 0) {
        const nearCues = cues.filter((q) => q.start <= atSec + 4 && q.end >= atSec - 4);
        spokenContext = nearCues.map((q) => q.text).join(" ").trim().slice(0, 140) || undefined;
      }

      return {
        fromPosition: Math.round(drop.x0 * 100) / 100,
        toPosition: Math.round(drop.x1 * 100) / 100,
        percentLost: Math.round(drop.d * 100) / 100,
        atSeconds: atSec !== undefined ? Math.round(atSec * 10) / 10 : undefined,
        spokenContext,
      };
    });

  const midDrops = drops.filter((drop) => drop.x0 > cutoff).map((drop) => drop.d);
  const slide = midDrops.length > 0 ? midDrops.reduce((a, b) => a + b, 0) / midDrops.length : 0;

  const hookVerdict: "healthy" | "leaking" | "severe" =
    hookLeak < 25 ? "healthy" : hookLeak < 40 ? "leaking" : "severe";

  const observations: string[] = [];

  if (hookVerdict === "healthy") {
    observations.push(`Hook retention is strong (${hookLeak.toFixed(1)}% drop in opening).`);
  } else if (hookVerdict === "leaking") {
    observations.push(`Hook leak detected (${hookLeak.toFixed(1)}% lost in opening). Consider cutting intro fluff.`);
  } else {
    observations.push(`Severe hook drop (${hookLeak.toFixed(1)}% lost in first 30s). Re-record the first sentence.`);
  }

  if (cliffs.length > 0) {
    observations.push(`Identified ${cliffs.length} distinct drop moments (>0.8% loss).`);
  } else {
    observations.push("No steep drop cliffs detected; retention decay is gradual pacing slide.");
  }

  return {
    pointsCount: points.length,
    startPercent: Math.round(start * 10) / 10,
    endPercent: Math.round(ys[ys.length - 1] * 10) / 10,
    hookLeakPercent: Math.round(hookLeak * 100) / 100,
    hookVerdict,
    cliffs,
    slidePerUnit: Math.round(slide * 1000) / 1000,
    observations,
  };
}
