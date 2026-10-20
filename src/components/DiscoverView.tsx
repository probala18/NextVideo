"use client";

import React, { useState } from "react";
import { Search, Download, Trash2, ExternalLink, Play, ArrowUpRight, Info } from "lucide-react";
import { ChannelItem, VideoItem, WatchlistChannel } from "@/types";
import { AnimatedTabs } from "./AnimatedTabs";

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
    { id: "all", label: "All stages", count: channels.length },
    { id: "emerging", label: "Emerging", count: channels.filter((c) => c.stage === "Emerging").length },
    { id: "growing", label: "Growing", count: channels.filter((c) => c.stage === "Growing").length },
    { id: "established", label: "Established", count: channels.filter((c) => c.stage === "Established").length },
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="pb-2 border-b border-ink-800">
        <div className="text-xs font-mono text-studio-orange">CHANNEL INTELLIGENCE</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 mt-1">
          Find your creator neighbors.
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 mt-1">
          Discover channels covering similar topics, compare public metrics, and inspect their strongest recent videos.
        </p>
      </div>

      {/* Inline Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="p-3 sm:p-4 bg-ink-900 border border-ink-700 rounded-xl flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search a niche or keyword..."
            maxLength={140}
            required
            className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-lg text-xs sm:text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
          />
        </div>

        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-lg text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
        >
          <option value="IN">India (IN)</option>
          <option value="US">United States (US)</option>
          <option value="GB">United Kingdom (GB)</option>
          <option value="GLOBAL">Global</option>
        </select>

        <select
          value={selectedSort}
          onChange={(e) => setSelectedSort(e.target.value)}
          className="px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-lg text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
        >
          <option value="popular">Most viewed</option>
          <option value="recent">Newest first</option>
          <option value="relevance">Relevance</option>
        </select>

        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-lg text-xs font-mono font-bold tracking-wide transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <span>{isSearching ? "SEARCHING…" : "RESEARCH NICHE"}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Filter Tabs using AnimatedTabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnimatedTabs
          tabs={stageTabs}
          activeId={stageFilter}
          onChange={setStageFilter}
          layoutId="stageFilterTabs"
        />
        <div className="text-xs font-mono text-ink-400">
          {filteredChannels.length} channels found
        </div>
      </div>

      {/* Channel Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredChannels.length > 0 ? (
          filteredChannels.map((c) => {
            const isSaved = watchlist.some((w) => String(w.id) === String(c.id));
            return (
              <div
                key={c.id}
                className="p-4 bg-ink-900 border border-ink-800 rounded-xl flex flex-col justify-between hover:border-ink-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-700 text-studio-orange font-mono text-xs flex items-center justify-center font-bold">
                        {c.avatar || c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-ink-100 truncate" title={c.name}>
                          {c.name}
                        </div>
                        <div className="text-[10px] text-ink-500 font-mono truncate">
                          {c.handle || "YouTube channel"}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-ink-950 text-ink-300 border border-ink-800">
                      {c.stage}
                    </span>
                  </div>

                  <p className="text-xs text-ink-300 mt-3 line-clamp-2">{c.desc}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-ink-950 border border-ink-850 rounded text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-ink-500">Subscribers</div>
                      <div className="font-bold text-ink-100">{c.subs}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-ink-500">Public Views</div>
                      <div className="font-bold text-ink-100">{c.views}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-ink-800">
                  <button
                    onClick={() => onSaveChannel(c)}
                    className={`px-3 py-1.5 text-xs rounded-md border font-mono transition ${
                      isSaved
                        ? "bg-studio-emerald/10 border-studio-emerald text-studio-emerald font-semibold"
                        : "bg-ink-950 border-ink-700 text-ink-300 hover:text-ink-100 hover:bg-ink-800"
                    }`}
                  >
                    {isSaved ? "Saved ✓" : "+ Save"}
                  </button>

                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-ink-400 hover:text-studio-orange flex items-center gap-1 transition"
                  >
                    Study channel <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-8 bg-ink-900 border border-ink-800 rounded-xl text-center text-xs text-ink-400 font-mono">
            No channels in this stage for the current search. Try another filter or a broader niche.
          </div>
        )}
      </div>

      {/* Shortlist Panel */}
      <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ink-800">
          <div>
            <div className="text-[10px] font-mono text-studio-orange">YOUR RESEARCH SHORTLIST</div>
            <h3 className="text-sm font-bold text-ink-100">
              Channels to study later ({watchlist.length} saved)
            </h3>
          </div>
          <button
            onClick={onExportWatchlist}
            disabled={watchlist.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-950 hover:bg-ink-800 border border-ink-700 text-ink-200 rounded text-xs font-mono transition disabled:opacity-40"
          >
            <Download className="w-3 h-3 text-studio-orange" />
            <span>Export shortlist (.csv)</span>
          </button>
        </div>

        {watchlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-ink-950 border border-ink-800 rounded-lg flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-ink-800 border border-ink-700 text-studio-orange font-mono text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {item.avatar || "YT"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink-100 truncate">{item.name}</div>
                    <div className="text-[10px] text-ink-400 font-mono">
                      {item.subs} subs · {item.views} views
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-ink-400 hover:text-ink-100 hover:bg-ink-800 rounded transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => onRemoveWatchlist(item.id)}
                    className="p-1.5 text-ink-400 hover:text-studio-crimson hover:bg-ink-800 rounded transition"
                    title="Remove from shortlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-ink-950 border border-ink-850 rounded-lg text-center text-xs text-ink-400 font-mono">
            Save a channel from the directory above to build a focused competitor study list.
          </div>
        )}
      </div>

      {/* Video Research Section */}
      <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl space-y-4">
        <div className="pb-3 border-b border-ink-800">
          <div className="text-[10px] font-mono text-studio-orange">VIDEO RESEARCH</div>
          <h2 className="text-base font-bold text-ink-100">Videos to learn from</h2>
          <p className="text-xs text-ink-400 mt-0.5">
            Compare public views with channel size and video age. High relative reach indicates an interesting hook or topic demand.
          </p>
        </div>

        <div className="space-y-3">
          {videos.map((v, i) => {
            const isStandout = typeof v.viewsPerSubscriber === "number" && v.viewsPerSubscriber >= 1;
            return (
              <div
                key={v.videoId || i}
                className="p-3.5 bg-ink-950 border border-ink-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-ink-700 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded bg-ink-800 border border-ink-700 flex items-center justify-center text-studio-orange font-bold flex-shrink-0">
                    <Play className="w-3.5 h-3.5 fill-studio-orange" />
                  </div>
                  <div className="min-w-0">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs sm:text-sm font-bold text-ink-100 hover:text-studio-orange transition line-clamp-1"
                    >
                      {v.title}
                    </a>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-ink-400 font-mono">
                      <span>{v.channel}</span>
                      <span>•</span>
                      <span>{v.views} views</span>
                      <span>•</span>
                      <span>{v.ageDays !== undefined && v.ageDays !== null ? `${v.ageDays}d old` : v.age}</span>
                      {v.channelSubscribers && (
                        <>
                          <span>•</span>
                          <span>{v.channelSubscribers} subs</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:flex-shrink-0 justify-between sm:justify-end">
                  {v.viewsPerSubscriberLabel && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isStandout
                          ? "bg-studio-emerald/10 border-studio-emerald text-studio-emerald font-semibold"
                          : "bg-ink-900 border-ink-800 text-ink-400"
                      }`}
                    >
                      {v.viewsPerSubscriberLabel}
                    </span>
                  )}
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-studio-orange hover:underline flex items-center gap-1"
                  >
                    Watch video <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric Reading Note */}
      <div className="p-4 bg-ink-900/60 border border-ink-800 rounded-lg flex items-start gap-3 text-xs text-ink-400">
        <Info className="w-4 h-4 text-studio-orange flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-ink-200 block mb-0.5">How to read channel metrics</strong>
          <span>
            Subscriber counts indicate audience scale; public view counts reflect observed activity. A useful
            comparison also evaluates format fit, upload cadence, typical views, and whether an emerging channel had an unusually
            successful video. These public signals do not reveal click-through rate, retention, or traffic sources.
          </span>
        </div>
      </div>
    </div>
  );
};
