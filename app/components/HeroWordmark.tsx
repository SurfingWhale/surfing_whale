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
      // The same face the index stage runs, so the two loudest pieces of type
      // on the site are speaking in one voice rather than two. Oswald is
      // condensed, which buys width back: the name takes less room than it did
      // in Jakarta at the same size, so the size goes up and the picture set
      // into it gets more room rather than less.
      //
      // Tracking goes from -0.04em to near zero. Negative tracking tightens a
      // wide grotesque; on a condensed face the letters are already close and
      // pulling them further collapses the counters.
      className="mt-6 mb-7 font-display font-bold text-fg
                 text-[clamp(44px,12.5vw,88px)] leading-[0.92] tracking-[0.004em]"
    >
      {/* One flex line so the picture sits on the baseline run of the first
          word, and wraps under it rather than overflowing when there is no
          room — 390px has none. */}
      <span className="flex flex-wrap items-center gap-x-[0.18em] gap-y-[0.06em]">
        <span>{first}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* Flush, the way the reference sets it: no border and no rounding,
            so the block reads as a letterform in the word rather than as a
            picture that has been placed next to one. Greyscale for the same
            reason — a colour photograph beside black type reads as an inset,
            a grey one reads as part of the setting.

            Near-square, not the wide block the reference uses: theirs holds a
            landscape scene, this holds a face shot square on a white wall. A
            wide crop of it is hair and wall with a head somewhere in the
            middle. The source is cut to head-and-shoulders so the block is
            filled rather than letterboxed.

            Sized against the letters rather than the line: at 0.86em it read
            as a stamp next to the name, which a light grotesque could carry
            and a condensed bold cannot — the strokes around it got heavier and
            the picture did not. Just over the cap height holds its own. */}
        <img
          src={image}
          alt={alt}
          loading="eager"
          className="h-[1.02em] w-[0.9em] object-cover object-center grayscale align-middle"
        />
      </span>
      <span className="block">{second}</span>
    </h1>
  );
}
