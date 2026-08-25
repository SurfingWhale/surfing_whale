// app/lib/darkroomSession.ts
// The darkroom writes to Cloudinary and to Notion, so the gate in front of it
// has to hold on the server. The cookie carries nothing but an expiry and an
// HMAC over it — there is no session store to go stale, and nothing in the
// cookie is worth forging without the secret.
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "sw-darkroom";
const MAX_AGE_S = 60 * 60 * 12;

function secret(): string {
  // Falling back to a random per-boot value means a misconfigured deployment
  // fails closed — every cookie it issues stops verifying on the next boot —
  // rather than signing with a guessable constant.
  return process.env.DARKROOM_SECRET ?? randomBytes(32).toString("hex");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Constant-time compare that does not leak length through an exception. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function checkPassword(given: string): boolean {
  const expected = process.env.DARKROOM_PASSWORD;
  // No password configured means the darkroom is shut, not open to everyone.
  if (!expected) return false;
  return safeEqual(given, expected);
}

export function issueToken(): { value: string; maxAge: number } {
  const expires = Date.now() + MAX_AGE_S * 1000;
  const payload = String(expires);
  return { value: `${payload}.${sign(payload)}`, maxAge: MAX_AGE_S };
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!safeEqual(mac, sign(payload))) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

/** For route handlers: is this request carrying a valid darkroom session? */
export async function isUnlocked(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

export function configured(): boolean {
  return Boolean(process.env.DARKROOM_PASSWORD && process.env.DARKROOM_SECRET);
}
