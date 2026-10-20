"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles } from "lucide-react";

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
            className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md bg-ink-900 border border-ink-700 rounded-xl p-6 shadow-2xl z-10"
          >
            <div className="flex items-start justify-between pb-3 border-b border-ink-800">
              <div>
                <div className="text-xs font-mono text-studio-orange">CONTENT PIPELINE</div>
                <h2 className="text-base font-bold text-ink-50 mt-0.5">
                  Add video idea to planner
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 text-ink-400 hover:text-ink-100 hover:bg-ink-800 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-1">
                  Video idea or title direction
                </label>
                <input
                  type="text"
                  required
                  maxLength={180}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build an offline local AI search tool in Python"
                  className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-300 mb-1">
                  Why your audience needs it / core problem solved
                </label>
                <textarea
                  rows={3}
                  maxLength={400}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe the viewer blocker, target outcome, and your unique angle..."
                  className="w-full px-3 py-2 bg-ink-950 border border-ink-700 focus:border-studio-orange rounded-md text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-ink-400 hover:text-ink-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-studio-orange hover:bg-studio-orange-hover text-white rounded-md text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to planner</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
