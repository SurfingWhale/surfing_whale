// app/api/archive/list/route.ts
// Used by the studio room to show what is already up. The public page reads
// the same list on the server instead, so this is not on a visitor's path.
import { NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { listArchivePhotos } from "@/app/lib/storage";

export async function GET(): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  return NextResponse.json({ frames: await listArchivePhotos(300) });
}
