import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAssetPath } from "@/lib/video/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const slug = params.slug || [];
    if (slug.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const assetId = slug[0];
    const subpath = slug.slice(1).join("/");

    const fullPath = getAssetPath(assetId, subpath);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return new NextResponse("Asset not found", { status: 404 });
    }

    const stat = await fs.promises.stat(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".mov") contentType = "video/quicktime";
    else if (ext === ".webm") contentType = "video/webm";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".png") {
      // Check if file is actually an SVG card to prevent browser decoding failure
      const headerChunk = Buffer.alloc(32);
      const fd = await fs.promises.open(fullPath, "r");
      await fd.read(headerChunk, 0, 32, 0);
      await fd.close();
      if (headerChunk.toString().trim().startsWith("<svg")) {
        contentType = "image/svg+xml";
      } else {
        contentType = "image/png";
      }
    }
    else if (ext === ".json") contentType = "application/json";
    else if (ext === ".edl" || ext === ".txt" || ext === ".srt" || ext === ".vtt") {
      contentType = "text/plain; charset=utf-8";
    }

    const isDownload = req.nextUrl.searchParams.get("download") === "1" || req.nextUrl.searchParams.get("download") === "true";
    const disposition = isDownload || ext === ".edl" || ext === ".json"
      ? `attachment; filename="${path.basename(fullPath)}"`
      : "inline";

    // Support HTTP range requests for smooth video playback and scrubbing
    const range = req.headers.get("range");
    if (range && contentType.startsWith("video/")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(fullPath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": contentType,
          "Content-Disposition": disposition,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Direct read for non-ranged responses
    const fileBuffer = await fs.promises.readFile(fullPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Content-Disposition": disposition,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || "Failed to serve asset", { status: 500 });
  }
}
