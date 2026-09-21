// app/components/ProfileMode.tsx
// Shared role state. HeroSection and ProfileContent both read this so the
// avatar, the tagline, and the body sections all switch together.
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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
