"use client";

import React, { useState } from "react";
import { Activity, ArrowUpRight, Copy, Check, Info, ShieldCheck, Sparkles, Send, Lightbulb, CheckCircle2 } from "lucide-react";
import { DiagnosisResult } from "@/types";

interface ClinicViewProps {
  onSaveIdea: (title: string, desc: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const ClinicView: React.FC<ClinicViewProps> = ({ onSaveIdea, onToast }) => {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("long");
  const [source, setSource] = useState("Search");
  const [windowDays, setWindowDays] = useState("7");

  const [pNow, setPNow] = useState(4.2);
  const [pBase, setPBase] = useState(5.0);
  const [rNow, setRNow] = useState(35.0);
  const [rBase, setRBase] = useState(40.0);
  const [vNow, setVNow] = useState(1200);
  const [vBase, setVBase] = useState(1500);

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const isShort = format === "short";
  const packagingMetricLabel = isShort ? "Shorts stayed-to-watch rate (%)" : "Impressions click-through rate (%)";

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    if (newFormat === "short" && source !== "Shorts feed") {
      setSource("Shorts feed");
    } else if (newFormat !== "short" && source === "Shorts feed") {
      setSource("Search");
    }
  };

  const metricDelta = (current: number, baseline: number) => {
    if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline <= 0) {
      return { delta: null, label: "Baseline needed", detail: "Add a non-zero baseline" };
    }
    const d = (current - baseline) / baseline;
    return {
      delta: d,
      label: d > 0.15 ? "Above own baseline" : d < -0.15 ? "Below own baseline" : "Around own baseline",
      detail: (d >= 0 ? "+" : "") + Math.round(d * 100) + "% vs baseline",
    };
  };

  const runDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    const nums = [pNow, pBase, rNow, rBase, vNow, vBase];
    if (nums.some((n) => !Number.isFinite(n) || n < 0) || [pNow, pBase, rNow, rBase].some((n) => n > 100)) {
      onToast("Enter valid percentages from 0–100 and non-negative view counts.", "error");
      return;
    }
    if (pBase === 0 || rBase === 0) {
      onToast("Enter non-zero baseline percentages to compare performance.", "error");
      return;
    }

    const p = metricDelta(pNow, pBase);
    const r = metricDelta(rNow, rBase);
    const v = metricDelta(vNow, vBase);

    let heading = "Results are mixed or close to your normal range.";
    let recommendation =
      "Change one variable at a time, then compare the next upload with videos of similar format, age, and traffic source.";
    const steps = [
      "Compare this video with similar-length uploads published around the same period.",
      "Review the retention graph and traffic-source mix before changing the title.",
      "Write down one hypothesis and one change so the next upload teaches you something.",
    ];

    if (p.delta !== null && r.delta !== null && p.delta < -0.15 && r.delta >= -0.1) {
      heading = "The packaging signal is below your baseline.";
      recommendation =
        "The people who watch appear to stay at a rate close to your normal result, while the click/stay signal is lower. Test a clearer title and thumbnail that explain the specific viewer outcome without changing the video promise.";
      steps[0] = "Make the audience and outcome more specific in the title.";
      steps[1] = "Use one clear thumbnail focal point that supports the title rather than repeating the same words.";
      steps[2] = "For the next comparable video, change packaging first and keep the opening structure similar.";
    } else if (p.delta !== null && r.delta !== null && p.delta >= -0.1 && r.delta < -0.15) {
      heading = "Review the opening and promise match.";
      recommendation =
        "The packaging signal is around or above your baseline, but average viewing is lower. People may be clicking and not quickly finding the value they expected. Check whether the first 15–30 seconds deliver the title promise.";
      steps[0] = "Show the promised result or problem immediately.";
      steps[1] = "Remove long setup and explain only what the viewer needs to start.";
      steps[2] = "Use retention dips to find the first moment viewers lose interest.";
    } else if (p.delta !== null && r.delta !== null && p.delta < -0.15 && r.delta < -0.15) {
      heading = "Review topic fit and the first moments.";
      recommendation =
        "Both signals are below your own baseline. This does not identify a single cause. Re-check whether the idea is specific to the intended audience, whether the title makes the value clear, and whether the opening delivers quickly.";
      steps[0] = "Narrow the video idea to one clear audience problem.";
      steps[1] = "Make the first 15–30 seconds demonstrate the outcome and start solving the problem.";
      steps[2] = "Use a title and thumbnail that promise only what the video actually delivers.";
    } else if (p.delta !== null && r.delta !== null && p.delta > 0.15 && r.delta > 0.15) {
      heading = "This video is outperforming your baseline on both signals.";
      recommendation =
        "The packaging and viewing metrics are both stronger than your usual results. Study the audience problem and structure that may have helped, then create a useful follow-up with a new angle rather than copying this video.";
      steps[0] = "Identify which viewer question or practical example made the video useful.";
      steps[1] = "Plan a follow-up that answers the next logical step.";
      steps[2] = "Keep the delivery and pacing style that worked for this audience.";
    }

    setDiagnosis({
      topic: topic.trim() || "Untitled video test",
      period: `First ${windowDays} days`,
      isShort,
      source,
      metricName: packagingMetricLabel,
      pNow,
      pBase,
      rNow,
      rBase,
      vNow,
      vBase,
      pDelta: p,
      rDelta: r,
      vDelta: v,
      heading,
      recommendation,
      steps,
    });

    onToast("Performance diagnosed against your baseline.", "success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Retention & Packaging Clinic</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Diagnose CTR vs Retention Drops
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Compare your video’s metrics against your private YouTube Studio median to isolate whether the issue is title packaging or opening retention.
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Diagnosis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <form
          onSubmit={runDiagnosis}
          className="lg:col-span-5 bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4"
        >
          <div className="text-sm font-bold text-[#111827] border-b border-[#F0F2F5] pb-3">
            Input YouTube Studio Metrics
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
              Video Title or Working Concept
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Build an AI Agent in 15 Minutes"
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => handleFormatChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none"
              >
                <option value="long">Long-form video</option>
                <option value="short">YouTube Short</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Window</label>
              <select
                value={windowDays}
                onChange={(e) => setWindowDays(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#374151] focus:outline-none"
              >
                <option value="7">First 7 days</option>
                <option value="14">First 14 days</option>
                <option value="28">First 28 days</option>
              </select>
            </div>
          </div>

          {/* Metric Comparison Inputs */}
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E8EAEE] space-y-2">
              <span className="text-[11px] font-bold text-[#111827] block">
                1. Click-Through Rate (CTR)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#6B7280]">Current Video (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={pNow}
                    onChange={(e) => setPNow(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-white border border-[#E2E5EB] rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7280]">Median Baseline (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={pBase}
                    onChange={(e) => setPBase(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-white border border-[#E2E5EB] rounded-lg text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E8EAEE] space-y-2">
              <span className="text-[11px] font-bold text-[#111827] block">
                2. Average Retention / Viewed (%)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#6B7280]">Current Video (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={rNow}
                    onChange={(e) => setRNow(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-white border border-[#E2E5EB] rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7280]">Median Baseline (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={rBase}
                    onChange={(e) => setRBase(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-white border border-[#E2E5EB] rounded-lg text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
          >
            Diagnose Video Signals →
          </button>
        </form>

        {/* Right Column: Diagnostic Results (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="text-sm font-bold text-[#111827] border-b border-[#F0F2F5] pb-3">
            Diagnostic Assessment
          </div>

          {diagnosis ? (
            <div className="space-y-5">
              <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[22px]">
                <h3 className="text-sm font-bold text-[#1E40AF] mb-1">
                  {diagnosis.heading}
                </h3>
                <p className="text-xs text-[#1E3A8A] leading-relaxed">
                  {diagnosis.recommendation}
                </p>
              </div>

              {/* Actionable Directives */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-[#111827] block">
                  Prescribed Actions for Next Upload:
                </span>
                {diagnosis.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#4B5563]">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#F0F2F5]">
                <button
                  onClick={() => onSaveIdea(diagnosis.topic, diagnosis.recommendation)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Save Follow-up Hypothesis to Planner →</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#9CA3AF]">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Enter your Studio percentages on the left and run diagnosis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
