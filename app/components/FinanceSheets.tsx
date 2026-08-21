// app/components/FinanceSheets.tsx
// The three documents inside the finance folder. They are drawn rather than
// photographed: at ~158px wide a real screenshot is an unreadable smear,
// whereas a diagram of the same screen still says "chart", "journal",
// "statement" at a glance. Deliberately abstract — nothing here pretends to
// be a figure from the live product.
//
// Everything that identifies a sheet lives above y=60. The folder's front
// flap covers the lower half even when open, so anything below that is
// drawn for no one.
//
// Ink is a fixed dark because the paper is fixed white in both themes;
// currentColor would make these vanish the moment the page goes dark.

const INK = "#111111";
const ACCENT = "#c8ddd4";

function Line({
  x = 9,
  y,
  w,
  h = 2.2,
  o = 0.16,
  fill = INK,
}: {
  x?: number;
  y: number;
  w: number;
  h?: number;
  o?: number;
  fill?: string;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} opacity={o} />;
}

const frame = "w-full h-full block";

/** Buku Besar — a ledger, so: paired columns and a balancing rule. */
export function LedgerSheet() {
  const rows = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 80 100" className={frame} aria-hidden="true">
      <Line y={8} w={24} h={2.6} o={0.5} />
      <Line y={13.5} w={13} h={1.8} o={0.18} />

      {/* Column heads, then debit/credit pairs down the page. */}
      <Line y={21} w={15} h={1.6} o={0.3} />
      <Line x={54} y={21} w={17} h={1.6} o={0.3} />
      {rows.map((i) => (
        <g key={i}>
          <Line y={27 + i * 6.4} w={19 + ((i * 7) % 12)} o={0.14} />
          <Line x={71 - (9 + ((i * 5) % 7))} y={27 + i * 6.4} w={9 + ((i * 5) % 7)} o={0.22} />
        </g>
      ))}

      <rect x={9} y={62} width={62} height={0.7} fill={INK} opacity={0.26} />
      <Line y={66} w={16} h={2.6} o={0.45} />
      <Line x={54} y={66} w={17} h={2.6} o={0.6} />
    </svg>
  );
}

/** The dashboard — one large figure, then the month in bars. */
export function DashboardSheet() {
  const bars = [13, 21, 9, 27, 16, 23];
  const base = 60;
  return (
    <svg viewBox="0 0 80 100" className={frame} aria-hidden="true">
      <Line y={8} w={20} h={1.8} o={0.26} />
      {/* The hero figure carries the most weight, as it does in the product. */}
      <Line y={13} w={40} h={6.4} o={0.7} />
      <Line y={23} w={26} h={1.8} o={0.16} />

      {bars.map((h, i) => (
        <rect
          key={i}
          x={9 + i * 10.4}
          y={base - h}
          width={7.4}
          height={h}
          rx={1.4}
          fill={i === 3 ? ACCENT : INK}
          opacity={i === 3 ? 1 : 0.15}
        />
      ))}
      <rect x={9} y={base} width={62} height={0.7} fill={INK} opacity={0.2} />

      <Line y={66} w={28} h={1.8} o={0.16} />
      <Line y={71} w={18} h={1.8} o={0.1} />
    </svg>
  );
}

/** Laporan Keuangan — nested headings, indented lines, a ruled total. */
export function StatementSheet() {
  return (
    <svg viewBox="0 0 80 100" className={frame} aria-hidden="true">
      <Line y={8} w={27} h={2.6} o={0.5} />
      <Line y={13.5} w={16} h={1.8} o={0.18} />

      <Line y={21} w={18} h={1.8} o={0.32} />
      <Line x={13} y={26.5} w={27} h={1.8} o={0.13} />
      <Line x={60} y={26.5} w={11} h={1.8} o={0.2} />
      <Line x={13} y={32} w={22} h={1.8} o={0.13} />
      <Line x={63} y={32} w={8} h={1.8} o={0.2} />

      <Line y={40} w={22} h={1.8} o={0.32} />
      <Line x={13} y={45.5} w={30} h={1.8} o={0.13} />
      <Line x={58} y={45.5} w={13} h={1.8} o={0.2} />
      <Line x={13} y={51} w={24} h={1.8} o={0.13} />
      <Line x={62} y={51} w={9} h={1.8} o={0.2} />

      <rect x={9} y={58} width={62} height={0.7} fill={INK} opacity={0.26} />
      <Line y={62} w={17} h={2.6} o={0.45} />
      <rect x={50} y={61.7} width={21} height={3.2} rx={1.6} fill={ACCENT} />
      <Line y={71} w={23} h={1.8} o={0.1} />
    </svg>
  );
}
