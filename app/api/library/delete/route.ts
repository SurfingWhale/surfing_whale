// app/api/library/delete/route.ts
// Removing a photograph from the library for good.
//
// Refused while an essay or a post still shows it: deleting the file would
// leave a broken image on a published page, and nothing would say why. The
// answer names the pieces, so the photograph can be taken out of them first.
import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { deletePhoto, isLibraryPath, publicUrlOf } from "@/app/lib/storage";
import { essaysUsing } from "@/app/lib/darkroom";
import { postsUsing } from "@/app/lib/writing";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const publicId: unknown = body?.publicId;
  if (!isLibraryPath(publicId)) {
    return NextResponse.json({ error: "Out of scope." }, { status: 403 });
  }
  try {
    const using = [...(await essaysUsing(publicId)), ...(await postsUsing(publicUrlOf(publicId)))];
    if (using.length) {
      return NextResponse.json(
        { error: `Still used in ${using.map((t) => `“${t}”`).join(", ")}. Take it out there first.`, using },
        { status: 409 }
      );
    }
    await deletePhoto(publicId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Library delete failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not delete it." }, { status: 502 });
  }
}
