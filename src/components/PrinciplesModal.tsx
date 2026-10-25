"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CheckCircle2, BookOpen } from "lucide-react";

interface PrinciplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinciplesModal: React.FC<PrinciplesModalProps> = ({ isOpen, onClose }) => {
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
            className="relative w-full max-w-lg bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-ink-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-full text-xs font-semibold mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Creator Operating System</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-ink-50 mt-1">
                  There is no secret algorithm hack
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-ink-200 hover:bg-gray-100 dark:hover:bg-ink-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-600 dark:text-ink-300 leading-relaxed">
              <p>
                YouTube recommendations follow the audience, not creator tricks. Successful channels
                are examples to study—never templates to copy blindly. Focus on solving real viewer
                problems with clear promises.
              </p>

              <div className="space-y-3 bg-gray-50 dark:bg-ink-950/60 border border-gray-100 dark:border-ink-850 p-4 rounded-2xl">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-ink-100">Specific Audience, Specific Promise</h4>
                    <p className="text-[11px] text-gray-500 dark:text-ink-400 mt-0.5">
                      “Python for complete beginners who want to build a tool” works better than “Learn Python.”
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-ink-100">Deliver in the Opening 30 Seconds</h4>
                    <p className="text-[11px] text-gray-500 dark:text-ink-400 mt-0.5">
                      Show the working outcome or state the problem immediately to validate the viewer&apos;s click.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-ink-100">Learn One Thing per Upload</h4>
                    <p className="text-[11px] text-gray-500 dark:text-ink-400 mt-0.5">
                      Change packaging or pacing—not both simultaneously—so you know what worked.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-ink-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-semibold shadow-xs transition"
              >
                Understood
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
