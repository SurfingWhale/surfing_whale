// app/studio/Studio.tsx
// One door, five rooms. Every room shares one Google sign-in, one cookie and
// one shell — two ways in for one person is two ways in to lose.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Editor as DarkroomEditor } from "@/app/darkroom/Composer";
import { SignIn } from "./SignIn";
import { signOutOfFirebase } from "./firebase";
import { Writer } from "./Writer";
import { Notes } from "./Notes";
import { Access } from "./Access";
import { Archive } from "./Archive";
import { ROOMS, ROOM_ORDER, type Room } from "./ui";

// Rooms that hold work in progress — a half-written post, an essay being
// arranged, a batch still uploading — stay mounted once opened, so stepping
// out to approve a note does not throw the work away. Notes and Access hold
// nothing of the owner's, so they load fresh each time they are opened.
const KEPT: Room[] = ["write", "darkroom", "archive"];

export function Studio({ start = "write" }: { start?: Room }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [notion, setNotion] = useState(true);
  const [storage, setStorage] = useState(true);
  const [room, setRoom] = useState<Room>(start);
  const [opened, setOpened] = useState<Room[]>([start]);

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
    await signOutOfFirebase().catch(() => {});
    setUnlocked(false);
  };

  const go = (r: Room) => {
    setRoom(r);
    setOpened((o) => (o.includes(r) ? o : [...o, r]));
  };

  if (unlocked === null) {
    return (
      <Door>
        <p className="text-[13px] leading-[2] text-fg-muted">Checking…</p>
      </Door>
    );
  }
  if (!unlocked) {
    return (
      <Door>
        <SignIn configured={ready} notion={notion} storage={storage} onIn={() => setUnlocked(true)} />
      </Door>
    );
  }

  const kept = (r: Room) => KEPT.includes(r) && opened.includes(r);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 bg-bg border-b border-border">
        <div className="mx-auto max-w-[1080px] px-6 h-12 flex items-center justify-between gap-4">
          <h1 className="text-[13px] leading-[1.5] font-medium text-fg">Studio</h1>
          <div className="flex items-center -mr-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              className="h-11 px-3 inline-flex items-center rounded-lg text-[13px] text-fg-body hover:text-fg transition-colors duration-200"
            >
              View site <span aria-hidden="true" className="ml-1">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="h-11 px-3 inline-flex items-center rounded-lg text-[13px] text-fg-body hover:text-fg transition-colors duration-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* No bottom padding here: the editors end on their action bar, which
          has to sit on the bottom edge once the page is scrolled to its end.
          The rooms without one pad themselves. */}
      <div className="mx-auto max-w-[1080px] px-6 pt-4">
        {/* One row that scrolls sideways on a narrow phone rather than
            wrapping, so the rooms stay in one place on every screen. */}
        <nav aria-label="Rooms" className="-mx-6 px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex sm:inline-flex min-w-max sm:min-w-0 gap-0.5 sm:gap-1 p-1 rounded-xl bg-bg-muted">
            {ROOM_ORDER.map((r) => (
              <li key={r} className="flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => go(r)}
                  aria-current={room === r ? "page" : undefined}
                  className={`w-full h-11 lg:h-9 px-2 sm:px-4 rounded-lg text-[13px] whitespace-nowrap transition-colors duration-200 ${
                    room === r
                      ? "bg-bg text-fg font-medium shadow-[0_0_0_1px_var(--border),0_1px_2px_rgba(0,0,0,0.04)]"
                      : "text-fg-body hover:text-fg"
                  }`}
                >
                  {ROOMS[r].label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8">
          {kept("write") && (
            <div hidden={room !== "write"}>
              <Writer />
            </div>
          )}
          {kept("darkroom") && (
            <div hidden={room !== "darkroom"}>
              <DarkroomEditor />
            </div>
          )}
          {kept("archive") && (
            <div hidden={room !== "archive"} className="pb-16">
              <Archive />
            </div>
          )}
          {room === "notes" && (
            <div className="pb-16">
              <Notes />
            </div>
          )}
          {room === "access" && (
            <div className="pb-16">
              <Access />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * The narrow column the sign-in sits in, before there is a studio to show.
 *
 * It carries a way home. Checking and signed out were dead ends: on a phone
 * opened from the home screen there is no browser chrome to fall back on, so
 * someone who triggered the entry gesture by accident was stuck on a sign-in
 * screen with nothing to press. Same tab, not a new one — there is no work
 * here to protect.
 */
function Door({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 bg-bg border-b border-border">
        <div className="mx-auto max-w-[1080px] px-6 h-12 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group -ml-3 h-11 px-3 inline-flex items-center gap-2 rounded-lg text-[13px] font-medium tracking-[-0.02em] whitespace-nowrap text-fg-body hover:text-fg transition-colors duration-200"
          >
            <svg
              viewBox="0 0 12 12"
              aria-hidden="true"
              className="w-3 h-3 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round] transition-transform duration-200 group-hover:-translate-x-0.5"
            >
              <path d="M10 6H2M5.5 2.5L2 6l3.5 3.5" />
            </svg>
            Surfing Whale
          </Link>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-label">
            Studio
          </span>
        </div>
      </header>
      <div className="container mx-auto px-6 py-12 max-w-[420px]">
        <h1 className="sr-only">Studio</h1>
        {children}
      </div>
    </main>
  );
}
