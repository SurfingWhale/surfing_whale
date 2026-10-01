// app/components/AdminEntry.tsx
//
// Two halves of one problem: getting into the studio, and knowing you are in
// it.
//
// Getting in. When the session lapses there is nothing on the page that leads
// anywhere — the nav link is gone by design, so the only way back is
// remembering the URL. That is the sort of thing that reads as a broken site
// rather than a logged-out one. So the brand wordmark takes a secret gesture:
// five taps inside two seconds, or a press held for a second. It is the old
// tap-the-version-number trick, and it is right here because it needs no
// keyboard — this site is mostly read on a phone.
//
// The gesture is deliberately absent from the accessibility tree and from the
// visible interface. It is not a control anyone is meant to discover; it
// advertises nothing to a visitor, and a visitor who stumbles into it lands on
// a password prompt.
//
// Knowing you are in it. The nav's Studio link used to be decided on the
// server and baked into the HTML. That is correct but fragile: anything that
// holds on to a copy of the document — a browser, a standalone PWA shell, a
// proxy — shows a page that has made up its mind about whether you are an
// admin. Asking the API after hydration cannot go stale that way, and the
// endpoint it asks is explicitly no-store.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const TAPS = 5;
const WINDOW_MS = 2000;
const HOLD_MS = 1000;

export function AdminEntry({ children }: { children: React.ReactNode }) {
  const taps = useRef<number[]>([]);
  const held = useRef<number | undefined>(undefined);

  const go = useCallback(() => {
    taps.current = [];
    window.location.href = "/studio";
  }, []);

  const tap = () => {
    const now = Date.now();
    taps.current = [...taps.current, now].filter((t) => now - t < WINDOW_MS);
    if (taps.current.length >= TAPS) go();
  };

  return (
    <span
      onClick={tap}
      onPointerDown={() => {
        held.current = window.setTimeout(go, HOLD_MS);
      }}
      onPointerUp={() => window.clearTimeout(held.current)}
      onPointerLeave={() => window.clearTimeout(held.current)}
      // Not a button and not labelled: a visitor is not being offered this,
      // and a screen reader should read the site's name, not a control.
      className="select-none cursor-default"
    >
      {children}
    </span>
  );
}

export function AdminLink({ className = "" }: { className?: string }) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let alive = true;
    // cache: "no-store" on top of the route's own header, because a service
    // worker added later would otherwise be free to answer this itself.
    fetch("/api/darkroom/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setUnlocked(Boolean(d.unlocked)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!unlocked) return null;

  return (
    <Link href="/studio" className={className}>
      Studio
    </Link>
  );
}
