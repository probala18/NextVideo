import { NextResponse } from "next/server";
import { getAllJobs } from "@/lib/video/jobs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = getAllJobs();
    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve processing jobs" },
      { status: 500 }
    );
  }
}
