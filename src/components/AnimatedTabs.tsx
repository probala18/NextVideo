"use client";

import React from "react";
import { motion } from "framer-motion";

export interface TabOption {
  id: string;
  label: string;
  count?: number | string;
  badge?: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeId,
  onChange,
  className = "",
  layoutId = "activePill",
}) => {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 p-1 bg-ink-900 border border-ink-800 rounded-lg overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors z-10 ${
              isActive ? "text-ink-50 font-semibold" : "text-ink-400 hover:text-ink-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-ink-700 border border-ink-600 rounded-md -z-10 shadow-sm"
              />
            )}
            {tab.icon && <span className="text-current">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive ? "bg-studio-orange text-white" : "bg-ink-800 text-ink-400 border border-ink-700"
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="text-[9px] px-1 py-0.2 bg-studio-orange/20 text-studio-orange rounded font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
