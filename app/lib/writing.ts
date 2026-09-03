// app/lib/writing.ts
// Posts. Blocks are deliberately the handful a piece of writing actually
// needs — the same set Notion gives you before you go looking for a plugin.
import { HEADERS, NOTION, readDocJson, toSlug, writeDocJson } from "./notionDoc";

export { toSlug };

import { WRITING_DB } from "./notionIds";

const DB = WRITING_DB;
export const configured = () => Boolean(process.env.NOTION_API_KEY && DB());

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

const text = (p: { rich_text?: { plain_text: string }[] }) =>
  p?.rich_text?.[0]?.plain_text ?? "";

function toMeta(page: Record<string, any>): PostMeta {
  const p = page.properties ?? {};
  return {
    id: page.id,
    slug: text(p.Slug),
    title: p.Name?.title?.[0]?.plain_text ?? "Untitled",
    standfirst: text(p.Standfirst),
    date: p.Date?.date?.start ?? "",
    published: Boolean(p.Published?.checkbox),
    cover: p.Cover?.url ?? "",
    words: p.Words?.number ?? 0,
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

export async function listPosts(
  { includeDrafts = false, revalidate = 60 } = {}
): Promise<PostMeta[]> {
  if (!configured()) return [];
  const res = await fetch(`${NOTION}/databases/${DB()}/query`, {
    method: "POST",
    headers: HEADERS(),
    body: JSON.stringify({
      ...(includeDrafts
        ? {}
        : { filter: { property: "Published", checkbox: { equals: true } } }),
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: 50,
    }),
    ...(includeDrafts ? { cache: "no-store" as const } : { next: { revalidate } }),
  });
  if (!res.ok) {
    console.error("Writing list failed:", await res.text());
    return [];
  }
  const data = await res.json();
  return (data.results ?? []).map(toMeta).filter((p: PostMeta) => p.slug);
}

export async function getPost(
  slug: string,
  { fresh = false } = {}
): Promise<Post | null> {
  if (!configured()) return null;
  const res = await fetch(`${NOTION}/databases/${DB()}/query`, {
    method: "POST",
    headers: HEADERS(),
    body: JSON.stringify({
      filter: { property: "Slug", rich_text: { equals: slug } },
      page_size: 1,
    }),
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const page = data.results?.[0];
  if (!page) return null;
  const blocks = (await readDocJson<Block[]>(page.id, { fresh })) ?? [];
  return { ...toMeta(page), blocks };
}

function properties(post: Omit<Post, "id">) {
  const firstImage = post.blocks.find((b) => b.kind === "image")?.url;
  return {
    Name: { title: [{ text: { content: post.title.slice(0, 200) } }] },
    Slug: { rich_text: [{ text: { content: post.slug } }] },
    Standfirst: { rich_text: [{ text: { content: post.standfirst.slice(0, 1900) } }] },
    Date: { date: { start: post.date || new Date().toISOString().slice(0, 10) } },
    Published: { checkbox: post.published },
    Cover: { url: post.cover || firstImage || null },
    Words: { number: countWords(post.blocks) },
  };
}

export async function savePost(
  post: Omit<Post, "id"> & { id?: string }
): Promise<{ id: string }> {
  let id = post.id;
  if (id) {
    const res = await fetch(`${NOTION}/pages/${id}`, {
      method: "PATCH",
      headers: HEADERS(),
      body: JSON.stringify({ properties: properties(post) }),
    });
    if (!res.ok) throw new Error(`Notion rejected the update: ${await res.text()}`);
  } else {
    const res = await fetch(`${NOTION}/pages`, {
      method: "POST",
      headers: HEADERS(),
      body: JSON.stringify({
        parent: { database_id: DB() },
        properties: properties(post),
      }),
    });
    if (!res.ok) throw new Error(`Notion rejected the page: ${await res.text()}`);
    id = (await res.json()).id as string;
  }
  await writeDocJson(id!, post.blocks);
  return { id: id! };
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${NOTION}/pages/${id}`, {
    method: "PATCH",
    headers: HEADERS(),
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) throw new Error(await res.text());
}
