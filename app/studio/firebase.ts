// app/studio/firebase.ts
// Sign-in for the studio, following creative-hub's auth standard: Google, or
// email and password, either of which registers on first use.
//
// The SDK is imported only when the studio asks for it, so no visitor to the
// public site downloads any of it. The sign-in is kept in IndexedDB, so the
// home-screen app on a phone opens already signed in.
//
// What a sign-in proves is decided on the server (app/lib/adminAuth.ts); this
// file only gets a token from Firebase and hands it over.
import type { Auth, User } from "firebase/auth";
import { FIREBASE, SIGN_IN_HOST } from "@/app/lib/firebaseConfig";

const { apiKey, projectId, appId } = FIREBASE;

export const signInReady = Boolean(projectId && apiKey);

// Opened from the home screen. A popup there leaves for Safari and never
// reports back, so sign-in goes by redirect within the app instead.
export const standalone = () =>
  matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// Only the home-screen app needs Firebase's handler on this site's own origin
// (proxied in next.config.ts): its redirect has to come back to the app's own
// storage. A browser tab signs in by popup, which works through
// firebaseapp.com — and that handler's redirect URI Google registers by
// itself, so a browser sign-in never waits on a hand-entered URI in the
// Google Cloud console. A preview has no URI of its own either way.
function authDomain(): string {
  return standalone() && location.host === SIGN_IN_HOST
    ? location.host
    : `${projectId}.firebaseapp.com`;
}

type Kit = { auth: Auth; mod: typeof import("firebase/auth") };
let kit: Promise<Kit> | null = null;
// The same kit once it has arrived, for code that must not wait a tick.
let loaded: Kit | null = null;

/**
 * The browser inside Instagram, Facebook, TikTok, LINE and the like — a
 * WebView, which Google refuses to sign anyone in from (disallowed_useragent).
 * WhatsApp and Gmail open links in the system's own browser view, which
 * Google accepts, so they are not on the list.
 */
export function embeddedBrowser(): string | null {
  const m = navigator.userAgent.match(
    /\b(Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Bytedance|Twitter|Snapchat|LinkedInApp)/i
  );
  if (!m) return null;
  const k = m[1].toLowerCase();
  if (k.startsWith("fb")) return "Facebook";
  if (k.startsWith("line")) return "LINE";
  if (k === "tiktok" || k === "musical_ly" || k === "bytedance") return "TikTok";
  if (k === "linkedinapp") return "LinkedIn";
  return m[1];
}

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
  }).then((k) => (loaded = k));
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

/**
 * The signed-in user, or null when the page is leaving for a redirect or the
 * window was closed.
 *
 * Not async, on purpose. Safari only lets a tap open a window from inside the
 * tap itself, and an `await` before signInWithPopup — even on a promise that
 * has already resolved — was enough for it to block the window. So the popup
 * is opened first thing, from the kit already loaded when the page mounted.
 *
 * A blocked window is reported, not papered over with a redirect: in a
 * browser tab the redirect would go through firebaseapp.com, and Safari keeps
 * that domain's storage apart from this one, so the sign-in would come back
 * empty-handed with nothing on screen to say why.
 */
export function signInWithGoogle(): Promise<User | null> {
  if (!loaded) return load().then(() => signInWithGoogle());
  const { auth, mod } = loaded;
  const provider = new mod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  if (standalone()) return mod.signInWithRedirect(auth, provider).then(() => null);
  return mod.signInWithPopup(auth, provider).then(
    (r) => r.user,
    (err) => {
      const code = (err as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
      throw err;
    }
  );
}

// Email and password: no popup and no redirect, so nothing here depends on a
// redirect URI being registered anywhere — it works the same in a tab and in
// the home-screen app.
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { auth, mod } = await load();
  return (await mod.signInWithEmailAndPassword(auth, email, password)).user;
}

/** A new account, and the verification link sent straight away. */
export async function register(email: string, password: string): Promise<User> {
  const { auth, mod } = await load();
  const { user } = await mod.createUserWithEmailAndPassword(auth, email, password);
  await mod.sendEmailVerification(user);
  return user;
}

export async function resendVerification(): Promise<void> {
  const { auth, mod } = await load();
  if (auth.currentUser) await mod.sendEmailVerification(auth.currentUser);
}

/**
 * The reset link opens Firebase's page in the phone's browser, never in the
 * home-screen app; the continue link brings that browser back to the studio.
 * Only on hosts Firebase authorises — elsewhere a continue URL is refused.
 */
export async function resetPassword(email: string): Promise<void> {
  const { auth, mod } = await load();
  const known = location.host === SIGN_IN_HOST || location.hostname === "localhost";
  await mod.sendPasswordResetEmail(auth, email, known ? { url: `${location.origin}/studio` } : undefined);
}

export async function signOutOfFirebase(): Promise<void> {
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
  if (code === "auth/operation-not-allowed") return "That way of signing in is not switched on in Firebase yet.";
  if (
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found"
  ) {
    return "That email and password do not match. If this account was made with Google, it has no password yet — set one with Forgot password.";
  }
  if (code === "auth/email-already-in-use") return "That email already has an account. Sign in instead.";
  if (code === "auth/weak-password") return "Use at least 6 characters for the password.";
  if (code === "auth/invalid-email") return "That is not an email address.";
  if (code === "auth/too-many-requests") return "Too many tries. Wait a minute, then try again.";
  if (code === "auth/popup-blocked") {
    return "The browser blocked the Google window. Allow pop-ups for this site and tap again, or use email and password.";
  }
  if (code === "auth/operation-not-supported-in-this-environment" || code === "auth/web-storage-unsupported") {
    return "This browser can't do Google sign-in. Open the page in Safari or Chrome, or use email and password.";
  }
  if (code === "auth/user-disabled") return "This account has been switched off.";
  return code ? `Sign-in failed (${code}).` : "Sign-in failed.";
}
