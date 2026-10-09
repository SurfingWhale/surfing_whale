"use client";
// app/components/ShareButton.tsx
// Share, in the top bar of a reading page, where every reading app puts it.
//
// On a touch screen it opens the system sheet straight away: that sheet
// already lists the apps the phone has, which is more than any list here.
// Anywhere else it opens a small menu — copy the link, or send it somewhere
// named. The url comes from SITE, never the address bar (see ShareRow).
//
// A popover, not a dialog: nothing behind it is dimmed or blocked, a click
// outside or Escape closes it, and focus goes back to the button. It floats
// over the page, which is the one case the brand book allows a shadow.
import { useEffect, useId, useRef, useState } from "react";
import { bareUrl, openSheet, shareTargets } from "@/app/lib/share";
import { useCopyLink } from "./useCopyLink";
import {
  CheckIcon,
  InstagramIcon,
  LinkIcon,
  LinkedInIcon,
  MailIcon,
  MoreIcon,
  ShareIcon,
  WhatsAppIcon,
  XIcon,
} from "./ShareIcons";

const item =
  "flex w-full items-center gap-3 h-10 px-3 rounded-[7px] text-[13px] text-fg text-left " +
  "hover:bg-bg-muted focus-visible:bg-bg-muted transition-colors duration-150";
const icon = "w-4 h-4 flex-none text-fg-body";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const { copy, onCopy, onInstagram, aids } = useCopyLink(url, title);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    box.current?.querySelector<HTMLElement>("[data-first]")?.focus();
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  // Straight from the tap: Safari drops the sheet if anything is awaited.
  const onButton = () => {
    if (window.matchMedia("(pointer: coarse)").matches && openSheet(url, title)) return;
    setOpen((v) => !v);
  };

  const t = shareTargets(url, title);
  const out = (href: string, label: string, Mark: typeof WhatsAppIcon) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={item} onClick={() => setOpen(false)}>
      <Mark className={icon} />
      {label}
    </a>
  );

  return (
    <div ref={box} className="relative">
      <button
        ref={button}
        type="button"
        onClick={onButton}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="inline-flex items-center gap-2 h-9 px-3 -mr-3 rounded-[7px] text-[13px] text-fg-secondary
                   hover:text-fg hover:bg-bg-muted transition-colors duration-200"
      >
        <ShareIcon className="w-[15px] h-[15px]" />
        Share
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-[14px] border border-border bg-bg p-1.5
                     shadow-[0_16px_40px_-16px_rgba(0,0,0,0.28)]"
        >
          <p className="px-3 pt-2 pb-2.5 text-[11px] text-fg-muted truncate">{bareUrl(url)}</p>
          <button type="button" data-first onClick={() => onCopy()} className={item}>
            {copy === "done" ? <CheckIcon className={icon} /> : <LinkIcon className={icon} />}
            {copy === "done" ? "Copied" : copy === "manual" ? "Press ⌘C to copy" : "Copy link"}
          </button>
          <div className="my-1.5 h-px bg-border" />
          {out(t.whatsapp.href, "WhatsApp", WhatsAppIcon)}
          <button type="button" onClick={onInstagram} className={item}>
            <InstagramIcon className={icon} />
            {copy === "insta" ? "Copied — paste in Instagram" : "Instagram"}
          </button>
          {out(t.linkedin.href, "LinkedIn", LinkedInIcon)}
          {out(t.x.href, "X", XIcon)}
          <a href={t.email.href} className={item} onClick={() => setOpen(false)}>
            <MailIcon className={icon} />
            Email
          </a>
          {canShare && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openSheet(url, title);
              }}
              className={item}
            >
              <MoreIcon className={icon} />
              More…
            </button>
          )}
          {aids}
        </div>
      )}
    </div>
  );
}
