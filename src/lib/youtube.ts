export interface ResolvedChannelIdentifier {
  id?: string;
  handle?: string;
  username?: string;
}

export interface YouTubeChannelProfile {
  id: string;
  title: string;
  description: string;
  customUrl: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  hiddenSubscriberCount: boolean;
  totalViews: number;
  videoCount: number;
  uploadsPlaylistId: string | null;
}

export interface YouTubeVideoSummary {
  id: string;
  channelId: string;
  title: string;
  publishedAt: string | null;
  duration: string;
  durationSeconds: number;
  format: "long-form" | "short";
  viewCount: number;
  thumbnailUrl: string | null;
}

/**
 * Parses user input to extract channel ID, handle, or username
 */
export function parseChannelIdentifier(input: string): ResolvedChannelIdentifier {
  const raw = String(input || "").trim();
  if (!raw) return {};

  const channelMatch = raw.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/i);
  if (channelMatch) return { id: channelMatch[1] };

  const handleUrlMatch = raw.match(/youtube\.com\/@([A-Za-z0-9._-]+)/i);
  if (handleUrlMatch) return { handle: handleUrlMatch[1] };

  const legacyUserMatch = raw.match(/youtube\.com\/user\/([A-Za-z0-9_-]+)/i);
  if (legacyUserMatch) return { username: legacyUserMatch[1] };

  if (/^UC[A-Za-z0-9_-]{10,}$/.test(raw)) return { id: raw };
  if (raw.startsWith("@")) return { handle: raw.slice(1).split(/[/?#]/)[0] };
  if (/^https?:\/\//i.test(raw)) return {};

  return { handle: raw.replace(/^@/, "").split(/[/?#]/)[0] };
}

/**
 * Parses ISO 8601 duration string (e.g. PT15M33S or PT45S) into seconds
 */
export function parseIsoDuration(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

async function callYouTubeApi(
  endpoint: string,
  params: Record<string, string | number | undefined | null>,
  apiKey: string
): Promise<any> {
  const url = new URL("https://www.googleapis.com/youtube/v3/" + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }

  const response = await fetch(url.toString(), {
    headers: { "X-Goog-Api-Key": apiKey },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "YouTube Data API request failed";
    const reason = data?.error?.errors?.[0]?.reason || "youtube_api_error";
    const error: any = new Error(message);
    error.status = response.status;
    error.reason = reason;
    error.isQuotaError = reason === "quotaExceeded" || reason === "rateLimitExceeded";
    throw error;
  }

  return data;
}

/**
 * Resolves a channel identifier into full channel public profile
 */
export async function fetchYouTubeChannel(
  identifier: string,
  apiKey: string
): Promise<YouTubeChannelProfile | null> {
  const selector = parseChannelIdentifier(identifier);
  if (!selector.id && !selector.handle && !selector.username) {
    return null;
  }

  const lookup: Record<string, string> = {
    part: "snippet,statistics,contentDetails",
  };
  if (selector.id) lookup.id = selector.id;
  else if (selector.handle) lookup.forHandle = selector.handle;
  else lookup.forUsername = selector.username!;

  const res = await callYouTubeApi("channels", lookup, apiKey);
  const item = res.items?.[0];
  if (!item) return null;

  const s = item.snippet || {};
  const stats = item.statistics || {};
  const cd = item.contentDetails || {};

  const subCount = stats.hiddenSubscriberCount || stats.subscriberCount === undefined
    ? null
    : Number(stats.subscriberCount) || 0;

  return {
    id: item.id,
    title: s.title || "Untitled Channel",
    description: s.description || "",
    customUrl: s.customUrl || null,
    publishedAt: s.publishedAt || null,
    thumbnailUrl: s.thumbnails?.medium?.url || s.thumbnails?.default?.url || null,
    subscriberCount: subCount,
    hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
    totalViews: Number(stats.viewCount) || 0,
    videoCount: Number(stats.videoCount) || 0,
    uploadsPlaylistId: cd.relatedPlaylists?.uploads || null,
  };
}

/**
 * Retrieves recent uploads using the uploads playlist (saves search quota!)
 */
export async function fetchUploadsPlaylistVideos(
  uploadsPlaylistId: string,
  apiKey: string,
  maxResults: number = 30
): Promise<YouTubeVideoSummary[]> {
  if (!uploadsPlaylistId) return [];

  // 1. Fetch playlist items
  const playlistRes = await callYouTubeApi(
    "playlistItems",
    {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(50, maxResults),
    },
    apiKey
  );

  const items = playlistRes.items || [];
  const videoIds = items
    .map((item: any) => item.contentDetails?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) return [];

  // 2. Fetch video details in batched call (up to 50 videos in 1 API call)
  const videoDetailsRes = await callYouTubeApi(
    "videos",
    {
      part: "snippet,statistics,contentDetails",
      id: videoIds.join(","),
      maxResults: 50,
    },
    apiKey
  );

  const videoDetailsMap = new Map<string, any>();
  for (const v of videoDetailsRes.items || []) {
    videoDetailsMap.set(v.id, v);
  }

  const result: YouTubeVideoSummary[] = [];

  for (const item of items) {
    const videoId = item.contentDetails?.videoId;
    if (!videoId) continue;

    const full = videoDetailsMap.get(videoId);
    const s = full?.snippet || item.snippet || {};
    const stats = full?.statistics || {};
    const cd = full?.contentDetails || {};

    const duration = cd.duration || "PT0S";
    const durationSeconds = parseIsoDuration(duration);
    const format = durationSeconds > 0 && durationSeconds <= 60 ? "short" : "long-form";

    result.push({
      id: videoId,
      channelId: s.channelId || item.snippet?.channelId,
      title: s.title || "Untitled video",
      publishedAt: s.publishedAt || item.contentDetails?.videoPublishedAt || null,
      duration,
      durationSeconds,
      format,
      viewCount: Number(stats.viewCount) || 0,
      thumbnailUrl: s.thumbnails?.medium?.url || s.thumbnails?.default?.url || null,
    });
  }

  return result;
}
