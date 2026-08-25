// app/api/darkroom/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { configured as notionReady } from "@/app/lib/darkroom";
import {
  COOKIE,
  checkPassword,
  configured,
  issueToken,
  isUnlocked,
} from "@/app/lib/darkroomSession";

// A password field on the open internet gets guessed at. This is not a
// replacement for a real limiter, but it turns an unattended dictionary run
// into something that takes a very long time from one address.
const attempts = new Map<string, { n: number; until: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 8;

function ipOf(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    unlocked: await isUnlocked(),
    // Says whether the deployment has its secrets, never what they are.
    configured: configured(),
    notion: notionReady(),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = ipOf(req);
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.n >= MAX_TRIES) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const { password } = await req.json().catch(() => ({ password: "" }));

  if (typeof password !== "string" || !checkPassword(password)) {
    const next = record && record.until > now ? record : { n: 0, until: now + WINDOW_MS };
    attempts.set(ip, { n: next.n + 1, until: next.until });
    return NextResponse.json({ error: "That is not the password." }, { status: 401 });
  }

  attempts.delete(ip);
  const { value, maxAge } = issueToken();
  const res = NextResponse.json({ unlocked: true });
  res.cookies.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ unlocked: false });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
