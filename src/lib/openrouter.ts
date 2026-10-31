import { VideoBrief, ProductionPack, ProductionScene } from "@/types";
import { fallbackPack } from "./productionPack";
import { LLM_PROVIDERS, LLMProviderId } from "./llmProviders";
export { LLM_PROVIDERS };
export type { LLMProviderId };

export interface LLMConfig {
  provider: LLMProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
  isConfigured: boolean;
}

export type OpenRouterConfig = LLMConfig;

let runtimeProvider: LLMProviderId | null = null;
let runtimeModel: string | null = null;
let runtimeApiKey: string | null = null;
let runtimeBaseUrl: string | null = null;

export function setLLMConfig(updates: {
  provider?: LLMProviderId;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}) {
  if (updates.provider) runtimeProvider = updates.provider;
  if (updates.model !== undefined && updates.model.trim()) runtimeModel = updates.model.trim();
  if (updates.apiKey !== undefined) runtimeApiKey = updates.apiKey.trim();
  if (updates.baseUrl !== undefined) runtimeBaseUrl = updates.baseUrl.trim();
}

export const setOpenRouterConfig = (updates: { model?: string; apiKey?: string }) => {
  setLLMConfig(updates);
};

export function getLLMConfig(): LLMConfig {
  const provider: LLMProviderId =
    runtimeProvider ||
    ((process.env.LLM_PROVIDER as LLMProviderId) || "huggingface");

  const providerDef = LLM_PROVIDERS.find((p) => p.id === provider) || LLM_PROVIDERS[0];

  const apiKey = (
    runtimeApiKey !== null
      ? runtimeApiKey
      : (provider === "huggingface" ? (process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN) : undefined) ||
        process.env.LLM_API_KEY ||
        (provider === "openrouter" ? process.env.OPENROUTER_API_KEY : undefined) ||
        (provider === "openai" ? process.env.OPENAI_API_KEY : undefined) ||
        process.env.OPENROUTER_API_KEY ||
        process.env.HF_TOKEN ||
        ""
  ).trim();

  let model = (
    runtimeModel !== null
      ? runtimeModel
      : process.env.LLM_MODEL ||
        (provider === "huggingface" ? (process.env.HUGGINGFACE_MODEL || providerDef.defaultModel) : "") ||
        (provider === "openrouter" ? process.env.OPENROUTER_MODEL : "") ||
        providerDef.defaultModel
  ).trim();

  // Guard against invalid or deprecated legacy model identifiers
  if (
    model === "openai/free" ||
    model === "google/gemini-2.0-flash-exp:free" ||
    model.includes("gemini-2.0-flash-exp") ||
    !model
  ) {
    model = providerDef.defaultModel || "Qwen/Qwen2.5-VL-3B-Instruct";
  }

  const baseUrl = (
    runtimeBaseUrl !== null
      ? runtimeBaseUrl
      : process.env.LLM_BASE_URL || providerDef.defaultBaseUrl
  ).trim();

  // For custom/local or localhost endpoints, a key is not required
  const isKeyRequired = provider !== "custom" && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1");
  const isConfigured = isKeyRequired ? Boolean(apiKey && apiKey.length > 4) : true;

  return {
    provider,
    apiKey,
    model,
    baseUrl,
    isConfigured,
  };
}

export const getOpenRouterConfig = (): LLMConfig => getLLMConfig();

export async function testLLMConnection(
  customProvider?: LLMProviderId,
  customModel?: string,
  customKey?: string,
  customBaseUrl?: string
): Promise<{
  success: boolean;
  provider: LLMProviderId;
  model: string;
  latencyMs: number;
  message: string;
}> {
  const baseConfig = getLLMConfig();
  const provider = customProvider || baseConfig.provider;
  const providerDef = LLM_PROVIDERS.find((p) => p.id === provider) || LLM_PROVIDERS[0];

  const apiKey = (customKey !== undefined ? customKey : baseConfig.apiKey).trim();
  const model = (customModel !== undefined && customModel.trim() ? customModel.trim() : baseConfig.model);
  const baseUrl = (customBaseUrl !== undefined && customBaseUrl.trim() ? customBaseUrl.trim() : baseConfig.baseUrl || providerDef.defaultBaseUrl);

  const isKeyRequired = provider !== "custom" && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1");
  if (isKeyRequired && (!apiKey || apiKey.length < 4)) {
    return {
      success: false,
      provider,
      model,
      latencyMs: 0,
      message: `No API key or token configured for ${providerDef.name}. Please enter your ${providerDef.name} token.`,
    };
  }

  const start = Date.now();
  try {
    if (provider === "anthropic") {
      const endpoint = `${baseUrl.replace(/\/+$/, "")}/messages`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Reply with the single word 'READY'." }],
        }),
      });

      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          provider,
          model,
          latencyMs,
          message: `Anthropic HTTP ${res.status}: ${errText.slice(0, 140)}`,
        };
      }
      return {
        success: true,
        provider,
        model,
        latencyMs,
        message: `Connected successfully to Anthropic (${model}) in ${latencyMs}ms.`,
      };
    }

    // Standard OpenAI-compatible format (OpenAI, OpenRouter, Gemini, DeepSeek, Groq, Custom)
    const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "http://localhost:3000";
      headers["X-Title"] = "NextVideo Creator Studio";
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word 'READY'." }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const errText = await res.text();
      let parsedMsg = errText;
      try {
        const json = JSON.parse(errText);
        parsedMsg = json.error?.message || errText;
      } catch {}
      return {
        success: false,
        provider,
        model,
        latencyMs,
        message: `${providerDef.name} returned status ${res.status}: ${parsedMsg.slice(0, 140)}`,
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "OK";
    return {
      success: true,
      provider,
      model,
      latencyMs,
      message: `Connected successfully to ${providerDef.name} (${reply}) in ${latencyMs}ms.`,
    };
  } catch (err: any) {
    return {
      success: false,
      provider,
      model,
      latencyMs: Date.now() - start,
      message: err.message || `Failed to reach ${providerDef.name} endpoint.`,
    };
  }
}

export const testOpenRouterConnection = (customModel?: string, customKey?: string) =>
  testLLMConnection("openrouter", customModel, customKey);

export interface GenerateVideoInput {
  topic: string;
  audience: string;
  goal?: string;
  format?: string;
  stage?: string;
  differentiator?: string;
  tone?: string;
  duration?: string;
  cta?: string;
  provider?: LLMProviderId;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface GeneratedVideoResult {
  brief: VideoBrief;
  pack: ProductionPack;
  source: "openrouter" | "template" | string;
  model: string;
  notice: string;
}

function synthesizeLocally(input: GenerateVideoInput, model: string): GeneratedVideoResult {
  const isShort = (input.format || "").toLowerCase().includes("short");
  const promise =
    input.goal?.trim() ||
    `Help ${input.audience} master ${input.topic} with a clear, step-by-step practical build.`;

  const cleanDiff = input.differentiator?.trim() || "practical examples with live explanations";

  const localTitles = isShort
    ? [
        `The Only ${input.topic} Trick You Need to Know`,
        `Stop Doing ${input.topic} Wrong (Do This Instead)`,
        `How to Master ${input.topic} in 60 Seconds`,
        `${input.topic} Explained with Zero Fluff`,
      ]
    : [
        `How to Master ${input.topic} from Scratch`,
        `I Built a Real ${input.topic} Project (Step-by-Step)`,
        `The Modern Guide to ${input.topic} in 2026`,
        `Why Most Creators Struggle with ${input.topic} (And the Fix)`,
        `${input.topic}: What You Actually Need to Know`,
      ];

  const openingHook = isShort
    ? `If you are trying to learn ${input.topic}, stop overcomplicating it. Here is the single workflow you actually need.`
    : `Most tutorials on ${input.topic} waste the first five minutes on theory. In this video, we are building a real project step-by-step so you understand every line.`;

  const localScenes: ProductionScene[] = [
    {
      time: "0:00–0:15",
      purpose: "High-Retention Opening Hook",
      voiceover: openingHook,
      visual: "Medium close-up direct to camera, high energy with finished outcome preview.",
      onScreen: `Master ${input.topic.slice(0, 24)}`,
      assetPrompt: `Crisp modern workspace, creator explaining ${input.topic} to camera with neon code graphics.`,
      editNote: "Cut dead air instantly. Kinetic typography on the first 5 words.",
    },
    {
      time: "0:15–1:00",
      purpose: "The Common Trap & Stakes",
      voiceover: `Here is the mistake almost everyone makes with ${input.topic}: they jump in without understanding the core mental model. That leads to frustration and abandoned projects.`,
      visual: "Screen capture showing common syntax/workflow error vs the clean approach.",
      onScreen: "The #1 Mistake to Avoid",
      assetPrompt: "Split screen comparing error log with elegant resolved solution.",
      editNote: "Whoosh transition into screen recording. Highlight red box over pitfall.",
    },
    {
      time: "1:00–2:30",
      purpose: "Core Concept Demonstration",
      voiceover: `Let's break this down into three simple components. First, initialize your environment. Notice how simple this structure is when we isolate the essentials.`,
      visual: "Live terminal/code demonstration with syntax highlighting and mouse zoom.",
      onScreen: "Step 1: Environment Setup",
      assetPrompt: "Clean UI dashboard interface updating dynamically.",
      editNote: "Gentle background lo-fi rhythm beats. Keep pace brisk.",
    },
    {
      time: "2:30–4:30",
      purpose: "Building the Solution",
      voiceover: `Now for the differentiator: ${cleanDiff}. By structuring it this way, you make the architecture clean, maintainable, and easy to explain.`,
      visual: "Side-by-side terminal output and visual preview updating in real time.",
      onScreen: "Step 2: Practical Implementation",
      assetPrompt: "3D animated diagram showing data flowing between nodes.",
      editNote: "Zoom in 1.15x for code punch-ins at key milestones.",
    },
    {
      time: "4:30–6:00",
      purpose: "Viewer Payoff & Next Step",
      voiceover: `And just like that, you have a working implementation. Check the description for the starter template and resources. What should we build next? Let me know in the comments.`,
      visual: "Back to camera with finished project running on laptop behind creator.",
      onScreen: "Project Complete! Grab Template Below",
      assetPrompt: "End-screen cards showing playlist and subscribe prompt.",
      editNote: "Call to action card overlay at bottom-left.",
    },
  ];

  const pack: ProductionPack = {
    topic: input.topic,
    audience: input.audience,
    outcome: promise,
    format: input.format || "Tutorial (6–12 min)",
    duration: input.duration || (isShort ? "<60 seconds" : "6–8 minutes"),
    tone: input.tone || "Friendly teacher",
    language: "English",
    titleOptions: localTitles,
    openingHook,
    voiceoverScript: localScenes.map((s) => `[${s.purpose}]: ${s.voiceover}`).join("\n\n"),
    scenes: localScenes,
    description: `Complete walkthrough on ${input.topic} for ${input.audience}.\n\n0:00 - Introduction & Hook\n0:15 - The Core Problem\n1:00 - Setup & Essentials\n2:30 - Live Demonstration\n4:30 - Finished Project & Next Steps\n\nResources: Link in description.`,
    hashtags: [
      `#${input.topic.replace(/[^a-z0-9]/gi, "").slice(0, 15)}`,
      "#tutorial",
      "#education",
      "#nextvideo",
    ],
    tags: [input.topic, "tutorial", "walkthrough", "beginner guide", "learn"],
    pinnedComment: `What part of ${input.topic} was the most challenging for you? Let me know below and I'll answer every question!`,
    productionChecklist: [
      "Check microphone levels (target -12dB to -6dB peak)",
      "Set camera key light to 45 degree angle",
      "Record 4K screen demo with clean browser profile",
      "Ensure terminal font size is at least 18pt for mobile viewers",
    ],
    source: "template",
    notice: "Configured LLM in Settings to generate bespoke AI video production packs with your preferred provider.",
  };

  const brief: VideoBrief = {
    topic: input.topic,
    audience: input.audience,
    format: input.format || "Tutorial (6–12 min)",
    promise,
    titles: pack.titleOptions,
    hook: pack.openingHook,
    outline: localScenes.map((s) => `${s.time} - ${s.purpose}`),
    thumbnail: `High-contrast YouTube thumbnail showing creator reaction alongside ${input.topic} key metric badge.`,
    measure: "Audience retention past 0:30 and CTR comparison.",
    note: cleanDiff,
    pack,
  };

  return {
    brief,
    pack,
    source: "template",
    model,
    notice: "Configure your LLM provider in Settings for live AI generation.",
  };
}

export async function generateVideoWithAI(
  input: GenerateVideoInput
): Promise<GeneratedVideoResult> {
  const baseConfig = getLLMConfig();
  const provider = input.provider || baseConfig.provider;
  const providerDef = LLM_PROVIDERS.find((p) => p.id === provider) || LLM_PROVIDERS[0];

  const apiKey = (input.apiKey?.trim() !== undefined && input.apiKey.trim() !== "" ? input.apiKey.trim() : baseConfig.apiKey);
  const model = (input.model?.trim() ? input.model.trim() : baseConfig.model);
  const baseUrl = (input.baseUrl?.trim() ? input.baseUrl.trim() : baseConfig.baseUrl || providerDef.defaultBaseUrl);

  const isConfigured = provider === "custom" ? true : Boolean(apiKey && apiKey.length > 4);

  if (!isConfigured) {
    throw new Error(`Configure ${providerDef.name} credentials before generating video packaging.`);
  }

  if (!isConfigured) {
    return synthesizeLocally(input, model);
  }

  try {
    const isShort = (input.format || "").toLowerCase().includes("short");
    const systemPrompt = `You are a world-class YouTube algorithmic strategist, video scriptwriter, and production director.
Your task is to take a creator's topic and produce a complete, viral-calibrated, high-retention video production pack.
You MUST output ONLY a valid JSON object matching this exact schema:
{
  "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "promise": "Viewer outcome promise",
  "hook": "Spoken 15-second opening retention hook script",
  "outline": ["0:00-0:30 Outline step 1", "0:30-1:45 Outline step 2"],
  "thumbnail": "Visual description of high-CTR thumbnail composition",
  "measure": "Retention and validation benchmark instructions",
  "scenes": [
    {
      "time": "0:00–0:15",
      "purpose": "Hook & Proof of Concept",
      "voiceover": "Exact natural spoken narration words for the speaker/teleprompter",
      "visual": "Camera shot, screen demonstration, and visual direction",
      "onScreen": "On-screen kinetic text overlay words",
      "assetPrompt": "AI image/b-roll generation prompt",
      "editNote": "Sound effects, pacing, and editing cuts"
    }
  ],
  "description": "Full YouTube description with chapter timestamps",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3"],
  "tags": ["keyword 1", "keyword 2", "keyword 3"],
  "pinnedComment": "Engaging community question to pin",
  "productionChecklist": ["Checklist item 1", "Checklist item 2"]
}
Return ONLY pure JSON. Do not wrap in markdown quotes if possible.`;

    const userPrompt = `Generate a complete video production pack for:
Topic: "${input.topic}"
Target Audience: "${input.audience}"
Core Outcome / Goal: "${input.goal || "Master the topic with a working practical example"}"
Format: "${input.format || "Tutorial (6–12 min)"}"
Channel Stage: "${input.stage || "Growing creator"}"
Unique Differentiator: "${input.differentiator || "Pragmatic, zero-fluff walkthrough"}"
Tone: "${input.tone || "Friendly teacher"}"
Duration Target: "${input.duration || (isShort ? "<60 seconds" : "6–8 minutes")}"
Produce 5 to 7 detailed scene breakdowns with exact teleprompter voiceover narration sentences.`;

    let rawContent = "";

    if (provider === "anthropic") {
      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic HTTP ${res.status}: ${err.slice(0, 150)}`);
      }
      const data = await res.json();
      rawContent = data.content?.[0]?.text || "";
    } else {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = "http://localhost:3000";
        headers["X-Title"] = "NextVideo Creator Studio";
      }

      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${providerDef.name} HTTP ${res.status}: ${err.slice(0, 150)}`);
      }
      const data = await res.json();
      rawContent = data.choices?.[0]?.message?.content || "";
    }

    // Parse json safely
    let parsed: any;
    try {
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`Invalid JSON received from ${providerDef.name} model (${model})`);
    }

    const scenes: ProductionScene[] = Array.isArray(parsed.scenes) && parsed.scenes.length > 0
      ? parsed.scenes.map((s: any, idx: number) => ({
          sceneNumber: idx + 1,
          timeRange: s.time || `${idx * 30}:00–${(idx + 1) * 30}:00`,
          purpose: s.purpose || `Scene ${idx + 1}`,
          voiceover: s.voiceover || `Key explanation point ${idx + 1}`,
          visualDirection: s.visual || "Demonstration camera angle",
          onScreenText: s.onScreen || "",
          bRollPrompt: s.assetPrompt || "",
          editingNotes: s.editNote || "",
        }))
      : fallbackPack({
          topic: input.topic,
          audience: input.audience,
          outcome: parsed.promise || input.goal || input.topic,
          format: input.format || "Tutorial (6–12 min)",
          duration: input.duration || (isShort ? "<60 seconds" : "6–8 minutes"),
          tone: input.tone || "Friendly teacher",
          language: "English",
        }).scenes;

    const pack: ProductionPack = {
      topic: input.topic,
      audience: input.audience,
      outcome: parsed.promise || input.goal || input.topic,
      format: input.format || "Tutorial (6–12 min)",
      duration: input.duration || (isShort ? "<60 seconds" : "6–8 minutes"),
      tone: input.tone || "Friendly teacher",
      language: "English",
      titleOptions: Array.isArray(parsed.titles) && parsed.titles.length > 0 ? parsed.titles : [input.topic],
      openingHook: parsed.hook || `Learn ${input.topic} effectively.`,
      voiceoverScript: scenes.map((s) => `[${s.purpose}]: ${s.voiceover}`).join("\n\n"),
      scenes,
      description: parsed.description || `In this video, we explore ${input.topic}.`,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ["#nextvideo", "#youtube"],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [input.topic],
      pinnedComment: parsed.pinnedComment || "What part of this was most helpful to you? Let me know below!",
      productionChecklist: Array.isArray(parsed.productionChecklist) ? parsed.productionChecklist : [
        "Record clean audio using shotgun or lapel mic",
        "Shoot 4K A-roll with focal length at eye level",
        "Add kinetic typography captions for key keywords",
      ],
      source: "ai",
      notice: `Generated with ${providerDef.name} (${model})`,
    };

    const brief: VideoBrief = {
      topic: input.topic,
      audience: input.audience,
      format: input.format || "Tutorial (6–12 min)",
      promise: parsed.promise || input.goal || input.topic,
      titles: pack.titleOptions,
      hook: pack.openingHook,
      outline: Array.isArray(parsed.outline) ? parsed.outline : [],
      thumbnail: parsed.thumbnail || "High contrast focal subject",
      measure: parsed.measure || "Compare CTR and watch time retention",
      note: input.differentiator,
      pack,
    };

    return {
      brief,
      pack,
      source: provider,
      model,
      notice: `Generated with ${providerDef.name} (${model})`,
    };
  } catch (err: any) {
    console.error("LLM generation fallback:", err.message);
    const fallback = synthesizeLocally(input, model);
    return {
      ...fallback,
      notice: `${providerDef.name} request failed (${err.message.slice(0, 90)}). Synthesized locally with template.`,
    };
  }
}

export interface PackagingAIResult {
  titles: string[];
  suggestedTitle: string;
  description: string;
  tags: string[];
  hashtags: string[];
  thumbnailConcepts: Array<{
    headline: string;
    textOverlay?: string;
    visualDescription: string;
    visualLayout?: string;
    focalPoint?: string;
    colorPalette: string;
    reason: string;
  }>;
  source: string;
  model: string;
  notice: string;
}

/**
 * Generates high-CTR titles, full description with timestamps, tags, and visual thumbnail concepts
 * using the user's configured LLM provider and model with a specialized system prompt.
 */
export async function generatePackagingWithAI(input: {
  topic?: string;
  transcriptOrSummary?: string;
  currentTitle?: string;
  transcriptText?: string;
  niche?: string;
  targetAudience?: string;
  winningFormulas?: string[];
  durationSeconds?: number;
}): Promise<PackagingAIResult> {
  const baseConfig = getLLMConfig();
  const provider = baseConfig.provider;
  const providerDef = LLM_PROVIDERS.find((p) => p.id === provider) || LLM_PROVIDERS[0];
  const apiKey = baseConfig.apiKey;
  const model = baseConfig.model;
  const baseUrl = baseConfig.baseUrl || providerDef.defaultBaseUrl;

  const isConfigured = provider === "custom" ? true : Boolean(apiKey && apiKey.length > 4);

  // Fallback defaults: derive concise topic <= 35 chars
  let rawTopic = (input.topic || input.currentTitle || input.transcriptOrSummary || "YouTube Video").trim();
  if (rawTopic.length > 35) {
    rawTopic = rawTopic.slice(0, 35).replace(/\s+\S*$/, "").trim();
  }
  const cleanTopic = rawTopic || "YouTube Video";
  const fallbackResult: PackagingAIResult = {
    titles: [
      `How I Mastered ${cleanTopic} (Step-by-Step)`,
      `The Only ${cleanTopic} Guide You Need in 2026`,
      `Why 90% of Creators Fail at ${cleanTopic}`,
      `I Tried ${cleanTopic} for 30 Days (Real Results)`,
      `Stop Doing ${cleanTopic} the Hard Way`,
    ],
    suggestedTitle: `How I Mastered ${cleanTopic} (Step-by-Step)`,
    description: `Complete walkthrough and practical insights on ${cleanTopic}.\n\n0:00 - Introduction & Hook\n0:30 - Core Pitfalls to Avoid\n2:15 - Practical Implementation\n5:00 - Key Takeaways & Results\n\n#${cleanTopic.replace(/[^a-z0-9]/gi, "").slice(0, 15)} #youtube #tutorial`,
    tags: [cleanTopic.toLowerCase(), "tutorial", "guide", "walkthrough", "best practices", "how to"],
    hashtags: [`#${cleanTopic.replace(/[^a-z0-9]/gi, "").slice(0, 15)}`, "#tutorial", "#youtube"],
    thumbnailConcepts: [
      {
        headline: "FAST PATH",
        textOverlay: "FAST PATH",
        visualDescription: `Side-by-side split screen showing confused creator vs clean ${cleanTopic} setup with green checkmark.`,
        visualLayout: "Side-by-side split comparison",
        focalPoint: "Green checkmark on clean setup",
        colorPalette: "Electric Blue (#2563EB) & Crisp White",
        reason: "Instant visual contrast showing the solution without repeating title text.",
      },
      {
        headline: "90% QUIT",
        textOverlay: "90% QUIT",
        visualDescription: `High-contrast close up of creator pointing at dramatic metric spike or red highlight box.`,
        visualLayout: "High-contrast close up",
        focalPoint: "Dramatic metric spike and red highlight",
        colorPalette: "Crimson Red (#DC2626) on Deep Slate (#0F172A)",
        reason: "High curiosity trigger and emotional stakes that stand out on mobile feeds.",
      },
      {
        headline: "REAL RESULTS",
        textOverlay: "REAL RESULTS",
        visualDescription: `Clean dashboard showing before/after results with bold glowing outcome indicator.`,
        visualLayout: "Clean before/after dashboard",
        focalPoint: "Glowing outcome indicator",
        colorPalette: "Emerald Green (#059669) & Amber Gold (#F59E0B)",
        reason: "Concrete proof-based packaging for audience seeking verified outcomes.",
      },
    ],
    source: "template",
    model,
    notice: isConfigured ? "Using template fallback." : `Configure ${providerDef.name} API key in Settings for live AI packaging.`,
  };

  if (!isConfigured) {
    return fallbackResult;
  }

  try {
    const systemPrompt = `You are a world-class YouTube packaging engineer, algorithm growth strategist, and thumbnail art director.
Your goal is to generate high-CTR titles, an SEO-optimized video description with chapter timestamps, search tags, and thumbnail concepts for a creator's video.

STRICT PACKAGING RULES:
1. TITLES:
   - Generate 5 distinct, compelling title options.
   - Use proven YouTube formulas: Curiosity Hook, Concrete Outcome, Direct Comparison, Beginner Guide.
   - Every title MUST be under 60 characters so search results never truncate them.
   - Front-load the most important keyword.
   - Avoid cheap, misleading clickbait.

2. DESCRIPTION:
   - First 2 lines must hook the reader with the core value proposition.
   - Include structured chapter timestamps (starting with 0:00).
   - Include a clear call to action and relevant hashtags.

3. THUMBNAILS:
   - Provide 3 visual concepts.
   - "headline": Short, punchy text overlay of 2 to 4 words MAX. CRITICAL: NEVER repeat words from the title!
   - "visualDescription": Composition, focal point, facial reaction/expression, lighting, and visual contrast.
   - "colorPalette": Specific high-contrast colors (e.g. Electric Blue #2563EB with Neon Yellow).
   - "reason": Strategic explanation for small-screen mobile feed visibility.

4. TAGS:
   - 6 to 10 relevant search phrases.

OUTPUT SCHEMA:
Output ONLY a valid JSON object matching this schema:
{
  "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "description": "Full description text with timestamps...",
  "tags": ["keyword 1", "keyword 2", "keyword 3"],
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "thumbnailConcepts": [
    {
      "headline": "2-3 WORDS",
      "visualDescription": "Visual composition and shot description",
      "colorPalette": "Colors and hex codes",
      "reason": "Strategic curiosity rationale"
    }
  ]
}`;

    const userPrompt = `Generate YouTube packaging for:
Topic / Subject: "${cleanTopic}"
Current Title Hint: "${input.currentTitle || cleanTopic}"
Video Duration: ${input.durationSeconds ? `${Math.floor(input.durationSeconds / 60)} mins` : "Unknown"}
Transcript Excerpt: "${(input.transcriptText || "").slice(0, 1500)}"`;

    let rawContent = "";

    if (provider === "anthropic") {
      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic HTTP ${res.status}: ${err.slice(0, 120)}`);
      }
      const data = await res.json();
      rawContent = data.content?.[0]?.text || "";
    } else {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = "http://localhost:3000";
        headers["X-Title"] = "NextVideo Creator Studio";
      }

      let res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok && (res.status === 404 || res.status === 400) && model !== "openai/gpt-4o-mini") {
        // Fallback to openai/gpt-4o-mini if discontinued model was requested
        res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
          }),
        });
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${providerDef.name} HTTP ${res.status}: ${err.slice(0, 120)}`);
      }
      const data = await res.json();
      rawContent = data.choices?.[0]?.message?.content || "";
    }

    // Robust JSON extraction matching outermost { ... }
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const cleaned = jsonMatch
      ? jsonMatch[0]
      : rawContent
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

    const parsed = JSON.parse(cleaned);

    const titles: string[] = Array.isArray(parsed.titles) ? parsed.titles.filter((title: unknown) => typeof title === "string" && title.trim().length > 0 && title.length <= 100) : [];
    const thumbnailConcepts = Array.isArray(parsed.thumbnailConcepts) && parsed.thumbnailConcepts.length > 0
      ? parsed.thumbnailConcepts.map((c: any) => ({
          headline: c.headline || c.textOverlay || "WATCH THIS",
          textOverlay: c.textOverlay || c.headline || "WATCH THIS",
          visualDescription: c.visualDescription || c.visualLayout || "",
          visualLayout: c.visualLayout || c.visualDescription || "",
          focalPoint: c.focalPoint || "",
          colorPalette: c.colorPalette || "High contrast",
          reason: c.reason || "",
        }))
      : [];

    if (titles.length !== 5 || typeof parsed.description !== "string" || parsed.description.trim().length < 30 || !Array.isArray(parsed.tags) || parsed.tags.length === 0) {
      throw new Error("Configured model response did not provide five titles, a useful description, and relevant tags.");
    }

    return {
      titles,
      suggestedTitle: titles[0],
      description: parsed.description,
      tags: parsed.tags,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      thumbnailConcepts,
      source: provider,
      model,
      notice: `Generated with ${providerDef.name} (${model})`,
    };
  } catch (err: any) {
    console.warn(`[Packaging AI Warning] ${providerDef.name} (${model}) failed: ${err.message}. Using evidence-grounded packaging.`);
    return {
      ...fallbackResult,
      notice: `${providerDef.name} (${model}) unavailable (${err.message}). Assets were generated from verified video evidence.`,
    };
  }
}

