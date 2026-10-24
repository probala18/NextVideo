"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Copy,
  Check,
  Video,
  Sparkles,
  Bookmark,
  Film,
  Download,
  Clock,
  Layers,
  ChevronRight,
  Sparkle,
  Play
} from "lucide-react";
import { VideoBrief, ProductionPack, ProductionScene } from "@/types";
import { VideoPlayerModal } from "./VideoPlayerModal";

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
  const [activeTab, setActiveTab] = useState<"blueprint" | "script" | "scenes" | "metadata">("blueprint");
  const [copied, setCopied] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [aiSource, setAiSource] = useState<"openrouter" | "template">("template");
  const [aiModel, setAiModel] = useState("openai/gpt-4o-mini");
  const [isOpenRouterActive, setIsOpenRouterActive] = useState(false);

  useEffect(() => {
    fetch("/api/video/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.model) setAiModel(d.model);
        if (d.isConfigured) {
          setIsOpenRouterActive(true);
          setAiSource("openrouter");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const localFallbackBrief = (): VideoBrief => {
    const isShort = format.includes("Short");
    const isDeep = format.includes("Deep");
    const cleanTopic = topic.trim() || "Python projects for absolute beginners";
    const promise = goal.trim() || `Help ${audience} understand ${cleanTopic} and complete one practical next step.`;
    const cleanDiff = differentiator.trim() || "practical examples with live explanations";

    const titles = isShort
      ? [
          `The Only ${cleanTopic} Trick You Need to Know`,
          `Stop Doing ${cleanTopic} Wrong (Do This Instead)`,
          `How to Master ${cleanTopic} in 60 Seconds`,
          `${cleanTopic} Explained with Zero Fluff`,
        ]
      : [
          `${cleanTopic}: A Beginner Step-by-Step Guide`,
          `Learn ${cleanTopic} by Building One Real Example`,
          `Before You Try ${cleanTopic}, Understand These Essentials`,
          `How I Would Learn ${cleanTopic} if I Could Start Over`,
        ];

    const hook = isShort
      ? `“If you're trying to figure out ${cleanTopic.toLowerCase()}, here is the 45-second breakthrough you need without any fluff.”`
      : `“If you are ${audience.toLowerCase()}, this video will help you ${promise.charAt(0).toLowerCase() + promise.slice(1).replace(/[.!?]+$/, "")}. I'll show the finished result right away, then break down the exact steps so you can follow along.”`;

    const outline = isShort
      ? [
          "0:00–0:03 · Show the completed outcome or problem in the first 2 seconds",
          "0:04–0:18 · Demonstrate the core technique without setup filler",
          "0:19–0:32 · Show the common trap and the quick correction",
          "0:33–0:45 · Finished result recap and 1 natural next action",
        ]
      : [
          "0:00–0:30 · Open with the specific problem and show the outcome",
          "0:30–1:45 · Explain only the minimum concepts needed to begin",
          "1:45–4:30 · Demonstrate the process in clear, numbered steps",
          "4:30–5:45 · Show a common mistake and how to troubleshoot it",
          "5:45–7:00 · Recap the result and give the viewer one practical challenge",
        ];

    const scenes: ProductionScene[] = isShort
      ? [
          {
            time: "0:00–0:05",
            purpose: "Cold open hook + instant payoff",
            voiceover: `Want to ${promise.toLowerCase().replace(/[.!?]+$/, "")}? Here is the simplest way to do it.`,
            visual: `Cut directly to the working ${cleanTopic} result on screen. Fast zoom on the key element.`,
            onScreen: `Master ${cleanTopic} in 45s`,
            assetPrompt: `Clean vertical close-up of finished result for ${cleanTopic}, high contrast, 9:16`,
            editNote: "Start on action; trim any dead air before first syllable.",
          },
          {
            time: "0:05–0:20",
            purpose: "The core technique",
            voiceover: `First, focus on ${cleanDiff}. Watch this closely because it avoids 90% of beginner frustration.`,
            visual: "Screen record the essential step with a highlight ring around the focal point.",
            onScreen: "Step 1: The Core Mechanism",
            assetPrompt: `Vertical educational graphic illustrating core mechanism for ${cleanTopic}`,
            editNote: "Use a punch zoom or sound effect to emphasize the turning point.",
          },
          {
            time: "0:20–0:35",
            purpose: "Common mistake vs fix",
            voiceover: "A huge mistake here is trying to do everything at once. Keep it modular and check your output as you go.",
            visual: "Split screen: Red X on common wrong approach, Green check on the clean approach.",
            onScreen: "Don't do this ✗ · Do this ✓",
            assetPrompt: `Vertical split visual mistake versus fix for ${cleanTopic}`,
            editNote: "Keep the wrong approach brief; spend more time on the correct method.",
          },
          {
            time: "0:35–0:45",
            purpose: "Payoff & viewer challenge",
            voiceover: "And that's the working solution. Try it yourself right now and tell me in the comments what you want covered next.",
            visual: "Final showcase of working outcome, seamless loop cut back to opening frame.",
            onScreen: "Your turn · Comment your question",
            assetPrompt: `Clean vertical end-screen showcase for ${cleanTopic}`,
            editNote: "End quickly after the payoff to maximize loop completion rate.",
          },
        ]
      : [
          {
            time: "0:00–0:30",
            purpose: "Hook & proof of payoff",
            voiceover: hook,
            visual: `Demonstrate the finished outcome of ${cleanTopic} in action within the first 10 seconds before showing the speaker.`,
            onScreen: `What we're building: ${cleanTopic}`,
            assetPrompt: `Widescreen 16:9 high resolution demonstration of ${cleanTopic}, crisp focal point`,
            editNote: "No animated channel logo intros; deliver value immediately.",
          },
          {
            time: "0:30–1:45",
            purpose: "Minimum foundation",
            voiceover: `Before we jump into the build, here are the only foundational concepts you need to know. We'll keep it strictly practical.`,
            visual: "Show a clean visual diagram or schematic breaking the concept into 3 simple milestones.",
            onScreen: "Foundation: 3 Milestones",
            assetPrompt: `Clean minimalist infographic explaining ${cleanTopic} concepts`,
            editNote: "Keep diagram animation smooth and clear.",
          },
          {
            time: "1:45–4:30",
            purpose: "Step-by-step build",
            voiceover: `Now let's build this together. Milestone one: ${cleanDiff}. Notice how each decision connects to the final goal.`,
            visual: "High-resolution desktop/camera recording with smooth cursor highlights or numbered callouts.",
            onScreen: "Step-by-Step Walkthrough",
            assetPrompt: `Step-by-step workspace recording setup for ${cleanTopic}`,
            editNote: "Speed up any typing or waiting periods by 1.5x to preserve engagement.",
          },
          {
            time: "4:30–5:45",
            purpose: "Troubleshooting & pitfalls",
            voiceover: `Here is the one error almost everyone runs into when trying this. If you see this happen, don't worry—here is the exact fix.`,
            visual: "Demonstrate the real error message or glitch, then show the step-by-step resolution.",
            onScreen: "Troubleshooting: The Easy Fix",
            assetPrompt: `Side-by-side troubleshooting visual for ${cleanTopic}`,
            editNote: "Add a subtle lower-third alert box highlighting the fix.",
          },
          {
            time: "5:45–7:00",
            purpose: "Recap & Next Action",
            voiceover: `Let's review what we built. You now have a working implementation. Take the starter code in the description, build your own variation, and let me know in the comments if you get stuck.`,
            visual: "Full working result in action alongside summary bullet points. Clean end screen with next video card.",
            onScreen: "Summary & Your Challenge",
            assetPrompt: `Polished YouTube end-card background for ${cleanTopic}`,
            editNote: "Display clean end-screen card with playlist recommendation.",
          },
        ];

    const voiceoverScript = scenes.map((s) => `[${s.time}] · ${s.purpose}\n${s.voiceover}`).join("\n\n");

    const pack: ProductionPack = {
      topic: cleanTopic,
      audience,
      outcome: promise,
      format: isShort ? "Short" : "Long-form",
      duration: isShort ? "<60 seconds" : isDeep ? "15–20 minutes" : "6–8 minutes",
      tone: "Friendly teacher",
      language: "English",
      titleOptions: titles,
      description: `In this video, you'll learn how to ${promise.toLowerCase().replace(/[.!?]+$/, "")}.\n\nDesigned specifically for ${audience.toLowerCase()}.\n\nChapters:\n` +
        scenes.map((s) => `${s.time.split("–")[0]} ${s.purpose}`).join("\n") +
        `\n\nDrop a comment with your questions and subscribe for more ${cleanTopic} tutorials!`,
      hashtags: [
        "#" + cleanTopic.replace(/[^a-z0-9]/gi, ""),
        "#Tutorial",
        "#LearnByDoing",
        "#CreatorTips"
      ],
      tags: [
        cleanTopic,
        "Tutorial",
        "Guide",
        "Beginner",
        "Walkthrough"
      ],
      openingHook: hook,
      voiceoverScript,
      scenes,
      pinnedComment: `What part of ${cleanTopic} was most helpful? Drop your questions below and I'll reply to everyone! 👇`,
      productionChecklist: [
        "Verify all code / demo steps run smoothly before recording.",
        "Check microphone audio levels and remove room echo.",
        "Capture screen at 1080p or 4K with enlarged readable UI fonts.",
        "Ensure hook promises match the actual demonstration.",
        "Add chapter markers and clean captions for accessibility."
      ],
      source: "template",
      notice: "Production pack synthesized locally."
    };

    return {
      topic: cleanTopic,
      audience,
      format,
      promise,
      titles,
      hook,
      outline,
      thumbnail:
        "High-contrast composition showing the finished result or core problem. Use one focal subject and at most 3-4 readable words." +
        (cleanDiff ? ` Angle: ${cleanDiff}` : ""),
      measure:
        "Compare click-through rate with your channel's median. Inspect retention at 0:30 to evaluate hook strength. Use comments to plan follow-ups.",
      note: cleanDiff,
      pack,
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

      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      if (data.source) setAiSource(data.source);
      if (data.model) setAiModel(data.model);

      if (data.brief) {
        setBrief(data.brief);
        onToast(
          data.source === "openrouter"
            ? `AI Video generated via OpenRouter (${data.model})!`
            : "Video strategy & production scenes generated!",
          "success"
        );
      } else {
        setBrief(localFallbackBrief());
        onToast("Video strategy generated from local production model.", "success");
      }
    } catch {
      setBrief(localFallbackBrief());
      onToast("Video strategy generated from local production model.", "success");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyFullScript = () => {
    if (!brief) return;
    const text = brief.pack?.voiceoverScript || brief.hook + "\n\n" + brief.outline.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    onToast("Teleprompter script copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPackFile = () => {
    if (!brief) return;
    const p = brief.pack;
    const scenesText = p?.scenes
      ? p.scenes
          .map(
            (s, i) =>
              `SCENE ${i + 1} [${s.time}] · ${s.purpose}\nVOICEOVER:\n${s.voiceover}\n\nVISUAL CUE:\n${s.visual}\n\nON-SCREEN TEXT:\n${s.onScreen}\n\nEDIT NOTE:\n${s.editNote}`
          )
          .join("\n\n" + "=".repeat(40) + "\n\n")
      : brief.outline.join("\n");

    const content = `========================================
VIDEO STRATEGY & PRODUCTION BLUEPRINT
========================================
Topic: ${brief.topic}
Audience: ${brief.audience}
Outcome Promise: ${brief.promise}
Format: ${brief.format}

OPENING RETENTION HOOK:
${brief.hook}

TITLE CANDIDATES:
${brief.titles.map((t, i) => `#${i + 1} ${t}`).join("\n")}

========================================
SCENE-BY-SCENE PRODUCTION SCRIPT
========================================
${scenesText}

========================================
YOUTUBE METADATA
========================================
Description:
${p?.description || "N/A"}

Hashtags: ${p?.hashtags?.join(" ") || "N/A"}
Pinned Comment: ${p?.pinnedComment || "N/A"}
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `video-strategy-${brief.topic.slice(0, 25).replace(/[^a-z0-9]/gi, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onToast("Strategy & production blueprint downloaded.", "success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Video Strategy & Production Studio</span>
              <span className="text-gray-300">·</span>
              <span className="text-[10px] font-semibold text-[#4B5563] flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOpenRouterActive
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
                      : "bg-amber-400"
                  }`}
                />
                <span>OpenRouter Model: <strong className="text-[#111827]">{aiModel}</strong></span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Video Strategy & Production Blueprint
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Turn any topic into high-converting titles, a psychology-calibrated 15s hook, a scene-by-scene shooting storyboard, and complete animated video.
            </p>
          </div>

          {brief && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white rounded-full text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play AI Video</span>
              </button>

              <button
                onClick={copyFullScript}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E2E5EB] rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Copy teleprompter script"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Script"}</span>
              </button>

              <button
                onClick={downloadPackFile}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E2E5EB] rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Download production pack"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export (.txt)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Brief Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
            <span className="text-sm font-bold text-[#111827]">Video Parameters</span>
            <span className="text-[10px] font-bold text-[#3B82F6] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full">
              Full Video Pack
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Topic or Video Angle</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Build an AI Agent in 15 Minutes"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none font-medium"
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
              placeholder="What specific outcome will the viewer achieve by the end?"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Format & Target Length</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none font-medium"
              >
                <option value="Tutorial (6–12 min)">Tutorial (6–12 min)</option>
                <option value="Short video (<60 sec)">Short (&lt;60 sec)</option>
                <option value="Deep dive (15–25 min)">Deep dive (15–25 min)</option>
                <option value="Concept comparison">Concept comparison</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Channel Size / Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none font-medium"
              >
                <option value="New channel">New (&lt;1K subs)</option>
                <option value="Growing">Growing (1K–50K)</option>
                <option value="Established">Established (50K+)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Unique Angle / Key Differentiator</label>
            <input
              type="text"
              value={differentiator}
              onChange={(e) => setDifferentiator(e.target.value)}
              placeholder="e.g. No-BS walkthrough with live code execution"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-300 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? "Synthesizing Video Pack..." : "Generate Video Strategy & Scenes →"}</span>
          </button>
        </form>

        {/* Right Column: Generated Brief & Video Output (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-5">
          {brief ? (
            <div className="space-y-5">
              {/* Pill Navigation Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F2F5] pb-3">
                <div className="flex items-center bg-[#F3F4F6] p-1 rounded-full text-xs font-semibold overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("blueprint")}
                    className={`px-3 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
                      activeTab === "blueprint"
                        ? "bg-white text-[#111827] shadow-xs font-bold"
                        : "text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    Strategy Blueprint
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("scenes")}
                    className={`px-3 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
                      activeTab === "scenes"
                        ? "bg-white text-[#111827] shadow-xs font-bold"
                        : "text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    Scene Storyboard ({brief.pack?.scenes?.length || brief.outline.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("script")}
                    className={`px-3 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
                      activeTab === "script"
                        ? "bg-white text-[#111827] shadow-xs font-bold"
                        : "text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    Teleprompter Script
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("metadata")}
                    className={`px-3 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
                      activeTab === "metadata"
                        ? "bg-white text-[#111827] shadow-xs font-bold"
                        : "text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    YouTube Metadata
                  </button>
                </div>

                <span className="text-[10px] font-bold text-[#10B981] bg-[#DCFCE7] px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 self-start sm:self-auto">
                  <Check className="w-3 h-3" />
                  <span>Ready for Shoot</span>
                </span>
              </div>

              {/* Tab 1: Strategy Blueprint */}
              {activeTab === "blueprint" && (
                <div className="space-y-4">
                  {/* Title Options */}
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      High-CTR Title Candidates
                    </span>
                    <ul className="space-y-2 text-xs font-semibold text-[#111827]">
                      {brief.titles.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#EAECEF]">
                          <span className="text-[#3B82F6] font-black text-xs shrink-0">#{idx + 1}</span>
                          <span className="flex-1">{t}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(t);
                              onToast(`Copied title #${idx + 1}`, "success");
                            }}
                            className="text-[#9CA3AF] hover:text-[#3B82F6] p-1 rounded-md transition"
                            title="Copy title"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 15-second hook */}
                  {brief.hook && (
                    <div className="p-4 bg-[#FEF3C7] rounded-2xl border border-[#FDE68A] text-xs text-[#92400E] space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider block text-[#78350F] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Opening 15-Second Retention Hook</span>
                      </span>
                      <p className="italic font-medium leading-relaxed bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
                        {brief.hook}
                      </p>
                    </div>
                  )}

                  {/* Outline Cues */}
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Production Outline Milestones
                    </span>
                    <div className="space-y-2">
                      {brief.outline.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-[#374151] bg-white p-2.5 rounded-xl border border-[#EAECEF]">
                          <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail & Retention */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block">Thumbnail Visual Hook</span>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed">{brief.thumbnail}</p>
                    </div>
                    <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block">Retention & Validation</span>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed">{brief.measure}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Scene Storyboard */}
              {activeTab === "scenes" && (
                <div className="space-y-3.5">
                  {(brief.pack?.scenes || []).map((scene, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full uppercase">
                            Scene {idx + 1} · {scene.time}
                          </span>
                          <span className="text-xs font-bold text-[#111827]">{scene.purpose}</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E5E7EB] text-xs leading-relaxed text-[#1F2937]">
                        <span className="text-[10px] font-bold uppercase text-[#9CA3AF] block mb-1">Teleprompter Copy</span>
                        {scene.voiceover}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white/80 p-2.5 rounded-xl border border-[#EAECEF] text-[#4B5563]">
                          <strong className="text-[#111827] block mb-0.5">Camera / Screen Action:</strong>
                          {scene.visual}
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-[#EAECEF] text-[#4B5563]">
                          <strong className="text-[#111827] block mb-0.5">On-Screen Overlay:</strong>
                          <span className="text-[#2563EB] font-medium">{scene.onScreen}</span>
                        </div>
                      </div>

                      {scene.editNote && (
                        <div className="text-[10px] text-[#6B7280] bg-gray-100/60 px-3 py-1.5 rounded-lg">
                          <strong>Edit Note:</strong> {scene.editNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Teleprompter Script */}
              {activeTab === "script" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE] text-xs text-[#1E40AF]">
                    <span>Formatted continuous teleprompter narration for recording.</span>
                    <button
                      type="button"
                      onClick={copyFullScript}
                      className="px-3 py-1 bg-white hover:bg-blue-50 text-[#2563EB] font-bold rounded-full text-xs shadow-xs border border-blue-200 transition cursor-pointer"
                    >
                      {copied ? "Copied!" : "Copy Clean Script"}
                    </button>
                  </div>

                  <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-4 font-mono text-xs text-[#1F2937] leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                    {brief.pack?.voiceoverScript || brief.hook}
                  </div>
                </div>
              )}

              {/* Tab 4: YouTube Metadata */}
              {activeTab === "metadata" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827]">Optimized Video Description</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (brief.pack?.description) {
                            navigator.clipboard.writeText(brief.pack.description);
                            onToast("Description copied!", "success");
                          }
                        }}
                        className="text-xs text-[#3B82F6] hover:underline font-semibold"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs text-[#374151] whitespace-pre-wrap font-sans bg-white p-3.5 rounded-xl border border-[#E5E7EB] leading-relaxed">
                      {brief.pack?.description || "Description generated with video pack."}
                    </pre>
                  </div>

                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2">
                    <span className="text-xs font-bold text-[#111827] block">Tags & Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(brief.pack?.tags || brief.pack?.hashtags || ["#Tutorial", "#LearnByDoing"]).map((tg) => (
                        <span key={tg} className="text-xs bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-full text-[#4B5563]">
                          #{tg.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {brief.pack?.pinnedComment && (
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-1.5">
                      <span className="text-xs font-bold text-[#111827] block">Pinned Community Comment</span>
                      <p className="text-xs text-[#374151] bg-white p-3 rounded-xl border border-[#E5E7EB]">
                        {brief.pack.pinnedComment}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F0F2F5]">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Play AI Video Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onContinueToProduction(brief)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Open in Production Studio →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const topTitle = brief.titles[0] || brief.topic;
                      onSaveToPlanner(topTitle, `Audience: ${brief.audience}\nPromise: ${brief.promise}`);
                      onToast("Saved to Content Planner.", "success");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#E2E5EB] rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Save to Planner</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={downloadPackFile}
                  className="text-xs text-[#6B7280] hover:text-[#111827] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt blueprint</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-[#9CA3AF] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto text-[#9CA3AF]">
                <Film className="w-6 h-6 opacity-60" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#374151]">No Video Strategy Generated Yet</h3>
                <p className="text-xs text-[#9CA3AF] mt-1 max-w-sm mx-auto">
                  Configure your topic and audience on the left and click &ldquo;Generate Video Strategy &amp; Scenes&rdquo; to build your shooting pack.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {brief?.pack && (
        <VideoPlayerModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          pack={brief.pack}
          modelName={aiModel}
          source={aiSource}
        />
      )}
    </div>
  );
};
