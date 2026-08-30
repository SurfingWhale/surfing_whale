// app/components/DocPreview.tsx
//
// A document shown as a document: a paper sheet with its own margins and its
// own type, clipped to a peek with the rest a click away.
//
// The type scale inside is deliberately not the site's. Everything else on
// this site is 11/13/15px; a document that matched would read as more page
// chrome. The point is that this is a separate artefact the visitor is being
// handed, so it gets paper, a shadow, and a slightly larger measure.
"use client";

import { useId, useState } from "react";

export function DocPreview({
  title,
  meta,
  peek = 460,
  children,
}: {
  /** Shown in the sheet's header strip, like a filename. */
  title: string;
  /** Source line under the sheet. Takes nodes so it can carry a link. */
  meta?: React.ReactNode;
  /** Collapsed height in px. */
  peek?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <figure className="my-8 -mx-6 sm:mx-0">
      <div className="relative">
        {/* Two stacked edges behind the sheet, so it reads as a document with
            more pages under it rather than a card. */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute inset-x-3 -bottom-1.5 h-6 rounded-b-lg bg-doc-stack"
        />
        <div
          aria-hidden="true"
          className="hidden sm:block absolute inset-x-6 -bottom-3 h-6 rounded-b-lg bg-doc-stack opacity-60"
        />

        <div className="relative bg-doc border-y sm:border border-border sm:rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(65,59,49,0.05),0_8px_24px_-8px_rgba(65,59,49,0.10)]">
          <div className="flex items-center gap-2.5 px-5 sm:px-7 h-11 border-b border-border/70">
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="flex-none w-3.5 h-3.5 fill-none stroke-current stroke-[1.4] [stroke-linejoin:round] text-fg-muted"
            >
              <path d="M3.5 1.5h6L12.5 4.5v10h-9Z" />
              <path d="M9.5 1.5v3h3" />
            </svg>
            <span className="text-[11px] font-medium tracking-[-0.01em] text-fg-secondary truncate">
              {title}
            </span>
          </div>

          <div
            id={id}
            className="relative"
            style={open ? undefined : { maxHeight: peek, overflow: "hidden" }}
          >
            <div className="doc px-6 sm:px-9 py-7 sm:py-9">{children}</div>

            {!open && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[var(--doc)]"
              />
            )}
          </div>

          <div className="px-5 sm:px-7 py-3 border-t border-border/70">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={id}
              className="text-[12px] font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
              {open ? "Collapse document" : "Read the full document →"}
            </button>
          </div>
        </div>
      </div>

      {meta && (
        <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-4 sm:mt-6 px-6 sm:px-0">
          {meta}
        </figcaption>
      )}
    </figure>
  );
}
