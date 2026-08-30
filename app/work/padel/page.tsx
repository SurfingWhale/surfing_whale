// app/work/padel/page.tsx
//
// Two padel studies from the Padel_Courts_Bintaro repo: the Bintaro gap
// analysis (22 kelurahan, BPS population, Google Maps supply) and the Pondok
// Labu strategic snapshot for Sense Padel Margasatwa.
//
// The strategic snapshot is embedded as the document it is (§04) rather than
// paraphrased — an earlier draft restated it across seven sections, which was
// both longer and less convincing than showing it.
//
// What this page adds around that document: a map built from the repo's own
// coordinates (§03), and the arithmetic the summary leaves implicit — the
// niche percentages come off a 41-review base, so "2.4%" is one review (§05).
import type { Metadata } from "next";
import Link from "next/link";
import { GapMap } from "./GapMap";
import { IsochroneMap } from "./IsochroneMap";
import { DocPreview } from "@/app/components/DocPreview";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { KELURAHAN, TOTAL_COURTS, TOTAL_POP, perCapita } from "./kelurahan";

const TITLE = "Padel, and the moat nobody has dug";
const DESCRIPTION =
  "Two spatial studies of padel around south Jakarta: where the supply gap is in Bintaro, and why a court in Pondok Labu competes with 140 others inside twenty minutes.";

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

/** Ranked bars. The number stays visible — the bar is the ranking, not the value. */
function Bars({
  rows,
  max,
  suffix = "",
  highlight,
}: {
  rows: [string, number][];
  max: number;
  suffix?: string;
  highlight?: string;
}) {
  return (
    <div className="my-5 border-t border-border">
      {rows.map(([label, value]) => {
        const on = label === highlight;
        return (
          <div key={label} className="py-2.5 border-b border-border">
            <div className="flex items-baseline justify-between gap-4">
              <span
                className={`text-[13px] leading-[1.8] ${on ? "font-medium text-fg" : "text-fg"}`}
              >
                {label}
              </span>
              <span className="text-[13px] leading-[1.8] text-fg-body tabular-nums flex-none">
                {value}
                {suffix}
              </span>
            </div>
            <div
              aria-hidden="true"
              className="mt-1.5 h-[3px] rounded-full bg-border"
            >
              <div
                className={`h-full rounded-full ${on ? "bg-fg" : "bg-border-strong"}`}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Rows({ head, rows }: { head: string[]; rows: string[][] }) {
  const cols =
    head.length === 3
      ? "grid gap-3 grid-cols-[1fr_auto_auto]"
      : "grid gap-3 grid-cols-[1fr_auto]";
  return (
    <div className="my-5 border-t border-border">
      <div className={`${cols} py-2 border-b border-border`}>
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
        <div key={i} className={`${cols} py-2.5 border-b border-border`}>
          {row.map((cell, k) => (
            <span
              key={k}
              className={
                k === 0
                  ? "text-[13px] leading-[1.8] text-fg"
                  : "text-[13px] leading-[1.8] text-fg-body tabular-nums"
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

// Best and worst provision per head. The two zero-court kelurahan sit at the
// bottom of the second list, which is the point of showing both.
const BY_PC = [...KELURAHAN].sort((a, b) => perCapita(b) - perCapita(a));
const TOP_PC = BY_PC.slice(0, 4);
const BOTTOM_PC = BY_PC.slice(-4);

export default function PadelPage() {
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
            Strategic snapshot · May 2026
          </p>
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            Padel, and the moat nobody has dug
          </h1>
          <p className={`${prose} mt-4 max-w-[560px]`}>
            Two studies of the same sport a few kilometres apart. One asks
            where the courts <em>should</em> go. The other asks what happens to
            a court once forty others are already inside ten minutes of it.
          </p>
        </header>

        <Section number="01" title="The question underneath the boom">
          <p>
            Padel has been the fastest-growing sport in Indonesia for three or
            four years. That is the part everybody agrees on. The part nobody
            checks is whether the courts being built are going anywhere near
            the people who would play on them.
          </p>
          <p>
            So: does supply follow demand geographically, or does it follow
            cheap land and a landlord who said yes? That question splits into
            two, and each needs a different method.
          </p>
          <Rows
            head={["Study", "Question"]}
            rows={[
              ["Bintaro Jaya", "Where is the gap — which neighbourhoods are underserved?"],
              ["Pondok Labu", "Given the gap is already filled, how does one court survive?"],
            ]}
          />
        </Section>

        <Section number="02" title="Bintaro: 22 kelurahan as the unit">
          <p>
            The scope was drawn to be defensible rather than convenient: 22
            kelurahan across three kecamatan, spanning two provinces —
            Pondok Aren and Ciputat Timur in Tangerang Selatan, Pesanggrahan in
            DKI Jakarta. Administrative boundaries, not a radius, because
            population data only exists at that grain.
          </p>
          <p>
            Supply came from the Google Maps Places API and was deduplicated by
            hand — false positives went to a separate file for review rather
            than being silently dropped. Population came from the BPS yearbooks
            for both cities. Courts were assigned to a kelurahan by Haversine
            distance, then reach was checked with OpenRouteService isochrones.
          </p>
          <p>The gap score is deliberately simple, and weighted on purpose:</p>
          <pre className="my-3 -mx-6 sm:mx-0 overflow-x-auto bg-bg-muted border-y sm:border border-border sm:rounded-lg px-6 sm:px-5 py-4">
            <code className="font-mono text-[11px] leading-[1.9] text-fg-body">
              gap_score = (court_scarcity × 0.6) + (population_density × 0.4)
            </code>
          </pre>
          <p>
            Scarcity outweighs density because the thing being located is a
            court, not a billboard: a dense area that already has four courts
            is not an opportunity. The weights are a judgement call, not a
            fitted parameter, and the ranking is only as good as that call.
          </p>
        </Section>

        <Section number="03" title="Where the gap actually is">
          <p>
            Across the 22 kelurahan there are {TOTAL_COURTS} courts serving{" "}
            {TOTAL_POP.toLocaleString("en-GB")} people. Plotted, the supply is
            not close to even.
          </p>
          <GapMap />
          <p>
            The gap score ranks Pondok Aren first at 0.79, then Perigi Lama at
            0.73. What the ranking hides is that those two are not merely
            underserved —{" "}
            <strong className="font-medium text-fg">
              they have no padel court at all
            </strong>
            , between them 53,442 people.
          </p>
          <p>
            Normalising to courts per 100,000 residents makes the spread
            legible in a way the 0-to-1 score does not:
          </p>
          <Bars
            rows={TOP_PC.map((k) => [k.name, Math.round(perCapita(k) * 10) / 10])}
            max={95}
            suffix=" per 100k"
          />
          <Bars
            rows={BOTTOM_PC.map((k) => [
              k.name,
              Math.round(perCapita(k) * 10) / 10,
            ])}
            max={95}
            suffix=" per 100k"
          />
          <p>
            Perigi Baru has 12 courts for 12,837 people. Pondok Kacang Timur
            has one for 37,947 — a 36-fold difference in provision between two
            kelurahan a short drive apart, and two more with none at all. That
            is the finding; the gap score is just the way it was ranked.
          </p>
          <p>
            One piece of context sharpens all of it. DKI Jakarta has since
            banned new padel courts in residential zones. If that holds, demand
            does not disappear — it moves across the provincial border, into
            exactly the Tangerang Selatan kelurahan sitting at the bottom of
            that second list.
          </p>
        </Section>

        <Section number="04" title="Pondok Labu: the other side of the same map">
          <p>
            A few kilometres east the question inverts. Sense Padel Margasatwa
            is not in a gap — it is in a saturated field. This is what that
            looks like: every court&rsquo;s ten-minute drive-time area, drawn
            over every other court&rsquo;s, with the two Sense Padel venues
            picked out.
          </p>
          <IsochroneMap />
          <p>
            What follows is the strategic snapshot itself rather than my
            summary of it: the density table, the review classification, the
            moat ranking, the blind spots, and the four questions it ends on
            instead of a recommendation. It is in the Indonesian it was
            written in.
          </p>
          <DocPreview
            title="ExecutiveSummary_PondokLabu.md"
            meta="Rendered from the markdown in the project repository rather than from the generated PDF, which lives in a gitignored output/ directory."
          >
            <ExecutiveSummary />
          </DocPreview>
        </Section>

        <Section number="05" title="One number the document does not sharpen">
          <p>
            The niche table is the part of that summary most likely to be
            misread, so here it is in plain arithmetic. The base is 41 reviews.{" "}
            <strong className="font-medium text-fg">
              A 2.4% demand signal is one review. 4.9% is two.
            </strong>
          </p>
          <p>
            A beginner academy really is the only niche with demand and no
            supply — but at that base it is an anecdote wearing a percent sign,
            not a market signal. Worth writing down as a hypothesis to go and
            test: ask twenty regulars whether they started as beginners and
            where they learned. Not worth spending capital on until someone
            does.
          </p>
          <p>
            The document already says the sample is small and
            survivorship-biased in its footnote. This is that footnote, moved
            to where the number is.
          </p>
        </Section>

        <Section number="06" title="Method, sources and limits">
          <p>
            Google Maps scrape, May 2026: 142 venues located, of which 41
            reviews across 9 courts were classified. Distances by Haversine,
            reach by OpenRouteService isochrone, review classification by NLP
            tagging. Population from BPS Tangerang Selatan and BPS Jakarta
            Selatan.
          </p>
          <p>
            What is safe to act on and what is not: the court counts are a
            census, so the density table holds. The moat ranking is a ranking
            with wide error bars. The niche table is a hypothesis. The document
            names its own four blind spots — silent majority, retention,
            invisible tribes, pricing — and none of them close by collecting
            more reviews.
          </p>
          <p>
            The scrapers, the kelurahan master list, the isochrone and
            gap-analysis scripts and the full executive summary all live in the
            project repository. It is not linked from here — ask and I will
            send it.
          </p>
          <p>
            Both maps are live:{" "}
            <a
              href="https://sense-padel-pondoklabu.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              Pondok Labu isochrone
            </a>{" "}
            ·{" "}
            <a
              href="https://padel-visual.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              Bintaro gap map
            </a>
          </p>
        </Section>

        <Section number="07" title="Related">
          <p>
            The same isochrone method applied to coffee rather than courts is{" "}
            <Link href="/work/coffee-access" className={linkish}>
              15 minutes to coffee
            </Link>{" "}
            — same city, same technique, a different thing being placed.
          </p>
        </Section>
      </article>
    </main>
  );
}
