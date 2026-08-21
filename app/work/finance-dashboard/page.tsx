// app/work/finance-dashboard/page.tsx
// Case study — structure per PRD v2 §4.2.
//
// The reasoning in this page is drawn from Fauzy's own project documentation
// in Notion (market research Apr 2026, the security audit of 2026-05-15, the
// UI/UX self-review of 2026-05-29, and the Finku teardown of 2026-05-31).
// Two sections are still marked as draft notes: the prorate model and the
// forecasting derivation have no written PRD yet, so the reasoning there is
// his to state, not mine to invent.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Finance Dashboard — Surfing Whale",
  description:
    "A personal finance dashboard built on double-entry accounting: a 112-account general ledger, prorate budgeting against working days, PDF statement import, and a security audit run as its own pass.",
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

// A finding worth reading as a unit rather than as prose — used for the audit,
// where the point is the shape of the mistake, not the paragraph around it.
function Finding({
  severity,
  file,
  children,
}: {
  severity: string;
  file: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-border-strong pl-4 py-1">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
        <span className="font-mono text-xs uppercase tracking-wider text-fg">
          {severity}
        </span>
        <span className="font-mono text-xs text-fg-muted">{file}</span>
      </p>
      <div className="space-y-3">{children}</div>
    </div>
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
            A personal finance dashboard built on real double-entry accounting —
            a 112-account general ledger, monthly financial statements, a
            built-in Indonesian tax estimator, and prorate budgeting against
            working days. Researched against 1,050 app-store reviews, then
            audited as its own separate pass.
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            {[
              "React 19",
              "Vite",
              "Tailwind",
              "Firebase Auth",
              "Firestore",
              "Modal.com",
              "Double-entry accounting",
            ].map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 border border-border rounded-full text-fg-secondary"
              >
                {tag}
              </span>
            ))}
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

        <Section number="01" title="Starting from reviews, not features">
          <p>
            I did not begin with a feature list. I began by reading{" "}
            <span className="text-fg">1,050 Google Play reviews</span> — 600
            Indonesian, 450 American — across nine budgeting apps, over March
            and April 2026.
          </p>
          <p>
            Two segments came out of it and both are still the ones I build for.{" "}
            <span className="text-fg">Pencari Efisiensi</span> wants structure,
            guidance, an actual accounting workflow; their deepest complaint is
            that no app ever teaches them a <em>way of thinking</em> about
            money. They are also the most frustrated and by far the most active
            reviewers. <span className="text-fg">Pengendali Ketat</span> wants
            manual control and privacy; they do not trust that their data is
            safe, and moving off a paper ledger feels like a chore. They are
            slow to arrive and loyal once trust is built.
          </p>
          <p>What the competitors told me:</p>
          <ul className="space-y-2 list-disc pl-5 marker:text-fg-muted">
            <li>
              <span className="text-fg">YNAB</span> — the strongest feature set
              and the worst onboarding in the US. People give up before it
              clicks.
            </li>
            <li>
              <span className="text-fg">Monefy and Bluecoins</span> — the
              highest ratings in Indonesia, won purely on consistent simplicity.
              They teach nothing.
            </li>
            <li>
              <span className="text-fg">BudgetBakers and Spendee</span> — the
              absence of Bahasa Indonesia is enough on its own to kill adoption
              here.
            </li>
            <li>
              <span className="text-fg">Jenius</span> — the most negative
              sentiment of any app I read, and almost none of it about
              budgeting. It is infrastructure: login failures, dead QRIS.
            </li>
          </ul>
          <p className="text-fg">
            The gap nobody had filled: structured onboarding with local
            Indonesian financial context.
          </p>
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
          <p>
            Underneath that sits the part I came to from accounting rather than
            from product: a{" "}
            <span className="text-fg">
              112-account Chart of Accounts in a HEAD / SUB / GL hierarchy
            </span>
            , a real double-entry Jurnal Umum, a Buku Besar with a running
            balance per account, and monthly Neraca and Laba Rugi. Categories
            tell you where money went. A ledger tells you whether the story adds
            up — and when it does not, it says so out loud.
          </p>
          <p>
            A PPh 21 and final-tax estimator runs on top of the same data. As
            far as I can find, no other consumer finance app in Indonesia
            carries a general ledger, a P&amp;L and a tax estimator at once.
            That is the one dimension where I am not competing with anyone.
          </p>
          <p className="text-fg">
            The positioning I wrote for that segment: a complete financial
            system for people who want to <em>understand</em>, not just record.
          </p>
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
            This is the most distinctive idea in the product and the one place
            the documentation runs out — the{" "}
            <span className="font-mono">Prorate Budgeting</span> PRD in Notion
            is still an empty page marked &ldquo;Belum PRD&rdquo;. Why working
            days rather than calendar days?
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
            or something else. Not written down anywhere yet.
          </Todo>
        </Section>

        <Section number="05" title="Rekap Finansial — learning the pattern from a competitor">
          <p>
            Each month resolves to a persona —{" "}
            <span className="text-fg">Sang Penikmat #SiRoyal</span> for a month
            weighted toward eating out and new purchases — paired with a
            shareable story card, a four-badge progression, and a plain-language
            summary.
          </p>
          <p>
            That shape is not an invention. It came out of a teardown I did of{" "}
            <span className="text-fg">Finku</span>, a direct Indonesian
            competitor, working through 25 in-app screenshots screen by screen.
            What I took from it: an insight should be one sentence and one
            action, not a chart; a persona chip does more to make someone read
            the number than the number does; the receipt-styled card with a
            plain-language summary is the format people actually finish reading.
          </p>
          <p>
            What I deliberately did not take: emoji as category icons, the
            density of the mascot, and plain-white negative figures. Writing
            down what <em>not</em> to copy turned out to matter as much as the
            list of what to copy.
          </p>
          <p>
            A FIRE calculation sits beside it: annualised spending is multiplied
            by 25 (the 4% withdrawal rule) to produce a target, with current
            position tracked against it as a percentage.
          </p>
        </Section>

        <Section number="06" title="Getting data in, and keeping it trustworthy">
          <p>
            Bank statements arrive as PDFs, so a FastAPI parser running on
            Modal.com reads them and drops the results into a{" "}
            <span className="text-fg">staging bucket</span> with duplicate
            detection, rather than straight into the journal. Nothing posts
            until it has been looked at: staging, then validation, then the
            journal.
          </p>
          <p>
            A reconciliation view then checks recorded balances against the real
            figures in the banking app — the step that keeps the ledger
            trustworthy rather than merely tidy.
          </p>
        </Section>

        <Section number="07" title="Auditing my own build">
          <p>
            On 15 May 2026 I ran a security and code audit of the codebase as
            its own separate pass, with an auditor&apos;s brief rather than a
            builder&apos;s — the point being to read the code as someone trying
            to break it, not as the person who had just written it. It found
            three criticals, and the reason I keep this project close is that
            all three were mistakes I would not have caught while shipping the
            feature.
          </p>

          <div className="space-y-6 py-2">
            <Finding severity="Critical" file="firestore.rules">
              <p>
                The rule for a subscription document was{" "}
                <span className="font-mono text-fg">
                  allow update: if request.auth.uid == uid
                </span>{" "}
                — ownership, with no field-level restriction. Any signed-in user
                could open the browser console and write{" "}
                <span className="font-mono text-fg">
                  {"{ status: 'active', plan: 'pro' }"}
                </span>{" "}
                onto their own record. The entire subscription system was
                bypassable in one line.
              </p>
              <p>
                The fix was to deny any diff that touches{" "}
                <span className="font-mono">status</span>,{" "}
                <span className="font-mono">plan</span>,{" "}
                <span className="font-mono">approvedAt</span> or{" "}
                <span className="font-mono">approvedBy</span>, and to give the
                admin path its own separate rule.
              </p>
            </Finding>

            <Finding severity="Critical" file="SubscriptionGate.jsx">
              <p>
                The expired-trial screen blurred the app with{" "}
                <span className="font-mono">blur-sm pointer-events-none</span>{" "}
                — while still rendering every child into the DOM. Unchecking one
                class in DevTools gave you the whole product back.
              </p>
              <p className="text-fg">
                A blur is a visual effect, not a boundary. The fix was not a
                better blur; it was to not render the children at all.
              </p>
            </Finding>

            <Finding severity="Critical" file="AuthGate.jsx">
              <p>
                The biometric lock decided whether you were in by reading{" "}
                <span className="font-mono">
                  sessionStorage.getItem(&apos;sw_bio_unlocked&apos;)
                </span>
                , with nothing validating it server-side. Setting that key by
                hand and refreshing walks straight through it.
              </p>
              <p>
                Here I chose not to rebuild. Firebase Auth is the actual
                security boundary; the biometric prompt is a convenience lock on
                top of it. So the resolution was to say that plainly in the code
                and to strip any claim from the UI copy that implied otherwise —
                the real bug was the promise, not the mechanism.
              </p>
            </Finding>
          </div>

          <p>
            Below the criticals, the findings were the ordinary kind and just as
            worth having: a PDF endpoint accepting any file of any size with no
            token, held back only by localhost CORS; a dead hook still importing
            the old Google Apps Script layer months after the app moved to
            Firestore; no error boundary anywhere, so a single throw inside the
            journal view took out the whole screen; and a helper commented as a
            &ldquo;Levenshtein approximation&rdquo; that was in fact counting
            character presence — which scores{" "}
            <span className="font-mono">KFC</span> against{" "}
            <span className="font-mono">FKC</span> as a 100% match.
          </p>
        </Section>

        <Section number="08" title="Reviewing my own interface, and losing">
          <p>
            Two weeks later I did the same thing to the UI: a written self-review
            against CatatYu, a competitor whose product is far simpler than
            mine. I scored it honestly and I lost four dimensions out of six.
            Feature depth, the tax estimator and the import workflow were mine
            outright. <span className="text-fg">Visual polish</span>,{" "}
            <span className="text-fg">colour consistency</span>,{" "}
            <span className="text-fg">micro-copy</span> and{" "}
            <span className="text-fg">technical cleanliness</span> went to them,
            and not narrowly.
          </p>
          <p>
            The specifics were uncomfortable in a useful way. Internal database
            IDs — <span className="font-mono">[fp:fpe0g1uu]</span> — were
            printing next to real transactions in the journal. The financial
            statements showed a small red{" "}
            <span className="text-fg">&ldquo;Tidak Balance&rdquo;</span> tag with
            no indication of which account was wrong or how to fix it: alarming
            to anyone who is not an accountant, and useless to everyone else.
            The colour system had drifted into purple for staging, teal for the
            journal, orange for liabilities, blue for assets — a different
            decision per screen, which is another way of saying no decision at
            all.
          </p>
          <p>
            The most useful finding came out of the Finku teardown, and it was
            about type rather than colour. Finku commits to two or three sizes
            per screen with large jumps between them; mine had five or six, each
            one step apart from the last. That is the whole difference.{" "}
            <span className="text-fg">
              The root cause was the scale, not the font
            </span>{" "}
            — big jumps and few sizes produce hierarchy instantly, many near-identical
            sizes produce mud. The fix was a fixed mobile scale and deleting
            every 10px style in the app.
          </p>
          <p>
            The conclusion I wrote for myself is the one I still work from: I do
            not have to beat a simpler app on simplicity, because that is not my
            segment. Complexity is a feature here, not a bug. But visual polish
            and technical cleanliness are not mine to lose — losing those just
            means the depth never gets seen.
          </p>
        </Section>

        <Section number="09" title="What is still open">
          <p>
            A debt tracker is the largest remaining gap against the competition,
            and there is no native app — it is a mobile-first PWA and stays one
            for now. The monthly budget gap that the May review flagged is the
            one thing since closed, by the prorate view above.
          </p>
          <p>
            Both audits are dated documents rather than a finished state, and I
            would rather show them that way. The interesting part of this project
            was never that it works; it is that I wrote down where it did not.
          </p>
        </Section>

        <Section number="10" title="Screens">
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
