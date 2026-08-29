// app/work/padel/GapMap.tsx
//
// The 22 kelurahan plotted from their own centroids. No basemap on purpose:
// the folium original sat on OpenStreetMap tiles, and at this size the tiles
// are noise the reader has to look past. What carries the finding is where
// the supply is not, and that reads better against nothing.
//
// Area encodes population, fill encodes supply per capita. Circle area is
// proportional to population (r scales with the square root) — sizing by
// radius would overstate the big kelurahan by the square.
import { KELURAHAN, perCapita, type Kelurahan } from "./kelurahan";

// Plate carrée is fine over an 0.09° span; x is scaled by cos(lat) so the
// aspect is not stretched at 6°S.
const LATS = KELURAHAN.map((k) => k.lat);
const LNGS = KELURAHAN.map((k) => k.lng);
const [minLat, maxLat] = [Math.min(...LATS), Math.max(...LATS)];
const [minLng, maxLng] = [Math.min(...LNGS), Math.max(...LNGS)];
const KX = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);

const PAD = 11;
const W = 100;
const H = Math.round(
  ((maxLat - minLat) / ((maxLng - minLng) * KX)) * (W - PAD * 2) + PAD * 2
);

const x = (lng: number) =>
  PAD + ((lng - minLng) / (maxLng - minLng)) * (W - PAD * 2);
const y = (lat: number) =>
  H - PAD - ((lat - minLat) / (maxLat - minLat)) * (H - PAD * 2);

const MAX_POP = Math.max(...KELURAHAN.map((k) => k.pop));
const r = (k: Kelurahan) => 2.1 + Math.sqrt(k.pop / MAX_POP) * 5.2;

/** Supply per capita, normalised against the best-served kelurahan. */
const MAX_PC = Math.max(...KELURAHAN.map(perCapita));
const supply = (k: Kelurahan) => perCapita(k) / MAX_PC;

export function GapMap() {
  const starved = KELURAHAN.filter((k) => k.courts === 0);

  return (
    <figure className="my-6 -mx-6 sm:mx-0">
      <div className="bg-bg-muted border-y sm:border border-border sm:rounded-lg px-6 py-7 sm:px-8">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block max-w-[380px] mx-auto text-fg"
          role="img"
          aria-label={`Map of ${KELURAHAN.length} kelurahan around Bintaro. Circle size is population, fill is padel courts per head. ${starved
            .map((k) => k.name)
            .join(" and ")} have no courts at all.`}
        >
          {KELURAHAN.map((k) => (
            <circle
              key={k.name}
              cx={x(k.lng)}
              cy={y(k.lat)}
              r={r(k)}
              fill="currentColor"
              fillOpacity={0.06 + supply(k) * 0.62}
              stroke="currentColor"
              strokeOpacity={k.courts === 0 ? 0.85 : 0.25}
              strokeWidth={k.courts === 0 ? 0.9 : 0.4}
              strokeDasharray={k.courts === 0 ? "1.6 1.4" : undefined}
            />
          ))}

        </svg>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-[11px] leading-[1.6] text-fg-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-fg opacity-[0.68]" />
            well served
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-fg opacity-[0.1]" />
            barely served
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border border-dashed border-fg/70" />
            no courts
          </span>
          <span>circle area = population</span>
        </div>
      </div>
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2 px-6 sm:px-0">
        Twenty-two kelurahan, plotted from their own centroids. The two ringed
        circles are Pondok Aren and Perigi Lama — no padel court between them,
        and 53,442 people.
      </figcaption>
    </figure>
  );
}
