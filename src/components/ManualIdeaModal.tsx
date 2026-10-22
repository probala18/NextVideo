"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles, Kanban } from "lucide-react";

interface ManualIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, note: string) => void;
}

export const ManualIdeaModal: React.FC<ManualIdeaModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), note.trim());
    setTitle("");
    setNote("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-ink-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-full text-xs font-semibold mb-1">
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Pipeline</span>
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-ink-50 mt-0.5">
                  Add video concept to planner
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-ink-200 hover:bg-gray-100 dark:hover:bg-ink-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-ink-400 mb-1">
                  Video Title or Working Concept
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build a Python Automation Script in 15 Minutes"
                  maxLength={140}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-ink-950 border border-gray-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-ink-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-ink-400 mb-1">
                  Notes / Next Step
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Outline the hook, what to research, or required assets..."
                  rows={3}
                  maxLength={280}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-ink-950 border border-gray-200 dark:border-ink-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-ink-100 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-ink-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs text-gray-600 dark:text-ink-300 hover:bg-gray-100 dark:hover:bg-ink-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-full text-xs font-semibold shadow-xs transition disabled:opacity-40"
                >
                  Save to Pipeline
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
