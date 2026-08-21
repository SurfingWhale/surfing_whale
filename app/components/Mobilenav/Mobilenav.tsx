// app/components/Mobilenav/Mobilenav.tsx
// On touch the nav is a button that turns into a panel: the trigger takes on
// the glass as it opens, the sheet grows out of that same corner, and the
// links arrive one after another rather than all at once. Same material as
// the desktop pill (.glass in globals.css).
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NavLink } from "../GlassNav";

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Escape closes it, and so does a tap anywhere else — a menu that can only
  // be dismissed by the button that opened it is a trap on a phone.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      // The panel is portalled to <body>, so it is no longer inside rootRef —
      // both have to be checked or tapping the menu would close it.
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const line = "block w-5 h-[1.5px] bg-fg transition-all duration-300";

  return (
    <div ref={rootRef} className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className={`relative grid place-items-center w-10 h-10 rounded-full gap-[5px]
          transition-[background-color,box-shadow] duration-300 active:scale-95
          ${open ? "glass" : ""}`}
      >
        <span className="relative z-10 flex flex-col gap-[5px]">
          <span className={`${line} ${open ? "rotate-45 translate-y-[6.5px]" : ""}`} />
          <span className={`${line} ${open ? "opacity-0" : ""}`} />
          <span className={`${line} ${open ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
        </span>
      </button>

      {/* Portalled to <body> on purpose. The header sets its own
          backdrop-blur, which makes it a backdrop root: a backdrop-filter on
          a descendant then has nothing of the page left to sample, so the
          sheet came out unblurred and the copy underneath read straight
          through it. Outside the header it blurs the page as intended.
          Kept mounted either way so it can animate out as well as in. */}
      {mounted &&
        createPortal(
        <div
          ref={panelRef}
          // Hidden from the tab order and from screen readers while closed —
          // an invisible menu that still takes focus is worse than no menu.
          inert={!open}
          className={`md:hidden fixed top-[64px] right-4 z-[60] w-[min(15rem,calc(100vw-2rem))]
            rounded-[22px] p-2 glass glass-panel origin-top-right
            transition-[opacity,transform] duration-[380ms]
            ease-[cubic-bezier(0.34,1.24,0.64,1)] motion-reduce:transition-none
            ${open
              ? "opacity-100 scale-100 translate-y-0"
              : "pointer-events-none opacity-0 scale-[0.86] -translate-y-2"}`}
        >
          <div className="relative z-10 flex flex-col">
            {links.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  // Staggered on the way in, simultaneous on the way out — a
                  // menu should close as fast as the finger that dismissed it.
                  transitionDelay: open ? `${60 + i * 26}ms` : "0ms",
                }}
                className={`px-3 py-2 rounded-xl text-[13px] text-fg-secondary
                  hover:text-fg hover:bg-fg/5 active:bg-fg/10
                  transition-[opacity,transform,color,background-color] duration-300
                  motion-reduce:transition-none
                  ${open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>,
          document.body
        )}
    </div>
  );
}
