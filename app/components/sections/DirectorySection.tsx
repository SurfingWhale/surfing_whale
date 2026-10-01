// app/components/sections/DirectorySection.tsx
// Server Component — the rows are a fixed list, so nothing is fetched here.
//
// An index of the written-up work, above the cards rather than instead of
// them. The cards are the display: they fan, they hold three sheets each, they
// are the part worth looking at. What they are not is scannable — six tiles
// is two screens, and a visitor who wants to know the shape of the work before
// committing to any of it has nowhere to look. This is that place. One line
// per study, the year, the method, and the picture of whichever row you are
// on; then the cards below, unchanged.
import { type WorkRow } from "@/app/components/WorkIndex";
import { WorkStage } from "@/app/components/WorkStage";
import { SectionLabel } from "@/app/components/SectionLabel";

// Grouped by the kind of claim the work makes, not by date. "Spatial" and
// "Built" are two different things to be able to do, and a reader deciding
// whether to keep reading is usually asking which of them they came for.
// Ordered so the strongest cluster leads; rows keep their order inside it.
const ROWS: WorkRow[] = [
  {
    href: "/work/finance-dashboard",
    title: "A ledger that behaves like a product",
    short: "Finance dashboard",
    year: "26",
    method: "Double-entry GL · reconciliation, prorate on working days, forecasting",
    group: "Built",
    image: "/work/finance/01-beranda.jpg",
    backdrop: "/work/stage/finance.jpg",
    alt: "The finance dashboard's home screen.",
  },
  {
    href: "/work/padel",
    title: "Padel, and the moat nobody has dug",
    short: "Padel",
    year: "26",
    method: "Gap analysis · 140 courts against BPS population, 22 kelurahan",
    group: "Spatial",
  },
  {
    href: "/work/coffee-access",
    title: "15 minutes to coffee",
    short: "Tomoro",
    year: "25",
    method: "Isochrone · drive-time bands against where people live",
    group: "Spatial",
    image: "/work/sheets/coffee-1.jpg",
    backdrop: "/work/stage/coffee.jpg",
    alt: "Drive-time bands over Jabodetabek.",
  },
  {
    href: "/work/crime-la",
    title: "Reading Los Angeles by its crime reports",
    short: "Crime LA",
    year: "23",
    method: "Early work · pandas, folium, EDA and prediction",
    group: "Early",
    image: "/work/sheets/crime-1.jpg",
    backdrop: "/work/stage/crime.jpg",
    alt: "Charts from the Los Angeles crime analysis.",
  },
  {
    href: "/work/tracker-doc",
    title: "TrackerDoc",
    short: "TrackerDoc",
    year: "26",
    method: "Internal tool · Sheets and Apps Script, an approval queue",
    group: "Built",
    image: "/work/tracker/approval-flow.svg",
    alt: "The document approval flow.",
  },
];

export function DirectorySection() {
  return (
    <section data-spot id="directory" className="w-full py-16 sm:py-24 border-t border-border">
      <div data-reveal className="frame frame-split">
        <SectionLabel note="Everything with a page of its own.">Index</SectionLabel>
        <div className="mt-8">
          <WorkStage label="Work" rows={ROWS} />
        </div>
      </div>
    </section>
  );
}
