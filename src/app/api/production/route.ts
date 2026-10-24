import { NextRequest, NextResponse } from "next/server";
import { fallbackPack } from "@/lib/productionPack";

function clean(value: unknown, limit: number, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : fallback;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input = {
    topic: clean(body.topic, 180),
    audience: clean(body.audience, 180, "curious beginners") || "curious beginners",
    outcome: clean(body.outcome, 300),
    format: clean(body.format, 40, "Long-form") || "Long-form",
    duration: clean(body.duration, 60, "6–8 minutes") || "6–8 minutes",
    tone: clean(body.tone, 80, "Friendly teacher") || "Friendly teacher",
    language: clean(body.language, 60, "English") || "English",
    differentiator: clean(body.differentiator, 240),
    cta: clean(body.cta, 300),
  };

  if (!input.topic || input.topic.length < 3) {
    return NextResponse.json({ error: "Enter a specific video topic." }, { status: 400 });
  }
  if (!input.outcome) {
    input.outcome = "understand " + input.topic + " and complete one useful next step";
  }

  const pack = fallbackPack(input);

  return NextResponse.json(pack);
}
