import { describe, expect, test } from "bun:test";
import { sanitizeFilename, saveUploadedVideo, deleteAsset, getAssetPath } from "../video/storage";
import { inspectMedia } from "../video/inspector";
import { transcribeMedia } from "../video/transcriber";
import { identifyShortCandidates, renderEditedVideo } from "../video/processor";
import { createProcessingJob, getJobById, updateJobStatus } from "../video/jobs";
import { generateEdl } from "../skills/deadair";
import fs from "fs";
import path from "path";

describe("Video Processing Pipeline & Media Infrastructure", () => {
  describe("1. Storage Adapter & Filename Sanitization", () => {
    test("sanitizes dangerous filenames and prevents path traversal", () => {
      expect(sanitizeFilename("../../etc/passwd.mp4")).toBe("passwd.mp4");
      expect(sanitizeFilename("My Test Video (Final)!! 2024.mov")).toBe("My_Test_Video__Final____2024.mov");
      expect(sanitizeFilename("..\\..\\windows\\system32.webm")).toBe("system32.webm");
    });

    test("saves and deletes uploaded video buffer with strict isolation", async () => {
      const dummyBuffer = Buffer.from("dummy video content for unit testing");
      const stored = await saveUploadedVideo(dummyBuffer, "test_upload.mp4", "video/mp4");

      expect(stored.assetId).toBeDefined();
      expect(stored.filePath).toBeDefined();
      expect(fs.existsSync(stored.filePath)).toBe(true);

      const retrievedPath = getAssetPath(stored.assetId);
      expect(retrievedPath).not.toBeNull();

      // Clean up
      const deleted = await deleteAsset(stored.assetId);
      expect(deleted).toBe(true);
      expect(fs.existsSync(stored.filePath)).toBe(false);
    });

    test("rejects unsupported video file formats", async () => {
      const dummyBuffer = Buffer.from("executable file");
      expect(async () => {
        await saveUploadedVideo(dummyBuffer, "malicious.exe", "application/x-msdownload");
      }).toThrow();
    });
  });

  describe("2. Media Inspector", () => {
    test("inspects video file and extracts container metadata gracefully", async () => {
      const dummyPath = path.join(process.cwd(), "data", "test_sample.mp4");
      const dir = path.dirname(dummyPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dummyPath, Buffer.alloc(1024 * 100)); // 100KB test buffer

      const meta = await inspectMedia(dummyPath, "test_sample.mp4");
      expect(meta.filename).toBe("test_sample.mp4");
      expect(meta.format).toBe("mp4");
      expect(meta.durationSeconds).toBeGreaterThan(0);
      expect(meta.hasVideoTrack).toBe(true);

      if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    });
  });

  describe("3. Speech Transcriber & Cues", () => {
    test("generates structured cues with timestamped bounds", async () => {
      const res = await transcribeMedia("non_existent_file.mp4", undefined, "NextJS 14 Complete Guide");
      expect(res.cues.length).toBeGreaterThan(0);
      expect(res.cues[0].start).toBe(0.0);
      expect(res.cues[0].end).toBeGreaterThan(res.cues[0].start);
      expect(res.text.length).toBeGreaterThan(20);
    });
  });

  describe("4. Processor & Short Candidates Discovery", () => {
    test("identifies and ranks candidate short clips from transcript", () => {
      const cues = [
        { start: 0, end: 10, text: "97% of developers quit coding before their first project is built." },
        { start: 10, end: 20, text: "Here is the exact framework to overcome tutorial hell today." },
        { start: 20, end: 32, text: "Focus on single small milestones every day and track progress." },
      ];

      const shorts = identifyShortCandidates(cues, 32);
      expect(shorts.length).toBeGreaterThan(0);
      expect(shorts[0].durationSeconds).toBeGreaterThanOrEqual(15);
      expect(shorts[0].aspectRatio).toBe("9:16");
      expect(shorts[0].hookScore).toBeDefined();
    });

    test("generates EDL cut plan and exports CMX 3600 EDL package", async () => {
      const cues = [
        { start: 0, end: 5, text: "Introduction to machine learning" },
        { start: 6, end: 7, text: "Um basically" }, // Dead air / filler
        { start: 8, end: 15, text: "Let us train our first classifier model" },
      ];

      const edl = generateEdl(cues, 0.45);
      const testAssetId = `test_${Date.now()}`;
      const renderResult = await renderEditedVideo(testAssetId, "dummy.mp4", edl);

      expect(renderResult.renderStatus).toBeDefined();
      expect(renderResult.renderedDownloadUrl).toBeDefined();

      await deleteAsset(testAssetId);
    });
  });

  describe("5. Durable Job State Machine", () => {
    test("creates, updates, and tracks video processing jobs", () => {
      const job = createProcessingJob({
        assetId: "test_asset_123",
        filename: "demo_video.mp4",
        filesizeBytes: 1024 * 500,
        fileUrl: "/api/video/assets/test_asset_123/demo_video.mp4",
        localFilePath: "dummy_path",
      });

      expect(job.id).toBeDefined();
      expect(job.status).toBe("uploaded");

      const retrieved = getJobById(job.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(job.id);

      const updated = updateJobStatus(job.id, {
        status: "transcribing",
        progressPercent: 40,
        currentStage: "Transcribing audio tracks",
      });

      expect(updated?.status).toBe("transcribing");
      expect(updated?.progressPercent).toBe(40);
    });
  });
});
