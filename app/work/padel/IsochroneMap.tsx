// app/work/padel/IsochroneMap.tsx
//
// The real thing: 142 ten-minute drive-time isochrones around south Jakarta,
// 140 competitors and the two Sense Padel venues.
//
// Drawn as outlines rather than filled areas on purpose. In a city this dense
// ten minutes from any one court covers much the same road network, so the
// polygons sit almost on top of each other — filling them would give one flat
// blob. Stroked at low opacity they accumulate instead: the darker the line,
// the more courts reach that street inside ten minutes. The dark core is the
// saturation the summary is about.
import { ISOCHRONES, SENSE, RIVALS, VIEWBOX } from "./isochrones";

export function IsochroneMap() {
  return (
    <figure className="my-6 -mx-6 sm:mx-0">
      <div className="bg-bg-muted border-y sm:border border-border sm:rounded-lg px-4 py-6 sm:px-6">
        <svg
          viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
          className="w-full h-auto block max-w-[420px] mx-auto text-fg"
          role="img"
          aria-label={`Map of ${ISOCHRONES.length} ten-minute drive-time areas around south Jakarta. ${RIVALS.length} belong to competing padel courts and overlap heavily; the two belonging to Sense Padel are picked out inside that mass.`}
        >
          {RIVALS.map((iso, i) => (
            <path
              key={i}
              d={iso.d}
              fill="currentColor"
              fillOpacity={0.012}
              stroke="currentColor"
              strokeOpacity={0.14}
              strokeWidth={1.1}
              strokeLinejoin="round"
            />
          ))}
          {SENSE.map((iso, i) => (
            <path
              key={`s${i}`}
              d={iso.d}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.95}
              strokeWidth={4}
              strokeLinejoin="round"
            />
          ))}
        </svg>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 text-[11px] leading-[1.6] text-fg-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block w-5 h-0 border-t-[3px] border-fg" />
            Sense Padel
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-5 h-0 border-t border-fg/30" />
            {RIVALS.length} competitors
          </span>
          <span>10 minutes by car</span>
        </div>
      </div>
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2 px-6 sm:px-0">
        Every court&rsquo;s ten-minute reach, drawn over every other
        court&rsquo;s. Where the lines pile up darkest, a player choosing a
        court that evening has well over a hundred of them within the same
        drive.
      </figcaption>
    </figure>
  );
}
