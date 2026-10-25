import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/youtube/publishing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return renderCallbackResponse({
        success: false,
        error: `Google authorization failed: ${error}`,
      });
    }

    if (!code) {
      return renderCallbackResponse({
        success: false,
        error: "Missing authorization code from Google.",
      });
    }

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const redirectUri = `${origin}/api/youtube/callback`;

    const auth = await exchangeCodeForTokens(code, redirectUri);

    return renderCallbackResponse({
      success: true,
      channelTitle: auth.channelTitle || "Connected YouTube Channel",
      channelId: auth.channelId,
    });
  } catch (err: any) {
    return renderCallbackResponse({
      success: false,
      error: err.message || "Failed to exchange YouTube authorization code.",
    });
  }
}

function renderCallbackResponse(params: {
  success: boolean;
  channelTitle?: string;
  channelId?: string;
  error?: string;
}) {
  const { success, channelTitle = "", channelId = "", error = "" } = params;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${success ? "YouTube Connected" : "YouTube Auth Error"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0B0F19;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      background: #111827;
      border: 1px solid ${success ? "#10B981" : "#EF4444"};
      border-radius: 20px;
      padding: 32px 28px;
      max-width: 420px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    h2 {
      margin: 0 0 10px;
      font-size: 20px;
      color: ${success ? "#10B981" : "#EF4444"};
    }
    p {
      margin: 0 0 18px;
      font-size: 13px;
      color: #94A3B8;
      line-height: 1.5;
    }
    .channel-badge {
      display: inline-block;
      background: #1F2937;
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 18px;
      border: 1px solid #374151;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>${success ? "✓ YouTube Connected Successfully!" : "Connection Failed"}</h2>
    ${
      success && channelTitle
        ? `<div class="channel-badge">${channelTitle}</div>`
        : ""
    }
    <p>${
      success
        ? "Your YouTube channel credentials are now saved. You can close this window and continue in the Studio."
        : error
    }</p>
    <p style="font-size: 11px; color: #64748B;">This window will close automatically...</p>
  </div>

  <script>
    (function() {
      var payload = {
        type: "${success ? "YOUTUBE_OAUTH_SUCCESS" : "YOUTUBE_OAUTH_ERROR"}",
        success: ${success},
        channelTitle: ${JSON.stringify(channelTitle)},
        channelId: ${JSON.stringify(channelId)},
        error: ${JSON.stringify(error)}
      };

      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, "*");
          setTimeout(function() {
            window.close();
          }, 1200);
          return;
        }
      } catch (e) {
        console.warn("Could not postMessage to opener:", e);
      }

      // Fallback if not opened in a popup window
      setTimeout(function() {
        window.location.href = "/?view=autonomous&youtube_auth=${success ? "success" : "failed"}";
      }, 1500);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
