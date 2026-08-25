// app/lib/darkroom.ts
// A photo essay: some writing, and photographs arranged in rows of one, two
// or three. Notion holds it — the properties so an index can be listed
// without opening every page, and the arrangement itself as JSON in a single
// code block, because a Notion page cannot express "these three sit in a row"
// and rebuilding a layout from a flat list of image blocks would be a guess.
//
// The photographs themselves live on Cloudinary. Notion's own file URLs are
// signed and expire within the hour, so anything stored here is already a
// permanent URL.

const NOTION = "https://api.notion.com/v1";
const HEADERS = () => ({
  Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
});

export const DB = () => process.env.NOTION_DARKROOM_DATABASE_ID ?? "";
export const configured = () => Boolean(process.env.NOTION_API_KEY && DB());

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

const text = (p: any) => p?.rich_text?.[0]?.plain_text ?? "";

function toMeta(page: any): EssayMeta {
  const p = page.properties ?? {};
  return {
    id: page.id,
    slug: text(p.Slug),
    title: p.Name?.title?.[0]?.plain_text ?? "Untitled",
    subtitle: text(p.Subtitle),
    date: p.Date?.date?.start ?? "",
    published: Boolean(p.Published?.checkbox),
    cover: p.Cover?.url ?? "",
    count: p.Count?.number ?? 0,
  };
}

/** Slugs are used in URLs and in Notion filters; keep them boring. */
export function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

export async function listEssays(
  { includeDrafts = false, revalidate = 60 } = {}
): Promise<EssayMeta[]> {
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
    console.error("Darkroom list failed:", await res.text());
    return [];
  }
  const data = await res.json();
  return (data.results ?? []).map(toMeta).filter((e: EssayMeta) => e.slug);
}

/** Notion caps a rich_text item at 2000 characters, so the JSON is chunked. */
function chunk(s: string, size = 1800): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out.length ? out : [""];
}

async function readBlocks(pageId: string, fresh: boolean): Promise<Block[]> {
  const res = await fetch(`${NOTION}/blocks/${pageId}/children?page_size=100`, {
    headers: HEADERS(),
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const code = (data.results ?? []).find((b: any) => b.type === "code");
  if (!code) return [];
  const json = (code.code?.rich_text ?? [])
    .map((t: any) => t.plain_text)
    .join("");
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // A page someone edited by hand in Notion should not take the site down.
    console.error("Darkroom: essay JSON did not parse", pageId);
    return [];
  }
}

export async function getEssay(
  slug: string,
  { fresh = false } = {}
): Promise<Essay | null> {
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
  return { ...toMeta(page), blocks: await readBlocks(page.id, fresh) };
}

async function clearPage(pageId: string): Promise<void> {
  const res = await fetch(`${NOTION}/blocks/${pageId}/children?page_size=100`, {
    headers: HEADERS(),
    cache: "no-store",
  });
  if (!res.ok) return;
  const data = await res.json();
  for (const block of data.results ?? []) {
    await fetch(`${NOTION}/blocks/${block.id}`, {
      method: "DELETE",
      headers: HEADERS(),
    });
  }
}

function properties(e: Omit<Essay, "id">) {
  const shots = e.blocks.flatMap((b) => (b.type === "images" ? b.items : []));
  return {
    Name: { title: [{ text: { content: e.title.slice(0, 200) } }] },
    Slug: { rich_text: [{ text: { content: e.slug } }] },
    Subtitle: { rich_text: [{ text: { content: e.subtitle.slice(0, 1900) } }] },
    Date: { date: { start: e.date || new Date().toISOString().slice(0, 10) } },
    Published: { checkbox: e.published },
    Cover: { url: e.cover || shots[0]?.url || null },
    Count: { number: shots.length },
  };
}

/** Creates the page on first save, then replaces its contents on every save. */
export async function saveEssay(
  essay: Omit<Essay, "id"> & { id?: string }
): Promise<{ id: string }> {
  const body = {
    code: {
      language: "json",
      rich_text: chunk(JSON.stringify(essay.blocks)).map((content) => ({
        text: { content },
      })),
    },
  };

  let id = essay.id;
  if (id) {
    const res = await fetch(`${NOTION}/pages/${id}`, {
      method: "PATCH",
      headers: HEADERS(),
      body: JSON.stringify({ properties: properties(essay) }),
    });
    if (!res.ok) throw new Error(`Notion rejected the update: ${await res.text()}`);
    await clearPage(id);
  } else {
    const res = await fetch(`${NOTION}/pages`, {
      method: "POST",
      headers: HEADERS(),
      body: JSON.stringify({
        parent: { database_id: DB() },
        properties: properties(essay),
      }),
    });
    if (!res.ok) throw new Error(`Notion rejected the page: ${await res.text()}`);
    id = (await res.json()).id as string;
  }

  const append = await fetch(`${NOTION}/blocks/${id}/children`, {
    method: "PATCH",
    headers: HEADERS(),
    body: JSON.stringify({ children: [{ object: "block", type: "code", ...body }] }),
  });
  if (!append.ok) throw new Error(`Notion rejected the body: ${await append.text()}`);

  return { id: id! };
}

export async function deleteEssay(id: string): Promise<void> {
  // Notion has no hard delete over the API; archiving is what the UI does too.
  const res = await fetch(`${NOTION}/pages/${id}`, {
    method: "PATCH",
    headers: HEADERS(),
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) throw new Error(await res.text());
}
