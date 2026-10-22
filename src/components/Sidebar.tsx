"use client";

import React from "react";
import {
  LayoutDashboard,
  Compass,
  ScanEye,
  Sparkles,
  DollarSign,
  Video,
  FileEdit,
  Activity,
  FileText,
  Plus,
  BookOpen,
  PanelLeftClose
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  planCount: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrinciples: () => void;
  onNewResearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  planCount,
  isOpen,
  onClose,
  onOpenPrinciples,
  onNewResearch,
}) => {
  const mainNavigation = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, badge: undefined },
    { id: "discover", label: "Channel Intel", icon: Compass, badge: undefined },
    { id: "audit", label: "Channel Audit", icon: ScanEye, badge: undefined },
    { id: "opportunities", label: "Opportunities", icon: Sparkles, badge: undefined },
    { id: "revenue", label: "Revenue Engine", icon: DollarSign, badge: "PRO" },
    { id: "production", label: "Production Studio", icon: Video, badge: "AI" },
    { id: "planner", label: "Content Planner", icon: FileEdit, badge: planCount > 0 ? `${planCount}` : undefined },
    { id: "diagnosis", label: "Performance Clinic", icon: Activity, badge: undefined },
    { id: "strategy", label: "Video Strategy", icon: FileText, badge: undefined },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Floating Outcrowd-styled sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#F7F8FA] border-r border-[#E8EAEE] flex flex-col justify-between z-50 transition-all duration-200 ease-in-out p-4 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Top Logo Emblem */}
          <div className="flex items-center justify-between px-2 py-3 mb-3">
            <button
              onClick={() => onSelectView("overview")}
              className="flex items-center gap-3 cursor-pointer text-left group"
            >
              {/* Outcrowd Dual-Pill Emblem */}
              <div className="w-9 h-9 rounded-2xl bg-white border border-[#E2E5EB] shadow-xs flex items-center justify-center p-1.5 group-hover:shadow-sm transition">
                <div className="flex items-center gap-0.5">
                  <div className="w-2.5 h-5 bg-[#3B82F6] rounded-full" />
                  <div className="w-2.5 h-3.5 bg-[#93C5FD] rounded-full" />
                </div>
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-[#111827]">
                  Creator<span className="text-[#3B82F6]">Lens</span>
                </span>
                <span className="text-[10px] text-[#8C95A6] block -mt-1 font-medium">
                  Studio Workspace
                </span>
              </div>
            </button>

            <button
              onClick={onClose}
              aria-label="Toggle sidebar"
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/50 transition lg:hidden"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* "+ New Research" Pill Button */}
          <div className="px-1 py-1 mb-4">
            <button
              onClick={() => {
                onNewResearch();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-[#F2F4F8] text-[#1F2937] border border-[#E2E5EB] hover:border-[#CBD2E1] rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>New Research</span>
            </button>
          </div>

          {/* Section: Workspace Navigation */}
          <div className="px-2 pb-1.5 text-[11px] font-bold text-[#8C95A6] uppercase tracking-wider">
            Workspace
          </div>

          <nav className="space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-white text-[#111827] shadow-xs border border-[#E2E5EB]"
                      : "text-[#64748B] hover:text-[#111827] hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-[#3B82F6]" : "text-[#94A3B8]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badge === "PRO"
                          ? "bg-[#FEF3C7] text-[#D97706]"
                          : item.badge === "AI"
                          ? "bg-[#E0E7FF] text-[#4F46E5]"
                          : "bg-[#E2E8F0] text-[#475569]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Studio Principles */}
        <div className="pt-3 border-t border-[#E8EAEE] space-y-1.5 px-1">
          <button
            onClick={onOpenPrinciples}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#111827] hover:bg-white/60 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#94A3B8]" />
            <span>Studio Principles</span>
          </button>
        </div>
      </aside>
    </>
  );
};
