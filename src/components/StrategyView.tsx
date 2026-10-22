"use client";

import React, { useState } from "react";
import { FileText, ArrowUpRight, Copy, Check, Video, Plus, Sparkles, Send, Lightbulb, Bookmark, CheckCircle2 } from "lucide-react";
import { VideoBrief } from "@/types";

interface StrategyViewProps {
  initialTopic?: string;
  onContinueToProduction: (brief: VideoBrief) => void;
  onSaveToPlanner: (title: string, note: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const StrategyView: React.FC<StrategyViewProps> = ({
  initialTopic = "Python projects for absolute beginners",
  onContinueToProduction,
  onSaveToPlanner,
  onToast,
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [audience, setAudience] = useState("Students who have never built a project");
  const [goal, setGoal] = useState("Build and understand their first small Python project without getting stuck.");
  const [format, setFormat] = useState("Tutorial (6–12 min)");
  const [stage, setStage] = useState("New channel");
  const [differentiator, setDifferentiator] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [brief, setBrief] = useState<VideoBrief | null>(null);

  const localFallbackBrief = (): VideoBrief => {
    const isShort = format.includes("Short");
    const outline = isShort
      ? [
          "Show the outcome or problem in the first 2 seconds",
          "Demonstrate one key step without setup filler",
          "End with the completed result and one natural next action",
        ]
      : [
          "Open with the specific problem and show the outcome",
          "Explain only the minimum concepts needed to begin",
          "Demonstrate the process in clear, numbered steps",
          "Show a common mistake and how to fix it",
          "Recap the result and give the viewer one practical next challenge",
        ];

    const promise = goal.trim() || `Help ${audience} understand ${topic} and complete one practical next step.`;

    return {
      topic: topic.trim(),
      audience,
      format,
      promise,
      titles: [
        `${topic.trim()}: a beginner-friendly step-by-step guide`,
        `Learn ${topic.trim()} by building one real example`,
        `Before you try ${topic.trim()}, understand these essentials`,
      ],
      hook: `“If you are ${audience.toLowerCase()}, this video will help you ${promise.charAt(0).toLowerCase() + promise.slice(1)} I’ll show the result first, then break the process into steps you can follow.”`,
      outline,
      thumbnail:
        "Show the finished result or the core problem clearly. Use one focal subject, high contrast, and at most a few readable words. Avoid implying results the video does not deliver." +
        (differentiator ? ` Angle: ${differentiator}` : ""),
      measure:
        "After enough impressions, compare click-through rate with your channel's usual results and traffic sources. Then inspect the first 30 seconds and audience-retention graph. Use viewer feedback to decide the next experiment.",
      note: differentiator,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      onToast("Enter a video topic first.", "info");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          audience: audience.trim(),
          goal: goal.trim(),
          format,
          stage,
          differentiator: differentiator.trim(),
        }),
      });

      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      if (data.brief) {
        setBrief(data.brief);
        onToast(data.source === "ai" ? "AI video brief generated." : "Strategy template brief ready.", "success");
      } else {
        setBrief(localFallbackBrief());
        onToast("Strategy template brief ready.", "success");
      }
    } catch {
      setBrief(localFallbackBrief());
      onToast("Strategy template brief ready.", "success");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Production Brief Generator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Video Strategy & Brief Pack
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Turn a raw concept into a structured blueprint with clear audience promises, calibrated hooks, and numbered outline cues.
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Brief Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4"
        >
          <div className="text-sm font-bold text-[#111827] border-b border-[#F0F2F5] pb-3">
            Strategy Parameters
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Topic or Primary Focus</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Build an AI Agent in 15 Minutes"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Target Audience Persona</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Self-taught developers seeking practical projects"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Core Promise / Viewer Outcome</label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What one thing can they do by the end?"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none"
              >
                <option value="Tutorial (6–12 min)">Tutorial (6–12 min)</option>
                <option value="Short video (&lt;60 sec)">Short (&lt;60 sec)</option>
                <option value="Deep dive (15–25 min)">Deep dive (15–25 min)</option>
                <option value="Concept comparison">Concept comparison</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Channel Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none"
              >
                <option value="New channel">New (&lt;1K subs)</option>
                <option value="Growing">Growing (1K–50K)</option>
                <option value="Established">Established (50K+)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Unique Angle / Differentiator</label>
            <input
              type="text"
              value={differentiator}
              onChange={(e) => setDifferentiator(e.target.value)}
              placeholder="e.g. No-BS code walkthrough with live debugging"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-300 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? "Synthesizing Brief..." : "Generate Production Brief →"}</span>
          </button>
        </form>

        {/* Right Column: Generated Brief Output (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
            <h3 className="text-sm font-bold text-[#111827]">Structured Strategy Brief</h3>
            {brief && (
              <span className="text-[10px] font-bold text-[#10B981] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                Ready for Shoot
              </span>
            )}
          </div>

          {brief ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">Title Options</span>
                <ul className="space-y-1.5 text-xs font-semibold text-[#111827]">
                  {brief.titles.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#3B82F6] font-bold">#{idx + 1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {brief.hook && (
                <div className="p-4 bg-[#FEF3C7] rounded-2xl border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider block text-[#78350F]">
                    Opening 15s Retention Hook
                  </span>
                  <p className="italic font-medium">{brief.hook}</p>
                </div>
              )}

              <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                  Production Outline Cues
                </span>
                <div className="space-y-2">
                  {brief.outline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#374151]">
                      <span className="w-5 h-5 rounded-full bg-white border border-[#E2E5EB] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#F0F2F5]">
                <button
                  onClick={() => onContinueToProduction(brief)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Transfer to Production Studio →</span>
                </button>

                <button
                  onClick={() => {
                    const topTitle = brief.titles[0] || brief.topic;
                    onSaveToPlanner(topTitle, `Audience: ${brief.audience}\nPromise: ${brief.promise}`);
                    onToast("Brief saved to Content Planner.", "success");
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#E2E5EB] rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>Save to Planner</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#9CA3AF]">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Fill in your strategy parameters on the left to synthesize a brief.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
