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

const JOBS_FILE_PATH = path.join(process.cwd(), "data", "video_jobs.json");

function ensureJobsStore(): void {
  const dir = path.dirname(JOBS_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JOBS_FILE_PATH)) {
    fs.writeFileSync(JOBS_FILE_PATH, JSON.stringify([]), "utf-8");
  }
}

export function getAllJobs(): VideoProcessingJob[] {
  ensureJobsStore();
  try {
    const raw = fs.readFileSync(JOBS_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAllJobs(jobs: VideoProcessingJob[]): void {
  ensureJobsStore();
  fs.writeFileSync(JOBS_FILE_PATH, JSON.stringify(jobs, null, 2), "utf-8");
}

export function getJobById(jobId: string): VideoProcessingJob | null {
  const jobs = getAllJobs();
  return jobs.find((j) => j.id === jobId) || null;
}

export function createProcessingJob(params: {
  assetId: string;
  filename: string;
  filesizeBytes: number;
  fileUrl: string;
  localFilePath: string;
  transcriptPath?: string;
  retentionCsvPath?: string;
  channelId?: string;
}): VideoProcessingJob {
  const jobs = getAllJobs();
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

  jobs.unshift(newJob);
  saveAllJobs(jobs);

  // Kick off asynchronous processing
  setImmediate(() => {
    executeJobWorkflow(id).catch(() => {});
  });

  return newJob;
}

export function updateJobStatus(
  jobId: string,
  updates: Partial<VideoProcessingJob>
): VideoProcessingJob | null {
  const jobs = getAllJobs();
  const index = jobs.findIndex((j) => j.id === jobId);
  if (index === -1) return null;

  jobs[index] = {
    ...jobs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveAllJobs(jobs);
  return jobs[index];
}

export async function executeJobWorkflow(jobId: string): Promise<VideoProcessingJob | null> {
  let job = getJobById(jobId);
  if (!job) return null;

  try {
    // Stage 1: Media Inspection
    updateJobStatus(jobId, {
      status: "queued",
      progressPercent: 15,
      currentStage: "Inspecting media streams & container format",
    });

    const media = await inspectMedia(job.localFilePath || "", job.filename);

    // Stage 2: Speech Transcription
    updateJobStatus(jobId, {
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
    updateJobStatus(jobId, {
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
    updateJobStatus(jobId, {
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
    const completedJob = updateJobStatus(jobId, {
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
      },
    });

    return completedJob;
  } catch (err: any) {
    const failedJob = updateJobStatus(jobId, {
      status: "failed",
      errorMessage: err.message || "An unexpected error occurred during processing",
      currentStage: "Failed during execution",
    });
    return failedJob;
  }
}
