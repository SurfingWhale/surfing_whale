// app/api/studio/access/route.ts
// Reading and approving access requests. Behind the studio session, because
// every row carries an email address.
import { NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/app/lib/darkroomSession";
import { listRequests, setApproved, ensureToken } from "@/app/lib/accessRequests";
import { sendMail, approvalEmail, mailConfigured } from "@/app/lib/mail";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://surfing-whale.vercel.app";

export async function GET(): Promise<NextResponse> {
  if (!(await isUnlocked()))
    return NextResponse.json({ error: "Locked." }, { status: 401 });
  try {
    return NextResponse.json({
      requests: await listRequests(),
      mailConfigured: mailConfigured(),
    });
  } catch (err) {
    console.error("Access list error:", err);
    return NextResponse.json({ error: "Could not read requests." }, { status: 502 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isUnlocked()))
    return NextResponse.json({ error: "Locked." }, { status: 401 });

  let body: {
    id?: string;
    approved?: boolean;
    email?: string;
    name?: string;
    token?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const approved = Boolean(body.approved);

  if (!(await setApproved(id, approved))) {
    return NextResponse.json({ error: "Notion rejected the change." }, { status: 502 });
  }

  // Read the token off the row rather than trusting the one the panel sent,
  // and mint one for any row that predates the column.
  const token = (await ensureToken(id)) ?? String(body.token ?? "");
  const link = token ? `${SITE}/unlock/${token}` : "";

  // Withdrawing sends nothing. There is no polite version of that email, and
  // a cookie already issued keeps working until it expires regardless, so a
  // message would overstate what just happened.
  if (!approved) return NextResponse.json({ ok: true, link });

  // Mail is the convenience; the link is the mechanism. It comes back either
  // way so the studio can always show it and it can be sent by hand.
  if (!link) {
    return NextResponse.json(
      { error: "Approved, but no unlock token could be issued. Check the Token column." },
      { status: 502 }
    );
  }

  const { subject, text } = approvalEmail(String(body.name ?? ""), link);
  const mail = await sendMail({ to: String(body.email ?? ""), subject, text });

  return NextResponse.json({ ok: true, link, mail });
}
