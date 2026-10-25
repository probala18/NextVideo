import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/youtube/publishing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/?youtube_auth=error", req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/?youtube_auth=missing_code", req.url));
    }

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const redirectUri = `${origin}/api/youtube/callback`;

    await exchangeCodeForTokens(code, redirectUri);

    return NextResponse.redirect(new URL("/?youtube_auth=success", req.url));
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/?youtube_auth=failed&msg=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
