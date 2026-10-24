import { getDbClient, initDatabase } from "./db";
import { fetchYouTubeChannel, fetchUploadsPlaylistVideos } from "./youtube";
import {
  TrackedChannel,
  ChannelViewSnapshot,
  TrackedVideo,
  RpmAssumption,
} from "./types/revenue";

/**
 * Adds a new channel to tracking or refreshes an existing one
 */
export async function trackOrRefreshChannel(
  identifier: string,
  niche: string = "general",
  apiKey: string
): Promise<{ channel: TrackedChannel; isNew: boolean; snapshotRecorded: boolean }> {
  await initDatabase();
  const db = getDbClient();

  const profile = await fetchYouTubeChannel(identifier, apiKey);
  if (!profile) {
    throw new Error(`Channel could not be resolved from identifier: "${identifier}"`);
  }

  const nowIso = new Date().toISOString();
  const todayDateStr = nowIso.slice(0, 10);

  // Check if channel already exists
  const existingRes = await db.execute({
    sql: "SELECT * FROM tracked_channels WHERE channel_id = ?;",
    args: [profile.id],
  });
  const isNew = existingRes.rows.length === 0;

  // Upsert channel
  await db.execute({
    sql: `
      INSERT INTO tracked_channels (
        channel_id, title, handle, custom_url, description, published_at,
        thumbnail_url, uploads_playlist_id, subscriber_count, hidden_subscriber_count,
        latest_total_views, video_count, first_tracked_at, last_synced_at,
        sync_status, last_sync_error, niche
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, ?)
      ON CONFLICT(channel_id) DO UPDATE SET
        title = excluded.title,
        handle = excluded.handle,
        custom_url = excluded.custom_url,
        description = excluded.description,
        thumbnail_url = excluded.thumbnail_url,
        uploads_playlist_id = excluded.uploads_playlist_id,
        subscriber_count = excluded.subscriber_count,
        hidden_subscriber_count = excluded.hidden_subscriber_count,
        latest_total_views = excluded.latest_total_views,
        video_count = excluded.video_count,
        last_synced_at = excluded.last_synced_at,
        sync_status = 'active',
        last_sync_error = NULL;
    `,
    args: [
      profile.id,
      profile.title,
      profile.customUrl,
      profile.customUrl,
      profile.description,
      profile.publishedAt,
      profile.thumbnailUrl,
      profile.uploadsPlaylistId,
      profile.subscriberCount,
      profile.hiddenSubscriberCount ? 1 : 0,
      profile.totalViews,
      profile.videoCount,
      isNew ? nowIso : (existingRes.rows[0].first_tracked_at as string),
      nowIso,
      niche,
    ],
  });

  // Check if a snapshot for this channel already exists today
  const existingSnapshotRes = await db.execute({
    sql: "SELECT id FROM channel_view_snapshots WHERE channel_id = ? AND substr(observed_at, 1, 10) = ?;",
    args: [profile.id, todayDateStr],
  });

  let snapshotRecorded = false;
  if (existingSnapshotRes.rows.length === 0) {
    await db.execute({
      sql: `
        INSERT INTO channel_view_snapshots (channel_id, cumulative_views, observed_at, source, metadata)
        VALUES (?, ?, ?, 'youtube_api', ?);
      `,
      args: [
        profile.id,
        profile.totalViews,
        nowIso,
        JSON.stringify({ videoCount: profile.videoCount, subCount: profile.subscriberCount }),
      ],
    });
    snapshotRecorded = true;
  } else {
    // Update today's snapshot to the latest view count
    await db.execute({
      sql: `
        UPDATE channel_view_snapshots 
        SET cumulative_views = ?, observed_at = ?
        WHERE id = ?;
      `,
      args: [profile.totalViews, nowIso, existingSnapshotRes.rows[0].id],
    });
  }

  // Fetch recent videos if uploads playlist exists
  if (profile.uploadsPlaylistId) {
    try {
      const videos = await fetchUploadsPlaylistVideos(profile.uploadsPlaylistId, apiKey, 30);
      for (const v of videos) {
        await db.execute({
          sql: `
            INSERT INTO tracked_videos (
              video_id, channel_id, title, published_at, duration,
              duration_seconds, format, format_source, latest_view_count,
              tracking_status, first_tracked_at, last_synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'inferred', ?, 'active', ?, ?)
            ON CONFLICT(video_id) DO UPDATE SET
              title = excluded.title,
              latest_view_count = excluded.latest_view_count,
              last_synced_at = excluded.last_synced_at;
          `,
          args: [
            v.id,
            profile.id,
            v.title,
            v.publishedAt,
            v.duration,
            v.durationSeconds,
            v.format,
            v.viewCount,
            nowIso,
            nowIso,
          ],
        });

        // Record video snapshot if none exists for today
        const existingVidSnap = await db.execute({
          sql: "SELECT id FROM video_view_snapshots WHERE video_id = ? AND substr(observed_at, 1, 10) = ?;",
          args: [v.id, todayDateStr],
        });
        if (existingVidSnap.rows.length === 0) {
          await db.execute({
            sql: `
              INSERT INTO video_view_snapshots (video_id, channel_id, cumulative_views, observed_at)
              VALUES (?, ?, ?, ?);
            `,
            args: [v.id, profile.id, v.viewCount, nowIso],
          });
        }
      }
    } catch (err: any) {
      console.warn(`Could not sync uploads for channel ${profile.id}:`, err?.message);
    }
  }

  const updatedChannelRes = await db.execute({
    sql: "SELECT * FROM tracked_channels WHERE channel_id = ?;",
    args: [profile.id],
  });

  const row = updatedChannelRes.rows[0];
  const channel: TrackedChannel = {
    channel_id: row.channel_id as string,
    title: row.title as string,
    handle: row.handle as string | null,
    custom_url: row.custom_url as string | null,
    description: row.description as string | null,
    published_at: row.published_at as string | null,
    thumbnail_url: row.thumbnail_url as string | null,
    uploads_playlist_id: row.uploads_playlist_id as string | null,
    subscriber_count: row.subscriber_count !== null ? Number(row.subscriber_count) : null,
    hidden_subscriber_count: Boolean(row.hidden_subscriber_count),
    latest_total_views: Number(row.latest_total_views),
    video_count: Number(row.video_count),
    first_tracked_at: row.first_tracked_at as string,
    last_synced_at: row.last_synced_at as string | null,
    sync_status: (row.sync_status as any) || "active",
    last_sync_error: row.last_sync_error as string | null,
    niche: (row.niche as string) || "general",
  };

  return { channel, isNew, snapshotRecorded };
}

/**
 * Synchronizes all tracked channels and their recent videos
 */
export async function syncAllChannels(apiKey: string): Promise<{
  total: number;
  synced: number;
  errors: number;
  details: { channelId: string; status: string; error?: string }[];
}> {
  await initDatabase();
  const db = getDbClient();

  const channelsRes = await db.execute("SELECT channel_id, niche FROM tracked_channels;");
  const channels = channelsRes.rows;

  const results: { channelId: string; status: string; error?: string }[] = [];
  let synced = 0;
  let errors = 0;

  for (const c of channels) {
    const channelId = c.channel_id as string;
    const niche = (c.niche as string) || "general";
    try {
      await trackOrRefreshChannel(channelId, niche, apiKey);
      synced++;
      results.push({ channelId, status: "success" });
    } catch (err: any) {
      errors++;
      results.push({ channelId, status: "error", error: err?.message || "Sync failed" });
      await db.execute({
        sql: "UPDATE tracked_channels SET sync_status = 'error', last_sync_error = ? WHERE channel_id = ?;",
        args: [err?.message || "Sync failed", channelId],
      });
    }
  }

  return {
    total: channels.length,
    synced,
    errors,
    details: results,
  };
}

/**
 * Retrieves all tracked channels from the database
 */
export async function getTrackedChannels(): Promise<TrackedChannel[]> {
  await initDatabase();
  const db = getDbClient();

  const res = await db.execute("SELECT * FROM tracked_channels ORDER BY title ASC;");
  return res.rows.map((row: any) => ({
    channel_id: row.channel_id as string,
    title: row.title as string,
    handle: row.handle as string | null,
    custom_url: row.custom_url as string | null,
    description: row.description as string | null,
    published_at: row.published_at as string | null,
    thumbnail_url: row.thumbnail_url as string | null,
    uploads_playlist_id: row.uploads_playlist_id as string | null,
    subscriber_count: row.subscriber_count !== null ? Number(row.subscriber_count) : null,
    hidden_subscriber_count: Boolean(row.hidden_subscriber_count),
    latest_total_views: Number(row.latest_total_views),
    video_count: Number(row.video_count),
    first_tracked_at: row.first_tracked_at as string,
    last_synced_at: row.last_synced_at as string | null,
    sync_status: (row.sync_status as any) || "active",
    last_sync_error: row.last_sync_error as string | null,
    niche: (row.niche as string) || "general",
  }));
}

/**
 * Retrieves historical view snapshots for a channel
 */
export async function getChannelSnapshots(channelId: string): Promise<ChannelViewSnapshot[]> {
  await initDatabase();
  const db = getDbClient();

  const res = await db.execute({
    sql: "SELECT * FROM channel_view_snapshots WHERE channel_id = ? ORDER BY observed_at ASC;",
    args: [channelId],
  });

  return res.rows.map((row: any) => ({
    id: Number(row.id),
    channel_id: row.channel_id as string,
    cumulative_views: Number(row.cumulative_views),
    observed_at: row.observed_at as string,
    source: (row.source as string) || "youtube_api",
    metadata: row.metadata as string | null,
  }));
}

/**
 * Retrieves tracked videos for a channel
 */
export async function getTrackedVideos(channelId: string): Promise<TrackedVideo[]> {
  await initDatabase();
  const db = getDbClient();

  const res = await db.execute({
    sql: "SELECT * FROM tracked_videos WHERE channel_id = ? ORDER BY published_at DESC LIMIT 50;",
    args: [channelId],
  });

  return res.rows.map((row: any) => ({
    video_id: row.video_id as string,
    channel_id: row.channel_id as string,
    title: row.title as string,
    published_at: row.published_at as string | null,
    duration: row.duration as string | null,
    duration_seconds: Number(row.duration_seconds || 0),
    format: (row.format as any) || "long-form",
    format_source: (row.format_source as any) || "inferred",
    latest_view_count: Number(row.latest_view_count),
    tracking_status: (row.tracking_status as any) || "active",
    first_tracked_at: row.first_tracked_at as string,
    last_synced_at: row.last_synced_at as string | null,
  }));
}

/**
 * Resolves an applicable RPM assumption with hierarchical fallbacks
 */
export async function findRpmAssumption(
  category: string,
  region: string,
  format: string = "long-form",
  currency: string = "USD"
): Promise<RpmAssumption | null> {
  await initDatabase();
  const db = getDbClient();

  const cat = category.toLowerCase().trim();
  const reg = region.toUpperCase().trim();
  const fmt = format.toLowerCase().trim();
  const cur = currency.toUpperCase().trim();

  // 1. Exact match: (category, region, format, currency)
  let res = await db.execute({
    sql: "SELECT * FROM rpm_assumptions WHERE category = ? AND region = ? AND format = ? AND currency = ?;",
    args: [cat, reg, fmt, cur],
  });
  if (res.rows.length > 0) return rowToRpm(res.rows[0]);

  // 2. Region fallback to 'GLOBAL': (category, 'GLOBAL', format, currency)
  res = await db.execute({
    sql: "SELECT * FROM rpm_assumptions WHERE category = ? AND region = 'GLOBAL' AND format = ? AND currency = ?;",
    args: [cat, fmt, cur],
  });
  if (res.rows.length > 0) return rowToRpm(res.rows[0]);

  // 3. Category fallback to 'general': ('general', region, format, currency)
  res = await db.execute({
    sql: "SELECT * FROM rpm_assumptions WHERE category = 'general' AND region = ? AND format = ? AND currency = ?;",
    args: [reg, fmt, cur],
  });
  if (res.rows.length > 0) return rowToRpm(res.rows[0]);

  // 4. Baseline fallback: ('general', 'GLOBAL', format, currency)
  res = await db.execute({
    sql: "SELECT * FROM rpm_assumptions WHERE category = 'general' AND region = 'GLOBAL' AND format = ? AND currency = ?;",
    args: [fmt, cur],
  });
  if (res.rows.length > 0) return rowToRpm(res.rows[0]);

  return null;
}

export async function getAllRpmAssumptions(): Promise<RpmAssumption[]> {
  await initDatabase();
  const db = getDbClient();

  const res = await db.execute("SELECT * FROM rpm_assumptions ORDER BY category ASC, region ASC, format ASC;");
  return res.rows.map(rowToRpm);
}

export async function upsertRpmAssumption(rpm: Omit<RpmAssumption, "id">): Promise<void> {
  await initDatabase();
  const db = getDbClient();

  await db.execute({
    sql: `
      INSERT INTO rpm_assumptions (
        category, region, format, currency, rpm_low, rpm_typical, rpm_high,
        source_name, source_url, effective_date, confidence, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(category, region, format, currency) DO UPDATE SET
        rpm_low = excluded.rpm_low,
        rpm_typical = excluded.rpm_typical,
        rpm_high = excluded.rpm_high,
        source_name = excluded.source_name,
        source_url = excluded.source_url,
        effective_date = excluded.effective_date,
        confidence = excluded.confidence,
        notes = excluded.notes;
    `,
    args: [
      rpm.category.toLowerCase(),
      rpm.region.toUpperCase(),
      rpm.format.toLowerCase(),
      rpm.currency.toUpperCase(),
      rpm.rpm_low,
      rpm.rpm_typical,
      rpm.rpm_high,
      rpm.source_name,
      rpm.source_url,
      rpm.effective_date,
      rpm.confidence,
      rpm.notes || null,
    ],
  });
}

function rowToRpm(row: any): RpmAssumption {
  return {
    id: Number(row.id),
    category: row.category as string,
    region: row.region as string,
    format: row.format as any,
    currency: row.currency as string,
    rpm_low: Number(row.rpm_low),
    rpm_typical: Number(row.rpm_typical),
    rpm_high: Number(row.rpm_high),
    source_name: row.source_name as string,
    source_url: row.source_url as string,
    effective_date: row.effective_date as string,
    confidence: row.confidence as any,
    notes: row.notes as string | null,
  };
}
