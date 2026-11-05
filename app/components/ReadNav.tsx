"use client";
// app/components/ReadNav.tsx
//
// The bar at the top of every reading page: back, and the share control.
//
// Lifted out of Read.tsx so it can be a client component on its own. Read.tsx
// also exports ReadPage, ReadBlock and ReadSection, which wrap the body of
// every case study — putting "use client" on that file would push all of it
// across the boundary for the sake of two words in a nav bar.
//
// Those two words are why it moved: `label` is interface, not writing, so it
// switches with the interface language. `href` does not — a page is at one
// address in both languages.
import Link from "next/link";
import { ShareButton } from "@/app/components/ShareButton";
import { LangToggle } from "@/app/components/LangToggle";
import { useUI } from "@/app/components/useLang";

export function ReadNav({
  href = "/#project",
  label,
  share,
}: {
  href?: string;
  /** Overrides the translated default. Pass it only for a word the dictionary
   *  does not hold; the two ordinary cases are the defaults below. */
  label?: string;
  /** The page's own address and title, from SITE — never the address bar. */
  share?: { url: string; title: string };
}) {
  const ui = useUI();
  const shown = label ?? (href === "/" ? ui.home : ui.work);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="frame h-14 flex items-center justify-between">
        <Link href={href} className="text-[13px] text-fg-secondary hover:text-fg transition-colors duration-300">
          ← {shown}
        </Link>
        <div className="flex items-center gap-1">
          <LangToggle />
          {share && <ShareButton url={share.url} title={share.title} />}
        </div>
      </div>
    </nav>
  );
}
