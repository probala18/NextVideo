"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  text: string;
  type?: "success" | "error" | "info";
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-ink-900 border border-ink-700 text-ink-100 rounded-lg shadow-2xl max-w-md pointer-events-auto"
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-studio-crimson flex-shrink-0" />
          ) : toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-studio-emerald flex-shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-studio-orange flex-shrink-0" />
          )}
          <span className="text-xs leading-relaxed text-ink-200">{toast.text}</span>
          <button
            onClick={onClose}
            className="p-1 text-ink-400 hover:text-ink-100 rounded hover:bg-ink-800 transition ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
