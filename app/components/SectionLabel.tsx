// app/components/SectionLabel.tsx
// Section headings are small tracked labels, not display type. The hero name
// is the only large moment on the page — every other heading stays quiet so
// the writing underneath carries the section.

export function SectionLabel({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-fg-muted">
        {children}
      </h2>
      {note && (
        <p className="text-fg-secondary leading-relaxed mt-2">{note}</p>
      )}
    </div>
  );
}
