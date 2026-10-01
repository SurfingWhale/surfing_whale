// app/api/darkroom/session/route.ts
// Trades a verified Google sign-in for the studio's own cookie.
//
// There used to be a password here, and an in-memory limiter in front of it
// that reset on every cold start. A Firebase ID token cannot be guessed at, so
// both are gone: the only thing this accepts is a token Google signed for this
// project, carrying the admin's verified address.
import { NextRequest, NextResponse } from "next/server";
import { configured as databaseReady } from "@/app/lib/darkroom";
import { verifyAdmin } from "@/app/lib/adminAuth";
import { storageConfigured } from "@/app/lib/storage";
import { COOKIE, configured, issueToken, isUnlocked } from "@/app/lib/darkroomSession";

function withSession(res: NextResponse): NextResponse {
  const { value, maxAge } = issueToken();
  res.cookies.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}

export async function GET(): Promise<NextResponse> {
  const unlocked = await isUnlocked();
  const res = NextResponse.json({
    unlocked,
    // Says whether the deployment has its secrets, never what they are.
    configured: configured(),
    // Named for where essays used to be kept; it now means the database.
    notion: databaseReady(),
    storage: storageConfigured(),
  });
  // Never cached. This is the one answer on the site that differs per person,
  // and a browser that heuristically caches it would report yesterday's state
  // — which is indistinguishable from the feature being broken.
  res.headers.set("Cache-Control", "no-store, max-age=0");

  // Sliding renewal: every visit that finds the session valid pushes its
  // expiry out again, so the week is a week of inactivity rather than a hard
  // stop a week after logging in.
  return unlocked ? withSession(res) : res;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!configured()) {
    return NextResponse.json(
      { error: "Sign-in is not set up on this deployment." },
      { status: 503 }
    );
  }
  const { idToken } = await req.json().catch(() => ({ idToken: null }));
  const refused = await verifyAdmin(idToken);
  if (refused) {
    return NextResponse.json({ error: refused.error }, { status: refused.status });
  }
  return withSession(NextResponse.json({ unlocked: true }));
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ unlocked: false });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
