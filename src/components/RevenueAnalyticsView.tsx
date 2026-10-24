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
  Eye,
  BarChart3,
  Zap,
  Activity,
  Users,
  ArrowUp,
  ArrowDown,
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

/* ─── Utility: Confidence badge color ─── */
const confidenceStyles = (c: ConfidenceLevel) => {
  switch (c) {
    case "high":
      return "bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800";
    case "medium":
      return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "low":
      return "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-100 dark:bg-ink-800 text-gray-600 dark:text-ink-400 border-gray-200 dark:border-ink-700";
  }
};

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
      const params = new URLSearchParams({
        days: days.toString(),
        region,
        niche,
        currency,
      });

      if (selectedChannelId) {
        params.set("channelId", selectedChannelId);
      }

      const res = await fetch(`/api/revenue/analytics?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch revenue analytics: ${res.statusText}`);
      }

      const data: RevenueAnalyticsResponse = await res.json();
      setAnalytics(data);

      if (data.channels.length > 0) {
        if (selectedChannelId) {
          const match = data.channels.find((c) => c.channel.id === selectedChannelId);
          setSelectedEstimate(match || data.channels[0]);
        } else {
          setSelectedEstimate(data.channels[0]);
          setSelectedChannelId(data.channels[0].channel.id);
        }
      } else {
        setSelectedEstimate(null);
      }
    } catch (err: any) {
      console.error("Error loading revenue analytics:", err);
      setError(err.message || "Failed to load revenue analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days, region, niche, currency]);

  // Channel selection handler
  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    if (analytics) {
      const match = analytics.channels.find((c) => c.channel.id === channelId);
      if (match) {
        setSelectedEstimate(match);
      }
    }
  };

  // Add new channel
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addIdentifier.trim()) return;

    setIsAdding(true);
    setAddError(null);
    setAddSuccessMessage(null);

    try {
      const res = await fetch("/api/revenue/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: addIdentifier.trim(),
          niche: addNiche,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add channel.");
      }

      setAddSuccessMessage(
        `Channel "${data.channel?.title || addIdentifier}" tracked successfully.`
      );
      setAddIdentifier("");

      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccessMessage(null);
        if (data.channel?.id) {
          setSelectedChannelId(data.channel.id);
        }
        fetchAnalytics();
      }, 900);
    } catch (err: any) {
      setAddError(err.message || "Could not track channel. Please verify the URL/handle.");
    } finally {
      setIsAdding(false);
    }
  };

  // Sync selected channel
  const handleRefreshChannel = async () => {
    if (!selectedEstimate) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/revenue/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: selectedEstimate.channel.id,
          niche: selectedEstimate.appliedRpm.category,
        }),
      });

      if (res.ok) {
        await fetchAnalytics();
      }
    } catch (err) {
      console.error("Error refreshing channel snapshot:", err);
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

  const formatCompact = (val: number) => {
    if (val >= 1e9) return (val / 1e9).toFixed(2) + "B";
    if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
    if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return val.toLocaleString("en-US");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-6 border-b border-[#F0F2F5]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Revenue Engine & Monetization</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706]">
                  PRO
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                Estimated AdSense & Sponsorship Revenue
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280] max-w-2xl leading-relaxed">
                Simulate creator AdSense revenue based on verified view velocity, regional multiplier rates, and industry RPM benchmarks.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Track Channel</span>
              </button>
              <button
                onClick={handleRefreshChannel}
                disabled={isSyncing || !selectedEstimate}
                title="Refresh latest snapshot from YouTube Data API"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-ink-800 hover:bg-gray-200 dark:hover:bg-ink-750 text-gray-700 dark:text-ink-200 rounded-full text-xs font-medium transition disabled:opacity-40 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync"}</span>
              </button>
            </div>
          </div>

          {/* Global Controls Filter Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            {/* Period Selector — Pill tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-ink-850 p-1 rounded-full border border-gray-200 dark:border-ink-700">
              <span className="text-gray-400 dark:text-ink-500 font-mono text-[10px] px-2 flex items-center gap-1 uppercase">
                <Calendar className="w-3 h-3" /> Period
              </span>
              {([7, 30, 90] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setDays(p)}
                  className={`px-3 py-1 rounded-full font-mono text-xs font-semibold transition ${
                    days === p
                      ? "bg-white dark:bg-ink-800 text-gray-900 dark:text-ink-50 shadow-xs"
                      : "text-gray-500 hover:text-gray-900 dark:text-ink-400 dark:hover:text-ink-100"
                  }`}
                >
                  {p}D
                </button>
              ))}
            </div>

            {/* Filters: Region, Niche, Currency */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Region */}
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-ink-850 px-3 py-1.5 rounded-full border border-gray-200 dark:border-ink-700 text-xs text-gray-700 dark:text-ink-300">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <select
                  aria-label="Select region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="bg-transparent text-gray-900 dark:text-ink-100 font-medium text-xs focus:outline-none cursor-pointer"
                >
                  <option value="US">US (United States)</option>
                  <option value="IN">IN (India)</option>
                  <option value="GB">GB (United Kingdom)</option>
                  <option value="GLOBAL">GLOBAL (Blended)</option>
                </select>
              </div>

              {/* Niche */}
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-ink-850 px-3 py-1.5 rounded-full border border-gray-200 dark:border-ink-700 text-xs text-gray-700 dark:text-ink-300">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                <select
                  aria-label="Select niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-transparent text-gray-900 dark:text-ink-100 font-medium text-xs focus:outline-none cursor-pointer capitalize"
                >
                  <option value="technology">Technology & Software</option>
                  <option value="finance">Finance & Business</option>
                  <option value="education">Education & Tutorials</option>
                  <option value="gaming">Gaming</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="general">General / Blended</option>
                </select>
              </div>

              {/* Currency */}
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-ink-850 px-3 py-1.5 rounded-full border border-gray-200 dark:border-ink-700 text-xs text-gray-700 dark:text-ink-300">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <select
                  aria-label="Select currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent text-gray-900 dark:text-ink-100 font-medium text-xs focus:outline-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-ink-200">Loading revenue analytics...</p>
            <p className="text-[11px] text-gray-400 dark:text-ink-500">Fetching view snapshots and RPM models</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-center space-y-2">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
          <h3 className="text-xs font-bold text-red-800 dark:text-red-300">{error}</h3>
          <p className="text-[11px] text-gray-500 dark:text-ink-400">
            Ensure <code className="text-brand-600 dark:text-brand-400">YOUTUBE_API_KEY</code> is configured for live updates.
          </p>
        </div>
      ) : analytics?.channels.length === 0 ? (
        /* Empty State */
        <div className="p-10 text-center bg-white dark:bg-ink-900 border border-gray-200/90 dark:border-ink-800 rounded-3xl space-y-4">
          <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950 rounded-2xl flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base font-bold text-gray-900 dark:text-ink-50">No Channels Tracked Yet</h2>
            <p className="text-xs text-gray-500 dark:text-ink-400">
              Track YouTube channels to start building persistent daily view count snapshots.
            </p>
          </div>

          <div className="pt-2">
            <div className="text-[10px] font-mono text-gray-400 dark:text-ink-500 mb-2.5">
              PRESET CHANNELS
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {PRESET_CHANNELS.map((p) => (
                <button
                  key={p.identifier}
                  onClick={() => {
                    setAddIdentifier(p.identifier);
                    setAddNiche(p.niche);
                    setShowAddModal(true);
                  }}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-ink-850 hover:bg-gray-100 dark:hover:bg-ink-800 border border-gray-200 dark:border-ink-700 rounded-full text-xs text-gray-700 dark:text-ink-200 font-medium transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Full Dashboard */
        <div className="space-y-6">
          {/* Channel Selector Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {analytics?.channels.map((est) => {
              const isSelected = est.channel.id === selectedChannelId;
              return (
                <button
                  key={est.channel.id}
                  onClick={() => handleSelectChannel(est.channel.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium flex-shrink-0 transition ${
                    isSelected
                      ? "bg-brand-50 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 border-brand-300 dark:border-brand-700 shadow-xs font-semibold"
                      : "bg-white dark:bg-ink-900 text-gray-600 dark:text-ink-400 border-gray-200 dark:border-ink-800 hover:bg-gray-50 dark:hover:bg-ink-850"
                  }`}
                >
                  <span className="font-semibold">{est.channel.title}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? "text-brand-700 dark:text-brand-400" : "text-gray-400 dark:text-ink-500"}`}>
                    {formatMoney(est.estimatedRevenue.typical)}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedEstimate && (
            <div className="space-y-6">
              {/* Channel Profile Bar */}
              <div className="p-4 bg-white dark:bg-ink-900 border border-gray-200/90 dark:border-ink-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 border border-brand-300 dark:border-brand-700 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm">
                    {selectedEstimate.channel.title[0]}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-ink-50">
                      {selectedEstimate.channel.title}
                    </h2>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-ink-500 font-mono mt-0.5">
                      <span>{selectedEstimate.channel.subscriberCount !== null ? `${formatCompact(selectedEstimate.channel.subscriberCount)} subs` : "Subs hidden"}</span>
                      <span>·</span>
                      <span>{formatCompact(selectedEstimate.channel.totalViews)} total views</span>
                    </div>
                  </div>
                </div>

                <a
                  href={`https://www.youtube.com/channel/${selectedEstimate.channel.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-ink-850 hover:bg-gray-200 dark:hover:bg-ink-800 text-gray-700 dark:text-ink-300 rounded-full text-xs font-medium transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
              </div>

              {/* 4 CORE KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Estimated Revenue */}
                <div className="p-4 bg-white dark:bg-ink-900 border border-gray-200/90 dark:border-ink-800 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-mono text-gray-400 dark:text-ink-500 uppercase block">
                    EST. REVENUE ({days}D)
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-ink-50 mt-1">
                    {formatMoney(selectedEstimate.estimatedRevenue.typical)}
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-ink-500 font-mono mt-1">
                    Range: {formatMoney(selectedEstimate.estimatedRevenue.low)} – {formatMoney(selectedEstimate.estimatedRevenue.high)}
                  </div>
                </div>

                {/* 2. Observed Views */}
                <div className="p-4 bg-white dark:bg-ink-900 border border-gray-200/90 dark:border-ink-800 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-mono text-gray-400 dark:text-ink-500 uppercase block">
                    OBSERVED VIEWS
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
                    {formatCompact(selectedEstimate.observedPeriodViews)}
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-ink-500 font-mono mt-1">
                    Coverage: {selectedEstimate.actualCoverageDays}d of {days}d window
                  </div>
                </div>

                {/* 3. Applied RPM */}
                <div className="p-4 bg-white dark:bg-ink-900 border border-gray-200/90 dark:border-ink-800 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-mono text-gray-400 dark:text-ink-500 uppercase block">
                    RPM ({currency})
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-ink-50 mt-1">
                    {currencySymbol}{selectedEstimate.appliedRpm.typical.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-ink-500 font-mono mt-1">
                    {selectedEstimate.appliedRpm.category} benchmark
                  </div>
                </div>

                {/* 4. Confidence */}
                <div className="p-4 bg-white dark:bg-ink-900 border border-gray-200/90 dark:border-ink-800 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-mono text-gray-400 dark:text-ink-500 uppercase block">
                    CONFIDENCE
                  </span>
                  <div className="mt-1">
                    <span className={`text-xs font-bold uppercase font-mono px-2.5 py-1 rounded-full border ${confidenceStyles(selectedEstimate.dataQuality.confidence)}`}>
                      {selectedEstimate.dataQuality.confidence.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-ink-500 mt-2 truncate">
                    {selectedEstimate.dataQuality.confidenceReasons[0] || "Rule-based evaluation"}
                  </p>
                </div>
              </div>

              {/* Charts */}
              <RevenueCharts
                estimate={selectedEstimate}
                currencySymbol={currencySymbol}
              />

              {/* Comparative Ranking Table */}
              <div className="p-6 bg-white dark:bg-ink-900 border border-gray-200/90 dark:border-ink-800 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-ink-50">
                    Comparative Channel Performance ({days}D)
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-ink-500 font-mono">
                    {analytics?.comparisons.length} channels
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-ink-800 text-gray-400 dark:text-ink-500 text-[10px]">
                        <th className="py-2.5 px-3">RANK</th>
                        <th className="py-2.5 px-3">CHANNEL</th>
                        <th className="py-2.5 px-3">NICHE</th>
                        <th className="py-2.5 px-3">VIEWS</th>
                        <th className="py-2.5 px-3">EST. REVENUE</th>
                        <th className="py-2.5 px-3">CONFIDENCE</th>
                        <th className="py-2.5 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-ink-850">
                      {analytics?.comparisons.map((c, idx) => {
                        const isCurrent = c.channelId === selectedChannelId;
                        return (
                          <tr
                            key={c.channelId}
                            onClick={() => handleSelectChannel(c.channelId)}
                            className={`hover:bg-gray-50 dark:hover:bg-ink-950/40 transition cursor-pointer ${
                              isCurrent ? "bg-brand-50/50 dark:bg-brand-950/30" : ""
                            }`}
                          >
                            <td className="py-3 px-3 text-gray-400">#{idx + 1}</td>
                            <td className="py-3 px-3 font-sans font-semibold text-gray-900 dark:text-ink-100">
                              {c.channelTitle}
                            </td>
                            <td className="py-3 px-3 capitalize text-gray-500 dark:text-ink-400 font-sans">
                              {c.niche}
                            </td>
                            <td className="py-3 px-3 text-gray-700 dark:text-ink-300">
                              {formatCompact(c.observedViews)}
                            </td>
                            <td className="py-3 px-3 font-bold text-brand-600 dark:text-brand-400">
                              {formatMoney(c.estimatedRevenueTypical)}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border font-bold ${confidenceStyles(c.confidence)}`}>
                                {c.confidence.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-xs font-sans text-brand-600 dark:text-brand-400 font-medium">
                                {isCurrent ? "Active" : "Inspect →"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD CHANNEL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-ink-200 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-ink-50">Track New Channel</h3>
              <p className="text-xs text-gray-500 dark:text-ink-400 mt-0.5">Enter a YouTube URL, handle, or ID</p>
            </div>

            <form onSubmit={handleAddChannel} className="space-y-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-ink-400 mb-1">
                  Channel Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. @mkbhd or https://youtube.com/@veritasium"
                  value={addIdentifier}
                  onChange={(e) => setAddIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-ink-950 border border-gray-200 dark:border-ink-700 rounded-xl text-xs text-gray-900 dark:text-ink-100 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-ink-400 mb-1">
                  Content Niche
                </label>
                <select
                  value={addNiche}
                  onChange={(e) => setAddNiche(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-ink-950 border border-gray-200 dark:border-ink-700 rounded-xl text-xs text-gray-900 dark:text-ink-100 focus:outline-none focus:border-brand-500 cursor-pointer capitalize"
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
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
                  {addError}
                </div>
              )}

              {addSuccessMessage && (
                <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-xl text-xs text-brand-800 dark:text-brand-300">
                  {addSuccessMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full text-xs text-gray-600 dark:text-ink-300 hover:bg-gray-100 dark:hover:bg-ink-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !addIdentifier.trim()}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-xs transition disabled:opacity-40"
                >
                  {isAdding ? "Fetching..." : "Start Tracking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
