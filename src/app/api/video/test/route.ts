import { NextRequest, NextResponse } from "next/server";
import { testLLMConnection } from "@/lib/openrouter";
import { LLMProviderId } from "@/lib/llmProviders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const provider = (typeof body.provider === "string" ? body.provider.trim() : undefined) as LLMProviderId | undefined;
    const model = typeof body.model === "string" ? body.model.trim() : undefined;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : undefined;

    const result = await testLLMConnection(provider, model, apiKey, baseUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to execute connection test.",
        latencyMs: 0,
      },
      { status: 500 }
    );
  }
}
