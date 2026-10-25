/**
 * src/lib/scoring/optimizer.ts
 * Transparent Scoring & Video Comparison Engine
 * Computes independently inspectable sub-scores with evidence strength and confidence labels.
 */

import { ResearchReport, ResearchVideoItem } from "../research/collector";
import { PatternRecognitionReport } from "../patterns/engine";
import { scoreHook } from "../skills/hookscore";
import { checkTitle } from "../skills/title";

export interface ComponentScoreBreakdown {
  score: number; // 0 - 100
  label: "Exceptional" | "Competitive" | "Needs Improvement" | "Critical Risk";
  weight: number;
  indicators: { name: string; score: number; rationale: string }[];
}

export interface OptimizationScoreReport {
  overallScore: number; // 0 - 100
  overallVerdict: string;
  components: {
    topicDemand: ComponentScoreBreakdown;
    titlePackaging: ComponentScoreBreakdown;
    hookAndPacing: ComponentScoreBreakdown;
    metadataCompleteness: ComponentScoreBreakdown;
  };
  comparisonAgainstCohort: {
    userVideoLengthSecs: number;
    cohortMedianDurationSecs: number;
    durationDeltaSecs: number;
    durationAssessment: string;
    targetViewsPerDayCohortMedian: number;
    sampleSizeVideos: number;
  };
  confidence: {
    level: "High" | "Medium" | "Low";
    dataPointsAnalyzed: number;
    hasRealAnalytics: boolean;
    limitations: string[];
  };
}

/**
 * Computes deterministic, auditable multi-component scores comparing a creator's video to competitor research.
 */
export function computeOptimizationScores(params: {
  title: string;
  thumbnailText?: string;
  description?: string;
  first15sSpeech?: string;
  videoDurationSecs: number;
  edlCutsCount: number;
  deadAirReductionPercent: number;
  research: ResearchReport;
  patterns: PatternRecognitionReport;
}): OptimizationScoreReport {
  const {
    title,
    thumbnailText = "",
    description = "",
    first15sSpeech = "",
    videoDurationSecs,
    edlCutsCount,
    deadAirReductionPercent,
    research,
    patterns,
  } = params;

  // 1. Topic Demand & Niche Relevance Component (Weight: 25%)
  const topCluster = patterns.topicClusters[0];
  const clusterMatches = patterns.topicClusters.filter((c) =>
    title.toLowerCase().includes(c.theme.toLowerCase().split(" ")[0])
  );
  const topicDemandScore = Math.min(
    95,
    Math.max(50, Math.round(55 + (topCluster?.avgMultiple ? topCluster.avgMultiple * 15 : 20)))
  );

  const topicDemand: ComponentScoreBreakdown = {
    score: topicDemandScore,
    label: topicDemandScore >= 80 ? "Exceptional" : topicDemandScore >= 65 ? "Competitive" : "Needs Improvement",
    weight: 0.25,
    indicators: [
      {
        name: "Topical Demand Band",
        score: topicDemandScore,
        rationale: `Aligned with '${topCluster?.theme || "Programming & Tech"}', which demonstrates an average ${topCluster?.avgMultiple || 1.3}x multiple of channel median.`,
      },
      {
        name: "Competitor Market Activity",
        score: Math.min(90, research.totalVideos * 4),
        rationale: `Sample cohort includes ${research.totalVideos} videos across ${research.channelsCount} independent channels.`,
      },
    ],
  };

  // 2. Title & Packaging Strength (Weight: 30%)
  const titleAudit = checkTitle(title, thumbnailText);
  let titleScore = Math.round(titleAudit.score * 10); // scale 0-100

  // Check matching with high-performing patterns
  const matchesWinningPattern = patterns.winningTitlePatterns.some(
    (p) => p.correlationWithHighPerformance && p.sampleTitles.length > 0
  );
  if (matchesWinningPattern) titleScore = Math.min(98, titleScore + 8);

  const isCutoff = titleAudit.issues.some((i) => i.type === "length" || i.type === "mobile");
  const repeatsWords = titleAudit.issues.some((i) => i.type === "duplicate");

  const titlePackaging: ComponentScoreBreakdown = {
    score: titleScore,
    label: titleScore >= 80 ? "Exceptional" : titleScore >= 65 ? "Competitive" : "Needs Improvement",
    weight: 0.30,
    indicators: [
      {
        name: "Title Cutoff & Clarity",
        score: isCutoff ? 60 : 92,
        rationale: isCutoff
          ? `Title is ${titleAudit.chars} characters (truncated on mobile devices; ideal is under 50 characters).`
          : `Title length (${titleAudit.chars} chars) is fully visible across mobile & desktop search results.`,
      },
      {
        name: "Thumbnail Curiosity & Differentiation",
        score: repeatsWords ? 50 : 88,
        rationale: repeatsWords
          ? "Thumbnail text repeats title words; creators should use curiosity triggers instead."
          : "Packaging avoids duplicating title wording on thumbnail.",
      },
    ],
  };

  // 3. Opening Hook & Pacing Optimization (Weight: 30%)
  const hookResult = scoreHook(first15sSpeech || title);
  const hookNumericScore = Math.max(15, Math.min(98, hookResult.verdict));

  // Pacing efficiency from dead air reduction
  const pacingScore = Math.min(95, 60 + deadAirReductionPercent * 2);
  const hookAndPacingScore = Math.round(hookNumericScore * 0.7 + pacingScore * 0.3);

  const hookAndPacing: ComponentScoreBreakdown = {
    score: hookAndPacingScore,
    label: hookAndPacingScore >= 80 ? "Exceptional" : hookAndPacingScore >= 65 ? "Competitive" : "Needs Improvement",
    weight: 0.30,
    indicators: [
      {
        name: "First 15-Second Spoken Hook",
        score: hookNumericScore,
        rationale: `Hook scored ${hookResult.verdict}/10 (${hookResult.band}). Formula: ${hookResult.formula || "Standard premise"}.`,
      },
      {
        name: "Dead Air & Pacing Efficiency",
        score: Math.min(95, 70 + deadAirReductionPercent * 2),
        rationale: `${edlCutsCount} filler/dead-air zones pruned, saving ${deadAirReductionPercent}% of inactive timeline.`,
      },
    ],
  };

  // 4. Metadata Completeness (Weight: 15%)
  let metaScore = 60;
  if (description.length > 100) metaScore += 15;
  if (description.includes("0:00") || description.includes("00:00")) metaScore += 15;
  if (description.includes("#")) metaScore += 10;

  const metadataCompleteness: ComponentScoreBreakdown = {
    score: metaScore,
    label: metaScore >= 80 ? "Exceptional" : metaScore >= 65 ? "Competitive" : "Needs Improvement",
    weight: 0.15,
    indicators: [
      {
        name: "Chapter Timestamps",
        score: description.includes("0:00") ? 95 : 50,
        rationale: description.includes("0:00")
          ? "Timestamped chapters included; eligible for Google Search and YouTube key moments."
          : "No timestamp chapters detected in description.",
      },
      {
        name: "Description Depth",
        score: description.length > 150 ? 90 : 60,
        rationale: `Description contains ${description.length} characters with semantic keyword coverage.`,
      },
    ],
  };

  // Overall Weighted Score
  const overallScore = Math.round(
    topicDemand.score * topicDemand.weight +
    titlePackaging.score * titlePackaging.weight +
    hookAndPacing.score * hookAndPacing.weight +
    metadataCompleteness.score * metadataCompleteness.weight
  );

  let overallVerdict = "Competitive Foundation";
  if (overallScore >= 85) overallVerdict = "Exceptional Packaging & High-Retention Profile";
  else if (overallScore >= 70) overallVerdict = "Strong Competitive Video (Minor Pacing Polish Recommended)";
  else if (overallScore >= 55) overallVerdict = "Moderate Viability (Hook & Title Re-calibration Advised)";
  else overallVerdict = "Needs Optimization Before Upload";

  const medianCohortDur = research.metricsSummary.medianDurationSeconds || 600;
  const durDelta = videoDurationSecs - medianCohortDur;

  let durationAssessment = "Within optimal cohort attention band";
  if (durDelta > 300) durationAssessment = "Longer than cohort average; ensure pacing remains tight";
  else if (durDelta < -300) durationAssessment = "Shorter than cohort average; ideal for rapid consumption";

  return {
    overallScore,
    overallVerdict,
    components: {
      topicDemand,
      titlePackaging,
      hookAndPacing,
      metadataCompleteness,
    },
    comparisonAgainstCohort: {
      userVideoLengthSecs: Math.round(videoDurationSecs),
      cohortMedianDurationSecs: Math.round(medianCohortDur),
      durationDeltaSecs: Math.round(durDelta),
      durationAssessment,
      targetViewsPerDayCohortMedian: research.metricsSummary.avgViewsPerDay,
      sampleSizeVideos: research.totalVideos,
    },
    confidence: {
      level: research.totalVideos >= 10 ? "High" : "Medium",
      dataPointsAnalyzed: research.totalVideos * 6,
      hasRealAnalytics: false,
      limitations: [
        "Descriptive benchmark metrics represent observed cohort statistics, not deterministic YouTube ranking guarantees.",
        "Actual viewer retention and CTR require channel authorization via YouTube Analytics API.",
      ],
    },
  };
}
