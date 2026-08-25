// app/components/Reveal.tsx
// Sections rise into place the first time they are reached, and then stay put
// — a page that re-animates on every scroll past is a page you cannot read.
//
// The hidden state is gated on a class on <html>, so if the JavaScript never
// runs the content is simply visible rather than permanently invisible. That
// class is set by REVEAL_INIT_SCRIPT before first paint — setting it here
// instead would let a frame through with everything visible, and the sections
// would blink out and back in. This component only does the observing.
"use client";

import { useEffect } from "react";

/** Runs in <head>, before anything is painted. */
export const REVEAL_INIT_SCRIPT = `
try {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    document.documentElement.classList.add('js-reveal');
} catch (e) {}
`;

export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!nodes.length) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || typeof IntersectionObserver === "undefined") {
      // Nothing will be observing, so take the hiding rule back off entirely.
      root.classList.remove("js-reveal");
      nodes.forEach((n) => n.classList.add("is-revealed"));
      return;
    }

    const observe = (node: HTMLElement) => {
      if (node.classList.contains("is-revealed")) return;
      io.observe(node);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      },
      // Fires a little before the edge, so a section is settled by the time
      // it is properly in view rather than animating under the reader's eye.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );

    nodes.forEach(observe);

    // The analyst/capture switch swaps whole sections in after this effect has
    // already run. Without watching for them, a section mounted later keeps
    // the hiding rule and never gets an observer to take it off — the whole
    // photography section stayed at opacity 0, permanently.
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        for (const added of record.addedNodes) {
          if (!(added instanceof HTMLElement)) continue;
          if (added.hasAttribute("data-reveal")) observe(added);
          added.querySelectorAll<HTMLElement>("[data-reveal]").forEach(observe);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
