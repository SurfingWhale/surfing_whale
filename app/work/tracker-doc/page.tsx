// app/work/tracker-doc/page.tsx
//
// TrackerDoc, from Untamed98x/Tracker-TSM (private). A document approval
// tracker built on Google Sheets because the office already lived there.
// Included on the site because it is the product-shaped work — the finance
// dashboard and the analyses are both things I built for myself; this is one
// other people had to use.
import type { Metadata } from "next";
import Link from "next/link";

const TITLE = "TrackerDoc";
const DESCRIPTION =
  "A document approval tracker built on the spreadsheet the office already used, because migrating them off it would have killed the project.";

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

/** The pipeline, as a list rather than a diagram — it is linear, so a
    diagram would only add decoration. */
function Flow({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="my-5 border-t border-border">
      {steps.map(([name, what], i) => (
        <li
          key={name}
          className="py-3 border-b border-border grid gap-1.5 sm:grid-cols-[150px_1fr] sm:gap-6"
        >
          <span className="text-[11px] uppercase tracking-[0.14em] leading-[1.5] text-fg-label sm:pt-[5px]">
            <span className="font-mono normal-case tracking-normal mr-2 text-fg-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            {name}
          </span>
          <span className="text-[13px] leading-[1.8] text-fg-body">{what}</span>
        </li>
      ))}
    </ol>
  );
}

export default function TrackerDocPage() {
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
            Internal tool · June 2026
          </p>
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            TrackerDoc
          </h1>
          <p className={`${prose} mt-4 max-w-[560px]`}>
            A document approval tracker built on top of the spreadsheet the
            office was already using — on purpose, because taking the
            spreadsheet away would have ended the project in week one.
          </p>
        </header>

        <Section number="01" title="The actual problem">
          <p>
            Documents went in for approval and then existed only in somebody&apos;s
            memory. Where is it, who has it, has it been signed — every answer
            required asking a person, and the person often had to ask another
            person.
          </p>
          <p>
            The obvious fix is a workflow tool. The obvious fix is also the one
            that gets abandoned in a month, because it asks people who work in
            Sheets all day to go and live somewhere else.
          </p>
        </Section>

        <Section number="02" title="Keeping the spreadsheet as the database">
          <p>
            So the spreadsheet stayed, and became the actual store. Admins can
            still open the sheet, sort it, fix a typo, and the app reflects it.
            Nothing had to be migrated and nobody had to be retrained on the
            data layer — only on the view.
          </p>
          <Flow
            steps={[
              ["Tally form", "The intake. A requestor submits without needing an account."],
              ["Webhook", "Tally posts the submission straight through."],
              ["Apps Script", "A Web App deployment acting as the API — reads and writes rows."],
              ["Google Sheets", "The store. Still openable, sortable and fixable by hand."],
              ["Next.js", "Two views over the same rows: the tracker and the admin console."],
            ]}
          />
          <p>
            The trade is deliberate and worth naming: Sheets gives no
            transactions, no real constraints and a hard ceiling on row count.
            For a queue measured in hundreds of documents that ceiling is far
            away, and the thing bought with it — nobody had to change how they
            work — was worth more than referential integrity.
          </p>
        </Section>

        <Section number="03" title="Two views, two different audiences">
          <p>
            The requestor view answers one question — where is my document —
            and is reachable with a shared view password, because making
            external requestors create accounts would have put the tool back
            where the workflow app was.
          </p>
          <p>
            The admin console sits behind Google SSO through NextAuth, with the{" "}
            <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-bg-muted">
              /admin
            </code>{" "}
            route protected by middleware rather than by a check inside the
            page. Admin desktop and admin mobile are separate components on
            purpose: approving on a phone is a queue you swipe through, and
            approving at a desk is a table you scan and filter. Making one
            layout do both would have made both worse.
          </p>
        </Section>

        <Section number="04" title="What it is honestly not">
          <p>
            The view password is a shared secret, which is appropriate for
            &quot;is my document signed yet&quot; and would not be appropriate
            for anything confidential. Approval history is append-only by
            convention, not enforced — a determined admin editing the sheet
            directly can rewrite it. Both are acceptable for an internal
            tracker and both would need replacing before this held anything
            sensitive.
          </p>
        </Section>

        <Section number="05" title="What was next">
          <p>
            The written-up next step was document tagging: each document
            labelled with where it came from — email, WhatsApp, walk-in,
            internal memo, ERP — with admins managing the tag list and
            requestors picking from it.
          </p>
          <p>
            The reason it was worth doing is that it turns the tracker into a
            source of evidence. Once origin is a field, the queue can answer a
            better question than &quot;where is this document&quot;: which
            intake channel actually generates the backlog. That is the point
            where an operations tool starts producing analysis instead of
            just status.
          </p>
        </Section>

        <Section number="06" title="Stack">
          <p>
            Next.js 16 with the App Router, React 19, NextAuth for Google SSO,
            Google Apps Script as the API layer, Google Sheets as the store,
            Tally for intake. Deployed on Vercel. The repository is private —
            it holds an internal workflow — so this page is the description
            rather than a link into it.
          </p>
        </Section>

        <Section number="07" title="Related">
          <p>
            The other product on this site, built for one user rather than an
            office, is the{" "}
            <Link
              href="/work/finance-dashboard"
              className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
              finance dashboard
            </Link>
            .
          </p>
        </Section>
      </article>
    </main>
  );
}
