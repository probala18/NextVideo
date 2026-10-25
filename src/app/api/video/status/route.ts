import { NextRequest, NextResponse } from "next/server";
import { getOpenRouterConfig, setOpenRouterConfig } from "@/lib/openrouter";
import fs from "fs";
import path from "path";

export async function GET() {
  const config = getOpenRouterConfig();
  return NextResponse.json({
    isConfigured: config.isConfigured,
    model: config.model,
    hasKey: Boolean(config.apiKey),
    maskedKey: config.apiKey
      ? `${config.apiKey.slice(0, 8)}...${config.apiKey.slice(-4)}`
      : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const model = typeof body.model === "string" ? body.model.trim() : undefined;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;

    if (model !== undefined || apiKey !== undefined) {
      setOpenRouterConfig({ model, apiKey });

      // Persist to .env.local if possible
      try {
        const envLocalPath = path.resolve(process.cwd(), ".env.local");
        let envContent = "";
        if (fs.existsSync(envLocalPath)) {
          envContent = fs.readFileSync(envLocalPath, "utf-8");
        }

        if (model !== undefined) {
          if (/^OPENROUTER_MODEL=.*/m.test(envContent)) {
            envContent = envContent.replace(/^OPENROUTER_MODEL=.*/m, `OPENROUTER_MODEL=${model}`);
          } else {
            envContent += `\nOPENROUTER_MODEL=${model}`;
          }
        }

        if (apiKey !== undefined && apiKey.length > 0) {
          if (/^OPENROUTER_API_KEY=.*/m.test(envContent)) {
            envContent = envContent.replace(/^OPENROUTER_API_KEY=.*/m, `OPENROUTER_API_KEY=${apiKey}`);
          } else {
            envContent += `\nOPENROUTER_API_KEY=${apiKey}`;
          }
        }

        fs.writeFileSync(envLocalPath, envContent.trim() + "\n", "utf-8");
      } catch (err) {
        console.warn("Could not write to .env.local:", err);
      }
    }

    const updated = getOpenRouterConfig();
    return NextResponse.json({
      success: true,
      isConfigured: updated.isConfigured,
      model: updated.model,
      hasKey: Boolean(updated.apiKey),
      maskedKey: updated.apiKey
        ? `${updated.apiKey.slice(0, 8)}...${updated.apiKey.slice(-4)}`
        : null,
      message: `Model configured to: ${updated.model}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update configuration" }, { status: 500 });
  }
}
