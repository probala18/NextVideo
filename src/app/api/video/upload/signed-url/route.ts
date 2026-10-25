import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/video/storage";

export const dynamic = "force-dynamic";

/**
 * Generates short-lived signed upload tokens/URLs for large video files,
 * enabling direct object storage uploads without hitting Vercel's 4.5MB serverless body limit.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, filesizeBytes, mimeType } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const ext = `.${filename.split(".").pop() || ""}`.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported format "${ext}". Supported: ${Array.from(
            SUPPORTED_EXTENSIONS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (filesizeBytes && filesizeBytes > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the ${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(
            0
          )}MB limit.`,
        },
        { status: 400 }
      );
    }

    // Generate short-lived (15 minutes) signed upload identifier & token
    const assetId = `vid_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const signature = crypto
      .createHmac("sha256", process.env.NEXTAUTH_SECRET || "nextvideo_secret_key_2026")
      .update(`${assetId}:${filename}:${expiresAt}`)
      .digest("hex");

    return NextResponse.json({
      success: true,
      assetId,
      uploadUrl: `/api/video/upload?assetId=${assetId}&expires=${expiresAt}&sig=${signature}`,
      expiresAt: new Date(expiresAt).toISOString(),
      allowedExtensions: Array.from(SUPPORTED_EXTENSIONS),
      maxSizeBytes: MAX_FILE_SIZE_BYTES,
      notes: "Short-lived signed upload ticket verified for direct streaming upload.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate signed upload URL" },
      { status: 500 }
    );
  }
}
