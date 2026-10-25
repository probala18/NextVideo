import { NextRequest, NextResponse } from "next/server";
import { collectNicheResearch } from "@/lib/research/collector";
import { extractPatterns } from "@/lib/patterns/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { nicheOrTopic = "AI Agents & Autonomous Coding", competitorUrls = [], maxVideos = 20 } = body;

    const research = await collectNicheResearch({
      nicheOrTopic: String(nicheOrTopic).trim(),
      competitorUrls: Array.isArray(competitorUrls) ? competitorUrls : [],
      maxVideos: Math.min(50, Math.max(5, Number(maxVideos) || 20)),
    });

    const patterns = extractPatterns(research);

    return NextResponse.json({
      success: true,
      nicheOrTopic,
      source: research.source,
      isLiveApiData: research.isLiveApiData,
      totalVideosAnalyzed: research.totalVideos,
      channelsRepresented: research.channelsCount,
      metricsSummary: research.metricsSummary,
      videos: research.videos,
      channelMedians: research.channelMedians,
      patterns: {
        topPerformingCluster: patterns.topPerformingCluster,
        topicClusters: patterns.topicClusters,
        winningTitlePatterns: patterns.winningTitlePatterns,
        thumbnailInsights: patterns.thumbnailInsights,
        contentGaps: patterns.contentGaps,
        findings: patterns.findings,
      },
      notes: research.notes,
    });
  } catch (error) {
    console.error("[Research API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze YouTube niche patterns",
      },
      { status: 500 }
    );
  }
}
