"use client";

import React, { useState, useEffect } from "react";
import { Video, Download, Copy, Check, Plus, Film, Sparkles, FileText, CheckSquare, Send, ArrowUpRight, Bookmark, Play } from "lucide-react";
import { ProductionPack } from "@/types";
import { VideoPlayerModal } from "./VideoPlayerModal";

interface ProductionViewProps {
  initialData?: {
    topic?: string;
    audience?: string;
    outcome?: string;
    format?: string;
    autoGenerate?: boolean;
    pack?: ProductionPack;
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
  const [pack, setPack] = useState<ProductionPack | null>(initialData?.pack || null);
  const [activeTab, setActiveTab] = useState("script");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [modelName, setModelName] = useState("openai/gpt-4o-mini");
  const [source, setSource] = useState<"openrouter" | "template">("template");

  useEffect(() => {
    fetch("/api/video/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.model) setModelName(d.model);
        if (d.isConfigured) setSource("openrouter");
      })
      .catch(() => {});
  }, []);

  const triggerGenerate = async (params: {
    topic: string;
    audience: string;
    outcome: string;
    format: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: params.topic.trim(),
          audience: params.audience.trim(),
          outcome: params.outcome.trim(),
          format: params.format,
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
      onToast("Production pack generated successfully.", "success");
    } catch {
      onToast("Could not generate pack. Please check connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialData) {
      if (initialData.topic) setTopic(initialData.topic);
      if (initialData.audience) setAudience(initialData.audience);
      if (initialData.outcome) setOutcome(initialData.outcome);
      if (initialData.format) {
        setFormat(initialData.format.toLowerCase().includes("short") ? "Short" : "Long-form");
      }
      if (initialData.pack) {
        setPack(initialData.pack);
      } else if (initialData.autoGenerate && initialData.topic) {
        triggerGenerate({
          topic: initialData.topic,
          audience: initialData.audience || audience,
          outcome: initialData.outcome || outcome,
          format: initialData.format?.toLowerCase().includes("short") ? "Short" : "Long-form",
        });
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !audience.trim() || !outcome.trim()) {
      onToast("Complete the topic, audience, and outcome first.", "info");
      return;
    }

    await triggerGenerate({ topic, audience, outcome, format });
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
          `EDIT NOTE\n${s.editNote}`
      )
      .join("\n\n----------------------------------------\n\n");

    return (
      `CREATORLENS PRODUCTION PACK\n` +
      `${p.topic}\n\n` +
      `AUDIENCE: ${p.audience}\n` +
      `OUTCOME: ${p.outcome}\n\n` +
      `SHOOTING OUTLINE & TELEPROMPTER\n\n` +
      scenes
    );
  };

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    onToast("Downloaded production pack.", "success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <Film className="w-3.5 h-3.5" />
              <span>Production Studio & Shoot Pack</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              A-Roll Script & Storyboard Pack
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Transform ideas into production packs with scene-by-scene teleprompter copy, B-roll cues, on-screen text, and YouTube metadata.
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Shoot Parameters Form (5 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4"
        >
          <div className="text-sm font-bold text-[#111827] border-b border-[#F0F2F5] pb-3">
            Shoot Specifications
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Video Title / Core Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Build an AI Agent in 15 Minutes"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Target Audience</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Students who are new to Python"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Core Promise / Demonstration</label>
            <textarea
              rows={2}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="What will the viewer finish by the end?"
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
                <option value="Long-form">Long-form video</option>
                <option value="Short">YouTube Short</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Target Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none"
              >
                <option value="3–5 minutes">3–5 minutes</option>
                <option value="6–8 minutes">6–8 minutes</option>
                <option value="10–12 minutes">10–12 minutes</option>
                <option value="15+ minutes">15+ minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Tone of Voice</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none"
              >
                <option value="Friendly teacher">Friendly teacher</option>
                <option value="Fast-paced builder">Fast-paced builder</option>
                <option value="Direct & clear">Direct & clear</option>
                <option value="Conversational peer">Conversational peer</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-300 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? "Generating Pack..." : "Generate Production Pack →"}</span>
          </button>
        </form>

        {/* Right Column: Pack Viewer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-5">
          {pack ? (
            <div className="space-y-5">
              {/* Top Bar with Outcrowd Segmented Pill Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F2F5] pb-4">
                <div className="flex items-center bg-[#F3F4F6] p-1 rounded-full text-xs font-semibold">
                  {[
                    { id: "script", label: "Script / Teleprompter" },
                    { id: "cues", label: "Visual Cues" },
                    { id: "metadata", label: "YouTube Metadata" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-white text-[#111827] shadow-xs font-bold"
                          : "text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText(formatPackText(pack))}
                    className="p-2 rounded-full border border-[#E2E5EB] hover:bg-[#F3F4F6] text-[#4B5563] transition cursor-pointer"
                    title="Copy full pack"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => downloadText(`pack-${pack.topic.slice(0, 20)}.txt`, formatPackText(pack))}
                    className="p-2 rounded-full border border-[#E2E5EB] hover:bg-[#F3F4F6] text-[#4B5563] transition cursor-pointer"
                    title="Download pack"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tab 1: Script Teleprompter */}
              {activeTab === "script" && (
                <div className="space-y-4">
                  {pack.scenes.map((scene, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#3B82F6] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full uppercase">
                          Scene {idx + 1} • {scene.time}
                        </span>
                        <span className="text-xs font-bold text-[#111827]">{scene.purpose}</span>
                      </div>

                      <div className="text-xs leading-relaxed text-[#1F2937] font-medium bg-white p-3 rounded-xl border border-[#E5E7EB]">
                        {scene.voiceover}
                      </div>

                      <div className="text-[11px] text-[#6B7280] flex items-center gap-2">
                        <span className="font-bold text-[#374151]">On-Screen:</span>
                        <span>{scene.onScreen}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Visual Cues */}
              {activeTab === "cues" && (
                <div className="space-y-3">
                  {pack.scenes.map((scene, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111827]">
                          Scene {idx + 1}: {scene.purpose}
                        </span>
                        <span className="text-[10px] text-[#6B7280] bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                          {scene.time}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563]">
                        <strong>What to show:</strong> {scene.visual}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        <strong>Edit Note:</strong> {scene.editNote}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: YouTube Metadata */}
              {activeTab === "metadata" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2">
                    <span className="text-xs font-bold text-[#111827] block">Video Description</span>
                    <pre className="text-xs text-[#374151] whitespace-pre-wrap font-sans bg-white p-3 rounded-xl border border-[#E5E7EB]">
                      {pack.description}
                    </pre>
                  </div>

                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E8EAEE] space-y-2">
                    <span className="text-xs font-bold text-[#111827] block">Tags & Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(pack.tags || pack.hashtags || []).map((tg) => (
                        <span key={tg} className="text-xs bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-full text-[#4B5563]">
                          #{tg.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Save to Planner & Play Actions */}
              <div className="pt-4 border-t border-[#F0F2F5] flex flex-wrap items-center justify-between gap-3">
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
                    onClick={() => {
                      const note = `Outcome: ${pack.outcome}\nTarget Duration: ${pack.duration}\nScenes: ${pack.scenes?.length || 0} scenes\nHook: ${pack.openingHook}`;
                      onSaveToPlanner(pack.topic, note, "In progress");
                      onToast("Transferred to Content Planner (In Progress / Scripting stage).", "success");
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Send to Content Planner (Scripting Stage) →</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#9CA3AF]">
              <Film className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Specify your video parameters on the left to build a complete shoot pack.</p>
            </div>
          )}
        </div>
      </div>

      {pack && (
        <VideoPlayerModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          pack={pack}
          modelName={modelName}
          source={source}
        />
      )}
    </div>
  );
};
