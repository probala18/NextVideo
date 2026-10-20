import { NextRequest, NextResponse } from "next/server";
import {
  getTrackedChannels,
  getChannelSnapshots,
  getTrackedVideos,
  findRpmAssumption,
} from "@/lib/sync";
import { buildRevenueEstimate } from "@/lib/revenue-calculator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId")?.trim();
    const days = parseInt(searchParams.get("days") || "30", 10);
    const region = (searchParams.get("region") || "US").toUpperCase().trim();
    const niche = (searchParams.get("niche") || "general").toLowerCase().trim();
    const currency = (searchParams.get("currency") || "USD").toUpperCase().trim();

    if (!channelId) {
      return NextResponse.json(
        { error: "Query parameter 'channelId' is required." },
        { status: 400 }
      );
    }

    if (![7, 30, 90].includes(days)) {
      return NextResponse.json(
        { error: "Reporting period 'days' must be 7, 30, or 90." },
        { status: 400 }
      );
    }

    const trackedChannels = await getTrackedChannels();
    const channel = trackedChannels.find((c) => c.channel_id === channelId);

    if (!channel) {
      return NextResponse.json(
        {
          error: "Channel is not currently tracked.",
          status: "channel_not_tracked",
          channelId,
          suggestion: "Use POST /api/revenue/track with the channel's URL or handle to start tracking.",
        },
        { status: 404 }
      );
    }

    const snapshots = await getChannelSnapshots(channelId);
    const trackedVideos = await getTrackedVideos(channelId);
    const rpm = await findRpmAssumption(niche || channel.niche, region, "long-form", currency);
    const shortsRpm = await findRpmAssumption(niche || channel.niche, region, "short", currency);

    // Compute format distribution from tracked videos if available
    let formatBreakdown = undefined;
    if (trackedVideos.length > 0 && shortsRpm) {
      let longFormViews = 0;
      let shortsViews = 0;
      for (const v of trackedVideos) {
        if (v.format === "short") {
          shortsViews += v.latest_view_count;
        } else {
          longFormViews += v.latest_view_count;
        }
      }

      // If we observed both formats, compute weighted proportion for observed views
      const totalSampleViews = longFormViews + shortsViews;
      if (totalSampleViews > 0) {
        const lfRatio = longFormViews / totalSampleViews;
        const sfRatio = shortsViews / totalSampleViews;

        formatBreakdown = {
          longFormViews: Math.round(channel.latest_total_views * lfRatio),
          shortsViews: Math.round(channel.latest_total_views * sfRatio),
          shortsRpm,
        };
      }
    }

    const estimate = buildRevenueEstimate(
      {
        id: channel.channel_id,
        title: channel.title,
        handle: channel.handle,
        thumbnailUrl: channel.thumbnail_url,
        subscriberCount: channel.subscriber_count,
        totalViews: channel.latest_total_views,
        videoCount: channel.video_count,
      },
      snapshots,
      days,
      rpm,
      trackedVideos.length,
      formatBreakdown
    );

    return NextResponse.json(estimate);
  } catch (err: any) {
    console.error("Revenue estimate API error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to calculate revenue estimate" },
      { status: 500 }
    );
  }
}
