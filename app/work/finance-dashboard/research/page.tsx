// app/work/finance-dashboard/research/page.tsx
// Fauzy's own executive summary, from Untamed98x/analisa-finance-app. The
// findings, figures and positioning lines are his; this page presents them in
// the site's own language and type scale. The charts are the ones his
// notebook produced, re-encoded but not redrawn.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Market research — Surfing Whale Finance",
  description:
    "1,050 Google Play reviews across nine budgeting apps in Indonesia and the US, read to validate two user segments before a line of the product was written.",
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

function Chart({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-6 -mx-6 sm:mx-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/research/finance/${src}.jpg`}
        alt={alt}
        loading="lazy"
        className="w-full h-auto block bg-white rounded-none sm:rounded-lg border-y sm:border border-border"
      />
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2 px-6 sm:px-0">
        {caption}
      </figcaption>
    </figure>
  );
}

/** A small table without a <table>'s styling problems at 13px. */
function Rows({ head, rows }: { head: string[]; rows: string[][] }) {
  const cols = `grid gap-3 ${head.length === 3 ? "grid-cols-[1fr_auto_auto]" : "grid-cols-[1fr_auto]"}`;
  return (
    <div className="my-5 border-t border-border">
      <div className={`${cols} py-2 border-b border-border`}>
        {head.map((h) => (
          <span key={h} className="text-[11px] uppercase tracking-[0.14em] text-fg-label">
            {h}
          </span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} className={`${cols} py-2.5 border-b border-border`}>
          {row.map((cell, k) => (
            <span key={k} className={k === 0 ? "text-[13px] leading-[1.8] text-fg" : "text-[13px] leading-[1.8] text-fg-body tabular-nums"}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className={`${column} h-14 flex items-center`}>
          <Link
            href="/work/finance-dashboard"
            className="text-[13px] text-fg-secondary hover:text-fg transition-colors duration-300"
          >
            ← Case study
          </Link>
        </div>
      </nav>

      <article className="py-16">
        <header className={`${column} mb-6`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
            Executive summary · April 2026
          </p>
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            Market research — validating two user segments
          </h1>
          <p className={`${prose} mt-4 max-w-[560px]`}>
            1,050 Google Play reviews — 600 Indonesian, 450 American — across
            nine budgeting apps, read over March and April 2026, before a line
            of the product was written.
          </p>
        </header>

        <Section number="01" title="Why research first">
          <p>
            The project started simply enough: I wanted to build an app for
            keeping personal accounts. Before building it, I chose to read.
            Not out of fear of getting it wrong, but because a good product
            starts from an honest understanding of who is going to use it.
          </p>
          <p>
            The question was specific:{" "}
            <span className="text-fg">
              who actually uses a finance app in Indonesia, and what have they
              not been given by what already exists?
            </span>
          </p>
          <p>
            Coming from economics and learning data analysis, I had a
            hypothesis. I understand roughly how an accounting flow works, and
            I know most people have none of that when they first try to keep
            their own books. I also know there are people who do not need a
            recording app at all — they already have the discipline, and only
            want a system that does not get in the way of it.
          </p>
          <p>
            Two segments came out of that, framed with Value Proposition
            Design and put to the reviews to be confirmed or dropped:
          </p>
          <Rows
            head={["Segment", "Hypothesis"]}
            rows={[
              ["A — Pencari Efisiensi", "Wants automation, bank connectivity, a guided flow"],
              ["B — Pengendali Ketat", "Wants manual control, data privacy, an easy move from what they already do"],
            ]}
          />
          <p>
            Reviews rather than a survey, on purpose. A survey can be led;
            a review is revealed preference, written by someone with no reason
            to be polite.
          </p>
        </Section>

        <Section number="02" title="Method">
          <p>
            Scraped from the Google Play Store across nine apps — YNAB, Wallet
            by BudgetBakers and Spendee in the US; Jenius/Moneytory, Wallet,
            Money Lover, Bluecoins, Monefy and Spendee in Indonesia. Each
            review scored for sentiment from −1 to +1, its keywords mapped to
            one of the two segments, pain points counted from the one- and
            two-star reviews, and failures tallied per competitor per category.
          </p>
        </Section>

        <Section number="03" title="Two markets, two shapes">
          <Chart
            src="rating-distribution"
            alt="Rating distribution for the US and Indonesian markets: the US concentrates at one and five stars, Indonesia spreads across three and four."
            caption="Rating distribution, US against Indonesia."
          />
          <p>
            The US is polarised — ones and fives dominate. People leave an app
            that misses their expectations, and they say so loudly. Indonesia
            spreads out, with far more threes and fours: either more tolerance
            or lower expectations. US ratings are higher in aggregate, but the
            negative sentiment is sharper when it comes.
          </p>
        </Section>

        <Section number="04" title="How the competitors are doing">
          <Chart
            src="rating-by-app"
            alt="Average rating per application in each market."
            caption="Average rating per app and market. Jenius is a banking app rather than a budgeting tool; it is here to map what local users expect of anything holding their money."
          />
          <p>
            By average rating in Indonesia: Monefy leads on a simple interface
            and very few complaints, then Bluecoins for power users, then Money
            Lover. Wallet by BudgetBakers has the strongest feature set and
            trips over the absence of Bahasa Indonesia. Spendee looks good and
            crashes. Jenius draws the most complaints of any of them.
          </p>
          <Chart
            src="sentiment-by-app"
            alt="Sentiment scores per application."
            caption="Sentiment per app."
          />
          <Chart
            src="sentiment-share"
            alt="Share of positive, neutral and negative sentiment per application."
            caption="Share of sentiment per app."
          />
          <p>
            Monefy and Bluecoins sit consistently above average. Jenius carries
            the highest negative sentiment in the set — and almost none of it
            is about budgeting. It is infrastructure: login failures, dead
            QRIS, unresponsive support.
          </p>
        </Section>

        <Section number="05" title="The segments hold">
          <Chart
            src="segment-signal"
            alt="Proportion of reviews carrying signals for each segment, split by market."
            caption="Which segment each review's language belongs to."
          />
          <p>
            Segment A dominates the US, where people are vocal about bank sync,
            onboarding and workflow. Segment B is stronger in Indonesia, where
            privacy, simplicity and manual control come up far more often. Both
            segments are real and statistically distinct — the hypothesis
            survived.
          </p>
          <Chart
            src="rating-by-segment"
            alt="Average rating given by each segment in each market; segment A rates consistently lower."
            caption="Average rating by segment. A rates lower than B, everywhere."
          />
          <p className="text-fg">
            People who need efficiency and automation are less satisfied with
            what exists than people who need simplicity. That is unresolved
            frustration, which is another way of saying an opening.
          </p>
        </Section>

        <Section number="06" title="What people complain about, and what they thank you for">
          <Chart
            src="complaints"
            alt="Most frequent complaints across reviews."
            caption="What is complained about most."
          />
          <Rows
            head={["Complaint", "US", "ID"]}
            rows={[
              ["Learning curve, onboarding", "Very high", "High"],
              ["Price, subscription", "High", "Medium"],
              ["Bank sync unreliable", "High", "Low"],
              ["Bugs, crashes, slowness", "Medium", "Very high"],
              ["No Bahasa Indonesia", "—", "High"],
              ["Hidden fees", "Low", "High"],
            ]}
          />
          <Chart
            src="praise"
            alt="Most frequent words in positive reviews."
            caption="What is praised most."
          />
          <p>
            The words that recur in positive reviews across both markets:{" "}
            <span className="text-fg">easy, simple, free, helpful, complete</span>.
            People value simplicity above clever features they cannot work out.
          </p>
        </Section>

        <Section number="07" title="Where each competitor fails">
          <Chart
            src="competitive-gap"
            alt="Matrix of how often each competitor fails in each problem category."
            caption="Failures per competitor, per category."
          />
          <p>
            Onboarding is worst at YNAB, where people give up before they
            understand how it works. Bugs and performance belong to Spendee and
            Jenius, where trust erodes fast. Price catches YNAB at the lower
            end and BudgetBakers on premium features that stay locked after
            payment. Privacy complaints are few but real, mostly at Jenius.
          </p>
          <p className="text-fg">
            The largest gap no competitor has filled: structured onboarding
            with local Indonesian financial context.
          </p>
        </Section>

        <Section number="08" title="What to build, for whom">
          <Chart
            src="opportunity-matrix"
            alt="Urgency of each feature for each segment, scored one to five."
            caption="Urgency per feature per segment, 1 to 5."
          />
          <Rows
            head={["Feature", "A", "B"]}
            rows={[
              ["Privacy and security", "3", "5"],
              ["Guided onboarding, Finance 101", "5", "2"],
              ["Structured accounting flow", "5", "3"],
              ["Migration from paper", "4", "5"],
            ]}
          />
          <p className="text-fg">
            No single feature serves both segments. The product needs different
            entry paths from the first screen.
          </p>
          <p>
            For segment A, the real problem is that nothing teaches a way of
            thinking about money before it asks for data: a short Finance 101
            before first use, category templates by profile, inline
            explanations rather than a help centre, and a progress bar that
            says how many steps remain.
          </p>
          <p>
            For segment B, the real problem is not trusting that the data is
            safe, and finding the move off paper tedious: explicit
            privacy-first messaging rather than a terms checkbox, a migration
            wizard that photographs a receipt and parses it, and offline mode
            treated as the trust signal it is rather than a bonus feature.
          </p>
          <p>
            Across both, the hygiene: full Bahasa Indonesia from day one,
            biometric login as the default rather than a PIN, no fee that
            arrives without notice, and support inside the app rather than a
            redirect to WhatsApp.
          </p>
        </Section>

        <Section number="09" title="Conclusion">
          <p>
            The Indonesian market has no strong leader in budgeting proper.
            Monefy and Bluecoins lead on rating, and neither has the ammunition
            to teach a user anything or to hold a premium position.
          </p>
          <p>
            Which leaves a window: the strongest apps on features are weakest
            on localisation and onboarding; the strongest local app is not a
            budgeting app at all; segment A is the most frustrated and the most
            likely to write about it; and segment B is loyal once trust is
            built, because switching costs rise the moment they adopt.
          </p>
          <p>The positioning that came out of it, one line per segment:</p>
          <blockquote className="border-l-2 border-border-strong pl-5 my-2 space-y-3">
            <p className="text-fg">
              Segment A — <em>Sistem keuangan lengkap untuk yang mau belajar,
              bukan sekadar catat.</em>
            </p>
            <p className="text-fg">
              Segment B — <em>Data kamu, kontrol kamu — sesimpel buku catatan,
              sepintar spreadsheet.</em>
            </p>
          </blockquote>
        </Section>

        <Section number="10" title="The work behind it">
          <p>
            Scrapers for both markets, a notebook for the analysis, the raw
            review sets, and every chart on this page — all of it in the
            repository, alongside the summary this page is drawn from.
          </p>
          <p>
            <a
              href="https://github.com/Untamed98x/Analisa-Finance-App"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
              Untamed98x/Analisa-Finance-App
            </a>
          </p>
        </Section>
      </article>
    </main>
  );
}
