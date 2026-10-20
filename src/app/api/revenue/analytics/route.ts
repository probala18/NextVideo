import { NextRequest, NextResponse } from "next/server";
import {
  getTrackedChannels,
  getChannelSnapshots,
  getTrackedVideos,
  findRpmAssumption,
} from "@/lib/sync";
import { buildRevenueEstimate } from "@/lib/revenue-calculator";
import {
  RevenueEstimate,
  ComparativeChannelMetric,
  RevenueAnalyticsResponse,
} from "@/lib/types/revenue";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const region = (searchParams.get("region") || "US").toUpperCase().trim();
    const niche = (searchParams.get("niche") || "general").toLowerCase().trim();
    const currency = (searchParams.get("currency") || "USD").toUpperCase().trim();

    if (![7, 30, 90].includes(days)) {
      return NextResponse.json(
        { error: "Reporting period 'days' must be 7, 30, or 90." },
        { status: 400 }
      );
    }

    const trackedChannels = await getTrackedChannels();
    const appliedRpm = await findRpmAssumption(niche, region, "long-form", currency);
    const shortsRpm = await findRpmAssumption(niche, region, "short", currency);

    const warnings: string[] = [];
    if (!appliedRpm) {
      warnings.push(`No exact RPM benchmark exists for category "${niche}" in region "${region}". Using fallback model.`);
    }

    const channelEstimates: RevenueEstimate[] = [];
    const comparisons: ComparativeChannelMetric[] = [];

    for (const channel of trackedChannels) {
      const snapshots = await getChannelSnapshots(channel.channel_id);
      const trackedVideos = await getTrackedVideos(channel.channel_id);

      // Determine RPM to use: channel-specific niche if set, else requested niche
      const channelNiche = channel.niche || niche;
      const channelRpm =
        channelNiche === niche
          ? appliedRpm
          : await findRpmAssumption(channelNiche, region, "long-form", currency);

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
        channelRpm || appliedRpm,
        trackedVideos.length,
        undefined,
        trackedVideos
      );

      channelEstimates.push(estimate);

      comparisons.push({
        channelId: channel.channel_id,
        channelTitle: channel.title,
        handle: channel.handle,
        thumbnailUrl: channel.thumbnail_url,
        niche: channelNiche,
        coverageDays: estimate.actualCoverageDays,
        observedViews: estimate.observedPeriodViews,
        estimatedRevenueTypical: estimate.estimatedRevenue.typical,
        estimatedRevenueRange: [
          estimate.estimatedRevenue.low,
          estimate.estimatedRevenue.high,
        ],
        effectiveRpmTypical: estimate.estimatedRevenuePerThousandViews.typical,
        confidence: estimate.dataQuality.confidence,
        currency,
        status: estimate.status,
        statusMessage: estimate.statusMessage,
        assumptionsMatch: channelNiche === niche,
      });
    }

    // Sort comparisons by estimated typical revenue descending
    comparisons.sort((a, b) => b.estimatedRevenueTypical - a.estimatedRevenueTypical);

    if (trackedChannels.length === 0) {
      warnings.push("No channels are currently tracked. Add channels using their URL or handle to start building historical view snapshots.");
    }

    const response: RevenueAnalyticsResponse = {
      periodDays: days,
      region,
      niche,
      currency,
      channelsCount: trackedChannels.length,
      channels: channelEstimates,
      comparisons,
      appliedRpm,
      warnings,
      disclaimer:
        "ESTIMATE ONLY: Public YouTube API view counts are multiplied by industry RPM assumptions to calculate potential revenue ranges. Actual revenue depends on private AdSense metrics, sponsorships, and monetization status.",
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Revenue analytics API error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to retrieve revenue analytics" },
      { status: 500 }
    );
  }
}
