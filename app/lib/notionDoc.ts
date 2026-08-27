// app/lib/notionDoc.ts
// Both the darkroom and the writing studio keep a document's structure as
// JSON inside a single Notion code block. Notion pages cannot express "these
// three photographs sit in a row" or "this paragraph is a pull quote", so the
// arrangement is stored exactly rather than rebuilt from a guess.
//
// The properties beside it stay real Notion properties, so an index can be
// listed without opening every page.

export const NOTION = "https://api.notion.com/v1";

export const HEADERS = () => ({
  Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
});

/** Notion caps a rich_text item at 2000 characters, so the JSON is chunked. */
function chunk(s: string, size = 1800): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out.length ? out : [""];
}

export async function readDocJson<T>(
  pageId: string,
  { fresh = false, revalidate = 60 } = {}
): Promise<T | null> {
  const res = await fetch(`${NOTION}/blocks/${pageId}/children?page_size=100`, {
    headers: HEADERS(),
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate } }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const code = (data.results ?? []).find((b: { type?: string }) => b.type === "code");
  if (!code) return null;
  const json = (code.code?.rich_text ?? [])
    .map((t: { plain_text: string }) => t.plain_text)
    .join("");
  try {
    return JSON.parse(json) as T;
  } catch {
    // A page edited by hand in Notion should not take the site down.
    console.error("notionDoc: body JSON did not parse", pageId);
    return null;
  }
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

/** Replaces the page body with one code block holding the document. */
export async function writeDocJson(pageId: string, doc: unknown): Promise<void> {
  await clearPage(pageId);
  const res = await fetch(`${NOTION}/blocks/${pageId}/children`, {
    method: "PATCH",
    headers: HEADERS(),
    body: JSON.stringify({
      children: [
        {
          object: "block",
          type: "code",
          code: {
            language: "json",
            rich_text: chunk(JSON.stringify(doc)).map((content) => ({
              text: { content },
            })),
          },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Notion rejected the body: ${await res.text()}`);
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
