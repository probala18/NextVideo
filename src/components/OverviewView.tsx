"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Search,
  Sparkles,
  ChevronDown,
  Paperclip,
  FileText,
  Mic,
  Send,
  Compass,
  Video,
  Activity,
  DollarSign,
  Calendar,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  PlaySquare,
  Users,
  Flame,
  Target,
  TrendingUp,
  Layers,
  Zap,
  Bookmark,
  ChevronRight
} from "lucide-react";
import { ChannelItem, VideoItem, WatchlistChannel, PlanItem } from "@/types";

interface OverviewViewProps {
  topic: string;
  region: string;
  sort: string;
  onTopicChange: (t: string) => void;
  onRegionChange: (r: string) => void;
  onSortChange: (s: string) => void;
  onSearch: (topic: string, region: string, sort: string) => void;
  isSearching: boolean;
  channels: ChannelItem[];
  videos: VideoItem[];
  ideasCount: number;
  planCount: number;
  plans?: PlanItem[];
  watchlist: WatchlistChannel[];
  onSaveChannel: (channel: ChannelItem) => void;
  onNavigate: (view: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  topic,
  region,
  sort,
  onTopicChange,
  onRegionChange,
  onSortChange,
  onSearch,
  isSearching,
  channels,
  videos,
  ideasCount,
  planCount,
  plans = [],
  watchlist,
  onSaveChannel,
  onNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [promptInput, setPromptInput] = useState("");
  const [selectedTimelineFilter, setSelectedTimelineFilter] = useState("all");

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, []);

  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptInput.trim()) {
      onTopicChange(promptInput.trim());
      onSearch(promptInput.trim(), region, sort);
      setPromptInput("");
    }
  };

  // Derived planner & pipeline stats
  const allPlans = plans || [];
  const ideaPlans = allPlans.filter((p) => p.status === "Idea");
  const inProgressPlans = allPlans.filter((p) => p.status === "In progress");
  const readyPlans = allPlans.filter((p) => p.status === "Ready to record");
  const publishedPlans = allPlans.filter((p) => p.status === "Published");
  const activePlans = allPlans.filter((p) => p.status !== "Published");

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP DUAL COMMAND WIDGET: NICHE INTELLIGENCE & STUDIO PIPELINE HUB       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Niche Intelligence & Video Opportunity Engine (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Market Intelligence & Outliers</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
                  Video Strategy & Niche Opportunity Matrix
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Real-time viewer demand signals, retention benchmarks, and outlier patterns for{" "}
                  <span className="font-semibold text-[#111827]">
                    &ldquo;{topic || "creator landscape"}&rdquo;
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 bg-[#F3F4F6] text-[#374151] rounded-full text-[11px] font-semibold border border-[#E5E7EB]">
                  Region: {region}
                </span>
                <span className="px-2.5 py-1 bg-[#F3F4F6] text-[#374151] rounded-full text-[11px] font-semibold border border-[#E5E7EB] capitalize">
                  {sort}
                </span>
              </div>
            </div>

            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-1">
                <div className="flex items-center justify-between text-[#6B7280]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Outlier Velocity</span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <div className="text-base sm:text-lg font-black text-[#111827]">3.8x</div>
                <p className="text-[10px] text-[#10B981] font-semibold flex items-center gap-0.5">
                  <span>● Above baseline</span>
                </p>
              </div>

              <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-1">
                <div className="flex items-center justify-between text-[#6B7280]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Search Demand</span>
                  <Target className="w-3.5 h-3.5 text-[#3B82F6]" />
                </div>
                <div className="text-base sm:text-lg font-black text-[#111827]">94/100</div>
                <p className="text-[10px] text-[#3B82F6] font-semibold">
                  <span>High organic intent</span>
                </p>
              </div>

              <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-1">
                <div className="flex items-center justify-between text-[#6B7280]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Retention Sweetspot</span>
                  <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                </div>
                <div className="text-base sm:text-lg font-black text-[#111827]">6–10m</div>
                <p className="text-[10px] text-[#8B5CF6] font-semibold">
                  <span>68% target @ 0:30</span>
                </p>
              </div>

              <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-1">
                <div className="flex items-center justify-between text-[#6B7280]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Est. RPM Band</span>
                  <DollarSign className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
                <div className="text-base sm:text-lg font-black text-[#111827]">$5.40–$11</div>
                <p className="text-[10px] text-[#F59E0B] font-semibold">
                  <span>Commercial value</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Launcher Bar */}
          <div className="pt-3 border-t border-[#F0F2F5] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#6B7280]">Action Launchers:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate("strategy")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>Build Video Strategy →</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("production")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#E2E5EB] rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Video className="w-3 h-3 text-[#3B82F6]" />
                <span>Production Studio</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("opportunities")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#E2E5EB] rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                <span>Video Angles ({ideasCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Studio Production Pipeline Funnel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Studio Production Pipeline
                </h3>
                <p className="text-xs text-[#6B7280]">Active content velocity and workflow funnel</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("planner")}
                className="flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] transition cursor-pointer"
              >
                <span>Planner ({allPlans.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4-Stage Kanban Mini-Counters */}
            <div className="grid grid-cols-4 gap-2 text-center mb-4">
              <div
                onClick={() => onNavigate("planner")}
                className="p-2.5 rounded-2xl bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] border border-[#FDE68A] transition cursor-pointer"
              >
                <span className="text-[10px] font-bold text-[#92400E] uppercase block">Ideas</span>
                <span className="text-base font-black text-[#78350F]">{ideaPlans.length}</span>
              </div>

              <div
                onClick={() => onNavigate("planner")}
                className="p-2.5 rounded-2xl bg-[#F3E8FF]/60 hover:bg-[#F3E8FF] border border-[#E9D5FF] transition cursor-pointer"
              >
                <span className="text-[10px] font-bold text-[#7E22CE] uppercase block">Scripting</span>
                <span className="text-base font-black text-[#6B21A8]">{inProgressPlans.length}</span>
              </div>

              <div
                onClick={() => onNavigate("planner")}
                className="p-2.5 rounded-2xl bg-[#EFF6FF]/60 hover:bg-[#EFF6FF] border border-[#DBEAFE] transition cursor-pointer"
              >
                <span className="text-[10px] font-bold text-[#1D4ED8] uppercase block">Ready</span>
                <span className="text-base font-black text-[#1E40AF]">{readyPlans.length}</span>
              </div>

              <div
                onClick={() => onNavigate("planner")}
                className="p-2.5 rounded-2xl bg-[#DCFCE7]/60 hover:bg-[#DCFCE7] border border-[#BBF7D0] transition cursor-pointer"
              >
                <span className="text-[10px] font-bold text-[#15803D] uppercase block">Live</span>
                <span className="text-base font-black text-[#166534]">{publishedPlans.length}</span>
              </div>
            </div>

            {/* Active Queue Preview */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                Next In Production
              </span>

              {activePlans.length > 0 ? (
                <div className="space-y-2">
                  {activePlans.slice(0, 2).map((plan) => {
                    const statusColor =
                      plan.status === "Ready to record"
                        ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]"
                        : plan.status === "In progress"
                        ? "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]"
                        : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
                    return (
                      <div
                        key={plan.id}
                        onClick={() => onNavigate("planner")}
                        className="p-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] rounded-2xl border border-[#E8EAEE] transition cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#111827] truncate">
                            {plan.title}
                          </h4>
                          <p className="text-[10px] text-[#6B7280] truncate mt-0.5">
                            {plan.note ? plan.note.split("\n")[0] : `Created ${plan.created}`}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${statusColor}`}
                        >
                          {plan.status === "In progress" ? "Scripting" : plan.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-dashed border-[#D1D5DB] text-center space-y-1.5">
                  <p className="text-xs font-bold text-[#374151]">No videos queued yet</p>
                  <p className="text-[10px] text-[#6B7280]">
                    Transfer a brief from Video Strategy to start production tracking.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("strategy")}
                    className="text-[11px] text-[#3B82F6] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Create Video Strategy</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Progress Bar */}
          <div className="pt-2 border-t border-[#F0F2F5] flex items-center justify-between text-xs text-[#6B7280]">
            <span className="text-[11px] font-medium">Pipeline Velocity:</span>
            <span className="text-[11px] font-bold text-[#111827]">
              {allPlans.length} videos tracked · {publishedPlans.length} published
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BOTTOM 3-COLUMN MODULAR ROW (EXACT OUTCROWD CARDS LAYOUT)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Future Events & Milestones (Col Span 4) */}
        <div className="lg:col-span-4 bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">Upcoming Milestones</h3>
            <button
              onClick={() => onNavigate("planner")}
              className="flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] cursor-pointer"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Yellow Highlight Card (Outcrowd primary feature event) */}
          <div className="bg-[#FEF3C7] rounded-[22px] p-4 text-[#92400E] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#78350F]">
                Next Video Release
              </span>
              <span className="text-[10px] font-bold bg-[#FDE68A] px-2 py-0.5 rounded-full">
                ● in 2 days
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#78350F]">
                Python Automation Project
              </h4>
              <p className="text-xs text-[#92400E] opacity-90 line-clamp-1">
                20-minute student tool with step-by-step breakdown
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#78350F]">
              <span className="flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                14:00 - 15:00
              </span>
              <span className="flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-full">
                <Calendar className="w-3 h-3" />
                Dec, 12
              </span>
            </div>
          </div>

          {/* Secondary Event Cards */}
          <div className="space-y-2.5">
            <div
              onClick={() => onNavigate("diagnosis")}
              className="p-3.5 rounded-[20px] bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E8EAEE] transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827]">
                  Hook Clinic: Common Mistakes
                </h4>
                <span className="text-[10px] font-bold text-[#4B5563]">12+ videos</span>
              </div>
              <p className="text-[11px] text-[#6B7280] line-clamp-1">
                Friction analysis on opening 30 seconds
              </p>
              <div className="flex items-center gap-2 text-[10px] text-[#4B5563]">
                <span className="bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                  18:00 - 19:30
                </span>
                <span>Dec, 15</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate("revenue")}
              className="p-3.5 rounded-[20px] bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E8EAEE] transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827]">
                  Revenue Forecast & Rate Sheet
                </h4>
                <span className="text-[10px] font-bold text-[#10B981]">+18% MoM</span>
              </div>
              <p className="text-[11px] text-[#6B7280] line-clamp-1">
                AdSense RPM adjustment and brand integration deals
              </p>
              <div className="flex items-center gap-2 text-[10px] text-[#4B5563]">
                <span className="bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                  Quarterly Review
                </span>
                <span>Dec, 20</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Monitored Channels / Onboarding (Col Span 4) */}
        <div className="lg:col-span-4 bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">Monitored Channels</h3>
            <button
              onClick={() => onNavigate("discover")}
              className="flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] cursor-pointer"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2x2 Grid of Channels (Outcrowd Team / Onboarding cards) */}
          <div className="grid grid-cols-2 gap-3">
            {channels.slice(0, 4).map((ch, idx) => {
              const bgColors = ["#E0E7FF", "#FEF3C7", "#DCFCE7", "#FCE7F3"];
              const textColors = ["#4F46E5", "#D97706", "#16A34A", "#DB2777"];
              return (
                <div
                  key={ch.id}
                  onClick={() => onNavigate("discover")}
                  className="bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E8EAEE] rounded-[22px] p-3.5 flex flex-col items-center text-center justify-between transition cursor-pointer"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-2"
                    style={{
                      backgroundColor: bgColors[idx % bgColors.length],
                      color: textColors[idx % textColors.length],
                    }}
                  >
                    {ch.avatar}
                  </div>

                  <div className="min-w-0 w-full mb-3">
                    <h4 className="text-xs font-bold text-[#111827] truncate">
                      {ch.name}
                    </h4>
                    <p className="text-[10px] text-[#6B7280] truncate">{ch.category}</p>
                  </div>

                  <div className="w-full bg-white border border-[#E2E5EB] rounded-full py-1 px-2 text-[9px] font-bold text-[#4B5563] flex items-center justify-center gap-1">
                    <PlaySquare className="w-3 h-3 text-[#3B82F6]" />
                    <span>{ch.subs}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Audit Direct Link */}
          <button
            onClick={() => onNavigate("audit")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-xs font-bold text-[#374151] transition cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Launch Channel Baseline Audit →</span>
          </button>
        </div>

        {/* Column 3: AI Assistant & Quick Actions Glass Widget (Col Span 4) */}
        <div className="lg:col-span-4 bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs flex flex-col justify-between min-h-[380px]">
          <div>
            {/* 3D Glass Orb Graphic */}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#93C5FD] shadow-lg shadow-[#3B82F6]/30 flex items-center justify-center relative">
                <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md border border-white/50" />
                <div className="absolute top-2 right-2 w-3 h-3 bg-white/70 rounded-full blur-xs" />
              </div>
            </div>

            {/* Outcrowd Headline */}
            <div className="text-center mb-5">
              <h3 className="text-base font-bold text-[#111827]">
                Welcome, Creator
              </h3>
              <p className="text-xs text-[#6B7280]">
                What can I help with today?
              </p>
            </div>

            {/* Quick Action Pill Buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              <button
                onClick={() => onNavigate("strategy")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-xs font-medium text-[#374151] transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                <span>Create brief</span>
              </button>

              <button
                onClick={() => onNavigate("revenue")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-xs font-medium text-[#374151] transition cursor-pointer"
              >
                <DollarSign className="w-3 h-3 text-[#10B981]" />
                <span>Get reports</span>
              </button>

              <button
                onClick={() => onNavigate("audit")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-xs font-medium text-[#374151] transition cursor-pointer"
              >
                <Users className="w-3 h-3 text-[#F59E0B]" />
                <span>Manage channels</span>
              </button>
            </div>
          </div>

          {/* Interactive Assistant Input Bar */}
          <form
            onSubmit={handleAssistantSubmit}
            className="bg-[#F9FAFB] border border-[#E2E5EB] rounded-2xl p-2.5 space-y-2"
          >
            <input
              type="text"
              placeholder="Ask me anything..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full bg-transparent text-xs text-[#111827] placeholder:text-[#9CA3AF] px-1 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-1 border-t border-[#F0F2F5] text-[#6B7280]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="Attach research files"
                  className="p-1 hover:text-[#111827] rounded transition cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("production")}
                  className="p-1 hover:text-[#111827] rounded text-[11px] font-semibold flex items-center gap-0.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Create</span>
                </button>
                <button
                  type="button"
                  title="Voice input"
                  className="p-1 hover:text-[#111827] rounded transition cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#9CA3AF]">
                  {promptInput.length}/300
                </span>
                <button
                  type="submit"
                  disabled={!promptInput.trim()}
                  className="w-6 h-6 rounded-full bg-[#3B82F6] disabled:bg-gray-200 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
