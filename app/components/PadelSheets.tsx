// app/components/PadelSheets.tsx
//
// Artwork for the padel folder, drawn from the case study's own data.
//
// The first version of this file put grey bars and scattered dots on the
// sheets and they read as a loading skeleton, not as content — which is fair,
// because that is exactly what low-opacity rounded bars look like. These are
// crops of the real maps instead.
//
// Only about the top fifth of a sheet clears the folder flap while it is shut,
// so IsoSheet is framed on the dense core of the isochrone map rather than on
// the whole thing: the strip that shows is textured, not empty.
import { SHEET_RIVALS, SHEET_SENSE } from "@/app/work/padel/isochrone-sheet";
import { KELURAHAN, perCapita } from "@/app/work/padel/kelurahan";

// The thinned, hard-simplified copy — see isochrone-sheet.ts for why the full
// set must not be imported here.
/** The saturated core of the isochrone map. */
export function IsoSheet() {
  return (
    <svg viewBox="300 205 500 625" className="w-full h-full block" aria-hidden="true">
      {SHEET_RIVALS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="#111"
          fillOpacity={0.02}
          stroke="#111"
          strokeOpacity={0.2}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
      ))}
      {SHEET_SENSE.map((d, i) => (
        <path
          key={`s${i}`}
          d={d}
          fill="none"
          stroke="#111"
          strokeOpacity={0.9}
          strokeWidth={7}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const LATS = KELURAHAN.map((k) => k.lat);
const LNGS = KELURAHAN.map((k) => k.lng);
const [minLat, maxLat] = [Math.min(...LATS), Math.max(...LATS)];
const [minLng, maxLng] = [Math.min(...LNGS), Math.max(...LNGS)];
const MAX_POP = Math.max(...KELURAHAN.map((k) => k.pop));
const MAX_PC = Math.max(...KELURAHAN.map(perCapita));

/** The Bintaro gap map, filling the sheet. */
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
