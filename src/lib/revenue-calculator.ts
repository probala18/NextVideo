import {
  ChannelViewSnapshot,
  RpmAssumption,
  ConfidenceLevel,
  CalculationStatus,
  RevenueCalculationInputs,
  RevenueEstimate,
  FormatRevenueEstimate,
} from "./types/revenue";

export interface ObservedViewsResult {
  status: CalculationStatus;
  statusMessage: string;
  observedPeriodViews: number;
  actualCoverageDays: number;
  coverageStartDate: string | null;
  coverageEndDate: string | null;
  earliestCumulativeViews: number;
  latestCumulativeViews: number;
  counterAnomaly: boolean;
  snapshotCount: number;
  isStale: boolean;
  lastSyncedAt: string | null;
}

/**
 * Calculates views earned during a reporting period based exclusively on
 * changes in cumulative public view counts between persistent snapshots.
 *
 * Formula: Observed period views = latest eligible cumulative view count - earliest eligible cumulative view count
 */
export function calculateObservedViews(
  snapshots: ChannelViewSnapshot[],
  requestedPeriodDays: number,
  nowMs: number = Date.now()
): ObservedViewsResult {
  if (!snapshots || snapshots.length === 0) {
    return {
      status: "insufficient_history",
      statusMessage:
        "No historical view snapshots have been recorded yet for this channel.",
      observedPeriodViews: 0,
      actualCoverageDays: 0,
      coverageStartDate: null,
      coverageEndDate: null,
      earliestCumulativeViews: 0,
      latestCumulativeViews: 0,
      counterAnomaly: false,
      snapshotCount: 0,
      isStale: false,
      lastSyncedAt: null,
    };
  }

  // Deduplicate by observed_at and sort chronologically
  const uniqueMap = new Map<string, ChannelViewSnapshot>();
  for (const s of snapshots) {
    const key = s.observed_at.slice(0, 10); // group by date
    if (!uniqueMap.has(key) || (s.id && s.id > (uniqueMap.get(key)?.id || 0))) {
      uniqueMap.set(key, s);
    }
  }

  const sorted = Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
  );

  const snapshotCount = sorted.length;
  const latest = sorted[sorted.length - 1];
  const lastSyncedAt = latest.observed_at;

  const latestTime = new Date(latest.observed_at).getTime();
  const isStale = (nowMs - latestTime) > 48 * 3600 * 1000; // >48h old

  // If only 1 observation is available
  if (sorted.length < 2) {
    return {
      status: "insufficient_history",
      statusMessage:
        "Initial observation recorded. Observed period growth requires at least 2 distinct daily snapshots to measure changes over time.",
      observedPeriodViews: 0,
      actualCoverageDays: 0,
      coverageStartDate: latest.observed_at,
      coverageEndDate: latest.observed_at,
      earliestCumulativeViews: latest.cumulative_views,
      latestCumulativeViews: latest.cumulative_views,
      counterAnomaly: false,
      snapshotCount: 1,
      isStale,
      lastSyncedAt,
    };
  }

  // Determine the cutoff date based on requestedPeriodDays
  const windowStartMs = latestTime - requestedPeriodDays * 86400000;

  // Find the earliest snapshot within the period window
  let earliest = sorted[0];
  for (let i = 0; i < sorted.length; i++) {
    const t = new Date(sorted[i].observed_at).getTime();
    if (t >= windowStartMs) {
      earliest = sorted[i];
      break;
    }
  }

  const earliestTime = new Date(earliest.observed_at).getTime();
  const actualCoverageMs = Math.max(0, latestTime - earliestTime);
  const actualCoverageDays = Math.max(0, Math.round(actualCoverageMs / 86400000));

  if (actualCoverageDays < 1) {
    return {
      status: "insufficient_history",
      statusMessage:
        "Snapshots were recorded on the same day. At least 24 hours between observations are required to measure view growth.",
      observedPeriodViews: 0,
      actualCoverageDays: 0,
      coverageStartDate: earliest.observed_at,
      coverageEndDate: latest.observed_at,
      earliestCumulativeViews: earliest.cumulative_views,
      latestCumulativeViews: latest.cumulative_views,
      counterAnomaly: false,
      snapshotCount,
      isStale,
      lastSyncedAt,
    };
  }

  // Detect counter decrease anomalies (e.g. YouTube bot view audits / video removals)
  const rawDiff = latest.cumulative_views - earliest.cumulative_views;
  let counterAnomaly = false;

  if (rawDiff < 0) {
    counterAnomaly = true;
    return {
      status: "counter_anomaly",
      statusMessage: `Observed public view counter decreased by ${Math.abs(rawDiff).toLocaleString()} views between ${earliest.observed_at.slice(0, 10)} and ${latest.observed_at.slice(0, 10)}. Flagged for review (e.g. platform audits or video unlisting).`,
      observedPeriodViews: 0,
      actualCoverageDays,
      coverageStartDate: earliest.observed_at,
      coverageEndDate: latest.observed_at,
      earliestCumulativeViews: earliest.cumulative_views,
      latestCumulativeViews: latest.cumulative_views,
      counterAnomaly: true,
      snapshotCount,
      isStale,
      lastSyncedAt,
    };
  }

  const observedPeriodViews = Math.max(0, rawDiff);
  const isPartial = actualCoverageDays < requestedPeriodDays * 0.85;

  const status: CalculationStatus = isPartial ? "insufficient_history" : "ready";
  const statusMessage = isPartial
    ? `Partial historical coverage (${actualCoverageDays} of ${requestedPeriodDays} days observed). Estimates will reflect full ${requestedPeriodDays}-day trends once snapshots accumulate.`
    : `Complete ${actualCoverageDays}-day observed view baseline available.`;

  return {
    status,
    statusMessage,
    observedPeriodViews,
    actualCoverageDays,
    coverageStartDate: earliest.observed_at,
    coverageEndDate: latest.observed_at,
    earliestCumulativeViews: earliest.cumulative_views,
    latestCumulativeViews: latest.cumulative_views,
    counterAnomaly: false,
    snapshotCount,
    isStale,
    lastSyncedAt,
  };
}

/**
 * Validates RPM assumptions and ensures non-negative numbers
 */
export function validateRpmAssumption(rpm: RpmAssumption): void {
  if (rpm.rpm_low < 0 || rpm.rpm_typical < 0 || rpm.rpm_high < 0) {
    throw new Error("RPM values must be non-negative");
  }
  if (rpm.rpm_low > rpm.rpm_typical || rpm.rpm_typical > rpm.rpm_high) {
    throw new Error("RPM range must satisfy: low <= typical <= high");
  }
}

/**
 * Evaluates the confidence level and transparent explanation reasons based on defined rules
 */
export function evaluateConfidence(
  actualCoverageDays: number,
  requestedPeriodDays: number,
  snapshotCount: number,
  isStale: boolean,
  counterAnomaly: boolean,
  rpm: RpmAssumption | null
): { confidence: ConfidenceLevel; reasons: string[] } {
  const reasons: string[] = [];

  if (counterAnomaly) {
    return {
      confidence: "low",
      reasons: [
        "Public view counter decreased during this reporting window (likely YouTube view audit or video removals).",
      ],
    };
  }

  if (actualCoverageDays < 2) {
    return {
      confidence: "insufficient_history",
      reasons: [
        "Insufficient historical observations. Estimations require multiple daily snapshots over time.",
      ],
    };
  }

  if (!rpm) {
    return {
      confidence: "low",
      reasons: ["No applicable RPM benchmark found for this niche and region."],
    };
  }

  const coverageRatio = actualCoverageDays / Math.max(1, requestedPeriodDays);

  if (coverageRatio >= 0.85) {
    reasons.push(
      `Coverage window is robust (${actualCoverageDays} days observed for ${requestedPeriodDays}d requested period).`
    );
  } else {
    reasons.push(
      `Partial observation window (${actualCoverageDays} of ${requestedPeriodDays} days). Results reflect observed days only without synthetic extrapolation.`
    );
  }

  if (snapshotCount >= 7) {
    reasons.push(`${snapshotCount} daily view snapshots provide strong sampling frequency.`);
  } else {
    reasons.push(`Limited snapshot frequency (${snapshotCount} observations recorded).`);
  }

  if (isStale) {
    reasons.push("Latest snapshot is older than 48 hours; data may lag recent upload performance.");
  } else {
    reasons.push("Latest observation is fresh (recorded within last 48 hours).");
  }

  if (rpm.confidence === "high") {
    reasons.push(`RPM benchmark is derived from a published industry study (${rpm.source_name}).`);
  } else if (rpm.confidence === "medium") {
    reasons.push(`RPM benchmark is from regional creator survey data (${rpm.source_name}).`);
  } else {
    reasons.push("RPM benchmark is an illustrative assumption.");
  }

  reasons.push(
    "Competitor earnings are mathematical estimates based on public views and RPM models; actual private AdSense revenue depends on monetization status, viewer demographics, and seasonality."
  );

  let confidence: ConfidenceLevel = "low";
  if (coverageRatio >= 0.85 && snapshotCount >= 5 && !isStale && rpm.confidence !== "low") {
    confidence = "high";
  } else if (coverageRatio >= 0.30 && snapshotCount >= 2) {
    confidence = "medium";
  }

  return { confidence, reasons };
}

/**
 * Calculates low, typical, and high revenue from observed period views
 * Formula: Estimated revenue = observed period views / 1000 * RPM
 */
export function calculateRevenueRange(
  observedViews: number,
  rpmLow: number,
  rpmTypical: number,
  rpmHigh: number
): { low: number; typical: number; high: number } {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    low: round2((observedViews / 1000) * rpmLow),
    typical: round2((observedViews / 1000) * rpmTypical),
    high: round2((observedViews / 1000) * rpmHigh),
  };
}

/**
 * Produces a complete explainable revenue estimate for a channel
 */
export function buildRevenueEstimate(
  channel: {
    id: string;
    title: string;
    handle: string | null;
    thumbnailUrl: string | null;
    subscriberCount: number | null;
    totalViews: number;
    videoCount: number;
  },
  snapshots: ChannelViewSnapshot[],
  requestedPeriodDays: number,
  rpm: RpmAssumption | null,
  trackedVideosCount: number = 0,
  formatBreakdown?: {
    longFormViews: number;
    shortsViews: number;
    shortsRpm?: RpmAssumption | null;
  }
): RevenueEstimate {
  const viewsResult = calculateObservedViews(snapshots, requestedPeriodDays);

  if (!rpm) {
    return {
      channel,
      isEstimate: true,
      status: "missing_rpm_assumption",
      statusMessage: "No applicable RPM benchmark found for the selected niche, region, or format.",
      reportingPeriodDays: requestedPeriodDays,
      actualCoverageDays: viewsResult.actualCoverageDays,
      coverageStartDate: viewsResult.coverageStartDate,
      coverageEndDate: viewsResult.coverageEndDate,
      observedPeriodViews: viewsResult.observedPeriodViews,
      currency: "USD",
      estimatedRevenue: { low: 0, typical: 0, high: 0 },
      estimatedRevenuePerThousandViews: { low: 0, typical: 0, high: 0 },
      appliedRpm: {
        category: "unknown",
        region: "unknown",
        format: "blended",
        low: 0,
        typical: 0,
        high: 0,
        sourceName: "None",
        sourceUrl: "",
        effectiveDate: "",
        confidence: "none",
      },
      dataQuality: {
        confidence: "low",
        confidenceReasons: ["Missing RPM assumption for selected category/region."],
        snapshotCount: viewsResult.snapshotCount,
        trackedVideosCount,
        lastSyncedAt: viewsResult.lastSyncedAt,
        isStale: viewsResult.isStale,
        counterAnomalyDetected: viewsResult.counterAnomaly,
      },
      calculationInputs: {
        channelId: channel.id,
        requestedPeriodDays,
        actualCoverageDays: viewsResult.actualCoverageDays,
        coverageStartDate: viewsResult.coverageStartDate,
        coverageEndDate: viewsResult.coverageEndDate,
        earliestCumulativeViews: viewsResult.earliestCumulativeViews,
        latestCumulativeViews: viewsResult.latestCumulativeViews,
        observedPeriodViews: viewsResult.observedPeriodViews,
        category: "unknown",
        region: "unknown",
        currency: "USD",
        formatBreakdownSupported: false,
      },
      disclaimer:
        "ESTIMATE ONLY: Competitor revenue cannot be verified through public YouTube API data. Figures represent potential AdSense and viewer revenue based on observed view changes and industry RPM benchmarks.",
    };
  }

  validateRpmAssumption(rpm);

  let revenueLow = 0;
  let revenueTypical = 0;
  let revenueHigh = 0;
  let formatEstimates: FormatRevenueEstimate[] | undefined = undefined;

  // Multi-format support: if video-level format views are known and valid
  if (
    formatBreakdown &&
    (formatBreakdown.longFormViews > 0 || formatBreakdown.shortsViews > 0) &&
    formatBreakdown.shortsRpm
  ) {
    const lf = calculateRevenueRange(
      formatBreakdown.longFormViews,
      rpm.rpm_low,
      rpm.rpm_typical,
      rpm.rpm_high
    );
    const sf = calculateRevenueRange(
      formatBreakdown.shortsViews,
      formatBreakdown.shortsRpm.rpm_low,
      formatBreakdown.shortsRpm.rpm_typical,
      formatBreakdown.shortsRpm.rpm_high
    );

    revenueLow = Math.round((lf.low + sf.low) * 100) / 100;
    revenueTypical = Math.round((lf.typical + sf.typical) * 100) / 100;
    revenueHigh = Math.round((lf.high + sf.high) * 100) / 100;

    formatEstimates = [
      {
        format: "long-form",
        views: formatBreakdown.longFormViews,
        rpmLow: rpm.rpm_low,
        rpmTypical: rpm.rpm_typical,
        rpmHigh: rpm.rpm_high,
        revenueLow: lf.low,
        revenueTypical: lf.typical,
        revenueHigh: lf.high,
        source: rpm.source_name,
      },
      {
        format: "short",
        views: formatBreakdown.shortsViews,
        rpmLow: formatBreakdown.shortsRpm.rpm_low,
        rpmTypical: formatBreakdown.shortsRpm.rpm_typical,
        rpmHigh: formatBreakdown.shortsRpm.rpm_high,
        revenueLow: sf.low,
        revenueTypical: sf.typical,
        revenueHigh: sf.high,
        source: formatBreakdown.shortsRpm.source_name,
      },
    ];
  } else {
    // Blended / single group formula
    const r = calculateRevenueRange(
      viewsResult.observedPeriodViews,
      rpm.rpm_low,
      rpm.rpm_typical,
      rpm.rpm_high
    );
    revenueLow = r.low;
    revenueTypical = r.typical;
    revenueHigh = r.high;
  }

  const { confidence, reasons } = evaluateConfidence(
    viewsResult.actualCoverageDays,
    requestedPeriodDays,
    viewsResult.snapshotCount,
    viewsResult.isStale,
    viewsResult.counterAnomaly,
    rpm
  );

  const effectiveRpm = {
    low: viewsResult.observedPeriodViews > 0
      ? Math.round((revenueLow / (viewsResult.observedPeriodViews / 1000)) * 100) / 100
      : rpm.rpm_low,
    typical: viewsResult.observedPeriodViews > 0
      ? Math.round((revenueTypical / (viewsResult.observedPeriodViews / 1000)) * 100) / 100
      : rpm.rpm_typical,
    high: viewsResult.observedPeriodViews > 0
      ? Math.round((revenueHigh / (viewsResult.observedPeriodViews / 1000)) * 100) / 100
      : rpm.rpm_high,
  };

  return {
    channel,
    isEstimate: true,
    status: viewsResult.status,
    statusMessage: viewsResult.statusMessage,
    reportingPeriodDays: requestedPeriodDays,
    actualCoverageDays: viewsResult.actualCoverageDays,
    coverageStartDate: viewsResult.coverageStartDate,
    coverageEndDate: viewsResult.coverageEndDate,
    observedPeriodViews: viewsResult.observedPeriodViews,
    currency: rpm.currency,
    estimatedRevenue: {
      low: revenueLow,
      typical: revenueTypical,
      high: revenueHigh,
    },
    estimatedRevenuePerThousandViews: effectiveRpm,
    appliedRpm: {
      category: rpm.category,
      region: rpm.region,
      format: rpm.format,
      low: rpm.rpm_low,
      typical: rpm.rpm_typical,
      high: rpm.rpm_high,
      sourceName: rpm.source_name,
      sourceUrl: rpm.source_url,
      effectiveDate: rpm.effective_date,
      confidence: rpm.confidence,
    },
    formatEstimates,
    dataQuality: {
      confidence,
      confidenceReasons: reasons,
      snapshotCount: viewsResult.snapshotCount,
      trackedVideosCount,
      lastSyncedAt: viewsResult.lastSyncedAt,
      isStale: viewsResult.isStale,
      counterAnomalyDetected: viewsResult.counterAnomaly,
    },
    calculationInputs: {
      channelId: channel.id,
      requestedPeriodDays,
      actualCoverageDays: viewsResult.actualCoverageDays,
      coverageStartDate: viewsResult.coverageStartDate,
      coverageEndDate: viewsResult.coverageEndDate,
      earliestCumulativeViews: viewsResult.earliestCumulativeViews,
      latestCumulativeViews: viewsResult.latestCumulativeViews,
      observedPeriodViews: viewsResult.observedPeriodViews,
      category: rpm.category,
      region: rpm.region,
      currency: rpm.currency,
      formatBreakdownSupported: Boolean(formatEstimates),
      longFormViews: formatBreakdown?.longFormViews,
      shortsViews: formatBreakdown?.shortsViews,
    },
    disclaimer:
      "ESTIMATE ONLY: Competitor revenue cannot be verified through public YouTube API data. Figures represent potential AdSense and viewer revenue based on observed view changes and industry RPM benchmarks. Actual creator revenue varies based on monetization eligibility, brand deals, memberships, and audience geography.",
  };
}
