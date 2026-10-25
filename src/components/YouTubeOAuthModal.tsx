"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Youtube,
  Key,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface YouTubeOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authUrl: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const YouTubeOAuthModal: React.FC<YouTubeOAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onToast,
}) => {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/api/youtube/callback`
    : "http://localhost:3000/api/youtube/callback";

  const handleCopyRedirect = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedRedirect(true);
    onToast("Redirect URI copied to clipboard!", "success");
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      onToast("Please enter both Client ID and Client Secret.", "info");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/youtube/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save credentials");

      const authUrl = data.oauthUrl || data.authUrl;
      if (authUrl) {
        onToast("Credentials saved! Redirecting to Google authorization...", "success");
        onSuccess(authUrl);
      } else {
        onToast("Saved credentials successfully.", "success");
        onClose();
      }
    } catch (err: any) {
      onToast(err.message || "Failed to save OAuth credentials.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-7 shadow-xl z-10 space-y-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#F0F2F5] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-[#DC2626] fill-[#DC2626]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    Connect YouTube Channel (OAuth 2.0)
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Configure your Google Cloud OAuth app to publish videos directly.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#111827] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 3-Step Setup Instructions */}
            <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-2 text-xs">
              <div className="font-bold text-[#111827] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>3-Step Google Cloud Setup</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[#4B5563] leading-relaxed">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:underline font-semibold inline-flex items-center gap-0.5"
                  >
                    <span>Google Cloud Console Credentials</span>
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </li>
                <li>
                  Click <strong>Create Credentials → OAuth client ID</strong> (Type: <em>Web application</em>).
                </li>
                <li>
                  Add this under <strong>Authorized redirect URIs</strong>:
                </li>
              </ol>

              {/* Redirect URI with Copy Button */}
              <div className="mt-1 flex items-center justify-between p-2 bg-white rounded-xl border border-[#E2E5EB] font-mono text-[11px] text-[#3B82F6]">
                <span className="truncate pr-2">{redirectUri}</span>
                <button
                  type="button"
                  onClick={handleCopyRedirect}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] rounded-md text-[10px] font-bold cursor-pointer shrink-0 transition"
                >
                  {copiedRedirect ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRedirect ? "Copied" : "Copy URI"}</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAndConnect} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                  OAuth Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                  OAuth Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#059669]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Credentials are saved strictly in your local server environment (.env.local).</span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#F0F2F5]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#E2E5EB] text-[#4B5563] hover:bg-[#F3F4F6] rounded-full text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-gray-300 text-white rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save & Authorize Channel →"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
