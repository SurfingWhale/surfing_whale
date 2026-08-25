// app/darkroom/downscale.ts
// Photographs come off a camera at 8–25MB, and a serverless function will not
// accept a body that size. Resizing in the browser before upload keeps every
// request small, makes twenty files feasible, and costs the print nothing at
// 2000px on the long edge.
const LONG_EDGE = 2000;
const QUALITY = 0.85;

export interface Downscaled {
  file: File;
  width: number;
  height: number;
}

export async function downscale(file: File): Promise<Downscaled> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    // Losing the canvas is not a reason to lose the photograph; send the
    // original and let the server's size limit be the backstop.
    return { file, width: bitmap.width, height: bitmap.height };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  if (!blob) return { file, width, height };

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { file: new File([blob], name, { type: "image/jpeg" }), width, height };
}
