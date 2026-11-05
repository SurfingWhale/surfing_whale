"use client";
// app/components/useLang.ts
//
// Which language the interface is in, as an external store rather than a
// context provider.
//
// A provider would have to wrap the whole tree in layout.tsx, which makes
// every page a client boundary's child for the sake of a dozen labels. The
// chrome that needs this — the share row, the footer, the reading nav — is
// already client, and they are separate islands. useSyncExternalStore lets
// each one subscribe on its own.
//
// It is also the right primitive for the hydration problem. The server has no
// localStorage, so getServerSnapshot returns "en" and the first client render
// matches it exactly; React then re-renders with the stored value. Reading
// localStorage during render instead would be a mismatch, which is the fault
// ReelPlayer's comment describes for prefers-reduced-motion.
import { useSyncExternalStore } from "react";
import { UI, type Lang } from "@/app/lib/ui-text";

const KEY = "sw-lang";
const listeners = new Set<() => void>();

// Cached, because getSnapshot must return a stable value — reading
// localStorage on every call returns a new string and React loops.
let current: Lang | null = null;

function read(): Lang {
  try {
    return window.localStorage.getItem(KEY) === "id" ? "id" : "en";
  } catch {
    // Private windows and blocked site data throw rather than return null.
    return "en";
  }
}

function getSnapshot(): Lang {
  if (current === null) current = read();
  return current;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  // Another tab switching language should switch this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) { current = read(); fn(); }
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}

export function setLang(next: Lang) {
  current = next;
  try { window.localStorage.setItem(KEY, next); } catch { /* nothing to do */ }
  document.documentElement.setAttribute("data-ui-lang", next);
  listeners.forEach((fn) => fn());
}

/** The current interface language. "en" on the server and on first paint. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, () => "en");
}

/** The strings for the current language. */
export function useUI() {
  return UI[useLang()];
}
