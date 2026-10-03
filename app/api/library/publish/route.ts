// app/api/library/publish/route.ts
// Putting a photograph on the site, or taking it off, without writing a piece
// around it first.
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { isLibraryPath, publicUrlOf } from "@/app/lib/storage";
import { savePhotoMeta, isCategory } from "@/app/lib/photos";
import { SetupError } from "@/app/lib/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const publicId: unknown = body?.publicId;
  if (!isLibraryPath(publicId)) {
    return NextResponse.json({ error: "Out of scope." }, { status: 403 });
  }
  const category = isCategory(body?.category) ? body.category : "everyday";
  const width = Number(body?.width);
  const height = Number(body?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return NextResponse.json({ error: "That photograph has no size." }, { status: 400 });
  }

  try {
    await savePhotoMeta({
      publicId,
      alt: String(body?.alt ?? ""),
      category,
      published: Boolean(body?.published),
      // Derived here rather than trusted from the browser: the only URL this
      // row may carry is the one the bucket gives for this path.
      url: publicUrlOf(publicId),
      width,
      height,
      sort: Number.isFinite(Number(body?.sort)) ? Number(body.sort) : 0,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("Library publish failed:", reason);
    if (err instanceof SetupError) return NextResponse.json({ error: reason }, { status: 503 });
    return NextResponse.json({ error: `Could not save it: ${reason}` }, { status: 502 });
  }

  // The gallery is on the home page, so the change is visible on the next load
  // rather than after the revalidate window.
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
