// app/api/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { recordAccess, isValidEmail, EMAIL_MAX, type AccessReason } from "@/app/lib/accessRequests";

const REASONS: AccessReason[] = ["CV", "Project"];

/**
 * Health check — reports whether the Notion target is configured, without
 * exposing it. Mirrors the status GET on /api/sync-images.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "POST /api/access",
    notionConfigured: Boolean(process.env.NOTION_ACCESS_DATABASE_ID),
  });
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

  try {
    // The visitor is let through regardless of whether the write lands — a
    // Notion hiccup should not hold up access they have already asked for.
    const saved = await recordAccess(email, reason);
    if (!saved) console.warn("Access granted but not recorded:", reason);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Access route error:", message);
    return NextResponse.json({ ok: true });
  }
}
