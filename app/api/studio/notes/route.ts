// app/api/studio/notes/route.ts
// Moderation. Guarded by the same session as the rest of the studio, and
// checked before anything is read or written.
import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { archiveNote, listAllNotes, setApproved } from "@/app/lib/guestNotes";

export async function GET(): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  try {
    return NextResponse.json({ notes: await listAllNotes() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, notes: [] }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "No id." }, { status: 400 });

  try {
    await setApproved(id, Boolean(body.approved));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to update it. Try again in a moment." },
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
    await archiveNote(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to archive it." }, { status: 502 });
  }
}
