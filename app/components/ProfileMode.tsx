// app/components/ProfileMode.tsx
// Shared role state. HeroSection and ProfileContent both read this so the
// avatar, the tagline, and the body sections all switch together.
"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type Mode = "analyst" | "capture";

export const MODE_LABEL: Record<Mode, string> = {
  analyst: "Data Analyst",
  capture: "Joie de Vivre",
};

/**
 * The same label, as a reader sees it rather than as a screen reader hears it.
 *
 * MODE_LABEL had only ever been passed to an aria-label, so "Data Analyst"
 * appeared nowhere in the visible text of the site — measured, not guessed:
 * innerText on the whole home page returned it zero times. A screen reader
 * user was told what this is; everyone else got two unlabelled photographs
 * and no way to know what pressing one would do.
 *
 * The accounting half is here because it is the half nobody else has. PRD v2
 * §4.1 calls the pairing the thing that makes the positioning credible, and
 * the About section already opens "Accounting first, then data."
 */
export const MODE_KICKER: Record<Mode, string> = {
  analyst: "Data Analyst · Accounting background",
  capture: "Joie de Vivre",
};

const ProfileModeContext = createContext<{
  mode: Mode;
  setMode: (m: Mode) => void;
} | null>(null);

export function ProfileModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("analyst");
  const current = useRef(mode);
  current.current = mode;

  // The header's links — Projects, Activity, About — point at sections that
  // only exist in the Data half. In Photographs they were dead: the click
  // went nowhere and nothing said why. A link to a section that is not on
  // the page now switches to the half that has it, then scrolls there.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href") ?? "";
      const m = href.match(/^\/?#(.+)$/);
      if (!m || document.getElementById(m[1])) return;
      // The footer links to the photographs too, which only the other half
      // has. Any other missing section belongs to the Data half.
      const next: Mode | null =
        current.current === "capture" ? "analyst" : m[1] === "photography" ? "capture" : null;
      if (!next) return;
      e.preventDefault();
      setMode(next);
      // The section mounts on the next render; try for a few frames.
      let tries = 0;
      const go = () => {
        const el = document.getElementById(m[1]);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (tries++ < 20) requestAnimationFrame(go);
      };
      requestAnimationFrame(go);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <ProfileModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ProfileModeContext.Provider>
  );
}

export function useProfileMode() {
  const ctx = useContext(ProfileModeContext);
  if (!ctx) throw new Error("useProfileMode must be used within ProfileModeProvider");
  return ctx;
}
