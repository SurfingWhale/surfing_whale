// app/components/CaseFolder.tsx
// A case study sits in a folder rather than on a card: the flap tilts back and
// the documents inside fan up, so opening it is an action rather than a link.
// Same idea as the reference site's folder, which credits Fayaz Ahmed's
// MIT-licensed portfolio template; the silhouette and timings here are written
// fresh rather than copied.
"use client";

import Link from "next/link";
import { useState } from "react";

export interface Sheet {
  src?: string;
  alt?: string;
  /** Resting offset and tilt, then where it travels to when the folder opens. */
  closed: { x: string; r: string };
  open: { x: string; r: string };
}

const DEFAULT_SHEETS: Sheet[] = [
  { closed: { x: "-11%", r: "-4deg" }, open: { x: "-50%", r: "-9deg" } },
  { closed: { x: "0%", r: "0deg" }, open: { x: "0%", r: "0deg" } },
  { closed: { x: "11%", r: "4deg" }, open: { x: "50%", r: "9deg" } },
];

export function CaseFolder({
  href,
  title,
  subtitle,
  sheets = DEFAULT_SHEETS,
}: {
  href: string;
  title: string;
  subtitle: string;
  sheets?: Sheet[];
}) {
  // Hover drives it on desktop; a first tap opens it on touch, where there is
  // no hover to rely on. The link still works on either.
  const [open, setOpen] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onTouchStart={() => setOpen(true)}
      aria-label={`${title} — ${subtitle}`}
      className="group block max-w-[360px] no-underline text-fg active:scale-[0.97] transition-transform duration-150"
    >
      <div className="relative w-full aspect-[20/17] [perspective:1000px]">
        {/* Folder body */}
        <svg
          viewBox="0 0 400 340"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full overflow-visible
            drop-shadow-[0_1px_2px_rgba(65,59,49,0.06)]
            drop-shadow-[0_7px_14px_rgba(65,59,49,0.07)]
            drop-shadow-[0_20px_34px_rgba(65,59,49,0.08)]"
        >
          <path
            d="M0 30a30 30 0 0 1 30-30h124a30 30 0 0 1 30 30 32 32 0 0 0 32 32h154a30 30 0 0 1 30 30v218a30 30 0 0 1-30 30H30a30 30 0 0 1-30-30Z"
            className="fill-folder stroke-white/70"
            strokeWidth="1"
          />
        </svg>

        {/* Documents inside */}
        <div className="absolute inset-0 z-10">
          {sheets.map((sheet, i) => {
            const pos = open ? sheet.open : sheet.closed;
            return (
              <figure
                key={i}
                style={{
                  transform: `translateX(calc(-50% + ${pos.x})) ${
                    open ? "translateY(-22%)" : ""
                  } rotate(${pos.r})`,
                  transformOrigin: "50% 100%",
                  transitionDelay: i === 1 ? "0ms" : "30ms",
                }}
                className="absolute top-[17%] left-1/2 w-[44%] aspect-[4/5] m-0 rounded-[7px] overflow-hidden bg-white
                  shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_3px_8px_rgba(0,0,0,0.09)]
                  transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
              >
                {sheet.src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sheet.src}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
              </figure>
            );
          })}
        </div>

        {/* Front flap, carrying the label */}
        <div
          style={{ transform: open ? "rotateX(-28deg)" : "rotateX(0deg)" }}
          className="absolute inset-x-0 bottom-0 top-[24%] z-20 rounded-[7.5%/11.6%] origin-bottom
            bg-gradient-to-b from-white/75 to-[#faf9f6]/60
            shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72),0_-2px_7px_-2px_rgba(65,59,49,0.12)]
            backdrop-blur-[16px] backdrop-saturate-[160%]
            transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]
            dark:from-[#2d2d2d]/80 dark:to-[#1d1d1d]/72"
        >
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-[18px]">
            <div className="min-w-0">
              <strong className="block truncate text-[12px] font-semibold leading-[1.45] tracking-[-0.01em] text-fg">
                {title}
              </strong>
              <span className="block truncate text-[10px] leading-[1.45] text-fg-body">
                {subtitle}
              </span>
            </div>
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="flex-none w-4 h-4 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round] text-fg-muted
                transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-fg"
            >
              <path d="M5 11 11 5M6 5h5v5" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
