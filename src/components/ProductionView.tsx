"use client";

import React, { useState } from "react";
import { Video, Download, Copy, Check, Plus, Film, Sparkles, FileText, CheckSquare } from "lucide-react";
import { ProductionPack } from "@/types";
import { AnimatedTabs } from "./AnimatedTabs";

interface ProductionViewProps {
  initialData?: {
    topic?: string;
    audience?: string;
    outcome?: string;
    format?: string;
  };
  onSaveToPlanner: (title: string, note: string, status?: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const ProductionView: React.FC<ProductionViewProps> = ({
  initialData,
  onSaveToPlanner,
  onToast,
}) => {
  const [topic, setTopic] = useState(initialData?.topic || "Build a useful Python project for beginners");
  const [audience, setAudience] = useState(initialData?.audience || "Students who are new to Python");
  const [outcome, setOutcome] = useState(initialData?.outcome || "Build one small project and understand how each part works.");
  const [format, setFormat] = useState(initialData?.format?.toLowerCase().includes("short") ? "Short" : "Long-form");
  const [duration, setDuration] = useState("6–8 minutes");
  const [tone, setTone] = useState("Friendly teacher");
  const [language, setLanguage] = useState("English");
  const [differentiator, setDifferentiator] = useState("");
  const [cta, setCta] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [pack, setPack] = useState<ProductionPack | null>(null);
  const [activeTab, setActiveTab] = useState("script");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !audience.trim() || !outcome.trim()) {
      onToast("Complete the topic, audience, and outcome first.", "info");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          audience: audience.trim(),
          outcome: outcome.trim(),
          format,
          duration,
          tone,
          language,
          differentiator: differentiator.trim(),
          cta: cta.trim(),
        }),
      });

      if (!res.ok) throw new Error("Production request failed");
      const data: ProductionPack = await res.json();
      setPack(data);
      onToast(
        data.source === "ai"
          ? "AI production draft ready. Review details before recording."
          : "Production pack ready using template workflow.",
        "success"
      );
    } catch {
      onToast("Could not generate pack. Please check connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    onToast("Copied to clipboard.", "success");
  };

  const formatPackText = (p: ProductionPack) => {
    const scenes = p.scenes
      .map(
        (s, i) =>
          `SCENE ${i + 1} · ${s.time} · ${s.purpose}\n` +
          `VOICEOVER\n${s.voiceover}\n` +
          `WHAT TO SHOW\n${s.visual}\n` +
          `ON-SCREEN TEXT\n${s.onScreen}\n` +
          `VISUAL ASSET PROMPT\n${s.assetPrompt}\n` +
          `EDIT NOTE\n${s.editNote}`
      )
      .join("\n\n----------------------------------------\n\n");

    return (
      `CREATORLENS PRODUCTION PACK\n` +
      `${p.topic}\n\n` +
      `AUDIENCE: ${p.audience}\n` +
      `OUTCOME: ${p.outcome}\n` +
      `FORMAT: ${p.format} · ${p.duration}\n` +
      `LANGUAGE: ${p.language} · TONE: ${p.tone}\n\n` +
      `TITLE OPTIONS\n` +
      p.titleOptions.map((t, i) => `${i + 1}. ${t}`).join("\n") +
      `\n\nOPENING HOOK\n${p.openingHook}\n\n` +
      `COMPLETE VOICEOVER SCRIPT\n${p.voiceoverScript}\n\n` +
      `SCENE-BY-SCENE PLAN\n${scenes}\n\n` +
      `YOUTUBE DESCRIPTION\n${p.description}\n\n` +
      `HASHTAGS\n${p.hashtags.join(" ")}\n\n` +
      `PINNED COMMENT\n${p.pinnedComment}\n\n` +
      `PRODUCTION CHECKLIST\n` +
      p.productionChecklist.map((c) => `[ ] ${c}`).join("\n") +
      `\n\nNOTES\n${p.notice}\n`
    );
  };

  const downloadPack = () => {
    if (!pack) return;
    const filename = `creatorlens-${pack.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}.txt`;
    const blob = new Blob([formatPackText(pack)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onToast("Production pack downloaded.", "success");
  };

  const handleSaveToPlanner = () => {
    if (!pack) return;
    onSaveToPlanner(
      pack.topic,
      `${pack.outcome} · Production pack ready. Format: ${pack.format} (${pack.duration})`,
      "Ready to record"
    );
    onToast("Saved to Content Planner as 'Ready to record'.", "success");
  };

  const productionTabs = [
    { id: "script", label: "Voiceover script" },
    { id: "scenes", label: "Scene plan", count: pack ? pack.scenes.length : undefined },
    { id: "upload", label: "Upload kit" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="pb-2 border-b border-ink-800">
        <div className="text-xs font-mono text-studio-orange">AI CREATOR WORKFLOW · STAGE 02</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 mt-1">
          From idea to shoot-ready.
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 mt-1">
          Build a production pack with a complete spoken script, scene plan, visual prompts, and upload metadata—all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Production Form (5 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-5 bg-ink-900 border border-ink-700 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-ink-800">
            <div>
              <div className="text-[10px] font-mono text-studio-orange">PRODUCTION BRIEF</div>
              <h2 className="text-sm font-bold text-ink-100">Tell us what you&apos;re making.</h2>
            </div>
            <Video className="w-4 h-4 text-studio-orange" />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">Video topic</label>
            <input
              type="text"
              required
              maxLength={180}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What will the video teach?"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">Target viewer</label>
            <input
              type="text"
              required
              maxLength={180}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Who is this for?"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">Viewer&apos;s desired outcome</label>
            <textarea
              rows={3}
              required
              maxLength={360}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="What will they finish or understand?"
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
                <option value="Long-form">Long-form video</option>
                <option value="Short">YouTube Short</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1">Target duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
              >
                <option>30–45 seconds</option>
                <option>60 seconds</option>
                <option>3–5 minutes</option>
                <option>6–8 minutes</option>
                <option>8–12 minutes</option>
                <option>12–18 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1">Delivery style</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
              >
                <option>Friendly teacher</option>
                <option>Fast and energetic</option>
                <option>Calm and detailed</option>
                <option>Story-led</option>
                <option>Professional explainer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1">Script language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
              >
                <option>English</option>
                <option>Simple English</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Hinglish</option>
                <option>English with Tamil terms</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">
              Your unique angle <span className="text-[10px] text-ink-500 font-mono">OPTIONAL</span>
            </label>
            <input
              type="text"
              maxLength={240}
              value={differentiator}
              onChange={(e) => setDifferentiator(e.target.value)}
              placeholder="e.g. free tools only, for college students"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">
              Call to action <span className="text-[10px] text-ink-500 font-mono">OPTIONAL</span>
            </label>
            <input
              type="text"
              maxLength={300}
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Ask viewers which project they want next"
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-lg text-xs font-mono font-bold tracking-wide transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span>{isLoading ? "BUILDING YOUR PACK…" : "GENERATE PRODUCTION PACK"}</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </form>

        {/* Output Column (7 cols) */}
        <div className="lg:col-span-7 p-5 bg-ink-900 border border-ink-700 rounded-xl flex flex-col justify-between space-y-4">
          {pack ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-ink-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-studio-orange">PRODUCTION PACK READY</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        pack.source === "ai"
                          ? "bg-studio-emerald/20 text-studio-emerald"
                          : "bg-ink-800 text-ink-300"
                      }`}
                    >
                      {pack.source === "ai" ? "AI DRAFT" : "TEMPLATE DRAFT"}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-ink-50 mt-1">{pack.topic}</h2>
                  <div className="text-xs text-ink-400 font-mono mt-0.5">
                    {pack.audience} · {pack.format} · {pack.duration} · {pack.language}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadPack}
                  className="px-3 py-1.5 bg-ink-800 hover:bg-ink-700 text-ink-100 border border-ink-700 rounded text-xs font-mono flex items-center gap-1.5 self-start transition"
                >
                  <Download className="w-3.5 h-3.5 text-studio-orange" />
                  <span>Download pack (.txt)</span>
                </button>
              </div>

              {/* Opening Hook preview */}
              <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-studio-emerald font-bold">OPENING HOOK</span>
                  <p className="text-xs text-ink-200 italic mt-0.5">&ldquo;{pack.openingHook}&rdquo;</p>
                </div>
                <button
                  onClick={() => copyText(pack.openingHook)}
                  className="text-xs font-mono text-studio-orange hover:underline flex-shrink-0"
                >
                  Copy hook
                </button>
              </div>

              {/* Animated Tab Switcher */}
              <AnimatedTabs
                tabs={productionTabs}
                activeId={activeTab}
                onChange={setActiveTab}
                layoutId="productionActiveTab"
              />

              {/* Tab 1: Voiceover Script */}
              {activeTab === "script" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-ink-400">
                    <span>Complete spoken script · scene timecodes</span>
                    <button
                      onClick={() => copyText(pack.voiceoverScript)}
                      className="text-studio-orange hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy script</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-ink-950 border border-ink-800 rounded-lg text-xs font-mono text-ink-200 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                    {pack.voiceoverScript}
                  </pre>

                  {/* Title Options */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-mono text-ink-400">YOUTUBE TITLE OPTIONS</span>
                    {pack.titleOptions.map((t, idx) => (
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
              )}

              {/* Tab 2: Scene-by-Scene Plan */}
              {activeTab === "scenes" && (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {pack.scenes.map((s, idx) => (
                    <article
                      key={idx}
                      className="p-4 bg-ink-950 border border-ink-800 rounded-lg space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-ink-850">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-studio-orange font-bold">
                            SCENE {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-ink-400">·</span>
                          <span className="text-ink-200 font-bold">{s.time}</span>
                        </div>
                        <span className="font-semibold text-ink-100">{s.purpose}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-ink-500">VOICEOVER</span>
                        <p className="text-ink-200 italic">{s.voiceover}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-ink-500">WHAT TO SHOW</span>
                        <p className="text-ink-300">{s.visual}</p>
                      </div>

                      {s.onScreen && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-ink-500">ON-SCREEN TEXT</span>
                          <p className="text-studio-blue font-mono">{s.onScreen}</p>
                        </div>
                      )}

                      <div className="p-2.5 bg-ink-900 border border-ink-800 rounded flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono text-studio-orange">VISUAL PROMPT</span>
                          <p className="text-[11px] text-ink-300 font-mono mt-0.5">{s.assetPrompt}</p>
                        </div>
                        <button
                          onClick={() => copyText(s.assetPrompt)}
                          className="text-[10px] font-mono text-studio-orange hover:underline flex-shrink-0"
                        >
                          Copy
                        </button>
                      </div>

                      {s.editNote && (
                        <div className="text-[11px] text-ink-400 font-mono">
                          <strong className="text-ink-300">EDIT NOTE:</strong> {s.editNote}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {/* Tab 3: Upload Kit */}
              {activeTab === "upload" && (
                <div className="space-y-4">
                  {/* YouTube Description */}
                  <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-ink-400">VIDEO DESCRIPTION & CHAPTERS</span>
                      <button
                        onClick={() => copyText(pack.description)}
                        className="text-xs font-mono text-studio-orange hover:underline"
                      >
                        Copy description
                      </button>
                    </div>
                    <pre className="p-3 bg-ink-900 border border-ink-800 rounded text-xs font-mono text-ink-300 whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto">
                      {pack.description}
                    </pre>
                  </div>

                  {/* Hashtags & Pinned comment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="text-[10px] text-ink-400">HASHTAGS</span>
                        <button
                          onClick={() => copyText(pack.hashtags.join(" "))}
                          className="text-[11px] text-studio-orange hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="font-mono text-studio-blue">{pack.hashtags.join(" ")}</p>
                    </div>

                    <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="text-[10px] text-ink-400">PINNED COMMENT</span>
                        <button
                          onClick={() => copyText(pack.pinnedComment)}
                          className="text-[11px] text-studio-orange hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-ink-200">{pack.pinnedComment}</p>
                    </div>
                  </div>

                  {/* Pre-flight Checklist */}
                  <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-2">
                    <span className="text-[10px] font-mono text-studio-emerald font-bold">
                      BEFORE YOU PUBLISH CHECKLIST
                    </span>
                    <div className="space-y-1.5 text-xs text-ink-300">
                      {pack.productionChecklist.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded bg-ink-900 border-ink-700 text-studio-orange focus:ring-0"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-ink-800">
                <button
                  type="button"
                  onClick={handleSaveToPlanner}
                  className="px-4 py-2 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to content planner ↗</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyText(formatPackText(pack))}
                  className="px-4 py-2 bg-ink-800 hover:bg-ink-700 text-ink-200 border border-ink-700 rounded-md text-xs font-mono transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy full pack</span>
                </button>
              </div>

              <p className="text-[11px] text-ink-500 font-mono">
                {pack.notice || "Review technical commands and adapt the script to your real voice before recording."}
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 font-mono">
              <div className="w-12 h-12 rounded-xl bg-ink-800 border border-ink-700 text-studio-orange flex items-center justify-center">
                <Film className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-ink-100">Your production pack will appear here.</h2>
              <p className="text-xs text-ink-400 max-w-sm">
                Generate a full spoken script, shot list, on-screen text, visual prompts, YouTube description with chapters, and recording checklist.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
