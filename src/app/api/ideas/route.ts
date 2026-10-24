import { NextRequest, NextResponse } from "next/server";
import { fallbackPack } from "@/lib/productionPack";

function clean(v: unknown, limit: number): string {
  return typeof v === "string" ? v.trim().slice(0, limit) : "";
}

function localBrief(topic: string, audience: string, goal: string, format: string, differentiator?: string) {
  const isShort = format.toLowerCase().includes("short");
  const isDeepDive = format.toLowerCase().includes("deep");
  const promise = goal || `Understand ${topic} and complete one practical next step.`;
  const cleanDiff = differentiator ? differentiator.trim() : "";

  // Dynamic high-CTR title variations
  const titles = isShort
    ? [
        `The Only ${topic} Trick You Need to Know`,
        `Stop Doing ${topic} Wrong (Do This Instead)`,
        `How to Master ${topic} in 60 Seconds`,
        `${topic} Explained with Zero Fluff`,
      ]
    : [
        `${topic}: A Complete Beginner Walkthrough (Step by Step)`,
        `How to Master ${topic} Without Getting Stuck`,
        `The Pragmatic Guide to ${topic} ${cleanDiff ? `(${cleanDiff})` : "in 2026"}`,
        `Before You Try ${topic}, Watch This First`,
        `5 Critical Mistakes People Make with ${topic} (And the Fix)`,
      ];

  const hook = isShort
    ? `“If you've been struggling with ${topic.toLowerCase()}, stop doing it the hard way. In 45 seconds, I'll show you the exact pattern that actually works.”`
    : `“If you are ${audience.toLowerCase()}, this video will teach you how to ${promise.charAt(0).toLowerCase() + promise.slice(1).replace(/[.!?]+$/, "")}. We'll start with the finished outcome right here, then walk through each critical step together.”`;

  const outline = isShort
    ? [
        "0:00–0:03 · High-impact visual hook & core payoff proof",
        "0:04–0:15 · The counter-intuitive key technique (demonstrated live)",
        "0:16–0:30 · Common fatal mistake vs the clean solution",
        "0:31–0:45 · Finished result recap + 1 actionable next step",
      ]
    : isDeepDive
    ? [
        "0:00–0:45 · Cold open: the core challenge, outcome preview & audience pledge",
        "0:45–3:30 · Foundation architecture: only the essential concepts to begin",
        "3:30–9:00 · Core hands-on walkthrough with numbered execution milestones",
        "9:00–14:00 · Production-grade edge cases, debugging & common pitfalls",
        "14:00–18:00 · Final testing, optimization checklist & practical challenge",
      ]
    : [
        "0:00–0:30 · Cold open hook with working payoff preview",
        "0:30–1:45 · Foundation setup without filler",
        "1:45–4:30 · Step-by-step practical build walkthrough",
        "4:30–6:00 · Common mistake demonstration & troubleshooting",
        "6:00–7:00 · Result review, takeaways & viewer challenge",
      ];

  const thumbnail = `High-contrast composition showing the completed ${topic} outcome with clean visual contrast. Keep at most 3-4 readable bold words. ${
    cleanDiff ? `Visual cue highlight: "${cleanDiff}".` : "Focus on clean subject with zero misleading hype."
  }`;

  const measure = `Compare 48-hour CTR with channel median. Analyze retention curve at the 0:30 mark to evaluate hook effectiveness. Check comment themes to identify follow-up video opportunities.`;

  return {
    topic,
    audience,
    format,
    promise,
    titles,
    hook,
    outline,
    thumbnail,
    measure,
    note: cleanDiff,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const topic = clean(body.topic, 180);
  const audience = clean(body.audience, 180) || "Curious learners & creators";
  const goal = clean(body.goal, 400);
  const format = clean(body.format, 80) || "Tutorial (6–12 min)";
  const stage = clean(body.stage, 80) || "New channel";
  const differentiator = clean(body.differentiator, 200);

  if (!topic) return NextResponse.json({ error: "A video topic is required." }, { status: 400 });
  if (topic.length < 3) return NextResponse.json({ error: "Please enter a more specific topic." }, { status: 400 });

  const brief = localBrief(topic, audience, goal, format, differentiator);

  // Also build the full video production pack (scenes, teleprompter, visual cues, metadata)
  const pack = fallbackPack({
    topic,
    audience,
    outcome: brief.promise,
    format: format.toLowerCase().includes("short") ? "Short" : "Long-form",
    duration: format.toLowerCase().includes("short") ? "<60 seconds" : "6–8 minutes",
    tone: "Friendly teacher",
    language: "English",
    differentiator,
    cta: "Try this in your own project and let me know in the comments what part you'd like us to deep dive next!",
  });

  return NextResponse.json({
    source: "template",
    brief: {
      ...brief,
      pack,
    },
    pack,
    notice: "Full video strategy blueprint and production pack ready.",
  });
}
