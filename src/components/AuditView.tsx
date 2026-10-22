"use client";

import React, { useState } from "react";
import {
  ScanEye,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  History,
  Send,
  Calendar,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  Clock,
  Play
} from "lucide-react";
import { AuditData } from "@/types";

interface AuditViewProps {
  onPlanFollowup: (title: string, desc: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ onPlanFollowup, onToast }) => {
  const [channelInput, setChannelInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) {
      onToast("Paste a YouTube channel URL or @handle first.", "info");
      return;
    }

    setIsLoading(true);
    setErrorNotice(null);
    try {
      const res = await fetch(`/api/audit?channel=${encodeURIComponent(channelInput.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not complete channel audit");
      }
      setAuditData(data);
      onToast("Public channel audit loaded successfully.", "success");
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to audit channel");
      onToast(err.message || "Audit failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanClick = () => {
    if (!auditData) return;
    const standout = auditData.videos.slice().sort((a, b) => b.viewCount - a.viewCount)[0];
    const title = standout
      ? `A useful follow-up to: ${standout.title}`
      : `Next audience video for ${auditData.channel.title}`;
    const desc = standout
      ? `Answer the next logical question for viewers who watched "${standout.title}". Add fresh practical value rather than repeating the same video.`
      : `Create a video solving a specific problem based on channel audit findings.`;
    onPlanFollowup(title, desc);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP AUDIT INPUT CARD (OUTCROWD MODULAR CARD)                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <ScanEye className="w-3.5 h-3.5" />
              <span>Channel Forensics & Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Audit Channel Baseline
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Inspect historical upload metrics against median baselines, spot outlier topics, and uncover audience retention opportunities.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleAuditSubmit}
          className="bg-[#F9FAFB] border border-[#E2E5EB] focus-within:border-[#3B82F6] rounded-2xl p-2.5 sm:p-3 shadow-xs transition"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 flex items-center gap-2.5 w-full px-2">
              <Sparkles className="w-4 h-4 text-[#3B82F6] shrink-0" />
              <input
                type="text"
                placeholder="Paste channel URL or @handle (e.g., @Fireship, @TraversyMedia)..."
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-300 text-white font-bold text-xs px-6 py-2.5 rounded-full transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? "Running Audit..." : "Run Audit →"}</span>
            </button>
          </div>
        </form>

        {errorNotice && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. AUDIT RESULTS: KPI CARDS & OUTLIERS                                     */}
      {/* ========================================================================= */}
      {auditData && (
        <div className="space-y-6">
          {/* Channel Overview & Action Header */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#E0E7FF] border-2 border-white flex items-center justify-center font-bold text-sm text-[#4F46E5] shadow-xs">
                  {auditData.channel.title.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">
                    {auditData.channel.title}
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    {auditData.channel.handle || "YouTube Channel"} • {auditData.channel.subscribers}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePlanClick}
                className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Create Follow-up Plan →</span>
              </button>
            </div>

            {/* Outcrowd 4-Column Baseline KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 bg-[#F9FAFB] border border-[#E8EAEE] rounded-[20px]">
                <span className="text-[11px] font-bold uppercase text-[#9CA3AF] block">
                  Median Views Baseline
                </span>
                <span className="text-2xl font-black text-[#111827] mt-1 block">
                  {auditData.medianRecentViews.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#2563EB] font-bold mt-0.5 block">
                  {auditData.medianRecentViewsLabel}
                </span>
              </div>

              <div className="p-4 bg-[#F9FAFB] border border-[#E8EAEE] rounded-[20px]">
                <span className="text-[11px] font-bold uppercase text-[#9CA3AF] block">
                  Total Channel Views
                </span>
                <span className="text-2xl font-black text-[#111827] mt-1 block">
                  {auditData.channel.views}
                </span>
                <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                  Cumulative all-time
                </span>
              </div>

              <div className="p-4 bg-[#F9FAFB] border border-[#E8EAEE] rounded-[20px]">
                <span className="text-[11px] font-bold uppercase text-[#9CA3AF] block">
                  Video Catalog Count
                </span>
                <span className="text-2xl font-black text-[#111827] mt-1 block">
                  {auditData.channel.videoCount}
                </span>
                <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                  Public uploads
                </span>
              </div>

              <div className="p-4 bg-[#F9FAFB] border border-[#E8EAEE] rounded-[20px]">
                <span className="text-[11px] font-bold uppercase text-[#9CA3AF] block">
                  Recent Uploads Scanned
                </span>
                <span className="text-2xl font-black text-[#111827] mt-1 block">
                  {auditData.videos.length}
                </span>
                <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                  Latest catalog audit
                </span>
              </div>
            </div>
          </div>

          {/* Standout Outliers Table */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs">
            <h3 className="font-bold text-base text-[#111827] mb-4">
              Recent Video Performance vs Median Baseline
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F0F2F5] text-[#9CA3AF]">
                    <th className="pb-3 font-bold uppercase tracking-wider">Video Title</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">Views</th>
                    <th className="pb-3 font-bold uppercase tracking-wider">vs Baseline</th>
                    <th className="pb-3 font-bold uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5]">
                  {auditData.videos.map((vid) => {
                    const isOutlier = vid.multiplier && vid.multiplier >= 1.5;
                    return (
                      <tr key={vid.id} className="hover:bg-[#F9FAFB] transition">
                        <td className="py-3.5 pr-4 font-semibold text-[#111827] max-w-md truncate">
                          {vid.title}
                        </td>
                        <td className="py-3.5 text-[#4B5563] font-bold">
                          {vid.viewCount.toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isOutlier
                                ? "bg-[#DCFCE7] text-[#16A34A]"
                                : "bg-[#F3F4F6] text-[#6B7280]"
                            }`}
                          >
                            {vid.ratioLabel || "1.0x"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3B82F6] hover:underline font-bold inline-flex items-center gap-1"
                          >
                            <span>Watch</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
  );
};
