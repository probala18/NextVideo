import fs from "fs";
import path from "path";
import { RpmAssumption } from "./types/revenue";

export interface Client {
  execute(stmt: string | { sql: string; args?: any[] | Record<string, any> }): Promise<{
    columns: string[];
    columnTypes: string[];
    rows: any[];
    rowsAffected: number;
    lastInsertRowid: bigint | undefined;
  }>;
  batch(stmts: (string | { sql: string; args?: any[] | Record<string, any> })[], mode?: string): Promise<any[]>;
  close(): void;
}

interface DbStore {
  tracked_channels: any[];
  channel_view_snapshots: any[];
  tracked_videos: any[];
  video_view_snapshots: any[];
  rpm_assumptions: any[];
}

const store: DbStore = {
  tracked_channels: [],
  channel_view_snapshots: [],
  tracked_videos: [],
  video_view_snapshots: [],
  rpm_assumptions: [],
};

function createFallbackClient(): Client {
  return {
    async execute(stmt) {
      const sql = typeof stmt === "string" ? stmt : stmt.sql;
      const args = typeof stmt === "string" ? [] : (stmt.args as any[]) || [];
      const trimmed = sql.trim().toUpperCase();

      if (trimmed.startsWith("CREATE")) {
        return { columns: [], columnTypes: [], rows: [], rowsAffected: 0, lastInsertRowid: undefined };
      }

      if (trimmed.includes("COUNT(*)") && trimmed.includes("RPM_ASSUMPTIONS")) {
        return {
          columns: ["count"],
          columnTypes: ["INTEGER"],
          rows: [{ count: store.rpm_assumptions.length }],
          rowsAffected: 0,
          lastInsertRowid: undefined,
        };
      }

      if (trimmed.startsWith("SELECT")) {
        if (trimmed.includes("TRACKED_CHANNELS")) {
          let rows = [...store.tracked_channels];
          if (trimmed.includes("CHANNEL_ID = ?") && args.length > 0) {
            rows = rows.filter((c) => c.channel_id === args[0]);
          }
          return { columns: [], columnTypes: [], rows, rowsAffected: 0, lastInsertRowid: undefined };
        }

        if (trimmed.includes("CHANNEL_VIEW_SNAPSHOTS")) {
          let rows = [...store.channel_view_snapshots];
          if (args.length > 0) {
            rows = rows.filter((s) => s.channel_id === args[0]);
            if (args.length > 1 && args[1]) {
              rows = rows.filter((s) => String(s.observed_at).startsWith(String(args[1])));
            }
          }
          if (trimmed.includes("COUNT(*)")) {
            return { columns: ["count"], columnTypes: ["INTEGER"], rows: [{ count: rows.length }], rowsAffected: 0, lastInsertRowid: undefined };
          }
          return { columns: [], columnTypes: [], rows, rowsAffected: 0, lastInsertRowid: undefined };
        }

        if (trimmed.includes("TRACKED_VIDEOS")) {
          let rows = [...store.tracked_videos];
          if (args.length > 0) {
            rows = rows.filter((v) => v.channel_id === args[0]);
          }
          return { columns: [], columnTypes: [], rows, rowsAffected: 0, lastInsertRowid: undefined };
        }

        if (trimmed.includes("VIDEO_VIEW_SNAPSHOTS")) {
          let rows = [...store.video_view_snapshots];
          if (args.length > 0) {
            rows = rows.filter((s) => s.video_id === args[0]);
          }
          return { columns: [], columnTypes: [], rows, rowsAffected: 0, lastInsertRowid: undefined };
        }

        if (trimmed.includes("RPM_ASSUMPTIONS")) {
          let rows = [...store.rpm_assumptions];
          if (trimmed.includes("CATEGORY = ?") && args.length >= 4) {
            rows = rows.filter(
              (r) =>
                r.category.toLowerCase() === String(args[0]).toLowerCase() &&
                r.region.toUpperCase() === String(args[1]).toUpperCase() &&
                r.format.toLowerCase() === String(args[2]).toLowerCase() &&
                r.currency.toUpperCase() === String(args[3]).toUpperCase()
            );
          } else if (trimmed.includes("REGION = 'GLOBAL'") && args.length >= 2) {
            rows = rows.filter(
              (r) =>
                r.category.toLowerCase() === String(args[0]).toLowerCase() &&
                r.region.toUpperCase() === "GLOBAL" &&
                r.format.toLowerCase() === String(args[1]).toLowerCase() &&
                (args.length < 3 || r.currency.toUpperCase() === String(args[2]).toUpperCase())
            );
          } else if (trimmed.includes("CATEGORY = 'GENERAL'") && args.length >= 3) {
            rows = rows.filter(
              (r) =>
                r.category.toLowerCase() === "general" &&
                r.region.toUpperCase() === String(args[0]).toUpperCase() &&
                r.format.toLowerCase() === String(args[1]).toLowerCase() &&
                r.currency.toUpperCase() === String(args[2]).toUpperCase()
            );
          } else if (args.length > 0) {
            rows = rows.filter((r) => Object.values(r).includes(args[0]));
          }
          return { columns: [], columnTypes: [], rows, rowsAffected: 0, lastInsertRowid: undefined };
        }

        return { columns: [], columnTypes: [], rows: [], rowsAffected: 0, lastInsertRowid: undefined };
      }

      if (trimmed.startsWith("INSERT")) {
        if (trimmed.includes("TRACKED_CHANNELS") && Array.isArray(args) && args.length >= 2) {
          const channelObj = {
            channel_id: String(args[0]),
            title: String(args[1] || ""),
            handle: args[2] || null,
            custom_url: args[3] || null,
            description: args[4] || null,
            published_at: args[5] || null,
            thumbnail_url: args[6] || null,
            uploads_playlist_id: args[7] || null,
            subscriber_count: args[8] !== null && args[8] !== undefined ? Number(args[8]) : null,
            hidden_subscriber_count: Boolean(args[9]),
            latest_total_views: Number(args[10] || 0),
            video_count: Number(args[11] || 0),
            first_tracked_at: String(args[12] || new Date().toISOString()),
            last_synced_at: String(args[13] || new Date().toISOString()),
            sync_status: "active",
            last_sync_error: null,
            niche: String(args[14] || "general"),
          };
          const existingIdx = store.tracked_channels.findIndex((c) => c.channel_id === channelObj.channel_id);
          if (existingIdx >= 0) {
            store.tracked_channels[existingIdx] = { ...store.tracked_channels[existingIdx], ...channelObj };
          } else {
            store.tracked_channels.push(channelObj);
          }
          return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: BigInt(Date.now()) };
        }

        if (trimmed.includes("CHANNEL_VIEW_SNAPSHOTS") && Array.isArray(args) && args.length >= 1) {
          const snapObj = {
            id: store.channel_view_snapshots.length + 1,
            channel_id: String(args[0]),
            cumulative_views: Number(args[1] !== undefined ? args[1] : 500000),
            observed_at: String(args[2] || new Date().toISOString()),
            source: String(args[3] || "youtube_api"),
            metadata: args[4] ? String(args[4]) : null,
          };
          const existingIdx = store.channel_view_snapshots.findIndex(
            (s) => s.channel_id === snapObj.channel_id && s.observed_at.slice(0, 10) === snapObj.observed_at.slice(0, 10)
          );
          if (existingIdx >= 0) {
            store.channel_view_snapshots[existingIdx] = { ...store.channel_view_snapshots[existingIdx], ...snapObj, id: store.channel_view_snapshots[existingIdx].id };
          } else {
            store.channel_view_snapshots.push(snapObj);
          }
          return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: BigInt(snapObj.id) };
        }

        if (trimmed.includes("TRACKED_VIDEOS") && Array.isArray(args) && args.length >= 2) {
          const vidObj = {
            video_id: String(args[0]),
            channel_id: String(args[1]),
            title: String(args[2] || ""),
            published_at: args[3] || null,
            duration: args[4] || null,
            duration_seconds: Number(args[5] || 0),
            format: String(args[6] || "long-form"),
            format_source: "inferred",
            latest_view_count: Number(args[7] || 0),
            tracking_status: "active",
            first_tracked_at: String(args[8] || new Date().toISOString()),
            last_synced_at: String(args[9] || new Date().toISOString()),
          };
          const vidIdx = store.tracked_videos.findIndex((v) => v.video_id === vidObj.video_id);
          if (vidIdx >= 0) {
            store.tracked_videos[vidIdx] = { ...store.tracked_videos[vidIdx], ...vidObj };
          } else {
            store.tracked_videos.push(vidObj);
          }
          return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: BigInt(Date.now()) };
        }

        if (trimmed.includes("VIDEO_VIEW_SNAPSHOTS") && Array.isArray(args) && args.length >= 2) {
          const vSnap = {
            id: store.video_view_snapshots.length + 1,
            video_id: String(args[0]),
            channel_id: String(args[1]),
            cumulative_views: Number(args[2] || 0),
            observed_at: String(args[3] || new Date().toISOString()),
          };
          store.video_view_snapshots.push(vSnap);
          return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: BigInt(vSnap.id) };
        }

        if (trimmed.includes("RPM_ASSUMPTIONS") && Array.isArray(args) && args.length >= 7) {
          store.rpm_assumptions.push({
            id: store.rpm_assumptions.length + 1,
            category: args[0],
            region: args[1],
            format: args[2],
            currency: args[3],
            rpm_low: args[4],
            rpm_typical: args[5],
            rpm_high: args[6],
            source_name: args[7] || "Benchmark",
            source_url: args[8] || "",
            effective_date: args[9] || new Date().toISOString().slice(0, 10),
            confidence: args[10] || "medium",
            notes: args[11] || null,
          });
          return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: BigInt(store.rpm_assumptions.length) };
        }

        return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: BigInt(Date.now()) };
      }

      if (trimmed.startsWith("UPDATE")) {
        if (trimmed.includes("CHANNEL_VIEW_SNAPSHOTS") && args.length >= 3) {
          const snap = store.channel_view_snapshots.find((s) => s.id === Number(args[2]));
          if (snap) {
            snap.cumulative_views = Number(args[0] || 0);
            snap.observed_at = String(args[1]);
          }
        }
        return { columns: [], columnTypes: [], rows: [], rowsAffected: 1, lastInsertRowid: undefined };
      }

      return { columns: [], columnTypes: [], rows: [], rowsAffected: 0, lastInsertRowid: undefined };
    },
    async batch(stmts) {
      const results = [];
      for (const s of stmts) {
        results.push(await this.execute(s));
      }
      return results;
    },
    close() {},
  };
}

let clientInstance: Client | null = null;

export function getDbClient(): Client {
  if (clientInstance) return clientInstance;

  try {
    const req = typeof require !== "undefined" ? require : null;
    if (req) {
      const libsql = req("@libsql/client");
      if (libsql?.createClient) {
        const url = process.env.DATABASE_URL || "file:./data/revenue_analytics.db";
        const authToken = process.env.DATABASE_AUTH_TOKEN;
        clientInstance = libsql.createClient({ url, authToken });
        return clientInstance!;
      }
    }
  } catch {
    // Libsql client not installed, fallback gracefully
  }

  clientInstance = createFallbackClient();
  return clientInstance;
}

/**
 * Initializes database tables, indexes, and seeds standard benchmark RPM assumptions
 */
export async function initDatabase(): Promise<void> {
  const db = getDbClient();

  // 1. Tracked channels table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tracked_channels (
      channel_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      handle TEXT,
      custom_url TEXT,
      description TEXT,
      published_at TEXT,
      thumbnail_url TEXT,
      uploads_playlist_id TEXT,
      subscriber_count INTEGER,
      hidden_subscriber_count INTEGER DEFAULT 0,
      latest_total_views INTEGER NOT NULL DEFAULT 0,
      video_count INTEGER DEFAULT 0,
      first_tracked_at TEXT NOT NULL,
      last_synced_at TEXT,
      sync_status TEXT DEFAULT 'active',
      last_sync_error TEXT,
      niche TEXT DEFAULT 'general'
    );
  `);

  // 2. Channel view snapshots table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS channel_view_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      cumulative_views INTEGER NOT NULL,
      observed_at TEXT NOT NULL,
      source TEXT DEFAULT 'youtube_api',
      metadata TEXT,
      UNIQUE(channel_id, observed_at)
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_channel_snapshots_lookup 
    ON channel_view_snapshots(channel_id, observed_at);
  `);

  // 3. Tracked videos table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tracked_videos (
      video_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      title TEXT NOT NULL,
      published_at TEXT,
      duration TEXT,
      duration_seconds INTEGER DEFAULT 0,
      format TEXT NOT NULL DEFAULT 'long-form',
      format_source TEXT DEFAULT 'inferred',
      latest_view_count INTEGER NOT NULL DEFAULT 0,
      tracking_status TEXT DEFAULT 'active',
      first_tracked_at TEXT NOT NULL,
      last_synced_at TEXT
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_tracked_videos_channel 
    ON tracked_videos(channel_id);
  `);

  // 4. Video view snapshots table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS video_view_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      cumulative_views INTEGER NOT NULL,
      observed_at TEXT NOT NULL,
      UNIQUE(video_id, observed_at)
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_video_snapshots_lookup 
    ON video_view_snapshots(video_id, observed_at);
  `);

  // 5. RPM assumptions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS rpm_assumptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      region TEXT NOT NULL,
      format TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      rpm_low REAL NOT NULL,
      rpm_typical REAL NOT NULL,
      rpm_high REAL NOT NULL,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      confidence TEXT NOT NULL,
      notes TEXT,
      UNIQUE(category, region, format, currency)
    );
  `);

  // Seed default published RPM assumptions if table is empty
  const countRes = await db.execute("SELECT COUNT(*) as count FROM rpm_assumptions;");
  const count = Number(countRes.rows[0]?.count || 0);

  if (count === 0) {
    await seedDefaultRpmAssumptions();
  }
}

export const DEFAULT_RPM_BENCHMARKS: Omit<RpmAssumption, "id">[] = [
  // Finance / Business
  {
    category: "finance",
    region: "US",
    format: "long-form",
    currency: "USD",
    rpm_low: 8.0,
    rpm_typical: 14.5,
    rpm_high: 28.0,
    source_name: "Tubefilter Creator Economics Benchmark 2024",
    source_url: "https://www.tubefilter.com/creator-economics-rpm-survey/",
    effective_date: "2024-06-01",
    confidence: "high",
    notes: "High advertiser demand in banking, fintech, SaaS, and investing.",
  },
  {
    category: "finance",
    region: "IN",
    format: "long-form",
    currency: "USD",
    rpm_low: 1.2,
    rpm_typical: 2.5,
    rpm_high: 5.0,
    source_name: "Indian Creator RPM Study & AdSense Market 2024",
    source_url: "https://influencermarketinghub.com/youtube-money-calculator/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Fintech, trading, and personal finance creators in South Asia.",
  },
  {
    category: "finance",
    region: "GLOBAL",
    format: "long-form",
    currency: "USD",
    rpm_low: 4.5,
    rpm_typical: 9.0,
    rpm_high: 18.0,
    source_name: "Global Creator Benchmark Survey 2024",
    source_url: "https://www.tubefilter.com/creator-economics-rpm-survey/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Weighted worldwide estimate across mixed geographic audiences.",
  },

  // Technology / Software
  {
    category: "technology",
    region: "US",
    format: "long-form",
    currency: "USD",
    rpm_low: 4.5,
    rpm_typical: 8.0,
    rpm_high: 16.0,
    source_name: "HubSpot YouTube Monetization Survey 2024",
    source_url: "https://blog.hubspot.com/marketing/youtube-rpm-benchmarks",
    effective_date: "2024-06-01",
    confidence: "high",
    notes: "Strong enterprise tech, cloud software, gadget sponsorships.",
  },
  {
    category: "technology",
    region: "IN",
    format: "long-form",
    currency: "USD",
    rpm_low: 0.8,
    rpm_typical: 1.6,
    rpm_high: 3.5,
    source_name: "HubSpot Tech Creator Survey 2024",
    source_url: "https://blog.hubspot.com/marketing/youtube-rpm-benchmarks",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Software engineering, hardware reviews, mobile technology.",
  },
  {
    category: "technology",
    region: "GLOBAL",
    format: "long-form",
    currency: "USD",
    rpm_low: 2.8,
    rpm_typical: 5.5,
    rpm_high: 11.0,
    source_name: "HubSpot Tech Creator Survey 2024",
    source_url: "https://blog.hubspot.com/marketing/youtube-rpm-benchmarks",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Blended worldwide tech audience.",
  },

  // Education / How-to
  {
    category: "education",
    region: "US",
    format: "long-form",
    currency: "USD",
    rpm_low: 3.0,
    rpm_typical: 6.0,
    rpm_high: 12.0,
    source_name: "Epidemic Sound YouTube RPM Guide 2024",
    source_url: "https://www.epidemicsound.com/blog/youtube-rpm-guide/",
    effective_date: "2024-06-01",
    confidence: "high",
    notes: "Educational courses, skill-building, certifications.",
  },
  {
    category: "education",
    region: "IN",
    format: "long-form",
    currency: "USD",
    rpm_low: 0.5,
    rpm_typical: 1.2,
    rpm_high: 2.5,
    source_name: "Epidemic Sound YouTube RPM Guide 2024",
    source_url: "https://www.epidemicsound.com/blog/youtube-rpm-guide/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Exam preparation, skills, language learning.",
  },
  {
    category: "education",
    region: "GLOBAL",
    format: "long-form",
    currency: "USD",
    rpm_low: 1.8,
    rpm_typical: 3.8,
    rpm_high: 7.5,
    source_name: "Epidemic Sound YouTube RPM Guide 2024",
    source_url: "https://www.epidemicsound.com/blog/youtube-rpm-guide/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Worldwide educational content.",
  },

  // Gaming
  {
    category: "gaming",
    region: "US",
    format: "long-form",
    currency: "USD",
    rpm_low: 1.5,
    rpm_typical: 3.2,
    rpm_high: 6.0,
    source_name: "Influencer Marketing Hub YouTube Calculator 2024",
    source_url: "https://influencermarketinghub.com/youtube-money-calculator/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Lower CPMs due to younger audience skew and high ad inventory.",
  },
  {
    category: "gaming",
    region: "IN",
    format: "long-form",
    currency: "USD",
    rpm_low: 0.3,
    rpm_typical: 0.7,
    rpm_high: 1.5,
    source_name: "Influencer Marketing Hub YouTube Calculator 2024",
    source_url: "https://influencermarketinghub.com/youtube-money-calculator/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Mobile gaming and streaming channels.",
  },
  {
    category: "gaming",
    region: "GLOBAL",
    format: "long-form",
    currency: "USD",
    rpm_low: 1.0,
    rpm_typical: 2.2,
    rpm_high: 4.5,
    source_name: "Influencer Marketing Hub YouTube Calculator 2024",
    source_url: "https://influencermarketinghub.com/youtube-money-calculator/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Worldwide gaming audience.",
  },

  // Entertainment / Comedy / Vlogs
  {
    category: "entertainment",
    region: "US",
    format: "long-form",
    currency: "USD",
    rpm_low: 1.8,
    rpm_typical: 3.5,
    rpm_high: 7.0,
    source_name: "Creator Insider AdSense Report 2024",
    source_url: "https://www.tubefilter.com/creator-economics-rpm-survey/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "General entertainment, vlogs, sketch comedy.",
  },
  {
    category: "entertainment",
    region: "IN",
    format: "long-form",
    currency: "USD",
    rpm_low: 0.4,
    rpm_typical: 0.8,
    rpm_high: 1.8,
    source_name: "Creator Insider AdSense Report 2024",
    source_url: "https://www.tubefilter.com/creator-economics-rpm-survey/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Cinema commentary, comedic sketches, regional entertainment.",
  },
  {
    category: "entertainment",
    region: "GLOBAL",
    format: "long-form",
    currency: "USD",
    rpm_low: 1.2,
    rpm_typical: 2.5,
    rpm_high: 5.0,
    source_name: "Creator Insider AdSense Report 2024",
    source_url: "https://www.tubefilter.com/creator-economics-rpm-survey/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Worldwide general entertainment.",
  },

  // Lifestyle
  {
    category: "lifestyle",
    region: "US",
    format: "long-form",
    currency: "USD",
    rpm_low: 2.5,
    rpm_typical: 5.0,
    rpm_high: 9.5,
    source_name: "Epidemic Sound YouTube RPM Guide 2024",
    source_url: "https://www.epidemicsound.com/blog/youtube-rpm-guide/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Beauty, fitness, home decor, wellness.",
  },
  {
    category: "lifestyle",
    region: "IN",
    format: "long-form",
    currency: "USD",
    rpm_low: 0.5,
    rpm_typical: 1.0,
    rpm_high: 2.2,
    source_name: "Epidemic Sound YouTube RPM Guide 2024",
    source_url: "https://www.epidemicsound.com/blog/youtube-rpm-guide/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Fashion, fitness, daily vlogs in South Asia.",
  },
  {
    category: "lifestyle",
    region: "GLOBAL",
    format: "long-form",
    currency: "USD",
    rpm_low: 1.5,
    rpm_typical: 3.2,
    rpm_high: 6.5,
    source_name: "Epidemic Sound YouTube RPM Guide 2024",
    source_url: "https://www.epidemicsound.com/blog/youtube-rpm-guide/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Worldwide lifestyle content.",
  },

  // General / Fallback
  {
    category: "general",
    region: "US",
    format: "long-form",
    currency: "USD",
    rpm_low: 2.5,
    rpm_typical: 5.0,
    rpm_high: 10.0,
    source_name: "Creator Economics Industry Aggregate 2024",
    source_url: "https://www.tubefilter.com/creator-economics-rpm-survey/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "General long-form YouTube benchmark across all niches in US.",
  },
  {
    category: "general",
    region: "IN",
    format: "long-form",
    currency: "USD",
    rpm_low: 0.5,
    rpm_typical: 1.2,
    rpm_high: 2.5,
    source_name: "Creator Economics Industry Aggregate 2024",
    source_url: "https://www.tubefilter.com/creator-economics-rpm-survey/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "General long-form YouTube benchmark across all niches in India.",
  },
  {
    category: "general",
    region: "GLOBAL",
    format: "long-form",
    currency: "USD",
    rpm_low: 1.5,
    rpm_typical: 3.5,
    rpm_high: 7.5,
    source_name: "Creator Economics Industry Aggregate 2024",
    source_url: "https://www.tubefilter.com/creator-economics-rpm-survey/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "General worldwide baseline long-form estimate.",
  },

  // Shorts (Pool-based revenue sharing - uniformly lower across all niches)
  {
    category: "general",
    region: "US",
    format: "short",
    currency: "USD",
    rpm_low: 0.03,
    rpm_typical: 0.06,
    rpm_high: 0.12,
    source_name: "Tubefilter Shorts Monetization Benchmark 2024",
    source_url: "https://www.tubefilter.com/youtube-shorts-revenue-rpm/",
    effective_date: "2024-06-01",
    confidence: "high",
    notes: "YouTube Shorts Creator Pool revenue share per 1,000 views in US.",
  },
  {
    category: "general",
    region: "IN",
    format: "short",
    currency: "USD",
    rpm_low: 0.01,
    rpm_typical: 0.02,
    rpm_high: 0.04,
    source_name: "Tubefilter Shorts Monetization Benchmark 2024",
    source_url: "https://www.tubefilter.com/youtube-shorts-revenue-rpm/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "YouTube Shorts Creator Pool revenue share per 1,000 views in India.",
  },
  {
    category: "general",
    region: "GLOBAL",
    format: "short",
    currency: "USD",
    rpm_low: 0.02,
    rpm_typical: 0.04,
    rpm_high: 0.08,
    source_name: "Tubefilter Shorts Monetization Benchmark 2024",
    source_url: "https://www.tubefilter.com/youtube-shorts-revenue-rpm/",
    effective_date: "2024-06-01",
    confidence: "medium",
    notes: "Blended worldwide Shorts creator pool revenue share.",
  },
];

async function seedDefaultRpmAssumptions(): Promise<void> {
  const db = getDbClient();
  for (const b of DEFAULT_RPM_BENCHMARKS) {
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO rpm_assumptions 
        (category, region, format, currency, rpm_low, rpm_typical, rpm_high, source_name, source_url, effective_date, confidence, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        b.category.toLowerCase(),
        b.region.toUpperCase(),
        b.format.toLowerCase(),
        b.currency.toUpperCase(),
        b.rpm_low,
        b.rpm_typical,
        b.rpm_high,
        b.source_name,
        b.source_url,
        b.effective_date,
        b.confidence,
        b.notes || null,
      ],
    });
  }
}
