// app/components/PadelSheets.tsx
//
// Artwork for the padel folder, drawn from the same data as the case study's
// map rather than invented: MapSheet is the 22 kelurahan at their real
// centroids, MoatSheet is the community-moat ranking.
//
// Both are drawn rather than screenshotted because a folder sheet is ~150px
// wide — a screenshot of a map at that size is a grey smear, while a dot
// pattern and five bars still read.
import { KELURAHAN, perCapita } from "@/app/work/padel/kelurahan";

const LATS = KELURAHAN.map((k) => k.lat);
const LNGS = KELURAHAN.map((k) => k.lng);
const [minLat, maxLat] = [Math.min(...LATS), Math.max(...LATS)];
const [minLng, maxLng] = [Math.min(...LNGS), Math.max(...LNGS)];
const MAX_POP = Math.max(...KELURAHAN.map((k) => k.pop));
const MAX_PC = Math.max(...KELURAHAN.map(perCapita));

/** The gap map, reduced to what survives at thumbnail size. */
export function MapSheet() {
  return (
    <svg viewBox="0 0 80 100" className="w-full h-full block" aria-hidden="true">
      {KELURAHAN.map((k) => {
        const cx = 9 + ((k.lng - minLng) / (maxLng - minLng)) * 62;
        const cy = 92 - ((k.lat - minLat) / (maxLat - minLat)) * 84;
        const r = 1.9 + Math.sqrt(k.pop / MAX_POP) * 4.2;
        const supply = perCapita(k) / MAX_PC;
        return (
          <circle
            key={k.name}
            cx={cx}
            cy={cy}
            r={r}
            fill="#111"
            fillOpacity={0.05 + supply * 0.5}
            stroke="#111"
            strokeOpacity={k.courts === 0 ? 0.7 : 0.16}
            strokeWidth={k.courts === 0 ? 0.7 : 0.3}
            strokeDasharray={k.courts === 0 ? "1.2 1" : undefined}
          />
        );
      })}
    </svg>
  );
}

/** The moat ranking. Sense Padel is the one picked out. */
const MOAT: [string, number][] = [
  ["Quattro Padel", 59.1],
  ["Hi Padel Andara", 39.8],
  ["three one three", 36.7],
  ["Sense Padel Margasatwa", 35.7],
  ["Sense Padel Kemang", 19.4],
];

export function MoatSheet() {
  return (
    <svg viewBox="0 0 80 100" className="w-full h-full block" aria-hidden="true">
      {MOAT.map(([name, v], i) => {
        const on = name === "Sense Padel Margasatwa";
        return (
          <g key={name}>
            <rect
              x="10"
              y={9 + i * 17}
              width={(v / 60) * 56}
              height="6.4"
              rx="3.2"
              fill="#111"
              opacity={on ? 0.62 : 0.2}
            />
          </g>
        );
      })}
      {/* The 60 nobody reaches — the finding the sheet is standing in for. */}
      <line
        x1="70"
        y1="5"
        x2="70"
        y2="93"
        stroke="#111"
        strokeOpacity="0.3"
        strokeWidth="0.6"
        strokeDasharray="1.6 1.6"
      />
    </svg>
  );
}
