import { NextRequest, NextResponse } from "next/server";
import { collectNicheResearch } from "@/lib/research/collector";
import { extractPatterns } from "@/lib/patterns/engine";
import { computeOptimizationScores } from "@/lib/scoring/optimizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      title = "",
      thumbnailText = "",
      description = "",
      first15sSpeech = "",
      videoDurationSecs = 600,
      edlCutsCount = 0,
      deadAirReductionPercent = 0,
      nicheOrTopic = "AI Agents & Autonomous Coding",
      competitorUrls = [],
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { success: false, error: "Video title is required to evaluate optimization scores." },
        { status: 400 }
      );
    }

    // Collect research and extract patterns
    const research = await collectNicheResearch({
      nicheOrTopic: String(nicheOrTopic).trim(),
      competitorUrls: Array.isArray(competitorUrls) ? competitorUrls : [],
      maxVideos: 25,
    });

    const patterns = extractPatterns(research);

    // Compute transparent score report
    const scorecard = computeOptimizationScores({
      title: title.trim(),
      thumbnailText: String(thumbnailText || "").trim(),
      description: String(description || "").trim(),
      first15sSpeech: String(first15sSpeech || "").trim(),
      videoDurationSecs: Number(videoDurationSecs) || 600,
      edlCutsCount: Number(edlCutsCount) || 0,
      deadAirReductionPercent: Number(deadAirReductionPercent) || 0,
      research,
      patterns,
    });

    return NextResponse.json({
      success: true,
      scorecard,
      dataSource: research.source,
      sampleSizeVideos: research.totalVideos,
    });
  } catch (error) {
    console.error("[Scoring API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to compute optimization scores",
      },
      { status: 500 }
    );
  }
}
