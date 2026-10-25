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
  Globe,
  Server,
  Layers,
  Eye,
  EyeOff
} from "lucide-react";
import { LLM_PROVIDERS, LLMProviderId, ProviderDefinition, ModelPreset } from "@/lib/llmProviders";

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
  const [activeProviderId, setActiveProviderId] = useState<LLMProviderId>("openrouter");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini");
  const [customModelInput, setCustomModelInput] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active provider definition
  const currentProviderDef: ProviderDefinition =
    LLM_PROVIDERS.find((p) => p.id === activeProviderId) || LLM_PROVIDERS[0];

  // Fetch current backend configuration on modal open
  useEffect(() => {
    if (isOpen) {
      fetch("/api/video/status")
        .then((r) => r.json())
        .then((data) => {
          if (data.provider) {
            setActiveProviderId(data.provider);
          }
          if (data.model) {
            setSelectedModel(data.model);
            const providerDef = LLM_PROVIDERS.find((p) => p.id === data.provider) || LLM_PROVIDERS[0];
            const isPreset = providerDef.presets.some((m) => m.id === data.model);
            if (!isPreset) {
              setCustomModelInput(data.model);
              setIsCustomMode(true);
            } else {
              setIsCustomMode(false);
            }
          }
          if (data.baseUrl) {
            setBaseUrlInput(data.baseUrl);
          }
          if (data.maskedKey) setMaskedKey(data.maskedKey);
          setIsConfigured(Boolean(data.isConfigured));
        })
        .catch(() => {});
      setTestResult(null);
    }
  }, [isOpen]);

  // When switching provider tabs, set default model & baseUrl if not custom
  const handleSelectProvider = (provId: LLMProviderId) => {
    setActiveProviderId(provId);
    const def = LLM_PROVIDERS.find((p) => p.id === provId) || LLM_PROVIDERS[0];
    setSelectedModel(def.defaultModel);
    setBaseUrlInput(def.defaultBaseUrl);
    setIsCustomMode(false);
    setTestResult(null);
  };

  const activeModelId = isCustomMode ? customModelInput.trim() || selectedModel : selectedModel;

  const handleSelectPreset = (presetId: string) => {
    setSelectedModel(presetId);
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
          provider: activeProviderId,
          model: activeModelId,
          apiKey: apiKeyInput.trim() || undefined,
          baseUrl: baseUrlInput.trim() || undefined,
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
      const payload: {
        provider: LLMProviderId;
        model: string;
        apiKey?: string;
        baseUrl?: string;
      } = {
        provider: activeProviderId,
        model: finalModel,
        baseUrl: baseUrlInput.trim() || undefined,
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

      // Persist in localStorage
      try {
        localStorage.setItem("nextvideo_llm_provider", activeProviderId);
        localStorage.setItem("nextvideo_active_model", finalModel);
        if (apiKeyInput.trim()) {
          localStorage.setItem("nextvideo_active_key", apiKeyInput.trim());
        }
      } catch {}

      // Broadcast event across views
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("openrouter-config-updated", {
            detail: {
              provider: activeProviderId,
              model: finalModel,
              isConfigured: data.isConfigured,
            },
          })
        );
      }

      if (onModelSaved) onModelSaved(finalModel);
      if (onToast) onToast(`AI Engine configured: ${currentProviderDef.name} (${finalModel})`, "success");
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-[28px] border border-[#E2E5EB] shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5] bg-gradient-to-r from-[#F8FAFC] to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#111827]">
                      AI Model & LLM Provider Settings
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Multi-Provider
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Select any LLM provider (OpenRouter, OpenAI, Anthropic, Gemini, DeepSeek, Groq, or Local).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Provider Selector Tabs */}
            <div className="px-6 pt-3 pb-2 border-b border-[#F0F2F5] bg-[#FAFAFA] overflow-x-auto shrink-0">
              <div className="flex items-center gap-1.5 min-w-max">
                {LLM_PROVIDERS.map((prov) => {
                  const isActive = prov.id === activeProviderId;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => handleSelectProvider(prov.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? "bg-[#2563EB] text-white shadow-xs font-bold"
                          : "bg-white text-[#4B5563] hover:text-[#111827] hover:bg-gray-100 border border-[#E5E7EB]"
                      }`}
                    >
                      <span>{prov.name}</span>
                      {prov.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {prov.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Active Provider Tagline */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>{currentProviderDef.name}:</strong> {currentProviderDef.tagline}.
                  </span>
                </div>
                <a
                  href={currentProviderDef.keyHelperUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>{currentProviderDef.keyHelperLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Model Presets Grid */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                    Curated Models for {currentProviderDef.name}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(!isCustomMode);
                      if (!isCustomMode) {
                        setCustomModelInput(selectedModel);
                      }
                    }}
                    className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>{isCustomMode ? "Choose from presets" : "Enter custom model ID"}</span>
                  </button>
                </div>

                {!isCustomMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentProviderDef.presets.map((preset: ModelPreset) => {
                      const isSelected = selectedModel === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`p-3.5 rounded-2xl border transition text-left cursor-pointer relative ${
                            isSelected
                              ? "bg-blue-50/40 border-[#2563EB] shadow-xs"
                              : "bg-white border-[#E5E7EB] hover:border-gray-300 hover:bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                                <span>{preset.name}</span>
                                {preset.badge && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                      preset.badgeColor || "bg-gray-100 text-gray-700 border-gray-200"
                                    }`}
                                  >
                                    {preset.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                                {preset.desc}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-300" />
                              )}
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-[#6B7280]">
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded-md font-medium">
                              ctx: {preset.contextWindow}
                            </span>
                            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                              <Zap className="w-3 h-3" />
                              {preset.speed}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <label className="text-xs font-bold text-[#111827] block">
                      Custom Model Identifier
                    </label>
                    <input
                      type="text"
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      placeholder={`e.g. ${currentProviderDef.defaultModel}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-mono text-[#111827] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <p className="text-[11px] text-[#6B7280]">
                      Specify any model string supported by {currentProviderDef.name}.
                    </p>
                  </div>
                )}
              </div>

              {/* Custom Base URL (if custom or user proxy) */}
              {(currentProviderDef.isBaseUrlEditable || activeProviderId === "custom") && (
                <div className="space-y-1.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-gray-500" />
                    <span>API Base URL</span>
                  </label>
                  <input
                    type="text"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    placeholder={currentProviderDef.defaultBaseUrl}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs font-mono text-[#111827] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-[#6B7280]">
                    Default: {currentProviderDef.defaultBaseUrl} (e.g. for Ollama use http://localhost:11434/v1).
                  </p>
                </div>
              )}

              {/* API Key Section */}
              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-gray-500" />
                    <span>{currentProviderDef.name} API Key</span>
                  </label>
                  {maskedKey && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      Active Key: {maskedKey}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showKeyText ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={maskedKey ? "Leave blank to keep existing key, or enter new key..." : currentProviderDef.keyPlaceholder}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-300 bg-white text-xs font-mono text-[#111827] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
                  <a
                    href={currentProviderDef.keyHelperUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563EB] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>{currentProviderDef.keyHelperLabel}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-blue-600" : ""}`} />
                    <span>{isTesting ? "Testing endpoint..." : "Test Connection"}</span>
                  </button>
                </div>

                {/* Test Result Toast */}
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="flex-1 font-medium">{testResult.message}</span>
                    {testResult.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-white/60 shrink-0">
                        {testResult.latencyMs}ms
                      </span>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-t border-[#F0F2F5] shrink-0">
              <div className="text-xs text-[#6B7280]">
                Active Engine: <strong className="text-[#111827]">{currentProviderDef.name} ({activeModelId})</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Save & Apply Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
