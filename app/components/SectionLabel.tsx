// app/components/SectionLabel.tsx
// 11px / 500 / 0.14em uppercase, with a 32px gap beneath — the reference
// site's section label, measured from its stylesheet. Inside a .frame-split
// on a wide screen it becomes the section's rail instead (globals.css).

export function SectionLabel({
  children,
  note,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  note?: React.ReactNode;
  /**
   * h2 on the home page, where the h1 is the name at the top.
   *
   * On a page of its own — /archive, /photo, /writing — this label IS the
   * page's title, and rendering it as an h2 left those documents with no h1
   * at all. A screen reader user landing there is told the page has sections
   * but never what the page is, and jumping by heading starts at the second
   * level with nothing above it. Nothing changes visually; only the element.
   */
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 frame-rail frame-sticky">
      <Tag className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label">
        {children}
      </Tag>
      {note && (
        <p className="text-[13px] leading-[2] text-fg-body mt-2">{note}</p>
      )}
    </div>
  );
}
