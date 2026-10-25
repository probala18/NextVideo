import { NextRequest, NextResponse } from "next/server";
import { getJobById, updateJobStatus } from "@/lib/video/jobs";
import { deleteAsset } from "@/lib/video/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = getJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job, ...job });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch job" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = getJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Cancel job status
    updateJobStatus(params.id, {
      status: "cancelled",
      currentStage: "Cancelled and deleted by user",
    });

    // Delete associated media files on disk
    if (job.assetId) {
      await deleteAsset(job.assetId);
    }

    return NextResponse.json({ success: true, message: "Job and media deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete job" },
      { status: 500 }
    );
  }
}
