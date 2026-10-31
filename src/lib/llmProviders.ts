export type LLMProviderId =
  | "huggingface"
  | "openrouter"
  | "openai"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "groq"
  | "custom";

export interface ModelPreset {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  desc: string;
  contextWindow: string;
  speed: "Ultra-fast" | "Fast" | "Standard";
}

export interface ProviderDefinition {
  id: LLMProviderId;
  name: string;
  tagline: string;
  badge: string;
  defaultBaseUrl: string;
  defaultModel: string;
  keyPlaceholder: string;
  keyHelperUrl: string;
  keyHelperLabel: string;
  isBaseUrlEditable?: boolean;
  presets: ModelPreset[];
}

export const LLM_PROVIDERS: ProviderDefinition[] = [
  {
    id: "huggingface",
    name: "Hugging Face",
    tagline: "Open-Source AI • RTX 2050 & 8GB RAM",
    badge: "RTX 2050 Optimized",
    defaultBaseUrl: "https://router.huggingface.co/v1",
    defaultModel: "Qwen/Qwen2.5-VL-3B-Instruct",
    keyPlaceholder: "hf_...",
    keyHelperUrl: "https://huggingface.co/settings/tokens",
    keyHelperLabel: "Get Hugging Face Token",
    isBaseUrlEditable: true,
    presets: [
      {
        id: "Qwen/Qwen2.5-VL-3B-Instruct",
        name: "Qwen 2.5 VL 3B (Vision + Text)",
        badge: "RTX 2050 SOTA",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        desc: "State-of-the-art 3B vision-language model for video keyframe analysis, title & description generation. Runs smoothly in 4GB VRAM / 8GB RAM.",
        contextWindow: "32k",
        speed: "Fast",
      },
      {
        id: "HuggingFaceTB/SmolVLM-Instruct",
        name: "SmolVLM Instruct (2.2B)",
        badge: "Ultra-Lightweight",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        desc: "Official Hugging Face multimodal model built specifically for local edge devices and laptops with 4GB VRAM.",
        contextWindow: "8k",
        speed: "Ultra-fast",
      },
      {
        id: "meta-llama/Llama-3.2-3B-Instruct",
        name: "Llama 3.2 3B Instruct",
        badge: "Meta 3B",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        desc: "High-efficiency 3B parameter model from Meta for rapid title ideation, SEO descriptions, and tags.",
        contextWindow: "128k",
        speed: "Ultra-fast",
      },
      {
        id: "Qwen/Qwen2.5-7B-Instruct",
        name: "Qwen 2.5 7B Instruct",
        badge: "High Accuracy",
        badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
        desc: "Comprehensive 7B open model for deeper narrative summaries and long-form chapters via HF Serverless API.",
        contextWindow: "32k",
        speed: "Fast",
      },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "Universal Aggregator",
    badge: "Recommended",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    keyPlaceholder: "sk-or-v1-...",
    keyHelperUrl: "https://openrouter.ai/keys",
    keyHelperLabel: "Get OpenRouter Key",
    presets: [
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        badge: "Recommended",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        desc: "Lightning fast, reliable structured JSON output, excellent for YouTube retention hooks.",
        contextWindow: "128k",
        speed: "Ultra-fast",
      },
      {
        id: "openai/gpt-4o",
        name: "GPT-4o Flagship",
        badge: "Flagship",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        desc: "Deep viewer psychology, viral title ideation, and complete scene breakdowns.",
        contextWindow: "128k",
        speed: "Fast",
      },
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        badge: "Elite Scripting",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        desc: "Unmatched natural human tone for teleprompter dialogue and cinematic pacing.",
        contextWindow: "200k",
        speed: "Fast",
      },
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash (Free)",
        badge: "Zero-Cost",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        desc: "Fast, zero-cost generation via OpenRouter Free tier. Perfect for endless iteration.",
        contextWindow: "1M+",
        speed: "Ultra-fast",
      },
      {
        id: "deepseek/deepseek-chat",
        name: "DeepSeek V3",
        badge: "Budget King",
        badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
        desc: "State-of-the-art cost-to-performance ratio with exceptional structured coding.",
        contextWindow: "64k",
        speed: "Fast",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI Direct",
    tagline: "Direct Official API",
    badge: "Official",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    keyPlaceholder: "sk-proj-...",
    keyHelperUrl: "https://platform.openai.com/api-keys",
    keyHelperLabel: "Get OpenAI Key",
    presets: [
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        badge: "Best Value",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        desc: "Official OpenAI direct mini model. 128k context, ultra-fast response times.",
        contextWindow: "128k",
        speed: "Ultra-fast",
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        badge: "Flagship",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        desc: "Flagship multimodal reasoning engine. Superb script pacing and viral titles.",
        contextWindow: "128k",
        speed: "Fast",
      },
      {
        id: "o3-mini",
        name: "o3-mini",
        badge: "Reasoning",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        desc: "OpenAI's latest low-cost reasoning model for deep analytical video planning.",
        contextWindow: "128k",
        speed: "Fast",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    tagline: "Direct Official API",
    badge: "Scriptwriting SOTA",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-20241022",
    keyPlaceholder: "sk-ant-api03-...",
    keyHelperUrl: "https://console.anthropic.com/settings/keys",
    keyHelperLabel: "Get Anthropic Key",
    presets: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        badge: "Recommended",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        desc: "The gold standard for natural human voiceover, hook formulation, and narrative tone.",
        contextWindow: "200k",
        speed: "Fast",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        badge: "Ultra-Fast",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        desc: "Incredible speed and affordability with Claude 3.5 intelligence for rapid drafting.",
        contextWindow: "200k",
        speed: "Ultra-fast",
      },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tagline: "Google AI Studio",
    badge: "Huge Context",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    keyPlaceholder: "AIzaSy...",
    keyHelperUrl: "https://aistudio.google.com/app/apikey",
    keyHelperLabel: "Get Gemini Key (Free Tier Available)",
    presets: [
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        badge: "Next-Gen",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        desc: "Google's newest multimodal model with instant generation and generous free tier.",
        contextWindow: "1M+",
        speed: "Ultra-fast",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        badge: "2M Context",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        desc: "Industry-leading 2 million token context window for digesting full transcripts.",
        contextWindow: "2M",
        speed: "Fast",
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        badge: "High Efficiency",
        badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
        desc: "High throughput, low latency model optimized for frequency and speed.",
        contextWindow: "1M",
        speed: "Ultra-fast",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    tagline: "Direct Official API",
    badge: "Budget SOTA",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    keyPlaceholder: "sk-...",
    keyHelperUrl: "https://platform.deepseek.com/api_keys",
    keyHelperLabel: "Get DeepSeek Key",
    presets: [
      {
        id: "deepseek-chat",
        name: "DeepSeek V3",
        badge: "Recommended",
        badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
        desc: "State-of-the-art general intelligence at a fraction of standard API prices.",
        contextWindow: "64k",
        speed: "Fast",
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek R1",
        badge: "Reasoning",
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        desc: "Open reasoning model with chain-of-thought verification for deep topic strategy.",
        contextWindow: "64k",
        speed: "Standard",
      },
    ],
  },
  {
    id: "groq",
    name: "Groq LPU",
    tagline: "Ultra-Fast Inference",
    badge: "Real-Time LPUs",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    keyPlaceholder: "gsk_...",
    keyHelperUrl: "https://console.groq.com/keys",
    keyHelperLabel: "Get Groq Key",
    presets: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",
        badge: "Recommended",
        badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
        desc: "Over 250 tokens per second on Groq LPUs. Instantaneous scene and script generation.",
        contextWindow: "128k",
        speed: "Ultra-fast",
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B",
        badge: "Speed King",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        desc: "Sub-second complete pack generation for real-time interactive creation.",
        contextWindow: "128k",
        speed: "Ultra-fast",
      },
    ],
  },
  {
    id: "custom",
    name: "Custom / Local (Ollama)",
    tagline: "OpenAI-Compatible & Offline",
    badge: "Self-Hosted",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    keyPlaceholder: "Optional or ollama",
    keyHelperUrl: "https://ollama.com",
    keyHelperLabel: "Ollama Setup Guide",
    isBaseUrlEditable: true,
    presets: [
      {
        id: "llama3.2",
        name: "Llama 3.2 (Local)",
        badge: "Local",
        badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
        desc: "Run 100% locally with zero internet dependency via Ollama.",
        contextWindow: "128k",
        speed: "Fast",
      },
      {
        id: "mistral",
        name: "Mistral 7B (Local)",
        badge: "Local",
        badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
        desc: "High quality local model for scripting and scene directions.",
        contextWindow: "32k",
        speed: "Fast",
      },
      {
        id: "deepseek-r1:8b",
        name: "DeepSeek R1 8B (Local)",
        badge: "Local Reasoning",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        desc: "Local reasoning model running directly on your machine.",
        contextWindow: "64k",
        speed: "Standard",
      },
    ],
  },
];
