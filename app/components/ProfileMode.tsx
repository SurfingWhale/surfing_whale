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

export function RoleToggle() {
  const { mode, setMode } = useProfileMode();

  return (
    <div
      className="inline-flex rounded-full border border-border bg-bg-muted p-1"
      role="group"
      aria-label="Choose what to view"
    >
      {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-pressed={mode === m}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            mode === m
              ? "bg-fg text-bg"
              : "text-fg-secondary hover:text-fg"
          }`}
        >
          {MODE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}
