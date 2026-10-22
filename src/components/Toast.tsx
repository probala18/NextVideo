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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-800 text-gray-900 dark:text-ink-100 rounded-2xl shadow-xl max-w-md pointer-events-auto"
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          ) : toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          )}
          <span className="text-xs leading-relaxed text-gray-700 dark:text-ink-200 font-medium">{toast.text}</span>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-ink-200 rounded-lg hover:bg-gray-100 dark:hover:bg-ink-800 transition ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
