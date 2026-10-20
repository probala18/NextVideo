"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  Search,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Video,
  Sparkles,
  BookmarkCheck,
  Play,
  Info,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { ChannelItem, VideoItem, WatchlistChannel } from "@/types";
import { FilmstripScrubber } from "./FilmstripScrubber";

interface OverviewViewProps {
  topic: string;
  region: string;
  onTopicChange: (t: string) => void;
  onRegionChange: (r: string) => void;
  onSearch: (topic: string, region: string) => void;
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
  onTopicChange,
  onRegionChange,
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
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, [channels, videos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onSearch(topic.trim(), region);
  };

  const quickTopics = [
    "AI tools for students",
    "beginner web development",
    "personal finance basics",
    "fitness for beginners",
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-ink-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-studio-orange mb-1">
            <span className="w-2 h-2 rounded-full bg-studio-orange" />
            CREATOR INTELLIGENCE DESK
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 tracking-tight leading-tight">
            Make your next video <br />
            <span className="text-ink-400 font-normal">a more informed decision.</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-300 max-w-xl">
            Find your space. Learn from proven video formats. Build a production plan that serves a real audience.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ink-900 border border-ink-800 rounded text-xs font-mono text-ink-400 self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-studio-emerald animate-pulse" />
          <span>STUDIO DESK</span>
          <span className="text-ink-700">/</span>
          <span>RESEARCH MODE</span>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="p-4 sm:p-5 bg-ink-900 border border-ink-700 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono text-ink-300">
          <Search className="w-4 h-4 text-studio-orange" />
          <span>WHAT ARE YOU PLANNING TO CREATE?</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="e.g. AI tools for students, beginner Python tutorials, productivity systems…"
              maxLength={140}
              required
              className="w-full pl-3 pr-4 py-2.5 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-lg text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none transition font-sans"
            />
          </div>

          <select
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className="px-3 py-2.5 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-lg text-xs font-mono text-ink-200 focus:outline-none transition cursor-pointer"
          >
            <option value="IN">India (IN)</option>
            <option value="US">United States (US)</option>
            <option value="GB">United Kingdom (GB)</option>
            <option value="CA">Canada (CA)</option>
            <option value="AU">Australia (AU)</option>
            <option value="GLOBAL">Global / All</option>
          </select>

          <button
            type="submit"
            disabled={isSearching}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-lg text-xs font-bold font-mono tracking-wide shadow-sm transition disabled:opacity-50"
          >
            <span>{isSearching ? "RESEARCHING…" : "RESEARCH NICHE"}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Topics */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
          <span className="text-ink-500 text-[11px]">TRY A NICHE:</span>
          {quickTopics.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onTopicChange(item);
                onSearch(item, region);
              }}
              className="px-2.5 py-1 bg-ink-950 hover:bg-ink-800 border border-ink-800 text-ink-300 hover:text-ink-100 rounded text-xs transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metric Grid - 21st inspired Advanced Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono text-ink-400">RESEARCH SNAPSHOT</div>
          <button
            onClick={() => onSearch(topic, region)}
            disabled={isSearching}
            className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-studio-orange transition font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />
            <span>Refresh research</span>
          </button>
        </div>

        <div ref={cardsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1 */}
          <div className="p-4 bg-ink-900 border border-ink-800 rounded-lg">
            <div className="flex items-center justify-between text-xs text-ink-400 font-mono">
              <span>Relevant channels</span>
              <span className="w-2 h-2 rounded-full bg-studio-orange" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-ink-50 font-mono">
              {channels.length}
            </div>
            <div className="mt-2 text-[11px] text-ink-400">Channels to study in this niche</div>
          </div>

          {/* Card 2 */}
          <div className="p-4 bg-ink-900 border border-ink-800 rounded-lg">
            <div className="flex items-center justify-between text-xs text-ink-400 font-mono">
              <span>Videos scanned</span>
              <span className="w-2 h-2 rounded-full bg-studio-blue" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-ink-50 font-mono">
              {videos.length}
            </div>
            <div className="mt-2 text-[11px] text-ink-400">Observed examples, not predictions</div>
          </div>

          {/* Card 3 */}
          <div className="p-4 bg-ink-900 border border-ink-800 rounded-lg">
            <div className="flex items-center justify-between text-xs text-ink-400 font-mono">
              <span>Angles surfaced</span>
              <span className="w-2 h-2 rounded-full bg-studio-emerald" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-ink-50 font-mono">
              {ideasCount}
            </div>
            <div className="mt-2 text-[11px] text-ink-400">Opportunities to validate</div>
          </div>

          {/* Card 4 */}
          <div className="p-4 bg-ink-900 border border-ink-800 rounded-lg">
            <div className="flex items-center justify-between text-xs text-ink-400 font-mono">
              <span>Plan readiness</span>
              <span className="w-2 h-2 rounded-full bg-studio-orange" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-ink-50 font-mono">
              {planCount} <span className="text-xs font-normal text-ink-400">saved</span>
            </div>
            <div className="mt-2 text-[11px] text-ink-400">In your content pipeline</div>
          </div>
        </div>
      </div>

      {/* Filmstrip Scrubber preview for studio feeling */}
      <FilmstripScrubber />

      {/* Radar & Playbook Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Niche Radar (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-ink-900 border border-ink-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ink-800">
            <div>
              <div className="text-[10px] font-mono text-studio-orange">NICHE RADAR</div>
              <h3 className="text-sm font-bold text-ink-100">
                What is getting attention in {topic}
              </h3>
            </div>
            <button
              onClick={() => onNavigate("opportunities")}
              className="text-xs text-studio-orange hover:underline flex items-center gap-1 font-mono"
            >
              Explore ideas <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {videos.slice(0, 3).map((v, i) => (
              <div
                key={v.videoId || i}
                className="flex items-start gap-3 p-3 bg-ink-950 border border-ink-800/80 rounded-lg hover:border-ink-700 transition"
              >
                <div className="w-10 h-10 rounded bg-ink-800 border border-ink-700 flex items-center justify-center text-studio-orange font-bold flex-shrink-0">
                  <Play className="w-4 h-4 fill-studio-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-ink-100 hover:text-studio-orange transition line-clamp-1 block"
                  >
                    {v.title}
                  </a>
                  <p className="text-[11px] text-ink-400 mt-0.5">
                    {v.channel} · {v.format || v.age || "Public video"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 font-mono">
                  <div className="text-xs font-bold text-ink-100">{v.views}</div>
                  <div className="text-[10px] text-ink-500">public views</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator Playbook (1 col) */}
        <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-studio-orange">CREATOR PLAYBOOK</div>
            <h3 className="text-sm font-bold text-ink-100 mt-0.5">
              Good creators ask better questions.
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex gap-2.5">
                <span className="font-mono text-studio-orange font-bold">01</span>
                <div>
                  <strong className="text-ink-200 block font-semibold">Earn the click honestly</strong>
                  <p className="text-ink-400 text-[11px] mt-0.5">
                    Make the title and thumbnail specific and true to what you deliver.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="font-mono text-studio-emerald font-bold">02</span>
                <div>
                  <strong className="text-ink-200 block font-semibold">Deliver value early</strong>
                  <p className="text-ink-400 text-[11px] mt-0.5">
                    Open with the problem and payoff. Skip greetings and logos.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="font-mono text-studio-blue font-bold">03</span>
                <div>
                  <strong className="text-ink-200 block font-semibold">Study audience questions</strong>
                  <p className="text-ink-400 text-[11px] mt-0.5">
                    Use comments and retention drops to choose the next tutorial.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("strategy")}
            className="w-full mt-4 py-2 bg-ink-800 hover:bg-ink-700 text-ink-100 border border-ink-700 rounded-md text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition"
          >
            <span>BUILD A VIDEO STRATEGY</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Channels Worth Studying Preview */}
      <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ink-800">
          <div>
            <div className="text-[10px] font-mono text-studio-orange">CHANNELS WORTH STUDYING</div>
            <h3 className="text-sm font-bold text-ink-100">Learn from your neighbors</h3>
            <p className="text-xs text-ink-400">
              Relevant channels can teach you formats and audience expectations. Subscriber count alone does not tell the whole story.
            </p>
          </div>
          <button
            onClick={() => onNavigate("discover")}
            className="text-xs text-studio-orange hover:underline font-mono"
          >
            View all channels ↗
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {channels.slice(0, 3).map((c) => {
            const isSaved = watchlist.some((w) => String(w.id) === String(c.id));
            return (
              <div
                key={c.id}
                className="p-4 bg-ink-950 border border-ink-800 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-ink-800 border border-ink-700 text-studio-orange font-mono text-xs flex items-center justify-center font-bold">
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
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-ink-800 text-ink-300 border border-ink-700">
                      {c.stage}
                    </span>
                  </div>

                  <p className="text-xs text-ink-400 mt-2.5 line-clamp-2">{c.desc}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-ink-900 border border-ink-800 rounded text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-ink-500">Subscribers</div>
                      <div className="font-bold text-ink-200">{c.subs}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-ink-500">Views</div>
                      <div className="font-bold text-ink-200">{c.views}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-ink-800">
                  <button
                    onClick={() => onSaveChannel(c)}
                    className={`px-2.5 py-1 text-xs rounded border transition font-mono ${
                      isSaved
                        ? "bg-studio-emerald/10 border-studio-emerald text-studio-emerald font-semibold"
                        : "bg-ink-900 border-ink-700 text-ink-300 hover:text-ink-100 hover:bg-ink-800"
                    }`}
                  >
                    {isSaved ? "Saved ✓" : "+ Save"}
                  </button>

                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-ink-400 hover:text-studio-orange flex items-center gap-1"
                  >
                    Study channel <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Honest Platform Disclaimer */}
      <div className="p-3 bg-ink-900/60 border border-ink-800 rounded-lg flex items-start gap-2.5 text-xs text-ink-400">
        <Info className="w-4 h-4 text-studio-orange flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <span>
            CreatorLens does not claim access to YouTube&apos;s private recommendation algorithms. Public channel
            statistics and video patterns are observational research signals—never predictions or guarantees of future views.
          </span>
          <a
            href="https://support.google.com/youtube/answer/16533387"
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-studio-orange hover:underline font-mono inline-flex items-center gap-1"
          >
            How recommendations work <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
