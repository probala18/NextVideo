import { NextRequest, NextResponse } from "next/server";
import {
  getStoredAuth,
  generateOAuthUrl,
  disconnectYouTubeChannel,
  saveStoredAuth,
} from "@/lib/youtube/publishing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = getStoredAuth();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const hasOAuthConfig = Boolean(
      process.env.YOUTUBE_OAUTH_CLIENT_ID && process.env.YOUTUBE_OAUTH_CLIENT_SECRET
    );

    if (action === "connect") {
      if (!hasOAuthConfig) {
        return NextResponse.json(
          {
            error:
              "YOUTUBE_OAUTH_CLIENT_ID or YOUTUBE_OAUTH_CLIENT_SECRET is missing in server environment.",
          },
          { status: 400 }
        );
      }

      const origin = req.nextUrl.origin || "http://localhost:3000";
      const redirectUri = `${origin}/api/youtube/callback`;
      const oauthUrl = generateOAuthUrl(redirectUri);
      return NextResponse.json({ success: true, oauthUrl });
    }

    return NextResponse.json({
      success: true,
      hasOAuthConfig,
      isConnected: Boolean(auth && auth.accessToken),
      channel: auth
        ? {
            channelId: auth.channelId,
            channelTitle: auth.channelTitle,
            avatarUrl: auth.avatarUrl,
            privacyDefault: auth.privacyDefault,
            autoPublishPolicy: auth.autoPublishPolicy,
            authorizedAt: auth.authorizedAt,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process YouTube auth" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = getStoredAuth();
    if (!auth) {
      return NextResponse.json({ error: "No channel connected" }, { status: 400 });
    }

    if (body.privacyDefault) auth.privacyDefault = body.privacyDefault;
    if (body.autoPublishPolicy) auth.autoPublishPolicy = body.autoPublishPolicy;

    saveStoredAuth(auth);
    return NextResponse.json({ success: true, channel: auth });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update publishing preferences" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    disconnectYouTubeChannel();
    return NextResponse.json({ success: true, message: "YouTube account disconnected" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to disconnect YouTube account" },
      { status: 500 }
    );
  }
}
