import { describe, expect, test, beforeAll } from "bun:test";
import { initDatabase, getDbClient } from "../db";
import { parseChannelIdentifier, parseIsoDuration } from "../youtube";
import { findRpmAssumption } from "../sync";

describe("Database, YouTube Parsers & API Logic", () => {
  beforeAll(async () => {
    // Uses local test sqlite db
    process.env.DATABASE_URL = "file:./data/test_revenue.db";
    await initDatabase();
  });

  test("1. parses various YouTube channel input patterns safely", () => {
    // 1. Channel URL
    expect(parseChannelIdentifier("https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw")).toEqual({
      id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    });

    // 2. Handle URL
    expect(parseChannelIdentifier("https://youtube.com/@veritasium")).toEqual({
      handle: "veritasium",
    });

    // 3. Raw handle
    expect(parseChannelIdentifier("@mkbhd")).toEqual({
      handle: "mkbhd",
    });

    // 4. Raw channel ID
    expect(parseChannelIdentifier("UCbj0cu5pvhpeuv_l42m5sQA")).toEqual({
      id: "UCbj0cu5pvhpeuv_l42m5sQA",
    });

    // 5. Bare handle without @
    expect(parseChannelIdentifier("cleverprogrammer")).toEqual({
      handle: "cleverprogrammer",
    });

    // 6. Empty input
    expect(parseChannelIdentifier("")).toEqual({});
  });

  test("2. parses ISO 8601 durations and classifies formats", () => {
    // Long-form (15m 33s = 933s)
    const longSec = parseIsoDuration("PT15M33S");
    expect(longSec).toBe(933);
    expect(longSec > 60).toBe(true);

    // Short (58 seconds <= 60s)
    const shortSec = parseIsoDuration("PT58S");
    expect(shortSec).toBe(58);
    expect(shortSec <= 60).toBe(true);

    // 1 hour 2 minutes
    expect(parseIsoDuration("PT1H2M0S")).toBe(3720);

    // Empty/invalid
    expect(parseIsoDuration("")).toBe(0);
  });

  test("3. seeds and queries default RPM benchmarks with fallbacks", async () => {
    // Exact match: technology US
    const techUs = await findRpmAssumption("technology", "US", "long-form", "USD");
    expect(techUs).not.toBeNull();
    expect(techUs?.rpm_typical).toBe(8.0);
    expect(techUs?.confidence).toBe("high");

    // Exact match: finance IN
    const finIn = await findRpmAssumption("finance", "IN", "long-form", "USD");
    expect(finIn).not.toBeNull();
    expect(finIn?.rpm_typical).toBe(2.5);

    // Fallback category to general if unknown niche
    const unknownCat = await findRpmAssumption("underwater_basket_weaving", "US", "long-form", "USD");
    expect(unknownCat).not.toBeNull();
    expect(unknownCat?.category).toBe("general");

    // Fallback region to GLOBAL if unknown country code
    const unknownRegion = await findRpmAssumption("technology", "ZZ", "long-form", "USD");
    expect(unknownRegion).not.toBeNull();
    expect(unknownRegion?.region).toBe("GLOBAL");
  });

  test("4. database schema enforces uniqueness and prevents duplicate snapshots for same date", async () => {
    const db = getDbClient();
    const testChannelId = "UC_test_unique_channel";

    // Insert tracked channel
    await db.execute({
      sql: `INSERT OR REPLACE INTO tracked_channels 
            (channel_id, title, latest_total_views, first_tracked_at) 
            VALUES (?, 'Test Channel', 500000, '2024-05-01T00:00:00Z');`,
      args: [testChannelId],
    });

    // Insert snapshot
    await db.execute({
      sql: `INSERT OR REPLACE INTO channel_view_snapshots 
            (channel_id, cumulative_views, observed_at) 
            VALUES (?, 500000, '2024-05-01T00:00:00Z');`,
      args: [testChannelId],
    });

    // Duplicate insert for same (channel_id, observed_at) is handled idempotently
    await db.execute({
      sql: `INSERT OR REPLACE INTO channel_view_snapshots 
            (channel_id, cumulative_views, observed_at) 
            VALUES (?, 520000, '2024-05-01T00:00:00Z');`,
      args: [testChannelId],
    });

    const res = await db.execute({
      sql: "SELECT COUNT(*) as count FROM channel_view_snapshots WHERE channel_id = ?;",
      args: [testChannelId],
    });

    expect(Number(res.rows[0].count)).toBe(1);
  });
});
