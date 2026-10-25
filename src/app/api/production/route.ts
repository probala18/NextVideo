import { NextRequest, NextResponse } from "next/server";
import { generateVideoWithAI } from "@/lib/openrouter";

function clean(value: unknown, limit: number, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : fallback;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const topic = clean(body.topic, 180);
  const audience = clean(body.audience, 180, "curious beginners") || "curious beginners";
  let outcome = clean(body.outcome, 300);
  const format = clean(body.format, 40, "Long-form") || "Long-form";
  const duration = clean(body.duration, 60, "6–8 minutes") || "6–8 minutes";
  const tone = clean(body.tone, 80, "Friendly teacher") || "Friendly teacher";
  const language = clean(body.language, 60, "English") || "English";
  const differentiator = clean(body.differentiator, 240);
  const cta = clean(body.cta, 300);

  if (!topic || topic.length < 3) {
    return NextResponse.json({ error: "Enter a specific video topic." }, { status: 400 });
  }
  if (!outcome) {
    outcome = "understand " + topic + " and complete one useful next step";
  }

  const result = await generateVideoWithAI({
    topic,
    audience,
    goal: outcome,
    format,
    duration,
    tone,
    differentiator,
    cta,
    model: typeof body.model === "string" ? body.model.trim() : undefined,
    apiKey: typeof body.apiKey === "string" ? body.apiKey.trim() : undefined,
  });

  return NextResponse.json(result.pack);
}
