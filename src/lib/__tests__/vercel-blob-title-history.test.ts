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

    // Verify blob storage contains the serialized JSON
    const storedBlob = mockBlobStore.get("nextvideo/metadata/title_history.json");
    expect(storedBlob).toBeDefined();
    const parsed = JSON.parse(storedBlob!);
    expect(parsed[assetId]).toEqual(titles);

    // Read back via getTitleHistoryAsync
    const loaded = await getTitleHistoryAsync(assetId);
    expect(loaded).toEqual(titles);
  });

  it("2. restores title history on cold start from Vercel Blob", async () => {
    const assetId = "test_asset_cold_start";
    const initialTitles = ["Mastering React Server Components", "Deep Dive into RSC Architecture"];

    // Seed mock blob as if written in a prior serverless invocation
    mockBlobStore.set(
      "nextvideo/metadata/title_history.json",
      JSON.stringify({ [assetId]: initialTitles })
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
});

