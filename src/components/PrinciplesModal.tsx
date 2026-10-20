"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, CheckCircle, ExternalLink } from "lucide-react";

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
            className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-lg bg-ink-900 border border-ink-700 rounded-xl p-6 shadow-2xl z-10"
          >
            <div className="flex items-start justify-between pb-4 border-b border-ink-800">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-studio-orange">
                  <span className="w-1.5 h-1.5 rounded-full bg-studio-orange" />
                  FOUNDATIONAL CREATOR PRINCIPLES
                </div>
                <h2 className="text-lg font-bold text-ink-50 mt-1">
                  There is no secret algorithm formula.
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 text-ink-400 hover:text-ink-100 hover:bg-ink-800 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-ink-300 leading-relaxed">
              <p>
                YouTube recommendations follow the audience, not creator tricks. Successful channels
                are examples to study—never templates to copy blindly. Focus on solving real viewer
                problems with clear promises.
              </p>

              <div className="space-y-3 bg-ink-950/60 border border-ink-800 p-4 rounded-lg">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-ink-800 border border-ink-700 text-studio-orange font-mono text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                    01
                  </div>
                  <div>
                    <strong className="text-ink-100 block">Appeal & Honest Packaging</strong>
                    <span>Does your title and thumbnail make the specific outcome obvious without bait-and-switch?</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-ink-800 border border-ink-700 text-studio-emerald font-mono text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                    02
                  </div>
                  <div>
                    <strong className="text-ink-100 block">Immediate Value Delivery</strong>
                    <span>Deliver on your promise in the first 20 seconds. Cut greetings, channel intros, and setup filler.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-ink-800 border border-ink-700 text-studio-blue font-mono text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                    03
                  </div>
                  <div>
                    <strong className="text-ink-100 block">Viewer Satisfaction</strong>
                    <span>Did the viewer walk away with their problem solved or a new skill built? That builds returning audiences.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href="https://support.google.com/youtube/answer/16559650"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-studio-orange hover:underline font-mono text-xs"
                >
                  YouTube Official Creator Guide <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-ink-800 hover:bg-ink-700 text-ink-100 border border-ink-700 rounded-md text-xs font-medium transition"
                >
                  Understood
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
