// app/work/crime-la/page.tsx
//
// The Los Angeles crime analysis, from the Unveiling-Crime-Trends-in-Lost-
// Angeles repo (2023). Tagged #Finished in Notion but it never appeared in
// the site's project list, so it is written up here directly.
//
// The account handle stays out of this file on purpose — it ends up in the
// server source map, and the rule is that it appears nowhere a build emits.
//
// This is deliberately framed as early work rather than dressed up as a
// study. It is an exercise in loading, cleaning and plotting a public
// dataset — the README says as much — and the honest interest is the
// distance between it and the padel analysis two years later.
import type { Metadata } from "next";
import Link from "next/link";
import { EmbedFrame } from "@/app/components/EmbedFrame";

const TITLE = "Reading Los Angeles by its crime reports";
const DESCRIPTION =
  "An early pass at a public dataset: cleaning LAPD crime records, plotting where and against whom, and putting the Harbor area's worst thirty blocks on a map.";

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
const linkish =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200";

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

function Chart({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-6 -mx-6 sm:mx-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/work/crime/${src}.jpg`}
        alt={alt}
        loading="lazy"
        className="w-full h-auto block bg-white border-y sm:border border-border sm:rounded-lg"
      />
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2 px-6 sm:px-0">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function CrimeLAPage() {
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
            Early work · 2023
          </p>
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            {TITLE}
          </h1>
          <p className={`${prose} mt-4 max-w-[560px]`}>
            The LAPD publishes every reported crime with a date, a location and
            a victim. This was an early pass at it — load, clean, plot, and see
            what the shape of the city looks like from the report log.
          </p>
        </header>

        <Section number="01" title="Where the reports land">
          <p>
            The first question a dataset like this answers is the least
            interesting one, and it still has to be asked: where do the reports
            come from? Counts by LAPD area, straight off the cleaned frame.
          </p>
          <Chart
            src="counts-by-area"
            alt="Bar chart of reported crime counts by Los Angeles police area."
            caption="Reports by area. The ranking is the whole finding — no rate, no population denominator, so this is volume and not risk."
          />
          <p>
            That last caveat matters more than the chart. A count is not a rate:
            an area with more people, more reporting and more patrols produces
            more records without being more dangerous. Nothing here divides by
            population, so this says where reports are filed, not where you are
            most likely to be a victim.
          </p>
        </Section>

        <Section number="02" title="Who appears in them">
          <Chart
            src="victim-ages"
            alt="Histogram of victim ages across the dataset."
            caption="Victim age distribution."
          />
          <p>
            Ages cluster hard through the twenties and thirties and thin out
            either side. The zero bucket is the one to be careful with: in this
            data an unknown age is often recorded as 0 rather than left blank,
            so the leftmost bar is partly missing data wearing a number.
          </p>
          <Chart
            src="code-by-area"
            alt="Box plot of crime code distribution by area."
            caption="Crime codes by area — the spread, not the average."
          />
        </Section>

        <Section number="03" title="The Harbor, block by block">
          <p>
            The map is the part worth keeping. Filtered to the Harbor area,
            grouped by exact coordinate, the thirty locations with the most
            reports — each pin carrying its address and count.
          </p>
          <EmbedFrame
            src="/work/crime/harbor-map.html"
            title="Top thirty crime locations in the Harbor area"
            caption="Thirty pins, one per location, ranked by report count. Served from this site."
          />
          <p>
            Grouping by exact latitude and longitude is a blunt instrument — it
            treats one address as one place, so a large site reported under a
            single coordinate outranks a street where reports spread across
            several. The pins are real; the ranking between them is softer than
            it looks.
          </p>
        </Section>

        <Section number="04" title="A bug, left in">
          <p>
            One chart from the original run is worth keeping precisely because
            it is broken.
          </p>
          <Chart
            src="crime-location"
            alt="Scatter plot of crime locations: a dense cluster at longitude -118, and a single point at 0,0 that stretches the axes across the whole plot."
            caption="Crime locations, as originally plotted."
          />
          <p>
            Los Angeles sits at roughly &minus;118&deg;. The axes here run to
            zero, because some rows carry no coordinate and the export writes
            those as{" "}
            <span className="font-mono text-fg">0, 0</span> rather than leaving
            them empty — a point in the Atlantic off West Africa, which
            analysts call null island. Two or three of those drag the frame
            wide enough that the entire city collapses into a smudge in the
            corner.
          </p>
          <p>
            Nothing filtered them, and nothing in the notebook noticed. The
            cleaning step dropped rows missing a premises description and
            stopped there. It is a small bug with a useful shape: missing data
            that arrives as a plausible number is far more dangerous than
            missing data that arrives as a blank, because only one of the two
            survives a null check.
          </p>
        </Section>

        <Section number="05" title="What this is, honestly">
          <p>
            This is 2023 work and it shows: it loads, cleans and plots, and it
            stops there. There is no question driving it, no denominator, and
            nothing anyone could act on at the end.
          </p>
          <p>
            It is on the site because the distance is the point. Two years
            later the{" "}
            <Link href="/work/padel" className={linkish}>
              padel study
            </Link>{" "}
            starts from a question, names its own blind spots, and ends on four
            things it cannot answer. Same tools — pandas, folium, a public
            dataset. Different discipline.
          </p>
          <p>
            The notebook version of this analysis is on{" "}
            <a
              href="https://www.kaggle.com/code/muhammadfauzy43/eda-prediction-of-los-angeles-crime-by-edit"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              Kaggle
            </a>
            .
          </p>
        </Section>
      </article>
    </main>
  );
}
