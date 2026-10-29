/**
 * src/lib/video/jobs.ts
 * Durable Job State Machine & Background Workflow Execution Runner
 */

import fs from "fs";
import path from "path";
import { VideoProcessingJob, VideoJobStatus, ConsolidatedAnalysisReport } from "../types/videoWorkflow";
import { inspectMedia } from "./inspector";
import { transcribeMedia } from "./transcriber";
import { runAutonomousVideoWorkflow } from "./orchestrator";
import { saveDerivedAsset } from "./storage";
import { waitUntil } from "@vercel/functions";

const JOBS_FILE_PATH = path.join(process.cwd(), "data", "video_jobs.json");

function ensureJobsStore(): void {
  const dir = path.dirname(JOBS_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JOBS_FILE_PATH)) {
    fs.writeFileSync(JOBS_FILE_PATH, JSON.stringify([]), "utf-8");
  }
}

export async function getAllJobs(): Promise<VideoProcessingJob[]> {
  if (process.env.VERCEL) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Persistent job storage is not configured. Add BLOB_READ_WRITE_TOKEN.");
    const { list, get } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "nextvideo/jobs/" });
    const jobs = await Promise.all(blobs.map(async (item) => {
      const object = await get(item.pathname, { access: "private" });
      if (!object) return null;
      try { return JSON.parse(await new Response(object.stream).text()) as VideoProcessingJob; } catch { return null; }
    }));
    return jobs.filter((job): job is VideoProcessingJob => Boolean(job)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  ensureJobsStore();
  try {
    const raw = fs.readFileSync(JOBS_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveAllJobs(jobs: VideoProcessingJob[]): Promise<void> {
  if (process.env.VERCEL) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Persistent job storage is not configured. Add BLOB_READ_WRITE_TOKEN.");
    const { put } = await import("@vercel/blob");
    await Promise.all(jobs.map((job) => put(`nextvideo/jobs/${job.id}.json`, JSON.stringify(job), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" })));
    return;
  }
  ensureJobsStore();
  fs.writeFileSync(JOBS_FILE_PATH, JSON.stringify(jobs, null, 2), "utf-8");
}

export async function getJobById(jobId: string): Promise<VideoProcessingJob | null> {
  if (process.env.VERCEL) {
    if (!/^[a-zA-Z0-9_-]+$/.test(jobId) || !process.env.BLOB_READ_WRITE_TOKEN) return null;
    const { get } = await import("@vercel/blob");
    const object = await get(`nextvideo/jobs/${jobId}.json`, { access: "private" });
    if (!object) return null;
    try { return JSON.parse(await new Response(object.stream).text()) as VideoProcessingJob; } catch { return null; }
  }
  const jobs = await getAllJobs();
  return jobs.find((j) => j.id === jobId) || null;
}

export async function createProcessingJob(params: {
  assetId: string;
  filename: string;
  filesizeBytes: number;
  fileUrl: string;
  localFilePath: string;
  transcriptPath?: string;
  retentionCsvPath?: string;
  channelId?: string;
}): Promise<VideoProcessingJob> {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const newJob: VideoProcessingJob = {
    id,
    assetId: params.assetId,
    filename: params.filename,
    filesizeBytes: params.filesizeBytes,
    fileUrl: params.fileUrl,
    localFilePath: params.localFilePath,
    transcriptPath: params.transcriptPath,
    retentionCsvPath: params.retentionCsvPath,
    channelId: params.channelId,
    status: "uploaded",
    progressPercent: 5,
    currentStage: "File uploaded and registered",
    stagesCompleted: ["Upload & Validation"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    derivedAssets: {},
  };

  if (process.env.VERCEL) await saveAllJobs([newJob]);
  else {
    const jobs = await getAllJobs();
    jobs.unshift(newJob);
    await saveAllJobs(jobs);
  }

  // Kick off asynchronous processing
  const processing = executeJobWorkflow(id).catch((error) => {
    console.error("Video processing job failed:", error instanceof Error ? error.message : "Unknown error");
  });
  if (process.env.VERCEL) waitUntil(processing);
  else setImmediate(() => { void processing; });

  return newJob;
}

export async function updateJobStatus(
  jobId: string,
  updates: Partial<VideoProcessingJob>
): Promise<VideoProcessingJob | null> {
  const jobs = await getAllJobs();
  const index = jobs.findIndex((j) => j.id === jobId);
  if (index === -1) return null;

  jobs[index] = {
    ...jobs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (process.env.VERCEL) await saveAllJobs([jobs[index]]);
  else await saveAllJobs(jobs);
  return jobs[index];
}

export async function executeJobWorkflow(jobId: string): Promise<VideoProcessingJob | null> {
  let job = await getJobById(jobId);
  if (!job) return null;

  try {
    // Stage 1: Media Inspection
    await updateJobStatus(jobId, {
      status: "queued",
      progressPercent: 15,
      currentStage: "Inspecting media streams & container format",
    });

    const media = await inspectMedia(job.localFilePath || "", job.filename);

    // Stage 2: Speech Transcription
    await updateJobStatus(jobId, {
      status: "transcribing",
      progressPercent: 35,
      currentStage: "Transcribing speech and extracting cues",
      stagesCompleted: [...(job.stagesCompleted || []), "Media Inspection"],
    });

    const transcript = await transcribeMedia(
      job.localFilePath || "",
      job.transcriptPath,
      job.filename.replace(/\.[^/.]+$/, "")
    );

    // Stage 3: Autonomous Analysis (Hooks, EDL, Chapters, Packaging)
    await updateJobStatus(jobId, {
      status: "analyzing",
      progressPercent: 60,
      currentStage: "Running hook scoring, dead air EDL & chapter boundaries",
      stagesCompleted: [
        ...(job.stagesCompleted || []),
        "Media Inspection",
        "Speech Transcription",
      ],
    });

    // Stage 4: Outlier Research & Follow-up Planning
    await updateJobStatus(jobId, {
      status: "researching",
      progressPercent: 80,
      currentStage: "Analyzing niche outliers and pacing benchmarks",
      stagesCompleted: [
        ...(job.stagesCompleted || []),
        "Media Inspection",
        "Speech Transcription",
        "Structural Analysis",
      ],
    });

    const report = await runAutonomousVideoWorkflow({
      jobId,
      assetId: job.assetId,
      media,
      sourceFilePath: job.localFilePath || "",
      transcript,
      retentionCsvPath: job.retentionCsvPath,
      channelId: job.channelId,
      userHintTopic: job.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
    });

    // Save report artifact to disk
    await saveDerivedAsset(
      job.assetId,
      "reports",
      `analysis_report_${job.id}.json`,
      JSON.stringify(report, null, 2)
    );

    // Stage 5: Completion
    const completedJob = await updateJobStatus(jobId, {
      status: "completed",
      progressPercent: 100,
      currentStage: "Analysis & Production Workflow Completed",
      stagesCompleted: [
        "Upload & Validation",
        "Media Inspection",
        "Speech Transcription",
        "Structural Analysis",
        "Niche Outlier Research",
        "EDL & Shorts Generation",
        "Report Consolidated",
      ],
      report,
      derivedAssets: {
        editedVideoUrl: report.editing.renderedDownloadUrl,
        edlDownloadUrl: report.editing.renderedDownloadUrl,
        shortsUrls: report.shorts.candidates
          .map((c) => c.renderedDownloadUrl)
          .filter(Boolean) as string[],
        generatedThumbnails: report.publishingPackage?.thumbnails || [],
      },
    });

    return completedJob;
  } catch (err: any) {
    const failedJob = await updateJobStatus(jobId, {
      status: "failed",
      errorMessage: err.message || "An unexpected error occurred during processing",
      currentStage: "Failed during execution",
    });
    return failedJob;
  }
}
