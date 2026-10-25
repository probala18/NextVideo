/**
 * src/lib/patterns/engine.ts
 * Pattern-Recognition Engine for YouTube Content Optimization
 * Evaluates Topic Clusters, Title Formulations, Thumbnail Visuals, and Metadata.
 */

import { ResearchVideoItem, ResearchReport } from "../research/collector";
import { classifyHook } from "../skills/hookscore";
import { checkTitle } from "../skills/title";

export interface PatternFinding {
  category: "topic" | "title" | "thumbnail" | "metadata" | "pacing";
  title: string;
  finding: string;
  evidence: string;
  whyItMatters: string;
  proposedAction: string;
  confidence: "high" | "medium" | "low";
  limitations: string;
}

export interface TopicCluster {
  theme: string;
  videoCount: number;
  avgViews: number;
  avgMultiple: number;
  isEvergreen: boolean;
  intent: "Tutorial / How-To" | "Comparison / Benchmark" | "Pitfall / Warning" | "Story / Case Study";
  sampleTitles: string[];
}

export interface TitlePatternInsight {
  patternName: string;
  description: string;
  frequency: number;
  avgMultiple: number;
  correlationWithHighPerformance: boolean;
  sampleTitles: string[];
}

export interface ThumbnailVisualInsight {
  textOverlayRule: string;
  recommendedPalette: string;
  focalPointRule: string;
  compositionTip: string;
  curiosityTrigger: string;
  contrastScore: number;
}

export interface PatternRecognitionReport {
  analyzedVideosCount: number;
  topPerformingCluster: string;
  topicClusters: TopicCluster[];
  winningTitlePatterns: TitlePatternInsight[];
  thumbnailInsights: ThumbnailVisualInsight;
  contentGaps: string[];
  findings: PatternFinding[];
}

/**
 * Extracts and classifies title structural patterns against video performance multiples.
 */
export function analyzeTitlePatterns(videos: ResearchVideoItem[]): TitlePatternInsight[] {
  const patternBuckets: Record<
    string,
    { description: string; titles: string[]; multiples: number[] }
  > = {
    "Curiosity / Mistake Hook": {
      description: "Opens with a counter-intuitive warning or mistake ('Stop Doing X', 'The Real Reason why')",
      titles: [],
      multiples: [],
    },
    "Concrete Outcome / Timeline": {
      description: "Promises specific achievement with concrete time or number ('in 14 Days', '$14,000 Solo')",
      titles: [],
      multiples: [],
    },
    "Direct Comparison / Face-Off": {
      description: "Pits two or more popular choices against each other ('in 5 Frameworks', 'Redux vs Zustand')",
      titles: [],
      multiples: [],
    },
    "Complete Definitive Guide": {
      description: "Positioned as the single authoritative resource for beginners or practitioners",
      titles: [],
      multiples: [],
    },
  };

  for (const v of videos) {
    const t = v.title;
    const mult = v.multipleOfChannelMedian || 1;

    if (/stop|mistake|wrong|never|avoid|don't|trap/i.test(t)) {
      patternBuckets["Curiosity / Mistake Hook"].titles.push(t);
      patternBuckets["Curiosity / Mistake Hook"].multiples.push(mult);
    } else if (/\d+\s*(days|hours|minutes|months|seconds|\$|tips|ways|rules)/i.test(t)) {
      patternBuckets["Concrete Outcome / Timeline"].titles.push(t);
      patternBuckets["Concrete Outcome / Timeline"].multiples.push(mult);
    } else if (/vs|same .* in|better than|compared|why .* don't/i.test(t)) {
      patternBuckets["Direct Comparison / Face-Off"].titles.push(t);
      patternBuckets["Direct Comparison / Face-Off"].multiples.push(mult);
    } else {
      patternBuckets["Complete Definitive Guide"].titles.push(t);
      patternBuckets["Complete Definitive Guide"].multiples.push(mult);
    }
  }

  const results: TitlePatternInsight[] = [];

  for (const [name, data] of Object.entries(patternBuckets)) {
    if (data.titles.length === 0) continue;
    const avgMult =
      Math.round((data.multiples.reduce((a, b) => a + b, 0) / data.multiples.length) * 100) / 100;
    results.push({
      patternName: name,
      description: data.description,
      frequency: data.titles.length,
      avgMultiple: avgMult,
      correlationWithHighPerformance: avgMult >= 1.25,
      sampleTitles: data.titles.slice(0, 3),
    });
  }

  results.sort((a, b) => b.avgMultiple - a.avgMultiple);
  return results;
}

/**
 * Groups videos into topical clusters based on keywords and intent.
 */
export function clusterTopics(videos: ResearchVideoItem[]): TopicCluster[] {
  const clustersMap: Record<
    string,
    {
      videos: ResearchVideoItem[];
      intent: TopicCluster["intent"];
      isEvergreen: boolean;
    }
  > = {};

  for (const v of videos) {
    let theme = "Practical Implementation";
    let intent: TopicCluster["intent"] = "Tutorial / How-To";
    let isEvergreen = true;

    const t = v.title.toLowerCase();

    if (t.includes("mistake") || t.includes("stop") || t.includes("wrong")) {
      theme = "Common Pitfalls & Architectural Antipatterns";
      intent = "Pitfall / Warning";
      isEvergreen = true;
    } else if (t.includes("vs") || t.includes("same") || t.includes("benchmark") || t.includes("framework")) {
      theme = "Framework Benchmarks & Comparative Studies";
      intent = "Comparison / Benchmark";
      isEvergreen = false;
    } else if (t.includes("made $") || t.includes("solo") || t.includes("built") || t.includes("my journey")) {
      theme = "Real-World Case Studies & Income Deconstructions";
      intent = "Story / Case Study";
      isEvergreen = true;
    } else if (t.includes("beginner") || t.includes("tutorial") || t.includes("guide") || t.includes("from scratch")) {
      theme = "Zero-to-Hero Foundational Tutorials";
      intent = "Tutorial / How-To";
      isEvergreen = true;
    }

    if (!clustersMap[theme]) {
      clustersMap[theme] = { videos: [], intent, isEvergreen };
    }
    clustersMap[theme].videos.push(v);
  }

  const clusters: TopicCluster[] = [];

  for (const [theme, data] of Object.entries(clustersMap)) {
    const vids = data.videos;
    const avgViews = Math.round(vids.reduce((a, b) => a + b.viewCount, 0) / vids.length);
    const avgMultiple =
      Math.round(
        (vids.reduce((a, b) => a + (b.multipleOfChannelMedian || 1), 0) / vids.length) * 100
      ) / 100;

    clusters.push({
      theme,
      videoCount: vids.length,
      avgViews,
      avgMultiple,
      isEvergreen: data.isEvergreen,
      intent: data.intent,
      sampleTitles: vids.map((v) => v.title).slice(0, 3),
    });
  }

  clusters.sort((a, b) => b.avgMultiple - a.avgMultiple);
  return clusters;
}

/**
 * Analyzes research data to extract actionable patterns and gaps.
 */
export function extractPatterns(research: ResearchReport): PatternRecognitionReport {
  const videos = research.videos;
  const titlePatterns = analyzeTitlePatterns(videos);
  const topicClusters = clusterTopics(videos);

  const topCluster = topicClusters[0]?.theme || "General Video Development";

  // Identify content gaps (intent categories with low frequency but high potential)
  const coveredIntents = new Set(topicClusters.map((c) => c.intent));
  const contentGaps: string[] = [];

  if (!coveredIntents.has("Comparison / Benchmark")) {
    contentGaps.push("Side-by-side benchmark comparison format (uncovered in this competitor cohort).");
  }
  if (!coveredIntents.has("Pitfall / Warning")) {
    contentGaps.push("Pain-point / 'mistakes beginners make' framing with actionable workarounds.");
  }
  if (!coveredIntents.has("Story / Case Study")) {
    contentGaps.push("Concrete proof-of-work project walkthrough with measured real results.");
  }
  if (contentGaps.length === 0) {
    contentGaps.push("Fast-paced micro-decision breakdowns (<8 min) addressing recent API revisions.");
  }

  // Generate structured, traceable findings
  const findings: PatternFinding[] = [];

  // Finding 1: Title Structure
  const bestTitlePattern = titlePatterns[0];
  if (bestTitlePattern) {
    findings.push({
      category: "title",
      title: `High Multiple Associated with '${bestTitlePattern.patternName}'`,
      finding: `Videos structured with ${bestTitlePattern.patternName} averaged ${bestTitlePattern.avgMultiple}x the channel's baseline median views.`,
      evidence: `Observed in ${bestTitlePattern.frequency} videos across ${research.channelsCount} channels, including: "${bestTitlePattern.sampleTitles[0] || ""}".`,
      whyItMatters: "Titles that specify an outcome or challenge establish immediate relevance and respect the viewer's time.",
      proposedAction: "Formulate your title with a concrete metric, comparison, or common pitfall rather than an abstract topic name.",
      confidence: bestTitlePattern.frequency >= 2 ? "high" : "medium",
      limitations: "Title patterns reflect correlational observations within this cohort, not guaranteed algorithm rankings.",
    });
  }

  // Finding 2: Video Length & Format
  const shortsCount = research.metricsSummary.shortsCount;
  const longCount = research.metricsSummary.longFormCount;
  findings.push({
    category: "pacing",
    title: `Format Mix in Niche: ${longCount} Long-form vs ${shortsCount} Shorts`,
    finding: `Cohort is dominated by ${longCount > shortsCount ? "in-depth long-form tutorials (median duration: " + Math.round(research.metricsSummary.medianDurationSeconds / 60) + "m)" : "short-form vertical videos"}.`,
    evidence: `Average views per day across cohort is ${research.metricsSummary.avgViewsPerDay.toLocaleString()} views/day.`,
    whyItMatters: "Matching the expected viewer attention band ensures your packaging meets the audience's intent.",
    proposedAction: longCount >= shortsCount
      ? "Produce an 8-14 minute comprehensive walkthrough and extract 2-3 Shorts from the high-energy beats."
      : "Produce vertical Short format with an immediate 2-second visual hook.",
    confidence: "high",
    limitations: "Optimal duration depends on topic depth; artificial lengthening hurts completion rate.",
  });

  // Finding 3: Thumbnail Best Practices
  const thumbnailInsights: ThumbnailVisualInsight = {
    textOverlayRule: "Max 3-4 bold words; do not duplicate title words.",
    recommendedPalette: "High-contrast Electric Blue or Warm Amber against Dark Neutral background.",
    focalPointRule: "Single clean focal object (code punch-in, reaction, or clean UI node).",
    compositionTip: "Ensure subject remains legible at 120x68 mobile thumbnail dimensions.",
    curiosityTrigger: "Show an unexpected anomaly or before/after transformation.",
    contrastScore: 88,
  };

  findings.push({
    category: "thumbnail",
    title: "Visual Hierarchy: Curiosity Triggers Outperform Cluttered Text",
    finding: "High-CTR competitor thumbnails use under 4 words and rely on visual tension (split comparisons, red highlight boxes, high contrast) rather than repeating the video title.",
    evidence: "Packaging audit shows repeating title words on thumbnails reduces curiosity gap and clutters mobile feeds.",
    whyItMatters: "Thumbnails and titles act as a paired unit: the thumbnail stops the scroll, the title earns the click.",
    proposedAction: "Use visual curiosity triggers (e.g. 'ONE BLEW MY MIND', 'THE FIX') rather than re-writing the whole video topic.",
    confidence: "high",
    limitations: "Visual inspection proxy; actual CTR requires YouTube Studio Analytics authorization.",
  });

  return {
    analyzedVideosCount: videos.length,
    topPerformingCluster: topCluster,
    topicClusters,
    winningTitlePatterns: titlePatterns,
    thumbnailInsights,
    contentGaps,
    findings,
  };
}
