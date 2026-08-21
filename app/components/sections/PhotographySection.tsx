// app/components/sections/PhotographySection.tsx
"use client";

import { useState } from "react";
import { photographs, type PhotoCategory } from "@/app/data/photography";
import { SectionLabel } from "@/app/components/SectionLabel";
import { PhotoViewer } from "@/app/components/PhotoViewer";

const LABEL: Record<PhotoCategory, string> = {
  portraits: "Portraits",
  everyday: "Everyday",
  landscapes: "Landscapes",
};

const ORDER: PhotoCategory[] = ["portraits", "everyday", "landscapes"];

// Only offer filters that actually have frames behind them, so a tab never
// leads to an empty grid.
const AVAILABLE = ORDER.filter((c) => photographs.some((p) => p.category === c));

type Filter = "all" | PhotoCategory;

export function PhotographySection() {
  const [filter, setFilter] = useState<Filter>("all");
  // Index runs against the filtered set, so arrows walk what is on screen.
  const [viewing, setViewing] = useState<number | null>(null);
  const visible =
    filter === "all" ? photographs : photographs.filter((p) => p.category === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    ...AVAILABLE.map((c) => ({ key: c as Filter, label: LABEL[c] })),
  ];

  return (
    <section data-spot id="photography" className="w-full py-24 border-t border-border">
      <div className="container mx-auto px-6 max-w-[720px]">
        <div className="mb-16 space-y-5 text-[13px] leading-[2] text-fg-body max-w-[560px]">
          <p>
            I might snap myself in a mirror, someone laughing, a random moment,
            a friend&apos;s expression. It is simply a photograph ✌️ Perhaps no
            one cares. Perhaps tomorrow even I won&apos;t like it.
          </p>
          <p>
            Yet decades later someone might look at that very same frame and
            find something I missed the moment I pressed the shutter.
          </p>
          <p>
            Perhaps that is why Vivian Maier sits so close to the heart — not
            because she was a &ldquo;great photographer,&rdquo; but simply
            because she kept on taking pictures.
          </p>
          <p>
            There is more to capture, more to carry, and more of life to move
            through — all while knowing we can never truly control what an image
            means, or how long it endures.
          </p>
          <p className="text-fg">
            To my old soul, and to my faithful vintage Fujifilm: thank you. 📸
          </p>
        </div>

        <SectionLabel note={`Photography archive · ${photographs.length} photographs.`}>
          Selected photography
        </SectionLabel>

        <div className="flex gap-2 mb-8 flex-wrap" role="group" aria-label="Filter photographs">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`px-4 py-1.5 rounded-full text-[13px] transition-colors duration-300 border ${
                filter === f.key
                  ? "bg-fg text-bg border-fg"
                  : "border-border text-fg-secondary hover:text-fg hover:border-border-strong"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* Frames break out of the reading column: rows are justified by aspect
          ratio, so nothing is cropped and the archive reads as a contact
          sheet rather than a set of tiles. */}
      <div className="photo-justified">
          {visible.map((photo, i) => (
          <figure
            key={photo.id}
            style={{
              // flex-grow tracks the ratio; flex-basis is that ratio at the
              // target row height, so a row settles flush.
              ["--photo-ratio" as string]: String(photo.width / photo.height),
              ["--photo-basis" as string]:
                `calc(var(--photo-row) * ${photo.width / photo.height})`,
            }}
            className="overflow-hidden bg-bg-muted"
          >
            <button
              type="button"
              onClick={() => setViewing(i)}
              aria-label={`Open: ${photo.alt}`}
              className="block w-full cursor-zoom-in border-0 p-0 bg-transparent transition-transform duration-150 active:scale-[0.98]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="w-full h-auto block outline outline-1 -outline-offset-1 outline-black/10"
              />
            </button>
          </figure>
          ))}
      </div>

      <PhotoViewer
        photos={visible}
        index={viewing}
        onIndex={setViewing}
        onClose={() => setViewing(null)}
      />
    </section>
  );
}
