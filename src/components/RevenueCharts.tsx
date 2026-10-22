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
  BarChart3,
  Zap,
  Activity,
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

  const chartHeight = 240;
  const chartWidth = 760;
  const paddingX = 44;
  const paddingY = 32;

  const maxVal = useMemo(() => {
    const peak = Math.max(...snapshots.map((s) => s.estimatedRevenue), 1);
    return Math.ceil(peak * 1.15);
  }, [snapshots]);

  const points = useMemo(() => {
    if (snapshots.length === 0) return [];
    if (snapshots.length === 1) {
      return [
        {
          x: chartWidth / 2,
          y: chartHeight - paddingY - (snapshots[0].estimatedRevenue / maxVal) * (chartHeight - paddingY * 2),
          data: snapshots[0],
        },
      ];
    }
    return snapshots.map((s, idx) => {
      const x = paddingX + (idx / (snapshots.length - 1)) * (chartWidth - paddingX * 2);
      const normalizedY = s.estimatedRevenue / maxVal;
      const y = chartHeight - paddingY - normalizedY * (chartHeight - paddingY * 2);
      return { x, y, data: s };
    });
  }, [snapshots, maxVal]);

  const curvePath = useMemo(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }, [points]);

  const areaPathStr = useMemo(() => {
    if (!curvePath || points.length < 2) return "";
    const first = points[0];
    const last = points[points.length - 1];
    let path = `M ${first.x},${chartHeight - paddingY} L ${first.x},${first.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    path += ` L ${last.x},${chartHeight - paddingY} Z`;
    return path;
  }, [points, curvePath]);

  const customCalculatedRevenue = useMemo(() => {
    return Math.round((estimate.observedPeriodViews / 1000) * customRpm * 100) / 100;
  }, [estimate.observedPeriodViews, customRpm]);

  const dailyAvg = estimate.actualCoverageDays > 0
    ? estimate.observedPeriodViews / estimate.actualCoverageDays
    : estimate.observedPeriodViews / estimate.reportingPeriodDays;

  const projected30d = Math.round(((dailyAvg * 30) / 1000) * estimate.appliedRpm.typical);
  const projected90d = Math.round(((dailyAvg * 90) / 1000) * estimate.appliedRpm.typical);
  const projectedAnnual = Math.round(((dailyAvg * 365) / 1000) * estimate.appliedRpm.typical);

  const tabItems = [
    { key: "timeline" as const, label: "Growth Timeline", icon: TrendingUp },
    { key: "sensitivity" as const, label: "RPM Sensitivity", icon: Sliders },
    { key: "videos" as const, label: `Uploads (${recentVideos.length})`, icon: PlaySquare },
  ];

  return (
    <div className="bg-white dark:bg-ink-900 border border-gray-200/90 dark:border-ink-800 rounded-2xl p-6 shadow-2xs space-y-6">
      {/* Header and Chart Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-ink-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-ink-50">
              Revenue & Performance Charts
            </h3>
          </div>
          <p className="text-xs text-gray-400 dark:text-ink-500 mt-1 ml-[42px]">
            Visual progression, scenario modeling, and format distributions for {estimate.channel.title}
          </p>
        </div>

        {/* Tab Controls — Clean pill design */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-ink-850 p-1 rounded-full border border-gray-200 dark:border-ink-700">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? "bg-white dark:bg-ink-800 text-gray-900 dark:text-ink-50 shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-ink-400 dark:hover:text-ink-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Growth Timeline */}
      {activeTab === "timeline" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 dark:text-ink-500 font-mono text-[11px] uppercase">
              REVENUE GROWTH TIMELINE ({estimate.reportingPeriodDays}D WINDOW)
            </span>
            <span className="text-gray-500 dark:text-ink-400 font-mono text-[11px]">
              Peak: {formatMoney(maxVal)}
            </span>
          </div>

          {/* SVG Visual Area Chart */}
          <div className="relative bg-gray-50/70 dark:bg-ink-950/60 rounded-2xl p-4 border border-gray-100 dark:border-ink-850 overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-52 sm:h-60 overflow-visible relative z-10"
            >
              <defs>
                <linearGradient id="limeRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#84CC16" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#84CC16" stopOpacity="0.0" />
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
                      stroke="currentColor"
                      className="text-gray-200 dark:text-ink-800"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      className="fill-gray-400 dark:fill-ink-500"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {formatMoney(maxVal * frac)}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaPathStr && (
                <path d={areaPathStr} fill="url(#limeRevenueGradient)" />
              )}

              {/* Line */}
              {curvePath && (
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#84CC16"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === idx ? "5.5" : "3.5"}
                    fill={hoveredIndex === idx ? "#65A30D" : "#84CC16"}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 8}
                    className="fill-gray-400 dark:fill-ink-500"
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
                className="absolute top-5 left-5 p-3.5 bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-700 rounded-xl shadow-lg text-xs font-mono space-y-1 pointer-events-none z-20"
              >
                <div className="text-gray-400 dark:text-ink-500 text-[10px]">
                  DATE: {points[hoveredIndex].data.date}
                </div>
                <div className="text-brand-600 dark:text-brand-400 font-bold text-sm">
                  Revenue: {formatMoney(points[hoveredIndex].data.estimatedRevenue)}
                </div>
                <div className="text-gray-600 dark:text-ink-300 text-[11px]">
                  Views: {points[hoveredIndex].data.periodViews.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* 3 Run-Rate Projection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="p-4 bg-gray-50 dark:bg-ink-950/60 border border-gray-100 dark:border-ink-850 rounded-2xl">
              <span className="text-[10px] font-mono text-gray-400 dark:text-ink-500 block uppercase">
                30-Day Run Rate
              </span>
              <div className="text-lg font-bold text-gray-900 dark:text-ink-100 mt-1">
                {formatMoney(projected30d)}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-ink-500 mt-0.5">
                At {formatViews(Math.round(dailyAvg * 30))} views/mo
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-ink-950/60 border border-gray-100 dark:border-ink-850 rounded-2xl">
              <span className="text-[10px] font-mono text-gray-400 dark:text-ink-500 block uppercase">
                90-Day Quarter
              </span>
              <div className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-1">
                {formatMoney(projected90d)}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-ink-500 mt-0.5">
                Observed trajectory
              </p>
            </div>

            <div className="p-4 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 rounded-2xl">
              <span className="text-[10px] font-mono text-brand-700 dark:text-brand-400 block uppercase font-bold">
                Annualized (12-MO)
              </span>
              <div className="text-lg font-bold text-brand-800 dark:text-brand-300 mt-1">
                {formatMoney(projectedAnnual)}
              </div>
              <p className="text-[10px] text-brand-700/80 dark:text-brand-400/80 mt-0.5">
                Baseline full year
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RPM Sensitivity */}
      {activeTab === "sensitivity" && (
        <div className="space-y-5">
          <p className="text-xs text-gray-500 dark:text-ink-400 leading-relaxed">
            RPM varies across niches and seasons. Explore how this channel&apos;s observed views (
            <span className="font-mono font-bold text-gray-900 dark:text-ink-100">
              {estimate.observedPeriodViews.toLocaleString()} views
            </span>
            ) translate across scenarios:
          </p>

          <div className="space-y-3">
            {[
              {
                label: "Conservative / Low Scenario",
                rpm: estimate.appliedRpm.low,
                revenue: estimate.estimatedRevenue.low,
                dotColor: "#9CA3AF",
                note: "Lower advertiser CPMs or ad-blocked viewers",
              },
              {
                label: "Baseline / Typical Scenario",
                rpm: estimate.appliedRpm.typical,
                revenue: estimate.estimatedRevenue.typical,
                dotColor: "#84CC16",
                note: `Published benchmark for ${estimate.appliedRpm.category} (${estimate.appliedRpm.sourceName})`,
              },
              {
                label: "High / Q4 Peak Scenario",
                rpm: estimate.appliedRpm.high,
                revenue: estimate.estimatedRevenue.high,
                dotColor: "#10B981",
                note: "Peak holiday advertiser bidding and tier-1 audience",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4 bg-gray-50 dark:bg-ink-950/60 border border-gray-100 dark:border-ink-850 rounded-2xl space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.dotColor }} />
                    <span className="font-bold text-gray-900 dark:text-ink-100">{s.label}</span>
                    <span className="text-[11px] font-mono text-gray-400 dark:text-ink-500">
                      ({currencySymbol}{s.rpm.toFixed(2)}/1k)
                    </span>
                  </div>
                  <span className="font-bold font-mono text-gray-900 dark:text-ink-100">
                    {formatMoney(s.revenue)}
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-ink-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (s.revenue / Math.max(1, estimate.estimatedRevenue.high)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 dark:text-ink-500">{s.note}</div>
              </div>
            ))}
          </div>

          {/* Interactive Custom RPM Slider */}
          <div className="p-5 bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-700 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-ink-100">
                Custom RPM Calculator
              </span>
              <span className="text-xs font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
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
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-ink-800 accent-brand-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400 dark:text-ink-500">
                <span>{currencySymbol}0.20 (Shorts)</span>
                <span>{currencySymbol}5.00 (General)</span>
                <span>{currencySymbol}15.00 (Tech/Finance)</span>
                <span>{currencySymbol}30.00 (Enterprise)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-ink-800 text-xs">
              <span className="text-gray-500 dark:text-ink-400">
                Projected Revenue at {currencySymbol}{customRpm.toFixed(2)} RPM:
              </span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400 font-mono">
                {formatMoney(customCalculatedRevenue)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Recent Uploads */}
      {activeTab === "videos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-ink-500">
            <span>Recent Uploads ({recentVideos.length})</span>
            <span>Per-video estimate under {currencySymbol}{estimate.appliedRpm.typical.toFixed(2)} RPM</span>
          </div>

          {recentVideos.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-400 dark:text-ink-500 bg-gray-50 dark:bg-ink-950/60 rounded-2xl border border-gray-100 dark:border-ink-850">
              No individual videos tracked yet. Uploads sync automatically during channel synchronization.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {recentVideos.map((v: TrackedVideo, idx: number) => {
                const vidRpm =
                  v.format === "short"
                    ? estimate.formatEstimates?.find((f) => f.format === "short")?.rpmTypical || 0.05
                    : estimate.appliedRpm.typical;
                const estVidRevenue = Math.round((v.latest_view_count / 1000) * vidRpm * 100) / 100;

                return (
                  <div
                    key={v.video_id}
                    className="p-3.5 bg-gray-50 dark:bg-ink-950/60 border border-gray-100 dark:border-ink-850 rounded-xl flex items-center justify-between gap-4 hover:border-brand-500 dark:hover:border-brand-500 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-800 text-[10px] font-mono flex items-center justify-center text-gray-400 dark:text-ink-500 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <a
                          href={`https://www.youtube.com/watch?v=${v.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-gray-900 dark:text-ink-100 hover:text-brand-600 dark:hover:text-brand-400 transition truncate block"
                        >
                          {v.title}
                        </a>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-ink-500 font-mono mt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-gray-100 dark:bg-ink-800">
                            {v.format}
                          </span>
                          <span>·</span>
                          <span>{v.published_at ? v.published_at.slice(0, 10) : "Recent"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 font-mono">
                      <div className="text-xs font-bold text-gray-900 dark:text-ink-100">
                        {formatNumber(v.latest_view_count)} views
                      </div>
                      <div className="text-[11px] text-brand-600 dark:text-brand-400 font-bold">
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
