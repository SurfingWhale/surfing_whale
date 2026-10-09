"use client";
// app/components/ShareRow.tsx
//
// The end of a written-up page. Five ways to pass it on, and one line saying
// where an argument about it can go.
//
// It is at the END, which is the only place the brand book allows it: the
// Refusals page turns down "a call to action on the first screen" because a
// page that opens by asking for something is asking before it has shown
// anything. Someone who has read to here has seen the whole thing.
//
// THE URL COMES FROM THE SERVER, not from window.location. Reading the address
// bar would have shared whatever host the page happened to be loaded from —
// a Vercel preview deployment, a branch URL, localhost during a demo — and
// those links either die or ask a stranger to sign in. `url` is built from
// SITE, the same constant the canonical tag and the sitemap use.
//
// No third-party glyphs. The site has one label alphabet and the brand book
// refuses a second; a row of brand marks in their own colours would also be
// the only place on the page belonging to somebody else's palette. The
// destinations are named in words, with the site's own arrow for the ones
// that leave it.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { copyLink, instagramSheet, openSheet, shareLinks } from "@/app/lib/share";

// "insta": copied on a desktop for pasting into Instagram, which takes no
// link from the web.
type Copy = "idle" | "done" | "insta" | "manual";

const linkish =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] " +
  "hover:decoration-[var(--accent-soft)] transition-colors duration-200";

// The same sentence on every page, and it carries the thing Fauzy is actually
// after: somewhere for a reply to land. Both destinations are real — the wall
// is public and the contact form reaches him — and the sentence says which is
// which, so nobody has to guess whether a note is a postcard or a letter.
const DEFAULT_NOTE = (
  <>
    Useful, wrong, or worth arguing about? There is a{" "}
    <Link href="/#guest-notes" className={linkish}>
      wall at the foot of the home page
    </Link>{" "}
    for anyone passing through, and a{" "}
    <Link href="/#contact" className={linkish}>
      way to write to me
    </Link>{" "}
    if it is meant for me rather than for them.
  </>
);

export function ShareRow({
  url,
  title,
  note,
}: {
  /** Absolute, from SITE — never window.location. */
  url: string;
  title: string;
  /** The line under the row. Defaults to the one every page carries. */
  note?: React.ReactNode;
}) {
  const [copy, setCopy] = useState<Copy>("idle");
  // navigator.share does not exist on most desktops, and rendering a button
  // that depends on it would differ between the server and the browser —
  // which is a hydration mismatch, not a feature test. It starts off and is
  // turned on after mount, so both renders agree.
  const [canShare, setCanShare] = useState(false);
  const fallback = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // When neither copy works, the address is left selected in the off-screen
  // field so it can be copied by hand (lib/share.ts).
  const onCopy = async (done: Copy = "done") => {
    setCopy((await copyLink(url, fallback.current)) ? done : "manual");
  };

  const onInstagram = () => {
    if (!instagramSheet(url, title)) onCopy("insta");
  };

  useEffect(() => {
    if (copy === "idle") return;
    const t = setTimeout(() => setCopy("idle"), copy === "done" ? 2400 : copy === "insta" ? 4000 : 8000);
    return () => clearTimeout(t);
  }, [copy]);

  const [whatsapp, linkedin] = shareLinks(url, title);

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 " +
    "text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-body " +
    "hover:text-fg hover:border-border-strong transition-colors duration-200";

  return (
    <section className="py-10 border-t border-border" aria-labelledby="share-head">
      <h2
        id="share-head"
        className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label"
      >
        Share
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onCopy()} className={chip}>
          <span aria-hidden="true" className="text-fg-muted">
            {/* Two offset squares: a copy mark, drawn rather than imported. */}
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor" />
              <path d="M4.5 10.5h6a1 1 0 0 0 1-1v-6" stroke="currentColor" fill="none" />
            </svg>
          </span>
          {copy === "done" ? "Copied" : copy === "manual" ? "Press ⌘C" : "Copy link"}
        </button>

        {canShare && (
          <button type="button" onClick={() => openSheet(url, title)} className={chip}>
            Share…
          </button>
        )}

        <Out link={whatsapp} className={chip} />

        <button type="button" onClick={onInstagram} className={chip}>
          {copy === "insta" ? "Copied — paste in IG" : "Instagram"}
        </button>

        <Out link={linkedin} className={chip} />
      </div>

      {/* Off screen but selectable: `hidden` and display:none cannot be
          selected, so the manual fallback would have had nothing to offer. */}
      <input
        ref={fallback}
        readOnly
        value={url}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px opacity-0"
      />

      {/* A button whose only feedback is its own label changing says nothing
          to a screen reader, because the label is not announced on change. */}
      <p aria-live="polite" className="sr-only">
        {copy === "done"
          ? "Link copied"
          : copy === "insta"
            ? "Link copied. Paste it into Instagram."
            : copy === "manual"
              ? "Press Control or Command C to copy"
              : ""}
      </p>

      <p className="mt-4 text-[12px] leading-[1.9] text-fg-body max-w-[52ch]">
        {note ?? DEFAULT_NOTE}
      </p>
    </section>
  );
}

function Out({ link, className }: { link: { label: string; href: string }; className: string }) {
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
      <span aria-hidden="true" className="text-fg-muted">
        ↗
      </span>
    </a>
  );
}
