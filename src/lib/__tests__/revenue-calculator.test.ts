import { describe, expect, test } from "bun:test";
import {
  calculateObservedViews,
  calculateRevenueRange,
  evaluateConfidence,
  buildRevenueEstimate,
  validateRpmAssumption,
} from "../revenue-calculator";
import { ChannelViewSnapshot, RpmAssumption } from "../types/revenue";

describe("YouTube Revenue Analytics Calculator", () => {
  const mockRpm: RpmAssumption = {
    category: "technology",
    region: "US",
    format: "long-form",
    currency: "USD",
    rpm_low: 4.5,
    rpm_typical: 8.0,
    rpm_high: 16.0,
    source_name: "HubSpot Tech Benchmark 2024",
    source_url: "https://blog.hubspot.com/marketing/youtube-rpm-benchmarks",
    effective_date: "2024-06-01",
    confidence: "high",
  };

  const sampleChannel = {
    id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    title: "Tech Explored",
    handle: "@techexplored",
    thumbnailUrl: null,
    subscriberCount: 500000,
    totalViews: 50000000,
    videoCount: 250,
  };

  test("1. calculates observed views correctly from cumulative snapshots over 30 days", () => {
    const snapshots: ChannelViewSnapshot[] = [
      {
        channel_id: "UC123",
        cumulative_views: 1000000,
        observed_at: "2024-05-01T00:00:00Z",
      },
      {
        channel_id: "UC123",
        cumulative_views: 1100000,
        observed_at: "2024-05-15T00:00:00Z",
      },
      {
        channel_id: "UC123",
        cumulative_views: 1250000,
        observed_at: "2024-05-31T00:00:00Z",
      },
    ];

    const result = calculateObservedViews(snapshots, 30, new Date("2024-05-31T12:00:00Z").getTime());

    expect(result.status).toBe("ready");
    expect(result.observedPeriodViews).toBe(250000); // 1,250,000 - 1,000,000
    expect(result.actualCoverageDays).toBe(30);
    expect(result.counterAnomaly).toBe(false);
  });

  test("2. calculates low, typical, and high revenue ranges using formula: (views / 1000) * RPM", () => {
    const views = 200000; // 200k views
    const revenue = calculateRevenueRange(views, 4.5, 8.0, 16.0);

    // 200 * 4.5 = 900
    expect(revenue.low).toBe(900);
    // 200 * 8.0 = 1600
    expect(revenue.typical).toBe(1600);
    // 200 * 16.0 = 3200
    expect(revenue.high).toBe(3200);
  });

  test("3. handles multiple content formats (combines long-form and shorts views with distinct RPMs)", () => {
    const shortsRpm: RpmAssumption = {
      category: "general",
      region: "US",
      format: "short",
      currency: "USD",
      rpm_low: 0.03,
      rpm_typical: 0.06,
      rpm_high: 0.12,
      source_name: "Shorts Pool Benchmark",
      source_url: "https://example.com",
      effective_date: "2024-06-01",
      confidence: "high",
    };

    const snapshots: ChannelViewSnapshot[] = [
      { channel_id: "UC123", cumulative_views: 1000000, observed_at: "2024-05-01T00:00:00Z" },
      { channel_id: "UC123", cumulative_views: 2000000, observed_at: "2024-05-31T00:00:00Z" },
    ];

    const estimate = buildRevenueEstimate(
      sampleChannel,
      snapshots,
      30,
      mockRpm,
      10,
      {
        longFormViews: 500000, // 500k long-form: (500 * 8.0 = 4,000)
        shortsViews: 1000000,   // 1M shorts: (1,000 * 0.06 = 60)
        shortsRpm,
      }
    );

    expect(estimate.formatEstimates).toBeDefined();
    expect(estimate.formatEstimates?.length).toBe(2);
    // Combined typical = 4,000 + 60 = 4,060
    expect(estimate.estimatedRevenue.typical).toBe(4060);
    expect(estimate.isEstimate).toBe(true);
  });

  test("4. reports missing_rpm_assumption when no RPM exists", () => {
    const snapshots: ChannelViewSnapshot[] = [
      { channel_id: "UC123", cumulative_views: 100000, observed_at: "2024-05-01T00:00:00Z" },
      { channel_id: "UC123", cumulative_views: 200000, observed_at: "2024-05-31T00:00:00Z" },
    ];

    const estimate = buildRevenueEstimate(sampleChannel, snapshots, 30, null, 5);

    expect(estimate.status).toBe("missing_rpm_assumption");
    expect(estimate.estimatedRevenue.typical).toBe(0);
    expect(estimate.dataQuality.confidence).toBe("low");
  });

  test("5. returns insufficient_history when only a single initial snapshot exists", () => {
    const snapshots: ChannelViewSnapshot[] = [
      { channel_id: "UC123", cumulative_views: 100000, observed_at: "2024-05-01T00:00:00Z" },
    ];

    const result = calculateObservedViews(snapshots, 30);
    expect(result.status).toBe("insufficient_history");
    expect(result.observedPeriodViews).toBe(0);
    expect(result.actualCoverageDays).toBe(0);
  });

  test("6. detects and flags counter decrease anomalies without reporting negative views", () => {
    const snapshots: ChannelViewSnapshot[] = [
      { channel_id: "UC123", cumulative_views: 500000, observed_at: "2024-05-01T00:00:00Z" },
      // Sudden view decrease (e.g. video taken down or platform bot audit)
      { channel_id: "UC123", cumulative_views: 450000, observed_at: "2024-05-30T00:00:00Z" },
    ];

    const result = calculateObservedViews(snapshots, 30);
    expect(result.status).toBe("counter_anomaly");
    expect(result.counterAnomaly).toBe(true);
    expect(result.observedPeriodViews).toBe(0);
    expect(result.statusMessage).toContain("decreased");
  });

  test("7. deduplicates same-day snapshots and preserves chronological order", () => {
    const snapshots: ChannelViewSnapshot[] = [
      { id: 1, channel_id: "UC123", cumulative_views: 100000, observed_at: "2024-05-01T08:00:00Z" },
      { id: 2, channel_id: "UC123", cumulative_views: 105000, observed_at: "2024-05-01T20:00:00Z" },
      { id: 3, channel_id: "UC123", cumulative_views: 200000, observed_at: "2024-05-31T10:00:00Z" },
    ];

    const result = calculateObservedViews(snapshots, 30);
    expect(result.status).toBe("ready");
    // Latest same-day snapshot from May 1 (105,000) was used
    expect(result.observedPeriodViews).toBe(95000); // 200,000 - 105,000
    expect(result.snapshotCount).toBe(2); // 2 distinct dates
  });

  test("8. rejects invalid RPM assumptions (negative values or invalid ordering)", () => {
    expect(() =>
      validateRpmAssumption({
        ...mockRpm,
        rpm_low: -1,
      })
    ).toThrow("RPM values must be non-negative");

    expect(() =>
      validateRpmAssumption({
        ...mockRpm,
        rpm_low: 10,
        rpm_typical: 5, // low > typical is invalid
      })
    ).toThrow("RPM range must satisfy: low <= typical <= high");
  });

  test("9. evaluates confidence rules deterministically", () => {
    // Robust coverage + fresh + benchmark RPM
    const highConf = evaluateConfidence(30, 30, 15, false, false, mockRpm);
    expect(highConf.confidence).toBe("high");
    expect(highConf.reasons.length).toBeGreaterThan(0);

    // Partial coverage (5 days for 30d period)
    const medConf = evaluateConfidence(10, 30, 4, false, false, mockRpm);
    expect(medConf.confidence).toBe("medium");

    // Stale + anomaly
    const lowConf = evaluateConfidence(30, 30, 10, true, true, mockRpm);
    expect(lowConf.confidence).toBe("low");
  });

  test("10. supports alternative currencies (e.g. INR)", () => {
    const inrRpm: RpmAssumption = {
      category: "technology",
      region: "IN",
      format: "long-form",
      currency: "INR",
      rpm_low: 65.0,
      rpm_typical: 130.0,
      rpm_high: 280.0,
      source_name: "Indian Creator Report 2024",
      source_url: "https://example.com",
      effective_date: "2024-06-01",
      confidence: "high",
    };

    const snapshots: ChannelViewSnapshot[] = [
      { channel_id: "UC123", cumulative_views: 1000000, observed_at: "2024-05-01T00:00:00Z" },
      { channel_id: "UC123", cumulative_views: 1100000, observed_at: "2024-05-31T00:00:00Z" },
    ];

    const estimate = buildRevenueEstimate(sampleChannel, snapshots, 30, inrRpm, 10);
    expect(estimate.currency).toBe("INR");
    // 100k views / 1000 * 130 = 13,000 INR
    expect(estimate.estimatedRevenue.typical).toBe(13000);
  });
});
