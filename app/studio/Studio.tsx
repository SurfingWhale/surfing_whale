// app/studio/Studio.tsx
// One door, five rooms. Every room shares one Google sign-in, one cookie and
// one shell — two ways in for one person is two ways in to lose.
"use client";

import { useEffect, useState } from "react";
import { Editor as DarkroomEditor } from "@/app/darkroom/Composer";
import { SignIn } from "./SignIn";
import { signOutOfGoogle } from "./firebase";
import { Writer } from "./Writer";
import { Notes } from "./Notes";
import { Access } from "./Access";
import { Archive } from "./Archive";

type Room = "write" | "darkroom" | "archive" | "notes" | "access";

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
    <Shell wide>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] mb-8">
        {(["write", "darkroom", "archive", "notes", "access"] as Room[]).map((r) => (
          <button
            key={r}
            onClick={() => setRoom(r)}
            aria-current={room === r ? "page" : undefined}
            className={
              room === r
                ? "py-1 font-medium text-fg underline decoration-border-strong underline-offset-[3px]"
                : "py-1 text-fg-body hover:text-fg transition-colors duration-300"
            }
          >
            {LABEL[r]}
          </button>
        ))}
        <button
          onClick={signOut}
          className="ml-auto py-1 text-fg-muted hover:text-fg transition-colors duration-300"
        >
          Sign out
        </button>
      </div>
      {room === "write" && <Writer />}
      {room === "darkroom" && <DarkroomEditor />}
      {room === "archive" && <Archive />}
      {room === "notes" && <Notes />}
      {room === "access" && <Access />}
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className={`container mx-auto px-6 py-16 ${wide ? "max-w-[900px]" : "max-w-[420px]"}`}>
        <h1 className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-8">
          Studio
        </h1>
        {children}
      </div>
    </main>
  );
}
