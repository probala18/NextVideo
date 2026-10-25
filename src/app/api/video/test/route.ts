import { NextRequest, NextResponse } from "next/server";
import { testOpenRouterConnection } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const model = typeof body.model === "string" ? body.model.trim() : undefined;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;

    const result = await testOpenRouterConnection(model, apiKey);
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
