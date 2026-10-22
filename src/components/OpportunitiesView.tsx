"use client";

import React from "react";
import { Sparkles, ArrowUpRight, Plus, ExternalLink, CheckSquare, Library, Lightbulb, Bookmark, CheckCircle2 } from "lucide-react";
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER CARD (OUTCROWD MODULAR CARD)                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Angle Generation & Opportunities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Differentiated Video Angles
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Break away from recycled competitor titles. Surface specific audience problems, retention loops, and packaging angles.
            </p>
          </div>

          <button
            onClick={onGenerateAngles}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Fresh Angles</span>
          </button>
        </div>

        {/* Active Niche Banner */}
        <div className="p-4 bg-[#F9FAFB] border border-[#E8EAEE] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider block font-bold">
              Active Topic Query
            </span>
            <span className="text-sm font-bold text-[#111827] capitalize">
              {topic || "Beginner Python tutorials"}
            </span>
          </div>
          <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full">
            {ideas.length} opportunities ready
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. IDEAS LIST + VERIFICATION CHECKLIST (OUTCROWD 2-COLUMN LAYOUT)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Idea Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {ideas.map((idea, idx) => (
            <div
              key={idx}
              className="p-5 bg-white border border-[#E8EAEE] hover:border-[#3B82F6] rounded-[24px] shadow-xs hover:shadow-md transition space-y-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <span className="w-8 h-8 rounded-full bg-[#F3F4F6] text-[#374151] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#3B82F6] transition">
                      {idea.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                      {idea.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSaveIdeaToPlanner(idea)}
                    className="p-2 rounded-full border border-[#E2E5EB] hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] transition cursor-pointer"
                    title="Save to Planner"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectIdeaForBrief(idea)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111827] hover:bg-[#3B82F6] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <span>Build Brief</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Hook Preview Box */}
              {idea.hook && (
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E8EAEE] text-xs text-[#4B5563] italic">
                  {idea.hook}
                </div>
              )}

              {/* Tags & Score */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F0F2F5] text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {idea.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold bg-[#F3F4F6] text-[#4B5563] px-2.5 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {idea.score && (
                  <span className="text-[11px] font-bold text-[#10B981] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                    Score: {idea.score}/100
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Outcrowd Creative Checklist Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="text-sm font-bold text-[#111827]">
              Angle Differentiation Filter
            </h3>
          </div>

          <p className="text-xs text-[#6B7280] leading-relaxed">
            Before approving an angle into scripting, verify it clears all three creator filters:
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-2xl bg-[#F9FAFB] border border-[#E8EAEE] space-y-1">
              <div className="text-xs font-bold text-[#111827]">1. Specific First Viewer</div>
              <p className="text-[11px] text-[#6B7280]">Who has this pain right now? (Avoid "anyone who wants to learn").</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F9FAFB] border border-[#E8EAEE] space-y-1">
              <div className="text-xs font-bold text-[#111827]">2. High-Payoff Outcome</div>
              <p className="text-[11px] text-[#6B7280]">Can the viewer complete or understand one small thing end-to-end?</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F9FAFB] border border-[#E8EAEE] space-y-1">
              <div className="text-xs font-bold text-[#111827]">3. Thumbnail Clarity</div>
              <p className="text-[11px] text-[#6B7280]">Can the core contrast be expressed in under 4 words or 1 visual?</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
