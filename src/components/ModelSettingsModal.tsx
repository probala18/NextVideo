"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Cpu,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
  RotateCw,
  Sliders,
  Check,
  ShieldCheck,
} from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  badge?: string;
  badgeColor?: string;
  desc: string;
  contextWindow: string;
  speed: "Ultra-fast" | "Fast" | "Standard";
}

export const PRESET_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    badge: "Recommended",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "Lightning fast, reliable structured JSON output, excellent for YouTube retention hooks and storyboard packs.",
    contextWindow: "128k",
    speed: "Ultra-fast",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o Flagship",
    provider: "OpenAI",
    badge: "Flagship",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    desc: "Peak multimodal reasoning, deepest psychological viewer insight, and viral title ideation.",
    contextWindow: "128k",
    speed: "Fast",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    badge: "Elite Scripting",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "Unmatched natural human tone for teleprompter voiceover dialogue and cinematic scene progression.",
    contextWindow: "200k",
    speed: "Fast",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash (Free)",
    provider: "Google",
    badge: "Zero-Cost",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Fast, zero-cost generation via OpenRouter Free tier. Perfect for endless iteration without credit usage.",
    contextWindow: "1M+",
    speed: "Ultra-fast",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    badge: "Budget King",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    desc: "State-of-the-art cost-to-performance ratio with exceptional structured coding and educational explanations.",
    contextWindow: "64k",
    speed: "Fast",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "Meta",
    badge: "Open Weights",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    desc: "High-caliber open-source intelligence with versatile formatting and nuanced perspective angles.",
    contextWindow: "128k",
    speed: "Fast",
  },
];

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSaved?: (model: string) => void;
  onToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  onModelSaved,
  onToast,
}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini");
  const [customModelInput, setCustomModelInput] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Fetch current backend configuration
  useEffect(() => {
    if (isOpen) {
      fetch("/api/video/status")
        .then((r) => r.json())
        .then((data) => {
          if (data.model) {
            const isPreset = PRESET_MODELS.some((m) => m.id === data.model);
            if (isPreset) {
              setSelectedModel(data.model);
              setIsCustomMode(false);
            } else {
              setSelectedModel(data.model);
              setCustomModelInput(data.model);
              setIsCustomMode(true);
            }
          }
          if (data.maskedKey) setMaskedKey(data.maskedKey);
          setIsConfigured(Boolean(data.isConfigured));
        })
        .catch(() => {});
      setTestResult(null);
    }
  }, [isOpen]);

  const activeModelId = isCustomMode ? customModelInput.trim() || selectedModel : selectedModel;

  const handleSelectPreset = (id: string) => {
    setSelectedModel(id);
    setIsCustomMode(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/video/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeModelId,
          apiKey: apiKeyInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: Boolean(data.success),
        message: data.message || (data.success ? "Connection verified!" : "Connection failed"),
        latencyMs: data.latencyMs,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Failed to test connection",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    const finalModel = activeModelId.trim();
    if (!finalModel) {
      if (onToast) onToast("Please select or enter a valid model ID.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload: { model: string; apiKey?: string } = {
        model: finalModel,
      };
      if (apiKeyInput.trim()) {
        payload.apiKey = apiKeyInput.trim();
      }

      const res = await fetch("/api/video/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      // Persist in localStorage for quick client access
      try {
        localStorage.setItem("nextvideo_active_model", finalModel);
        if (apiKeyInput.trim()) {
          localStorage.setItem("nextvideo_active_key", apiKeyInput.trim());
        }
      } catch {}

      // Dispatch window event so StrategyView and other components can update immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("openrouter-config-updated", {
            detail: {
              model: finalModel,
              isConfigured: data.isConfigured,
            },
          })
        );
      }

      if (onModelSaved) onModelSaved(finalModel);
      if (onToast) onToast(`AI Model updated to: ${finalModel}`, "success");
      onClose();
    } catch (err: any) {
      if (onToast) onToast(err.message || "Failed to save model settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          {/* Backdrop click to dismiss */}
          <div
            className="fixed inset-0 -z-10"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white rounded-[28px] border border-[#E5E7EB] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col z-10"
          >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#F0F2F5] flex items-center justify-between flex-shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                  <span>AI Video Generation Settings</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    OpenRouter
                  </span>
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Configure your primary LLM model and credentials for video strategy & script generation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* OpenRouter API Key Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>OpenRouter API Key</span>
                </label>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type="password"
                  placeholder={maskedKey ? `Current Key: ${maskedKey}` : "sk-or-v1-..."}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none transition"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-0.5">
                <span>
                  {maskedKey ? (
                    <span className="inline-flex items-center gap-1 text-[#059669] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      API Key configured ({maskedKey})
                    </span>
                  ) : (
                    <span>Leave blank to use existing key from .env.local</span>
                  )}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">Saved securely in local studio config</span>
              </div>
            </div>

            {/* Model Selection Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Choose Video Generation Model</span>
                </label>
                <span className="text-[11px] text-[#6B7280]">
                  Active: <strong className="text-[#111827] font-mono">{activeModelId}</strong>
                </span>
              </div>

              {/* Preset Models Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_MODELS.map((m) => {
                  const isSelected = !isCustomMode && selectedModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectPreset(m.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative text-left flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#EFF6FF] border-[#3B82F6] shadow-xs ring-1 ring-[#3B82F6]"
                          : "bg-white hover:bg-[#F9FAFB] border-[#E5E7EB]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                            )}
                            {m.name}
                          </span>
                          {m.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                                m.badgeColor || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#4B5563] line-clamp-2 leading-relaxed">
                          {m.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#6B7280] mt-2 pt-2 border-t border-[#F0F2F5]">
                        <span className="font-mono">{m.provider}</span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-500" />
                          {m.speed} · {m.contextWindow}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Model ID Entry */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isCustomMode
                    ? "bg-[#EFF6FF] border-[#3B82F6] ring-1 ring-[#3B82F6]"
                    : "bg-[#F9FAFB] border-[#E5E7EB]"
                }`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={isCustomMode}
                      onChange={() => setIsCustomMode(true)}
                      className="cursor-pointer text-[#3B82F6] focus:ring-[#3B82F6]"
                    />
                    <span className="text-xs font-bold text-[#111827]">
                      Custom OpenRouter Model ID
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6B7280]">
                    Enter any valid model slug from openrouter.ai/models
                  </span>
                </div>

                {isCustomMode && (
                  <div className="mt-3 space-y-1.5">
                    <input
                      type="text"
                      placeholder="e.g. anthropic/claude-3-haiku, mistralai/mistral-large-2407"
                      value={customModelInput}
                      onChange={(e) => {
                        setCustomModelInput(e.target.value);
                        setTestResult(null);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-[#CBD5E1] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] font-mono focus:outline-none"
                    />
                    <p className="text-[10px] text-[#6B7280]">
                      Format: <code className="text-[#1D4ED8]">author/model-name</code>. Any model available on OpenRouter can be used for video production packs.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Connection Banner */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#1E293B] block">
                  Validate Configuration
                </span>
                <p className="text-[11px] text-[#64748B]">
                  Send a fast live ping to OpenRouter to ensure your key and model are active.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1] rounded-full text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "Testing Ping..." : "Test Model"}</span>
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl text-xs flex items-start gap-2 border ${
                  testResult.success
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                    : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold">
                    {testResult.success ? "Model Ready for Generation!" : "Test Failed:"}
                  </span>
                  <p className="text-[11px] mt-0.5">{testResult.message}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#F0F2F5] flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#111827] rounded-full hover:bg-[#E2E8F0] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save &amp; Apply Model</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
