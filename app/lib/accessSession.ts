// app/lib/accessSession.ts
// The reader's side of the gate. Approving someone mints nothing new — the
// token was issued when they asked — so all this does is turn a token they
// were sent into a cookie that survives the visit.
//
// Same shape as the darkroom session and for the same reason: an expiry with
// an HMAC over it, no session store to go stale. It reuses DARKROOM_SECRET
// because both are "this deployment's signing key"; a second secret would be
// one more thing to set and forget.
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "sw-reader";

// Long, because this is a courtesy, not a security boundary. Making someone
// ask again every week for work they were already granted would be rude.
const MAX_AGE_S = 60 * 60 * 24 * 180;

function secret(): string {
  // A random per-boot fallback fails closed on a misconfigured deployment
  // rather than signing with a guessable constant.
  return process.env.DARKROOM_SECRET ?? randomBytes(32).toString("hex");
}

const sign = (payload: string) =>
  createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function issueReaderToken(): { value: string; maxAge: number } {
  const expires = Date.now() + MAX_AGE_S * 1000;
  const payload = String(expires);
  return { value: `${payload}.${sign(payload)}`, maxAge: MAX_AGE_S };
}

export function verifyReaderToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), sign(payload))) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

export async function isReader(): Promise<boolean> {
  const jar = await cookies();
  return verifyReaderToken(jar.get(COOKIE)?.value);
}

/** True once the gate is switched on. Off, everything stays open as before. */
export const gateEnabled = () =>
  process.env.ACCESS_GATE === "on" && Boolean(process.env.NOTION_ACCESS_DATABASE_ID);
