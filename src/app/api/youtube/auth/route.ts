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

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const redirectUri = `${origin}/api/youtube/callback`;

    let oauthUrl: string | null = null;
    if (hasOAuthConfig) {
      try {
        oauthUrl = generateOAuthUrl(redirectUri);
      } catch {
        oauthUrl = null;
      }
    }

    if (action === "connect") {
      if (!hasOAuthConfig || !oauthUrl) {
        return NextResponse.json({
          success: false,
          hasOAuthConfig: false,
          redirectUri,
          error:
            "YouTube OAuth credentials (YOUTUBE_OAUTH_CLIENT_ID and YOUTUBE_OAUTH_CLIENT_SECRET) are not yet configured.",
        });
      }

      return NextResponse.json({
        success: true,
        hasOAuthConfig: true,
        oauthUrl,
        authUrl: oauthUrl,
        redirectUri,
      });
    }

    return NextResponse.json({
      success: true,
      hasOAuthConfig,
      oauthUrl,
      authUrl: oauthUrl,
      redirectUri,
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
    const body = await req.json().catch(() => ({}));
    if (body.clientId || body.clientSecret) {
      return NextResponse.json({
        error: "OAuth credentials must be configured as server environment variables; they cannot be accepted over this endpoint.",
        required: ["YOUTUBE_OAUTH_CLIENT_ID", "YOUTUBE_OAUTH_CLIENT_SECRET"],
      }, { status: 400 });
    }

    // Option B: Update channel publishing preferences
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
