// app/components/FinanceSheets.tsx
// The three sheets inside the finance folder, drawn as the product's own
// screens rather than as generic documents: the Beranda header, the monthly
// recap card, and the mark itself.
//
// Still drawn rather than screenshotted — at ~158px wide a real capture is an
// unreadable smear, while these read at a glance. Everything that identifies
// a sheet stays above y=60: the folder's front flap covers the lower half
// even when open, so anything below that is drawn for no one.
//
// The whale is /public/whale-mark.svg — Fauzy's logo, traced from the PNG he
// drew rather than redrawn by hand, carrying its own gradient.

const INK = "#111111";

function Line({
  x = 9, y, w, h = 2.2, o = 0.16, fill = INK, r,
}: {
  x?: number; y: number; w: number; h?: number; o?: number; fill?: string; r?: number;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={r ?? h / 2} fill={fill} opacity={o} />;
}

const frame = "w-full h-full block";

/** Beranda — the teal header, the hidden balance, the two flows beneath it. */
export function BerandaSheet() {
  return (
    <svg viewBox="0 0 80 100" className={frame} aria-hidden="true">
      <defs>
        <linearGradient id="sw-beranda" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14526A" />
          <stop offset="1" stopColor="#1C8A93" />
        </linearGradient>
        <clipPath id="sw-beranda-clip">
          <path d="M0 0h80v46a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#sw-beranda-clip)">
        <rect width="80" height="52" fill="url(#sw-beranda)" />
        {/* The mark sits behind the figures on the real screen too. */}
        <image
          href="/whale-mark.svg"
          x="16" y="2" width="70" height="50"
          opacity="0.11" preserveAspectRatio="xMidYMid slice"
        />
      </g>

      {/* Greeting */}
      <Line x={6} y={7} w={13} h={1.6} fill="#fff" o={0.5} />
      <Line x={6} y={11} w={9} h={2.4} fill="#fff" o={0.9} />

      {/* DANA LIKUID, then the amount with its eye closed */}
      <Line x={6} y={21} w={14} h={1.4} fill="#fff" o={0.55} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={8.5 + i * 6} cy={29} r={2.3} fill="#fff" opacity={0.95} />
      ))}

      {/* Pemasukan / Pengeluaran */}
      <rect x={6} y={36} width={32} height={10} rx={3} fill="#fff" opacity={0.16} />
      <rect x={42} y={36} width={32} height={10} rx={3} fill="#fff" opacity={0.16} />
      <circle cx={11} cy={41} r={2} fill="#4ADE80" opacity={0.85} />
      <circle cx={47} cy={41} r={2} fill="#F87171" opacity={0.85} />
      <Line x={15} y={40} w={13} h={2} fill="#fff" o={0.75} />
      <Line x={51} y={40} w={13} h={2} fill="#fff" o={0.75} />

      {/* The five section shortcuts under the header */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect
            x={5.5 + i * 14} y={57} width={11} height={11} rx={3.2}
            fill="#fff" stroke={INK} strokeOpacity={0.08} strokeWidth={0.6}
          />
          <rect x={8 + i * 14} y={61} width={6} height={3} rx={1} fill={INK} opacity={0.3} />
          <Line x={6.5 + i * 14} y={70} w={9} h={1.4} o={0.14} />
        </g>
      ))}
    </svg>
  );
}

/** The monthly recap — a ribbon, a persona, and what it made of the month. */
export function RecapSheet() {
  return (
    <svg viewBox="0 0 80 100" className={frame} aria-hidden="true">
      <defs>
        <clipPath id="sw-recap-clip">
          <rect x="6" y="6" width="68" height="24" rx="3" />
        </clipPath>
      </defs>

      {/* The looping MONTHLY RECAP ribbon, as its silhouette. */}
      <rect x={6} y={6} width={68} height={24} rx={3} fill="#0E0E0E" />
      <g clipPath="url(#sw-recap-clip)" fill="none" stroke="#fff" strokeOpacity={0.9}>
        <ellipse cx={24} cy={17} rx={15} ry={9} strokeWidth={2.6} transform="rotate(-18 24 17)" />
        <ellipse cx={46} cy={20} rx={17} ry={8} strokeWidth={2.2} transform="rotate(14 46 20)" />
        <ellipse cx={62} cy={12} rx={13} ry={7} strokeWidth={2.4} transform="rotate(-24 62 12)" />
      </g>

      {/* Sang Penikmat, then the tag under it */}
      <Line y={36} w={34} h={4} o={0.86} />
      <Line y={44} w={15} h={2.2} fill="#12A5A0" o={0.95} />

      {/* What the month was made of */}
      <Line y={52} w={30} h={2.6} o={0.5} />
      <Line y={58.5} w={36} h={2.6} o={0.5} />
      <Line y={65} w={26} h={2.6} o={0.5} />

      <rect x={9} y={74} width={62} height={0.6} fill={INK} opacity={0.12} />
      <Line y={78} w={24} h={2} o={0.16} />
    </svg>
  );
}

/** The mark on its own. */
export function MarkSheet() {
  return (
    <svg viewBox="0 0 80 100" className={frame} aria-hidden="true">
      <image
        href="/whale-mark.svg"
        x="7" y="12" width="66" height="40"
        preserveAspectRatio="xMidYMid meet"
      />
      <Line x={22} y={62} w={36} h={2.4} o={0.28} />
      <Line x={30} y={69} w={20} h={1.8} o={0.14} />
    </svg>
  );
}
