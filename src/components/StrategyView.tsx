"use client";

import React, { useState } from "react";
import { FileText, ArrowUpRight, Copy, Check, Video, Plus, Sparkles } from "lucide-react";
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
      onToast("Brief ready using local strategy template.", "info");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    onToast("Copied to clipboard.", "success");
  };

  const copyFullBrief = () => {
    if (!brief) return;
    const text = [
      `CREATORLENS VIDEO BRIEF: ${brief.topic}`,
      `Audience: ${brief.audience}`,
      `Format: ${brief.format}`,
      `Viewer Promise: ${brief.promise}`,
      `Titles:\n${brief.titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
      `Opening Hook:\n${brief.hook}`,
      `Structure Outline:\n${brief.outline.map((o, i) => `${i + 1}. ${o}`).join("\n")}`,
      `Thumbnail Direction:\n${brief.thumbnail}`,
      `What to Measure:\n${brief.measure}`,
    ].join("\n\n");

    copyText(text);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="pb-2 border-b border-ink-800">
        <div className="text-xs font-mono text-studio-orange">VIDEO STRATEGY STUDIO</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 mt-1">
          Turn research into a video.
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 mt-1">
          Create a focused brief with an audience promise, title options, opening hook, and a practical structure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (5 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-5 bg-ink-900 border border-ink-700 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-ink-800">
            <div>
              <div className="text-[10px] font-mono text-studio-orange">NEW VIDEO BRIEF</div>
              <h2 className="text-sm font-bold text-ink-100">Start with the viewer.</h2>
            </div>
            <FileText className="w-4 h-4 text-studio-orange" />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">
              What is the video about?
            </label>
            <input
              type="text"
              required
              maxLength={180}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What will you teach or explain?"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">
              Who is this for?
            </label>
            <input
              type="text"
              maxLength={180}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Target viewer persona"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">
              What should they be able to do after watching?
            </label>
            <textarea
              rows={3}
              maxLength={400}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe a clear, tangible outcome"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1">Video format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
              >
                <option>Tutorial (6–12 min)</option>
                <option>YouTube Short (under 60 sec)</option>
                <option>Explainer (8–15 min)</option>
                <option>Project walkthrough</option>
                <option>Comparison / review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1">Creator stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
              >
                <option>New channel</option>
                <option>Growing channel</option>
                <option>Established channel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">
              Your unique angle <span className="text-[10px] text-ink-500 font-mono">OPTIONAL</span>
            </label>
            <input
              type="text"
              maxLength={200}
              value={differentiator}
              onChange={(e) => setDifferentiator(e.target.value)}
              placeholder="e.g. explain it for students using only free tools"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-2.5 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-lg text-xs font-mono font-bold tracking-wide transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span>{isGenerating ? "BUILDING BRIEF…" : "BUILD MY VIDEO BRIEF"}</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </form>

        {/* Output Column (7 cols) */}
        <div className="lg:col-span-7 p-5 bg-ink-900 border border-ink-700 rounded-xl flex flex-col justify-between space-y-4">
          {brief ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-ink-800">
                <div className="text-[10px] font-mono text-studio-orange">YOUR VIDEO BRIEF</div>
                <h2 className="text-base font-bold text-ink-50">{brief.topic}</h2>
                <div className="text-xs text-ink-400 font-mono mt-0.5">
                  {brief.audience} · {brief.format}
                </div>
              </div>

              {/* Viewer Promise */}
              <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-studio-orange font-bold">THE VIEWER PROMISE</span>
                <p className="text-xs text-ink-200 leading-relaxed">{brief.promise}</p>
              </div>

              {/* Title Directions */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-ink-400">TITLE DIRECTIONS</span>
                <div className="space-y-1.5">
                  {brief.titles.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-ink-950 border border-ink-800 rounded-md flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-studio-orange font-bold">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-ink-100 font-medium">{t}</span>
                      </div>
                      <button
                        onClick={() => copyText(t)}
                        className="text-[11px] font-mono text-studio-orange hover:underline flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hook */}
              <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-studio-emerald font-bold">
                  OPENING HOOK · FIRST 10–20 SECONDS
                </span>
                <p className="text-xs text-ink-200 italic leading-relaxed">{brief.hook}</p>
              </div>

              {/* Structure Outline */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-ink-400">VIDEO STRUCTURE</span>
                <div className="space-y-1">
                  {brief.outline.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2.5 p-2 bg-ink-950 border border-ink-850 rounded text-xs text-ink-200"
                    >
                      <span className="font-mono text-studio-orange font-bold">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thumbnail Direction */}
              <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg text-xs space-y-1">
                <span className="text-[10px] font-mono text-studio-blue font-bold">THUMBNAIL DIRECTION</span>
                <p className="text-ink-300 text-[11px] leading-relaxed">{brief.thumbnail}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-ink-800">
                <button
                  type="button"
                  onClick={() => onSaveToPlanner(brief.topic, brief.promise)}
                  className="px-4 py-2 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to planner</span>
                </button>

                <button
                  type="button"
                  onClick={() => onContinueToProduction(brief)}
                  className="px-4 py-2 bg-ink-800 hover:bg-ink-700 text-ink-100 border border-ink-700 rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-studio-orange" />
                  <span>Continue to production ✦</span>
                </button>

                <button
                  type="button"
                  onClick={copyFullBrief}
                  className="px-4 py-2 bg-ink-800 hover:bg-ink-700 text-ink-300 border border-ink-700 rounded-md text-xs font-mono transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy brief</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 font-mono">
              <div className="w-12 h-12 rounded-xl bg-ink-800 border border-ink-700 text-studio-orange flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-ink-100">Your brief will appear here.</h2>
              <p className="text-xs text-ink-400 max-w-sm">
                Fill in your topic and audience to generate title ideas, an opening hook, and a structured outline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
