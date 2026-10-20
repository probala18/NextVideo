"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Info,
  Calendar,
  Globe,
  Tag,
  CheckCircle2,
  AlertTriangle,
  PlaySquare,
  Flame,
  ArrowUpRight,
  Clock,
  Layers,
  ChevronDown,
  X,
} from "lucide-react";
import {
  RevenueEstimate,
  ComparativeChannelMetric,
  RevenueAnalyticsResponse,
  ConfidenceLevel,
  RpmAssumption,
} from "@/lib/types/revenue";
import { RevenueCharts } from "./RevenueCharts";

interface RevenueAnalyticsViewProps {
  initialChannelId?: string;
}

const PRESET_CHANNELS = [
  { name: "Veritasium", identifier: "@veritasium", niche: "education" },
  { name: "MKBHD", identifier: "@mkbhd", niche: "technology" },
  { name: "Fireship", identifier: "@fireship", niche: "technology" },
  { name: "3Blue1Brown", identifier: "@3blue1brown", niche: "education" },
  { name: "Ali Abdaal", identifier: "@aliabdaal", niche: "lifestyle" },
  { name: "Graham Stephan", identifier: "@grahamstephan", niche: "finance" },
];

export const RevenueAnalyticsView: React.FC<RevenueAnalyticsViewProps> = ({
  initialChannelId,
}) => {
  // State
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [region, setRegion] = useState<string>("US");
  const [niche, setNiche] = useState<string>("technology");
  const [currency, setCurrency] = useState<string>("USD");

  const [analytics, setAnalytics] = useState<RevenueAnalyticsResponse | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    initialChannelId || null
  );
  const [selectedEstimate, setSelectedEstimate] = useState<RevenueEstimate | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Add channel modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addIdentifier, setAddIdentifier] = useState<string>("");
  const [addNiche, setAddNiche] = useState<string>("technology");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/revenue/analytics?days=${days}&region=${region}&niche=${niche}&currency=${currency}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status} error fetching revenue analytics`);
      }
      const data: RevenueAnalyticsResponse = await res.json();
      setAnalytics(data);

      // Auto-select first channel or preserve current selection
      if (data.channels.length > 0) {
        const found = selectedChannelId
          ? data.channels.find((c) => c.channel.id === selectedChannelId)
          : null;
        const current = found || data.channels[0];
        setSelectedChannelId(current.channel.id);
        setSelectedEstimate(current);
      } else {
        setSelectedChannelId(null);
        setSelectedEstimate(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load revenue analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days, region, niche, currency]);

  // Update selected estimate when channel changes
  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    if (analytics) {
      const found = analytics.channels.find((c) => c.channel.id === channelId);
      if (found) setSelectedEstimate(found);
    }
  };

  // Track channel handler
  const handleAddChannel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addIdentifier.trim()) return;

    setIsAdding(true);
    setAddError(null);
    setAddSuccessMessage(null);

    try {
      const res = await fetch("/api/revenue/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: addIdentifier.trim(), niche: addNiche }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to track channel");
      }

      setAddSuccessMessage(data.message || "Channel tracked successfully!");
      setAddIdentifier("");
      await fetchAnalytics();
      if (data.channel?.channel_id) {
        setSelectedChannelId(data.channel.channel_id);
      }
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setAddError(err?.message || "Error adding channel");
    } finally {
      setIsAdding(false);
    }
  };

  // Refresh current channel
  const handleRefreshChannel = async () => {
    if (!selectedEstimate) return;
    setIsSyncing(true);
    try {
      await fetch("/api/revenue/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: selectedEstimate.channel.id, niche }),
      });
      await fetchAnalytics();
    } catch (err: any) {
      console.error("Refresh error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Currency symbols
  const currencySymbol = useMemo(() => {
    switch (currency) {
      case "INR":
        return "₹";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      default:
        return "$";
    }
  }, [currency]);

  const formatMoney = (val: number) => {
    return `${currencySymbol}${val.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatNumber = (val: number) => {
    return val.toLocaleString("en-US");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Hero */}
      <div className="studio-glass rounded-xl p-5 border border-ink-800 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-studio-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-studio-orange/20 text-studio-orange rounded-md border border-studio-orange/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink-50 tracking-tight">
                YouTube Channel Revenue Analytics
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-studio-orange/20 text-studio-orange border border-studio-orange/30">
                ESTIMATED
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-400 max-w-3xl">
              Discover estimated creator AdSense revenue based on verified public view growth
              and published industry RPM benchmarks. Observed view changes are measured between
              daily snapshots without synthetic extrapolation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-studio-orange text-white hover:bg-orange-600 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Track Channel</span>
            </button>
            <button
              onClick={handleRefreshChannel}
              disabled={isSyncing || !selectedEstimate}
              title="Refresh latest snapshot from YouTube Data API"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-900 hover:bg-ink-850 text-ink-300 border border-ink-700 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>

        {/* Global Controls Filter Bar */}
        <div className="mt-5 pt-4 border-t border-ink-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-ink-900/90 p-1 rounded-lg border border-ink-800">
            <span className="text-ink-500 font-mono text-[10px] px-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> PERIOD:
            </span>
            {([7, 30, 90] as const).map((p) => (
              <button
                key={p}
                onClick={() => setDays(p)}
                className={`px-2.5 py-1 rounded font-mono text-xs font-semibold transition cursor-pointer ${
                  days === p
                    ? "bg-studio-orange text-white"
                    : "text-ink-400 hover:text-ink-200"
                }`}
              >
                {p} Days
              </button>
            ))}
          </div>

          {/* Filters: Region, Niche, Currency */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Region */}
            <div className="flex items-center gap-1 bg-ink-900/90 px-2.5 py-1 rounded-lg border border-ink-800">
              <Globe className="w-3.5 h-3.5 text-ink-400" />
              <label htmlFor="rev-region-select" className="text-ink-500 text-[10px] font-mono">
                REGION:
              </label>
              <select
                id="rev-region-select"
                aria-label="Select region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="bg-transparent text-ink-200 font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="US" className="bg-ink-900">US (United States)</option>
                <option value="IN" className="bg-ink-900">IN (India)</option>
                <option value="GB" className="bg-ink-900">GB (United Kingdom)</option>
                <option value="GLOBAL" className="bg-ink-900">GLOBAL (Blended)</option>
              </select>
            </div>

            {/* Niche */}
            <div className="flex items-center gap-1 bg-ink-900/90 px-2.5 py-1 rounded-lg border border-ink-800">
              <Tag className="w-3.5 h-3.5 text-ink-400" />
              <label htmlFor="rev-niche-select" className="text-ink-500 text-[10px] font-mono">
                NICHE:
              </label>
              <select
                id="rev-niche-select"
                aria-label="Select niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="bg-transparent text-ink-200 font-semibold text-xs focus:outline-none cursor-pointer capitalize"
              >
                <option value="technology" className="bg-ink-900">Technology & Software</option>
                <option value="finance" className="bg-ink-900">Finance & Business</option>
                <option value="education" className="bg-ink-900">Education & Tutorials</option>
                <option value="gaming" className="bg-ink-900">Gaming</option>
                <option value="entertainment" className="bg-ink-900">Entertainment</option>
                <option value="lifestyle" className="bg-ink-900">Lifestyle</option>
                <option value="general" className="bg-ink-900">General / Blended</option>
              </select>
            </div>

            {/* Currency */}
            <div className="flex items-center gap-1 bg-ink-900/90 px-2.5 py-1 rounded-lg border border-ink-800">
              <label htmlFor="rev-currency-select" className="text-ink-500 text-[10px] font-mono">
                CURRENCY:
              </label>
              <select
                id="rev-currency-select"
                aria-label="Select currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-ink-200 font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="USD" className="bg-ink-900">USD ($)</option>
                <option value="INR" className="bg-ink-900">INR (₹)</option>
                <option value="EUR" className="bg-ink-900">EUR (€)</option>
                <option value="GBP" className="bg-ink-900">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
          <RefreshCw className="w-8 h-8 text-studio-orange animate-spin" />
          <p className="text-sm text-ink-400 font-mono">Loading revenue analytics and view snapshots...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-crimson-950/40 border border-crimson-800 rounded-xl text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-crimson-400 mx-auto" />
          <h3 className="text-sm font-semibold text-crimson-200">{error}</h3>
          <p className="text-xs text-ink-400">
            Check your network connection and ensure `YOUTUBE_API_KEY` is configured in `.env.local`.
          </p>
        </div>
      ) : analytics?.channels.length === 0 ? (
        /* Empty State */
        <div className="studio-glass rounded-xl p-10 border border-ink-800 text-center space-y-5">
          <div className="w-14 h-14 bg-studio-orange/10 border border-studio-orange/20 rounded-2xl flex items-center justify-center mx-auto text-studio-orange">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-bold text-ink-100">No Channels Tracked Yet</h2>
            <p className="text-xs text-ink-400">
              Track YouTube channels to start building persistent daily view count snapshots.
              Once snapshots are recorded, CreatorLens measures actual observed view changes.
            </p>
          </div>

          {/* Quick Add Presets */}
          <div className="pt-2">
            <div className="text-[11px] font-mono text-ink-500 mb-2.5">
              QUICK-TRACK CHANNELS FROM CREATORLENS INTEL:
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {PRESET_CHANNELS.map((p) => (
                <button
                  key={p.identifier}
                  onClick={() => {
                    setAddIdentifier(p.identifier);
                    setAddNiche(p.niche);
                    setShowAddModal(true);
                  }}
                  className="px-3 py-1.5 bg-ink-900 hover:bg-ink-850 border border-ink-800 hover:border-studio-orange/40 rounded-lg text-xs text-ink-300 font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-studio-orange" />
                  <span>{p.name}</span>
                  <span className="text-[10px] text-ink-500 font-mono">({p.identifier})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-studio-orange text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition shadow-sm cursor-pointer"
            >
              Add Custom Channel URL or Handle
            </button>
          </div>
        </div>
      ) : (
        /* Channels Present */
        <div className="space-y-6">
          {/* Channel Selector Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] font-mono text-ink-500 px-2 flex-shrink-0">
              TRACKED CHANNELS:
            </span>
            {analytics?.channels.map((est) => {
              const isSelected = est.channel.id === selectedChannelId;
              return (
                <button
                  key={est.channel.id}
                  onClick={() => handleSelectChannel(est.channel.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium flex-shrink-0 transition cursor-pointer ${
                    isSelected
                      ? "bg-ink-850 text-ink-50 border-studio-orange/60 shadow-sm"
                      : "bg-ink-900/60 text-ink-400 hover:text-ink-200 border-ink-800 hover:bg-ink-900"
                  }`}
                >
                  {est.channel.thumbnailUrl ? (
                    <img
                      src={est.channel.thumbnailUrl}
                      alt={est.channel.title}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-studio-orange/20 text-studio-orange text-[10px] flex items-center justify-center font-bold">
                      {est.channel.title[0]}
                    </div>
                  )}
                  <span className="font-semibold">{est.channel.title}</span>
                  <span className="text-[10px] font-mono text-ink-500">
                    {formatMoney(est.estimatedRevenue.typical)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Channel Revenue Dashboard */}
          {selectedEstimate && (
            <div className="space-y-6">
              {/* Channel Profile Bar */}
              <div className="studio-glass rounded-xl p-4 border border-ink-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {selectedEstimate.channel.thumbnailUrl ? (
                    <img
                      src={selectedEstimate.channel.thumbnailUrl}
                      alt={selectedEstimate.channel.title}
                      className="w-10 h-10 rounded-full border border-ink-700 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-ink-800 border border-ink-700 flex items-center justify-center text-studio-orange font-bold text-base">
                      {selectedEstimate.channel.title[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-ink-100">
                        {selectedEstimate.channel.title}
                      </h2>
                      {selectedEstimate.channel.handle && (
                        <span className="text-xs text-ink-400 font-mono">
                          {selectedEstimate.channel.handle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-ink-500 font-mono mt-0.5">
                      <span>
                        Subs:{" "}
                        {selectedEstimate.channel.subscriberCount !== null
                          ? formatNumber(selectedEstimate.channel.subscriberCount)
                          : "Hidden"}
                      </span>
                      <span>·</span>
                      <span>Total views: {formatNumber(selectedEstimate.channel.totalViews)}</span>
                      <span>·</span>
                      <span>Videos: {selectedEstimate.channel.videoCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.youtube.com/channel/${selectedEstimate.channel.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-ink-900 hover:bg-ink-850 text-ink-400 hover:text-ink-200 border border-ink-700 rounded-lg transition"
                    title="Open channel on YouTube"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Insufficient History / Partial Coverage Alert */}
              {selectedEstimate.status === "insufficient_history" && (
                <div className="p-4 bg-ink-900/90 border border-studio-orange/40 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-studio-orange text-xs font-semibold">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Historical Snapshot Accumulation in Progress</span>
                  </div>
                  <p className="text-xs text-ink-300 leading-relaxed">
                    {selectedEstimate.statusMessage}
                  </p>
                  <p className="text-[11px] text-ink-500 font-mono pt-1">
                    Coverage: {selectedEstimate.actualCoverageDays} day(s) observed out of {selectedEstimate.reportingPeriodDays}d period. Next Video never fabricates past views before tracking commenced.
                  </p>
                </div>
              )}

              {/* Counter Anomaly Alert */}
              {selectedEstimate.status === "counter_anomaly" && (
                <div className="p-4 bg-crimson-950/40 border border-crimson-800 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-crimson-300 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>View Counter Decrease Detected</span>
                  </div>
                  <p className="text-xs text-crimson-200">
                    {selectedEstimate.statusMessage}
                  </p>
                </div>
              )}

              {/* 4 Core KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Estimated Revenue */}
                <div className="studio-glass rounded-xl p-4 border border-ink-800 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-ink-500 font-mono text-[10px] tracking-wider mb-2">
                      <span>ESTIMATED REVENUE ({days}D)</span>
                      <span className="px-1.5 py-0.5 rounded bg-studio-orange/20 text-studio-orange font-bold text-[9px]">
                        ESTIMATE
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-ink-50 tracking-tight">
                      {formatMoney(selectedEstimate.estimatedRevenue.typical)}
                    </div>
                    <div className="text-xs text-ink-400 font-mono mt-1">
                      Range: {formatMoney(selectedEstimate.estimatedRevenue.low)} –{" "}
                      {formatMoney(selectedEstimate.estimatedRevenue.high)}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-800/80 text-[11px] text-ink-500">
                    Formula: (Views ÷ 1,000) × Assumed RPM
                  </div>
                </div>

                {/* 2. Observed Views in Period */}
                <div className="studio-glass rounded-xl p-4 border border-ink-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-ink-500 font-mono text-[10px] tracking-wider mb-2">
                      <span>OBSERVED PERIOD VIEWS</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-ink-50 tracking-tight">
                      {formatNumber(selectedEstimate.observedPeriodViews)}
                    </div>
                    <div className="text-xs text-ink-400 font-mono mt-1">
                      Coverage: {selectedEstimate.actualCoverageDays}d of {days}d window
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-800/80 text-[11px] text-ink-500 flex items-center justify-between">
                    <span>Snapshots: {selectedEstimate.dataQuality.snapshotCount}</span>
                    <span className={selectedEstimate.dataQuality.isStale ? "text-orange-400" : "text-emerald-400"}>
                      {selectedEstimate.dataQuality.isStale ? "Stale (>48h)" : "Fresh (<48h)"}
                    </span>
                  </div>
                </div>

                {/* 3. Applied RPM Assumption */}
                <div className="studio-glass rounded-xl p-4 border border-ink-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-ink-500 font-mono text-[10px] tracking-wider mb-2">
                      <span>APPLIED RPM ({currency})</span>
                      <span className="text-ink-400 font-mono uppercase text-[9px]">
                        {selectedEstimate.appliedRpm.category} · {selectedEstimate.appliedRpm.region}
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-ink-50 tracking-tight">
                      {currencySymbol}{selectedEstimate.appliedRpm.typical.toFixed(2)}
                      <span className="text-xs font-normal text-ink-400 ml-1">/1k views</span>
                    </div>
                    <div className="text-xs text-ink-400 font-mono mt-1">
                      Range: {currencySymbol}{selectedEstimate.appliedRpm.low.toFixed(2)} – {currencySymbol}{selectedEstimate.appliedRpm.high.toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-800/80 text-[11px] text-ink-500 flex items-center justify-between truncate">
                    <span className="truncate" title={selectedEstimate.appliedRpm.sourceName}>
                      {selectedEstimate.appliedRpm.sourceName}
                    </span>
                    {selectedEstimate.appliedRpm.sourceUrl && (
                      <a
                        href={selectedEstimate.appliedRpm.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-studio-orange hover:underline flex items-center gap-0.5 ml-1 flex-shrink-0"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* 4. Confidence & Data Quality */}
                <div className="studio-glass rounded-xl p-4 border border-ink-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-ink-500 font-mono text-[10px] tracking-wider mb-2">
                      <span>CONFIDENCE LEVEL</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-studio-orange" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-sm font-bold uppercase font-mono px-2.5 py-1 rounded-md border ${
                          selectedEstimate.dataQuality.confidence === "high"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                            : selectedEstimate.dataQuality.confidence === "medium"
                            ? "bg-orange-950/60 text-orange-400 border-orange-800"
                            : "bg-ink-900 text-ink-400 border-ink-700"
                        }`}
                      >
                        {selectedEstimate.dataQuality.confidence.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-400 mt-2 line-clamp-2">
                      {selectedEstimate.dataQuality.confidenceReasons[0] || "Defined rule-based evaluation"}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-800/80 text-[11px] text-ink-500">
                    Tracked videos: {selectedEstimate.dataQuality.trackedVideosCount}
                  </div>
                </div>
              </div>

              {/* Revenue & Growth Analytics Charts */}
              <RevenueCharts
                estimate={selectedEstimate}
                currencySymbol={currencySymbol}
              />

              {/* Format Breakdown (Long-form vs Shorts) if available */}
              {selectedEstimate.formatEstimates && selectedEstimate.formatEstimates.length > 0 && (
                <div className="studio-glass rounded-xl p-5 border border-ink-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                      <PlaySquare className="w-4 h-4 text-studio-orange" />
                      <span>Format-Specific Revenue Breakdown</span>
                    </h3>
                    <span className="text-[11px] font-mono text-ink-500">
                      Long-form Ad Inventory vs Shorts Creator Pool
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {selectedEstimate.formatEstimates.map((f) => (
                      <div
                        key={f.format}
                        className="bg-ink-900/80 border border-ink-800 rounded-lg p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold capitalize text-ink-100">
                            {f.format === "short" ? "YouTube Shorts (≤60s)" : "Long-Form Video (>60s)"}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-800 text-ink-300">
                            RPM: {currencySymbol}{f.rpmTypical.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="text-xs text-ink-400 font-mono">
                            {formatNumber(f.views)} views
                          </span>
                          <span className="font-bold text-ink-50">
                            {formatMoney(f.revenueTypical)}{" "}
                            <span className="text-[10px] text-ink-400 font-normal">
                              ({formatMoney(f.revenueLow)} – {formatMoney(f.revenueHigh)})
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparative Ranking Table */}
              <div className="studio-glass rounded-xl p-5 border border-ink-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-studio-orange" />
                      <span>Tracked Channels Comparative Performance</span>
                    </h3>
                    <p className="text-xs text-ink-400 mt-0.5">
                      Comparing estimated revenue and observed view changes across tracked creators in the {days}-day period.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-ink-500 self-start sm:self-auto">
                    {analytics?.comparisons.length} channels tracked
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-ink-800 text-[10px] font-mono text-ink-500">
                        <th className="py-2.5 px-3">RANK</th>
                        <th className="py-2.5 px-3">CHANNEL</th>
                        <th className="py-2.5 px-3">NICHE</th>
                        <th className="py-2.5 px-3">COVERAGE</th>
                        <th className="py-2.5 px-3">OBSERVED VIEWS</th>
                        <th className="py-2.5 px-3">EST. REVENUE (TYPICAL)</th>
                        <th className="py-2.5 px-3">EST. RANGE</th>
                        <th className="py-2.5 px-3">CONFIDENCE</th>
                        <th className="py-2.5 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-800/60 font-mono">
                      {analytics?.comparisons.map((c, idx) => {
                        const isCurrent = c.channelId === selectedChannelId;
                        return (
                          <tr
                            key={c.channelId}
                            onClick={() => handleSelectChannel(c.channelId)}
                            className={`hover:bg-ink-850/60 transition cursor-pointer ${
                              isCurrent ? "bg-ink-850/40 text-ink-100" : "text-ink-300"
                            }`}
                          >
                            <td className="py-3 px-3 text-ink-500 font-bold">#{idx + 1}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2 font-sans font-semibold text-ink-100">
                                {c.thumbnailUrl ? (
                                  <img
                                    src={c.thumbnailUrl}
                                    alt={c.channelTitle}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-ink-800 text-[10px] flex items-center justify-center text-studio-orange">
                                    {c.channelTitle[0]}
                                  </div>
                                )}
                                <span>{c.channelTitle}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 capitalize text-ink-400 font-sans">
                              {c.niche}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  c.coverageDays >= days * 0.8
                                    ? "bg-emerald-950/60 text-emerald-400"
                                    : "bg-ink-900 text-ink-400"
                                }`}
                              >
                                {c.coverageDays}d / {days}d
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-ink-100">
                              {formatNumber(c.observedViews)}
                            </td>
                            <td className="py-3 px-3 font-bold text-studio-orange text-sm">
                              {formatMoney(c.estimatedRevenueTypical)}
                            </td>
                            <td className="py-3 px-3 text-[11px] text-ink-400">
                              {formatMoney(c.estimatedRevenueRange[0])} – {formatMoney(c.estimatedRevenueRange[1])}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                                  c.confidence === "high"
                                    ? "bg-emerald-950 text-emerald-400"
                                    : c.confidence === "medium"
                                    ? "bg-orange-950 text-orange-400"
                                    : "bg-ink-900 text-ink-500"
                                }`}
                              >
                                {c.confidence.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectChannel(c.channelId);
                                }}
                                className="text-xs text-studio-orange hover:underline font-sans cursor-pointer"
                              >
                                {isCurrent ? "Active" : "Inspect"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-ink-500 pt-1">
                  * Note: Channels with differing niches use their specific category RPM benchmarks.
                  Comparisons disclose differing assumptions and represent potential earnings models,
                  not audited financial statements.
                </div>
              </div>

              {/* Methodology & Ethical Disclaimer Card */}
              <div className="studio-glass rounded-xl p-5 border border-ink-800 space-y-3 bg-ink-950/70">
                <div className="flex items-center gap-2 text-ink-200 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-studio-orange" />
                  <span>Calculation Methodology, Data Limits & Disclosure</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-ink-400 leading-relaxed">
                  <div>
                    <h4 className="text-ink-300 font-semibold mb-1">How Views Are Calculated:</h4>
                    <p>
                      YouTube Data API v3 only exposes lifetime cumulative view counts for public channels.
                      To calculate actual views earned during a {days}-day period, CreatorLens takes persistent
                      daily snapshots and calculates the difference:
                      <br />
                      <span className="font-mono text-ink-200">
                        Observed Views = Latest Cumulative Views − Earliest Cumulative Views
                      </span>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-ink-300 font-semibold mb-1">Why Competitor Revenue Is an Estimate:</h4>
                    <p>
                      YouTube does not expose competitor AdSense earnings, RPMs, or audience demographics
                      to third parties. Estimates multiply observed views by peer-reviewed creator benchmarks.
                      Actual revenue differs based on monetization status, audience geographic mix, AdBlock usage,
                      sponsorships, and seasonality.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="studio-glass rounded-xl border border-ink-800 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-ink-100 font-bold text-base">
              <Plus className="w-5 h-5 text-studio-orange" />
              <span>Track New YouTube Channel</span>
            </div>

            <p className="text-xs text-ink-400">
              Enter any YouTube channel URL, handle (e.g. <span className="font-mono text-ink-300">@veritasium</span>),
              or channel ID (<span className="font-mono text-ink-300">UC...</span>). CreatorLens will take an immediate
              initial snapshot and begin daily tracking.
            </p>

            <form onSubmit={handleAddChannel} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-ink-400 mb-1">
                  CHANNEL IDENTIFIER
                </label>
                <input
                  type="text"
                  placeholder="e.g. @mkbhd or https://youtube.com/@veritasium"
                  value={addIdentifier}
                  onChange={(e) => setAddIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-ink-900 border border-ink-700 rounded-lg text-xs text-ink-100 placeholder-ink-600 focus:outline-none focus:border-studio-orange transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-ink-400 mb-1">
                  CONTENT NICHE / CATEGORY
                </label>
                <select
                  value={addNiche}
                  onChange={(e) => setAddNiche(e.target.value)}
                  className="w-full px-3 py-2 bg-ink-900 border border-ink-700 rounded-lg text-xs text-ink-100 focus:outline-none focus:border-studio-orange transition cursor-pointer capitalize"
                >
                  <option value="technology">Technology & Software</option>
                  <option value="finance">Finance & Business</option>
                  <option value="education">Education & Tutorials</option>
                  <option value="gaming">Gaming</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="general">General / Other</option>
                </select>
              </div>

              {addError && (
                <div className="p-3 bg-crimson-950/60 border border-crimson-800 rounded-lg text-xs text-crimson-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccessMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{addSuccessMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-ink-400 hover:text-ink-200 bg-ink-900 border border-ink-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !addIdentifier.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-studio-orange text-white hover:bg-orange-600 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isAdding && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAdding ? "Fetching Channel..." : "Start Tracking"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
