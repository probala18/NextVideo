"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  ExternalLink,
  Film,
  Scissors,
  Eye,
  BarChart2,
  Bookmark,
} from "lucide-react";

interface LearningFeedbackViewProps {
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const LearningFeedbackView: React.FC<LearningFeedbackViewProps> = ({ onToast }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Snapshot modal state
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapViews, setSnapViews] = useState("");
  const [snapImpressions, setSnapImpressions] = useState("");
  const [snapCtr, setSnapCtr] = useState("");
  const [snapWatchTime, setSnapWatchTime] = useState("");
  const [isSubmittingSnapshot, setIsSubmittingSnapshot] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/feedback");
      const json = await res.json();
      if (json.success) {
        setRecords(json.records || []);
      }
    } catch {
      onToast("Failed to load historical optimization records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAddSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;

    setIsSubmittingSnapshot(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "snapshot",
          recordId: selectedRecordId,
          snapshot: {
            views: Number(snapViews) || 0,
            impressions: Number(snapImpressions) || undefined,
            ctrPercent: Number(snapCtr) || undefined,
            watchTimeMinutes: Number(snapWatchTime) || undefined,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to record snapshot");
      }

      onToast("Subsequent performance snapshot recorded!", "success");
      setIsSnapshotModalOpen(false);
      setSnapViews("");
      setSnapImpressions("");
      setSnapCtr("");
      setSnapWatchTime("");
      fetchHistory();
    } catch (err: any) {
      onToast(err.message || "Failed to save snapshot", "error");
    } finally {
      setIsSubmittingSnapshot(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Continuous Learning & Feedback Loop</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
            Historical Optimization & Performance Outcomes
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
            Tracks past video recommendations, creator-approved edits, AI models used, and subsequent YouTube analytics to continuously refine future suggestions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          disabled={isLoading}
          className="px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#E8EAEE] p-12 text-center shadow-xs space-y-3">
          <Bookmark className="w-8 h-8 text-[#9CA3AF] mx-auto" />
          <h3 className="text-sm font-bold text-[#111827]">No Optimization Records Yet</h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            When you approve video edits and stage or publish videos in NextVideo, your choices and timeline optimizations will be captured here for long-term learning.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-[24px] border border-[#E8EAEE] p-6 shadow-xs space-y-4 transition hover:border-[#BFDBFE]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F2F5] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#111827]">
                      {rec.approvedTitle || rec.originalTitle}
                    </span>
                    {rec.publishedToYouTube && (
                      <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] rounded-full text-[10px] font-bold">
                        Published to YouTube
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B7280] mt-1">
                    <span>Approved on {new Date(rec.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Model: <strong>{rec.providerUsed}</strong> ({rec.modelVersionUsed})</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordId(rec.id);
                    setIsSnapshotModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Performance Snapshot</span>
                </button>
              </div>

              {/* Optimization Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                  <span className="text-[10px] text-[#6B7280] block mb-0.5">Timeline Cuts</span>
                  <span className="font-bold text-[#111827]">{rec.appliedCutsCount} cuts</span>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                  <span className="text-[10px] text-[#6B7280] block mb-0.5">Dead-Air Pruned</span>
                  <span className="font-bold text-[#059669]">{Math.round(rec.timeSavedSeconds)}s saved</span>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                  <span className="text-[10px] text-[#6B7280] block mb-0.5">Snapshots Logged</span>
                  <span className="font-bold text-[#111827]">{rec.subsequentSnapshots?.length || 0} checks</span>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#F0F2F5]">
                  <span className="text-[10px] text-[#6B7280] block mb-0.5">Latest Views</span>
                  <span className="font-bold text-[#2563EB]">
                    {rec.subsequentSnapshots?.length
                      ? rec.subsequentSnapshots[rec.subsequentSnapshots.length - 1].views?.toLocaleString()
                      : "Pending"}
                  </span>
                </div>
              </div>

              {/* Evaluation Notes */}
              {rec.evaluationNotes?.length > 0 && (
                <div className="space-y-1 text-xs">
                  {rec.evaluationNotes.map((note: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-[#4B5563]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Snapshot Modal */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Log Subsequent Performance Snapshot
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Enter real metrics from YouTube Studio to measure recommendation outcomes.
              </p>
            </div>

            <form onSubmit={handleAddSnapshot} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                  Observed Views *
                </label>
                <input
                  type="number"
                  required
                  value={snapViews}
                  onChange={(e) => setSnapViews(e.target.value)}
                  placeholder="e.g. 1540"
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#111827]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                    Impressions (Optional)
                  </label>
                  <input
                    type="number"
                    value={snapImpressions}
                    onChange={(e) => setSnapImpressions(e.target.value)}
                    placeholder="e.g. 18200"
                    className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#111827]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                    CTR % (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={snapCtr}
                    onChange={(e) => setSnapCtr(e.target.value)}
                    placeholder="e.g. 6.8"
                    className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                  Total Watch Time Minutes (Optional)
                </label>
                <input
                  type="number"
                  value={snapWatchTime}
                  onChange={(e) => setSnapWatchTime(e.target.value)}
                  placeholder="e.g. 480"
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#111827]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSnapshotModalOpen(false)}
                  className="px-4 py-2 bg-[#F3F4F6] text-[#4B5563] rounded-full text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSnapshot}
                  className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>{isSubmittingSnapshot ? "Saving..." : "Save Snapshot"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
