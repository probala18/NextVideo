import { describe, expect, it, afterEach, beforeEach } from "bun:test";
import { NextRequest } from "next/server";
import { GET as getJobRoute } from "../../app/api/video/jobs/[id]/route";
import { POST as publishRoute } from "../../app/api/youtube/publish/route";
import { createProcessingJob, updateJobStatus, deleteProcessingJob } from "../video/jobs";
import { saveStoredAuth, StoredYouTubeAuth } from "../youtube/publishing";
import fs from "fs";
import os from "os";
import path from "path";

describe("Browser-Refresh Recovery End-to-End Integration", () => {
  let tempDir: string;
  let testVideoPath: string;
  let createdJobId: string;
  let originalFetch: typeof fetch;

  beforeEach(async () => {
    originalFetch = globalThis.fetch;
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "refresh-integration-"));
    testVideoPath = path.join(tempDir, "sample.mp4");
    // Write 5000 bytes dummy video file
    await fs.promises.writeFile(testVideoPath, Buffer.alloc(5000, 1));

    // Save test YouTube channel auth credentials
    const testAuth: StoredYouTubeAuth = {
      channelId: "UC_test_refresh_recovery",
      channelTitle: "Refresh Recovery Channel",
      privacyDefault: "private",
      connectedAt: new Date().toISOString(),
      tokens: {
        access_token: "mock_access_token_refresh",
        refresh_token: "mock_refresh_token_refresh",
        scope: "https://www.googleapis.com/auth/youtube.upload",
        token_type: "Bearer",
        expiry_date: Date.now() + 3600000,
      },
    };
    saveStoredAuth(testAuth);
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    if (createdJobId) {
      await deleteProcessingJob(createdJobId).catch(() => {});
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  });

  it("persists interrupted session, recovers via GET job API after reload, and resumes upload to completion", async () => {
    // 1. Create a processing job representing an uploaded video asset directly in storage
    const jobs = await (await import("../video/jobs")).getAllJobs();
    const newJob: any = {
      id: `job_refresh_test_${Date.now()}`,
      assetId: "refresh_test_asset_001",
      filename: "test_video.mp4",
      filesizeBytes: 5000,
      fileUrl: "/data/sample.mp4",
      localFilePath: testVideoPath,
      status: "uploaded",
      progressPercent: 5,
      currentStage: "File uploaded and registered",
      stagesCompleted: ["Upload & Validation"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      derivedAssets: {},
    };
    jobs.unshift(newJob);
    await (await import("../video/jobs")).saveAllJobs(jobs);
    createdJobId = newJob.id;

    // 2. Simulate upload interruption: server persists session URL and lifecycle state
    const interruptedSessionUrl = "https://upload.youtube.com/resumable/interrupted-session-recovery-777";
    await updateJobStatus(newJob.id, {
      uploadSessionUrl: interruptedSessionUrl,
      publishingLifecycle: {
        state: "UploadInterrupted",
        assetId: newJob.assetId,
        jobId: newJob.id,
        uploadSessionUrl: interruptedSessionUrl,
        error: "Network stream reset by peer (308 incomplete)",
        updatedAt: new Date().toISOString(),
      },
    });

    // 3. Simulate browser page refresh / mount: Frontend fetches GET /api/video/jobs/:id
    const getReq = new NextRequest(`http://localhost:3000/api/video/jobs/${newJob.id}`);
    const getRes = await getJobRoute(getReq, { params: { id: newJob.id } });
    expect(getRes.status).toBe(200);

    const loadedData = await getRes.json();
    expect(loadedData.success).toBe(true);
    expect(loadedData.uploadSessionUrl).toBe(interruptedSessionUrl);
    expect(loadedData.publishingLifecycle).toBeDefined();
    expect(loadedData.publishingLifecycle.state).toBe("UploadInterrupted");
    expect(loadedData.publishingLifecycle.uploadSessionUrl).toBe(interruptedSessionUrl);

    // 4. Simulate creator clicking "Resume Interrupted Upload": Frontend posts to /api/youtube/publish with resumeSessionUrl
    let statusQueryReceived = false;
    let byteRangeReceived = false;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);

      if (url === interruptedSessionUrl) {
        const contentRange = headers.get("Content-Range") || "";

        // Query session status check
        if (contentRange === "bytes */5000") {
          statusQueryReceived = true;
          // YouTube responds 308 showing 2000 bytes already received (0-1999)
          return new Response(null, {
            status: 308,
            headers: { Range: "bytes=0-1999" },
          });
        }

        // Resumed chunk upload PUT (bytes 2000-4999/5000)
        if (contentRange === "bytes 2000-4999/5000") {
          byteRangeReceived = true;
          return new Response(
            JSON.stringify({ kind: "youtube#video", id: "verified-recovered-video-id-999" }),
            {
              status: 201,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      throw new Error(`Unexpected fetch URL in integration test: ${url}`);
    }) as typeof fetch;

    const resumeReq = new NextRequest("http://localhost:3000/api/youtube/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: newJob.id,
        title: "Autonomous Recovery: Resumed Video",
        description: "Integration test description for verified resume",
        privacyStatus: "private",
        resumeSessionUrl: loadedData.uploadSessionUrl,
      }),
    });

    const resumeRes = await publishRoute(resumeReq);
    expect(resumeRes.status).toBe(200);

    const publishData = await resumeRes.json();
    expect(publishData.success).toBe(true);
    expect(publishData.videoId).toBe("verified-recovered-video-id-999");
    expect(publishData.lifecycleState).toBe("Published");
    expect(statusQueryReceived).toBe(true);
    expect(byteRangeReceived).toBe(true);

    // 5. Verify the job in storage has transitioned to Published with the YouTube video ID
    const verifyReq = new NextRequest(`http://localhost:3000/api/video/jobs/${newJob.id}`);
    const verifyRes = await getJobRoute(verifyReq, { params: { id: newJob.id } });
    const finalJobData = await verifyRes.json();

    expect(finalJobData.publishingLifecycle.state).toBe("Published");
    expect(finalJobData.publishingLifecycle.videoId).toBe("verified-recovered-video-id-999");
  });
});
