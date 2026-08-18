// app/components/sections/PhotographySection.tsx
"use client";

import { useState } from "react";
import { photographs, type PhotoCategory } from "@/app/data/photography";

const FILTERS: { key: "all" | PhotoCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "portraits", label: "Portraits" },
  { key: "everyday", label: "Everyday" },
  { key: "landscapes", label: "Landscapes" },
];

export function PhotographySection() {
  const [filter, setFilter] = useState<"all" | PhotoCategory>("all");
  const visible =
    filter === "all" ? photographs : photographs.filter((p) => p.category === filter);

  return (
    <section id="photography" className="w-full py-24 border-t border-border">
      <div className="container mx-auto px-6 max-w-[1120px]">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            Selected frames
          </h2>
          <p className="text-sm text-fg-secondary mt-1">
            {photographs.length} photographs, caught along the way.
          </p>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors duration-300 border ${
                filter === f.key
                  ? "bg-fg text-bg border-fg"
                  : "border-border text-fg-secondary hover:text-fg hover:border-border-strong"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {visible.map((photo) => (
            <figure
              key={photo.id}
              className="relative aspect-[4/5] rounded-lg overflow-hidden bg-bg-muted border border-border group"
            >
              {photo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-fg-muted text-xs">
                  {photo.alt}
                </div>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
