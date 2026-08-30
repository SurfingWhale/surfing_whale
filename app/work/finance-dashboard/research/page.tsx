// app/work/finance-dashboard/research/page.tsx
//
// The market research behind the finance dashboard, shown as the document it
// is. An earlier version of this page translated Fauzy's EXECUTIVE_SUMMARY.md
// into ten sections of my own English prose with his charts hung off them —
// longer than the source and less use to a reader than the source.
//
// The document carries its own figures, so all that is left around it is a
// lead-in for a reader who cannot read Indonesian, and the PDF he generated
// from the same markdown.
import type { Metadata } from "next";
import Link from "next/link";
import { DocPreview } from "@/app/components/DocPreview";
import { ExecutiveSummary } from "./ExecutiveSummary";

const TITLE = "Market research — validating two user segments";
const DESCRIPTION =
  "1,050 Google Play reviews across nine budgeting apps in Indonesia and the US, read to validate two user segments before a line of the product was written.";

export const metadata: Metadata = {
  title: `${TITLE} — Surfing Whale`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    images: [{ url: "/og-research.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", images: ["/og-research.png"] },
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
            {TITLE}
          </h1>
          <p className={`${prose} mt-4 max-w-[560px]`}>
            1,050 Google Play reviews — 600 Indonesian, 450 American — across
            nine budgeting apps, read over March and April 2026, before a line
            of the product was written.
          </p>
        </header>

        <Section number="01" title="Why this was read before anything was built">
          <p>
            The hypothesis came first, and it was specific enough to be wrong:
            that there are two kinds of person keeping personal accounts, and
            that a product serving one badly serves the other. Segment A wants
            automation, bank sync and to be shown how the flow works. Segment B
            already has the discipline and wants a system that does not disturb
            it.
          </p>
          <p>
            Google Play reviews were the instrument because they are revealed
            preference rather than a survey — nobody writes a one-star review to
            be agreeable. Nine apps across two markets, so the Indonesian
            pattern could be read against something.
          </p>
          <p>
            The document below is the summary that came out of it, with the ten
            charts the notebook produced. It is in the Indonesian it was written
            in.
          </p>
        </Section>

        <Section number="02" title="The summary">
          <DocPreview
            title="EXECUTIVE_SUMMARY.md"
            peek={520}
            meta={
              <>
                Written April 2026. The same markdown also generates a PDF —{" "}
                <a
                  href="/research/finance/executive-summary.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkish}
                >
                  download it here
                </a>{" "}
                (1.1 MB).
              </>
            }
          >
            <ExecutiveSummary />
          </DocPreview>
        </Section>

        <Section number="03" title="What it did to the product">
          <p>
            Section 8 is the part that changed the build rather than merely
            describing the market: no single feature serves both segments, so
            the product needs different entry paths from the first screen.
            Guided onboarding scores 5 for segment A and 2 for segment B;
            privacy scores 5 for B and 3 for A. Averaging those into one
            onboarding would have produced something neither wanted.
          </p>
          <p>
            The two positioning lines at the end are the ones the dashboard was
            actually built against.{" "}
            <Link href="/work/finance-dashboard" className={linkish}>
              The case study
            </Link>{" "}
            is what happened next.
          </p>
        </Section>
      </article>
    </main>
  );
}
