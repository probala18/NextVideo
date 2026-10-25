import { NextRequest, NextResponse } from "next/server";
import { getLLMConfig, setLLMConfig } from "@/lib/openrouter";
import { LLM_PROVIDERS, LLMProviderId } from "@/lib/llmProviders";
import fs from "fs";
import path from "path";

export async function GET() {
  const config = getLLMConfig();
  const providerDef = LLM_PROVIDERS.find((p) => p.id === config.provider) || LLM_PROVIDERS[0];

  return NextResponse.json({
    provider: config.provider,
    providerName: providerDef.name,
    model: config.model,
    baseUrl: config.baseUrl,
    isConfigured: config.isConfigured,
    hasKey: Boolean(config.apiKey),
    maskedKey: config.apiKey
      ? `${config.apiKey.slice(0, 6)}...${config.apiKey.slice(-4)}`
      : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const provider = (typeof body.provider === "string" ? body.provider.trim() : undefined) as LLMProviderId | undefined;
    const model = typeof body.model === "string" ? body.model.trim() : undefined;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : undefined;

    setLLMConfig({ provider, model, apiKey, baseUrl });

    // Persist to .env.local
    try {
      const envLocalPath = path.resolve(process.cwd(), ".env.local");
      let envContent = "";
      if (fs.existsSync(envLocalPath)) {
        envContent = fs.readFileSync(envLocalPath, "utf-8");
      }

      if (provider !== undefined) {
        if (/^LLM_PROVIDER=.*/m.test(envContent)) {
          envContent = envContent.replace(/^LLM_PROVIDER=.*/m, `LLM_PROVIDER=${provider}`);
        } else {
          envContent += `\nLLM_PROVIDER=${provider}`;
        }
      }

      if (model !== undefined) {
        if (/^LLM_MODEL=.*/m.test(envContent)) {
          envContent = envContent.replace(/^LLM_MODEL=.*/m, `LLM_MODEL=${model}`);
        } else {
          envContent += `\nLLM_MODEL=${model}`;
        }
        // Also keep OPENROUTER_MODEL in sync for backward compatibility if openrouter
        if (provider === "openrouter" || !provider) {
          if (/^OPENROUTER_MODEL=.*/m.test(envContent)) {
            envContent = envContent.replace(/^OPENROUTER_MODEL=.*/m, `OPENROUTER_MODEL=${model}`);
          } else {
            envContent += `\nOPENROUTER_MODEL=${model}`;
          }
        }
      }

      if (apiKey !== undefined && apiKey.length > 0) {
        if (/^LLM_API_KEY=.*/m.test(envContent)) {
          envContent = envContent.replace(/^LLM_API_KEY=.*/m, `LLM_API_KEY=${apiKey}`);
        } else {
          envContent += `\nLLM_API_KEY=${apiKey}`;
        }
        if (provider === "openrouter" || !provider) {
          if (/^OPENROUTER_API_KEY=.*/m.test(envContent)) {
            envContent = envContent.replace(/^OPENROUTER_API_KEY=.*/m, `OPENROUTER_API_KEY=${apiKey}`);
          } else {
            envContent += `\nOPENROUTER_API_KEY=${apiKey}`;
          }
        }
      }

      if (baseUrl !== undefined) {
        if (/^LLM_BASE_URL=.*/m.test(envContent)) {
          envContent = envContent.replace(/^LLM_BASE_URL=.*/m, `LLM_BASE_URL=${baseUrl}`);
        } else {
          envContent += `\nLLM_BASE_URL=${baseUrl}`;
        }
      }

      fs.writeFileSync(envLocalPath, envContent.trim() + "\n", "utf-8");
    } catch (err) {
      console.warn("Could not write to .env.local:", err);
    }

    const updated = getLLMConfig();
    const providerDef = LLM_PROVIDERS.find((p) => p.id === updated.provider) || LLM_PROVIDERS[0];

    return NextResponse.json({
      success: true,
      provider: updated.provider,
      providerName: providerDef.name,
      model: updated.model,
      baseUrl: updated.baseUrl,
      isConfigured: updated.isConfigured,
      hasKey: Boolean(updated.apiKey),
      maskedKey: updated.apiKey
        ? `${updated.apiKey.slice(0, 6)}...${updated.apiKey.slice(-4)}`
        : null,
      message: `Configured to ${providerDef.name} (${updated.model})`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update configuration" }, { status: 500 });
  }
}
