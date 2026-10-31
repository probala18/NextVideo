import { NextRequest, NextResponse } from "next/server";
import { generatePackagingWithAI } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      topic = "",
      currentTitle = "",
      transcriptText = "",
      durationSeconds = 600,
      understanding,
      visualEvidence,
      candidateFrames = [],
      assetId = "preview",
    } = body;

    if (!understanding?.isAdequatelyUnderstood || !understanding?.actualTopic || !Array.isArray(understanding.audioEvidence)) {
      return NextResponse.json({ success: false, error: "Video understanding evidence is missing or inadequate. Reprocess the uploaded video before regenerating assets." }, { status: 422 });
    }

    const cleanTopic = String(topic || currentTitle || "YouTube Video").trim();
    if (!cleanTopic) {
      return NextResponse.json(
        { success: false, error: "Topic or title is required to generate packaging." },
        { status: 400 }
      );
    }

    const result = await generatePackagingWithAI({
      topic: cleanTopic,
      currentTitle: String(currentTitle || "").trim(),
      transcriptText: JSON.stringify({ understanding, transcriptText, visualEvidence }).slice(0, 12000),
      durationSeconds: Number(durationSeconds) || 600,
    });

    // Generate real 1280x720 thumbnail image variations from genuine candidate frames
    const { generateYouTubeThumbnails } = await import("@/lib/video/thumbnail-generator");
    const activeFrames = Array.isArray(candidateFrames) && candidateFrames.length > 0
      ? candidateFrames
      : (Array.isArray(visualEvidence) ? visualEvidence : []);

    const thumbnails = await generateYouTubeThumbnails({
      assetId,
      topic: cleanTopic,
      candidateFrames: activeFrames,
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
