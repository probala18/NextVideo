"use client";

import React, { useState } from "react";
import {
  Search,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Eye,
  Calendar,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Filter,
  Copy,
  Check,
  Zap,
} from "lucide-react";

interface NicheResearchViewProps {
  onApplyTitleToPlanner?: (title: string, note: string) => void;
  onSendToScorecard?: (title: string, topic: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const NicheResearchView: React.FC<NicheResearchViewProps> = ({
  onApplyTitleToPlanner,
  onSendToScorecard,
  onToast,
}) => {
  const [topic, setTopic] = useState("AI Agents & Next.js");
  const [competitors, setCompetitors] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "outliers" | "shorts" | "long-form">("all");

  const runResearch = async () => {
    if (!topic.trim()) {
      onToast("Please enter a niche topic or keyword", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/research/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nicheOrTopic: topic.trim(),
          competitorUrls: competitors.split(",").map((s) => s.trim()).filter(Boolean),
          maxVideos: 30,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to analyze research");
      }
      setData(json);
      onToast(`Research completed! Analyzed ${json.totalVideosAnalyzed} videos.`, "success");
    } catch (err: any) {
      onToast(err.message || "Failed to run research", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    onToast(`Copied ${label} to clipboard!`, "info");
  };

  const filteredVideos = (data?.videos || []).filter((v: any) => {
    if (activeFilter === "outliers") return (v.multipleOfChannelMedian || 1) >= 1.5;
    if (activeFilter === "shorts") return v.format === "short";
    if (activeFilter === "long-form") return v.format === "long-form";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Research Query Header */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <Search className="w-3.5 h-3.5" />
              <span>YouTube Research & Data Collection Agent</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
              Niche Pattern & Competitor Outlier Explorer
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Discovers outlier videos in your niche, clusters recurring content themes, and measures title formulas against channel baselines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="md:col-span-2">
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
              Target Niche / Topic / Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runResearch()}
                placeholder="e.g. Next.js 14, Autonomous AI Agents, Supabase Tutorials"
                className="w-full pl-9 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
              Optional Competitor Channels (comma-separated)
            </label>
            <input
              type="text"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="e.g. @Fireship, @leerob"
              className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Quota-safe multi-source pipeline (Live YouTube API + Curated Benchmarks)</span>
          </div>

          <button
            type="button"
            onClick={runResearch}
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-300 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <Zap className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Analyzing YouTube Data..." : "Run Research Pipeline →"}</span>
          </button>
        </div>
      </div>

      {/* Results View */}
      {data && (
        <div className="space-y-6">
          {/* Data Attribution Badge */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1E293B]">Data Provenance:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                  data.isLiveApiData
                    ? "bg-[#ECFDF5] text-[#059669]"
                    : "bg-[#EFF6FF] text-[#2563EB]"
                }`}
              >
                {data.isLiveApiData ? "Live YouTube Data API v3" : "Verified Topic Benchmark Dataset"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#64748B] text-[11px]">
              <span>Sample: <strong>{data.totalVideosAnalyzed}</strong> videos</span>
              <span>Channels: <strong>{data.channelsRepresented}</strong> creators</span>
              <span>Median: <strong>{data.metricsSummary.medianViews?.toLocaleString()}</strong> views</span>
              <span>Velocity: <strong>{data.metricsSummary.avgViewsPerDay?.toLocaleString()}</strong> views/day</span>
            </div>
          </div>

          {/* Patterns Grid: Topic Clusters & Winning Title Formulas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Clusters */}
            <div className="bg-white rounded-[24px] border border-[#E8EAEE] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#3B82F6]" />
                  <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wide">
                    Topic Demand Clusters
                  </h3>
                </div>
                <span className="text-[11px] text-[#6B7280]">
                  Top: <strong>{data.patterns.topPerformingCluster}</strong>
                </span>
              </div>

              <div className="space-y-3">
                {data.patterns.topicClusters?.map((cl: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-2xl transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827]">{cl.theme}</span>
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded-full text-[10px] font-bold">
                        {cl.avgMultiple}x Median Views
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                      <span>Intent: <strong>{cl.intent}</strong></span>
                      <span>•</span>
                      <span>{cl.videoCount} Videos</span>
                      <span>•</span>
                      <span className={cl.isEvergreen ? "text-[#059669] font-medium" : "text-[#D97706]"}>
                        {cl.isEvergreen ? "Evergreen Demand" : "Trending / Timely"}
                      </span>
                    </div>
                    {cl.sampleTitles?.[0] && (
                      <div className="text-[11px] text-[#4B5563] italic bg-white p-2 rounded-lg border border-[#F0F2F5]">
                        "{cl.sampleTitles[0]}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Winning Title Formulas */}
            <div className="bg-white rounded-[24px] border border-[#E8EAEE] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#10B981]" />
                  <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wide">
                    High-Performing Title Formulas
                  </h3>
                </div>
                <span className="text-[11px] text-[#059669] font-bold">
                  Evidence-Backed
                </span>
              </div>

              <div className="space-y-3">
                {data.patterns.winningTitlePatterns?.map((pt: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827]">{pt.patternName}</span>
                      <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] rounded-full text-[10px] font-bold">
                        {pt.avgMultiple}x Baseline
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-snug">
                      {pt.description}
                    </p>
                    {pt.sampleTitles?.[0] && (
                      <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-[#F0F2F5]">
                        <span className="text-[11px] text-[#1F2937] font-medium truncate">
                          "{pt.sampleTitles[0]}"
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(pt.sampleTitles[0], "Title")}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"
                            title="Copy Title"
                          >
                            {copiedText === "Title" ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {onSendToScorecard && (
                            <button
                              type="button"
                              onClick={() => onSendToScorecard(pt.sampleTitles[0], topic)}
                              className="text-[10px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                            >
                              Audit in Scorecard →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Thumbnail Guidelines Card */}
          {data.patterns.thumbnailInsights && (
            <div className="bg-white rounded-[24px] border border-[#E8EAEE] p-5 shadow-xs space-y-3">
              <div className="text-xs font-bold text-[#111827] border-b border-[#F0F2F5] pb-2 flex items-center justify-between">
                <span>Visual Thumbnail Heuristics & Small-Screen Legibility</span>
                <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#F5F3FF] px-2.5 py-0.5 rounded-full">
                  Visual Strategy
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                  <span className="text-[10px] font-bold text-[#6B7280] block mb-1">Text Overlay Rule</span>
                  <p className="text-[#1F2937] font-medium">{data.patterns.thumbnailInsights.textOverlayRule}</p>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                  <span className="text-[10px] font-bold text-[#6B7280] block mb-1">Recommended Palette</span>
                  <p className="text-[#1F2937] font-medium">{data.patterns.thumbnailInsights.recommendedPalette}</p>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                  <span className="text-[10px] font-bold text-[#6B7280] block mb-1">Focal Point & Contrast</span>
                  <p className="text-[#1F2937] font-medium">{data.patterns.thumbnailInsights.focalPointRule}</p>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                  <span className="text-[10px] font-bold text-[#6B7280] block mb-1">Curiosity Trigger</span>
                  <p className="text-[#1F2937] font-medium">{data.patterns.thumbnailInsights.curiosityTrigger}</p>
                </div>
              </div>
            </div>
          )}

          {/* Competitor Outlier Videos Table */}
          <div className="bg-white rounded-[24px] border border-[#E8EAEE] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F2F5] pb-3">
              <div>
                <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wide">
                  Top Competitor Videos Ranked by Performance Multiple
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Ranked by multiple of channel median (not raw view count alone) to normalize for creator size.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5">
                {(["all", "outliers", "long-form", "shorts"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveFilter(mode)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition cursor-pointer ${
                      activeFilter === mode
                        ? "bg-[#3B82F6] text-white"
                        : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    {mode === "outliers" ? "Outliers (≥1.5x)" : mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#F0F2F5]">
              {filteredVideos.map((video: any) => {
                const mult = video.multipleOfChannelMedian || 1;
                const isOutlier = mult >= 1.5;

                return (
                  <div
                    key={video.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F9FAFB] rounded-xl px-2 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {video.thumbnailUrl && (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-20 h-12 object-cover rounded-lg shrink-0 border border-gray-200"
                        />
                      )}
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs font-bold text-[#111827] hover:text-[#3B82F6] transition line-clamp-1">
                          {video.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B7280]">
                          <span className="font-medium text-[#374151]">{video.channelTitle}</span>
                          <span>•</span>
                          <span>{video.durationFormatted}</span>
                          <span>•</span>
                          <span>{video.viewsPerDay?.toLocaleString()} views/day</span>
                          <span>•</span>
                          <span>{video.viewCount?.toLocaleString()} total views</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isOutlier
                              ? "bg-[#ECFDF5] text-[#059669]"
                              : "bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                        >
                          {mult}x channel median
                        </span>
                      </div>

                      {onSendToScorecard && (
                        <button
                          type="button"
                          onClick={() => onSendToScorecard(video.title, topic)}
                          className="px-3 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-full text-[11px] font-bold transition cursor-pointer"
                        >
                          Audit Title
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
