// app/api/guest-notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApprovedNotes, addNote, validateNote } from "@/app/lib/guestNotes";

// In-memory throttle. Resets on cold start, which is fine — it only needs to
// blunt casual flooding, not act as real abuse protection.
const lastPost = new Map<string, number>();
const POST_COOLDOWN_MS = 30_000;

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function GET(): Promise<NextResponse> {
  // An unconfigured guest book is an empty guest book, not a server error.
  //
  // Without NOTION_GUESTBOOK_DATABASE_ID the lister throws, and this handler
  // turned that into a 500 on every single page load — in the browser console
  // for every visitor, and in the deployment's error log often enough to bury
  // anything that actually went wrong. The body it returned was already
  // `{notes: []}`, which is exactly what the section renders as "No notes yet";
  // only the status was wrong.
  //
  // A real failure — Notion unreachable, a bad token, a malformed response —
  // still answers 502, because that one a reader cannot do anything about and
  // is worth seeing in a log.
  if (!process.env.NOTION_GUESTBOOK_DATABASE_ID) {
    return NextResponse.json({ notes: [], configured: false });
  }
  try {
    const notes = await getApprovedNotes();
    return NextResponse.json({ notes, configured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Guest notes list failed:", message);
    return NextResponse.json({ error: message, notes: [] }, { status: 502 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot — real people leave this hidden field empty.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const key = clientKey(req);
  const previous = lastPost.get(key);
  if (previous && Date.now() - previous < POST_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "Please wait a moment before sending another note." },
      { status: 429 }
    );
  }

  const note = {
    name: String(body.name ?? ""),
    message: String(body.message ?? ""),
    email: body.email ? String(body.email) : undefined,
  };

  const invalid = validateNote(note);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  try {
    const saved = await addNote(note);
    if (!saved) {
      return NextResponse.json({ error: "Could not save your note." }, { status: 502 });
    }
    lastPost.set(key, Date.now());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
