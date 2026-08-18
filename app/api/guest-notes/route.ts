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
  try {
    const notes = await getApprovedNotes();
    return NextResponse.json({ notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, notes: [] }, { status: 500 });
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
