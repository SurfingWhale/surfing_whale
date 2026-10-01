// app/darkroom/downscale.ts
// A phone photograph is 3–12MB and a camera's 8–25MB. A serverless function
// will not take a body over 4.5MB, and nothing on a web page needs the
// original. So the browser does the work before anything is sent: bound the
// long edge, re-encode, and report what that saved so the studio can say so.
//
// It always re-encodes, even a file that is already small, because drawing to
// a canvas is also what strips the EXIF block — and a phone writes the GPS
// position of every photograph into it. The pixels go up; where they were
// taken does not.
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;

export interface Downscaled {
  file: File;
  width: number;
  height: number;
  /** Bytes in, and bytes out. */
  before: number;
  after: number;
}

const encode = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function downscale(file: File, longEdge = 2000): Promise<Downscaled> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // HEIC is the usual cause: Safari opens it, most other browsers do not.
    throw new Error(`This browser cannot open ${file.name}. Export it as JPEG first.`);
  }
  const scale = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("This browser would not give us a canvas to resize on.");
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP is a third smaller than JPEG at the same look. A browser that cannot
  // encode it hands back a PNG instead, which is the signal to fall back.
  let blob = await encode(canvas, "image/webp", WEBP_QUALITY);
  if (blob?.type !== "image/webp") {
    // JPEG has no transparency; without a backdrop a transparent PNG turns black.
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    blob = await encode(canvas, "image/jpeg", JPEG_QUALITY);
  }
  if (!blob) throw new Error(`Could not compress ${file.name}.`);

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
  return {
    file: new File([blob], name, { type: blob.type }),
    width,
    height,
    before: file.size,
    after: blob.size,
  };
}

/** "6.2 MB", "410 KB" — for the line that says what compressing saved. */
export function size(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
