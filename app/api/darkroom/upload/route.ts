// app/api/darkroom/upload/route.ts
// One photograph per request. The browser downscales before sending, which
// keeps each request well under the platform's body limit and means twenty
// files can go up as twenty small requests instead of one that fails.
import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { uploadPhoto } from "@/app/lib/cloudinary";
import { toSlug } from "@/app/lib/darkroom";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked())) {
    return NextResponse.json({ error: "Locked." }, { status: 401 });
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

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base = toSlug(file.name.replace(/\.[^.]+$/, "")) || "frame";
    const shot = await uploadPhoto(buffer, base);
    return NextResponse.json({
      url: shot.secure_url,
      publicId: shot.public_id,
      width: shot.width,
      height: shot.height,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Darkroom upload failed:", message);
    return NextResponse.json({ error: "Upload failed." }, { status: 502 });
  }
}
