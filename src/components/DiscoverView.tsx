"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  Trash2,
  ExternalLink,
  Play,
  ArrowUpRight,
  Compass,
  Bookmark,
  Check,
  TrendingUp,
  Globe2,
  SlidersHorizontal,
  Users,
  Sparkles,
  BarChart3
} from "lucide-react";
import { ChannelItem, VideoItem, WatchlistChannel } from "@/types";

interface DiscoverViewProps {
  topic: string;
  region: string;
  sort: string;
  onSearch: (topic: string, region: string, sort: string) => void;
  isSearching: boolean;
  channels: ChannelItem[];
  videos: VideoItem[];
  watchlist: WatchlistChannel[];
  onSaveChannel: (channel: ChannelItem) => void;
  onRemoveWatchlist: (id: string) => void;
  onExportWatchlist: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  topic,
  region,
  sort,
  onSearch,
  isSearching,
  channels,
  videos,
  watchlist,
  onSaveChannel,
  onRemoveWatchlist,
  onExportWatchlist,
}) => {
  const [searchInput, setSearchInput] = useState(topic);
  const [selectedRegion, setSelectedRegion] = useState(region);
  const [selectedSort, setSelectedSort] = useState(sort);
  const [stageFilter, setStageFilter] = useState("all");

  const stageTabs = [
    { id: "all", label: "All Channels", count: channels.length },
    { id: "emerging", label: "Emerging (<10K)", count: channels.filter((c) => c.stage === "Emerging").length },
    { id: "growing", label: "Growing (10K–100K)", count: channels.filter((c) => c.stage === "Growing").length },
    { id: "established", label: "Established (100K+)", count: channels.filter((c) => c.stage === "Established").length },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim(), selectedRegion, selectedSort);
    }
  };

  const filteredChannels =
    stageFilter === "all"
      ? channels
      : channels.filter((c) => (c.stage || "").toLowerCase() === stageFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP DISCOVERY SEARCH CARD (OUTCROWD MODULAR CARD)                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Channel Intelligence & Discovery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Discover Creator Neighbors
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Scan active YouTube channels in your niche, compare subscriber velocity, and isolate breakout video formats.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B7280] bg-[#F3F4F6] px-3 py-1.5 rounded-full">
              {channels.length} channels indexed
            </span>
          </div>
        </div>

        {/* Search Bar matching Outcrowd Input Card */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-[#F9FAFB] border border-[#E2E5EB] focus-within:border-[#3B82F6] rounded-2xl p-2.5 sm:p-3 shadow-xs transition"
        >
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 flex items-center gap-2.5 w-full px-2">
              <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <input
                type="text"
                placeholder="Search topic, competitor handle, or niche query..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-[#F0F2F5] pt-2 md:pt-0">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-white border border-[#E2E5EB] rounded-full px-3 py-1.5 text-xs font-semibold text-[#374151] focus:outline-none"
              >
                <option value="US">Region: US</option>
                <option value="IN">Region: IN</option>
                <option value="GB">Region: GB</option>
                <option value="CA">Region: CA</option>
              </select>

              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-white border border-[#E2E5EB] rounded-full px-3 py-1.5 text-xs font-semibold text-[#374151] focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Uploaded</option>
                <option value="velocity">Velocity Breakouts</option>
              </select>

              <button
                type="submit"
                disabled={isSearching}
                className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-300 text-white font-bold text-xs px-5 py-2 rounded-full transition shadow-xs cursor-pointer shrink-0"
              >
                {isSearching ? "Scanning..." : "Scan Niche →"}
              </button>
            </div>
          </div>
        </form>

        {/* Stage Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-[#F0F2F5]">
          {stageTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                stageFilter === tab.id
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 opacity-75 text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHANNELS LIST GRID (OUTCROWD 3-COLUMN MODULAR CARDS)                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredChannels.map((channel, idx) => {
          const bgColors = ["#E0E7FF", "#FEF3C7", "#DCFCE7", "#FCE7F3", "#E0F2FE"];
          const textColors = ["#4F46E5", "#D97706", "#16A34A", "#DB2777", "#0284C7"];
          const isSaved = watchlist.some((w) => w.channelId === channel.id);

          return (
            <div
              key={channel.id}
              className="bg-white rounded-[26px] border border-[#E8EAEE] p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Stage Tag & Save Action */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      channel.stage === "Established"
                        ? "bg-[#FEF3C7] text-[#D97706]"
                        : channel.stage === "Growing"
                        ? "bg-[#DCFCE7] text-[#16A34A]"
                        : "bg-[#E0E7FF] text-[#4F46E5]"
                    }`}
                  >
                    {channel.stage || "Channel"}
                  </span>

                  <button
                    onClick={() => onSaveChannel(channel)}
                    className={`p-1.5 rounded-full border transition cursor-pointer ${
                      isSaved
                        ? "bg-[#10B981] text-white border-[#10B981]"
                        : "bg-white text-gray-400 hover:text-gray-700 border-[#E2E5EB] hover:bg-gray-50"
                    }`}
                    title={isSaved ? "Saved to watchlist" : "Save to watchlist"}
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Creator Avatar & Name */}
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
                    style={{
                      backgroundColor: bgColors[idx % bgColors.length],
                      color: textColors[idx % textColors.length],
                    }}
                  >
                    {channel.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#111827] truncate group-hover:text-[#3B82F6] transition">
                      {channel.name}
                    </h3>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {channel.category} • {channel.subs}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed mb-4">
                  {channel.desc}
                </p>
              </div>

              {/* Bottom Metrics Pill & Action */}
              <div className="pt-3.5 border-t border-[#F0F2F5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111827]">{channel.views}</span>
                  <span className="text-[10px] text-[#9CA3AF]">total views</span>
                </div>

                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-[#3B82F6] hover:text-[#2563EB] text-xs transition"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. STANDOUT VIDEOS RADAR (OUTCROWD TABLE / CARD LIST)                     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">
              Standout Breakout Videos in Niche
            </h2>
            <p className="text-xs text-[#6B7280]">
              Videos delivering 3x–10x typical channel subscriber ratios
            </p>
          </div>

          <span className="text-xs font-semibold text-[#10B981] bg-[#DCFCE7] px-3 py-1 rounded-full">
            ● High Velocity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div
              key={video.videoId}
              className="bg-[#F9FAFB] border border-[#E8EAEE] rounded-[22px] p-4 flex flex-col justify-between hover:bg-white hover:shadow-xs transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                    {video.format}
                  </span>
                  <span className="text-xs font-bold text-[#111827]">
                    {video.views}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#111827] line-clamp-2 mb-2 group-hover:text-[#3B82F6] transition">
                  {video.title}
                </h4>

                <p className="text-[11px] text-[#6B7280] line-clamp-2">
                  {video.why}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F0F2F5] mt-3 flex items-center justify-between text-[11px]">
                <span className="text-[#9CA3AF] font-medium truncate max-w-[140px]">
                  {video.channel}
                </span>

                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#3B82F6] hover:underline flex items-center gap-0.5"
                >
                  <span>Watch</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
