// app/api/library/list/route.ts
// The library, newest first, for the Photos room and the picker in the
// editors. Studio only: nothing in the library is public by itself.
import { NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { listLibrary, storageConfigured } from "@/app/lib/storage";

export async function GET(): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  if (!storageConfigured()) {
    return NextResponse.json({ error: "Storage is not set up on this deployment." }, { status: 503 });
  }
  try {
    return NextResponse.json({ photos: await listLibrary() });
  } catch (err) {
    console.error("Library list failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not load the library." }, { status: 502 });
  }
}
