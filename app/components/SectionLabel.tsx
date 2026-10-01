// app/components/SectionLabel.tsx
// 11px / 500 / 0.14em uppercase, with a 32px gap beneath — the reference
// site's section label, measured from its stylesheet. Inside a .frame-split
// on a wide screen it becomes the section's rail instead (globals.css).

export function SectionLabel({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="mb-8 frame-rail frame-sticky">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label">
        {children}
      </h2>
      {note && (
        <p className="text-[13px] leading-[2] text-fg-body mt-1.5">{note}</p>
      )}
    </div>
  );
}
