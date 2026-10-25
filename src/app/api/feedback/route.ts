import { NextRequest, NextResponse } from "next/server";
import {
  getOptimizationHistory,
  recordApprovedOptimization,
  recordSubsequentPerformance,
  saveOptimizationRecord,
  recordPerformanceSnapshot,
} from "@/lib/feedback/tracker";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId") || undefined;
    const history = getOptimizationHistory();
    const filtered = channelId ? history.filter((h) => h.assetId === channelId) : history;

    return NextResponse.json({
      success: true,
      records: filtered,
      totalCount: filtered.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load optimization history",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "approve", recordId, snapshot, ...optData } = body;

    if (action === "snapshot" && recordId) {
      const updated = recordSubsequentPerformance(recordId, snapshot || {});
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Record not found to attach performance snapshot" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        record: updated,
      });
    }

    // Default action: approve and persist
    const newRecord = recordApprovedOptimization({
      assetId: optData.channelId || optData.assetId || "creator_channel",
      originalTitle: optData.originalTitle || optData.videoTitle || "Untitled Video",
      approvedTitle: optData.approvedTitle || optData.originalTitle || "Untitled Video",
      originalDescription: optData.originalDescription,
      approvedDescription: optData.approvedDescription,
      approvedTags: optData.approvedTags || [],
      appliedCutsCount: Number(optData.appliedCutsCount || optData.cutsApplied || 0),
      timeSavedSeconds: Number(optData.timeSavedSeconds || optData.deadAirSecondsSaved || 0),
      modelVersionUsed: optData.modelVersionUsed || "openrouter/default",
      providerUsed: optData.providerUsed || "OpenRouter",
      publishedToYouTube: Boolean(optData.publishedToYouTube),
      publishedVideoId: optData.publishedVideoId,
      publishedAt: optData.publishedAt,
      publishedPrivacy: optData.publishedPrivacy,
    });

    return NextResponse.json({
      success: true,
      record: newRecord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record optimization feedback",
      },
      { status: 500 }
    );
  }
}
