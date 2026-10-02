// app/api/library/list/route.ts
// The library, newest first, for the Photos room and the picker in the
// editors. Studio only: the library itself is not public — what is public is
// whichever frames have been published, which the home page reads separately.
//
// Each frame carries what the studio knows about it: its description, its
// category, and whether it is on the site. That is one request instead of one
// per tile, and it is why the Photos room can show the state of twenty
// photographs without twenty round trips.
import { NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { listLibrary, storageConfigured } from "@/app/lib/storage";
import { metaFor } from "@/app/lib/photos";

export async function GET(): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  if (!storageConfigured()) {
    return NextResponse.json({ error: "Storage is not set up on this deployment." }, { status: 503 });
  }
  let photos;
  try {
    photos = await listLibrary();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("Library list failed:", reason);
    return NextResponse.json({ error: `Could not load the library: ${reason}` }, { status: 502 });
  }

  // Details are a convenience, not the listing. A database that is not set up
  // yet should leave the frames visible and deletable, not blank the room —
  // so this failure is swallowed and the tiles simply show no description.
  let meta: Awaited<ReturnType<typeof metaFor>> = {};
  try {
    meta = await metaFor(photos.map((p) => p.publicId));
  } catch (err) {
    console.error("Photo details unavailable:", err instanceof Error ? err.message : err);
  }

  return NextResponse.json({
    photos: photos.map((p) => ({
      ...p,
      alt: meta[p.publicId]?.alt ?? "",
      category: meta[p.publicId]?.category ?? "everyday",
      published: meta[p.publicId]?.published ?? false,
    })),
  });
}
