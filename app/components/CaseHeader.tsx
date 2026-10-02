// app/components/CaseHeader.tsx
//
// The opening of a case study, in the grammar of the studio page Fauzy sent:
// a rule, the title with its facts stacked beside it, a rule, then the claim
// the study makes — and, folded behind it, how it was made.
//
// The fold is the part worth stealing. A studio hides its credits there;
// here it hides method, sources and tools. Someone reading gets a sentence and
// a picture, someone scanning for "does this person use Python" gets an answer
// in one press, and neither has to sit through the other's page. That is the
// alternative to a wall of tool badges, which was offered and turned down.
//
// Everything in `facts` and `made` has to be something the study itself can
// show. These are not keywords; the coffee page really does say OpenStreetMap
// and Leaflet, and the padel one really does cite BPS.
"use client";

import { useId, useState } from "react";

export interface MadeRow {
  label: string;
  value: string;
}

export function CaseHeader({
  kicker,
  title,
  facts,
  claim,
  made,
  scale = "site",
}: {
  /** Small line above everything — "Field note", a date, a status. */
  kicker?: string;
  title: string;
  /** Stacked beside the title: method, place, year. Three or four at most. */
  facts: string[];
  /** One sentence: what this study claims. Not a summary of it. */
  claim: string;
  /** Behind the fold: how it was made. */
  made: MadeRow[];
  /** "site" keeps the 11/13/15 scale; "display" lets the title run large. */
  scale?: "site" | "display";
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <header className="mb-10">
      {kicker && (
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-4">
          {kicker}
        </p>
      )}

      <div className="border-t border-border-strong pt-6">
        <div className="flex items-start justify-between gap-8">
          <h1
            className={
              scale === "display"
                ? "text-[34px] sm:text-[44px] font-medium tracking-[-0.03em] leading-[1.08] text-fg max-w-[8ch] sm:max-w-none"
                : "text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg"
            }
          >
            {title}
          </h1>

          {/* The facts run down the page rather than across it, so the title
              keeps the full measure and the eye still catches them. Right
              aligned because they are a margin note, not a subtitle. */}
          <ul className="shrink-0 text-right space-y-2 pt-1">
            {facts.map((f) => (
              <li
                key={f}
                className="text-[11px] uppercase tracking-[0.14em] leading-[1.5] text-fg-muted"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border mt-6 pt-6">
        <div className="flex items-start justify-between gap-6">
          <p className="text-[13px] leading-[1.9] text-fg max-w-[52ch]">{claim}</p>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="shrink-0 w-7 h-7 grid place-items-center rounded-md text-fg-body
                       hover:text-fg hover:bg-bg-muted transition-colors duration-200"
          >
            {/* Two strokes, one of which rotates away: the plus becomes a minus
                without swapping glyphs, so nothing shifts by a pixel. */}
            <span className="sr-only">{open ? "Hide how it was made" : "Show how it was made"}</span>
            <span aria-hidden="true" className="relative block w-3.5 h-3.5">
              <span className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-current" />
              <span
                className={`absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-current
                            transition-transform duration-300 ease-[var(--ease-out)]
                            ${open ? "rotate-0" : "rotate-90"}`}
              />
            </span>
          </button>
        </div>

        {/* Not `hidden`: the attribute's `display:none` comes from the UA
            stylesheet and loses to a `grid` class, so the panel would have
            stayed open forever. Unmounting it is also the honest thing — a
            closed fold should not be sitting in the DOM being read out. */}
        {open && (
          <dl
            id={panelId}
            className="mt-6 grid gap-3 sm:grid-cols-[7rem_1fr] sm:gap-x-6"
          >
            {made.map((row) => (
              <div key={row.label} className="contents">
                <dt className="text-[11px] uppercase tracking-[0.14em] leading-[1.6] text-fg-label">
                  {row.label}
                </dt>
                <dd className="text-[13px] leading-[1.8] text-fg-body mb-2 sm:mb-0">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
