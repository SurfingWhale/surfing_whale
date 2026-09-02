// app/unlock/[token]/route.ts
// The link an approved reader is sent. It checks the token against Notion,
// swaps it for a signed cookie and gets out of the way.
//
// The token stays in Notion rather than being re-derivable from the cookie, so
// access can be taken back later by unticking Approved — a self-contained
// signed token could not be revoked without rotating the secret for everyone.
import { NextRequest, NextResponse } from "next/server";
import { findApprovedToken } from "@/app/lib/accessRequests";
import { COOKIE, issueReaderToken } from "@/app/lib/accessSession";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await params;

  let ok = false;
  try {
    ok = Boolean(await findApprovedToken(token));
  } catch (err) {
    console.error("Unlock lookup failed:", err);
  }

  // One destination either way. A bad token lands on the same page as a good
  // one, differing only in the banner — there is nothing to probe for.
  const url = new URL(ok ? "/?unlocked=1" : "/?unlocked=0", req.url);
  const res = NextResponse.redirect(url);

  if (ok) {
    const { value, maxAge } = issueReaderToken();
    res.cookies.set(COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
  }
  return res;
}
