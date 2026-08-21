// app/components/GlassNav.tsx
// The desktop nav carries one piece of liquid glass: a pill that slides to
// whatever you are pointing at and settles back onto the section you are
// actually reading. The material is in globals.css (.glass); this file only
// decides where the pill goes and how it gets there.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface NavLink {
  label: string;
  href: string;
}

export function GlassNav({ links }: { links: NavLink[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  const target = hover ?? active;

  // Scroll spy. The sections are re-queried on every pass rather than
  // observed once, because the analyst/capture switch mounts and unmounts
  // half of them — a stored NodeList would go stale the first time it flips.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let best = 0;
      links.forEach((link, i) => {
        if (link.href === "#") return;
        const el = document.querySelector(link.href);
        if (el && el.getBoundingClientRect().top <= line) best = i;
      });
      setActive(best);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [links]);

  // Where the pill should be. offsetLeft is measured against the list, which
  // is positioned, so the two agree without a second getBoundingClientRect.
  const place = useCallback(() => {
    const el = itemRefs.current[target];
    if (!el) return;
    setPill({ x: el.offsetLeft, w: el.offsetWidth });
  }, [target]);

  useEffect(() => {
    place();
  }, [place]);

  // Item widths move when the webfont swaps in and when the window resizes.
  useEffect(() => {
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place).catch(() => {});
    return () => window.removeEventListener("resize", place);
  }, [place]);

  // Park the highlight under the pointer. Written straight to the node: this
  // fires on every mousemove and has no business going through React state.
  const trackLight = (e: React.MouseEvent<HTMLDivElement>) => {
    const node = pillRef.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    if (!r.width) return;
    const mx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    node.style.setProperty("--mx", mx.toFixed(3));
  };

  return (
    <div
      ref={listRef}
      onMouseMove={trackLight}
      onMouseLeave={() => setHover(null)}
      className="relative hidden md:flex items-center"
    >
      {pill && (
        <span
          ref={pillRef}
          aria-hidden="true"
          style={{ transform: `translate3d(${pill.x}px, 0, 0)`, width: pill.w }}
          // The slight overshoot is what makes it read as one object moving
          // rather than a rectangle being redrawn in a new place.
          className="glass absolute left-0 top-0 h-full rounded-full z-0
            transition-[transform,width] duration-[420ms]
            ease-[cubic-bezier(0.34,1.28,0.64,1)]
            motion-reduce:transition-none"
        />
      )}

      {links.map((link, i) => (
        <a
          key={link.href}
          href={link.href}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          onMouseEnter={() => setHover(i)}
          aria-current={active === i ? "page" : undefined}
          className={`relative z-10 px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors duration-300 ${
            i === target ? "text-fg" : "text-fg-secondary hover:text-fg"
          }`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
