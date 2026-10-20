import { NextRequest, NextResponse } from "next/server";
import { trackOrRefreshChannel } from "@/lib/sync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = String(body.identifier || "").trim();
    const niche = String(body.niche || "general").toLowerCase().trim();

    if (!identifier) {
      return NextResponse.json(
        { error: "A YouTube channel URL, channel ID, or @handle is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        {
          error:
            "Live YouTube Data API key is not configured. Add YOUTUBE_API_KEY in .env.local to track real channels.",
          needsSetup: true,
        },
        { status: 503 }
      );
    }

    const result = await trackOrRefreshChannel(identifier, niche, apiKey);

    return NextResponse.json({
      success: true,
      message: result.isNew
        ? `Channel "${result.channel.title}" added to tracking. Initial view baseline recorded.`
        : `Channel "${result.channel.title}" refreshed. Latest snapshot recorded.`,
      channel: result.channel,
      isNew: result.isNew,
      snapshotRecorded: result.snapshotRecorded,
    });
  } catch (err: any) {
    console.error("Track channel error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to track channel" },
      { status: 500 }
    );
  }
}
