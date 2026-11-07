import { NextRequest, NextResponse } from "next/server";
import { deleteProcessingJob, getJobById, updateJobStatus } from "@/lib/video/jobs";
import { deleteAsset } from "@/lib/video/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJobById(params.id);
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
    const job = await getJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Cancel job status
    await updateJobStatus(params.id, {
      status: "cancelled",
      currentStage: "Cancelled and deleted by user",
    });

    // Delete associated media files on disk
    if (job.assetId) {
      await deleteAsset(job.assetId);
    }
    await deleteProcessingJob(params.id);

    return NextResponse.json({ success: true, message: "Job and media deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete job" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await req.json();
    const { uploadSessionUrl, publishingLifecycle, status, currentStage } = body;

    const updated = await updateJobStatus(params.id, {
      ...(uploadSessionUrl !== undefined ? { uploadSessionUrl } : {}),
      ...(publishingLifecycle !== undefined ? { publishingLifecycle } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(currentStage !== undefined ? { currentStage } : {}),
    });

    return NextResponse.json({ success: true, job: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update job" },
      { status: 500 }
    );
  }
}
