import { NextRequest, NextResponse } from "next/server";
import { syncAllChannels } from "@/lib/sync";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET?.trim();

    // In production, strictly require Bearer authorization with CRON_SECRET
    if (cronSecret) {
      const expected = `Bearer ${cronSecret}`;
      if (authHeader !== expected) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or missing CRON_SECRET." },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "CRON_SECRET environment variable must be set in production." },
        { status: 500 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY is not configured on the server." },
        { status: 503 }
      );
    }

    const result = await syncAllChannels(apiKey);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    console.error("Scheduled sync error:", err);
    return NextResponse.json(
      { error: err?.message || "Channel synchronization failed" },
      { status: 500 }
    );
  }
}
