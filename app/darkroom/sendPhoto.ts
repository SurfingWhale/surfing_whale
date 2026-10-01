// app/darkroom/sendPhoto.ts
// Compress in the browser, then post — the one path every room in the studio
// uses to put a photograph up, so a phone and a laptop send the same thing.
import { downscale } from "./downscale";

export interface Sent {
  url: string;
  publicId: string;
  width: number;
  height: number;
  before: number;
  after: number;
}

// The archive keeps a little more: it is the pile the essays are drawn from.
const LONG_EDGE = { darkroom: 2000, archive: 2400 } as const;

export async function sendPhoto(
  file: File,
  to: keyof typeof LONG_EDGE,
  onCompressed?: (before: number, after: number) => void
): Promise<Sent> {
  const small = await downscale(file, LONG_EDGE[to]);
  onCompressed?.(small.before, small.after);

  const body = new FormData();
  body.append("file", small.file);
  body.append("width", String(small.width));
  body.append("height", String(small.height));
  const res = await fetch(`/api/${to}/upload`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.error ?? (res.status === 413 ? "Still too large after compressing." : `HTTP ${res.status}`)
    );
  }
  return { ...data, before: small.before, after: small.after };
}
