"use client";
// app/components/LangToggle.tsx
//
// Switches the interface between English and Indonesian. Two languages, so it
// is a toggle rather than a menu: a select for two options is a menu you have
// to open to find out it had nothing in it.
//
// It says what it will switch TO, not what it is on now. A control labelled
// with its current state is the oldest ambiguity in interface design, and the
// aria-label removes the rest of it.
//
// 44x44, per WCAG 2.5.8 and verify-tap-targets, which runs on every page this
// appears on.
import { LANG_NAME, LANG_SHORT, UI } from "@/app/lib/ui-text";
import { setLang, useLang } from "./useLang";

export function LangToggle() {
  const lang = useLang();
  const next = lang === "en" ? "id" : "en";

  return (
    <button
      type="button"
      data-lang-toggle
      onClick={() => setLang(next)}
      aria-label={UI[lang].switchTo(LANG_NAME[next])}
      title={UI[lang].switchTo(LANG_NAME[next])}
      className="grid place-items-center w-11 h-11 rounded-full
                 text-[11px] font-mono tracking-[0.1em] text-fg-muted
                 hover:text-fg transition-colors duration-200
                 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {LANG_SHORT[next]}
    </button>
  );
}
