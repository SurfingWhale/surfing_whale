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

// One library for every photograph the studio takes in; essays and posts are
// drawn from it. "darkroom" and "archive" are where uploads went before the two
// were merged — still read and still deletable, never written to again.
export type Folder = "library" | "projects";
export const LIBRARY_FOLDERS = ["library", "darkroom", "archive"] as const;

export interface StoredPhoto {
  url: string;
  /** The object's path inside the bucket, e.g. "library/2026-10-01-….webp". */
  publicId: string;
  width: number;
  height: number;
}

export interface LibraryPhoto extends StoredPhoto {
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

/** Every photograph in the library, newest first. */
export async function listLibrary(limit = 500): Promise<LibraryPhoto[]> {
  if (!storageConfigured()) return [];
  const all = await Promise.all(
    LIBRARY_FOLDERS.map(async (folder) => {
      const { data, error } = await bucket().list(folder, {
        limit: Math.min(limit, 1000),
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw new Error(error.message);
      const photos: LibraryPhoto[] = [];
      for (const o of data ?? []) {
        const dims = dimsOf(o.name);
        if (!dims) continue; // Supabase's folder placeholder, or a stray file
        const path = `${folder}/${o.name}`;
        photos.push({
          url: bucket().getPublicUrl(path).data.publicUrl,
          publicId: path,
          ...dims,
          takenAt: o.created_at ?? "",
        });
      }
      return photos;
    })
  );
  // One photograph, one tile. Folding the archive and the darkroom into one
  // library left the same object sitting in more than one folder, so a listing
  // that just concatenates the folders shows every one of those twice — which
  // is what the studio was doing.
  //
  // Two entries with the same name ARE the same upload: objectName() puts four
  // random bytes in every name, so a collision between genuinely different
  // photographs is not something that happens. The copy kept is whichever
  // folder comes first in LIBRARY_FOLDERS, which is why `library` is listed
  // first — the one place new uploads go.
  const byName = new Map<string, LibraryPhoto>();
  for (const photo of all.flat()) {
    const name = photo.publicId.slice(photo.publicId.indexOf("/") + 1);
    if (!byName.has(name)) byName.set(name, photo);
  }
  return [...byName.values()]
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
    .slice(0, limit);
}

export const publicUrlOf = (path: string) => bucket().getPublicUrl(path).data.publicUrl;

/** A path that belongs to the library and cannot climb out of it. */
export const isLibraryPath = (p: unknown): p is string =>
  typeof p === "string" &&
  !p.includes("..") &&
  LIBRARY_FOLDERS.some((f) => new RegExp(`^${f}/[^/]+$`).test(p));

/**
 * Removes the photograph, including the copies of it in the other library
 * folders.
 *
 * Deleting only the path that was listed looked like it worked and then the
 * photograph came back on the next load, because the listing had hidden a
 * second copy in another folder behind the de-duplication above. Somebody
 * deleting a photograph means the photograph, not one folder's copy of it.
 *
 * Supabase's remove() does not fail on a path that is not there, so naming all
 * three costs one round trip and no error handling.
 */
export async function deletePhoto(publicId: string): Promise<void> {
  const name = publicId.slice(publicId.indexOf("/") + 1);
  const everywhere = LIBRARY_FOLDERS.map((f) => `${f}/${name}`);
  const { error } = await bucket().remove(everywhere);
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
