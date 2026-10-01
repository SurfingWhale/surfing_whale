// app/studio/Studio.tsx
// One door, five rooms. Every room shares one Google sign-in, one cookie and
// one shell — two ways in for one person is two ways in to lose.
"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { Editor as DarkroomEditor } from "@/app/darkroom/Composer";
import { SignIn } from "./SignIn";
import { signOutOfGoogle } from "./firebase";
import { Writer } from "./Writer";
import { Notes } from "./Notes";
import { Access } from "./Access";
import { Archive } from "./Archive";

type Room = "write" | "darkroom" | "archive" | "notes" | "access";

// What each room is for, in one line. A panel of five unexplained tabs makes
// its owner guess; these cost nothing and remove the guessing.
const NOTE: Record<Room, string> = {
  write: "Posts for the writing page.",
  darkroom: "Photo essays — words and frames together.",
  archive: "Loose frames, no essay attached.",
  notes: "Notes left by visitors. Nothing shows on the site until you approve it.",
  access: "People who asked to read the CV and the project write-ups.",
};

const LABEL: Record<Room, string> = {
  write: "Write",
  darkroom: "Darkroom",
  archive: "Archive",
  notes: "Notes",
  access: "Access",
};

export function Studio({ start = "write" }: { start?: Room }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [notion, setNotion] = useState(true);
  const [storage, setStorage] = useState(true);
  const [room, setRoom] = useState<Room>(start);

  useEffect(() => {
    fetch("/api/darkroom/session")
      .then((r) => r.json())
      .then((d) => {
        setUnlocked(Boolean(d.unlocked));
        setReady(Boolean(d.configured));
        setNotion(Boolean(d.notion));
        setStorage(Boolean(d.storage));
      })
      .catch(() => setUnlocked(false));
  }, []);

  // Both halves: the studio's cookie, and the Google session on this device —
  // otherwise the door would open itself again on the next visit.
  const signOut = async () => {
    await fetch("/api/darkroom/session", { method: "DELETE" }).catch(() => {});
    await signOutOfGoogle().catch(() => {});
    setUnlocked(false);
  };

  if (unlocked === null) {
    return (
      <Shell>
        <p className="text-[13px] leading-[2] text-fg-muted">Checking…</p>
      </Shell>
    );
  }
  if (!unlocked) {
    return (
      <Shell>
        <SignIn configured={ready} notion={notion} storage={storage} onIn={() => setUnlocked(true)} />
      </Shell>
    );
  }

  return (
    <Shell wide onSignOut={signOut}>
      {/* A segmented row rather than five underlined words. On a phone it
          scrolls sideways instead of wrapping into two ragged lines. */}
      <div
        role="tablist"
        aria-label="Studio rooms"
        className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {(["write", "darkroom", "archive", "notes", "access"] as Room[]).map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={room === r}
            onClick={() => setRoom(r)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2 ${
                room === r
                  ? "bg-fg text-bg font-medium"
                  : "text-fg-body hover:text-fg hover:bg-bg-muted"
              }`}
          >
            {LABEL[r]}
          </button>
        ))}
      </div>

      <p className="text-[12px] leading-[1.7] text-fg-muted mt-3 mb-7">
        {NOTE[room]}
      </p>

      {room === "write" && <Writer />}
      {room === "darkroom" && <DarkroomEditor />}
      {room === "archive" && <Archive />}
      {room === "notes" && <Notes />}
      {room === "access" && <Access />}
    </Shell>
  );
}

function Shell({
  children,
  wide,
  onSignOut,
}: {
  children: React.ReactNode;
  wide?: boolean;
  /** Only once there is a session to end. */
  onSignOut?: () => void;
}) {
  return (
    <main className="min-h-screen bg-bg text-fg">
      {/* The way out.
       *
       * There was none. Every state of this panel — checking, signed out,
       * signed in — was a dead end: the only control was "Sign out", which
       * ends the session rather than returning to the site, and on a phone
       * there is no browser chrome to fall back on. Someone who triggers the
       * entry gesture by accident was stuck on a sign-in screen.
       *
       * The header carries the site's name as a link home, in every state,
       * and reads as the same bar the rest of the site has. */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 max-w-[1000px] flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[-0.02em] whitespace-nowrap text-fg-body hover:text-fg transition-colors duration-200"
          >
            <svg
              viewBox="0 0 12 12"
              aria-hidden="true"
              className="w-3 h-3 stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round] transition-transform duration-200 group-hover:-translate-x-0.5"
            >
              <path d="M10 6H2M5.5 2.5L2 6l3.5 3.5" />
            </svg>
            Surfing Whale
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-label">
              Studio
            </span>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="text-[13px] text-fg-muted hover:text-fg transition-colors duration-200"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        className={`container mx-auto px-6 py-10 ${
          wide ? "max-w-[1000px]" : "max-w-[420px]"
        }`}
      >
        {/* The page's h1 is the room, not the word "Studio" — that is in the
            bar above and is the same on every screen. */}
        <h1 className="sr-only">Studio</h1>
        {children}
      </div>
    </main>
  );
}
