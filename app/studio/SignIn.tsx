// app/studio/SignIn.tsx
// The studio's door, set like any sign-in page: Google, or an email and a
// password, with a way to make an account and a way back in when the password
// is gone. Whoever signs in, the server decides whether that account is the
// one this studio belongs to (app/lib/adminAuth.ts) — signing in proves who
// you are, not that you may write.
//
// A phone that has signed in before opens straight through: the session is
// kept on the device, so this trades it for a fresh studio cookie without
// asking for anything.
"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { SIGN_IN_HOST } from "@/app/lib/firebaseConfig";
import {
  allowAppHandler,
  currentUser,
  describe,
  register,
  resendVerification,
  resetPassword,
  signInReady,
  signInWithEmail,
  signInWithGoogle,
  signOutOfFirebase,
  standalone,
  embeddedBrowser,
  isIOS,
  openStudioInSafari,
} from "./firebase";

type Mode = "signin" | "register";

const link =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200";
// 16px on a phone: iOS zooms the page into any field set smaller.
const field =
  "w-full h-11 rounded-lg border border-border bg-bg px-3 text-[16px] sm:text-[13px] text-fg placeholder:text-fg-muted focus:border-fg transition-colors duration-200";
const label = "block text-[11px] leading-[1.6] text-fg-label mb-2";
const hint = "text-[11px] leading-[1.7] text-fg-muted";

export function SignIn({
  configured,
  notion,
  storage,
  onIn,
}: {
  configured: boolean;
  notion: boolean;
  storage: boolean;
  onIn: () => void;
}) {
  const ready = signInReady && configured;
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(ready);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [refused, setRefused] = useState(false);
  // Decided after mount: the server render cannot know it is in an app.
  const [inApp, setInApp] = useState(false);
  const [embedded, setEmbedded] = useState<string | null>(null);
  const [ios, setIOS] = useState(false);
  const [resetAt, setResetAt] = useState(0);
  // In the app, whether Google accepts the sign-in coming back to it yet —
  // asked before Firebase loads, because it decides where Firebase signs in.
  const [appGoogle, setAppGoogle] = useState(false);
  const [probed, setProbed] = useState(false);
  useEffect(() => {
    const app = standalone();
    setInApp(app);
    setEmbedded(embeddedBrowser());
    setIOS(isIOS());
    if (!app) {
      setProbed(true);
      return;
    }
    fetch("/api/studio/google-ready")
      .then((r) => r.json())
      .then((j: { ready?: boolean }) => j.ready === true)
      .catch(() => false)
      .then((ok) => {
        allowAppHandler(ok);
        setAppGoogle(ok);
        setProbed(true);
      });
  }, []);
  // Google is offered everywhere but inside another app's browser, which
  // Google refuses. In the home-screen app on an iPhone, until Google accepts
  // the app's own sign-in address, the button takes the studio to Safari —
  // where Google works — instead of starting a sign-in that cannot return.
  const showGoogle = !embedded;
  const viaSafari = inApp && ios && !appGoogle;

  const clear = () => {
    setError(null);
    setNotice(null);
    setRefused(false);
    setUnverified(false);
  };

  const exchange = useCallback(
    async (user: User) => {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/darkroom/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }).catch(() => null);
      if (res?.ok) return onIn();
      setRefused(res?.status === 403);
      setError((await res?.json().catch(() => null))?.error ?? "Could not reach the server.");
    },
    [onIn]
  );

  // An account made with a password has to prove its address before the
  // server will take it; until then there is nothing to trade, only a link to
  // resend.
  const proceed = useCallback(
    async (user: User) => {
      if (!user.emailVerified) {
        setUnverified(true);
        setNotice(`Open the link we sent to ${user.email}, then sign in here.`);
        return;
      }
      await exchange(user);
    },
    [exchange]
  );

  useEffect(() => {
    if (!ready || !probed) return;
    let alive = true;
    currentUser()
      .then(async ({ user, error }) => {
        if (!alive) return;
        if (error) setError(describe(error));
        if (!user) return;
        // The verified flag on a stored session is as old as the session.
        await user.reload().catch(() => {});
        if (alive) await proceed(user);
      })
      .catch((err) => alive && setError(describe(err)))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [ready, probed, proceed]);

  // signInWithGoogle is called before anything is awaited, so the window it
  // opens still counts as opened by the tap — see the note on it.
  const google = () => {
    clear();
    setBusy(true);
    signInWithGoogle()
      .then(async (user) => {
        if (user) await exchange(user);
      })
      .catch((err) => setError(describe(err)))
      .finally(() => setBusy(false));
  };

  const safari = () => {
    clear();
    openStudioInSafari();
    // iOS before 17 does not know the x-safari- link and stays where it is.
    setTimeout(() => {
      if (document.visibilityState === "visible") {
        setNotice(`If Safari did not open, open ${SIGN_IN_HOST}/studio in Safari.`);
      }
    }, 1500);
  };

  // The button stays pressable with a field empty and says which one, rather
  // than greying itself out and leaving the reason to be guessed.
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    const address = email.trim();
    if (!address) return setError("Enter your email.");
    if (!password) return setError(mode === "register" ? "Choose a password." : "Enter your password.");
    setBusy(true);
    try {
      if (mode === "register") {
        await register(address, password);
        setMode("signin");
        setPassword("");
        setUnverified(true);
        setNotice(`Account made. Open the link we sent to ${address}, then sign in here.`);
      } else {
        await proceed(await signInWithEmail(address, password));
      }
    } catch (err) {
      setError(describe(err));
    }
    setBusy(false);
  };

  const resend = async () => {
    clear();
    try {
      await resendVerification();
      setUnverified(true);
      setNotice("Sent again. Check your inbox, and the spam folder.");
    } catch (err) {
      setError(describe(err));
    }
  };

  // Each new reset email cancels the link in the one before, so a second tap
  // soon after the first would only break the link on its way. A minute apart.
  const forgot = async () => {
    clear();
    const address = email.trim();
    if (!address) return setError("Enter your email first, then tap Forgot password.");
    if (Date.now() - resetAt < 60_000) {
      return setNotice("Already sent — open the newest email. You can ask again in a minute.");
    }
    try {
      await resetPassword(address);
      setResetAt(Date.now());
      setNotice(
        `If ${address} has an account, a link is on its way from Firebase — check spam too. ` +
          "Open only the newest one; each new email cancels the last. Choose a password there, then sign in here."
      );
    } catch (err) {
      setError(describe(err));
    }
  };

  const another = async () => {
    await signOutOfFirebase().catch(() => {});
    clear();
    setPassword("");
  };

  const switchMode = () => {
    clear();
    setMode(mode === "signin" ? "register" : "signin");
  };

  return (
    <div>
      <h2 className="text-[15px] font-medium tracking-[-0.02em] text-fg mb-6">
        {mode === "register" ? "Create an account" : "Sign in"}
      </h2>

      {showGoogle && (
        <>
          <button
            type="button"
            onClick={viaSafari ? safari : google}
            disabled={!ready || busy}
            className="w-full h-11 rounded-lg border border-border bg-bg hover:border-border-strong flex items-center justify-center gap-3 text-[13px] font-medium text-fg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleMark />
            {viaSafari ? "Continue with Google in Safari" : "Continue with Google"}
          </button>
          <div className="flex items-center gap-3 my-6 text-[11px] text-fg-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} noValidate className="space-y-4">
        <label className="block">
          <span className={label}>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={field}
          />
        </label>
        <label className="block">
          <span className={label}>Password</span>
          <input
            type="password"
            name="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
        </label>
        <button
          type="submit"
          disabled={!ready || busy}
          className="w-full h-11 rounded-lg bg-fg text-bg text-[13px] font-medium hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "One moment…" : mode === "register" ? "Create account" : "Sign in"}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-[13px] leading-[1.8] text-fg mt-4">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-[13px] leading-[1.8] text-fg-body mt-4">
          {notice}
        </p>
      )}
      {(unverified || refused) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[13px]">
          {unverified && (
            <button type="button" onClick={resend} className={`${link} py-1`}>
              Send the link again
            </button>
          )}
          <button type="button" onClick={another} className={`${link} py-1`}>
            Use another account
          </button>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-x-5 gap-y-1 mt-6 text-[13px] text-fg-body">
        <button type="button" onClick={switchMode} className="py-1 hover:text-fg transition-colors duration-200">
          {mode === "signin" ? (
            <>No account yet? <span className={link}>Create one</span></>
          ) : (
            <>Have an account? <span className={link}>Sign in</span></>
          )}
        </button>
        {mode === "signin" && (
          <button type="button" onClick={forgot} className="py-1 hover:text-fg transition-colors duration-200">
            Forgot password?
          </button>
        )}
      </div>

      {viaSafari && (
        <p className={`${hint} mt-6`}>
          Google cannot hand a sign-in back to the home-screen app yet, so the button
          opens the studio in Safari, where it works. As soon as Google accepts this
          site&apos;s sign-in address it signs you in right here instead — nothing to
          update. A password works in the app now.
        </p>
      )}
      {embedded && (
        <p className={`${hint} mt-6`}>
          Google sign-in does not work inside {embedded}&apos;s browser — Google refuses
          it there. Open this page in Safari or Chrome (the ⋯ menu, then Open in browser),
          or sign in with email and password.
        </p>
      )}
      {!signInReady && (
        <p className={`${hint} mt-6`}>
          The Firebase web config is empty (app/lib/firebaseConfig.ts), so there
          is nothing to sign in with.
        </p>
      )}
      {signInReady && !configured && (
        <p className={`${hint} mt-6`}>
          DARKROOM_SECRET is not set on this deployment, so a sign-in would have
          nothing to sign the studio&apos;s cookie with.
        </p>
      )}
      {ready && (!storage || !notion) && (
        <p className={`${hint} mt-6`}>
          Supabase is not connected on this deployment (SUPABASE_URL and
          SUPABASE_SERVICE_ROLE_KEY), so nothing can be saved or uploaded.
        </p>
      )}
    </div>
  );
}

/** Google's "G", in its own colours — the mark people look for on this button. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
