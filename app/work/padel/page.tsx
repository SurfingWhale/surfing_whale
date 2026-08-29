// app/work/padel/page.tsx
//
// Two padel studies from Untamed98x/Padel_Courts_Bintaro: the Bintaro gap
// analysis (22 kelurahan, BPS population, Google Maps supply) and the Pondok
// Labu strategic snapshot for Sense Padel Margasatwa.
//
// Every figure here is his. The one thing this page adds is arithmetic he
// left implicit: the niche-gap percentages come off a 41-review base, so
// "2.4% demand signal" is one review. §08 says that outright rather than
// letting the percentage carry more weight than it can hold.
import type { Metadata } from "next";
import Link from "next/link";

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
            Five kelurahan come out underserved, and the top of that list is
            not subtle.
          </p>
          <Bars
            rows={[
              ["Pondok Aren", 0.79],
              ["Perigi Lama", 0.73],
              ["Pondok Kacang Timur", 0.7],
              ["Jurangmangu Barat", 0.7],
              ["Jurangmangu Timur", 0.66],
            ]}
            max={0.8}
          />
          <p>
            One piece of context sharpens all of it. DKI Jakarta has since
            banned new padel courts in residential zones. If that holds, demand
            does not disappear — it moves across the provincial border, into
            exactly the Tangerang Selatan kelurahan sitting at the top of this
            list.
          </p>
        </Section>

        <Section number="04" title="Pondok Labu: the other side of the same map">
          <p>
            A few kilometres east the question inverts. Sense Padel Margasatwa
            is not in a gap. It is in a saturated field, and the numbers say so
            without needing interpretation.
          </p>
          <Rows
            head={["Drive time", "Courts within", "Read"]}
            rows={[
              ["≈10 min (3 km)", "41", "Dense"],
              ["≈15 min (5 km)", "86", "Dense"],
              ["≈20 min (10 km)", "140", "Saturated"],
            ]}
          />
          <p>
            Hannan and Freeman&apos;s density-dependence model is the useful
            frame here. Early on, every new entrant adds{" "}
            <em>legitimacy</em> — in 2018 each new court helped prove padel was
            a real sport, and everyone benefited. Past a threshold that flips
            to <em>competition</em>: a new court no longer grows the market, it
            takes a slice of one that is no longer growing as fast. Margins
            compress, and the weakest operator goes first.
          </p>
          <p>
            At 140 courts inside twenty minutes, the flip has already happened.
          </p>
        </Section>

        <Section number="05" title="What people actually write about">
          <p>
            Reviews were classified into three dimensions: the facility itself,
            the service around it, and anything social — community, leagues,
            friends.
          </p>
          <Rows
            head={["Dimension", "Sense Padel", "Competitors"]}
            rows={[
              ["Experience — courts, facilities", "80%", "77%"],
              ["Service — staff, booking, price", "10%", "6%"],
              ["Social — community, league, event", "10%", "10%"],
            ]}
          />
          <p>
            Almost everyone writes about the surface and the lighting. Almost
            nobody writes about the people. That can mean the community is not
            there — or that it has moved somewhere Google Maps cannot see it,
            into Reclub or a WhatsApp group. Those are very different
            situations and this data cannot separate them.
          </p>
        </Section>

        <Section number="06" title="The moat nobody has dug">
          <p>
            A moat is whatever makes a customer stay when a cheaper option
            opens. A good court is a shallow one — it can be copied by anyone
            with capital. A community is a deep one, because leaving costs you
            your Tuesday game and the people in it.
          </p>
          <p>
            Scoring each venue on how much of its review text is social rather
            than facility gives a rough ranking of how deep that moat is:
          </p>
          <Bars
            rows={[
              ["Quattro Padel", 59.1],
              ["Hi Padel Andara", 39.8],
              ["three one three padel court", 36.7],
              ["Sense Padel Margasatwa", 35.7],
              ["Sense Padel Kemang", 19.4],
            ]}
            max={60}
            suffix=" / 100"
            highlight="Sense Padel Margasatwa"
          />
          <p>
            Sense Padel sits just above the field average of 25.7, which is
            worth very little. The finding that matters is the shape of the
            column, not the position in it:{" "}
            <strong className="font-medium text-fg">
              nobody is above 60
            </strong>
            . In a market of 140 courts, not one has built the thing that would
            make it hard to leave. That window is still open, which is the only
            genuinely good news in this study.
          </p>
        </Section>

        <Section number="07" title="The niche gap, and how thin it is">
          <p>
            Comparing what reviewers ask for against what venues advertise
            gives four candidate niches:
          </p>
          <Rows
            head={["Niche", "Demand", "Coverage"]}
            rows={[
              ["Beginner academy", "2.4%", "0.0%"],
              ["League & competition", "4.9%", "6.5%"],
              ["Ladies community", "0.0%", "0.0%"],
              ["Business networking", "0.0%", "0.0%"],
            ]}
          />
          <p>
            A beginner academy is the only niche with demand and no supply. It
            is also the finding that needs the loudest caveat on this page, so
            here it is in plain arithmetic: the base is 41 reviews.{" "}
            <strong className="font-medium text-fg">
              2.4% is one review. 4.9% is two.
            </strong>
          </p>
          <p>
            That is not a market signal, it is an anecdote wearing a percent
            sign. It is worth writing down as a hypothesis to go and test — ask
            twenty regulars whether they started as beginners and where they
            learned — and it is not worth spending capital on until someone
            does.
          </p>
        </Section>

        <Section number="08" title="What this data structurally cannot say">
          <p>
            Public review data has four holes, and none of them close by
            collecting more of it.
          </p>
          <p>
            <strong className="font-medium text-fg">The silent majority.</strong>{" "}
            Most customers never write anything. Reviews over-represent the
            delighted and the furious and skip everyone in between.
          </p>
          <p>
            <strong className="font-medium text-fg">Retention.</strong> A review
            cannot tell you who came back. Survival is a function of returning
            players, and this dataset has no way to see them.
          </p>
          <p>
            <strong className="font-medium text-fg">Invisible tribes.</strong>{" "}
            The loyal group that organises informal tournaments over WhatsApp
            leaves no public trace at all — which is precisely the group the
            moat score is trying to measure.
          </p>
          <p>
            <strong className="font-medium text-fg">Pricing.</strong> No
            promotion, discount or price elasticity shows up in any of this.
          </p>
        </Section>

        <Section number="09" title="Questions worth more than the conclusions">
          <p>
            The honest output of a small sample is a better question list, not
            a recommendation deck.
          </p>
          <ol className="list-decimal pl-5 space-y-2 marker:text-fg-muted">
            <li>
              Who are the regulars right now, and what do they do at the venue
              besides play?
            </li>
            <li>
              What is Quattro Padel doing differently to reach 59.1 when the
              field average is 25.7?
            </li>
            <li>
              Why do people stop coming? Far more valuable than another
              five-star rating.
            </li>
            <li>
              Is the beginner academy gap a real gap, or an operational
              constraint everyone has already hit and quietly abandoned?
            </li>
          </ol>
        </Section>

        <Section number="10" title="If forced to pick one direction">
          <blockquote className="border-l-2 border-border-strong pl-5 my-2">
            <p className="text-fg">
              Build on the regulars you already have, not on acquiring new
              players.
            </p>
          </blockquote>
          <p>
            In a saturated field, acquisition is buying customers from the
            venue next door at whatever the going discount is. Retention is the
            only spend that compounds — and it is also the only way the moat
            gets dug, because a community is made of people who kept turning
            up.
          </p>
        </Section>

        <Section number="11" title="Method, sources and limits">
          <p>
            Google Maps scrape, May 2026: 142 venues located, of which 41
            reviews across 9 courts were classified. Distances by Haversine,
            reach by OpenRouteService isochrone, review classification by NLP
            tagging. Population from BPS Tangerang Selatan and BPS Jakarta
            Selatan.
          </p>
          <p>
            The review sample is small and survivorship-biased. Section 07
            should be read as a hypothesis, section 06 as a ranking with wide
            error bars, and section 04 as the only part robust enough to act on
            without further work — court counts are a census, not a sample.
          </p>
          <p>Grounded in four books rather than invented from scratch:</p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-fg-muted">
            <li>
              Hannan &amp; Freeman, <em>Organizational Ecology</em> (1989) —
              density dependence, legitimacy against competition
            </li>
            <li>
              Porter, <em>Competitive Advantage</em> (1985) — moats and industry
              structure
            </li>
            <li>
              Putnam, <em>Bowling Alone</em> (2000) — social capital and
              belonging in sport
            </li>
            <li>
              Aldrich &amp; Ruef, <em>Organizations Evolving</em> (2006) —
              adaptation through niches
            </li>
          </ul>
          <p className="pt-2">
            Scrapers, the kelurahan master list, the isochrone and gap-analysis
            scripts, and the full executive summary are in the repository.
          </p>
          <p>
            <a
              href="https://github.com/Untamed98x/Padel_Courts_Bintaro"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              Untamed98x/Padel_Courts_Bintaro
            </a>
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

        <Section number="12" title="Related">
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
