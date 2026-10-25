import { NextRequest, NextResponse } from "next/server";
import { youtubePatternModel, YouTubeTrainingVideo } from "@/lib/models/youtube-pattern-model";

export const dynamic = "force-dynamic";

/**
 * GET /api/model/train
 * Returns current training statistics of the YouTube Pattern Model.
 */
export async function GET() {
  try {
    const stats = youtubePatternModel.getModelStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve model stats" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/model/train
 * Feeds new YouTube video records to train and adjust the model weights.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const videos: YouTubeTrainingVideo[] = body.videos || [];

    if (!Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide an array of YouTubeTrainingVideo objects in 'videos'." },
        { status: 400 }
      );
    }

    const result = youtubePatternModel.feedYouTubeData(videos);

    return NextResponse.json({
      success: true,
      message: `Successfully trained model on ${videos.length} YouTube videos.`,
      result,
      updatedStats: youtubePatternModel.getModelStats(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to train model with YouTube data" },
      { status: 500 }
    );
  }
}
