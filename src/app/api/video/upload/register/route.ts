import { NextRequest, NextResponse } from "next/server";
import { materializePrivateBlob } from "@/lib/video/storage";
import { createProcessingJob } from "@/lib/video/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { assetId, filename, mimeType, filesizeBytes, channelId } = await request.json();
    if (typeof assetId !== "string" || typeof filename !== "string") {
      return NextResponse.json({ error: "Uploaded asset ID and filename are required." }, { status: 400 });
    }
    const stored = await materializePrivateBlob(assetId, filename, String(mimeType || "video/mp4"));
    if (Number.isFinite(filesizeBytes) && Math.abs(stored.filesizeBytes - Number(filesizeBytes)) > 1024) {
      return NextResponse.json({ error: "Uploaded object size did not match the completed upload." }, { status: 400 });
    }
    const job = createProcessingJob({
      assetId: stored.assetId,
      filename: stored.sanitizedFilename,
      filesizeBytes: stored.filesizeBytes,
      fileUrl: stored.fileUrl,
      localFilePath: stored.filePath,
      channelId: typeof channelId === "string" ? channelId : undefined,
    });
    return NextResponse.json({ success: true, job: { id: job.id, assetId: job.assetId, filename: job.filename, filesizeBytes: job.filesizeBytes, fileUrl: job.fileUrl, status: job.status, progressPercent: job.progressPercent, currentStage: job.currentStage } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not register uploaded video." }, { status: 500 });
  }
}
