import { NextRequest, NextResponse } from "next/server";
import { publishVideoToYouTube, getStoredAuth, getPublishHistory, isAlreadyPublished } from "@/lib/youtube/publishing";
import { getJobById } from "@/lib/video/jobs";
import { materializePrivateBlob } from "@/lib/video/storage";
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
    const {
      jobId,
      targetType = "original",
      selectedAsset,
      privacyStatus,
      privacy,
      title,
      customTitle,
      description,
      customDescription,
      tags,
      customTags,
      selectedThumbnailId,
    } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId in request body" }, { status: 400 });
    }

    const job = getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const effectiveTargetType = selectedAsset || targetType || "original";
    let targetFilePath = job.localFilePath || "";

    // If explicitly publishing edited cut
    if (effectiveTargetType === "edited") {
      const cutPath = path.join(process.cwd(), "data", "uploads", job.assetId, "cuts", `edited_${job.assetId}.mp4`);
      if (fs.existsSync(cutPath)) {
        targetFilePath = cutPath;
      }
    }

    if (!fs.existsSync(targetFilePath) && effectiveTargetType !== "edited") {
      try {
        targetFilePath = (await materializePrivateBlob(job.assetId, job.filename, "video/mp4")).filePath;
      } catch {
        // Return the existing clear media-unavailable response below.
      }
    }
    if (!fs.existsSync(targetFilePath)) {
      return NextResponse.json(
        { error: `Media file does not exist on disk for publishing: ${targetFilePath}` },
        { status: 400 }
      );
    }

    const finalTitle =
      (title || customTitle || "").trim() ||
      job.report?.publishingPackage?.recommendedTitle ||
      job.report?.packaging?.alternativeTitles?.[0] || "";

    if (!finalTitle) {
      return NextResponse.json({ error: "A reviewed publishing title is required. The video filename cannot be used as a title." }, { status: 400 });
    }

    // Prevent duplicate publishing when a request is retried
    if (isAlreadyPublished(job.id, finalTitle)) {
      const history = getPublishHistory();
      const existing = history.find((h) => h.jobId === job.id && h.status !== "failed");
      return NextResponse.json({
        success: true,
        message: `This video has already been published to YouTube. Duplicate publication prevented.`,
        record: existing,
        videoUrl: existing?.youtubeUrl,
        publishedUrl: existing?.youtubeUrl,
        youtubeUrl: existing?.youtubeUrl,
        videoId: existing?.youtubeVideoId,
        isDuplicatePrevented: true,
      });
    }

    // Resolve thumbnail path strictly matching creator's selection (no silent substitution)
    let thumbnailPath: string | undefined = undefined;
    if (selectedThumbnailId) {
      const thumbnails = [
        ...(job.report?.publishingPackage?.thumbnails || []),
        ...(job.derivedAssets?.generatedThumbnails || []),
      ];
      const matchedThumb = thumbnails.find((t) => t.id === selectedThumbnailId);
      if (matchedThumb?.imagePath && fs.existsSync(matchedThumb.imagePath)) {
        thumbnailPath = matchedThumb.imagePath;
      } else {
        const thumbDir = path.join(process.cwd(), "data", "uploads", job.assetId, "thumbnails");
        if (fs.existsSync(thumbDir)) {
          const files = fs.readdirSync(thumbDir);
          const found = files.find((f) => f.includes(selectedThumbnailId));
          if (found) {
            thumbnailPath = path.join(thumbDir, found);
          }
        }
      }
      if (!thumbnailPath) {
        return NextResponse.json({ error: "The selected thumbnail is unavailable. Re-select a generated thumbnail before publishing." }, { status: 400 });
      }
    }

    const finalDesc =
      (description !== undefined ? description : customDescription) ||
      job.report?.publishingPackage?.description ||
      job.report?.seo?.description || "";
    if (!finalDesc.trim()) {
      return NextResponse.json({ error: "A reviewed video description is required before publishing." }, { status: 400 });
    }

    const rawTags = tags !== undefined ? tags : customTags;
    const finalTags = rawTags
      ? (Array.isArray(rawTags) ? rawTags : String(rawTags).split(",").map((t: string) => t.trim()).filter(Boolean))
      : job.report?.publishingPackage?.tags || job.report?.seo?.tags || [];

    const effectivePrivacy = privacyStatus || privacy || auth.privacyDefault || "private";

    const record = await publishVideoToYouTube({
      jobId: job.id,
      assetId: job.assetId,
      filePath: targetFilePath,
      title: finalTitle,
      description: finalDesc,
      tags: finalTags,
      privacyStatus: effectivePrivacy,
      thumbnailPath,
    });

    return NextResponse.json({
      success: true,
      message: `Video successfully published to YouTube as ${record.privacyStatus}`,
      record,
      videoUrl: record.youtubeUrl,
      publishedUrl: record.youtubeUrl,
      youtubeUrl: record.youtubeUrl,
      videoId: record.youtubeVideoId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to publish video to YouTube" },
      { status: 500 }
    );
  }
}
