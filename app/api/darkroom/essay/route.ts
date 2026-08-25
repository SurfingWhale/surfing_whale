// app/api/darkroom/essay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import {
  type Block,
  type Shot,
  configured,
  deleteEssay,
  getEssay,
  listEssays,
  saveEssay,
  toSlug,
} from "@/app/lib/darkroom";

// Everything below arrives from a browser, so nothing from it is trusted into
// Notion unchecked — a malformed block would be written once and then break
// every render of the page afterwards.
function cleanShot(raw: unknown): Shot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const url = typeof s.url === "string" ? s.url : "";
  // Only ever store URLs we put there ourselves.
  if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) return null;
  const width = Number(s.width);
  const height = Number(s.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return null;
  }
  return {
    url,
    publicId: typeof s.publicId === "string" ? s.publicId.slice(0, 200) : "",
    width: Math.round(width),
    height: Math.round(height),
    alt: (typeof s.alt === "string" ? s.alt : "").slice(0, 300),
  };
}

function cleanBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return [];
  const out: Block[] = [];
  for (const b of raw.slice(0, 120)) {
    if (!b || typeof b !== "object") continue;
    const t = (b as { type?: unknown }).type;
    if (t === "text") {
      const value = String((b as { value?: unknown }).value ?? "").slice(0, 4000);
      if (value.trim()) out.push({ type: "text", value });
    } else if (t === "images") {
      const items = (Array.isArray((b as { items?: unknown }).items)
        ? ((b as { items: unknown[] }).items)
        : []
      )
        .slice(0, 3)
        .map(cleanShot)
        .filter((s): s is Shot => s !== null);
      if (items.length) out.push({ type: "images", items });
    }
  }
  return out;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  if (!configured()) {
    return NextResponse.json(
      { error: "NOTION_DARKROOM_DATABASE_ID is not set." },
      { status: 503 }
    );
  }
  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const essay = await getEssay(slug, { fresh: true });
    return essay
      ? NextResponse.json({ essay })
      : NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ essays: await listEssays({ includeDrafts: true }) });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  if (!configured()) {
    return NextResponse.json(
      { error: "NOTION_DARKROOM_DATABASE_ID is not set." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!title) {
    return NextResponse.json({ error: "A title is needed." }, { status: 400 });
  }
  const slug = toSlug(String(body.slug ?? "") || title);
  if (!slug) {
    return NextResponse.json({ error: "That title makes no slug." }, { status: 400 });
  }

  // A new essay claiming a slug that already belongs to another page would
  // shadow it on the public route, so it is refused rather than silently won.
  const existing = await getEssay(slug, { fresh: true });
  const id = typeof body.id === "string" && body.id ? body.id : existing?.id;
  if (existing && id && existing.id !== id) {
    return NextResponse.json(
      { error: `The slug "${slug}" is already taken.` },
      { status: 409 }
    );
  }

  try {
    const saved = await saveEssay({
      id,
      slug,
      title,
      subtitle: String(body.subtitle ?? "").slice(0, 1900),
      date: String(body.date ?? "").slice(0, 10),
      published: Boolean(body.published),
      cover: typeof body.cover === "string" ? body.cover : "",
      count: 0,
      blocks: cleanBlocks(body.blocks),
    });
    return NextResponse.json({ id: saved.id, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Darkroom save failed:", message);
    return NextResponse.json({ error: "Could not save to Notion." }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "No id." }, { status: 400 });
  try {
    await deleteEssay(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not archive it." }, { status: 502 });
  }
}
