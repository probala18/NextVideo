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

    const result = await generatePackagingWithAI({
      topic: cleanTopic,
      currentTitle: String(currentTitle || cleanTopic).trim(),
      transcriptText: String(transcriptText || "").trim(),
      durationSeconds: Number(durationSeconds) || 600,
    });

    // Generate real 1280x720 thumbnail image variations
    const { generateYouTubeThumbnails } = await import("@/lib/video/thumbnail-generator");
    const thumbnails = await generateYouTubeThumbnails({
      assetId: "preview",
      topic: cleanTopic,
      candidateFrames: [],
      concepts: result.thumbnailConcepts,
    });

    return NextResponse.json({
      success: true,
      ...result,
      thumbnails,
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
