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
  activeId?: string;
  activeTab?: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeId,
  activeTab,
  onChange,
  className = "",
  layoutId = "activePill",
}) => {
  const currentActive = activeTab !== undefined ? activeTab : activeId;

  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-ink-850 border border-gray-200/90 dark:border-ink-700 rounded-full overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === currentActive;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors z-10 ${
              isActive
                ? "text-gray-950 dark:text-ink-50 font-semibold"
                : "text-gray-500 hover:text-gray-900 dark:text-ink-400 dark:hover:text-ink-100"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-white dark:bg-ink-800 rounded-full -z-10 shadow-xs border border-gray-200/80 dark:border-ink-700"
              />
            )}
            {tab.icon && <span className="text-current">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? "bg-brand-500 text-white"
                    : "bg-gray-200 dark:bg-ink-750 text-gray-600 dark:text-ink-400"
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold border border-brand-300 dark:border-brand-700">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
