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
        return Response.json({ id: "mock-youtube-video-id" });
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
      expect(record.status).toBe("uploaded_to_youtube");
      expect(record.thumbnailStatus).toBe("uploaded");
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

    const req = new NextRequest("http://localhost:3000/api/youtube/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "mock_job_999",
        title: longTitle,
      }),
    });

    const res = await POST(req);
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
      const resWithAuth = await POST(req);
      expect(resWithAuth.status).toBe(400);
      const data = await resWithAuth.json();
      expect(data.error).toContain("100");
    } finally {
      if (previousAuth) saveStoredAuth(previousAuth);
      else disconnectYouTubeChannel();
    }
  });
});
