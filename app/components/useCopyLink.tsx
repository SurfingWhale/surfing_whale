"use client";
// app/components/useCopyLink.tsx
// The state every share control keeps: whether the link was just copied,
// copied for Instagram, or could not be copied at all — and the two things
// that have to be on the page for that to work and be heard: an off-screen
// field holding the address (the last copy fallback selects it) and a live
// region, because a button whose label changes is not read out.
import { useEffect, useRef, useState } from "react";
import { copyLink, instagramSheet } from "@/app/lib/share";

export type CopyState = "idle" | "done" | "insta" | "manual";

const SAID: Record<CopyState, string> = {
  idle: "",
  done: "Link copied",
  insta: "Link copied. Paste it into Instagram.",
  manual: "Press Control or Command C to copy",
};

export function useCopyLink(url: string, title: string) {
  const [copy, setCopy] = useState<CopyState>("idle");
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (copy === "idle") return;
    const t = setTimeout(() => setCopy("idle"), copy === "done" ? 2400 : copy === "insta" ? 4000 : 8000);
    return () => clearTimeout(t);
  }, [copy]);

  const onCopy = async (done: CopyState = "done") => {
    setCopy((await copyLink(url, field.current)) ? done : "manual");
  };

  const onInstagram = () => {
    if (!instagramSheet(url, title)) onCopy("insta");
  };

  const aids = (
    <>
      {/* Off screen but selectable: `hidden` and display:none cannot be
          selected, so the manual fallback would have had nothing to offer. */}
      <input
        ref={field}
        readOnly
        value={url}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px opacity-0"
      />
      <p aria-live="polite" className="sr-only">
        {SAID[copy]}
      </p>
    </>
  );

  return { copy, onCopy, onInstagram, aids };
}
