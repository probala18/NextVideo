import { NextRequest, NextResponse } from "next/server";
import { generatePackagingWithAI } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      topic = "",
      currentTitle = "",
      previousTitles = [],
      transcriptText = "",
      durationSeconds = 600,
      understanding,
      visualEvidence,
      candidateFrames = [],
      assetId = "preview",
    } = body;

    const priorTitlesList: string[] = Array.isArray(previousTitles)
      ? previousTitles
      : currentTitle
      ? [currentTitle]
      : [];

    // Packaging must use a topic established by video evidence, not a stale/manual title.
    const evidenceTopic = understanding?.isAdequatelyUnderstood
      ? understanding?.actualTopic
      : "";
    const cleanTopic = String(topic || evidenceTopic || "").trim();

    if (!cleanTopic) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Video understanding evidence is missing or inadequate. Enter a title or reprocess the uploaded video before regenerating assets.",
        },
        { status: 422 }
      );
    }

    const activeFrames = Array.isArray(candidateFrames) && candidateFrames.length > 0
      ? candidateFrames
      : (Array.isArray(visualEvidence) ? visualEvidence : []);

    // If structured understanding is available, run through the multimodal generator
    if (understanding?.isAdequatelyUnderstood) {
      const { generatePublishingPackageWithAI } = await import("@/lib/video/generator");
      const pkg = await generatePublishingPackageWithAI({
        media: {
          filename: `${assetId}.mp4`,
          filesizeBytes: 0,
          format: "mp4",
          durationSeconds: Number(durationSeconds) || 60,
          width: 1280,
          height: 720,
          aspectRatio: "16:9",
          hasVideoTrack: true,
          hasAudioTrack: true,
          codec: "h264",
          inspectedWith: "atom_parser",
        },
        evidence: understanding,
        vision: {
          sampledFrames: activeFrames,
          onScreenTextCues: [],
          candidateThumbnailMoments: [],
          detectedSubjects: understanding.detectedVisualSubjects || [],
          detectedEnvironments: [],
          visualPacing: "moderate",
          limitations: [],
          confidenceScore: null,
          modelUsed: "configured",
          supportsVision: true,
        },
        thumbnails: [],
        previousTitles: priorTitlesList,
      });

      if (pkg.titles.length > 0) {
        return NextResponse.json({
          success: true,
          titles: pkg.titles.map((t) => t.title),
          titleOptions: pkg.titles,
          suggestedTitle: pkg.recommendedTitle,
          description: pkg.description,
          tags: pkg.tags,
          thumbnails: pkg.thumbnails,
        });
      }
    }

    const result = await generatePackagingWithAI({
      topic: cleanTopic,
      currentTitle: String(currentTitle || "").trim(),
      transcriptText: JSON.stringify({ understanding, transcriptText, visualEvidence }).slice(0, 12000),
      durationSeconds: Number(durationSeconds) || 600,
    });

    // Generate real 1280x720 thumbnail image variations from genuine candidate frames
    const { generateYouTubeThumbnails } = await import("@/lib/video/thumbnail-generator");
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
