// app/api/library/delete/route.ts
// Removing a photograph from the library for good.
//
// Refused while an essay or a post still shows it: deleting the file would
// leave a broken image on a published page, and nothing would say why. The
// answer names the pieces, so the photograph can be taken out of them first.
//
// Every failure says which half failed and why. It used to answer every one of
// them with "Could not delete it." — including the case where the server knew
// the exact fix ("run supabase/surfing-whale.sql") and threw it away. The only
// person who sees this message is the only person who can act on it, and a
// dead end told him nothing.
import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { deletePhoto, isLibraryPath, publicUrlOf } from "@/app/lib/storage";
import { SetupError } from "@/app/lib/db";
import { essaysUsing } from "@/app/lib/darkroom";
import { postsUsing } from "@/app/lib/writing";

const reasonOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const publicId: unknown = body?.publicId;
  if (!isLibraryPath(publicId)) {
    return NextResponse.json({ error: "Out of scope." }, { status: 403 });
  }

  // Step one: is anything published still showing it?
  let using: string[];
  try {
    using = [
      ...(await essaysUsing(publicId)),
      ...(await postsUsing(publicUrlOf(publicId))),
    ];
  } catch (err) {
    const reason = reasonOf(err);
    console.error("Library delete — the in-use check failed:", reason);
    // Fail closed, and say so. Not knowing whether a published page shows this
    // photograph is not permission to delete it; deleting anyway is how a live
    // essay ends up with a hole in it.
    return NextResponse.json(
      {
        error:
          err instanceof SetupError
            ? reason
            : `Could not check whether an essay or a post still uses this photograph, so it was left alone. ${reason}`,
      },
      { status: 503 }
    );
  }

  if (using.length) {
    return NextResponse.json(
      {
        error: `Still used in ${using.map((t) => `“${t}”`).join(", ")}. Take it out there first.`,
        using,
      },
      { status: 409 }
    );
  }

  // Step two: the file itself.
  try {
    await deletePhoto(publicId);
  } catch (err) {
    const reason = reasonOf(err);
    console.error("Library delete — storage refused:", reason);
    return NextResponse.json(
      { error: `Storage refused the delete: ${reason}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
