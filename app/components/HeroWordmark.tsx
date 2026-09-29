// app/components/HeroWordmark.tsx
//
// The name set large, with a picture sitting inside it rather than beside it.
//
// Taken from the reference: there, a photograph occupies the gap on the first
// line of the wordmark, so the type and the image read as one object instead
// of a heading with a picture under it. The move only works if the image is
// measured in the type's own units — its height is set in `em`, so it scales
// with the font and stays locked to the cap height at every width. Give it a
// pixel height and it drifts the moment the heading wraps.
//
// This sits above the existing evidence frame, not in place of it. The frame
// below is the work; this is the masthead.
"use client";

export function HeroWordmark({
  first,
  second,
  image,
  alt,
}: {
  first: string;
  second: string;
  image: string;
  alt: string;
}) {
  return (
    <h1
      className="mt-6 mb-7 font-medium text-fg
                 text-[clamp(38px,11vw,76px)] leading-[0.94] tracking-[-0.04em]"
    >
      {/* One flex line so the picture sits on the baseline run of the first
          word, and wraps under it rather than overflowing when there is no
          room — 390px has none. */}
      <span className="flex flex-wrap items-center gap-x-[0.18em] gap-y-[0.06em]">
        <span>{first}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          loading="eager"
          className="h-[0.78em] w-[1.72em] object-cover rounded-[0.06em]
                     border border-border align-middle"
        />
      </span>
      <span className="block">{second}</span>
    </h1>
  );
}
