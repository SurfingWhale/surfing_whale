// app/studio/Studio.tsx
// One door, two rooms. Writing and the darkroom share a password, a cookie
// and a shell — two passwords for one person is two passwords to lose.
"use client";

import { useEffect, useState } from "react";
import { Editor as DarkroomEditor, Lock } from "@/app/darkroom/Composer";
import { Writer } from "./Writer";
import { Notes } from "./Notes";
import { Access } from "./Access";

type Room = "write" | "darkroom" | "notes" | "access";

const LABEL: Record<Room, string> = {
  write: "Write",
  darkroom: "Darkroom",
  notes: "Notes",
  access: "Access",
};

export function Studio({ start = "write" }: { start?: Room }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [notion, setNotion] = useState(true);
  const [room, setRoom] = useState<Room>(start);

  useEffect(() => {
    fetch("/api/darkroom/session")
      .then((r) => r.json())
      .then((d) => {
        setUnlocked(Boolean(d.unlocked));
        setReady(Boolean(d.configured));
        setNotion(Boolean(d.notion));
      })
      .catch(() => setUnlocked(false));
  }, []);

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
        <Lock configured={ready} notion={notion} onIn={() => setUnlocked(true)} />
      </Shell>
    );
  }

  return (
    <Shell wide>
      <div className="flex gap-5 text-[13px] mb-8">
        {(["write", "darkroom", "notes", "access"] as Room[]).map((r) => (
          <button
            key={r}
            onClick={() => setRoom(r)}
            aria-current={room === r ? "page" : undefined}
            className={
              room === r
                ? "font-medium text-fg underline decoration-border-strong underline-offset-[3px]"
                : "text-fg-body hover:text-fg transition-colors duration-300"
            }
          >
            {LABEL[r]}
          </button>
        ))}
      </div>
      {room === "write" && <Writer />}
      {room === "darkroom" && <DarkroomEditor />}
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
