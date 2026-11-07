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
        assetId,
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

      // Always return the structured generator's result directly.
      // NEVER fall through to legacy tutorial templates when titles are filtered out.
      return NextResponse.json({
        success: true,
        titles: pkg.titles.map((t) => t.title),
        titleOptions: pkg.titles,
        suggestedTitle: pkg.recommendedTitle,
        description: pkg.description,
        tags: pkg.tags,
        thumbnails: pkg.thumbnails,
        limitationNotice: pkg.limitationNotice,
      });
    }

    // If structured evidence was not available, report missing evidence instead of fabricating legacy templates
    return NextResponse.json(
      {
        success: false,
        error: "Structured video understanding is required for publishing asset generation. Process the uploaded video before generating assets.",
      },
      { status: 422 }
    );
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
