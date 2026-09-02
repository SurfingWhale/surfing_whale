// app/components/EmbedFrame.tsx
//
// An interactive map embedded as the live page it is, not a picture of one.
//
// The iframe is lazy, so a visitor who never scrolls this far never pays for
// it — the folium pages are around a megabyte each. A visible link sits
// underneath because an embed can fail in ways the page cannot detect from
// the outside: the deployment can go down, and a cross-origin frame gives no
// readable load event, so there is deliberately no "did it work" heuristic
// here — just a way out that always works.
export function EmbedFrame({
  src,
  title,
  caption,
  ratio = "4 / 3",
}: {
  src: string;
  title: string;
  caption: string;
  /** CSS aspect-ratio for the frame. Maps want height; charts do not. */
  ratio?: string;
}) {
  return (
    <figure className="my-7 -mx-6 sm:mx-0">
      <div
        className="relative w-full overflow-hidden border-y sm:border border-border sm:rounded-lg bg-bg-muted"
        style={{ aspectRatio: ratio }}
      >
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
      </div>
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2 px-6 sm:px-0">
        {caption}{" "}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
        >
          Open it full screen ↗
        </a>
      </figcaption>
    </figure>
  );
}
