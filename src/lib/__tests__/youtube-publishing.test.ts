import { describe, expect, test } from "bun:test";
import {
  generateOAuthUrl,
  getStoredAuth,
  saveStoredAuth,
  disconnectYouTubeChannel,
  isAlreadyPublished,
  recordPublishedVideo,
  StoredYouTubeAuth,
} from "../youtube/publishing";

describe("YouTube OAuth & Publishing Workflow", () => {
  test("generates Google OAuth 2.0 URL with required scopes", () => {
    process.env.YOUTUBE_OAUTH_CLIENT_ID = "mock_client_id_123.apps.googleusercontent.com";
    const url = generateOAuthUrl("http://localhost:3000/api/youtube/callback");

    expect(url).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("mock_client_id_123");
    expect(url).toContain("youtube.upload");
    expect(url).toContain("youtube.readonly");
  });

  test("stores and retrieves authorized channel credentials securely", () => {
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

    disconnectYouTubeChannel();
    expect(getStoredAuth()).toBeNull();
  });

  test("prevents duplicate uploads for identical jobs", () => {
    const mockJobId = "job_test_duplicate_check";
    const mockTitle = "How to Code with AI";

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
});
