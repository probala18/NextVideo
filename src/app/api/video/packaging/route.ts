import { NextRequest, NextResponse } from "next/server";
import { generatePackagingWithAI } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic = "", currentTitle = "", transcriptText = "", durationSeconds = 600 } = body;

    const cleanTopic = String(topic || currentTitle || "YouTube Video").trim();
    if (!cleanTopic) {
      return NextResponse.json(
        { success: false, error: "Topic or title is required to generate packaging." },
        { status: 400 }
      );
    }

    const { youtubePatternModel } = await import("@/lib/models/youtube-pattern-model");
    const patternAssets = youtubePatternModel.generateGroundedAssets({
      detectedSubject: cleanTopic,
      transcriptSnippet: String(transcriptText || "").slice(0, 300),
      durationSeconds: Number(durationSeconds) || 600,
    });

    const result = await generatePackagingWithAI({
      topic: cleanTopic,
      currentTitle: String(currentTitle || patternAssets.recommendedTitle).trim(),
      transcriptText: String(transcriptText || "").trim(),
      durationSeconds: Number(durationSeconds) || 600,
    });

    // Merge trained model formulas if AI fallback is used
    const finalTitles = result.titles && result.titles.length > 0
      ? result.titles
      : patternAssets.titles.map((t) => t.title);

    const finalSuggestedTitle = result.suggestedTitle && !result.suggestedTitle.includes("YouTube Video")
      ? result.suggestedTitle
      : patternAssets.recommendedTitle;

    // Generate real 1280x720 thumbnail image variations
    const { generateYouTubeThumbnails } = await import("@/lib/video/thumbnail-generator");
    const thumbnails = await generateYouTubeThumbnails({
      assetId: "preview",
      topic: cleanTopic,
      candidateFrames: [],
      concepts: result.thumbnailConcepts?.length > 0 ? result.thumbnailConcepts : patternAssets.thumbnails.map((t) => ({
        headline: t.headline,
        visualDescription: t.visualComposition,
        colorPalette: `${t.accentColor} high-contrast`,
        reason: t.rationale,
      })),
    });

    return NextResponse.json({
      success: true,
      ...result,
      titles: finalTitles,
      suggestedTitle: finalSuggestedTitle,
      thumbnails,
      modelTrainedFormulas: patternAssets.titles,
    });
  } catch (error) {
    console.error("[Packaging API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate packaging with AI",
      },
      { status: 500 }
    );
  }
}
