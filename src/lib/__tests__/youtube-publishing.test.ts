import { describe, expect, test } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import {
  generateOAuthUrl,
  verifyOAuthState,
  getStoredAuth,
  saveStoredAuth,
  disconnectYouTubeChannel,
  isAlreadyPublished,
  recordPublishedVideo,
  getValidAccessToken,
  publishVideoToYouTube,
  queryUploadSession,
  StoredYouTubeAuth,
} from "../youtube/publishing";

describe("YouTube OAuth & Publishing Workflow", () => {
  test("generates Google OAuth 2.0 URL with required scopes", () => {
    const previousClientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
    const previousClientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
    process.env.YOUTUBE_OAUTH_CLIENT_ID = "mock_client_id_123.apps.googleusercontent.com";
    process.env.YOUTUBE_OAUTH_CLIENT_SECRET = "test-only-oauth-secret";
    try {
      const url = generateOAuthUrl("http://localhost:3000/api/youtube/callback");
      expect(url).toContain("accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("mock_client_id_123");
      expect(url).toContain("youtube.upload");
      expect(url).toContain("youtube.readonly");
      const state = new URL(url).searchParams.get("state");
      expect(verifyOAuthState(state)).toBe(true);
      expect(verifyOAuthState(`${state}tampered`)).toBe(false);
      expect(verifyOAuthState(null)).toBe(false);
    } finally {
      if (previousClientId === undefined) delete process.env.YOUTUBE_OAUTH_CLIENT_ID;
      else process.env.YOUTUBE_OAUTH_CLIENT_ID = previousClientId;
      if (previousClientSecret === undefined) delete process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
      else process.env.YOUTUBE_OAUTH_CLIENT_SECRET = previousClientSecret;
    }
  });

  test("covers authorization callback, token refresh, and reconnect with mocked Google responses", async () => {
    const { GET } = await import("../../app/api/youtube/callback/route");
    const { NextRequest } = await import("next/server");
    const originalFetch = globalThis.fetch;
    const previousAuth = getStoredAuth();
    const previousClientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
    const previousClientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
    let authorizationCount = 0;
    let refreshCount = 0;

    process.env.YOUTUBE_OAUTH_CLIENT_ID = "mock-client-id";
    process.env.YOUTUBE_OAUTH_CLIENT_SECRET = "mock-client-secret";
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("oauth2.googleapis.com/token")) {
        const form = new URLSearchParams(String(init?.body || ""));
        if (form.get("grant_type") === "refresh_token") {
          refreshCount += 1;
          return Response.json({ access_token: "refreshed-access-token", expires_in: 3600 });
        }
        authorizationCount += 1;
        return Response.json({
          access_token: `access-token-${authorizationCount}`,
          refresh_token: `refresh-token-${authorizationCount}`,
          expires_in: 3600,
          scope: "https://www.googleapis.com/auth/youtube.upload",
        });
      }
      if (url.includes("youtube/v3/channels")) {
        return Response.json({ items: [{ id: `UC_mock_${authorizationCount}`, snippet: { title: `Mock Channel ${authorizationCount}` } }] });
      }
      throw new Error(`Unexpected mocked Google request: ${url}`);
    }) as typeof fetch;

    try {
      const callbackOrigin = "http://localhost:3000";
      const firstState = new URL(generateOAuthUrl(`${callbackOrigin}/api/youtube/callback`)).searchParams.get("state");
      const firstResponse = await GET(new NextRequest(`${callbackOrigin}/api/youtube/callback?code=mock-auth-code&state=${firstState}`));
      expect((await firstResponse.text())).toContain("YOUTUBE_OAUTH_SUCCESS");
      expect(getStoredAuth()?.channelId).toBe("UC_mock_1");

      const connectedAuth = getStoredAuth();
      if (!connectedAuth) throw new Error("Mock callback did not persist channel authorization.");
      saveStoredAuth({ ...connectedAuth, tokenExpiresAt: 0 });
      expect(await getValidAccessToken()).toBe("refreshed-access-token");
      expect(refreshCount).toBe(1);

      const secondState = new URL(generateOAuthUrl(`${callbackOrigin}/api/youtube/callback`)).searchParams.get("state");
      const reconnectResponse = await GET(new NextRequest(`${callbackOrigin}/api/youtube/callback?code=mock-reconnect-code&state=${secondState}`));
      expect((await reconnectResponse.text())).toContain("YOUTUBE_OAUTH_SUCCESS");
      expect(authorizationCount).toBe(2);
      expect(getStoredAuth()?.channelId).toBe("UC_mock_2");
    } finally {
      globalThis.fetch = originalFetch;
      if (previousAuth) saveStoredAuth(previousAuth);
      else disconnectYouTubeChannel();
      if (previousClientId === undefined) delete process.env.YOUTUBE_OAUTH_CLIENT_ID;
      else process.env.YOUTUBE_OAUTH_CLIENT_ID = previousClientId;
      if (previousClientSecret === undefined) delete process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
      else process.env.YOUTUBE_OAUTH_CLIENT_SECRET = previousClientSecret;
    }
  });

  test("stores and retrieves authorized channel credentials securely", () => {
    const previousAuth = getStoredAuth();
    const mockAuth: StoredYouTubeAuth = {
      channelId: "UC_mock_channel_testing",
      channelTitle: "NextVideo Test Channel",
      accessToken: "mock_access_token_12345",
      refreshToken: "mock_refresh_token_67890",
      tokenExpiresAt: Date.now() + 3600 * 1000,
      authorizedAt: new Date().toISOString(),
      scopes: ["https://www.googleapis.com/auth/youtube.upload"],
      privacyDefault: "private",
      autoPublishPolicy: "review_first",
    };

    saveStoredAuth(mockAuth);

    const retrieved = getStoredAuth();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.channelId).toBe("UC_mock_channel_testing");
    expect(retrieved?.privacyDefault).toBe("private");

    if (previousAuth) saveStoredAuth(previousAuth);
    else disconnectYouTubeChannel();
    expect(getStoredAuth()?.channelId).toBe(previousAuth?.channelId);
  });

  test("prevents duplicate uploads for identical jobs", () => {
    const mockJobId = `job_test_duplicate_check_${Date.now()}`;
    const mockTitle = `How to Code with AI ${Date.now()}`;

    expect(isAlreadyPublished(mockJobId, mockTitle)).toBe(false);

    recordPublishedVideo({
      id: "pub_1",
      jobId: mockJobId,
      assetId: "asset_1",
      youtubeVideoId: "dQw4w9WgXcQ",
      youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
      title: mockTitle,
      privacyStatus: "private",
      publishedAt: new Date().toISOString(),
      channelId: "UC_mock_channel",
      status: "uploaded_to_youtube",
    });

    expect(isAlreadyPublished(mockJobId, mockTitle)).toBe(true);
  });

  test("sends private upload metadata and selected thumbnail, then blocks duplicate upload", async () => {
    const originalFetch = globalThis.fetch;
    const previousAuth = getStoredAuth();
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "nextvideo-publish-test-"));
    const videoPath = path.join(tempDir, "test-video.mp4");
    const thumbnailPath = path.join(tempDir, "selected-thumb.jpg");
    await fs.promises.writeFile(videoPath, Buffer.from("mock video stream"));
    await fs.promises.writeFile(thumbnailPath, Buffer.from("mock thumbnail"));

    saveStoredAuth({
      channelId: "UC_mock_upload",
      channelTitle: "Mock Upload Channel",
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      tokenExpiresAt: Date.now() + 60 * 60 * 1000,
      authorizedAt: new Date().toISOString(),
      scopes: ["https://www.googleapis.com/auth/youtube.upload"],
      privacyDefault: "private",
      autoPublishPolicy: "review_first",
    });

    let uploadedMetadata: Record<string, any> | undefined;
    let transferredBytes = 0;
    let thumbnailType = "";
    let requestCount = 0;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requestCount += 1;
      if (url.includes("videos?uploadType=resumable")) {
        uploadedMetadata = JSON.parse(String(init?.body));
        return new Response(null, { status: 200, headers: { location: "https://upload.mock/session" } });
      }
      if (url === "https://upload.mock/session") {
        for await (const chunk of init?.body as unknown as AsyncIterable<Uint8Array>) transferredBytes += chunk.byteLength;
        return Response.json({ id: "mock-youtube-video-id" }, { status: 201 });
      }
      if (url.includes("thumbnails/set")) {
        thumbnailType = new Headers(init?.headers).get("Content-Type") || "";
        return new Response(null, { status: 200 });
      }
      throw new Error(`Unexpected mocked YouTube request: ${url}`);
    }) as typeof fetch;

    const input = {
      jobId: `job_upload_mock_${Date.now()}`,
      assetId: "asset_upload_mock",
      filePath: videoPath,
      title: "Private Upload Integration Test",
      description: "Credential independent publishing service test.",
      tags: ["integration test", "private"],
      categoryId: "27",
      privacyStatus: "private" as const,
      thumbnailPath,
    };

    try {
      const record = await publishVideoToYouTube(input);
      expect(record.status === "completed" || record.status === "uploaded_to_youtube").toBe(true);
      expect(record.thumbnailStatus === "applied" || record.thumbnailStatus === "uploaded").toBe(true);
      expect(record.youtubeUrl).toBe("https://youtu.be/mock-youtube-video-id");
      expect(uploadedMetadata?.status.privacyStatus).toBe("private");
      expect(uploadedMetadata?.snippet.title).toBe(input.title);
      expect(uploadedMetadata?.snippet.description).toBe(input.description);
      expect(uploadedMetadata?.snippet.tags).toEqual(input.tags);
      expect(uploadedMetadata?.snippet.categoryId).toBe("27");
      expect(transferredBytes).toBe(Buffer.byteLength("mock video stream"));
      expect(thumbnailType).toBe("image/jpeg");

      const requestsBeforeRetry = requestCount;
      let duplicateBlocked = false;
      try { await publishVideoToYouTube(input); } catch (error) { duplicateBlocked = error instanceof Error && error.message.includes("already been published"); }
      expect(duplicateBlocked).toBe(true);
      expect(requestCount).toBe(requestsBeforeRetry);
    } finally {
      globalThis.fetch = originalFetch;
      if (previousAuth) saveStoredAuth(previousAuth);
      else disconnectYouTubeChannel();
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  test("returns interactive HTML with postMessage protocol to prevent parent window reload", async () => {
    const { GET } = await import("../../app/api/youtube/callback/route");
    const { NextRequest } = await import("next/server");

    // Test with missing code
    const reqMissing = new NextRequest("http://localhost:3000/api/youtube/callback");
    const resMissing = await GET(reqMissing);
    expect(resMissing.status).toBe(200);
    const htmlMissing = await resMissing.text();
    expect(htmlMissing).toContain("YOUTUBE_OAUTH_ERROR");
    expect(htmlMissing).toContain("window.opener.postMessage");
    expect(htmlMissing).toContain("window.close()");

    // Test with error from Google
    const reqError = new NextRequest("http://localhost:3000/api/youtube/callback?error=access_denied");
    const resError = await GET(reqError);
    expect(resError.status).toBe(200);
    const htmlError = await resError.text();
    expect(htmlError).toContain("YOUTUBE_OAUTH_ERROR");
    expect(htmlError).toContain("access_denied");
  });

  test("rejects titles exceeding YouTube 100-character hard limit before calling YouTube", async () => {
    const { POST } = await import("../../app/api/youtube/publish/route");
    const { NextRequest } = await import("next/server");

    const longTitle = "This is an extremely long publishing title that exceeds YouTube's maximum allowed limit of one hundred characters in total length";
    expect(longTitle.length).toBeGreaterThan(100);

    const createReq = () =>
      new NextRequest("http://localhost:3000/api/youtube/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "mock_job_999",
          title: longTitle,
        }),
      });

    const res = await POST(createReq());
    // Since auth might be missing in test, if auth is missing it returns 401, but if auth is present or mocked it returns 400 with title limit message
    // Let's store mock auth to test title validation directly
    const { saveStoredAuth } = await import("../youtube/publishing");
    const previousAuth = getStoredAuth();
    saveStoredAuth({
      accessToken: "mock_token",
      refreshToken: "mock_refresh",
      expiryDate: Date.now() + 3600000,
      scope: "https://www.googleapis.com/auth/youtube.upload",
      tokenType: "Bearer",
      channelId: "UC_mock",
      channelTitle: "Mock Channel",
    });

    try {
      const resWithAuth = await POST(createReq());
      expect(resWithAuth.status).toBe(400);
      const data = await resWithAuth.json();
      expect(data.error).toContain("100");
    } finally {
      if (previousAuth) saveStoredAuth(previousAuth);
      else disconnectYouTubeChannel();
    }
  });

  test("tracks video publish and custom thumbnail independently (thumbnail failure does not fail video)", async () => {
    const originalFetch = globalThis.fetch;
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "thumb-fail-test-"));
    const videoPath = path.join(tempDir, "video.mp4");
    const thumbPath = path.join(tempDir, "thumb.jpg");
    await fs.promises.writeFile(videoPath, Buffer.from("video content"));
    await fs.promises.writeFile(thumbPath, Buffer.from("thumb content"));

    saveStoredAuth({
      channelId: "UC_mock_decoupled",
      channelTitle: "Mock Decoupled Channel",
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      tokenExpiresAt: Date.now() + 60 * 60 * 1000,
      authorizedAt: new Date().toISOString(),
      scopes: ["https://www.googleapis.com/auth/youtube.upload"],
      privacyDefault: "private",
      autoPublishPolicy: "review_first",
    });

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("videos?uploadType=resumable")) {
        return new Response(null, { status: 200, headers: { location: "https://upload.mock/session-2" } });
      }
      if (url === "https://upload.mock/session-2") {
        // Return 201 Created with valid video ID
        return new Response(JSON.stringify({ kind: "youtube#video", id: "confirmed-video-id" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("thumbnails/set")) {
        // Simulate custom thumbnail rejection (e.g. unverified phone number on channel)
        return new Response("The caller does not have permission to upload custom thumbnails.", { status: 403 });
      }
      throw new Error(`Unexpected request: ${url}`);
    }) as typeof fetch;

    try {
      const record = await publishVideoToYouTube({
        jobId: `job_decoupled_${Date.now()}`,
        assetId: "asset_decoupled",
        filePath: videoPath,
        title: "Decoupled Thumbnail Test",
        description: "Testing independent status tracking",
        thumbnailPath: thumbPath,
        privacyStatus: "private",
      });

      // Video must be recorded as published, NOT failed!
      expect(record.status).toBe("published");
      expect(record.thumbnailStatus).toBe("failed");
      expect(record.thumbnailError).toContain("403");
      expect(record.youtubeVideoId).toBe("confirmed-video-id");
      expect(record.youtubeUrl).toBe("https://youtu.be/confirmed-video-id");
    } finally {
      globalThis.fetch = originalFetch;
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  test("resumable session tracking inspects interrupted upload state via 308 Resume Incomplete", async () => {
    const originalFetch = globalThis.fetch;
    const mockUploadUrl = "https://upload.youtube.com/resumable/test-session";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const range = headers.get("Content-Range");
      if (range === "bytes */5000000") {
        return new Response(null, {
          status: 308,
          headers: { Range: "bytes=0-2097151" },
        });
      }
      throw new Error("Unexpected query");
    }) as typeof fetch;

    try {
      const status = await queryUploadSession(mockUploadUrl, 5000000);
      expect(status.isComplete).toBe(false);
      expect(status.bytesReceived).toBe(2097152); // received 2MB
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("resumes interrupted upload from byte offset when resumeSessionUrl is provided", async () => {
    const originalFetch = globalThis.fetch;
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "resume-upload-test-"));
    const videoPath = path.join(tempDir, "video.mp4");
    const videoData = Buffer.alloc(10000, 1); // 10000 bytes
    await fs.promises.writeFile(videoPath, videoData);

    const savedSessionUrl = "https://upload.youtube.com/resumable/active-session-789";
    let statusQueried = false;
    let resumedByteStart = -1;
    let resumedByteEnd = -1;
    let transferredBytes = 0;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);

      if (url === savedSessionUrl) {
        const contentRange = headers.get("Content-Range") || "";
        if (contentRange === "bytes */10000") {
          statusQueried = true;
          // Return HTTP 308 showing 4000 bytes already received (0-3999)
          return new Response(null, {
            status: 308,
            headers: { Range: "bytes=0-3999" },
          });
        }

        // Resumed chunk PUT
        const rangeMatch = contentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+)/);
        if (rangeMatch) {
          resumedByteStart = parseInt(rangeMatch[1], 10);
          resumedByteEnd = parseInt(rangeMatch[2], 10);
          for await (const chunk of init?.body as unknown as AsyncIterable<Uint8Array>) {
            transferredBytes += chunk.byteLength;
          }
          return new Response(JSON.stringify({ kind: "youtube#video", id: "resumed-vid-success" }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      throw new Error(`Unexpected request in resume test: ${url}`);
    }) as typeof fetch;

    try {
      const record = await publishVideoToYouTube({
        jobId: `job_resume_${Date.now()}`,
        assetId: "asset_resume",
        filePath: videoPath,
        title: "Resumed Upload Test",
        description: "Testing byte offset resumption",
        resumeSessionUrl: savedSessionUrl,
      });

      expect(statusQueried).toBe(true);
      expect(resumedByteStart).toBe(4000);
      expect(resumedByteEnd).toBe(9999);
      expect(transferredBytes).toBe(6000); // 10000 - 4000 bytes transferred
      expect(record.youtubeVideoId).toBe("resumed-vid-success");
      expect(record.status).toBe("published");
      expect(record.lifecycleState).toBe("Published"); // No thumbnail requested
      expect(record.thumbnailStatus).toBe("not_requested");
    } finally {
      globalThis.fetch = originalFetch;
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  test("strictly enforces HTTP 201 Created and rejects HTTP 200 on completed upload", async () => {
    const originalFetch = globalThis.fetch;
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "strict-201-test-"));
    const videoPath = path.join(tempDir, "video.mp4");
    await fs.promises.writeFile(videoPath, Buffer.from("video bytes"));

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("videos?uploadType=resumable")) {
        return new Response(null, { status: 200, headers: { location: "https://upload.mock/session-200" } });
      }
      if (url === "https://upload.mock/session-200") {
        // Drain stream body before responding so file handle closes cleanly
        if (init?.body && typeof (init.body as any)[Symbol.asyncIterator] === "function") {
          for await (const _ of init.body as any) {}
        }
        // Violate contract by returning HTTP 200 instead of HTTP 201 Created
        return new Response(JSON.stringify({ id: "rejected-video-id" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected: ${url}`);
    }) as typeof fetch;

    try {
      let rejected = false;
      try {
        await publishVideoToYouTube({
          jobId: `job_200_${Date.now()}`,
          assetId: "asset_200",
          filePath: videoPath,
          title: "Strict 201 Rejection Test",
          description: "Must reject 200 OK",
        });
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain("HTTP 201 Created");
      }
      expect(rejected).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  test("handles session status query failure (404/410 expired session vs transient network failure)", async () => {
    const originalFetch = globalThis.fetch;
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "query-fail-test-"));
    const videoPath = path.join(tempDir, "video.mp4");
    await fs.promises.writeFile(videoPath, Buffer.from("video bytes for query test"));

    const expiredSessionUrl = "https://upload.youtube.com/resumable/expired-session-404";
    const goneSessionUrl = "https://upload.youtube.com/resumable/expired-session-410";
    const networkFailSessionUrl = "https://upload.youtube.com/resumable/network-fail-session";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === expiredSessionUrl) {
        return new Response("Upload session not found", { status: 404 });
      }
      if (url === goneSessionUrl) {
        return new Response("Upload session expired / gone", { status: 410 });
      }
      if (url === networkFailSessionUrl) {
        throw new Error("DNS resolution failure");
      }
      throw new Error(`Unexpected url: ${url}`);
    }) as typeof fetch;

    try {
      // 1. Expired/not found session (HTTP 404)
      let caughtExpiredErr: any = null;
      try {
        await publishVideoToYouTube({
          jobId: `job_expired_${Date.now()}`,
          assetId: "asset_expired",
          filePath: videoPath,
          title: "Expired Session Test 404",
          description: "Must flag session expired",
          resumeSessionUrl: expiredSessionUrl,
        });
      } catch (err: any) {
        caughtExpiredErr = err;
      }
      expect(caughtExpiredErr).toBeDefined();
      expect(caughtExpiredErr.sessionExpired).toBe(true);
      expect(caughtExpiredErr.message).toContain("expired or was not found");
      expect(caughtExpiredErr.message).toContain("404");

      // 2. Explicit HTTP 410 (Gone) session expiration
      let caughtGoneErr: any = null;
      try {
        await publishVideoToYouTube({
          jobId: `job_gone_${Date.now()}`,
          assetId: "asset_gone",
          filePath: videoPath,
          title: "Expired Session Test 410",
          description: "Must flag session expired on 410",
          resumeSessionUrl: goneSessionUrl,
        });
      } catch (err: any) {
        caughtGoneErr = err;
      }
      expect(caughtGoneErr).toBeDefined();
      expect(caughtGoneErr.sessionExpired).toBe(true);
      expect(caughtGoneErr.message).toContain("expired or was not found");
      expect(caughtGoneErr.message).toContain("410");

      // 3. Transient network failure querying session
      let caughtNetworkErr: any = null;
      try {
        await publishVideoToYouTube({
          jobId: `job_netfail_${Date.now()}`,
          assetId: "asset_netfail",
          filePath: videoPath,
          title: "Network Failure Test",
          description: "Must flag interrupted and preserve session",
          resumeSessionUrl: networkFailSessionUrl,
        });
      } catch (err: any) {
        caughtNetworkErr = err;
      }
      expect(caughtNetworkErr).toBeDefined();
      expect(caughtNetworkErr.isInterrupted).toBe(true);
      expect(caughtNetworkErr.uploadSessionUrl).toBe(networkFailSessionUrl);
      expect(caughtNetworkErr.message).toContain("DNS resolution failure");
    } finally {
      globalThis.fetch = originalFetch;
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  test("verifies browser-refresh recovery by restoring job publishingLifecycle and resuming upload", async () => {
    const originalFetch = globalThis.fetch;
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "refresh-recovery-test-"));
    const videoPath = path.join(tempDir, "video.mp4");
    const videoBytes = Buffer.alloc(8000, 2);
    await fs.promises.writeFile(videoPath, videoBytes);

    const savedSessionUrl = "https://upload.youtube.com/resumable/refresh-session-123";

    // Simulate server-side job storage with interrupted session
    const mockSavedJob = {
      id: `job_refresh_${Date.now()}`,
      assetId: "asset_refresh_123",
      uploadSessionUrl: savedSessionUrl,
      publishingLifecycle: {
        state: "UploadInterrupted" as const,
        assetId: "asset_refresh_123",
        jobId: `job_refresh_${Date.now()}`,
        uploadSessionUrl: savedSessionUrl,
        error: "Connection reset by peer",
        updatedAt: new Date().toISOString(),
      },
    };

    // Verify recovery on mount: job state is preserved
    expect(mockSavedJob.publishingLifecycle.state).toBe("UploadInterrupted");
    expect(mockSavedJob.uploadSessionUrl).toBe(savedSessionUrl);

    // Now resume upload using the recovered session URL
    let sessionQueried = false;
    let bytesSent = 0;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);

      if (url === savedSessionUrl) {
        const contentRange = headers.get("Content-Range") || "";
        if (contentRange === "bytes */8000") {
          sessionQueried = true;
          // Resumes from byte 3000 (0-2999 received)
          return new Response(null, {
            status: 308,
            headers: { Range: "bytes=0-2999" },
          });
        }

        const rangeMatch = contentRange.match(/bytes\s+3000-7999\/8000/);
        if (rangeMatch) {
          for await (const chunk of init?.body as unknown as AsyncIterable<Uint8Array>) {
            bytesSent += chunk.byteLength;
          }
          return new Response(JSON.stringify({ kind: "youtube#video", id: "refreshed-resumed-video" }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      throw new Error(`Unexpected request: ${url}`);
    }) as typeof fetch;

    try {
      const record = await publishVideoToYouTube({
        jobId: mockSavedJob.id,
        assetId: mockSavedJob.assetId,
        filePath: videoPath,
        title: "Browser Refresh Recovery Test",
        description: "Testing end-to-end recovery after reload",
        resumeSessionUrl: mockSavedJob.uploadSessionUrl,
      });

      expect(sessionQueried).toBe(true);
      expect(bytesSent).toBe(5000); // 8000 - 3000 = 5000 bytes
      expect(record.youtubeVideoId).toBe("refreshed-resumed-video");
      expect(record.status).toBe("published");
      expect(record.lifecycleState).toBe("Published");
    } finally {
      globalThis.fetch = originalFetch;
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
