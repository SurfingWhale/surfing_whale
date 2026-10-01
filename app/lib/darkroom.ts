// app/lib/darkroom.ts
// A photo essay: some writing, and photographs arranged in rows of one, two
// or three. One row per essay in surfingwhale_essays (supabase/surfing-whale.sql):
// the columns an index needs to list essays without opening each one, and the
// arrangement itself as jsonb, because "these three sit in a row" is a shape,
// not a flat list of images to be guessed back into rows.
//
// The photographs themselves live in Supabase Storage (app/lib/storage.ts);
// what is stored here is their permanent public URL.
import { dbConfigured, isUuid, table, today, unwrap } from "./db";

export { toSlug } from "./db";

export const configured = dbConfigured;

export interface Shot {
  url: string;
  publicId: string;
  width: number;
  height: number;
  alt: string;
}

export type Block =
  | { type: "text"; value: string }
  | { type: "images"; items: Shot[] };

export interface EssayMeta {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  published: boolean;
  cover: string;
  count: number;
}

export interface Essay extends EssayMeta {
  blocks: Block[];
}

const META = "id, slug, title, subtitle, date, published, cover, count";

type Row = EssayMeta & { blocks?: unknown };

function toMeta(row: Row): EssayMeta {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || "Untitled",
    subtitle: row.subtitle ?? "",
    date: row.date ?? "",
    published: Boolean(row.published),
    cover: row.cover ?? "",
    count: row.count ?? 0,
  };
}

// A row edited by hand in the dashboard should not take the page down.
const toEssay = (row: Row): Essay => ({
  ...toMeta(row),
  blocks: Array.isArray(row.blocks) ? (row.blocks as Block[]) : [],
});

/**
 * Published essays, newest first — or every essay, drafts included, for the
 * studio. A public page that cannot reach the database shows no essays rather
 * than an error; the studio is told why when it tries to save.
 */
export async function listEssays(
  { includeDrafts = false }: { includeDrafts?: boolean; revalidate?: number } = {}
): Promise<EssayMeta[]> {
  if (!configured()) return [];
  try {
    let query = table("surfingwhale_essays")
      .select(META)
      .order("date", { ascending: false })
      .limit(100);
    if (!includeDrafts) query = query.eq("published", true);
    const rows = unwrap(await query, "List essays") as Row[];
    return rows.map(toMeta);
  } catch (err) {
    console.error("Darkroom list failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// `fresh` is kept for callers written against Notion's cache; every read here
// goes straight to the database, and the pages' own revalidate does the caching.
export async function getEssay(slug: string, _opts: { fresh?: boolean } = {}): Promise<Essay | null> {
  if (!configured() || !slug) return null;
  try {
    const row = unwrap(
      await table("surfingwhale_essays").select(`${META}, blocks`).eq("slug", slug).maybeSingle(),
      "Read essay"
    ) as Row | null;
    return row ? toEssay(row) : null;
  } catch (err) {
    console.error("Darkroom read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Inserts on first save, updates by id after that. */
export async function saveEssay(essay: Omit<Essay, "id"> & { id?: string }): Promise<{ id: string }> {
  const shots = essay.blocks.flatMap((b) => (b.type === "images" ? b.items : []));
  const row = {
    slug: essay.slug,
    title: essay.title.slice(0, 200),
    subtitle: essay.subtitle.slice(0, 1900),
    date: essay.date || today(),
    published: essay.published,
    cover: essay.cover || shots[0]?.url || "",
    count: shots.length,
    blocks: essay.blocks,
  };

  if (essay.id) {
    if (!isUuid(essay.id)) throw new Error("That essay does not exist.");
    const saved = unwrap(
      await table("surfingwhale_essays").update(row).eq("id", essay.id).select("id").maybeSingle(),
      "Update essay"
    ) as { id: string } | null;
    if (!saved) throw new Error("That essay does not exist any more.");
    return saved;
  }
  return unwrap(
    await table("surfingwhale_essays").insert(row).select("id").single(),
    "Create essay"
  ) as { id: string };
}

/** Titles of the essays a library photograph sits in, drafts included. */
export async function essaysUsing(publicId: string): Promise<string[]> {
  if (!configured()) return [];
  const rows = unwrap(
    await table("surfingwhale_essays")
      .select("title")
      .contains("blocks", [{ type: "images", items: [{ publicId }] }]),
    "Find essays using a photo"
  ) as { title: string }[];
  return rows.map((r) => r.title || "Untitled");
}

export async function deleteEssay(id: string): Promise<void> {
  if (!isUuid(id)) throw new Error("That essay does not exist.");
  unwrap(await table("surfingwhale_essays").delete().eq("id", id), "Delete essay");
}
