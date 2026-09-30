// app/components/WorkStage.tsx
//
// The index set the way the reference sets it: white type standing on the
// work itself, at display size, with the row you are on underlined in an
// accent and everything else stepping back.
//
// One thing had to be solved rather than copied. The reference stands its
// type on photographs — a room, a person, mid-tone and busy in the right
// places. These rows carry pale maps on near-white paper, and white type over
// an isochrone is invisible. So the media sits under a scrim heavy enough to
// carry text and light enough to still read as the picture it is, and the
// picture is blurred slightly, because a legend and street labels behind a
// headline is noise either way.
//
// Everything else is the reference: the path heading, the counter, the year
// as a superior, the accent rule under the live row, the arrow chip.
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WorkRow } from "./WorkIndex";

export function WorkStage({ rows, label }: { rows: WorkRow[]; label: string }) {
  const [active, setActive] = useState(0);
  const shown = rows[active] ?? rows[0];

  const groups = useMemo(() => {
    const out: { name: string; items: { row: WorkRow; i: number }[] }[] = [];
    rows.forEach((row, i) => {
      const found = out.find((g) => g.name === row.group);
      if (found) found.items.push({ row, i });
      else out.push({ name: row.group, items: [{ row, i }] });
    });
    return out;
  }, [rows]);

  // Which group the live row belongs to, so the path heading names where you
  // actually are rather than staying on whichever group happens to be first.
  const here = groups.find((g) => g.items.some((it) => it.i === active)) ?? groups[0];
  const posInGroup = (here?.items.findIndex((it) => it.i === active) ?? 0) + 1;

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#101418]">
      {shown?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={shown.image}
          src={shown.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-[2px]
                     opacity-60 transition-opacity duration-500"
        />
      )}
      {/* Two layers, not one. A single 105° wash reads correctly on a wide
          screen and fails on a tall narrow one: the clear end lands at the
          bottom of the list rather than to the right of it, and the last rows
          sit on a bright screenshot. The flat base guarantees contrast at any
          shape; the directional pass on top is what keeps it looking like a
          photograph rather than a grey box. */}
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(10,13,16,.40)]" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(10,13,16,.78) 0%, rgba(10,13,16,.48) 45%, rgba(10,13,16,.04) 100%)",
        }}
      />

      <div className="relative px-6 py-8 sm:px-10 sm:py-12">
        <div className="flex items-baseline justify-between gap-6 mb-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
            {label} <span className="text-white/40">›</span>{" "}
            <span className="text-white">{here?.name}</span>
          </p>
          <p className="text-[11px] font-mono tabular-nums text-white/70 shrink-0">
            {String(posInGroup).padStart(2, "0")} /{" "}
            {String(here?.items.length ?? 0).padStart(2, "0")}
          </p>
        </div>

        <ul>
          {rows.map((row, i) => {
            const live = i === active;
            return (
              <li key={row.href}>
                <Link
                  href={row.href}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="stage-row group block py-1.5 sm:py-2"
                  style={
                    { "--row-dim": live ? 1 : Math.max(0.52, 0.78 - Math.abs(i - active) * 0.09) } as React.CSSProperties
                  }
                >
                  <span className="inline-flex items-baseline gap-2 sm:gap-3 max-w-full">
                    <span
                      // Oswald 700: condensed like Bebas but with a real bold
                      // and a real lowercase, so the names read as names
                      // rather than as shouting. Wider than Bebas by about a
                      // third at the same size, so the size comes down to keep
                      // every row on one line — which is the whole point of
                      // the short labels.
                      // 26px on a phone, not 32: Oswald is about a third wider
                      // than Bebas at the same size, and the longest label went
                      // to two lines at 390px — which is the one thing the short
                      // labels exist to prevent.
                      className={`font-display text-[26px] sm:text-[52px] font-bold
                                  tracking-[0.004em] leading-[1.08]
                                  ${live ? "text-white" : "text-white/90"}`}
                    >
                      {row.short ?? row.title}
                    </span>
                    <span className="text-[11px] sm:text-[13px] font-mono tabular-nums text-white/55 shrink-0">
                      &apos;{row.year}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`shrink-0 grid place-items-center w-5 h-5 sm:w-6 sm:h-6 rounded
                                  bg-[var(--stage-accent)] text-[#101418] text-[12px] leading-none
                                  transition-opacity duration-200 ${live ? "opacity-100" : "opacity-0"}`}
                    >
                      ↗
                    </span>
                  </span>
                  {/* The accent rule, drawn under the live row only, growing
                      from the left the way the reference draws it. */}
                  <span
                    aria-hidden="true"
                    className="block h-[2px] mt-1 origin-left bg-[var(--stage-accent)]
                               transition-transform duration-300 ease-[var(--ease-out)]"
                    style={{ transform: `scaleX(${live ? 1 : 0})` }}
                  />
                  {!live && <span aria-hidden="true" className="block h-px mt-1 bg-white/12" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-7 text-[11px] leading-[1.7] text-white/60 max-w-[46ch]">
          {shown?.method}
        </p>
      </div>
    </div>
  );
}
