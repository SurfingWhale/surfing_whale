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
