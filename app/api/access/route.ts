// app/api/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  recordAccess,
  isValidEmail,
  EMAIL_MAX,
  NAME_MAX,
  MESSAGE_MAX,
  type AccessReason,
} from "@/app/lib/accessRequests";
import { gateEnabled, isReader } from "@/app/lib/accessSession";

const REASONS: AccessReason[] = ["CV", "Project"];

/**
 * Health check — reports whether the Notion target is configured, without
 * exposing it. Mirrors the status GET on /api/sync-images.
 */
export async function GET(): Promise<NextResponse> {
  const res = NextResponse.json({
    status: "ok",
    endpoint: "POST /api/access",
    notionConfigured: Boolean(process.env.NOTION_ACCESS_DATABASE_ID),
    // Off, a request still records but the visitor is let straight in, which
    // is how this behaved before approval existed.
    gate: gateEnabled() ? "approval" : "open",
    // The client cannot read the cookie — it is httpOnly — so the answer to
    // "am I in?" has to come from here.
    reader: await isReader(),
  });
  // Two visitors differ only by cookie, so a shared cache would hand one
  // person's answer to the next.
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot — real people leave this hidden field empty.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = String(body.email ?? "").trim();
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: `Enter a valid email address (max ${EMAIL_MAX} characters).` },
      { status: 400 }
    );
  }

  const reason: AccessReason = REASONS.includes(body.reason) ? body.reason : "CV";
  const name = String(body.name ?? "").trim().slice(0, NAME_MAX);
  const message = String(body.message ?? "").trim().slice(0, MESSAGE_MAX);

  const pending = gateEnabled();

  try {
    const token = await recordAccess(email, reason, { name, message });

    if (!pending) {
      // Gate off: unchanged behaviour, in straight away.
      if (!token) console.warn("Access granted but not recorded:", reason);
      return NextResponse.json({ ok: true, pending: false });
    }

    // Gate on: a failed write must not read as "you're approved", because
    // nothing would ever arrive for Fauzy to approve.
    if (!token) {
      return NextResponse.json(
        { error: "Could not send your request. Try again in a moment." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, pending: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Access route error:", msg);
    if (pending) {
      return NextResponse.json(
        { error: "Could not send your request. Try again in a moment." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, pending: false });
  }
}
