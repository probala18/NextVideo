"use client";

import React, { useState } from "react";
import { ScanEye, ArrowUpRight, Play, ExternalLink, Info, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="pb-2 border-b border-ink-800">
        <div className="text-xs font-mono text-studio-orange">EXISTING CREATOR WORKSPACE</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 mt-1">
          Audit your public channel.
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 mt-1">
          Review recent video performance against your own channel baseline, discover standout topics, and convert insights into the next experiment.
        </p>
      </div>

      {/* Audit Input Form */}
      <form
        onSubmit={handleAuditSubmit}
        className="p-3 sm:p-4 bg-ink-900 border border-ink-700 rounded-xl flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="Paste your YouTube channel URL, ID, or @handle (e.g. @mkbhd, @veritasium)"
            maxLength={240}
            required
            className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-lg text-xs sm:text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none transition font-sans"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-lg text-xs font-mono font-bold tracking-wide transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <span>{isLoading ? "AUDITING CHANNEL…" : "AUDIT CHANNEL"}</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </form>

      {/* Public data disclosure notice */}
      <div className="p-3 bg-ink-900/60 border border-ink-800 rounded-lg flex items-start gap-2.5 text-xs text-ink-400">
        <Info className="w-4 h-4 text-studio-orange flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-ink-200">Public-data audit: </strong>
          This analyzes public video and channel metrics only. Private click-through rate, first-30-second retention, traffic sources, and demographics are never accessible to public tools.
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 bg-ink-900 border border-ink-800 rounded-xl text-center space-y-3 font-mono">
          <div className="w-10 h-10 border-2 border-studio-orange border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-ink-100">Fetching channel metadata & recent uploads…</div>
          <div className="text-xs text-ink-400">Analyzing baseline and calculating median performance</div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && errorNotice && (
        <div className="p-6 bg-studio-crimson/10 border border-studio-crimson/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-studio-crimson font-mono text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>AUDIT NOTICE</span>
          </div>
          <p className="text-xs text-ink-200">{errorNotice}</p>
          <div className="text-[11px] text-ink-400">
            Note: Live audits require a configured YOUTUBE_API_KEY in server environment.
          </div>
        </div>
      )}

      {/* Empty State when no audit ran yet */}
      {!isLoading && !auditData && !errorNotice && (
        <div className="p-12 bg-ink-900 border border-ink-800 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-ink-800 border border-ink-700 text-studio-orange flex items-center justify-center mx-auto">
            <ScanEye className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-ink-100">Start with your channel URL or handle.</h2>
          <p className="text-xs text-ink-400 max-w-md mx-auto">
            We will inspect up to 20 recent public uploads, evaluate upload cadence, identify standout videos, and suggest high-yield follow-up experiments.
          </p>
        </div>
      )}

      {/* Audit Results */}
      {!isLoading && auditData && (
        <div className="space-y-6">
          {/* Channel Profile Header */}
          <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-ink-800 border border-ink-700 text-studio-orange font-mono font-bold text-base flex items-center justify-center flex-shrink-0">
                {auditData.channel.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-ink-50">{auditData.channel.title}</h2>
                <p className="text-xs text-ink-400 line-clamp-1">{auditData.channel.description || "Public YouTube channel"}</p>
                <a
                  href={auditData.channel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-studio-orange hover:underline font-mono inline-flex items-center gap-1 mt-0.5"
                >
                  Open channel on YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg text-right font-mono self-stretch sm:self-auto">
              <div className="text-[10px] text-ink-500">SUBSCRIBERS</div>
              <div className="text-lg font-bold text-ink-100">{auditData.channel.subscribers}</div>
            </div>
          </div>

          {/* Audit Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-ink-900 border border-ink-800 rounded-lg font-mono">
              <div className="text-[10px] text-ink-500">TOTAL CHANNEL VIEWS</div>
              <div className="text-xl font-bold text-ink-100 mt-1">{auditData.channel.views}</div>
              <div className="text-[10px] text-ink-400 mt-1">Lifetime public count</div>
            </div>

            <div className="p-4 bg-ink-900 border border-ink-800 rounded-lg font-mono">
              <div className="text-[10px] text-ink-500">UPLOADS ANALYZED</div>
              <div className="text-xl font-bold text-ink-100 mt-1">{auditData.videos.length}</div>
              <div className="text-[10px] text-ink-400 mt-1">Latest public sample</div>
            </div>

            <div className="p-4 bg-ink-900 border border-ink-800 rounded-lg font-mono">
              <div className="text-[10px] text-ink-500">MEDIAN RECENT VIEWS</div>
              <div className="text-xl font-bold text-studio-emerald mt-1">{auditData.medianRecentViewsLabel}</div>
              <div className="text-[10px] text-ink-400 mt-1">Your recent baseline</div>
            </div>

            <div className="p-4 bg-ink-900 border border-ink-800 rounded-lg font-mono">
              <div className="text-[10px] text-ink-500">VIEWS / SUBSCRIBER</div>
              <div className="text-xl font-bold text-studio-blue mt-1">
                {auditData.medianViewsPerSubscriber !== null ? `${auditData.medianViewsPerSubscriber}%` : "—"}
              </div>
              <div className="text-[10px] text-ink-400 mt-1">Public benchmark ratio</div>
            </div>
          </div>

          {/* Bottom Grid: Recent Uploads & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Uploads */}
            <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl space-y-3">
              <div className="pb-3 border-b border-ink-800">
                <div className="text-[10px] font-mono text-studio-orange">RECENT UPLOADS</div>
                <h3 className="text-sm font-bold text-ink-100">Videos to investigate</h3>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {auditData.videos.map((v, i) => (
                  <div
                    key={v.id}
                    className="p-3 bg-ink-950 border border-ink-800 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded bg-ink-800 border border-ink-700 text-ink-300 font-mono text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0">
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-ink-100 hover:text-studio-orange transition truncate block"
                        >
                          {v.title}
                        </a>
                        <div className="text-[10px] text-ink-400 font-mono">
                          {v.publishedAt ? v.publishedAt.slice(0, 10) : "Date n/a"}
                          {v.likes !== null && ` · ${v.likes} likes`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 font-mono">
                      <div className="text-xs font-bold text-ink-100">{v.views}</div>
                      <div className="text-[10px] text-ink-500">views</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Experiments Insights */}
            <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="pb-3 border-b border-ink-800">
                  <div className="text-[10px] font-mono text-studio-orange">NEXT EXPERIMENTS</div>
                  <h3 className="text-sm font-bold text-ink-100">What to test next</h3>
                </div>

                <div className="mt-3 space-y-3">
                  {auditData.insights.map((insight, idx) => (
                    <div key={idx} className="p-3 bg-ink-950 border border-ink-800 rounded-lg text-xs space-y-1">
                      <strong className="text-ink-100 block font-semibold">{insight.title}</strong>
                      <p className="text-ink-300 text-[11px] leading-relaxed">{insight.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePlanClick}
                className="w-full py-2.5 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>PLAN A FOLLOW-UP VIDEO</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
