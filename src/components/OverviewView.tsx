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
  Users
} from "lucide-react";
import { ChannelItem, VideoItem, WatchlistChannel } from "@/types";

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

  // Timeline Days (Mon 1 .. Sun 14) matching Outcrowd Planned Absences widget
  const timelineDays = [
    { day: "Mon", date: 1 },
    { day: "Tue", date: 2 },
    { day: "Wed", date: 3 },
    { day: "Thu", date: 4 },
    { day: "Fri", date: 5 },
    { day: "Sat", date: 6 },
    { day: "Sun", date: 7 },
    { day: "Mon", date: 8 },
    { day: "Tue", date: 9, isCurrent: true },
    { day: "Wed", date: 10 },
    { day: "Thu", date: 11 },
    { day: "Fri", date: 12 },
    { day: "Sat", date: 13 },
    { day: "Sun", date: 14 },
    { day: "Mon", date: 15 },
    { day: "Tue", date: 16 },
  ];

  // Pipeline release items mapped across timeline
  const pipelineRows = [
    {
      id: "row-1",
      creator: "Ethan Parker",
      role: "Python Studio",
      avatar: "EP",
      avatarBg: "#E0E7FF",
      avatarColor: "#4F46E5",
      spanStart: 12,
      spanEnd: 15,
      title: "Automate Student Tasks",
      type: "published",
      typeLabel: "● Published",
      pillClass: "bg-[#10B981] text-white",
    },
    {
      id: "row-2",
      creator: "Liam Carter",
      role: "Learn Studio",
      avatar: "LC",
      avatarBg: "#FEF3C7",
      avatarColor: "#D97706",
      spanStart: 3,
      spanEnd: 6,
      title: "Beginner Errors Fix",
      type: "scripting",
      typeLabel: "In Scripting",
      pillClass: "bg-[#8B5CF6] text-white",
    },
    {
      id: "row-3",
      creator: "Noah Mitchell",
      role: "Cloud Architect",
      avatar: "NM",
      avatarBg: "#E0F2FE",
      avatarColor: "#0284C7",
      spanStart: 7,
      spanEnd: 10,
      title: "Lists vs Dictionaries",
      type: "clinic",
      typeLabel: "Hook Clinic • Pending",
      pillClass: "bg-[#60A5FA] text-white",
    },
    {
      id: "row-4",
      creator: "Ava Thompson",
      role: "Product Lab",
      avatar: "AT",
      avatarBg: "#DCFCE7",
      avatarColor: "#16A34A",
      spanStart: 2,
      spanEnd: 5,
      title: "20-Min Build Pack",
      type: "published",
      typeLabel: "● Live Shoot",
      pillClass: "bg-[#10B981] text-white",
    },
    {
      id: "row-5",
      creator: "Mia Robinson",
      role: "QA Insights",
      avatar: "MR",
      avatarBg: "#FCE7F3",
      avatarColor: "#DB2777",
      spanStart: 13,
      spanEnd: 16,
      title: "Thumbnail A/B Test",
      type: "editing",
      typeLabel: "In Editing",
      pillClass: "bg-[#8B5CF6] text-white",
    },
  ];

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP WIDE WIDGET: PRODUCTION & RELEASE TIMELINE (OUTCROWD STYLE)         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs">
        {/* Widget Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              Production & Release Timeline
            </h2>
            <p className="text-xs text-[#6B7280]">
              Monitored creator channels and queued video shoot schedules
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#374151]">
              <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>December, 2026</span>
            </div>

            <button
              onClick={() => onNavigate("planner")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-xs font-semibold text-[#374151] transition cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Filter</span>
            </button>

            <button
              onClick={() => onNavigate("planner")}
              className="flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] px-3 py-1.5 rounded-full hover:bg-[#EFF6FF] transition cursor-pointer"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline Grid Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Days Header */}
            <div className="grid grid-cols-12 gap-2 border-b border-[#F0F2F5] pb-3 mb-3 text-center">
              <div className="col-span-3 text-left text-xs font-bold uppercase tracking-wider text-[#9CA3AF] px-2">
                Creator / Project
              </div>
              <div className="col-span-9 grid grid-cols-16 gap-1 text-[11px] text-[#6B7280] font-semibold">
                {timelineDays.map((d, i) => (
                  <div
                    key={i}
                    className={`py-1 rounded-lg flex flex-col items-center justify-center ${
                      d.isCurrent
                        ? "bg-[#3B82F6] text-white font-bold shadow-xs"
                        : "hover:bg-[#F3F4F6]"
                    }`}
                  >
                    <span className="text-[9px] uppercase opacity-75">{d.day}</span>
                    <span className="text-xs">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Rows */}
            <div className="space-y-3">
              {pipelineRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-12 gap-2 items-center hover:bg-[#F9FAFB] p-2 rounded-2xl transition"
                >
                  {/* Creator Info */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                      style={{
                        backgroundColor: row.avatarBg,
                        color: row.avatarColor,
                      }}
                    >
                      {row.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#111827] truncate">
                        {row.creator}
                      </div>
                      <div className="text-[10px] text-[#6B7280] truncate">
                        {row.role}
                      </div>
                    </div>
                  </div>

                  {/* Visual Span across 16 grid columns */}
                  <div className="col-span-9 relative h-10 flex items-center bg-[#F9FAFB] rounded-xl px-2">
                    {/* Subtle vertical tick lines */}
                    <div className="absolute inset-0 grid grid-cols-16 pointer-events-none opacity-40">
                      {Array.from({ length: 16 }).map((_, idx) => (
                        <div key={idx} className="border-r border-dashed border-[#E5E7EB]" />
                      ))}
                    </div>

                    {/* Milestone pill block */}
                    <div
                      onClick={() => onNavigate("production")}
                      className={`relative z-10 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition truncate ${row.pillClass}`}
                      style={{
                        marginLeft: `${((row.spanStart - 1) / 16) * 100}%`,
                        width: `${((row.spanEnd - row.spanStart + 1) / 16) * 100}%`,
                      }}
                    >
                      <span className="truncate">{row.title}</span>
                      <span className="opacity-80 text-[9px] hidden sm:inline">
                        ({row.typeLabel})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
