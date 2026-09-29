// app/components/WorkIndex.tsx
//
// The work as a directory: grouped by what kind of work it is, one line per
// study, and a picture of whichever row you are on.
//
// A grid of cards costs a tile of screen per item, so it stops scanning well
// around six and the page just gets taller. A list costs a line, carries the
// year without a second element, and puts the whole set in front of someone at
// once. The groups are the part that earns its keep as this grows: "spatial"
// and "built" are different claims about what he can do, and a reader deciding
// whether to keep going is really asking which of those they came for.
//
// Taken from the reference Fauzy sent, with one deliberate departure. There,
// the list is white type over a full-bleed photograph that swaps per row. That
// works on a dark site with photographs behind it; here the pictures are pale
// maps on pale paper, and white type over an isochrone would be unreadable. So
// the picture keeps its own frame beside the list and the list stays type on
// paper. The borrowed part is the structure.
//
// Every group is open on arrival. A portfolio that makes you click to find out
// whether there is anything behind a heading has the incentive backwards.
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface WorkRow {
  href: string;
  title: string;
  /** Two digits, as the reference sets them — '25 reads as a note, 2025 as data. */
  year: string;
  /** Leads with the method; this is the line that has to survive scanning. */
  method: string;
  /**
   * A one- or two-word name, for the stage.
   *
   * The reference's rows are company names — Attio, Paddle, SoPost — and its
   * rhythm depends on every row being one line. These titles are sentences,
   * and at display size three of five wrapped to two and three lines, which
   * turns the list into a wall. The full title still runs on the cards and on
   * the page; the stage gets the short name.
   */
  short?: string;
  /** Which cluster this belongs to. Rows keep their order inside it. */
  group: string;
  image?: string;
  alt?: string;
}

export function WorkIndex({ rows, label }: { rows: WorkRow[]; label: string }) {
  // Nothing is "selected" until a pointer or a focus ring says so, but the
  // frame should never be empty, so the first row stands in until then.
  const [active, setActive] = useState(0);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const shown = rows[active] ?? rows[0];

  // Groups in the order they first appear, so the ordering decision stays in
  // the data rather than being re-stated as a sort key here.
  const groups = useMemo(() => {
    const out: { name: string; items: { row: WorkRow; i: number }[] }[] = [];
    rows.forEach((row, i) => {
      const found = out.find((g) => g.name === row.group);
      if (found) found.items.push({ row, i });
      else out.push({ name: row.group, items: [{ row, i }] });
    });
    return out;
  }, [rows]);

  return (
    <div className="grid gap-8 sm:grid-cols-[1fr_15rem] sm:gap-10 sm:items-start">
      <div>
        {groups.map((g) => {
          const isClosed = Boolean(closed[g.name]);
          return (
            <section key={g.name} className="mb-8 last:mb-0">
              <div className="flex items-baseline justify-between gap-6 mb-3">
                <button
                  type="button"
                  onClick={() => setClosed((c) => ({ ...c, [g.name]: !c[g.name] }))}
                  aria-expanded={!isClosed}
                  className="group flex items-baseline gap-2 text-[11px] font-medium uppercase
                             tracking-[0.14em] leading-[1.5] text-fg-label hover:text-fg
                             transition-colors duration-200"
                >
                  <span>
                    {label} <span className="text-fg-muted">›</span> {g.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-fg-muted transition-transform duration-300
                                ${isClosed ? "-rotate-90" : "rotate-0"}`}
                  >
                    ⌄
                  </span>
                </button>
                <p className="text-[11px] font-mono tabular-nums text-fg-muted shrink-0">
                  {String(g.items.length).padStart(2, "0")}
                </p>
              </div>

              {!isClosed && (
                <ul className="border-t border-border">
                  {g.items.map(({ row, i }) => (
                    <li key={row.href}>
                      <Link
                        href={row.href}
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        className="work-row group block border-b border-border py-4
                                   transition-opacity duration-300 ease-[var(--ease-out)]"
                        // The stack steps back from wherever the reader is:
                        // distance from `active`, not position in the array, so
                        // the last row is not buried permanently. Floored,
                        // because a row nobody is on is still a row someone has
                        // to be able to read.
                        //
                        // Handed over as a variable rather than applied here,
                        // because on a touch screen nothing ever sets `active`
                        // — it would sit on the first row forever and leave the
                        // rest dimmed with no way to undim it. The rule in
                        // globals.css only reads this where there is a pointer.
                        style={
                          {
                            "--row-dim": Math.max(0.42, 1 - Math.abs(i - active) * 0.16),
                          } as React.CSSProperties
                        }
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="text-[15px] font-medium tracking-[-0.02em] leading-[1.5] text-fg">
                            {row.title}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-fg-muted shrink-0">
                            &apos;{row.year}
                          </span>
                          <span
                            aria-hidden="true"
                            className="ml-auto shrink-0 text-[13px] text-fg-muted
                                       opacity-0 -translate-x-1 transition-all duration-300
                                       group-hover:opacity-100 group-hover:translate-x-0
                                       group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
                          >
                            →
                          </span>
                        </div>
                        <p className="text-[11px] leading-[1.7] text-fg-body mt-1.5">
                          {row.method}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* Sticky so the picture stays with the row being read, and hidden below
          the breakpoint, where the list is the whole thing and a swapping
          thumbnail would only jump around under the thumb. */}
      <div className="hidden sm:block sm:sticky sm:top-20">
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border border-border bg-bg-muted">
          {shown?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={shown.image}
              src={shown.image}
              alt={shown.alt ?? shown.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-6 text-center text-[11px] leading-[1.7] text-fg-muted">
              No visual saved for this one yet.
            </span>
          )}
        </div>
        <p className="text-[11px] leading-[1.7] text-fg-muted mt-2">{shown?.title}</p>
      </div>
    </div>
  );
}
