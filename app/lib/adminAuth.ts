// app/lib/adminAuth.ts
// Who may open the studio: one Google account, checked by its verified email.
//
// The browser signs in with Firebase and hands us the ID token. Nothing here
// trusts the browser's word for who it is — the token is a JWT signed by
// Google, and it is verified against Google's published keys, for this
// Firebase project only, before its email is read. A token from any other
// Firebase project fails the audience check; an unverified address fails the
// email_verified check. Google sign-ins are always verified.
//
// Once it passes, the studio's own signed cookie takes over (darkroomSession.ts),
// so every route that already checks isUnlocked() needs no change.
import { createRemoteJWKSet, jwtVerify } from "jose";
import { FIREBASE } from "./firebaseConfig";

// Already printed on the Contact section, so nothing is disclosed by having it
// here. ADMIN_EMAIL overrides it without a code change.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "fauzymuhamad43@gmail.com").trim().toLowerCase();

const GOOGLE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export const firebaseProject = () => FIREBASE.projectId;

/** Why a sign-in was refused, or null when it is the admin's. */
export type Refusal = { status: 401 | 403 | 503; error: string } | null;

export async function verifyAdmin(idToken: unknown): Promise<Refusal> {
  const project = firebaseProject();
  if (!project) {
    return { status: 503, error: "Sign-in is not set up on this deployment." };
  }
  if (typeof idToken !== "string" || idToken.length > 4096) {
    return { status: 401, error: "No sign-in came with that." };
  }

  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_KEYS, {
      issuer: `https://securetoken.google.com/${project}`,
      audience: project,
      algorithms: ["RS256"],
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (!payload.sub || payload.email_verified !== true || email !== ADMIN_EMAIL) {
      // Deliberately the same answer for "unverified" and "someone else": the
      // studio says whose door this is to nobody.
      return { status: 403, error: "That account cannot open the studio." };
    }
    return null;
  } catch {
    return { status: 401, error: "That sign-in could not be verified. Try again." };
  }
}
