"use client";

import React, { useState } from "react";
import { Activity, ArrowUpRight, Copy, Check, Info, ShieldCheck, Sparkles } from "lucide-react";
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
      steps[0] = "Read comments and look for the next question viewers ask.";
      steps[1] = "Build a follow-up that continues the learning journey or solves the next problem.";
      steps[2] = "Keep tracking results at the same age and compare against a similar format.";
    } else if (r.delta !== null && r.delta < -0.15) {
      heading = "Review delivery and pacing.";
      recommendation =
        "Average percentage viewed is below your normal result. Check whether the video spends too long before its payoff, repeats ideas, or moves too quickly through a difficult step. The retention graph can show where to focus.";
      steps[0] = "Inspect the first meaningful retention drop.";
      steps[1] = "Tighten that section rather than cutting randomly.";
      steps[2] = "Make the next tutorial easier to follow with examples or clearer chapter transitions.";
    } else if (p.delta !== null && p.delta < -0.15) {
      heading = "Test a clearer packaging direction.";
      recommendation =
        "The packaging signal is lower than your own baseline. Compare traffic sources and audience intent first, then test one more specific title or thumbnail concept.";
      steps[0] = "Compare the packaging signal with a similar traffic source and format, not only the channel-wide average.";
      steps[1] = "Use wording that signals who the video helps and what they will learn.";
      steps[2] = "Keep the core video promise accurate.";
    }

    if (v.delta !== null && v.delta < -0.15 && p.delta !== null && p.delta >= 0 && r.delta !== null && r.delta >= 0) {
      steps.push(
        "Views are below baseline while the other entered signals are healthy: inspect impressions or the source breakdown before replacing the packaging. The topic may have a smaller reachable audience or fewer impressions in this time window."
      );
    }
    if (v.delta !== null && v.delta > 0.15 && p.delta !== null && p.delta < 0) {
      steps.push(
        "Views are up even though the packaging metric is lower. A broader audience or traffic-source mix can change CTR, so do not judge CTR in isolation."
      );
    }

    setDiagnosis({
      topic: topic.trim() || "Untitled Video",
      period: `First ${windowDays} days`,
      isShort,
      source,
      heading,
      recommendation,
      steps,
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
    });
    onToast("Performance diagnosis complete.", "success");
  };

  const copyDiagnosisText = () => {
    if (!diagnosis) return;
    const text = [
      `CreatorLens performance review — ${diagnosis.topic}`,
      `Period: ${diagnosis.period}`,
      `Format: ${diagnosis.isShort ? "Short" : "Long-form"}`,
      `Main traffic source: ${diagnosis.source}`,
      `${diagnosis.metricName}: ${diagnosis.pNow}% vs baseline ${diagnosis.pBase}% (${diagnosis.pDelta.detail})`,
      `Average percentage viewed: ${diagnosis.rNow}% vs baseline ${diagnosis.rBase}% (${diagnosis.rDelta.detail})`,
      `Views: ${diagnosis.vNow} vs baseline ${diagnosis.vBase} (${diagnosis.vDelta.detail})`,
      `Finding: ${diagnosis.heading}`,
      `Recommendation: ${diagnosis.recommendation}`,
      `Next steps:`,
      ...diagnosis.steps.map((s) => `- ${s}`),
      `Compare similar publishing ages and traffic sources; this is not a viral-view prediction.`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    onToast("Diagnosis copied to clipboard.", "success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="pb-2 border-b border-ink-800">
        <div className="text-xs font-mono text-studio-orange">VIDEO PERFORMANCE CLINIC</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 mt-1">
          Diagnose with your own data.
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 mt-1">
          Compare a video&apos;s first 7 or 28 days with your own similar videos. Get a practical next experiment—not a made-up algorithm score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (5 cols) */}
        <form
          onSubmit={runDiagnosis}
          className="lg:col-span-5 p-5 bg-ink-900 border border-ink-700 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-ink-800">
            <div>
              <div className="text-[10px] font-mono text-studio-orange">STUDIO METRICS INPUT</div>
              <h2 className="text-sm font-bold text-ink-100">What happened after publishing?</h2>
            </div>
            <Activity className="w-4 h-4 text-studio-orange" />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">
              Video or topic <span className="text-[10px] text-ink-500 font-mono">OPTIONAL</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Build a Python budget tracker"
              maxLength={160}
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => handleFormatChange(e.target.value)}
                className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
              >
                <option value="long">Long-form video</option>
                <option value="short">YouTube Short</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1">Main traffic source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
              >
                <option value="Search">YouTube Search</option>
                <option value="Browse">Browse / Home</option>
                <option value="Suggested">Suggested videos</option>
                <option value="Shorts feed">Shorts feed</option>
                <option value="External">External</option>
                <option value="Mixed">Mixed / not sure</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1">Compare window</label>
            <select
              value={windowDays}
              onChange={(e) => setWindowDays(e.target.value)}
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
            >
              <option value="7">First 7 days</option>
              <option value="28">First 28 days</option>
            </select>
          </div>

          {/* Metric 1: Packaging */}
          <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-2">
            <div className="flex justify-between text-xs">
              <strong className="text-ink-200">{packagingMetricLabel}</strong>
              <span className="text-[10px] font-mono text-studio-orange">Packaging signal</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[10px] text-ink-400 block mb-0.5">This video</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={pNow}
                  onChange={(e) => setPNow(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-ink-900 border border-ink-700 rounded text-ink-100 focus:border-studio-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-ink-400 block mb-0.5">Your usual baseline (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={pBase}
                  onChange={(e) => setPBase(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-ink-900 border border-ink-700 rounded text-ink-100 focus:border-studio-orange focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Metric 2: Retention */}
          <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-2">
            <div className="flex justify-between text-xs">
              <strong className="text-ink-200">Average percentage viewed (%)</strong>
              <span className="text-[10px] font-mono text-studio-emerald">Viewing signal</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[10px] text-ink-400 block mb-0.5">This video</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={rNow}
                  onChange={(e) => setRNow(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-ink-900 border border-ink-700 rounded text-ink-100 focus:border-studio-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-ink-400 block mb-0.5">Your usual baseline (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={rBase}
                  onChange={(e) => setRBase(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-ink-900 border border-ink-700 rounded text-ink-100 focus:border-studio-orange focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Metric 3: Views */}
          <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg space-y-2">
            <div className="flex justify-between text-xs">
              <strong className="text-ink-200">Views in the selected period</strong>
              <span className="text-[10px] font-mono text-studio-blue">Reach signal</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[10px] text-ink-400 block mb-0.5">This video</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={vNow}
                  onChange={(e) => setVNow(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 bg-ink-900 border border-ink-700 rounded text-ink-100 focus:border-studio-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-ink-400 block mb-0.5">Usual similar views</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={vBase}
                  onChange={(e) => setVBase(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 bg-ink-900 border border-ink-700 rounded text-ink-100 focus:border-studio-orange focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-lg text-xs font-mono font-bold tracking-wide transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>DIAGNOSE PERFORMANCE</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>

        {/* Diagnosis Output Column (7 cols) */}
        <div className="lg:col-span-7 p-5 bg-ink-900 border border-ink-700 rounded-xl flex flex-col justify-between space-y-4">
          {diagnosis ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-ink-800">
                <div className="text-[10px] font-mono text-studio-orange">PERFORMANCE REVIEW</div>
                <h2 className="text-base font-bold text-ink-50">{diagnosis.topic}</h2>
                <div className="text-xs text-ink-400 font-mono mt-0.5">
                  {diagnosis.period} · {diagnosis.isShort ? "Short" : "Long-form"} · {diagnosis.source} traffic
                </div>
                <div className="mt-2 p-2.5 bg-ink-950 border border-ink-800 rounded text-xs font-mono text-studio-orange flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-studio-orange animate-pulse" />
                  <strong>{diagnosis.heading}</strong>
                </div>
              </div>

              {/* Comparison cards */}
              <div className="space-y-2 font-mono text-xs">
                {/* Packaging Row */}
                <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-ink-400 text-[11px]">{diagnosis.metricName}</div>
                    <div className="text-ink-100 font-bold mt-0.5">
                      This video: {diagnosis.pNow}% vs Baseline: {diagnosis.pBase}%
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      (diagnosis.pDelta.delta || 0) >= 0
                        ? "bg-studio-emerald/10 text-studio-emerald border border-studio-emerald/30"
                        : "bg-studio-crimson/10 text-studio-crimson border border-studio-crimson/30"
                    }`}
                  >
                    {diagnosis.pDelta.detail}
                  </span>
                </div>

                {/* Retention Row */}
                <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-ink-400 text-[11px]">Average percentage viewed</div>
                    <div className="text-ink-100 font-bold mt-0.5">
                      This video: {diagnosis.rNow}% vs Baseline: {diagnosis.rBase}%
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      (diagnosis.rDelta.delta || 0) >= 0
                        ? "bg-studio-emerald/10 text-studio-emerald border border-studio-emerald/30"
                        : "bg-studio-crimson/10 text-studio-crimson border border-studio-crimson/30"
                    }`}
                  >
                    {diagnosis.rDelta.detail}
                  </span>
                </div>

                {/* Views Row */}
                <div className="p-3 bg-ink-950 border border-ink-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-ink-400 text-[11px]">Views in selected window</div>
                    <div className="text-ink-100 font-bold mt-0.5">
                      This video: {diagnosis.vNow.toLocaleString()} vs Baseline: {diagnosis.vBase.toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      (diagnosis.vDelta.delta || 0) >= 0
                        ? "bg-studio-emerald/10 text-studio-emerald border border-studio-emerald/30"
                        : "bg-studio-crimson/10 text-studio-crimson border border-studio-crimson/30"
                    }`}
                  >
                    {diagnosis.vDelta.detail}
                  </span>
                </div>
              </div>

              {/* Recommendation & Steps */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-[10px] font-mono text-ink-500">RECOMMENDED EXPERIMENT</div>
                  <p className="text-xs text-ink-200 mt-1 leading-relaxed bg-ink-950 p-3 border border-ink-800 rounded">
                    {diagnosis.recommendation}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-ink-500 mb-1.5">NEXT STEPS TO TEST</div>
                  <div className="space-y-1.5">
                    {diagnosis.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-ink-300">
                        <span className="font-mono text-studio-orange font-bold">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-ink-800">
                <button
                  type="button"
                  onClick={() =>
                    onSaveIdea(
                      `Follow-up: ${diagnosis.topic}`,
                      `Performance review: ${diagnosis.recommendation} Next experiment: ${diagnosis.steps[0]}`
                    )
                  }
                  className="px-4 py-2 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5"
                >
                  <span>Save follow-up idea</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={copyDiagnosisText}
                  className="px-4 py-2 bg-ink-800 hover:bg-ink-700 text-ink-200 border border-ink-700 rounded-md text-xs font-mono transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy diagnosis</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 font-mono">
              <div className="w-12 h-12 rounded-xl bg-ink-800 border border-ink-700 text-studio-orange flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-ink-100">Your diagnosis will appear here.</h2>
              <p className="text-xs text-ink-400 max-w-sm">
                Enter your YouTube Studio numbers on the left to identify whether packaging, retention drop, or audience size is the primary constraint.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
