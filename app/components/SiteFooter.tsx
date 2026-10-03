"use client";
// app/components/SiteFooter.tsx
// The footer is under the page, not after it. The page is a sheet that
// scrolls up off it (.page-sheet in globals.css), so nothing of the footer
// shows until the last section has gone by — it is found at the very bottom,
// not announced on the way there.
//
// That only works while the footer fits the screen: a footer pinned behind
// the page and taller than the window would have its top cut off for good.
// When it does not fit (a short phone held sideways), it drops back into the
// page and scrolls like any other block.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Item = { label: string; href: string; external?: boolean };

const WORK: Item[] = [
  { label: "Finance dashboard", href: "/work/finance-dashboard" },
  { label: "Padel", href: "/work/padel" },
  { label: "Tomoro", href: "/work/coffee-access" },
  { label: "Crime LA", href: "/work/crime-la" },
  { label: "TrackerDoc", href: "/work/tracker-doc" },
];

const ABOUT: Item[] = [
  { label: "About", href: "#CV" },
  { label: "Activity", href: "#activity" },
  { label: "Contact", href: "#contact" },
  { label: "Kaggle", href: "https://www.kaggle.com/muhammadfauzy43/code", external: true },
];

function Column({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <h2 className="foot-head">{title}</h2>
      <ul className="foot-list">
        {items.map((i) => (
          <li key={i.href}>
            {i.external ? (
              <a href={i.href} target="_blank" rel="noopener noreferrer">
                {i.label} ↗
              </a>
            ) : i.href.startsWith("/") ? (
              <Link href={i.href}>{i.label}</Link>
            ) : (
              <a href={i.href}>{i.label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A whale's tail, for the wordmark. */
function Fluke({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M20 40c.8-6 1.6-11 2.2-15.5C17 22 8 17.5 0 6c6 4 13.5 5.4 20.5 5.6 2.6.1 3.5 2.2 3.5 4.6 0-2.4.9-4.5 3.5-4.6C34.5 11.4 42 10 48 6c-8 11.5-17 16-22.2 18.5.6 4.5 1.4 9.5 2.2 15.5z"
      />
    </svg>
  );
}

export function SiteFooter({ hasWriting, hasDarkroom }: { hasWriting: boolean; hasDarkroom: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [art, setArt] = useState(false);

  const ARCHIVE: Item[] = [
    { label: "Photographs", href: "#photography" },
    ...(hasDarkroom ? [{ label: "Darkroom", href: "/photo" }] : []),
    ...(hasWriting ? [{ label: "Writing", href: "/writing" }] : []),
    { label: "Testament", href: "/testament" },
  ];

  useEffect(() => {
    const foot = ref.current;
    const sheet = document.querySelector<HTMLElement>(".page-sheet");
    if (!foot || !sheet) return;
    let raf = 0;

    // Pinned only while it fits. Measured on the content, not the box: the
    // box is the window's height by design and would always "fit".
    const fit = () => {
      const inner = foot.querySelector<HTMLElement>(".foot-inner");
      const need = (inner?.offsetHeight ?? 0) + 140; // the sea needs a strip
      foot.toggleAttribute("data-static", need > window.innerHeight);
    };

    // 0 while the page covers it, 1 when it is all in view. The content
    // rides up a little behind the lifting sheet, which is the slide.
    const update = () => {
      raf = 0;
      const bottom = sheet.getBoundingClientRect().bottom;
      const h = foot.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, (window.innerHeight - bottom) / h));
      foot.style.setProperty("--reveal", p.toFixed(3));
      // Once the footer has most of the screen, the header and the note card
      // are covering a page that has scrolled away; they step aside.
      document.documentElement.toggleAttribute("data-foot", p > 0.55);
      // The engraving is 270 KB; fetch it when the end of the page is near,
      // not for every visitor who reads the hero and leaves.
      if (!art && bottom < window.innerHeight * 2.5) setArt(true);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    fit();
    update();
    const ro = new ResizeObserver(() => {
      fit();
      onScroll();
    });
    ro.observe(foot);
    ro.observe(sheet);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.documentElement.removeAttribute("data-foot");
    };
  }, [art]);

  const year = new Date().getFullYear();

  return (
    <footer ref={ref} className="site-footer" data-spot>
      <div className="foot-inner frame">
        <div className="foot-grid">
          <div className="foot-brand">
            <p className="foot-mark">
              <Fluke className="w-9 h-auto shrink-0" />
              <span>Surfing Whale</span>
            </p>
            <p className="foot-tagline">
              A place where I can leave traces of the things I chose to care about.
            </p>
            <ul className="foot-facts">
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                </svg>
                Jakarta, Indonesia
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M3 5h18v14H3V5Zm2 2v.4l7 4.6 7-4.6V7H5Zm14 2.8-7 4.6-7-4.6V17h14V9.8Z" />
                </svg>
                <a href="#contact">Write to me</a>
              </li>
            </ul>
          </div>

          <Column title="Work" items={WORK} />
          <Column title="Archive" items={ARCHIVE} />
          <Column title="About" items={ABOUT} />

          <div className="foot-hello">
            <h2 className="foot-head">Say hello</h2>
            <p className="foot-note">
              Leave a note on the wall for whoever reads this next.
            </p>
            <a href="#guest-notes" className="foot-cta">
              <span>Leave a note</span>
              <span aria-hidden="true" className="foot-cta-arrow">→</span>
            </a>
          </div>
        </div>

        <div className="foot-base">
          <span>© {year} Muhammad Fauzy</span>
          <span aria-hidden="true" className="foot-sep">|</span>
          <a href="#">Back to top ↑</a>
        </div>
      </div>

      <div className="foot-sea" aria-hidden="true">
        {art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/footer-sea.svg" alt="" decoding="async" />
        )}
      </div>
    </footer>
  );
}
