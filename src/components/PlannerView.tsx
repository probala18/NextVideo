"use client";

import React, { useState } from "react";
import { Kanban, Plus, Download, Trash2, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { PlanItem } from "@/types";

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
    { id: "all", label: "All Milestones", count: plans.length },
    { id: "Idea", label: "Idea", count: plans.filter((p) => p.status === "Idea").length },
    { id: "In progress", label: "In Progress", count: plans.filter((p) => p.status === "In progress").length },
    { id: "Ready to record", label: "Ready to Record", count: plans.filter((p) => p.status === "Ready to record").length },
    { id: "Published", label: "Published", count: plans.filter((p) => p.status === "Published").length },
  ];

  const filteredPlans = filter === "all" ? plans : plans.filter((p) => p.status === filter);
  const inProgressCount = plans.filter((p) => p.status === "In progress").length;
  const readyCount = plans.filter((p) => p.status === "Ready to record").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <Kanban className="w-3.5 h-3.5" />
              <span>Production Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Content Pipeline Planner
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Organize video concepts from idea to script, filming, and published releases with zero creative friction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportPlans}
              disabled={plans.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#E2E5EB] rounded-full text-xs font-semibold transition cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onAddIdeaClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Concept</span>
            </button>
          </div>
        </div>

        {/* Outcrowd 3-Column KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 bg-[#F9FAFB] border border-[#E8EAEE] rounded-[20px]">
            <span className="text-[11px] font-bold uppercase text-[#9CA3AF] block">Total Pipeline Concepts</span>
            <span className="text-2xl font-black text-[#111827] mt-1 block">{plans.length}</span>
            <span className="text-[10px] text-[#6B7280] mt-0.5 block">Saved in workspace</span>
          </div>

          <div className="p-4 bg-[#F9FAFB] border border-[#E8EAEE] rounded-[20px]">
            <span className="text-[11px] font-bold uppercase text-[#9CA3AF] block">In Progress</span>
            <span className="text-2xl font-black text-[#3B82F6] mt-1 block">{inProgressCount}</span>
            <span className="text-[10px] text-[#6B7280] mt-0.5 block">Scripting & storyboarding</span>
          </div>

          <div className="p-4 bg-[#F9FAFB] border border-[#E8EAEE] rounded-[20px]">
            <span className="text-[11px] font-bold uppercase text-[#9CA3AF] block">Ready to Record</span>
            <span className="text-2xl font-black text-[#10B981] mt-1 block">{readyCount}</span>
            <span className="text-[10px] text-[#6B7280] mt-0.5 block">A-roll cue cards ready</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-[#F0F2F5]">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                filter === tab.id
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 opacity-75 text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className="p-5 bg-white border border-[#E8EAEE] rounded-[24px] shadow-xs hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    plan.status === "Published"
                      ? "bg-[#DCFCE7] text-[#16A34A]"
                      : plan.status === "Ready to record"
                      ? "bg-[#FEF3C7] text-[#D97706]"
                      : plan.status === "In progress"
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "bg-[#F3F4F6] text-[#6B7280]"
                  }`}
                >
                  {plan.status}
                </span>

                <button
                  onClick={() => onDeletePlan(plan.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition cursor-pointer"
                  title="Delete concept"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-sm font-bold text-[#111827] mb-2 group-hover:text-[#3B82F6] transition">
                {plan.title}
              </h3>

              {plan.note && (
                <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed mb-4 whitespace-pre-wrap">
                  {plan.note}
                </p>
              )}
            </div>

            {/* Bottom Status Mover */}
            <div className="pt-3.5 border-t border-[#F0F2F5] flex items-center justify-between text-xs">
              <span className="text-[10px] text-[#9CA3AF]">
                {new Date(plan.created).toLocaleDateString()}
              </span>

              <select
                value={plan.status}
                onChange={(e) => onUpdateStatus(plan.id, e.target.value as PlanItem["status"])}
                className="bg-[#F9FAFB] border border-[#E2E5EB] rounded-full px-2.5 py-1 text-xs font-semibold text-[#374151] focus:outline-none"
              >
                <option value="Idea">Stage: Idea</option>
                <option value="In progress">Stage: In progress</option>
                <option value="Ready to record">Stage: Ready to record</option>
                <option value="Published">Stage: Published</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
