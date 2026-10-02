// app/lib/writing.ts
// Posts. Blocks are deliberately the handful a piece of writing actually
// needs — the same set Notion gives you before you go looking for a plugin.
// One row per post in surfingwhale_posts (supabase/surfing-whale.sql), the
// blocks as jsonb.
import { dbConfigured, isUuid, table, today, unwrap } from "./db";

export { toSlug } from "./db";

export const configured = dbConfigured;

export type BlockKind =
  | "paragraph"
  | "heading"
  | "subheading"
  | "quote"
  | "bullet"
  | "number"
  | "code"
  | "divider"
  | "image";

export interface Block {
  kind: BlockKind;
  text: string;
  /** image only */
  url?: string;
  width?: number;
  height?: number;
}

export interface PostMeta {
  id: string;
  slug: string;
  title: string;
  standfirst: string;
  date: string;
  published: boolean;
  cover: string;
  words: number;
}

export interface Post extends PostMeta {
  blocks: Block[];
}

const META = "id, slug, title, standfirst, date, published, cover, words";

type Row = PostMeta & { blocks?: unknown };

function toMeta(row: Row): PostMeta {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || "Untitled",
    standfirst: row.standfirst ?? "",
    date: row.date ?? "",
    published: Boolean(row.published),
    cover: row.cover ?? "",
    words: row.words ?? 0,
  };
}

export function countWords(blocks: Block[]): number {
  return blocks.reduce(
    (n, b) => n + (b.kind === "image" || b.kind === "divider" ? 0 : b.text.trim().split(/\s+/).filter(Boolean).length),
    0
  );
}

/** Roughly 200 words a minute, rounded up, never zero. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

/** Published posts, newest first — or all of them, drafts too, for the studio. */
export async function listPosts(
  { includeDrafts = false }: { includeDrafts?: boolean; revalidate?: number } = {}
): Promise<PostMeta[]> {
  if (!configured()) return [];
  try {
    let query = table("surfingwhale_posts")
      .select(META)
      .order("date", { ascending: false })
      .limit(100);
    if (!includeDrafts) query = query.eq("published", true);
    return (unwrap(await query, "List posts") as Row[]).map(toMeta);
  } catch (err) {
    console.error("Writing list failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// `fresh` is kept for callers written against Notion's cache; every read here
// goes straight to the database, and the pages' own revalidate does the caching.
export async function getPost(slug: string, _opts: { fresh?: boolean } = {}): Promise<Post | null> {
  if (!configured() || !slug) return null;
  try {
    const row = unwrap(
      await table("surfingwhale_posts").select(`${META}, blocks`).eq("slug", slug).maybeSingle(),
      "Read post"
    ) as Row | null;
    if (!row) return null;
    // A row edited by hand in the dashboard should not take the page down.
    return { ...toMeta(row), blocks: Array.isArray(row.blocks) ? (row.blocks as Block[]) : [] };
  } catch (err) {
    console.error("Writing read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Inserts on first save, updates by id after that. */
export async function savePost(post: Omit<Post, "id"> & { id?: string }): Promise<{ id: string }> {
  const firstImage = post.blocks.find((b) => b.kind === "image")?.url;
  const row = {
    slug: post.slug,
    title: post.title.slice(0, 200),
    standfirst: post.standfirst.slice(0, 1900),
    date: post.date || today(),
    published: post.published,
    cover: post.cover || firstImage || "",
    words: countWords(post.blocks),
    blocks: post.blocks,
  };

  if (post.id) {
    if (!isUuid(post.id)) throw new Error("That post does not exist.");
    const saved = unwrap(
      await table("surfingwhale_posts").update(row).eq("id", post.id).select("id").maybeSingle(),
      "Update post"
    ) as { id: string } | null;
    if (!saved) throw new Error("That post does not exist any more.");
    return saved;
  }
  return unwrap(
    await table("surfingwhale_posts").insert(row).select("id").single(),
    "Create post"
  ) as { id: string };
}

/** Titles of the posts a library photograph sits in, drafts included. */
/** Same jsonb-containment trap as essaysUsing in darkroom.ts — see there. */
export async function postsUsing(url: string): Promise<string[]> {
  if (!configured()) return [];
  const rows = unwrap(
    await table("surfingwhale_posts")
      .select("title")
      .contains("blocks", JSON.stringify([{ kind: "image", url }])),
    "Find posts using a photo"
  ) as { title: string }[];
  return rows.map((r) => r.title || "Untitled");
}

export async function deletePost(id: string): Promise<void> {
  if (!isUuid(id)) throw new Error("That post does not exist.");
  unwrap(await table("surfingwhale_posts").delete().eq("id", id), "Delete post");
}
