import { NextResponse } from "next/server";
import { getOpenRouterConfig } from "@/lib/openrouter";

export async function GET() {
  const config = getOpenRouterConfig();
  return NextResponse.json({
    isConfigured: config.isConfigured,
    model: config.model,
    hasKey: Boolean(config.apiKey),
    maskedKey: config.apiKey
      ? `${config.apiKey.slice(0, 7)}...${config.apiKey.slice(-4)}`
      : null,
  });
}
