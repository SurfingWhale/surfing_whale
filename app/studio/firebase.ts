// app/studio/firebase.ts
// Google sign-in for the studio, following creative-hub's auth standard.
//
// The SDK is imported only when the studio asks for it, so no visitor to the
// public site downloads any of it. The sign-in is kept in IndexedDB, so the
// home-screen app on a phone opens already signed in.
//
// What a sign-in proves is decided on the server (app/lib/adminAuth.ts); this
// file only gets a token from Google and hands it over.
import type { Auth, User } from "firebase/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export const signInReady = Boolean(projectId && apiKey);

// Firebase's sign-in handler is proxied through this site (next.config.ts), so
// a redirect from the home-screen app comes back to the same origin and the
// same storage. Only on the production host: a preview has no redirect URI
// registered with Google, so it keeps firebaseapp.com.
function authDomain(): string {
  try {
    if (SITE && new URL(SITE).host === location.host) return location.host;
  } catch {
    /* a malformed NEXT_PUBLIC_SITE_URL is the same as none */
  }
  return `${projectId}.firebaseapp.com`;
}

// Opened from the home screen. A popup there leaves for Safari and never
// reports back, so sign-in goes by redirect within the app instead.
const standalone = () =>
  matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

type Kit = { auth: Auth; mod: typeof import("firebase/auth") };
let kit: Promise<Kit> | null = null;

function load(): Promise<Kit> {
  kit ??= Promise.all([import("firebase/app"), import("firebase/auth")]).then(([app, mod]) => {
    // A hot reload re-runs this module but keeps Firebase's own registry.
    const existing = app.getApps()[0];
    if (existing) return { auth: mod.getAuth(existing), mod };
    const fb = app.initializeApp({ apiKey, authDomain: authDomain(), projectId, appId: appId || undefined });
    const auth = mod.initializeAuth(fb, {
      persistence: [mod.indexedDBLocalPersistence, mod.browserLocalPersistence],
      popupRedirectResolver: mod.browserPopupRedirectResolver,
    });
    return { auth, mod };
  });
  return kit;
}

/**
 * Who is signed in on this device. Coming back from a redirect sign-in, its
 * result is collected first, so the page does not decide "signed out" a
 * moment before the answer lands.
 */
export async function currentUser(): Promise<{ user: User | null; error: unknown }> {
  const { auth, mod } = await load();
  let error: unknown = null;
  try {
    await mod.getRedirectResult(auth);
  } catch (err) {
    error = err;
  }
  await auth.authStateReady();
  return { user: auth.currentUser, error };
}

/** The signed-in user, or null when the page is leaving for a redirect. */
export async function signIn(): Promise<User | null> {
  const { auth, mod } = await load();
  const provider = new mod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  if (standalone()) {
    await mod.signInWithRedirect(auth, provider);
    return null;
  }
  try {
    return (await mod.signInWithPopup(auth, provider)).user;
  } catch (err) {
    const code = (err as { code?: string }).code;
    // In-app browsers (Instagram, WhatsApp) block popups; a full-page
    // redirect gets there instead and the page picks it up on return.
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await mod.signInWithRedirect(auth, provider);
      return null;
    }
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
    throw err;
  }
}

export async function signOutOfGoogle(): Promise<void> {
  if (!signInReady) return;
  const { auth, mod } = await load();
  await mod.signOut(auth);
}

/** Firebase's codes, in words that say what to do about them. */
export function describe(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/unauthorized-domain") {
    return "This address is not on Firebase's list of authorised domains yet.";
  }
  if (code === "auth/network-request-failed") return "No connection. Try again when you have signal.";
  if (code === "auth/operation-not-allowed") return "Google sign-in is not switched on in Firebase yet.";
  return code ? `Sign-in failed (${code}).` : "Sign-in failed.";
}
