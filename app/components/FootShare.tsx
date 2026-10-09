"use client";
// app/components/FootShare.tsx
// The end of the home page, so the place to pass it on. The same ways as
// ShareRow at the foot of a written-up page, set in the footer's own ink and
// named in words — no brand marks, for the reason ShareRow gives.
//
// A phone gets one button, beside "Leave a note": the system sheet already
// lists the apps that phone has, and a row of four would make the footer too
// tall to sit under the page (SiteFooter.tsx).
import { useEffect, useRef, useState } from "react";
import { SITE } from "../lib/site";
import { copyLink, instagramSheet, openSheet, shareLinks } from "../lib/share";

const URL_ = `${SITE}/`;
const TITLE = "Muhammad Fauzy — Surfing Whale";

type Copy = "idle" | "done" | "insta" | "manual";

function useCopy() {
  const [copy, setCopy] = useState<Copy>("idle");
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (copy === "idle") return;
    const t = setTimeout(() => setCopy("idle"), copy === "done" ? 2400 : copy === "insta" ? 4000 : 8000);
    return () => clearTimeout(t);
  }, [copy]);

  const onCopy = async (done: Copy = "done") => {
    setCopy((await copyLink(URL_, field.current)) ? done : "manual");
  };

  // Off screen but selectable, for copying by hand; and the announcement,
  // because a label that changes is not read out.
  const extras = (
    <>
      <input
        ref={field}
        readOnly
        value={URL_}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px opacity-0"
      />
      <p aria-live="polite" className="sr-only">
        {copy === "done"
          ? "Link copied"
          : copy === "insta"
            ? "Link copied. Paste it into Instagram."
            : copy === "manual"
              ? "Press Control or Command C to copy"
              : ""}
      </p>
    </>
  );

  return { copy, onCopy, extras };
}

// Tablet and desktop: the row under the columns.
export function FootShare() {
  const { copy, onCopy, extras } = useCopy();
  const [whatsapp, linkedin] = shareLinks(URL_, TITLE);

  return (
    <div className="foot-share">
      <h2 className="foot-share-head">Pass it on</h2>
      <ul className="foot-share-list">
        <li>
          <button type="button" onClick={() => onCopy()}>
            {copy === "done" ? "Copied" : copy === "manual" ? "Press ⌘C" : "Copy link"}
          </button>
        </li>
        <li>
          <a href={whatsapp.href} target="_blank" rel="noopener noreferrer">
            WhatsApp ↗
          </a>
        </li>
        <li>
          <button type="button" onClick={() => instagramSheet(URL_, TITLE) || onCopy("insta")}>
            {copy === "insta" ? "Copied — paste in IG" : "Instagram"}
          </button>
        </li>
        <li>
          <a href={linkedin.href} target="_blank" rel="noopener noreferrer">
            LinkedIn ↗
          </a>
        </li>
      </ul>
      {extras}
    </div>
  );
}

// A phone: the sheet, or where there is none (some in-app browsers) a copy.
export function ShareSheetButton() {
  const { copy, onCopy, extras } = useCopy();

  return (
    <>
      <button type="button" className="foot-sheet" onClick={() => openSheet(URL_, TITLE) || onCopy()}>
        {copy === "done" ? "Link copied" : copy === "manual" ? "Couldn’t copy" : "Share"}
      </button>
      {extras}
    </>
  );
}
