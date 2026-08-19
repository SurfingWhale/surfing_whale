// app/work/finance-dashboard/page.tsx
// Case study — structure per PRD v2 §4.2.
//
// The observable facts below are drawn from the shipped product. Sections
// marked TODO need Fauzy's own narrative — reasoning and motivation are his
// to state, not mine to invent.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Finance Dashboard — Surfing Whale",
  description:
    "A personal finance dashboard built on a general-ledger structure: prorate budgeting against working days, end-of-month forecasting, and bank reconciliation.",
};

const LIVE_URL = "https://financialdashboardwhale.vercel.app";

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
      <div className="flex items-baseline gap-4 mb-4">
        <span className="font-mono text-xs text-fg-muted">{number}</span>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      </div>
      <div className="space-y-4 text-fg-secondary leading-relaxed">{children}</div>
    </section>
  );
}

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm border border-dashed border-border-strong rounded-lg px-4 py-3 text-fg-muted">
      <span className="font-mono text-xs uppercase tracking-wider">Draft note</span>
      <br />
      {children}
    </p>
  );
}

export default function FinanceDashboardCaseStudy() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 h-14 flex items-center max-w-[680px]">
          <Link
            href="/"
            className="text-sm text-fg-secondary hover:text-fg transition-colors"
          >
            ← Back
          </Link>
        </div>
      </nav>

      <article className="container mx-auto px-6 py-16 max-w-[680px]">
        <header className="mb-6">
          <p className="text-sm text-fg-muted mb-3">Case study</p>
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold tracking-[-0.03em] leading-[1.1]">
            A ledger that behaves like a product
          </h1>
          <p className="text-lg text-fg-secondary mt-4 leading-relaxed">
            A personal finance dashboard built on general-ledger accounts rather
            than flat categories — with prorate budgeting against working days,
            end-of-month forecasting, and bank reconciliation.
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            {["Next.js", "TypeScript", "Accounting", "Forecasting", "Data viz"].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 border border-border rounded-full text-fg-secondary"
                >
                  {tag}
                </span>
              )
            )}
          </div>

          <a
            href={LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 px-6 py-3 rounded-lg bg-fg text-bg text-sm font-medium hover:opacity-85 transition-opacity duration-300"
          >
            View the live dashboard
          </a>
        </header>

        <Section number="01" title="The problem">
          <Todo>
            Why existing budgeting apps did not fit. The distinctive angle is
            irregular income and the gap between calendar months and how money
            is actually earned and spent — write this in your own words.
          </Todo>
        </Section>

        <Section number="02" title="Why a general ledger, not categories">
          <p>
            Spending rolls up through GL accounts rather than a flat category
            list, so a single expense carries both its account and its group —
            Kebutuhan Pokok, Tempat Tinggal, Gaya Hidup, Kesehatan, Pendidikan.
            The dashboard reports composition as{" "}
            <span className="text-fg">GL &gt; Kategori</span>, and surfaces a
            largest-accounts view alongside it.
          </p>
          <Todo>
            Add the reasoning: what a GL structure buys you that flat tags do
            not, coming from an accounting background.
          </Todo>
        </Section>

        <Section number="03" title="Prorate against working days">
          <p>
            The allocation model divides available liquid funds across{" "}
            <span className="text-fg">working days</span>, not calendar days.
            August 2026 resolves to 21 working days — 11 elapsed, 10 remaining —
            turning Rp 3.870.000 of liquid funds into a Rp 387.000 daily
            allowance, or roughly Rp 1.935.000 per week.
          </p>
          <p>
            Each day then reports its own allowance, spend, and remainder, with a
            status marker once the day&apos;s share is exceeded.
          </p>
          <Todo>
            This is the most distinctive idea in the product — worth expanding.
            Why working days rather than calendar days?
          </Todo>
        </Section>

        <Section number="04" title="Forecasting">
          <p>
            The dashboard projects an end-of-month balance from the current
            spending pattern and flags the result when liquid funds are on track
            to run out before month end. An automatic budget runs alongside it,
            projecting a shortfall figure against any goal that has been set.
          </p>
          <Todo>
            Describe how the projection is derived — simple run-rate, weighted,
            or something else.
          </Todo>
        </Section>

        <Section number="05" title="Turning discipline into a product">
          <p>
            Rather than reporting numbers alone, each month resolves to a
            persona — <span className="text-fg">Sang Penikmat #SiRoyal</span> for
            a month weighted toward eating out and new purchases — paired with a
            shareable story card, a four-badge progression, and a plain-language
            summary.
          </p>
          <p>
            A FIRE calculation sits beside it: annualised spending is multiplied
            by 25 (the 4% withdrawal rule) to produce a target, with current
            position tracked against it as a percentage.
          </p>
          <Todo>
            The retention angle is the interesting part — why gamify a personal
            tool that only you use?
          </Todo>
        </Section>

        <Section number="06" title="Reconciliation">
          <p>
            A reconciliation view checks recorded balances against the real
            figures in the banking app — the step that keeps the ledger
            trustworthy rather than merely tidy.
          </p>
        </Section>

        <Section number="07" title="Screens">
          <Todo>
            Add the three captured views — Dashboard, Prorate &amp; Budgeting,
            Rekap Finansial. Drop the files into{" "}
            <span className="font-mono">/public/work/finance/</span> and they can
            be wired in here.
          </Todo>
        </Section>
      </article>
    </main>
  );
}
