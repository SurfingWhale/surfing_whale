// app/api/archive/delete/route.ts
// Removing a frame he did not mean to send up. Scoped to the archive folder so
// this cannot be turned into a way to delete an essay's photographs or a
// project screenshot, even with a valid session.
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { deletePhoto } from "@/app/lib/storage";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const publicId: unknown = body?.publicId;
  if (typeof publicId !== "string" || !publicId) {
    return NextResponse.json({ error: "No publicId." }, { status: 400 });
  }
  // One level under archive/, and nothing that could climb out of it.
  if (!/^archive\/[^/]+$/.test(publicId) || publicId.includes("..")) {
    return NextResponse.json({ error: "Out of scope." }, { status: 403 });
  }
  try {
    await deletePhoto(publicId);
    revalidatePath("/archive");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Archive delete failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Delete failed." }, { status: 502 });
  }
}
