import { NextRequest, NextResponse } from "next/server";
import { saveUploadedVideo, saveDerivedAsset } from "@/lib/video/storage";
import { createProcessingJob } from "@/lib/video/jobs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = (formData.get("video") || formData.get("file")) as File | null;
    const transcriptFile = (formData.get("transcript") || formData.get("subtitles")) as File | null;
    const retentionFile = formData.get("retention") as File | null;
    const channelId = (formData.get("channelId") || formData.get("channel")) as string | null;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Save primary video
    const stored = await saveUploadedVideo(fileBuffer, file.name, file.type);

    let transcriptPath: string | undefined = undefined;
    if (transcriptFile) {
      const trBuffer = Buffer.from(await transcriptFile.arrayBuffer());
      const trSaved = await saveDerivedAsset(
        stored.assetId,
        "transcripts",
        transcriptFile.name,
        trBuffer
      );
      transcriptPath = trSaved.filePath;
    }

    let retentionCsvPath: string | undefined = undefined;
    if (retentionFile) {
      const retBuffer = Buffer.from(await retentionFile.arrayBuffer());
      const retSaved = await saveDerivedAsset(
        stored.assetId,
        "reports",
        retentionFile.name,
        retBuffer
      );
      retentionCsvPath = retSaved.filePath;
    }

    // Create durable processing job
    const job = createProcessingJob({
      assetId: stored.assetId,
      filename: stored.sanitizedFilename,
      filesizeBytes: stored.filesizeBytes,
      fileUrl: stored.fileUrl,
      localFilePath: stored.filePath,
      transcriptPath,
      retentionCsvPath,
      channelId: channelId || undefined,
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        assetId: job.assetId,
        filename: job.filename,
        filesizeBytes: job.filesizeBytes,
        fileUrl: job.fileUrl,
        status: job.status,
        progressPercent: job.progressPercent,
        currentStage: job.currentStage,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to upload and process video" },
      { status: 500 }
    );
  }
}
