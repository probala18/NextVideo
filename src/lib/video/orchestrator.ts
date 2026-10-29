/**
 * src/lib/video/orchestrator.ts
 * Autonomous Orchestration Engine: Chains all 11 YouTube Agent Skills into a consolidated analysis report.
 */

import { MediaMetadata, ConsolidatedAnalysisReport } from "../types/videoWorkflow";
import { TranscriptionResult } from "./transcriber";
import { scoreHook } from "../skills/hookscore";
import { checkTitle } from "../skills/title";
import { generateEdl } from "../skills/deadair";
import { generateChapters } from "../skills/chapters";
import { parseRetentionCsv, analyzeRetention } from "../skills/retention";
import { rankOutliers } from "../skills/swipe";
import { identifyShortCandidates, renderEditedVideo, extractKeyFrames } from "./processor";
import { generateVideoWithAI, generatePackagingWithAI } from "../openrouter";
import { analyzeVideoWithComputerVision } from "./vision";
import { assembleVideoUnderstanding } from "./understanding";
import { generateYouTubeThumbnails, ThumbnailConceptInput } from "./thumbnail-generator";
import { generatePublishingPackageWithAI } from "./generator";
import { youtubePatternModel } from "../models/youtube-pattern-model";
import { collectNicheResearch, ResearchReport } from "../research/collector";
import fs from "fs";

export async function runAutonomousVideoWorkflow(params: {
  jobId: string;
  assetId: string;
  media: MediaMetadata;
  sourceFilePath: string;
  transcript: TranscriptionResult;
  retentionCsvPath?: string;
  channelId?: string;
  userHintTopic?: string;
  userTitle?: string;
  userThumbnailText?: string;
}): Promise<ConsolidatedAnalysisReport> {
  const {
    jobId,
    assetId,
    media,
    sourceFilePath,
    transcript,
    retentionCsvPath,
    userHintTopic,
    userTitle,
    userThumbnailText,
  } = params;

  // 0. Computer Vision Analysis (Frame sampling, deduplication, deterministic properties)
  const vision = await analyzeVideoWithComputerVision({
    assetId,
    sourceFilePath,
    media,
    transcriptCues: transcript.cues,
    hintTopic: userHintTopic || userTitle,
  });

  // 1. Video Understanding & Evidence Assembly (Grounded topic, multimodal fusion & injection defense)
  const understanding = assembleVideoUnderstanding({
    media,
    vision,
    transcript,
    creatorHintTopic: userHintTopic || userTitle,
  });

  const topic = understanding.actualTopic;

  // 2. Real YouTube Research (Using configured YOUTUBE_API_KEY)
  let research: ResearchReport | undefined = undefined;
  try {
    if (!topic || !understanding.isAdequatelyUnderstood) throw new Error("Video evidence is insufficient for relevant research.");
    research = await collectNicheResearch({
      nicheOrTopic: topic,
      maxVideos: 10,
    });
  } catch (err: any) {
    console.warn("YouTube Data API research failed gracefully:", err.message);
  }

  // 3. Hook Analysis (yt-script)
  const openingCues = transcript.cues.filter((c) => c.start <= 15.0);
  const first15Speech =
    openingCues.map((c) => c.text).join(" ").trim() ||
    transcript.cues.slice(0, 2).map((c) => c.text).join(" ").trim();

  const hookScore = scoreHook(first15Speech);

  // Proposed alternative hook formulas based on yt-script rules
  const proposedHooks = [] as string[];

  // 4. Title & Thumbnail Packaging
  const currentTitle = userTitle || (understanding.isAdequatelyUnderstood ? topic : "");
  const currentThumb = userThumbnailText || "";
  const titleAudit = checkTitle(currentTitle, currentThumb);

  // Thumbnail Concepts
  const thumbnailConcepts: ThumbnailConceptInput[] = [];

  // 5. Generate Real Visual Thumbnails (1280x720 16:9 compliant files)
  const generatedThumbnails = await generateYouTubeThumbnails({
    assetId,
    topic: topic || "",
    candidateFrames: vision.sampledFrames,
    concepts: thumbnailConcepts,
  });

  // 6. Generate Full Publishing Package with Evidence Grounding & Real Research
  const publishingPackage = await generatePublishingPackageWithAI({
    media,
    evidence: understanding,
    vision,
    thumbnails: generatedThumbnails,
    research,
  });

  const alternativeTitles = publishingPackage.titles.map((t) => t.title);

  // 7. Edit Decision List (yt-edit)
  const edl = generateEdl(transcript.cues, 0.45);

  // 8. Render or Export Edited Video
  const editRender = await renderEditedVideo(assetId, sourceFilePath, edl);

  // 9. Shorts Candidates (yt-shorts)
  const shortCandidates = identifyShortCandidates(transcript.cues, media.durationSeconds);

  // 10. Chapters (yt-chapters)
  const chapters = generateChapters(transcript.cues, 6);

  // 11. Retention Analysis (yt-retention)
  let retentionDiagnosis: ConsolidatedAnalysisReport["retentionDiagnosis"] = {
    hasRealAnalytics: false,
    predictedPacingRisks: [
      `Opening 15 seconds: Hook score is ${hookScore.verdict}/100 (${hookScore.band}). Address the viewer earlier.`,
      `Pacing: ${edl.cuts.length} cuts identified totaling ${edl.removed}s of dead air or retakes.`,
    ],
  };

  if (retentionCsvPath && fs.existsSync(retentionCsvPath)) {
    try {
      const csvContent = await fs.promises.readFile(retentionCsvPath, "utf-8");
      const points = parseRetentionCsv(csvContent);
      if (points.length >= 8) {
        const analysis = analyzeRetention(points, media.durationSeconds, transcript.cues);
        retentionDiagnosis = {
          hasRealAnalytics: true,
          analysis,
          predictedPacingRisks: analysis.observations,
        };
      }
    } catch {
      // Fallback to heuristic pacing risks
    }
  }

  // 12. SEO & Discovery
  const seo = {
    suggestedTitle: publishingPackage.recommendedTitle || alternativeTitles[0] || currentTitle,
    description: publishingPackage.description,
    tags: publishingPackage.tags,
    hashtags: [`#${topic.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15)}`, "#tutorial", "#youtube"],
    searchQueryOpportunities: [
      `${topic.toLowerCase()} tutorial for beginners`,
      `how to learn ${topic.toLowerCase()} fast`,
      `best ${topic.toLowerCase()} tips 2026`,
    ],
  };

  // 13. Public Niche Outlier Research (Grounded in real YouTube Data API results)
  let nicheResearch: any;
  if (research && research.videos && research.videos.length > 0) {
    const researchVideosForRanking = research.videos.map((v) => ({
      channel: v.channelTitle,
      title: v.title,
      views: v.viewCount,
    }));
    nicheResearch = rankOutliers(researchVideosForRanking, 1.5);
  } else {
    nicheResearch = {
      outliers: [],
      medianViews: 0,
      notes: [
        "Live YouTube research is unavailable: YOUTUBE_API_KEY is not configured or API quota was exhausted. No competitor videos are fabricated.",
      ],
    };
  }

  // 14. Priority Recommendation & Follow-up Content Plan (yt-plan)
  let highestPriority = `Apply the ${edl.cuts.length} EDL cuts to remove ${edl.removed}s of dead air and restarts.`;
  if (hookScore.verdict < 55) {
    highestPriority = `Rewrite the first line: ${hookScore.weakest.fix}. Currently scoring ${hookScore.verdict}/100.`;
  }

  const followUpContentPlan = [
    {
      topic: `Top 3 Costly Mistakes in ${topic}`,
      angle: "Highlight counter-intuitive errors that waste time",
      format: "Long-form" as const,
    },
    {
      topic: `${topic} Shortcut That Saves 30 Minutes`,
      angle: "Single tactical trick demonstrated in 45 seconds",
      format: "Shorts" as const,
    },
  ];

  return {
    jobId,
    assetId,
    generatedAt: new Date().toISOString(),
    media,
    transcript: {
      source: transcript.source,
      text: transcript.text,
      cuesCount: transcript.cues.length,
      cues: transcript.cues,
    },
    hookAnalysis: {
      first15SecondsSpeech: first15Speech,
      hookScore,
      proposedAlternativeHooks: proposedHooks,
      rewrittenOpening: proposedHooks[0],
    },
    packaging: {
      titleAudit,
      alternativeTitles,
      thumbnailConcepts,
    },
    editing: {
      edl,
      renderedEditedVideoPath: editRender.renderedVideoPath,
      renderedDownloadUrl: editRender.renderedDownloadUrl,
      edlDownloadUrl: editRender.edlDownloadUrl,
      renderStatus: editRender.renderStatus,
      renderNotes: editRender.renderNotes,
    },
    shorts: {
      candidates: shortCandidates,
      renderedCount: shortCandidates.filter((s) => s.status === "rendered").length,
    },
    chapters,
    retentionDiagnosis,
    seo,
    nicheResearch,
    highestPriorityRecommendation: highestPriority,
    followUpContentPlan,
    vision,
    understanding,
    publishingPackage,
  };
}
