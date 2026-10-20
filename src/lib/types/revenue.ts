export type ContentFormat = "long-form" | "short" | "blended";
export type FormatSource = "inferred" | "manual";
export type SyncStatus = "active" | "error" | "pending";
export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient_history";
export type CalculationStatus =
  | "ready"
  | "insufficient_history"
  | "missing_rpm_assumption"
  | "channel_not_tracked"
  | "counter_anomaly";

export interface TrackedChannel {
  channel_id: string;
  title: string;
  handle: string | null;
  custom_url: string | null;
  description: string | null;
  published_at: string | null;
  thumbnail_url: string | null;
  uploads_playlist_id: string | null;
  subscriber_count: number | null;
  hidden_subscriber_count: boolean;
  latest_total_views: number;
  video_count: number;
  first_tracked_at: string;
  last_synced_at: string | null;
  sync_status: SyncStatus;
  last_sync_error: string | null;
  niche: string;
}

export interface ChannelViewSnapshot {
  id?: number;
  channel_id: string;
  cumulative_views: number;
  observed_at: string; // ISO date or YYYY-MM-DD
  source?: string;
  metadata?: string | null;
}

export interface TrackedVideo {
  video_id: string;
  channel_id: string;
  title: string;
  published_at: string | null;
  duration: string | null;
  duration_seconds: number;
  format: ContentFormat;
  format_source: FormatSource;
  latest_view_count: number;
  tracking_status: "active" | "archived" | "deleted";
  first_tracked_at: string;
  last_synced_at: string | null;
}

export interface VideoViewSnapshot {
  id?: number;
  video_id: string;
  channel_id: string;
  cumulative_views: number;
  observed_at: string;
}

export interface RpmAssumption {
  id?: number;
  category: string;
  region: string;
  format: ContentFormat;
  currency: string;
  rpm_low: number;
  rpm_typical: number;
  rpm_high: number;
  source_name: string;
  source_url: string;
  effective_date: string;
  confidence: "high" | "medium" | "low" | "illustrative";
  notes?: string | null;
}

export interface RevenueCalculationInputs {
  channelId: string;
  requestedPeriodDays: number;
  actualCoverageDays: number;
  coverageStartDate: string | null;
  coverageEndDate: string | null;
  earliestCumulativeViews: number;
  latestCumulativeViews: number;
  observedPeriodViews: number;
  category: string;
  region: string;
  currency: string;
  formatBreakdownSupported: boolean;
  longFormViews?: number;
  shortsViews?: number;
}

export interface FormatRevenueEstimate {
  format: ContentFormat;
  views: number;
  rpmLow: number;
  rpmTypical: number;
  rpmHigh: number;
  revenueLow: number;
  revenueTypical: number;
  revenueHigh: number;
  source: string;
}

export interface RevenueEstimate {
  channel: {
    id: string;
    title: string;
    handle: string | null;
    thumbnailUrl: string | null;
    subscriberCount: number | null;
    totalViews: number;
    videoCount: number;
  };
  isEstimate: true;
  status: CalculationStatus;
  statusMessage: string;
  reportingPeriodDays: number;
  actualCoverageDays: number;
  coverageStartDate: string | null;
  coverageEndDate: string | null;
  observedPeriodViews: number;
  currency: string;
  estimatedRevenue: {
    low: number;
    typical: number;
    high: number;
  };
  estimatedRevenuePerThousandViews: {
    low: number;
    typical: number;
    high: number;
  };
  appliedRpm: {
    category: string;
    region: string;
    format: ContentFormat;
    low: number;
    typical: number;
    high: number;
    sourceName: string;
    sourceUrl: string;
    effectiveDate: string;
    confidence: string;
  };
  formatEstimates?: FormatRevenueEstimate[];
  dataQuality: {
    confidence: ConfidenceLevel;
    confidenceReasons: string[];
    snapshotCount: number;
    trackedVideosCount: number;
    lastSyncedAt: string | null;
    isStale: boolean;
    counterAnomalyDetected: boolean;
  };
  calculationInputs: RevenueCalculationInputs;
  disclaimer: string;
}

export interface ComparativeChannelMetric {
  channelId: string;
  channelTitle: string;
  handle: string | null;
  thumbnailUrl: string | null;
  niche: string;
  coverageDays: number;
  observedViews: number;
  estimatedRevenueTypical: number;
  estimatedRevenueRange: [number, number]; // [low, high]
  effectiveRpmTypical: number;
  confidence: ConfidenceLevel;
  currency: string;
  status: CalculationStatus;
  statusMessage?: string;
  assumptionsMatch: boolean;
}

export interface RevenueAnalyticsResponse {
  periodDays: number;
  region: string;
  niche: string;
  currency: string;
  channelsCount: number;
  channels: RevenueEstimate[];
  comparisons: ComparativeChannelMetric[];
  appliedRpm: RpmAssumption | null;
  warnings: string[];
  disclaimer: string;
}
