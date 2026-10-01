// app/darkroom/sendPhoto.ts
// Compress in the browser, then post into the library — the one path every
// room in the studio uses to put a photograph up, so a phone and a laptop send
// the same thing, and an upload from an editor is in the library afterwards.
import { downscale } from "./downscale";

export interface Sent {
  url: string;
  publicId: string;
  width: number;
  height: number;
  before: number;
  after: number;
}

// Enough for a full-width frame on a 2x laptop screen, and the most any page
// on the site asks of a photograph.
const LONG_EDGE = 2400;

export async function sendPhoto(
  file: File,
  onCompressed?: (before: number, after: number) => void
): Promise<Sent> {
  const small = await downscale(file, LONG_EDGE);
  onCompressed?.(small.before, small.after);

  const body = new FormData();
  body.append("file", small.file);
  body.append("width", String(small.width));
  body.append("height", String(small.height));
  const res = await fetch("/api/library/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.error ?? (res.status === 413 ? "Still too large after compressing." : `HTTP ${res.status}`)
    );
  }
  return { ...data, before: small.before, after: small.after };
}
