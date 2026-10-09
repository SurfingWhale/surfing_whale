"use client";
// app/components/ShareRow.tsx
//
// The end of a written-up page: the link to pass on, the places to pass it,
// and one line saying where an argument about it can go.
//
// It is at the END, which is the only place the brand book allows it: the
// Refusals page turns down "a call to action on the first screen" because a
// page that opens by asking for something is asking before it has shown
// anything. Someone who has read to here has seen the whole thing. (The
// Share button in the page's top bar is the other way in; ShareButton.)
//
// THE URL COMES FROM THE SERVER, not from window.location. Reading the address
// bar would have shared whatever host the page happened to be loaded from —
// a Vercel preview deployment, a branch URL, localhost during a demo — and
// those links either die or ask a stranger to sign in. `url` is built from
// SITE, the same constant the canonical tag and the sitemap use.
//
// The shape is the one every share sheet has taught people: the address in a
// field with Copy beside it, then a row of marks. The first version named the
// places in a row of uppercase chips, to keep brand marks off the page; Fauzy
// read it as uncommon and asked for the familiar form. The marks are drawn in
// the page's own ink (ShareIcons), so nothing on the page borrows a palette.

import Link from "next/link";
import { useEffect, useState } from "react";
import { bareUrl, openSheet, shareTargets } from "@/app/lib/share";
import { useCopyLink } from "./useCopyLink";
import {
  CheckIcon,
  InstagramIcon,
  LinkIcon,
  LinkedInIcon,
  MailIcon,
  MoreIcon,
  WhatsAppIcon,
  XIcon,
} from "./ShareIcons";

const linkish =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] " +
  "hover:decoration-[var(--accent-soft)] transition-colors duration-200";

// The same sentence on every page, and it carries the thing Fauzy is actually
// after: somewhere for a reply to land. Both destinations are real — the wall
// is public and the contact form reaches Fauzy — and the sentence says which
// is which, so nobody has to guess whether a note is a postcard or a letter.
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

// 40px circles: past the 24px floor with room, and the size every share row
// a visitor has used before draws them at.
const mark =
  "w-10 h-10 grid place-items-center rounded-full border border-border text-fg-body " +
  "hover:text-fg hover:border-border-strong transition-colors duration-200";

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
  const { copy, onCopy, onInstagram, aids } = useCopyLink(url, title);
  // navigator.share does not exist on most desktops, and rendering a button
  // that depends on it would differ between the server and the browser —
  // which is a hydration mismatch, not a feature test. It starts off and is
  // turned on after mount, so both renders agree.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const t = shareTargets(url, title);

  return (
    <section className="read-section" aria-labelledby="share-head">
      <div className="frame read-grid">
        <div className="read-rail">
          <h2
            id="share-head"
            className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label"
          >
            Share
          </h2>
        </div>

        <div className="read-body">
          {/* The address, as it will arrive, with the one solid button. */}
          <div className="flex items-center gap-3 max-w-[40rem] h-12 pl-4 pr-1.5 rounded-[11px] border border-border bg-doc">
            <LinkIcon className="w-4 h-4 flex-none text-fg-muted" />
            <span className="flex-1 min-w-0 truncate text-[13px] text-fg-body">{bareUrl(url)}</span>
            <button
              type="button"
              onClick={() => onCopy()}
              className="flex-none inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-fg text-bg
                         text-[13px] font-medium hover:opacity-90 transition-opacity duration-200"
            >
              {copy === "done" && <CheckIcon className="w-3.5 h-3.5" />}
              {copy === "done" ? "Copied" : copy === "manual" ? "Press ⌘C" : "Copy link"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href={t.whatsapp.href} target="_blank" rel="noopener noreferrer" className={mark} aria-label="WhatsApp" title="WhatsApp">
              <WhatsAppIcon />
            </a>
            <button type="button" onClick={onInstagram} className={mark} aria-label="Instagram" title="Instagram">
              <InstagramIcon />
            </button>
            <a href={t.linkedin.href} target="_blank" rel="noopener noreferrer" className={mark} aria-label="LinkedIn" title="LinkedIn">
              <LinkedInIcon />
            </a>
            <a href={t.x.href} target="_blank" rel="noopener noreferrer" className={mark} aria-label="X" title="X">
              <XIcon />
            </a>
            <a href={t.email.href} className={mark} aria-label="Email" title="Email">
              <MailIcon />
            </a>
            {canShare && (
              <button
                type="button"
                onClick={() => openSheet(url, title)}
                className={mark}
                aria-label="Share with another app"
                title="More"
              >
                <MoreIcon />
              </button>
            )}
            {/* Instagram takes no link from a desktop; say where it went. */}
            {copy === "insta" && (
              <span aria-hidden="true" className="ml-2 text-[12px] text-fg-muted">
                Link copied — paste it in Instagram
              </span>
            )}
          </div>

          {aids}

          <p className="mt-6 text-[12px] leading-[1.9] text-fg-body max-w-[52ch]">
            {note ?? DEFAULT_NOTE}
          </p>
        </div>
      </div>
    </section>
  );
}
