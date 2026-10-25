"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Zap,
} from "lucide-react";

interface ScorecardViewProps {
  initialTitle?: string;
  initialTopic?: string;
  initialHook?: string;
  onApplyTitle?: (title: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  initialTitle = "",
  initialTopic = "AI Agents & Next.js",
  initialHook = "",
  onApplyTitle,
  onToast,
}) => {
  const [title, setTitle] = useState(initialTitle || "How I Built an Autonomous AI Agent in Next.js in 10 Minutes");
  const [hook, setHook] = useState(initialHook || "In the next 10 minutes, you will build an autonomous AI agent that runs inside your Next.js app.");
  const [description, setDescription] = useState("In this full tutorial we build an autonomous AI agent in Next.js.\n0:00 Intro\n1:20 Architecture\n4:15 Code Walkthrough\n#nextjs #ai");
  const [niche, setNiche] = useState(initialTopic || "AI Agents & Next.js");
  const [durationSecs, setDurationSecs] = useState(620);
  const [deadAirPercent, setDeadAirPercent] = useState(8);
  const [cutsCount, setCutsCount] = useState(12);

  const [isLoading, setIsLoading] = useState(false);
  const [scorecard, setScorecard] = useState<any>(null);

  const evaluateScores = async () => {
    if (!title.trim()) {
      onToast("Video title is required to evaluate scores.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/scoring/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          first15sSpeech: hook.trim(),
          description: description.trim(),
          videoDurationSecs: Number(durationSecs) || 600,
          deadAirReductionPercent: Number(deadAirPercent) || 0,
          edlCutsCount: Number(cutsCount) || 0,
          nicheOrTopic: niche.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to calculate optimization scores");
      }
      setScorecard(json.scorecard);
      onToast("Optimization score calculated successfully!", "success");
    } catch (err: any) {
      onToast(err.message || "Evaluation error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Deterministic Optimization Scoring Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
            Pattern Diagnostic & Transparent Scorecard
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
            Calculates an auditable recommendation score comparing your title, spoken opening hook, timeline pacing, and metadata against competitor cohorts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
              Video Title to Audit
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
              <span>{title.length} characters</span>
              <span className={title.length > 50 ? "text-[#D97706]" : "text-[#059669]"}>
                {title.length > 50 ? "May truncate on mobile" : "Safe mobile search length"}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
              Target Niche / Topic Cohort
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
              First 15 Seconds Spoken Transcript (Opening Hook)
            </label>
            <textarea
              rows={2}
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="The exact words spoken in the first 15 seconds of your video..."
              className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <Clock className="w-3.5 h-3.5" />
            <span>Target Duration: {Math.floor(durationSecs / 60)}m • Pacing Cleanup: -{deadAirPercent}%</span>
          </div>

          <button
            type="button"
            onClick={evaluateScores}
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-300 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <Zap className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Auditing Pattern Scores..." : "Audit Video Optimization Score →"}</span>
          </button>
        </div>
      </div>

      {/* Scorecard Results */}
      {scorecard && (
        <div className="space-y-6">
          {/* Top Gauge Banner */}
          <div className="bg-white rounded-[24px] border border-[#E8EAEE] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-md ${
                  scorecard.overallScore >= 80
                    ? "bg-[#059669]"
                    : scorecard.overallScore >= 65
                    ? "bg-[#2563EB]"
                    : "bg-[#D97706]"
                }`}
              >
                <span className="text-2xl font-black">{scorecard.overallScore}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">/ 100</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#111827]">
                    Overall Optimization Score
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      scorecard.overallScore >= 80
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : scorecard.overallScore >= 65
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : "bg-[#FEF3C7] text-[#D97706]"
                    }`}
                  >
                    {scorecard.overallVerdict}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Confidence: <strong>{scorecard.confidence.level}</strong> (analyzed {scorecard.confidence.dataPointsAnalyzed} data points).
                  Calculated deterministically without simulated metrics.
                </p>
              </div>
            </div>

            {/* Cohort Comparison */}
            {scorecard.comparisonAgainstCohort && (
              <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#F0F2F5] text-xs space-y-1 text-right md:min-w-[240px]">
                <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Cohort Comparison
                </div>
                <div className="font-bold text-[#111827]">
                  {scorecard.comparisonAgainstCohort.durationAssessment}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  Cohort Median: ~{Math.round(scorecard.comparisonAgainstCohort.cohortMedianDurationSecs / 60)} mins
                </div>
              </div>
            )}
          </div>

          {/* Component Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(scorecard.components || {}).map(([key, comp]: [string, any]) => (
              <div
                key={key}
                className="bg-white rounded-[24px] border border-[#E8EAEE] p-5 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#111827] uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      ({Math.round(comp.weight * 100)}% weight)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        comp.score >= 80
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : comp.score >= 65
                          ? "bg-[#EFF6FF] text-[#2563EB]"
                          : "bg-[#FEF3C7] text-[#D97706]"
                      }`}
                    >
                      {comp.label}
                    </span>
                    <span className="text-xs font-black text-[#111827]">{comp.score}/100</span>
                  </div>
                </div>

                {/* Indicators list */}
                <div className="space-y-2.5">
                  {comp.indicators?.map((ind: any, i: number) => (
                    <div key={i} className="p-3 bg-[#F9FAFB] rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-[#1F2937]">
                        <span>{ind.name}</span>
                        <span className="text-[#3B82F6]">{ind.score}/100</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] leading-snug">
                        {ind.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Transparency & Limitations Alert */}
          {scorecard.confidence.limitations?.length > 0 && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-start gap-3 text-xs">
              <HelpCircle className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
              <div className="space-y-1 text-[#475569]">
                <span className="font-bold text-[#1E293B]">Auditing Limitations & Disclosures:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {scorecard.confidence.limitations.map((lim: string, i: number) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
