// app/api/studio/google-ready/route.ts
// Whether Google will finish a sign-in that comes back to this site's own
// /__/auth/handler — the only way the home-screen app can sign in with Google.
//
// That depends on one setting outside this repository: the handler's address
// has to be on the OAuth web client's list of Authorized redirect URIs in the
// Google Cloud console. It used to be a constant here (GOOGLE_IN_APP) that a
// person had to flip after checking by hand, and the check was never done at
// the right moment. Now the server asks Google the same way a sign-in would:
// it builds the real sign-in address and sees whether Google answers with its
// sign-in page or with redirect_uri_mismatch. The app offers Google in place
// the first time the answer is yes, with nothing to deploy.
//
// No secret is involved: the API key is the public web key, and the answer is
// a single boolean. Cached for ten minutes at the edge and in the instance,
// so the studio's sign-in page costs Google two requests per ten minutes.
import { FIREBASE, SIGN_IN_HOST } from "@/app/lib/firebaseConfig";

export const dynamic = "force-dynamic";

const TTL = 10 * 60 * 1000;
let memo: { ready: boolean; at: number } | null = null;

async function probe(): Promise<boolean> {
  const made = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${FIREBASE.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: `https://${SIGN_IN_HOST}/` },
      body: JSON.stringify({ providerId: "google.com", continueUri: `https://${SIGN_IN_HOST}/__/auth/handler` }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }
  );
  const { authUri } = (await made.json().catch(() => ({}))) as { authUri?: string };
  if (!authUri) return false;
  const page = await fetch(authUri, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  const body = await page.text();
  return page.ok && !body.includes("redirect_uri_mismatch");
}

export async function GET() {
  if (!memo || Date.now() - memo.at > TTL) {
    const ready = await probe().catch(() => false);
    memo = { ready, at: Date.now() };
  }
  return Response.json(
    { ready: memo.ready },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60" } }
  );
}
