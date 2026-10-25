import { NextRequest, NextResponse } from "next/server";
import { publishVideoToYouTube, getStoredAuth, getPublishHistory } from "@/lib/youtube/publishing";
import { getJobById } from "@/lib/video/jobs";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const history = getPublishHistory();
    return NextResponse.json({ success: true, count: history.length, history });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve publish history" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getStoredAuth();
    if (!auth) {
      return NextResponse.json(
        { error: "No connected YouTube channel found. Connect your account first in Settings." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { jobId, targetType = "original", privacyStatus, customTitle, customDescription } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId in request body" }, { status: 400 });
    }

    const job = getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    let targetFilePath = job.localFilePath || "";

    // If publishing edited cut
    if (targetType === "edited") {
      const cutPath = path.join(process.cwd(), "data", "uploads", job.assetId, "cuts", `edited_${job.assetId}.mp4`);
      if (fs.existsSync(cutPath)) {
        targetFilePath = cutPath;
      }
    }

    if (!fs.existsSync(targetFilePath)) {
      return NextResponse.json(
        { error: `Media file does not exist on disk for publishing: ${targetFilePath}` },
        { status: 400 }
      );
    }

    const finalTitle = customTitle || job.report?.packaging.alternativeTitles[0] || job.filename;
    const finalDesc =
      customDescription ||
      job.report?.seo.description ||
      `Uploaded with NextVideo Studio — Analyzed with YouTube Agent Skills`;

    const record = await publishVideoToYouTube({
      jobId: job.id,
      assetId: job.assetId,
      filePath: targetFilePath,
      title: finalTitle,
      description: finalDesc,
      tags: job.report?.seo.tags || ["nextvideo"],
      privacyStatus: privacyStatus || auth.privacyDefault || "private",
    });

    return NextResponse.json({
      success: true,
      message: `Video successfully published to YouTube as ${record.privacyStatus}`,
      record,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to publish video to YouTube" },
      { status: 500 }
    );
  }
}
