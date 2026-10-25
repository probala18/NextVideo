import { VideoBrief, ProductionPack, ProductionScene } from "@/types";
import { fallbackPack } from "./productionPack";

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  isConfigured: boolean;
}

let runtimeModel: string | null = null;
let runtimeApiKey: string | null = null;

export function setOpenRouterConfig(updates: { model?: string; apiKey?: string }) {
  if (updates.model !== undefined && updates.model.trim()) {
    runtimeModel = updates.model.trim();
  }
  if (updates.apiKey !== undefined) {
    runtimeApiKey = updates.apiKey.trim();
  }
}

export function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = (runtimeApiKey !== null ? runtimeApiKey : process.env.OPENROUTER_API_KEY || "").trim();
  const model = (runtimeModel !== null ? runtimeModel : process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini").trim();
  return {
    apiKey,
    model,
    isConfigured: Boolean(apiKey && apiKey.length > 5),
  };
}

export async function testOpenRouterConnection(customModel?: string, customKey?: string): Promise<{
  success: boolean;
  model: string;
  latencyMs: number;
  message: string;
}> {
  const baseConfig = getOpenRouterConfig();
  const apiKey = (customKey !== undefined ? customKey : baseConfig.apiKey).trim();
  const model = (customModel !== undefined && customModel.trim() ? customModel.trim() : baseConfig.model);

  if (!apiKey || apiKey.length < 5) {
    return {
      success: false,
      model,
      latencyMs: 0,
      message: "No OpenRouter API key configured. Provide an API key to test live connections.",
    };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "NextVideo Creator Studio",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word 'READY'." }],
        max_tokens: 5,
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
        model,
        latencyMs,
        message: `OpenRouter returned status ${res.status}: ${parsedMsg}`,
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "OK";
    return {
      success: true,
      model,
      latencyMs,
      message: `Connected successfully (${reply}) in ${latencyMs}ms.`,
    };
  } catch (err: any) {
    return {
      success: false,
      model,
      latencyMs: Date.now() - start,
      message: err.message || "Failed to reach OpenRouter endpoint.",
    };
  }
}

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
  model?: string;
  apiKey?: string;
}

export interface GeneratedVideoResult {
  brief: VideoBrief;
  pack: ProductionPack;
  source: "openrouter" | "template";
  model: string;
  notice: string;
}

function synthesizeLocally(input: GenerateVideoInput, model: string): GeneratedVideoResult {
  const isShort = (input.format || "").toLowerCase().includes("short");
  const isDeep = (input.format || "").toLowerCase().includes("deep");
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
        `${input.topic}: A Complete Beginner Walkthrough (Step by Step)`,
        `How to Master ${input.topic} Without Getting Stuck`,
        `The Pragmatic Guide to ${input.topic} ${cleanDiff ? `(${cleanDiff})` : "in 2026"}`,
        `Before You Try ${input.topic}, Watch This First`,
        `5 Critical Mistakes People Make with ${input.topic} (And the Fix)`,
      ];

  const localHook = isShort
    ? `“If you've been struggling with ${input.topic.toLowerCase()}, stop doing it the hard way. In 45 seconds, I'll show you the exact pattern that actually works.”`
    : `“If you are ${input.audience.toLowerCase()}, this video will teach you how to ${promise.charAt(0).toLowerCase() + promise.slice(1).replace(/[.!?]+$/, "")}. We'll start with the finished outcome right here, then walk through each critical step together.”`;

  const localOutline = isShort
    ? [
        "0:00–0:03 · High-impact visual hook & core payoff proof",
        "0:04–0:15 · The counter-intuitive key technique (demonstrated live)",
        "0:16–0:30 · Common fatal mistake vs the clean solution",
        "0:31–0:45 · Finished result recap + 1 actionable next step",
      ]
    : [
        "0:00–0:30 · Cold open hook with working payoff preview",
        "0:30–1:45 · Foundation setup without filler",
        "1:45–4:30 · Step-by-step practical build walkthrough",
        "4:30–6:00 · Common mistake demonstration & troubleshooting",
        "6:00–7:00 · Result review, takeaways & viewer challenge",
      ];

  const pack = fallbackPack({
    topic: input.topic,
    audience: input.audience,
    outcome: promise,
    format: isShort ? "Short" : "Long-form",
    duration: isShort ? "<60 seconds" : isDeep ? "15–20 minutes" : "6–8 minutes",
    tone: input.tone || "Friendly teacher",
    language: "English",
    differentiator: input.differentiator,
    cta: input.cta || "Try this in your own project and let me know in the comments what part you'd like us to deep dive next!",
  });

  const brief: VideoBrief = {
    topic: input.topic,
    audience: input.audience,
    format: input.format || "Tutorial (6–12 min)",
    promise,
    titles: localTitles,
    hook: localHook,
    outline: localOutline,
    thumbnail: `High-contrast composition showing the completed ${input.topic} outcome with clean visual contrast. Keep at most 3-4 readable bold words. ${
      cleanDiff ? `Visual cue highlight: "${cleanDiff}".` : "Focus on clean subject with zero misleading hype."
    }`,
    measure: "Compare 48-hour CTR with channel median. Analyze retention curve at the 0:30 mark to evaluate hook effectiveness.",
    note: cleanDiff,
    pack,
  };

  return {
    brief,
    pack,
    source: "template",
    model,
    notice: "Add OPENROUTER_API_KEY in Settings to generate live AI video with OpenRouter.",
  };
}

export async function generateVideoWithAI(
  input: GenerateVideoInput
): Promise<GeneratedVideoResult> {
  const baseConfig = getOpenRouterConfig();
  const apiKey = (input.apiKey?.trim() !== undefined && input.apiKey.trim() !== "" ? input.apiKey.trim() : baseConfig.apiKey);
  const model = (input.model?.trim() ? input.model.trim() : baseConfig.model);
  const isConfigured = Boolean(apiKey && apiKey.length > 5);

  // If OpenRouter is not configured with an API key, use the local synthesizer
  if (!isConfigured) {
    return synthesizeLocally(input, model);
  }

  // Live OpenRouter API Call
  try {
    const isShort = (input.format || "").toLowerCase().includes("short");
    const systemPrompt = `You are a world-class YouTube algorithmic strategist, video scriptwriter, and production director.
Your task is to take a creator's topic and produce a complete, viral-calibrated, high-retention video production pack.
You MUST output ONLY a valid JSON object matching this exact schema:
{
  "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "promise": "Viewer outcome promise",
  "hook": "Spoken 15-second opening retention hook script",
  "outline": ["0:00-0:30 Outline step 1", "0:30-1:45 Outline step 2", ...],
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
  "productionChecklist": ["Checklist item 1", "Checklist item 2", ...]
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

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "NextVideo Creator Studio",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errText.slice(0, 150)}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
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
      throw new Error("Invalid JSON received from OpenRouter model");
    }

    // Build typed ProductionScenes
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
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ["#creatorlens", "#youtube"],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [input.topic],
      pinnedComment: parsed.pinnedComment || "What part of this was most helpful to you? Let me know below!",
      productionChecklist: Array.isArray(parsed.productionChecklist) ? parsed.productionChecklist : [
        "Record clean audio using shotgun or lapel mic",
        "Shoot 4K A-roll with focal length at eye level",
        "Add kinetic typography captions for key keywords",
      ],
      source: "ai",
      notice: `Generated with OpenRouter (${model})`,
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
      source: "openrouter",
      model: model,
      notice: `Generated with OpenRouter (${model})`,
    };
  } catch (err: any) {
    console.error("OpenRouter generation fallback:", err.message);
    const fallback = synthesizeLocally(input, model);
    return {
      ...fallback,
      notice: `OpenRouter request failed (${err.message.slice(0, 90)}). Synthesized locally with template.`,
    };
  }
}
