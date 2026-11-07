/**
 * src/lib/youtube/publishing.ts
 * YouTube OAuth 2.0 Authorization & Resumable Video Publishing Workflow
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createReadStream } from "fs";
import { PublishingLifecycleState } from "../types/publishingLifecycle";

const OAUTH_FILE_PATH = path.join(process.cwd(), "data", "youtube_oauth.json");
const PUBLISH_LOG_FILE_PATH = path.join(process.cwd(), "data", "youtube_publish_history.json");

export interface StoredYouTubeAuth {
  channelId: string;
  channelTitle: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  authorizedAt: string;
  scopes: string[];
  privacyDefault: "private" | "unlisted" | "public";
  autoPublishPolicy: "disabled" | "review_first" | "auto_private" | "auto_unlisted";
}

export interface PublishPackageInput {
  jobId: string;
  assetId: string;
  filePath: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: "private" | "unlisted" | "public";
  categoryId?: string;
  publishAt?: string; // ISO 8601 for scheduled publishing
  isShort?: boolean;
  thumbnailPath?: string;
  resumeSessionUrl?: string;
}

export type PublishStatus =
  | "pending"
  | "uploading"
  | "published"
  | "completed"
  | "uploaded_to_youtube"
  | "failed";

export type ThumbnailPublishStatus =
  | "not_requested"
  | "pending"
  | "applied"
  | "uploaded"
  | "failed";

export interface PublishedVideoRecord {
  id: string;
  jobId: string;
  assetId: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  title: string;
  privacyStatus: string;
  publishedAt: string;
  channelId: string;
  status: PublishStatus;
  lifecycleState?: PublishingLifecycleState;
  thumbnailStatus?: ThumbnailPublishStatus;
  thumbnailError?: string;
  uploadSessionUrl?: string;
}

function ensureStorage(): void {
  const dir = path.dirname(OAUTH_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getStoredAuth(): StoredYouTubeAuth | null {
  ensureStorage();
  if (!fs.existsSync(OAUTH_FILE_PATH)) return null;
  try {
    const raw = fs.readFileSync(OAUTH_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredYouTubeAuth): void {
  ensureStorage();
  fs.writeFileSync(OAUTH_FILE_PATH, JSON.stringify(auth, null, 2), "utf-8");
}

export function disconnectYouTubeChannel(): void {
  ensureStorage();
  if (fs.existsSync(OAUTH_FILE_PATH)) {
    fs.unlinkSync(OAUTH_FILE_PATH);
  }
}

export function getPublishHistory(): PublishedVideoRecord[] {
  ensureStorage();
  if (!fs.existsSync(PUBLISH_LOG_FILE_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(PUBLISH_LOG_FILE_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function recordPublishedVideo(record: PublishedVideoRecord): void {
  const history = getPublishHistory();
  // Prevent duplicate records
  const existingIdx = history.findIndex((h) => h.jobId === record.jobId && h.title === record.title);
  if (existingIdx >= 0) {
    history[existingIdx] = record;
  } else {
    history.unshift(record);
  }
  fs.writeFileSync(PUBLISH_LOG_FILE_PATH, JSON.stringify(history, null, 2), "utf-8");
}

export function isAlreadyPublished(jobId: string, title: string): boolean {
  const history = getPublishHistory();
  return history.some((h) => h.jobId === jobId && h.title === title && h.status !== "failed");
}

/**
 * Generate Google OAuth 2.0 URL
 */
export function generateOAuthUrl(redirectUri: string): string {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || "";
  if (!clientId) {
    throw new Error("YOUTUBE_OAUTH_CLIENT_ID is not configured in environment.");
  }

  const scopes = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const state = createOAuthState();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function createOAuthState(): string {
  const secret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET || "";
  if (!secret) throw new Error("YOUTUBE_OAUTH_CLIENT_SECRET is not configured in environment.");
  const payload = Buffer.from(JSON.stringify({ issuedAt: Date.now(), nonce: crypto.randomBytes(16).toString("hex") })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state: string | null): boolean {
  const secret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET || "";
  if (!secret || !state) return false;
  const [payload, signature, extra] = state.split(".");
  if (!payload || !signature || extra) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, "base64url"); } catch { return false; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(data.issuedAt) && Math.abs(Date.now() - data.issuedAt) <= 10 * 60 * 1000 && typeof data.nonce === "string";
  } catch { return false; }
}

/**
 * Exchange Authorization Code for Tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<StoredYouTubeAuth> {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || "";
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    throw new Error("Missing YOUTUBE_OAUTH_CLIENT_ID or YOUTUBE_OAUTH_CLIENT_SECRET.");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to exchange authorization code: ${errText}`);
  }

  const tokens = await tokenRes.json();
  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token || "";
  const expiresIn = tokens.expires_in || 3600;

  // Retrieve channel details
  const chRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let channelId = "connected_channel";
  let channelTitle = "My YouTube Channel";
  let avatarUrl = undefined;

  if (chRes.ok) {
    const chData = await chRes.json();
    const item = chData.items?.[0];
    if (item) {
      channelId = item.id;
      channelTitle = item.snippet?.title || channelTitle;
      avatarUrl = item.snippet?.thumbnails?.default?.url;
    }
  }

  const authData: StoredYouTubeAuth = {
    channelId,
    channelTitle,
    avatarUrl,
    accessToken,
    refreshToken,
    tokenExpiresAt: Date.now() + expiresIn * 1000,
    authorizedAt: new Date().toISOString(),
    scopes: tokens.scope?.split(" ") || [],
    privacyDefault: "private",
    autoPublishPolicy: "review_first",
  };

  saveStoredAuth(authData);
  return authData;
}

/**
 * Refresh access token if expired
 */
export async function getValidAccessToken(): Promise<string> {
  const auth = getStoredAuth();
  if (!auth) {
    throw new Error("No YouTube account connected. Connect your account in settings.");
  }

  // If token is still valid with at least 5 minutes buffer
  if (auth.tokenExpiresAt > Date.now() + 5 * 60 * 1000) {
    return auth.accessToken;
  }

  if (!auth.refreshToken) {
    return auth.accessToken;
  }

  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || "";
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET || "";

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: auth.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh YouTube access token. Please reconnect your account.");
  }

  const data = await res.json();
  auth.accessToken = data.access_token;
  auth.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  saveStoredAuth(auth);

  return auth.accessToken;
}

/**
 * Publish video to YouTube with resumable upload
 */
export async function publishVideoToYouTube(
  input: PublishPackageInput
): Promise<PublishedVideoRecord> {
  const auth = getStoredAuth();
  if (!auth) {
    throw new Error("No YouTube account connected. Please connect your channel first.");
  }

  if (isAlreadyPublished(input.jobId, input.title)) {
    throw new Error(`This video has already been published to YouTube (duplicate upload prevented).`);
  }

  if (!fs.existsSync(input.filePath)) {
    throw new Error(`Video file does not exist on disk: ${input.filePath}`);
  }

  const accessToken = await getValidAccessToken();
  const stat = await fs.promises.stat(input.filePath);
  const privacy = input.privacyStatus || auth.privacyDefault || "private";

  let activeUploadUrl = input.resumeSessionUrl;
  let youtubeVideoId = "";

  if (activeUploadUrl) {
    // Resume existing interrupted upload session from verified byte offset
    const sessionStatus = await queryUploadSession(activeUploadUrl, stat.size);
    if (sessionStatus.isComplete && sessionStatus.videoId) {
      youtubeVideoId = sessionStatus.videoId;
    } else {
      const startOffset = sessionStatus.bytesReceived;
      const remainingBytes = stat.size - startOffset;
      const resumeStream = createReadStream(input.filePath, { start: startOffset });

      let uploadRes: Response;
      try {
        uploadRes = await fetch(activeUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "video/mp4",
            "Content-Range": `bytes ${startOffset}-${stat.size - 1}/${stat.size}`,
            "Content-Length": remainingBytes.toString(),
          },
          body: resumeStream as unknown as BodyInit,
          // @ts-expect-error Node.js fetch extension for streaming request bodies
          duplex: "half",
        });
      } catch (networkErr: any) {
        const err: any = new Error(`Network interruption while resuming upload: ${networkErr.message}. Session preserved at: ${activeUploadUrl}`);
        err.isInterrupted = true;
        err.uploadSessionUrl = activeUploadUrl;
        throw err;
      }

      if (uploadRes.status !== 201) {
        const uploadErr = await uploadRes.text().catch(() => "");
        if (uploadRes.status === 308) {
          const err: any = new Error(`YouTube resumable upload incomplete (HTTP 308). Upload session preserved at: ${activeUploadUrl}`);
          err.isInterrupted = true;
          err.uploadSessionUrl = activeUploadUrl;
          throw err;
        }
        throw new Error(`YouTube video upload did not return HTTP 201 Created (received HTTP ${uploadRes.status}: ${uploadErr})`);
      }

      const uploadData = await uploadRes.json();
      youtubeVideoId = uploadData?.id;
      if (!youtubeVideoId || typeof youtubeVideoId !== "string" || !youtubeVideoId.trim()) {
        throw new Error("YouTube API upload did not return a valid video resource with non-empty ID.");
      }
    }
  } else {
    // Step 1: Initiate brand new Resumable Upload Session
    const metadata = {
      snippet: {
        title: input.title.slice(0, 100),
        description: input.description,
        tags: input.tags || [],
        categoryId: input.categoryId && /^\d+$/.test(input.categoryId) ? input.categoryId : undefined,
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false,
        publishAt: input.publishAt || undefined,
      },
    };

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": stat.size.toString(),
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text();
      throw new Error(`YouTube API upload initiation failed: ${errText}`);
    }

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) {
      throw new Error("YouTube API did not return a resumable upload location URL.");
    }
    activeUploadUrl = uploadUrl;

    // Step 2: Stream the video
    let uploadRes: Response;
    try {
      uploadRes = await fetch(activeUploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": stat.size.toString(),
        },
        // Node's fetch requires the duplex option when given a streaming request body.
        body: createReadStream(input.filePath) as unknown as BodyInit,
        // @ts-expect-error Node.js fetch extension for streaming request bodies
        duplex: "half",
      });
    } catch (networkErr: any) {
      const err: any = new Error(`Network interruption during upload transfer: ${networkErr.message}. Session preserved at: ${activeUploadUrl}`);
      err.isInterrupted = true;
      err.uploadSessionUrl = activeUploadUrl;
      throw err;
    }

    // Strictly enforce HTTP 201 Created
    if (uploadRes.status !== 201) {
      const uploadErr = await uploadRes.text().catch(() => "");
      if (uploadRes.status === 308) {
        const err: any = new Error(`YouTube resumable upload incomplete (HTTP 308). Upload session preserved at: ${activeUploadUrl}`);
        err.isInterrupted = true;
        err.uploadSessionUrl = activeUploadUrl;
        throw err;
      }
      throw new Error(`YouTube video upload did not return HTTP 201 Created (received HTTP ${uploadRes.status}: ${uploadErr})`);
    }

    const uploadData = await uploadRes.json();
    youtubeVideoId = uploadData?.id;
    if (!youtubeVideoId || typeof youtubeVideoId !== "string" || !youtubeVideoId.trim()) {
      throw new Error("YouTube API upload did not return a valid video resource with non-empty ID.");
    }
  }

  const youtubeUrl = `https://youtu.be/${youtubeVideoId}`;

  // Step 3: Decoupled Custom Thumbnail Upload
  // Video is ALREADY successfully published (HTTP 201 verified). A thumbnail error must NOT invalidate video publication.
  let thumbnailStatus: ThumbnailPublishStatus = input.thumbnailPath ? "pending" : "not_requested";
  let thumbnailError: string | undefined = undefined;

  if (input.thumbnailPath && fs.existsSync(input.thumbnailPath) && youtubeVideoId) {
    try {
      const thumbBuffer = await fs.promises.readFile(input.thumbnailPath);
      const extension = path.extname(input.thumbnailPath).toLowerCase();
      const thumbRes = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${youtubeVideoId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png",
          },
          body: thumbBuffer,
        }
      );
      if (!thumbRes.ok) {
        const errBody = await thumbRes.text().catch(() => "");
        thumbnailStatus = "failed";
        thumbnailError = `HTTP ${thumbRes.status}: ${errBody.slice(0, 200)}`;
        console.warn(`Custom thumbnail upload failed (${thumbnailError}). Video remains published.`);
      } else {
        thumbnailStatus = "applied";
      }
    } catch (thumbErr: any) {
      thumbnailStatus = "failed";
      thumbnailError = thumbErr instanceof Error ? thumbErr.message : "Unknown thumbnail upload error";
      console.warn("Custom thumbnail upload failed gracefully:", thumbnailError);
    }
  }

  // Enforce distinct lifecycle and publishing states:
  // - applied -> Completed
  // - failed -> ThumbnailFailed
  // - not_requested -> Published (Never falsely mark as Completed)
  // - pending -> ThumbnailPending
  let lifecycleState: PublishingLifecycleState = "Published";
  let finalStatus: PublishStatus = "published";

  if (thumbnailStatus === "applied") {
    lifecycleState = "Completed";
    finalStatus = "completed";
  } else if (thumbnailStatus === "failed") {
    lifecycleState = "ThumbnailFailed";
    finalStatus = "published";
  } else if (thumbnailStatus === "pending") {
    lifecycleState = "ThumbnailPending";
    finalStatus = "published";
  } else {
    // not_requested
    lifecycleState = "Published";
    finalStatus = "published";
  }

  const record: PublishedVideoRecord = {
    id: `pub_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    jobId: input.jobId,
    assetId: input.assetId,
    youtubeVideoId,
    youtubeUrl,
    title: input.title,
    privacyStatus: privacy,
    publishedAt: new Date().toISOString(),
    channelId: auth.channelId,
    status: finalStatus,
    lifecycleState,
    thumbnailStatus,
    thumbnailError,
    uploadSessionUrl: activeUploadUrl,
  };

  recordPublishedVideo(record);
  return record;
}

/**
 * Query YouTube for the status of an interrupted resumable upload session.
 * HTTP 308 Resume Incomplete returns Range header indicating how many bytes have been received.
 * HTTP 201 Created or 200 OK indicates the upload has already completed.
 */
export async function queryUploadSession(
  uploadUrl: string,
  totalFileSize: number
): Promise<{
  isComplete: boolean;
  bytesReceived: number;
  videoId?: string;
}> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes */${totalFileSize}`,
    },
  });

  if (res.status === 201 || res.status === 200) {
    const data = await res.json().catch(() => null);
    return {
      isComplete: true,
      bytesReceived: totalFileSize,
      videoId: data?.id,
    };
  }

  if (res.status === 308) {
    const range = res.headers.get("Range");
    let bytesReceived = 0;
    if (range) {
      const match = range.match(/bytes=0-(\d+)/);
      if (match) bytesReceived = parseInt(match[1], 10) + 1;
    }
    return {
      isComplete: false,
      bytesReceived,
    };
  }

  throw new Error(`Failed to query upload session: HTTP ${res.status}`);
}
