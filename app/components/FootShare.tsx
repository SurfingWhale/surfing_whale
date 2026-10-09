"use client";
// app/components/FootShare.tsx
// The end of the home page, so the place to pass it on: the same ways out as
// ShareRow at the foot of a written-up page, as marks in the footer's own
// ink (ShareIcons), named for screen readers and on hover.
//
// A phone gets one button, beside "Leave a note": the system sheet already
// lists the apps that phone has, and a row of marks would make the footer
// too tall to sit under the page (SiteFooter.tsx).
import { SITE } from "../lib/site";
import { openSheet, shareTargets } from "../lib/share";
import { useCopyLink } from "./useCopyLink";
import {
  CheckIcon,
  InstagramIcon,
  LinkIcon,
  LinkedInIcon,
  MailIcon,
  ShareIcon,
  WhatsAppIcon,
  XIcon,
} from "./ShareIcons";

const URL_ = `${SITE}/`;
const TITLE = "Muhammad Fauzy — Surfing Whale";

// Tablet and desktop: the row under the columns.
export function FootShare() {
  const { copy, onCopy, onInstagram, aids } = useCopyLink(URL_, TITLE);
  const t = shareTargets(URL_, TITLE);

  const out = (href: string, label: string, Mark: typeof WhatsAppIcon, away = true) => (
    <li>
      <a
        href={href}
        {...(away ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={label}
        title={label}
      >
        <Mark />
      </a>
    </li>
  );

  return (
    <div className="foot-share">
      <h2 className="foot-share-head">Pass it on</h2>
      <ul className="foot-share-list">
        <li>
          <button type="button" onClick={() => onCopy()} aria-label="Copy link" title="Copy link">
            {copy === "done" ? <CheckIcon /> : <LinkIcon />}
          </button>
        </li>
        {out(t.whatsapp.href, "WhatsApp", WhatsAppIcon)}
        <li>
          <button type="button" onClick={onInstagram} aria-label="Instagram" title="Instagram">
            <InstagramIcon />
          </button>
        </li>
        {out(t.linkedin.href, "LinkedIn", LinkedInIcon)}
        {out(t.x.href, "X", XIcon)}
        {out(t.email.href, "Email", MailIcon, false)}
      </ul>
      {copy !== "idle" && (
        <span aria-hidden="true" className="foot-share-said">
          {copy === "insta" ? "Copied — paste it in Instagram" : copy === "done" ? "Link copied" : "Press ⌘C to copy"}
        </span>
      )}
      {aids}
    </div>
  );
}

// A phone: the sheet, or where there is none (some in-app browsers) a copy.
export function ShareSheetButton() {
  const { copy, onCopy, aids } = useCopyLink(URL_, TITLE);

  return (
    <>
      <button type="button" className="foot-sheet" onClick={() => openSheet(URL_, TITLE) || onCopy()}>
        {copy === "done" ? <CheckIcon /> : <ShareIcon />}
        {copy === "done" ? "Link copied" : copy === "manual" ? "Couldn’t copy" : "Share"}
      </button>
      {aids}
    </>
  );
}
