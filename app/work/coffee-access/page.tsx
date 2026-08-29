// app/work/coffee-access/page.tsx
//
// "15 Minutes to Coffee" — Fauzy's isochrone study of Tomoro Coffee against
// housing around Bintaro, from the WIP_Projects Notion database (Oct 2025).
// The question, the method, the three findings and the closing argument are
// his; this page puts them in the site's own type scale and language.
//
// Deliberately framed as a field note, not a case study: the findings are
// read off a map rather than counted, and §6 says so. Nothing here is
// quantified beyond what his own notes quantify — no invented figures, and
// no chart, because the map was never exported.
import type { Metadata } from "next";
import Link from "next/link";

const TITLE = "15 minutes to coffee";
const DESCRIPTION =
  "Mapping how far a Tomoro branch actually reaches around Bintaro, and which housing falls outside it. An isochrone read of access, class and the cost of time.";

export const metadata: Metadata = {
  title: `${TITLE} — Surfing Whale`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

const column = "container mx-auto px-6 max-w-[680px]";
const prose = "text-[13px] leading-[2] text-fg-body";

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 border-t border-border">
      <div className={column}>
        <div className="flex items-baseline gap-4 mb-4">
          <span className="font-mono text-[11px] text-fg-muted">{number}</span>
          <h2 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            {title}
          </h2>
        </div>
        <div className={`space-y-4 ${prose}`}>{children}</div>
      </div>
    </section>
  );
}

/** A two-column list without a <table>'s styling problems at 13px. */
function Rows({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="my-5 border-t border-border">
      <div className="grid grid-cols-[1fr_1.4fr] gap-4 py-2 border-b border-border">
        {head.map((h) => (
          <span
            key={h}
            className="text-[11px] uppercase tracking-[0.14em] text-fg-label"
          >
            {h}
          </span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1.4fr] gap-4 py-2.5 border-b border-border"
        >
          {row.map((cell, k) => (
            <span
              key={k}
              className={
                k === 0
                  ? "text-[13px] leading-[1.8] text-fg"
                  : "text-[13px] leading-[1.8] text-fg-body"
              }
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function CoffeeAccessPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className={`${column} h-14 flex items-center`}>
          <Link
            href="/#project"
            className="text-[13px] text-fg-secondary hover:text-fg transition-colors duration-300"
          >
            ← Work
          </Link>
        </div>
      </nav>

      <article className="py-16">
        <header className={`${column} mb-6`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
            Field note · October 2025
          </p>
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            15 minutes to coffee
          </h1>
          <p className={`${prose} mt-4 max-w-[560px]`}>
            Reading the spatial pattern of Tomoro Coffee against the housing
            around Bintaro — where the fifteen-minute reach lands, and which
            neighbourhoods sit just outside it.
          </p>
        </header>

        <Section number="01" title="The question">
          <p>
            Two things have been growing side by side in the commuter belt
            south of Jakarta: fast-format coffee chains, and mid-market
            housing. Bintaro has plenty of both. That is easy to notice from a
            car window and hard to say anything useful about.
          </p>
          <p>
            So the question was narrowed until it could be measured: does a
            chain like Tomoro sit in a particular spatial relationship to that
            housing, or is it just following main roads? Housing estates are no
            longer only places to sleep — they carry their own small economies,
            shopfronts, coworking, daily services. If the coffee follows the
            estates rather than the traffic, that is a claim about who the
            format is for.
          </p>
        </Section>

        <Section number="02" title="Measuring reach in minutes, not metres">
          <p>
            A radius drawn on a map is a lie in a city — 800 metres across a
            toll road is not 800 metres along it. So the unit here is travel
            time, not distance: isochrones at five, ten and fifteen minutes
            from each branch, computed over the actual Jabodetabek road
            network.
          </p>
          <p>
            The fifteen-minute figure is borrowed on purpose. It is the
            headline number of the <em>15-minute city</em>, and the point of
            using it here is to see what it means somewhere it was never
            designed for.
          </p>
          <Rows
            head={["Layer", "Where it came from"]}
            rows={[
              ["Branch locations", "Scraped from Google Maps and OpenStreetMap"],
              ["5 / 10 / 15-minute reach", "CARTO isochrone API over the Jabodetabek road network"],
              ["Subsidised housing", "Tapera"],
              ["Everything else residential", "OpenStreetMap residential tags"],
            ]}
          />
          <p>
            The isochrone layers were then overlaid on the housing points, and
            the overlaps read off by zone.
          </p>
        </Section>

        <Section number="03" title="What the map showed">
          <p>Three things, in the order they became obvious.</p>
          <p>
            <strong className="font-medium text-fg">
              The branches cluster inside ten minutes of sectors 3 to 9.
            </strong>{" "}
            That band is the known pocket of mid-to-upper housing, and the one
            with the most small-business activity around it. The coffee is
            where the estates are, not spread evenly across the map.
          </p>
          <p>
            <strong className="font-medium text-fg">
              East Ciputat and Pondok Cabe fall outside fifteen minutes.
            </strong>{" "}
            Both are densely housed. Neither has a branch within a
            quarter-hour&apos;s drive. Read one way that is an expansion gap;
            read the other, it is the same gap that separates two kinds of
            household living four kilometres apart.
          </p>
          <p>
            <strong className="font-medium text-fg">
              The branches sit on private-car routes, not transit routes.
            </strong>{" "}
            Almost every location is on a road you would drive rather than one
            you would arrive at by angkot or KRL. Which means the fifteen
            minutes being measured is fifteen minutes <em>with a car</em>.
            Access to coffee is standing in for access to a vehicle.
          </p>
        </Section>

        <Section number="04" title="Why this is worth mapping at all">
          <p>
            An isochrone is not a distance, it is a claim about time — and in a
            city time is the expensive thing. Mapping where a coffee chain can
            be reached in fifteen minutes turns out to be a cheap proxy for
            mapping who can spend fifteen minutes that way at all.
          </p>
          <p>
            The 15-minute city arrives in Bintaro in translated form. It is not
            about every civic function being close by. It is about whether the
            lifestyle infrastructure is inside a distance you can cover without
            losing the part of the evening you were trying to keep.
          </p>
          <blockquote className="border-l-2 border-border-strong pl-5 my-2">
            <p className="text-fg">
              Map the coffee and you are really mapping class, and the rhythm
              that comes with it.
            </p>
          </blockquote>
        </Section>

        <Section number="05" title="Where this stops">
          <p>
            These are preliminary findings and they should be read as such.
            They are patterns read off an overlay, not counts: no share of
            estates inside each band has been computed, and no significance
            has been tested. The three statements above are what the map
            plainly shows, and no more than that.
          </p>
          <p>
            Two limits in the data underneath. Tapera only covers subsidised
            stock, so the non-subsidised side of the comparison rests on
            OpenStreetMap tagging, which is uneven. And there is no
            public-transport layer yet — which is awkward, because the third
            finding is precisely a claim about transport.
          </p>
        </Section>

        <Section number="06" title="What would finish it">
          <p>
            Counting, first: the share of housing inside the ten-minute band
            per zone, so the first finding becomes a number rather than an
            impression.
          </p>
          <p>
            Then the transport layer, to test the car claim properly rather
            than infer it from road type. Then GrabFood and small-business
            density, to see whether the micro-economy leads the coffee or
            follows it. And an interactive map, so the overlay can be examined
            instead of described.
          </p>
        </Section>

        <Section number="07" title="Related">
          <p>
            The same isochrone method, applied to padel courts rather than
            coffee, is the{" "}
            <Link
              href="/#project"
              className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
              Padel Bintaro gap analysis
            </Link>{" "}
            in the list of other work — same city, same technique, a different
            thing being placed.
          </p>
        </Section>
      </article>
    </main>
  );
}
