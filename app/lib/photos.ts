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

/**
 * The gallery's photographs, in order.
 *
 * One select, no bucket listing: the URL and the dimensions are copied onto
 * the row when it is saved, so this runs without the service-role key ever
 * touching Storage and without a round trip per frame.
 *
 * Returns [] rather than throwing when the database is not configured or the
 * table was never made. The caller falls back to the manifest in the
 * repository, so a half-set-up deployment shows the old photographs instead of
 * an error.
 */
export async function listPublishedPhotos(): Promise<Photo[]> {
  if (!dbConfigured()) return [];
  try {
    const rows = unwrap(
      await table("surfingwhale_photos")
        .select("public_id, alt, category, published, url, width, height, sort")
        .eq("published", true)
        .order("sort", { ascending: true })
        .order("taken_at", { ascending: false }),
      "List published photographs"
    ) as Row[];
    return rows
      // A row with no URL or no dimensions would lay the grid out wrong and
      // show a broken frame, which is worse than not showing it.
      .filter((r) => r.url && r.width > 0 && r.height > 0)
      .map((r) => ({
        id: r.public_id,
        category: r.category,
        src: r.url,
        alt: r.alt,
        width: r.width,
        height: r.height,
      }));
  } catch {
    return [];
  }
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

export class NeedsAlt extends Error {
  constructor() {
    super("Describe the photograph first — that line is what a screen reader says, and the only part of a photograph search can read.");
  }
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
  const alt = input.alt.trim().slice(0, 300);
  // Refused at the point of publishing rather than warned about later. The
  // site already carries case-study exhibits with alt="" that describe
  // themselves to nobody; this is where that stops being added to.
  if (input.published && !alt) throw new NeedsAlt();
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
