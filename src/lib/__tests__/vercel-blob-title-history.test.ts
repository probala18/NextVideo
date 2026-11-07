import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";

let mockBlobStore = new Map<string, string>();
let shouldFailRead = false;
let shouldFailWrite = false;

// Mock @vercel/blob before generator is loaded
mock.module("@vercel/blob", () => {
  return {
    get: mock(async (pathname: string, _options?: any) => {
      if (shouldFailRead) {
        throw new Error("Simulated Vercel Blob network read timeout (503 Service Unavailable)");
      }
      if (mockBlobStore.has(pathname)) {
        const content = mockBlobStore.get(pathname)!;
        return {
          pathname,
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(content));
              controller.close();
            },
          }),
        };
      }
      return null;
    }),
    put: mock(async (pathname: string, body: string, _options?: any) => {
      if (shouldFailWrite) {
        throw new Error("Simulated Vercel Blob quota exceeded (403 Forbidden)");
      }
      mockBlobStore.set(pathname, body);
      return {
        url: `https://mock.blob.vercel-storage.com/${pathname}`,
        pathname,
        contentType: "application/json",
      };
    }),
  };
});

// Import generator functions
import {
  getTitleHistoryAsync,
  recordTitleHistory,
  clearTitleHistory,
  resetTitleHistoryLoadPromise,
} from "../video/generator";

describe("Vercel Blob Durable Title History", () => {
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;

  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = "mock_blob_rw_token_test_12345";
    mockBlobStore.clear();
    shouldFailRead = false;
    shouldFailWrite = false;
    clearTitleHistory(undefined, true);
    resetTitleHistoryLoadPromise();
  });

  afterEach(() => {
    if (originalToken) {
      process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    } else {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    }
    clearTitleHistory(undefined, true);
    resetTitleHistoryLoadPromise();
  });

  it("1. handles first write and subsequent read via Vercel Blob", async () => {
    const assetId = "test_asset_workflow_1";
    const titles = ["Next.js App Router Mastery", "Build Production Apps with Next.js"];

    await recordTitleHistory(assetId, titles);

    // Verify authoritative per-asset blob storage contains the record
    const storedBlob = mockBlobStore.get(`nextvideo/metadata/titles/${assetId}.json`);
    expect(storedBlob).toBeDefined();
    const parsed = JSON.parse(storedBlob!);
    const actualTitles = Array.isArray(parsed) ? parsed : parsed.titles;
    expect(actualTitles).toEqual(titles);

    // Read back via getTitleHistoryAsync
    const loaded = await getTitleHistoryAsync(assetId);
    expect(loaded).toEqual(titles);
  });

  it("2. restores title history on cold start from Vercel Blob", async () => {
    const assetId = "test_asset_cold_start";
    const initialTitles = ["Mastering React Server Components", "Deep Dive into RSC Architecture"];

    // Seed mock blob as if written in a prior serverless invocation
    mockBlobStore.set(
      `nextvideo/metadata/titles/${assetId}.json`,
      JSON.stringify({ fingerprint: assetId, titles: initialTitles })
    );

    // Clear in-memory Map and reset load promise to simulate cold-start
    clearTitleHistory(undefined, true);
    resetTitleHistoryLoadPromise();

    const restored = await getTitleHistoryAsync(assetId);
    expect(restored).toEqual(initialTitles);
  });

  it("3. propagates storage read failure to generation layer without swallowing", async () => {
    const assetId = "test_asset_read_fail";

    clearTitleHistory(undefined, true);
    resetTitleHistoryLoadPromise();
    shouldFailRead = true;

    // Must reject and propagate error rather than silently returning empty array
    await expect(getTitleHistoryAsync(assetId)).rejects.toThrow("Durable title history load failed");
  });

  it("4. propagates storage write failure when Vercel Blob put fails", async () => {
    const assetId = "test_asset_write_fail";
    shouldFailWrite = true;

    await expect(
      recordTitleHistory(assetId, ["Failing Title Candidate"])
    ).rejects.toThrow("Durable title history write failed");
  });

  it("5. enforces asset isolation across two different asset IDs", async () => {
    const assetA = "asset_tutorial_series_part_1";
    const assetB = "asset_tutorial_series_part_2";

    const titlesA = ["NextVideo Architecture Overview", "NextVideo Deep Dive: Video Understanding"];
    const titlesB = ["YouTube Publishing Pipeline", "Resumable Uploads in TypeScript"];

    await recordTitleHistory(assetA, titlesA);
    await recordTitleHistory(assetB, titlesB);

    const historyA = await getTitleHistoryAsync(assetA);
    const historyB = await getTitleHistoryAsync(assetB);

    expect(historyA).toEqual(titlesA);
    expect(historyB).toEqual(titlesB);

    // Verify complete isolation
    for (const tA of titlesA) {
      expect(historyB).not.toContain(tA);
    }
    for (const tB of titlesB) {
      expect(historyA).not.toContain(tB);
    }
  });

  it("6. guarantees cross-instance concurrency safety during simultaneous parallel writes to different assets", async () => {
    const assetInstanceA = "concurrent_asset_serverless_node_1";
    const assetInstanceB = "concurrent_asset_serverless_node_2";

    const titlesA = ["Serverless Instance 1 - Architecture", "Serverless Instance 1 - Deep Dive"];
    const titlesB = ["Serverless Instance 2 - Concurrency", "Serverless Instance 2 - Edge Storage"];

    // Simultaneous parallel writes simulating two distinct serverless nodes executing at the exact same millisecond
    await Promise.all([
      recordTitleHistory(assetInstanceA, titlesA),
      recordTitleHistory(assetInstanceB, titlesB),
    ]);

    // Verify per-asset distributed records were both created in Vercel Blob without collision
    const blobPathA = `nextvideo/metadata/titles/${assetInstanceA}.json`;
    const blobPathB = `nextvideo/metadata/titles/${assetInstanceB}.json`;
    expect(mockBlobStore.get(blobPathA)).toBeDefined();
    expect(mockBlobStore.get(blobPathB)).toBeDefined();

    // Verify each node's titles are preserved
    clearTitleHistory(undefined, true);
    resetTitleHistoryLoadPromise();

    const loadedA = await getTitleHistoryAsync(assetInstanceA);
    const loadedB = await getTitleHistoryAsync(assetInstanceB);

    expect(loadedA).toEqual(titlesA);
    expect(loadedB).toEqual(titlesB);
  });

  it("7. guarantees atomic convergence during simultaneous parallel writes to the SAME asset", async () => {
    const sharedAssetId = "concurrent_same_asset_race_condition_test";
    const titlesNodeA = ["Concurrent Angle Alpha 1", "Concurrent Angle Alpha 2"];
    const titlesNodeB = ["Concurrent Angle Beta 1", "Concurrent Angle Beta 2"];

    // Simultaneous parallel writes to the SAME asset from two competing instances
    await Promise.all([
      recordTitleHistory(sharedAssetId, titlesNodeA),
      recordTitleHistory(sharedAssetId, titlesNodeB),
    ]);

    // Clear local in-memory state to simulate cold retrieval by a third independent instance
    clearTitleHistory(undefined, true);
    resetTitleHistoryLoadPromise();

    const finalMergedHistory = await getTitleHistoryAsync(sharedAssetId);

    // Both candidate sets MUST be present in storage - neither can be dropped or overwritten
    for (const tA of titlesNodeA) {
      expect(finalMergedHistory).toContain(tA);
    }
    for (const tB of titlesNodeB) {
      expect(finalMergedHistory).toContain(tB);
    }
    expect(finalMergedHistory.length).toBeGreaterThanOrEqual(4);
  });
});

