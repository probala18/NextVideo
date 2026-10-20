"use client";

import React, { useState, useEffect } from "react";
import { Menu, HelpCircle, Sparkles, BookOpen, Clock } from "lucide-react";

interface HeaderProps {
  currentView: string;
  isLive: boolean;
  statusText: string;
  onOpenPrinciples: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  isLive,
  statusText,
  onOpenPrinciples,
  onToggleSidebar,
}) => {
  const [timecode, setTimecode] = useState("00:00:00");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimecode(
        now.toTimeString().split(" ")[0]
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatViewName = (view: string) => {
    switch (view) {
      case "overview":
        return "Workspace Overview";
      case "discover":
        return "Channel Discovery & Intel";
      case "audit":
        return "Public Channel Audit";
      case "diagnosis":
        return "Performance Clinic";
      case "opportunities":
        return "Topic Opportunities";
      case "strategy":
        return "Video Strategy Studio";
      case "production":
        return "Production Studio (Stage 02)";
      case "planner":
        return "Publishing Pipeline Planner";
      default:
        return view;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-ink-950/95 backdrop-blur-md border-b border-ink-800">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-1.5 text-ink-400 hover:text-ink-100 bg-ink-900 border border-ink-800 rounded-md hover:bg-ink-800 transition"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-ink-400">WORKSPACE</span>
          <span className="text-ink-600">/</span>
          <strong className="text-ink-100 font-medium tracking-tight">
            {formatViewName(currentView)}
          </strong>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Studio Timecode Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-ink-900 border border-ink-800 rounded text-xs font-mono text-ink-300">
          <Clock className="w-3 h-3 text-ink-400" />
          <span>{timecode}</span>
        </div>

        {/* Data Status Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-ink-900 border border-ink-800 rounded text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isLive ? "bg-studio-emerald animate-pulse shadow-sm shadow-studio-emerald" : "bg-studio-orange"
            }`}
          />
          <span className="text-ink-300 text-[11px] truncate max-w-[120px] sm:max-w-none">
            {statusText}
          </span>
        </div>

        {/* Creator Principles Action */}
        <button
          onClick={onOpenPrinciples}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-ink-900 hover:bg-ink-800 border border-ink-700 text-ink-200 rounded text-xs font-medium transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-studio-orange" />
          <span>Principles</span>
        </button>

        {/* User Badge */}
        <div className="w-7 h-7 rounded-md bg-ink-800 border border-ink-700 text-ink-200 flex items-center justify-center font-mono text-xs font-bold">
          CL
        </div>
      </div>
    </header>
  );
};
