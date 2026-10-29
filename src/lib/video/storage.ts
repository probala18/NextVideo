/**
 * src/lib/video/storage.ts
 * Durable storage adapter for uploaded videos, derived cuts, transcripts & reports.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const UPLOAD_BASE_DIR = process.env.VERCEL
  ? path.join("/tmp", "nextvideo", "uploads")
  : path.join(process.cwd(), "data", "uploads");

// Supported video formats and MIME types
export const SUPPORTED_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv", ".m4v"]);
export const SUPPORTED_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/x-m4v",
]);

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB default limit

export interface StoredAsset {
  assetId: string;
  originalFilename: string;
  sanitizedFilename: string;
  filePath: string;
  fileUrl: string;
  filesizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  const ext = path.extname(base).toLowerCase();
  const nameWithoutExt = path.basename(base, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${nameWithoutExt || "video"}${ext || ".mp4"}`;
}

export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function blobPath(assetId: string, filename: string, folder?: string): string {
  return ["nextvideo", assetId, folder, sanitizeFilename(filename)].filter(Boolean).join("/");
}

async function persistBlob(pathname: string, data: Buffer, contentType: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (process.env.VERCEL) throw new Error("Persistent video storage is not configured. Add BLOB_READ_WRITE_TOKEN to the deployment environment.");
    return;
  }
  const { put } = await import("@vercel/blob");
  await put(pathname, data, { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType });
}

export async function getPersistedAsset(assetId: string, subpath: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !/^[a-zA-Z0-9_-]+$/.test(assetId)) return null;
  const safePath = subpath.split(/[\\/]/).map(sanitizeFilename).join("/");
  try {
    const { get } = await import("@vercel/blob");
    return await get(`nextvideo/${assetId}/${safePath}`, { access: "private" });
  } catch {
    return null;
  }
}

export async function saveUploadedVideo(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<StoredAsset> {
  const ext = path.extname(originalFilename).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported video extension "${ext}". Supported formats: ${Array.from(SUPPORTED_EXTENSIONS).join(", ")}`
    );
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds maximum limit of ${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB.`
    );
  }

  const assetId = `vid_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const assetDir = path.join(UPLOAD_BASE_DIR, assetId);
  ensureDirectory(assetDir);

  const sanitized = sanitizeFilename(originalFilename);
  const filePath = path.join(assetDir, sanitized);

  await fs.promises.writeFile(filePath, buffer);
  await persistBlob(blobPath(assetId, sanitized), buffer, mimeType || "video/mp4");

  const fileUrl = `/api/video/assets/${assetId}/${encodeURIComponent(sanitized)}`;

  return {
    assetId,
    originalFilename,
    sanitizedFilename: sanitized,
    filePath,
    fileUrl,
    filesizeBytes: buffer.length,
    mimeType: mimeType || "video/mp4",
    createdAt: new Date().toISOString(),
  };
}

export async function materializePrivateBlob(assetId: string, originalFilename: string, mimeType: string): Promise<StoredAsset> {
  if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) throw new Error("Invalid video asset ID.");
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) throw new Error(`Unsupported video extension "${ext}".`);
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Persistent video storage is not configured.");
  const { get } = await import("@vercel/blob");
  const storedPath = blobPath(assetId, sanitized);
  const object = await get(storedPath, { access: "private" });
  if (!object) throw new Error("Uploaded video was not found in private object storage.");
  const assetDir = path.join(UPLOAD_BASE_DIR, assetId);
  ensureDirectory(assetDir);
  const filePath = path.join(assetDir, sanitized);
  await pipeline(Readable.fromWeb(object.stream as any), createWriteStream(filePath));
  const stat = await fs.promises.stat(filePath);
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    await fs.promises.rm(filePath, { force: true });
    throw new Error("Uploaded video exceeds the configured 500 MB limit.");
  }
  return {
    assetId, originalFilename, sanitizedFilename: sanitized, filePath,
    fileUrl: `/api/video/assets/${assetId}/${encodeURIComponent(sanitized)}`,
    filesizeBytes: stat.size, mimeType: mimeType || object.blob.contentType || "video/mp4", createdAt: new Date().toISOString(),
  };
}

export async function saveDerivedAsset(
  assetId: string,
  subfolder: "cuts" | "shorts" | "frames" | "reports" | "transcripts" | "thumbnails",
  filename: string,
  data: Buffer | string
): Promise<{ filePath: string; fileUrl: string }> {
  const targetDir = path.join(UPLOAD_BASE_DIR, assetId, subfolder);
  ensureDirectory(targetDir);

  const sanitized = sanitizeFilename(filename);
  const filePath = path.join(targetDir, sanitized);

  if (typeof data === "string") {
    await fs.promises.writeFile(filePath, data, "utf-8");
    await persistBlob(blobPath(assetId, sanitized, subfolder), Buffer.from(data, "utf-8"), "text/plain; charset=utf-8");
  } else {
    await fs.promises.writeFile(filePath, data);
    const extension = path.extname(sanitized).toLowerCase();
    const contentType = extension === ".png" ? "image/png" : [".jpg", ".jpeg"].includes(extension) ? "image/jpeg" : "application/octet-stream";
    await persistBlob(blobPath(assetId, sanitized, subfolder), data, contentType);
  }

  const fileUrl = `/api/video/assets/${assetId}/${subfolder}/${encodeURIComponent(sanitized)}`;
  return { filePath, fileUrl };
}

export async function deleteAsset(assetId: string): Promise<boolean> {
  // Prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) {
    throw new Error("Invalid asset ID format");
  }

  const assetDir = path.join(UPLOAD_BASE_DIR, assetId);
  if (fs.existsSync(assetDir)) {
    await fs.promises.rm(assetDir, { recursive: true, force: true });
    return true;
  }
  return false;
}

export function getAssetPath(assetId: string, subpath?: string): string | null {
  if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) return null;
  const assetDir = path.join(UPLOAD_BASE_DIR, assetId);

  if (!subpath) return fs.existsSync(assetDir) ? assetDir : null;

  const target = path.join(assetDir, path.normalize(subpath).replace(/^(\.\.(\/|\\|$))+/, ""));
  return fs.existsSync(target) ? target : null;
}
