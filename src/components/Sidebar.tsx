"use client";

import React from "react";
import {
  LayoutDashboard,
  Search,
  ScanEye,
  Activity,
  Sparkles,
  FileText,
  Video,
  Kanban,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  X,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  planCount: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrinciples: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  planCount,
  isOpen,
  onClose,
  onOpenPrinciples,
}) => {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "discover", label: "Channel discovery", icon: Search },
    { id: "audit", label: "Channel audit", icon: ScanEye },
    { id: "revenue", label: "Revenue analytics", icon: DollarSign, badge: "NEW" },
    { id: "diagnosis", label: "Performance clinic", icon: Activity },
    { id: "opportunities", label: "Video opportunities", icon: Sparkles },
    { id: "strategy", label: "Video strategy", icon: FileText },
    { id: "production", label: "Production studio", icon: Video, badge: "AI" },
    { id: "planner", label: "Content planner", icon: Kanban, count: planCount },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-ink-950 border-r border-ink-800 flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between p-4 border-b border-ink-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ink-900 border border-ink-700 flex items-center justify-center p-1.5">
                <div className="flex gap-0.5 items-end h-full">
                  <span className="w-1 bg-studio-orange h-3/5 rounded-full" />
                  <span className="w-1 bg-studio-orange h-full rounded-full" />
                  <span className="w-1 bg-studio-orange h-4/5 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold tracking-tight text-ink-50 text-sm">
                  <span>creator</span>
                  <span className="text-ink-400 font-light">lens</span>
                  <span className="text-[9px] px-1 py-0.2 bg-ink-800 text-studio-orange font-mono rounded border border-ink-700">
                    STUDIO
                  </span>
                </div>
                <div className="text-[10px] text-ink-500 font-mono">INTELLIGENCE DESK</div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close menu"
              className="lg:hidden p-1 text-ink-400 hover:text-ink-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-2 text-[10px] font-mono text-ink-500 tracking-wider">
            WORKSPACE NAVIGATION
          </div>

          {/* Navigation Links */}
          <nav className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? "bg-ink-850 text-ink-50 border border-ink-700 font-semibold"
                      : "text-ink-400 hover:text-ink-200 hover:bg-ink-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-studio-orange" : "text-ink-500"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-orange text-white font-bold">
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-ink-800 text-studio-orange border border-ink-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom */}
        <div className="p-3 border-t border-ink-800 space-y-3">
          {/* Help & Principles Card */}
          <div className="p-3 bg-ink-900 border border-ink-800 rounded-lg">
            <div className="flex items-center gap-1.5 text-studio-orange text-xs font-mono mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CREATOR PRINCIPLE</span>
            </div>
            <p className="text-xs text-ink-300 font-medium leading-relaxed">
              Grow with clarity. Learn from what works. Create what only you can.
            </p>
            <button
              onClick={onOpenPrinciples}
              className="mt-2 text-[11px] text-studio-orange hover:underline flex items-center gap-1 font-mono"
            >
              Read guidelines <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* User mini card */}
          <div className="flex items-center justify-between p-2 bg-ink-900 border border-ink-800 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-ink-800 border border-ink-700 text-ink-300 flex items-center justify-center font-mono text-[10px] font-bold">
                CL
              </div>
              <div className="leading-tight">
                <div className="text-xs text-ink-200 font-medium">Creator Lab</div>
                <div className="text-[10px] text-ink-500 font-mono">Personal Studio</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-studio-emerald" />
          </div>
        </div>
      </aside>
    </>
  );
};
