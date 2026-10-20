"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  PlaySquare,
  Sparkles,
  Sliders,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { RevenueEstimate, SnapshotPoint, TrackedVideo } from "@/lib/types/revenue";

interface RevenueChartsProps {
  estimate: RevenueEstimate;
  currencySymbol: string;
}

export const RevenueCharts: React.FC<RevenueChartsProps> = ({
  estimate,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<"timeline" | "sensitivity" | "videos">("timeline");
  const [customRpm, setCustomRpm] = useState<number>(estimate.appliedRpm.typical || 5.0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const snapshots: SnapshotPoint[] = useMemo(() => {
    if (estimate.snapshots && estimate.snapshots.length > 0) {
      return estimate.snapshots;
    }
    // Fallback if single observation
    return [
      {
        date: estimate.coverageStartDate?.slice(0, 10) || "Start",
        cumulativeViews: estimate.calculationInputs.earliestCumulativeViews,
        periodViews: 0,
        estimatedRevenue: 0,
      },
      {
        date: estimate.coverageEndDate?.slice(0, 10) || "Today",
        cumulativeViews: estimate.calculationInputs.latestCumulativeViews,
        periodViews: estimate.observedPeriodViews,
        estimatedRevenue: estimate.estimatedRevenue.typical,
      },
    ];
  }, [estimate]);

  const recentVideos = estimate.recentVideos || [];

  // Formatter helpers
  const formatMoney = (val: number) => {
    return `${currencySymbol}${val.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatViews = (val: number) => {
    if (val >= 1e9) return (val / 1e9).toFixed(2) + "B";
    if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
    if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return val.toLocaleString("en-US");
  };

  const formatNumber = (val: number) => {
    return val.toLocaleString("en-US");
  };

  // Timeline SVG calculations
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = useMemo(() => {
    const max = Math.max(...snapshots.map((s) => s.estimatedRevenue), 10);
    return Math.ceil(max * 1.15);
  }, [snapshots]);

  const points = useMemo(() => {
    if (snapshots.length === 1) {
      return [{ x: chartWidth / 2, y: chartHeight - paddingY, data: snapshots[0] }];
    }
    return snapshots.map((s, idx) => {
      const x = paddingX + (idx / (snapshots.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - (s.estimatedRevenue / maxVal) * (chartHeight - paddingY * 2);
      return { x, y, data: s };
    });
  }, [snapshots, maxVal]);

  const polylineStr = useMemo(() => {
    if (points.length < 2) return "";
    return points.map((p) => `${p.x},${p.y}`).join(" ");
  }, [points]);

  const areaPathStr = useMemo(() => {
    if (points.length < 2) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x},${chartHeight - paddingY} L ${points
      .map((p) => `${p.x},${p.y}`)
      .join(" L ")} L ${last.x},${chartHeight - paddingY} Z`;
  }, [points]);

  // Dynamic custom RPM revenue calculation
  const customCalculatedRevenue = useMemo(() => {
    return Math.round((estimate.observedPeriodViews / 1000) * customRpm * 100) / 100;
  }, [estimate.observedPeriodViews, customRpm]);

  // Projected Run-rates
  const dailyAvg = estimate.actualCoverageDays > 0
    ? estimate.observedPeriodViews / estimate.actualCoverageDays
    : estimate.observedPeriodViews / estimate.reportingPeriodDays;

  const projected30d = Math.round(((dailyAvg * 30) / 1000) * estimate.appliedRpm.typical);
  const projected90d = Math.round(((dailyAvg * 90) / 1000) * estimate.appliedRpm.typical);
  const projectedAnnual = Math.round(((dailyAvg * 365) / 1000) * estimate.appliedRpm.typical);

  return (
    <div className="studio-glass rounded-xl p-5 border border-ink-800 space-y-6">
      {/* Header and Chart Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-studio-orange animate-pulse" />
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-studio-orange" />
              <span>Revenue & Performance Analytics Charts</span>
            </h3>
          </div>
          <p className="text-xs text-ink-400 mt-0.5">
            Visual progression, scenario modeling, and format distributions for {estimate.channel.title}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-ink-900 p-1 rounded-lg border border-ink-800 text-xs">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              activeTab === "timeline"
                ? "bg-studio-orange text-white shadow-sm"
                : "text-ink-400 hover:text-ink-200"
            }`}
          >
            Growth Timeline
          </button>
          <button
            onClick={() => setActiveTab("sensitivity")}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              activeTab === "sensitivity"
                ? "bg-studio-orange text-white shadow-sm"
                : "text-ink-400 hover:text-ink-200"
            }`}
          >
            RPM Sensitivity
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
              activeTab === "videos"
                ? "bg-studio-orange text-white shadow-sm"
                : "text-ink-400 hover:text-ink-200"
            }`}
          >
            Recent Uploads ({recentVideos.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Growth Timeline */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-400 font-mono text-[11px]">
              OBSERVED REVENUE GROWTH TIMELINE ({estimate.reportingPeriodDays}D WINDOW)
            </span>
            <span className="text-ink-400 font-mono text-[11px]">
              Peak Interval Revenue: {formatMoney(maxVal)}
            </span>
          </div>

          {/* SVG Visual Area Chart */}
          <div className="relative bg-ink-950/70 rounded-xl p-3 border border-ink-800 overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 sm:h-56 overflow-visible"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                const y = chartHeight - paddingY - frac * (chartHeight - paddingY * 2);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#272B35"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      fill="#646A7C"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {formatMoney(maxVal * frac)}
                    </text>
                  </g>
                );
              })}

              {/* Area & Line */}
              {areaPathStr && (
                <path d={areaPathStr} fill="url(#revenueGradient)" />
              )}
              {polylineStr && (
                <polyline
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylineStr}
                />
              )}

              {/* Points & Interactive Nodes */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === idx ? "6" : "3.5"}
                    fill="#F97316"
                    stroke="#0A0B0D"
                    strokeWidth="2"
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {/* Date labels on bottom */}
                  <text
                    x={p.x}
                    y={chartHeight - 8}
                    fill="#646A7C"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {p.data.date.slice(5)}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="absolute top-4 left-4 p-3 bg-ink-900/95 border border-studio-orange/50 rounded-lg shadow-xl text-xs font-mono space-y-1 pointer-events-none z-20 backdrop-blur-md"
              >
                <div className="text-ink-400 text-[10px]">
                  DATE: {points[hoveredIndex].data.date}
                </div>
                <div className="text-studio-orange font-bold text-sm">
                  Est. Revenue: {formatMoney(points[hoveredIndex].data.estimatedRevenue)}
                </div>
                <div className="text-ink-300 text-[11px]">
                  Observed Views: {points[hoveredIndex].data.periodViews.toLocaleString()}
                </div>
                <div className="text-ink-500 text-[10px]">
                  Cumulative: {formatViews(points[hoveredIndex].data.cumulativeViews)}
                </div>
              </div>
            )}
          </div>

          {/* 3 Run-Rate Projection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-ink-900/80 border border-ink-800 rounded-lg space-y-1">
              <span className="text-[10px] font-mono text-ink-500">PROJECTED 30-DAY RUN RATE</span>
              <div className="text-base font-bold text-ink-100">
                {formatMoney(projected30d)}
              </div>
              <p className="text-[10px] text-ink-500 font-mono">
                At {formatViews(Math.round(dailyAvg * 30))} views/mo
              </p>
            </div>

            <div className="p-3 bg-ink-900/80 border border-ink-800 rounded-lg space-y-1">
              <span className="text-[10px] font-mono text-ink-500">PROJECTED 90-DAY QUARTER</span>
              <div className="text-base font-bold text-ink-100">
                {formatMoney(projected90d)}
              </div>
              <p className="text-[10px] text-ink-500 font-mono">
                At current observed velocity
              </p>
            </div>

            <div className="p-3 bg-ink-900/80 border border-ink-800 rounded-lg space-y-1">
              <span className="text-[10px] font-mono text-studio-orange">ESTIMATED ANNUALIZED (12-MO)</span>
              <div className="text-base font-bold text-studio-orange">
                {formatMoney(projectedAnnual)}
              </div>
              <p className="text-[10px] text-ink-500 font-mono">
                Baseline annualized extrapolation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RPM Sensitivity & Custom Scenario Modeling */}
      {activeTab === "sensitivity" && (
        <div className="space-y-5">
          <div className="text-xs text-ink-400 leading-relaxed">
            RPM varies dramatically across niches and seasons. Explore how this channel&apos;s observed views (
            <span className="font-mono text-ink-200 font-bold">
              {estimate.observedPeriodViews.toLocaleString()} views
            </span>
            ) translate across low, typical, high, and custom RPM assumptions:
          </div>

          {/* Comparative RPM Scenario Bars */}
          <div className="space-y-3">
            {[
              {
                label: "Conservative / Low Scenario",
                rpm: estimate.appliedRpm.low,
                revenue: estimate.estimatedRevenue.low,
                color: "bg-ink-800 text-ink-300",
                barColor: "bg-ink-700",
                note: "Lower-tier advertiser CPMs, high international or ad-blocked viewership",
              },
              {
                label: "Baseline / Typical Scenario",
                rpm: estimate.appliedRpm.typical,
                revenue: estimate.estimatedRevenue.typical,
                color: "bg-studio-orange/20 text-studio-orange border border-studio-orange/30",
                barColor: "bg-studio-orange",
                note: `Published benchmark for ${estimate.appliedRpm.category} (${estimate.appliedRpm.sourceName})`,
              },
              {
                label: "High / Q4 Peak Ad Spend Scenario",
                rpm: estimate.appliedRpm.high,
                revenue: estimate.estimatedRevenue.high,
                color: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40",
                barColor: "bg-emerald-500",
                note: "Peak holiday advertiser bidding, high commercial intent & premium viewers",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3.5 bg-ink-950/80 border border-ink-800 rounded-lg space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div>
                    <span className="font-bold text-ink-100">{s.label}</span>
                    <span className="text-[10px] font-mono text-ink-500 ml-2">
                      ({currencySymbol}{s.rpm.toFixed(2)}/1k views)
                    </span>
                  </div>
                  <div className="text-sm font-bold font-mono text-ink-50">
                    {formatMoney(s.revenue)}
                  </div>
                </div>

                {/* Progress bar visually depicting scale */}
                <div className="w-full bg-ink-900 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.barColor} transition-all duration-300`}
                    style={{
                      width: `${Math.min(
                        100,
                        (s.revenue / Math.max(1, estimate.estimatedRevenue.high)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-ink-500">{s.note}</div>
              </div>
            ))}
          </div>

          {/* Interactive Custom RPM Slider */}
          <div className="p-4 bg-ink-900/90 border border-ink-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-studio-orange" />
                <span className="text-xs font-bold text-ink-100">
                  Custom Interactive RPM Calculator
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-studio-orange bg-ink-850 px-2.5 py-1 rounded border border-ink-700">
                {currencySymbol}{customRpm.toFixed(2)} / 1k views
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min="0.20"
                max="30.00"
                step="0.10"
                value={customRpm}
                onChange={(e) => setCustomRpm(parseFloat(e.target.value))}
                className="w-full accent-studio-orange cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink-500">
                <span>{currencySymbol}0.20 (Shorts/Low)</span>
                <span>{currencySymbol}5.00 (General)</span>
                <span>{currencySymbol}15.00 (Tech/Finance)</span>
                <span>{currencySymbol}30.00 (Enterprise)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-ink-800 text-xs">
              <span className="text-ink-400">
                Projected Revenue at {currencySymbol}{customRpm.toFixed(2)} RPM:
              </span>
              <span className="text-base font-bold text-studio-orange font-mono">
                {formatMoney(customCalculatedRevenue)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Recent Uploads Contribution */}
      {activeTab === "videos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-400 font-mono text-[11px]">
              RECENT UPLOADS TRACKED FROM PLAYLIST ({recentVideos.length})
            </span>
            <span className="text-[11px] text-ink-500">
              Estimated per-video contribution under {currencySymbol}
              {estimate.appliedRpm.typical.toFixed(2)} RPM
            </span>
          </div>

          {recentVideos.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-500 font-mono bg-ink-950/40 rounded-lg border border-ink-800">
              No individual videos tracked yet. Uploads sync automatically during channel synchronization.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {recentVideos.map((v: TrackedVideo, idx: number) => {
                const vidRpm =
                  v.format === "short"
                    ? estimate.formatEstimates?.find((f) => f.format === "short")?.rpmTypical || 0.05
                    : estimate.appliedRpm.typical;
                const estVidRevenue = Math.round((v.latest_view_count / 1000) * vidRpm * 100) / 100;

                return (
                  <div
                    key={v.video_id}
                    className="p-3 bg-ink-950/80 border border-ink-800 rounded-lg flex items-center justify-between gap-3 hover:bg-ink-900 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 h-5 rounded bg-ink-900 border border-ink-800 text-[10px] font-mono flex items-center justify-center text-ink-400 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <a
                          href={`https://www.youtube.com/watch?v=${v.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-ink-100 hover:text-studio-orange transition truncate block"
                        >
                          {v.title}
                        </a>
                        <div className="flex items-center gap-2 text-[10px] text-ink-500 font-mono mt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                              v.format === "short"
                                ? "bg-crimson-950/80 text-crimson-400 border border-crimson-800/40"
                                : "bg-ink-850 text-ink-300 border border-ink-700"
                            }`}
                          >
                            {v.format}
                          </span>
                          <span>·</span>
                          <span>{v.published_at ? v.published_at.slice(0, 10) : "Recent"}</span>
                          {v.duration && <span>· Duration: {v.duration.replace("PT", "")}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 font-mono">
                      <div className="text-xs font-bold text-ink-50">
                        {formatNumber(v.latest_view_count)} views
                      </div>
                      <div className="text-[10px] text-studio-orange font-bold">
                        ~{formatMoney(estVidRevenue)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
