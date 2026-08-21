// app/components/ThemeToggle.tsx
// Three states, not two: unset follows the system, and an explicit choice
// overrides it in either direction. The choice is written to <html> so the
// CSS token blocks pick it up, and remembered across visits.
"use client";

import { useEffect, useState } from "react";

type Choice = "light" | "dark";

export const THEME_KEY = "sw-theme";

/** Runs before paint so a stored dark choice never flashes light first. */
export const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem('${THEME_KEY}');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
`;

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice | null>(null);

  useEffect(() => {
    const stored = document.documentElement.dataset.theme;
    if (stored === "dark" || stored === "light") setChoice(stored);
  }, []);

  const isDark = choice ? choice === "dark" : undefined;

  const apply = (next: Choice) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — the choice just does not persist */
    }
    setChoice(next);
  };

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const current = choice ?? (systemPrefersDark() ? "dark" : "light");
    const next: Choice = current === "dark" ? "light" : "dark";

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!doc.startViewTransition || reduced) {
      apply(next);
      return;
    }

    // Anchor the wavefront on the button so the change spreads from where
    // the visitor clicked.
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const root = document.documentElement.style;
    root.setProperty("--wave-x", `${x}px`);
    root.setProperty("--wave-y", `${y}px`);
    root.setProperty("--wave-r", `${radius}px`);

    doc.startViewTransition(() => apply(next));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      // Until the stored choice is read, say nothing rather than something wrong.
      aria-label={
        isDark === undefined
          ? "Toggle theme"
          : isDark
            ? "Switch to light theme"
            : "Switch to dark theme"
      }
      aria-pressed={isDark}
      className="grid place-items-center w-10 h-10 rounded-full text-fg-muted hover:text-fg active:scale-95 transition-[color,transform] duration-150"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="hidden dark:block"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="block dark:hidden"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
