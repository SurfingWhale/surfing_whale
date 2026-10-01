// app/lib/storage.ts
// Where photographs live once they leave the browser: one public Supabase
// Storage bucket, written only from this server with the service-role key.
//
// The browser never talks to Supabase. It compresses a photograph, posts it to
// one of our routes, and the route — after checking the studio session — puts
// it here. That keeps the only write credential on the server and keeps the
// rule for who may upload in one place (darkroomSession.ts) instead of two.
//
// Supabase has no per-image transformations on the free plan, so nothing here
// resizes. The browser already did that (app/darkroom/downscale.ts); what
// arrives is the file that will be served.
//
// Width and height are written into the object's name. A listing returns
// names and dates but no dimensions, and the archive needs the aspect ratio to
// lay a column out before the image loads — so the name carries it.
import { randomBytes } from "crypto";
import { supabaseAdmin, supabaseConfigured, supabaseUrl as baseUrl } from "./supabase";

const BUCKET = (process.env.SUPABASE_BUCKET ?? "").trim() || "surfing-whale";

export const storageConfigured = supabaseConfigured;

const bucket = () => supabaseAdmin().storage.from(BUCKET);

export type Folder = "darkroom" | "archive" | "projects";

export interface StoredPhoto {
  url: string;
  /** The object's path inside the bucket, e.g. "archive/2026-10-01-….webp". */
  publicId: string;
  width: number;
  height: number;
}

export interface ArchiveFrame extends StoredPhoto {
  takenAt: string;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function objectName(base: string, contentType: string, width: number, height: number) {
  const day = new Date().toISOString().slice(0, 10);
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48) || "frame";
  // Random rather than overwrite: every URL ever handed out keeps pointing at
  // the same bytes, so the year-long cache below is never wrong.
  const rand = randomBytes(4).toString("hex");
  return `${day}-${slug}-${rand}-${width}x${height}.${EXT[contentType] ?? "bin"}`;
}

function dimsOf(name: string): { width: number; height: number } | null {
  const m = name.match(/-(\d{1,5})x(\d{1,5})\.[a-z]+$/);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

export async function uploadPhoto(
  folder: Folder,
  bytes: Buffer,
  contentType: string,
  base: string,
  width: number,
  height: number
): Promise<StoredPhoto> {
  const path = `${folder}/${objectName(base, contentType, width, height)}`;
  const put = () =>
    bucket().upload(path, bytes, { contentType, cacheControl: "31536000", upsert: false });
  let { error } = await put();
  // A new Supabase project has no bucket. Making it here, on the first upload,
  // is one dashboard step fewer — public to read, images only, and no larger
  // than the route would accept anyway.
  if (error && /bucket not found/i.test(error.message)) {
    const made = await supabaseAdmin().storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
      fileSizeLimit: "8MB",
    });
    if (made.error && !/already exists/i.test(made.error.message)) throw new Error(made.error.message);
    ({ error } = await put());
  }
  if (error) throw new Error(error.message);
  return { url: bucket().getPublicUrl(path).data.publicUrl, publicId: path, width, height };
}

/** Newest first. An archive that cannot be listed is empty, not a 500. */
export async function listArchivePhotos(limit = 200): Promise<ArchiveFrame[]> {
  if (!storageConfigured()) return [];
  try {
    const { data, error } = await bucket().list("archive", {
      limit: Math.min(limit, 1000),
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw new Error(error.message);
    const frames: ArchiveFrame[] = [];
    for (const o of data ?? []) {
      const dims = dimsOf(o.name);
      if (!dims) continue; // Supabase's folder placeholder, or a stray file
      const path = `archive/${o.name}`;
      frames.push({
        url: bucket().getPublicUrl(path).data.publicUrl,
        publicId: path,
        ...dims,
        takenAt: o.created_at ?? "",
      });
    }
    return frames;
  } catch (err) {
    console.error("Archive list failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function deletePhoto(publicId: string): Promise<void> {
  const { error } = await bucket().remove([publicId]);
  if (error) throw new Error(error.message);
}

/** Hostname of the bucket's public URLs, for the image allowlists. */
export function storageHost(): string | null {
  try {
    return baseUrl() ? new URL(baseUrl()).hostname : null;
  } catch {
    return null;
  }
}

/**
 * Only ever store URLs we put there ourselves: this bucket, or — for essays
 * and posts written before the move — the Cloudinary account that came first.
 */
export function isOwnImage(url: string): boolean {
  const base = baseUrl();
  if (base && url.startsWith(`${base}/storage/v1/object/public/${BUCKET}/`)) return true;
  return /^https:\/\/res\.cloudinary\.com\//.test(url);
}
