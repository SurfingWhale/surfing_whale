// app/components/FinanceSheets.tsx
// What is in the finance folder: two real captures and the mark.
//
// The captures were drawn as mockups first, on the reasoning that a whole
// phone screen shrunk to 158px is an unreadable smear. That reasoning was
// only half right — it holds for a whole screen, not for a crop. Both are
// cropped to 4:5 around the part that identifies them, so the balance, the
// ribbon and the persona all still read at this size, and they are the
// product rather than a drawing of it.
//
// The crops stop where they do on purpose: the folder's front flap covers the
// lower half of a sheet even when open, so whatever has to be recognised
// belongs in the top 60%.

/** Fauzy's logo, traced from the PNG he drew rather than redrawn by hand. */
export function MarkSheet() {
  return (
    <svg viewBox="0 0 80 100" className="w-full h-full block" aria-hidden="true">
      <image
        href="/whale-mark.svg"
        x="7" y="12" width="66" height="40"
        preserveAspectRatio="xMidYMid meet"
      />
      <rect x={22} y={62} width={36} height={2.4} rx={1.2} fill="#111" opacity={0.28} />
      <rect x={30} y={69} width={20} height={1.8} rx={0.9} fill="#111" opacity={0.14} />
    </svg>
  );
}
