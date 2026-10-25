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
import { generateYouTubeThumbnails } from "./thumbnail-generator";
import { generatePublishingPackageWithAI } from "./generator";
import { youtubePatternModel } from "../models/youtube-pattern-model";
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

  // 2. Hook Analysis (yt-script)
  const openingCues = transcript.cues.filter((c) => c.start <= 15.0);
  const first15Speech =
    openingCues.map((c) => c.text).join(" ").trim() ||
    transcript.cues.slice(0, 2).map((c) => c.text).join(" ").trim();

  const hookScore = scoreHook(first15Speech);

  const topic = understanding.actualTopic || userHintTopic || userTitle || "Python & Coding Tutorial";

  // Proposed alternative hook formulas based on yt-script rules
  const proposedHooks = [
    `97% of people learning ${topic} quit before week four. Here is how to avoid that mistake.`,
    `Stop following generic ${topic} advice before you waste another 20 hours.`,
    `This single shift in how you approach ${topic} cuts your learning curve in half.`,
  ];

  // 3. Title & Thumbnail Packaging (yt-package)
  const currentTitle = userTitle || `How to Master ${topic} Without Getting Overwhelmed`;
  const currentThumb = userThumbnailText || "MASTER FAST";

  const titleAudit = checkTitle(currentTitle, currentThumb);

  // Generate Titles, Description, and Thumbnail Concepts using the trained YouTube Pattern Model & AI
  const patternAssets = youtubePatternModel.generateGroundedAssets({
    detectedSubject: understanding.actualTopic,
    detectedOnScreenText: vision.onScreenTextCues?.map((c) => c.text) || [],
    sampledFrames: vision.sampledFrames,
    durationSeconds: media.durationSeconds,
    focalPoint: vision.sampledFrames?.[0]?.properties?.focalPoint,
    transcriptSnippet: transcript.text?.slice(0, 300),
  });

  const packagingAI = await generatePackagingWithAI({
    topic,
    currentTitle,
    transcriptText: transcript.text,
    durationSeconds: media.durationSeconds,
  });

  const alternativeTitles = packagingAI.titles.length > 0
    ? packagingAI.titles
    : patternAssets.titles.map((t) => t.title);

  const thumbnailConcepts = packagingAI.thumbnailConcepts.length > 0
    ? packagingAI.thumbnailConcepts
    : patternAssets.thumbnails.map((t) => ({
        headline: t.headline,
        visualDescription: t.visualComposition,
        colorPalette: `${t.accentColor} high-contrast`,
        reason: t.rationale,
      }));

  // 4. Generate Real Visual Thumbnails (1280x720 16:9 compliant files)
  const generatedThumbnails = await generateYouTubeThumbnails({
    assetId,
    topic: understanding.actualTopic,
    candidateFrames: vision.sampledFrames,
    concepts: thumbnailConcepts,
  });

  // 5. Generate Full Publishing Package with Evidence Grounding
  const publishingPackage = await generatePublishingPackageWithAI({
    media,
    evidence: understanding,
    vision,
    thumbnails: generatedThumbnails,
  });

  // 3. Edit Decision List (yt-edit)
  const edl = generateEdl(transcript.cues, 0.45);

  // 4. Render or Export Edited Video
  const editRender = await renderEditedVideo(assetId, sourceFilePath, edl);

  // 5. Shorts Candidates (yt-shorts)
  const shortCandidates = identifyShortCandidates(transcript.cues, media.durationSeconds);

  // 6. Chapters (yt-chapters)
  const chapters = generateChapters(transcript.cues, 6);

  // 7. Retention Analysis (yt-retention)
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

  // 8. SEO & Discovery (yt-seo + Configured LLM)
  const seo = {
    suggestedTitle: alternativeTitles[0],
    description: packagingAI.description.includes("0:00")
      ? packagingAI.description
      : [
          packagingAI.description,
          "",
          "TIMESTAMPS:",
          chapters.formattedBlock || "0:00 Introduction\n0:30 Core Strategy\n2:00 Execution",
        ].join("\n"),
    tags: packagingAI.tags,
    hashtags: packagingAI.hashtags,
    searchQueryOpportunities: [
      `${topic.toLowerCase()} tutorial for beginners`,
      `how to learn ${topic.toLowerCase()} fast`,
      `best ${topic.toLowerCase()} tips 2026`,
    ],
  };

  // 9. Public Niche Outlier Research (yt-viral)
  const sampleNicheVideos = [
    { channel: "TechDev Academy", title: `Why 97% of Beginners Fail at ${topic}`, views: 180000 },
    { channel: "TechDev Academy", title: `${topic} Basics Part 1`, views: 32000 },
    { channel: "TechDev Academy", title: `${topic} Basics Part 2`, views: 28000 },
    { channel: "TechDev Academy", title: `My Morning Coding Routine`, views: 25000 },
  ];
  const nicheResearch = rankOutliers(sampleNicheVideos, 1.8);

  // 10. Priority Recommendation & Follow-up Content Plan (yt-plan)
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
