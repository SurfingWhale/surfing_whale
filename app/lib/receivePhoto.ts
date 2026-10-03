// app/lib/receivePhoto.ts
// One photograph per request, into the studio's one library. The
// browser compresses before sending (app/darkroom/downscale.ts), so a phone's
// 8MB frame arrives as a few hundred kilobytes — well under the platform's
// 4.5MB body limit — and a batch of forty goes up as forty small requests.
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { type Folder, storageConfigured, uploadPhoto } from "@/app/lib/storage";

// Above the platform's own limit on purpose: the platform refuses first, and
// this only matters when running somewhere without one.
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function dimension(v: FormDataEntryValue | null): number | null {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= 12000 ? n : null;
}

export async function receivePhoto(req: NextRequest, folder: Folder = "library"): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  }
  if (!storageConfigured()) {
    return NextResponse.json(
      { error: "Storage is not set up on this deployment." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type: ${file.type || "unknown"}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Too large." }, { status: 413 });
  }
  // Measured by the browser while it was drawing the file. The session above
  // is the studio's own, so this is trusted the way the rest of the form is.
  const width = dimension(form!.get("width"));
  const height = dimension(form!.get("height"));
  if (!width || !height) {
    return NextResponse.json({ error: "Missing dimensions." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const base = file.name.replace(/\.[^.]+$/, "");
    const shot = await uploadPhoto(folder, bytes, file.type, base, width, height);
    // A library photograph is in the gallery unless it is hidden, so an upload
    // shows on the next load of the home page, not a minute later.
    if (folder === "library") revalidatePath("/");
    return NextResponse.json(shot);
  } catch (err) {
    console.error(`Upload to ${folder} failed:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Upload failed." }, { status: 502 });
  }
}
