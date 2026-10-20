"use client";

import React, { useState } from "react";
import { Kanban, Plus, Download, Trash2, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { PlanItem } from "@/types";
import { AnimatedTabs } from "./AnimatedTabs";

interface PlannerViewProps {
  plans: PlanItem[];
  onAddIdeaClick: () => void;
  onUpdateStatus: (id: string, newStatus: PlanItem["status"]) => void;
  onDeletePlan: (id: string) => void;
  onExportPlans: () => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  plans,
  onAddIdeaClick,
  onUpdateStatus,
  onDeletePlan,
  onExportPlans,
}) => {
  const [filter, setFilter] = useState("all");

  const filterTabs = [
    { id: "all", label: "All ideas", count: plans.length },
    { id: "Idea", label: "Ideas", count: plans.filter((p) => p.status === "Idea").length },
    { id: "In progress", label: "In progress", count: plans.filter((p) => p.status === "In progress").length },
    { id: "Ready to record", label: "Ready to record", count: plans.filter((p) => p.status === "Ready to record").length },
    { id: "Published", label: "Published", count: plans.filter((p) => p.status === "Published").length },
  ];

  const filteredPlans = filter === "all" ? plans : plans.filter((p) => p.status === filter);

  const inProgressCount = plans.filter((p) => p.status === "In progress").length;
  const readyCount = plans.filter((p) => p.status === "Ready to record").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-ink-800">
        <div>
          <div className="text-xs font-mono text-studio-orange">YOUR PUBLISHING PIPELINE</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-50 mt-1">
            A plan you can actually follow.
          </h1>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">
            Save video ideas, give each one a next step, and build consistency without burning out.
          </p>
        </div>

        <button
          onClick={onAddIdeaClick}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-lg text-xs font-mono font-bold tracking-wide transition self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ ADD AN IDEA</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-ink-900 border border-ink-800 rounded-xl font-mono">
          <div className="text-[10px] text-ink-500">IDEAS SAVED</div>
          <div className="text-2xl font-extrabold text-ink-50 mt-1">{plans.length}</div>
          <div className="text-[11px] text-ink-400 mt-1">Total in your pipeline</div>
        </div>

        <div className="p-4 bg-ink-900 border border-ink-800 rounded-xl font-mono">
          <div className="text-[10px] text-ink-500">IN PROGRESS</div>
          <div className="text-2xl font-extrabold text-studio-orange mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-ink-400 mt-1">Scripting / structuring</div>
        </div>

        <div className="p-4 bg-ink-900 border border-ink-800 rounded-xl font-mono">
          <div className="text-[10px] text-ink-500">READY TO RECORD</div>
          <div className="text-2xl font-extrabold text-studio-emerald mt-1">{readyCount}</div>
          <div className="text-[11px] text-ink-400 mt-1">Production pack prepared</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnimatedTabs
          tabs={filterTabs}
          activeId={filter}
          onChange={setFilter}
          layoutId="plannerFilterTabs"
        />

        <button
          onClick={onExportPlans}
          disabled={plans.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 hover:bg-ink-800 border border-ink-700 text-ink-200 rounded text-xs font-mono transition disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5 text-studio-orange" />
          <span>Export plan (.csv)</span>
        </button>
      </div>

      {/* Ideas List */}
      {filteredPlans.length > 0 ? (
        <div className="space-y-3">
          {filteredPlans.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-ink-900 border border-ink-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-ink-700 transition"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5 ${
                    item.status === "Ready to record"
                      ? "bg-studio-emerald/10 border-studio-emerald text-studio-emerald"
                      : item.status === "In progress"
                      ? "bg-studio-orange/10 border-studio-orange text-studio-orange"
                      : "bg-ink-950 border-ink-800 text-ink-400"
                  }`}
                >
                  {item.status === "Ready to record" ? "REC" : "IDEA"}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-ink-100">{item.title}</h3>
                  <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">
                    {item.note || "No note yet. Add a specific audience promise before recording."}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-500 font-mono">
                    <span>Added {item.created}</span>
                    {item.score && (
                      <>
                        <span>•</span>
                        <span className="text-studio-orange">Priority score: {item.score}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <select
                  value={item.status}
                  onChange={(e) => onUpdateStatus(item.id, e.target.value as PlanItem["status"])}
                  className="px-2.5 py-1.5 bg-ink-950 border border-ink-700 rounded text-xs font-mono text-ink-200 focus:outline-none cursor-pointer"
                >
                  <option value="Idea">Idea</option>
                  <option value="In progress">In progress</option>
                  <option value="Ready to record">Ready to record</option>
                  <option value="Published">Published</option>
                </select>

                <button
                  onClick={() => onDeletePlan(item.id)}
                  title="Delete from plan"
                  className="p-1.5 text-ink-400 hover:text-studio-crimson hover:bg-ink-950 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-ink-900 border border-ink-800 rounded-xl text-center space-y-3 font-mono">
          <div className="w-12 h-12 rounded-xl bg-ink-800 border border-ink-700 text-studio-orange flex items-center justify-center mx-auto">
            <Kanban className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-ink-100">Your next video starts with an idea.</h2>
          <p className="text-xs text-ink-400 max-w-sm mx-auto">
            Save an opportunity from research or add a custom video idea to build your publishing pipeline.
          </p>
          <button
            onClick={onAddIdeaClick}
            className="px-4 py-2 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-md text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add your first idea</span>
          </button>
        </div>
      )}
    </div>
  );
};
