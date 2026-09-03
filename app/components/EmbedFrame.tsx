// app/components/EmbedFrame.tsx
//
// The map slot every spatial case study uses, so they read as one family.
//
// With `src` it holds the live page — lazy, because the folium exports are
// around a megabyte each and a visitor who never scrolls this far should not
// pay for one. A visible link sits underneath rather than a load-detection
// heuristic: a cross-origin frame gives no readable load event, so the page
// cannot honestly know it failed, and a link that always works beats a guess
// that sometimes lies.
//
// With `image` it holds a still export at the same dimensions — for a map
// that exists but only as a print, where the interactive original was never
// saved. The caption has to say so; a picture of a map is not a map.
//
// With both, `image` is a poster for `src`: the still is what loads, the live
// page is what a click opens. That is the arrangement for anything heavy or
// anywhere else — a folium export pulls Leaflet, jQuery and a tile server, and
// a deployed app is a whole other site. Neither belongs in an iframe on a page
// a stranger landed on; a screenshot costs tens of kilobytes and reaches no
// third party at all. The click is what crosses the boundary, and only if they
// ask for it.
//
// With neither it is the same frame again, holding `pending`, for a study
// whose map was never exported at all.
export function EmbedFrame({
  src,
  image,
  alt,
  title,
  caption,
  pending,
  ratio = "4 / 3",
}: {
  /** The live page, embedded as an iframe. */
  src?: string;
  /** A still export, when there is no interactive original to embed. */
  image?: string;
  /** Alt text for `image`. Required whenever `image` is set. */
  alt?: string;
  title: string;
  caption: string;
  /** Shown inside the frame when there is no `src` yet. */
  pending?: string;
  /** CSS aspect-ratio for the frame. Maps want height; charts do not. */
  ratio?: string;
}) {
  // When a still stands in for a live page, both the picture and the caption
  // open the live page. Sending one to the JPEG and the other to the map would
  // make the same frame mean two things.
  const opens = src ?? image;
  const opensLive = Boolean(src);

  return (
    <figure className="my-7 -mx-6 sm:mx-0">
      <div
        className="relative w-full overflow-hidden border-y sm:border border-border sm:rounded-lg bg-bg-muted"
        style={{ aspectRatio: ratio }}
      >
        {image ? (
          // The frame crops to a fixed ratio so every study lines up, which
          // means the picture is always showing less than it has. Opening it
          // is a plain link to the file: no viewer to load, no state to get
          // wrong, and it survives a middle-click like any other link.
          <a
            href={opens}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 block group"
            aria-label={
              opensLive
                ? `Open the live version: ${title}`
                : `Open the full image: ${title}`
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={alt ?? title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-3 right-3 rounded-md bg-bg/85 backdrop-blur-sm border border-border px-2 py-1 text-[11px] leading-none text-fg-body opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200"
            >
              {opensLive ? "Open it live ↗" : "Expand ↗"}
            </span>
          </a>
        ) : src ? (
          <iframe
            src={src}
            title={title}
            loading="lazy"
            // Same-origin is deliberately withheld: this is another deployment
            // and the page has no reason to reach into it.
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-8">
            {/* A dashed rule rather than a fake map: the frame says a map
                belongs here, the words say why one is not. */}
            <div className="max-w-[300px] text-center">
              <div
                aria-hidden="true"
                className="mx-auto mb-4 h-px w-16 border-t border-dashed border-border-strong"
              />
              <p className="text-[11px] leading-[1.9] text-fg-muted">
                {pending}
              </p>
            </div>
          </div>
        )}
      </div>
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2 px-6 sm:px-0">
        {caption}
        {opens && (
          <>
            {" "}
            <a
              href={opens}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
              {opensLive ? "Open it live ↗" : "Open the full image ↗"}
            </a>
          </>
        )}
      </figcaption>
    </figure>
  );
}
