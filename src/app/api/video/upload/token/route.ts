import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { MAX_FILE_SIZE_BYTES, SUPPORTED_EXTENSIONS, sanitizeFilename } from "@/lib/video/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Video upload storage is not configured. Add BLOB_READ_WRITE_TOKEN to the server environment and redeploy.",
          code: "BLOB_STORAGE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || "{}");
        const assetId = String(payload.assetId || "");
        const filename = sanitizeFilename(String(payload.filename || ""));
        const mimeType = String(payload.mimeType || "");
        const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
        if (!/^[a-zA-Z0-9_-]{8,80}$/.test(assetId) || !SUPPORTED_EXTENSIONS.has(extension)) throw new Error("Invalid upload metadata.");
        if (pathname !== `nextvideo/${assetId}/${filename}`) throw new Error("Upload path does not match the authorized asset.");
        return {
          allowedContentTypes: mimeType ? [mimeType] : ["video/*"],
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          validUntil: Date.now() + 15 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ assetId, filename, mimeType }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to authorize upload." }, { status: 400 });
  }
}
