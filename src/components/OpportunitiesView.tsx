"use client";

import React from "react";
import { Sparkles, ArrowUpRight, Plus, ExternalLink, CheckSquare } from "lucide-react";
import { IdeaItem } from "@/types";

interface OpportunitiesViewProps {
  topic: string;
  ideas: IdeaItem[];
  onGenerateAngles: () => void;
  onSelectIdeaForBrief: (idea: IdeaItem) => void;
  onSaveIdeaToPlanner: (idea: IdeaItem) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  topic,
  ideas,
  onGenerateAngles,
  onSelectIdeaForBrief,
  onSaveIdeaToPlanner,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="pb-2 border-b border-ink-800">
        <div className="text-xs font-mono text-studio-orange">TOPIC RESEARCH & OPPORTUNITY WORKBENCH</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 mt-1">
          Find the next useful angle.
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 mt-1">
          Move beyond copying popular titles. Spot viewer problems, format patterns, and gaps you could serve better.
        </p>
      </div>

      {/* Opportunity Banner */}
      <div className="p-5 bg-ink-900 border border-ink-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-studio-orange">ACTIVE NICHE</span>
          <h2 className="text-lg font-bold text-ink-50 capitalize">{topic}</h2>
          <p className="text-xs text-ink-400 mt-0.5">
            A mix of proven tutorial patterns and differentiated ways to explain them.
          </p>
        </div>

        <button
          onClick={onGenerateAngles}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-ink-800 hover:bg-ink-700 text-ink-100 border border-ink-600 rounded-lg text-xs font-mono font-bold tracking-wide transition self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-studio-orange" />
          <span>GENERATE NEW ANGLES</span>
        </button>
      </div>

      {/* Layout Grid: Ideas + Sidebar Gap Check */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Idea List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-100">Ideas to investigate</h2>
            <span className="text-xs text-ink-500 font-mono">
              Priority heuristics · not view predictions
            </span>
          </div>

          <div className="space-y-3">
            {ideas.map((idea, idx) => (
              <div
                key={idx}
                className="p-4 bg-ink-900 border border-ink-800 rounded-xl space-y-3 hover:border-ink-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-ink-500 font-bold mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-ink-100">{idea.title}</h3>
                      <p className="text-xs text-ink-300 mt-1">{idea.desc}</p>
                    </div>
                  </div>

                  <div className="p-2 bg-ink-950 border border-ink-800 rounded font-mono text-right flex-shrink-0">
                    <div className="text-xs font-bold text-studio-orange">{idea.score}</div>
                    <div className="text-[9px] text-ink-500">PRIORITY</div>
                  </div>
                </div>

                {idea.hook && (
                  <div className="p-2.5 bg-ink-950/80 border border-ink-800 rounded text-xs text-ink-300 italic">
                    {idea.hook}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {idea.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink-950 text-ink-400 border border-ink-800"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-studio-orange/10 text-studio-orange border border-studio-orange/20">
                    {idea.type}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-800">
                  <button
                    onClick={() => onSaveIdeaToPlanner(idea)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-ink-950 hover:bg-ink-800 text-ink-300 hover:text-ink-100 border border-ink-700 rounded text-xs font-mono transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Save to planner</span>
                  </button>

                  <button
                    onClick={() => onSelectIdeaForBrief(idea)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-studio-orange hover:bg-studio-orange-hover text-white rounded text-xs font-mono font-semibold transition"
                  >
                    <span>Build video brief</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Gap Check Checklist (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl space-y-3">
            <div className="text-[10px] font-mono text-studio-orange">THE GAP CHECK</div>
            <h3 className="text-sm font-bold text-ink-100">Before you record</h3>

            <div className="space-y-2.5 text-xs text-ink-300 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded bg-ink-950 border-ink-700 text-studio-orange focus:ring-0"
                />
                <span>I know exactly who this helps</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded bg-ink-950 border-ink-700 text-studio-orange focus:ring-0"
                />
                <span>I can offer one concrete outcome</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded bg-ink-950 border-ink-700 text-studio-orange focus:ring-0"
                />
                <span>I can improve on existing examples</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded bg-ink-950 border-ink-700 text-studio-orange focus:ring-0"
                />
                <span>I can deliver the title&apos;s promise</span>
              </label>
            </div>

            <div className="text-[11px] text-ink-500 pt-2 border-t border-ink-800 font-mono">
              Aim for a distinct point of view—never a copy of a larger channel.
            </div>
          </div>

          <div className="p-5 bg-ink-900 border border-ink-800 rounded-xl space-y-3">
            <div className="text-[10px] font-mono text-studio-orange">VALIDATE SEARCH DEMAND</div>
            <h3 className="text-sm font-bold text-ink-100">Check autocomplete</h3>
            <p className="text-xs text-ink-400">
              Verify live search phrasing before writing the title. Audience vocabulary changes over time.
            </p>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 bg-ink-950 hover:bg-ink-800 text-ink-200 border border-ink-700 rounded-md text-xs font-mono flex items-center justify-center gap-1.5 transition"
            >
              <span>Open YouTube search</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
