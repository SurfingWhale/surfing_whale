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
// Without `src` it is the same frame, the same border, the same caption
// position, holding `pending` instead. That is for a study whose map was
// never exported: the slot is where a map belongs, so the gap is a stated
// part of the page rather than a silence, and publishing one later is a
// one-prop change.
export function EmbedFrame({
  src,
  title,
  caption,
  pending,
  ratio = "4 / 3",
}: {
  /** The live page. Omit to render the pending state. */
  src?: string;
  title: string;
  caption: string;
  /** Shown inside the frame when there is no `src` yet. */
  pending?: string;
  /** CSS aspect-ratio for the frame. Maps want height; charts do not. */
  ratio?: string;
}) {
  return (
    <figure className="my-7 -mx-6 sm:mx-0">
      <div
        className="relative w-full overflow-hidden border-y sm:border border-border sm:rounded-lg bg-bg-muted"
        style={{ aspectRatio: ratio }}
      >
        {src ? (
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
        {src && (
          <>
            {" "}
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
              Open it full screen ↗
            </a>
          </>
        )}
      </figcaption>
    </figure>
  );
}
