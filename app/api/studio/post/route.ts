// app/api/studio/post/route.ts
// Same gate as the darkroom: one password, one cookie, checked on the server
// before the body is read.
import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import {
  type Block,
  type BlockKind,
  configured,
  deletePost,
  getPost,
  listPosts,
  savePost,
  toSlug,
} from "@/app/lib/writing";

const KINDS: BlockKind[] = [
  "paragraph", "heading", "subheading", "quote",
  "bullet", "number", "code", "divider", "image",
];

// Everything below comes from a browser. A malformed block would be written
// once and then break every render of the post afterwards.
function cleanBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return [];
  const out: Block[] = [];
  for (const b of raw.slice(0, 400)) {
    if (!b || typeof b !== "object") continue;
    const kind = (b as { kind?: unknown }).kind;
    if (typeof kind !== "string" || !KINDS.includes(kind as BlockKind)) continue;
    const text = String((b as { text?: unknown }).text ?? "").slice(0, 6000);

    if (kind === "image") {
      const url = String((b as { url?: unknown }).url ?? "");
      // Only ever store URLs we put there ourselves.
      if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) continue;
      const width = Number((b as { width?: unknown }).width);
      const height = Number((b as { height?: unknown }).height);
      if (!Number.isFinite(width) || !Number.isFinite(height)) continue;
      out.push({
        kind: "image", url, text: text.slice(0, 300),
        width: Math.round(width), height: Math.round(height),
      });
      continue;
    }
    if (kind === "divider") {
      out.push({ kind: "divider", text: "" });
      continue;
    }
    if (text.trim()) out.push({ kind: kind as BlockKind, text });
  }
  return out;
}

function guard(): NextResponse | null {
  if (!configured()) {
    return NextResponse.json(
      { error: "NOTION_WRITING_DATABASE_ID is not set." },
      { status: 503 }
    );
  }
  return null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const bad = guard();
  if (bad) return bad;

  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const post = await getPost(slug, { fresh: true });
    return post
      ? NextResponse.json({ post })
      : NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ posts: await listPosts({ includeDrafts: true }) });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const bad = guard();
  if (bad) return bad;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!title) {
    return NextResponse.json({ error: "Give it a title first." }, { status: 400 });
  }
  const slug = toSlug(String(body.slug ?? "") || title);
  if (!slug) {
    return NextResponse.json(
      { error: "That title makes no usable address." },
      { status: 400 }
    );
  }

  // A new post claiming a slug that already belongs to another page would
  // shadow it on the public route, so it is refused rather than silently won.
  const existing = await getPost(slug, { fresh: true });
  const id = typeof body.id === "string" && body.id ? body.id : existing?.id;
  if (existing && id && existing.id !== id) {
    return NextResponse.json(
      { error: `The address "${slug}" is already taken.` },
      { status: 409 }
    );
  }

  try {
    const saved = await savePost({
      id,
      slug,
      title,
      standfirst: String(body.standfirst ?? "").slice(0, 1900),
      date: String(body.date ?? "").slice(0, 10),
      published: Boolean(body.published),
      cover: typeof body.cover === "string" ? body.cover : "",
      words: 0,
      blocks: cleanBlocks(body.blocks),
    });
    return NextResponse.json({ id: saved.id, slug });
  } catch (err) {
    console.error("Post save failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Unable to save to Notion. Try again in a moment." },
      { status: 502 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "No id." }, { status: 400 });
  try {
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to archive it." }, { status: 502 });
  }
}
