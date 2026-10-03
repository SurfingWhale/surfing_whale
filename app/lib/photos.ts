// app/lib/photos.ts
// A photograph that stands on its own.
//
// Before this, there were two ways to get a photograph onto the site and both
// went the long way round: write an essay or a post and pick the frame inside
// it, or hand-edit app/data/photography.ts and push a commit. Uploading twenty
// photographs to the library and expecting to see them was the obvious thing
// to do, and it led nowhere. This is the short way.
//
// The files stay in Storage. This table holds the one thing a file cannot say:
// what the photograph is of, whether it is on the site, and in what order.
import { table, unwrap, dbConfigured } from "./db";
import { listLibrary } from "./storage";
import type { Photo, PhotoCategory } from "@/app/data/photography";

export const CATEGORIES = ["portraits", "everyday", "landscapes"] as const;
export const isCategory = (c: unknown): c is PhotoCategory =>
  typeof c === "string" && (CATEGORIES as readonly string[]).includes(c);

export interface PhotoMeta {
  publicId: string;
  alt: string;
  category: PhotoCategory;
  published: boolean;
  sort: number;
}

interface Row {
  public_id: string;
  alt: string;
  category: PhotoCategory;
  published: boolean;
  url: string;
  width: number;
  height: number;
  sort: number;
}

const toMeta = (r: Row): PhotoMeta => ({
  publicId: r.public_id,
  alt: r.alt,
  category: r.category,
  published: r.published,
  sort: r.sort,
});

/** What a photograph says until it is described. */
export const DEFAULT_ALT = "A photograph by Muhammad Fauzy";

/**
 * The gallery's photographs: every photograph in the library, unless it has
 * been taken off the site.
 *
 * It used to be the other way round — nothing showed until each frame was
 * opened, described and published one by one. Fifteen photographs went into
 * the library, the SQL was run, and the gallery still showed the five old
 * frames from the repository, because not one of the fifteen had been through
 * that step. Uploading a photograph is the decision to show it; hiding one is
 * the exception, so the exception is the thing that takes a tap.
 *
 * A row in surfingwhale_photos now only ever says "hidden", "described as…",
 * "belongs in…" or "goes here in the order". A photograph with no row is on
 * the site, described generically until it is given words of its own.
 *
 * Returns [] when nothing can be read; the caller then falls back to the
 * manifest in the repository rather than showing an empty gallery.
 */
export async function listPublishedPhotos(): Promise<Photo[]> {
  if (!dbConfigured()) return [];
  let files: Awaited<ReturnType<typeof listLibrary>> = [];
  try {
    files = await listLibrary();
  } catch {
    return [];
  }
  let rows: Row[] = [];
  try {
    rows = unwrap(
      await table("surfingwhale_photos").select(
        "public_id, alt, category, published, url, width, height, sort"
      ),
      "Read photograph details"
    ) as Row[];
  } catch {
    // No table yet: everything shows, described generically.
  }
  const byId = new Map(rows.map((r) => [r.public_id, r]));

  const groups = new Map<string, { f: (typeof files)[number]; r?: Row }[]>();
  for (const f of files) {
    if (f.width <= 0 || f.height <= 0) continue;
    const key = sameFrameKey(f.publicId, f.width, f.height);
    const group = groups.get(key) ?? [];
    group.push({ f, r: byId.get(f.publicId) });
    groups.set(key, group);
  }

  return [...groups.values()]
    // Hiding any copy hides the photograph. The studio lists every copy, so
    // the one somebody taps "hide" on is not necessarily the one shown here,
    // and a photograph that stays up after being hidden is the bug, not this.
    .filter((group) => group.every(({ r }) => (r ? r.published : true)))
    .map((group) => {
      const largest = group.reduce((a, b) => (b.f.width * b.f.height > a.f.width * a.f.height ? b : a));
      // The words and the place in the order may have been given to any copy.
      const r = largest.r ?? group.find((c) => c.r)?.r;
      return { f: largest.f, r, takenAt: group.reduce((t, c) => (c.f.takenAt > t ? c.f.takenAt : t), "") };
    })
    .sort((a, b) => (a.r?.sort ?? 0) - (b.r?.sort ?? 0) || b.takenAt.localeCompare(a.takenAt))
    .map(({ f, r }) => ({
      id: f.publicId,
      category: r && isCategory(r.category) ? r.category : "everyday",
      src: f.url,
      alt: r?.alt?.trim() || DEFAULT_ALT,
      width: f.width,
      height: f.height,
    }));
}

/**
 * Which uploads are the same photograph.
 *
 * Uploading one frame twice — again from the phone, or once before the
 * compression changed — leaves two objects with different random bytes and
 * often different sizes (1500×2000 and 1800×2400 of the same IMG_1304), and
 * the gallery showed both side by side. The original file name survives in the
 * object name (storage.ts, objectName), so the same camera name at the same
 * aspect ratio is the same photograph and only the largest copy is shown.
 * Nothing is deleted; the studio still lists every copy.
 *
 * Only for names with a camera's frame number in them. "image" or "photo" is
 * what a phone calls many different pictures, and folding those together would
 * hide photographs that are not copies of anything.
 */
function sameFrameKey(publicId: string, width: number, height: number): string {
  const name = publicId.slice(publicId.lastIndexOf("/") + 1);
  const slug = name.match(/^\d{4}-\d{2}-\d{2}-(.+)-[0-9a-f]{8}-\d+x\d+\.[a-z0-9]+$/)?.[1];
  if (!slug || !/\d{3,}/.test(slug)) return publicId;
  return `${slug}@${(width / height).toFixed(2)}`;
}

/** What the studio knows about the frames it is showing. */
export async function metaFor(publicIds: string[]): Promise<Record<string, PhotoMeta>> {
  if (!dbConfigured() || publicIds.length === 0) return {};
  const rows = unwrap(
    await table("surfingwhale_photos")
      .select("public_id, alt, category, published, url, width, height, sort")
      .in("public_id", publicIds),
    "Read photograph details"
  ) as Row[];
  return Object.fromEntries(rows.map((r) => [r.public_id, toMeta(r)]));
}

export async function savePhotoMeta(input: {
  publicId: string;
  alt: string;
  category: PhotoCategory;
  published: boolean;
  url: string;
  width: number;
  height: number;
  sort?: number;
}): Promise<void> {
  // Optional now: an undescribed photograph is shown with DEFAULT_ALT, and the
  // Photos room keeps asking for words of its own.
  const alt = input.alt.trim().slice(0, 300);
  unwrap(
    await table("surfingwhale_photos").upsert(
      {
        public_id: input.publicId,
        alt,
        category: input.category,
        published: input.published,
        url: input.url,
        width: input.width,
        height: input.height,
        sort: input.sort ?? 0,
      },
      { onConflict: "public_id" }
    ),
    "Save photograph details"
  );
}

/** Called when the file goes, so a row never outlives its photograph. */
export async function forgetPhoto(publicId: string): Promise<void> {
  if (!dbConfigured()) return;
  try {
    unwrap(
      await table("surfingwhale_photos").delete().eq("public_id", publicId),
      "Forget photograph"
    );
  } catch {
    // The file is already gone; a stale row is a smaller problem than an
    // error that makes the delete look like it failed when it did not.
  }
}
