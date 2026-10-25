"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  PanelLeft,
  Plus,
  Compass,
  LayoutDashboard,
  DollarSign,
  Video,
  Film,
  FileEdit,
  Settings,
} from "lucide-react";
import { ModelSettingsModal } from "./ModelSettingsModal";

interface HeaderProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenPrinciples: () => void;
  onOpenSettings?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  isDark,
  onToggleTheme,
  onOpenPrinciples,
  onOpenSettings,
  onToggleSidebar,
  isSidebarOpen,
  onToast,
}) => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeModel, setActiveModel] = useState("openai/gpt-4o-mini");

  useEffect(() => {
    // Initial status fetch
    fetch("/api/video/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.model) setActiveModel(d.model);
      })
      .catch(() => { });

    // Listen for custom event when model is updated anywhere
    const handleConfigUpdated = (e: any) => {
      if (e.detail?.model) {
        setActiveModel(e.detail.model);
      }
    };

    window.addEventListener("openrouter-config-updated", handleConfigUpdated);
    return () => {
      window.removeEventListener("openrouter-config-updated", handleConfigUpdated);
    };
  }, []);
  const topNavTabs = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "discover", label: "Channel Intel", icon: Compass },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "autonomous-video", label: "Video Agent", icon: Film },
    { id: "production", label: "Studio", icon: Video },
    { id: "planner", label: "Pipeline", icon: FileEdit },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#F7F8FA]/90 backdrop-blur-md border-b border-[#E8EAEE] transition-colors">
      {/* Left side: Sidebar Toggle & Segmented Pill Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-full border border-transparent hover:border-[#E2E5EB] transition cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Outcrowd Segmented Pill Navigator */}
        <nav className="hidden md:flex items-center bg-[#EAECEF] p-1 rounded-full border border-[#DFE2E8] shadow-xs">
          {topNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              currentView === tab.id ||
              (tab.id === "discover" && (currentView === "discover" || currentView === "audit" || currentView === "opportunities")) ||
              (tab.id === "production" && (currentView === "production" || currentView === "strategy" || currentView === "diagnosis"));

            return (
              <button
                key={tab.id}
                onClick={() => onSelectView(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${isActive
                    ? "bg-white text-[#111827] shadow-xs font-bold"
                    : "text-[#64748B] hover:text-[#111827]"
                  }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-80" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Avatar Group, Add Channel Pill, Bell, Sonic Landing */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Creator Avatars Group (Outcrowd style) */}
        <div className="hidden lg:flex items-center -space-x-2">
          <div className="w-7 h-7 rounded-full bg-[#E0E7FF] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#4F46E5] shadow-xs">
            AL
          </div>
          <div className="w-7 h-7 rounded-full bg-[#FEF3C7] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#D97706] shadow-xs">
            MK
          </div>
          <div className="w-7 h-7 rounded-full bg-[#DCFCE7] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#16A34A] shadow-xs">
            JD
          </div>
          <div className="w-6 h-6 rounded-full bg-[#F1F5F9] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#64748B]">
            8+
          </div>
        </div>

        {/* Quick Add Channel Action */}
        <button
          onClick={() => onSelectView("discover")}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F2F4F8] border border-[#E2E5EB] text-xs font-semibold text-[#1F2937] shadow-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Add Channel</span>
        </button>

        {/* Notification Bell */}
        <button
          aria-label="Notifications"
          className="relative p-2 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-full border border-[#E2E5EB] transition shadow-xs cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3B82F6]" />
        </button>

        {/* AI Model & Video Settings Button */}
        <button
          type="button"
          onClick={() => (onOpenSettings ? onOpenSettings() : setIsSettingsModalOpen(true))}
          aria-label="AI Video Model Settings"
          title={`Configure Video AI Model (Active: ${activeModel})`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F2F4F8] border border-[#E2E5EB] text-xs font-semibold text-[#1F2937] shadow-xs transition cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span className="hidden sm:inline font-medium text-xs text-[#374151]">Settings</span>
          <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB] rounded-md max-w-[120px] truncate">
            {activeModel.split("/").pop()}
          </span>
        </button>

        {/* User Circular Avatar */}
        <div
          title={`NextVideo Studio Workspace · AI: ${activeModel}`}
          onClick={() => (onOpenSettings ? onOpenSettings() : setIsSettingsModalOpen(true))}
          className="w-8 h-8 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] border-2 border-white flex items-center justify-center font-bold text-xs text-white shadow-xs select-none cursor-pointer transition"
        >
          NV
        </div>
      </div>

      {/* Model & Generation Settings Modal fallback */}
      {!onOpenSettings && (
        <ModelSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onModelSaved={(model) => setActiveModel(model)}
          onToast={onToast}
        />
      )}
    </header>
  );
};
