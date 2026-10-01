// app/studio/SignIn.tsx
// The studio's door. One button: sign in with Google, and the server decides
// whether that account is the one this studio belongs to.
//
// A phone that has signed in before opens straight through — the Google
// session is kept on the device, so this trades it for a fresh studio cookie
// without asking for anything.
"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { currentUser, describe, signIn, signInReady, signOutOfGoogle } from "./firebase";

const link =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200 disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed";
const hint = "text-[11px] leading-[1.7] text-fg-muted mt-6";

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
  const [busy, setBusy] = useState(ready);
  const [error, setError] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);

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

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    currentUser()
      .then(async ({ user, error }) => {
        if (!alive) return;
        if (error) setError(describe(error));
        if (user) await exchange(user);
      })
      .catch((err) => alive && setError(describe(err)))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [ready, exchange]);

  const go = async () => {
    setBusy(true);
    setError(null);
    setRefused(false);
    try {
      const user = await signIn();
      if (user) await exchange(user);
    } catch (err) {
      setError(describe(err));
    }
    setBusy(false);
  };

  const another = async () => {
    await signOutOfGoogle().catch(() => {});
    void go();
  };

  return (
    <>
      <button onClick={go} disabled={!ready || busy} className={`${link} text-[13px] py-2`}>
        {busy ? "Checking…" : "Sign in with Google →"}
      </button>
      {error && <p className="text-[13px] leading-[2] text-fg mt-4">{error}</p>}
      {refused && (
        <button onClick={another} className={`${link} text-[13px] py-2 mt-1`}>
          Use another account
        </button>
      )}

      {!signInReady && (
        <p className={hint}>
          The Firebase web config is empty (app/lib/firebaseConfig.ts), so there
          is nothing to sign in with.
        </p>
      )}
      {signInReady && !configured && (
        <p className={hint}>
          DARKROOM_SECRET is not set on this deployment, so a sign-in would have
          nothing to sign the studio&apos;s cookie with.
        </p>
      )}
      {ready && !storage && (
        <p className={hint}>
          SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set, so writing works
          but photographs have nowhere to go.
        </p>
      )}
      {ready && !notion && (
        <p className={hint}>
          NOTION_API_KEY is not set, so photographs would upload but essays and
          posts have nowhere to save.
        </p>
      )}
    </>
  );
}
