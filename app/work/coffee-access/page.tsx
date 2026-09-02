// app/work/coffee-access/page.tsx
//
// "15 Minutes to Coffee" — Fauzy's isochrone study of Tomoro Coffee against
// housing around Bintaro, from the WIP_Projects Notion database (Oct 2025).
//
// The note is embedded as the document it is (§02) rather than paraphrased.
// An earlier draft rewrote it across four sections of my own prose, which was
// longer than the note and told the reader less about it.
//
// What is left around the document is an English lead-in for a reader who
// cannot read it, and the limits it does not state about itself (§03).
//
// There is no map on this page and there cannot be one yet. Checked, in
// order: the Notion page carries no embed, Learn_Spatial_Data_Analytics
// holds a single 0-byte notebook with empty data directories, no Tomoro
// deployment exists (only the two padel ones), and Overpass, Google Maps,
// CARTO and ORS are all unreachable or need keys. Drawing something that
// merely illustrates the three findings would look like evidence and not be
// any, so §03 tells the reader the overlay is gone instead.
import type { Metadata } from "next";
import Link from "next/link";
import { DocPreview } from "@/app/components/DocPreview";
import { FieldNote } from "./FieldNote";

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

        <Section number="02" title="The note itself">
          <p>
            Rather than restate it: here is the field note as written — the
            background, the method, the three preliminary findings and the
            argument it closes on. It is in the Indonesian it was written in.
          </p>
          <DocPreview
            title="15 Minutes to Coffee — Bintaro"
            meta="From the WIP_Projects database in Notion, October 2025. Trimmed of the four alternative framings drafted before this one, and of the assistant chatter the page trails off into. The article itself is unedited."
          >
            <FieldNote />
          </DocPreview>
          <Rows
            head={["Layer", "Where it came from"]}
            rows={[
              ["Branch locations", "Scraped from Google Maps and OpenStreetMap"],
              ["5 / 10 / 15-minute reach", "CARTO isochrone API over the Jabodetabek road network"],
              ["Subsidised housing", "Tapera"],
              ["Everything else residential", "OpenStreetMap residential tags"],
            ]}
          />
        </Section>

        <Section number="03" title="Where this stops">
          <p>
            These are preliminary findings and they should be read as such.
            They are patterns read off an overlay, not counts: no share of
            estates inside each band has been computed, and no significance
            has been tested. The three findings in the note are what the map
            plainly showed, and no more than that.
          </p>
          <p>
            And the map itself is gone. The note says &ldquo;dari peta yang
            dihasilkan&rdquo; — from the map produced — but that overlay was
            never exported: not to an image, not to a repository, not to a
            deployment. So this page cannot show you the thing the findings
            were read from, and it is not going to draw a substitute and let
            it pass for the original. That is the real difference between this
            and the padel study next door, where the map is still live and
            embedded.
          </p>
          <p>
            Two limits in the data underneath. Tapera only covers subsidised
            stock, so the non-subsidised side of the comparison rests on
            OpenStreetMap tagging, which is uneven. And there is no
            public-transport layer yet — which is awkward, because the third
            finding is precisely a claim about transport.
          </p>
        </Section>

        <Section number="04" title="What would finish it">
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

        <Section number="05" title="Related">
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
