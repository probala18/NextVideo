import { NextRequest, NextResponse } from "next/server";
import { generateVideoWithAI } from "@/lib/openrouter";

function clean(v: unknown, limit: number): string {
  return typeof v === "string" ? v.trim().slice(0, limit) : "";
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

  const result = await generateVideoWithAI({
    topic,
    audience,
    goal,
    format,
    stage,
    differentiator,
    model: typeof body.model === "string" ? body.model.trim() : undefined,
    apiKey: typeof body.apiKey === "string" ? body.apiKey.trim() : undefined,
  });

  return NextResponse.json({
    source: result.source,
    model: result.model,
    brief: result.brief,
    pack: result.pack,
    notice: result.notice,
  });
}
