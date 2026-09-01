// app/work/finance-dashboard/page.tsx
// Case study — structure per PRD v2 §4.2.
//
// The reasoning in this page is drawn from Fauzy's own project documentation
// in Notion (market research Apr 2026, the security audit of 2026-05-15, the
// UI/UX self-review of 2026-05-29, and the Finku teardown of 2026-05-31).
// Nothing here is invented: the prorate model comes from the PRD in
// the Personal_Finance_Dashboard repo, the forecasting rule is printed on
// the planning screen itself, and the research is his own executive summary.

import type { Metadata } from "next";
import Link from "next/link";

const TITLE = "A ledger that behaves like a product";
const DESCRIPTION =
  "A personal finance dashboard on double-entry accounting: a 112-account general ledger, prorate budgeting against working days, PDF statement import, and a security audit run as its own pass.";

export const metadata: Metadata = {
  title: `${TITLE} — Surfing Whale`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    images: [{ url: "/og-finance.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", images: ["/og-finance.png"] },
};

const LIVE_URL = "https://financialdashboardwhale.vercel.app";

const SCREENS = [
  {
    src: "/work/finance/01-beranda.jpg",
    alt: "The home screen: liquid funds for the month, income and spending, and a row of section shortcuts above a five-tab bar with a centre add button.",
    caption:
      "Beranda — liquid funds first, total assets second, and the month it belongs to. Five tabs around the centre add button.",
  },
  {
    src: "/work/finance/02-laporan-keuangan.jpg",
    alt: "The financial statements screen: assets, liabilities, capital and retained earnings, a balanced-books badge, and the chart of accounts expanded by code.",
    caption:
      "Laporan Keuangan — the accounting equation up top, the balance check as reassurance, then accounts by their GL codes.",
  },
  {
    src: "/work/finance/03-finplan.jpg",
    alt: "The planning sheet: budget, recurring bills, saving, debt and investment totals, and a six-rung financial ladder showing progress.",
    caption:
      "FinPlan — the six rungs in order, and the sentence stating where every figure on the sheet came from.",
  },
];

/** A phone capture, placed beside the section it illustrates rather than in a
    gallery at the end. Constrained to 260px — a full-width phone screenshot in
    a 680px column is a tower the reader has to scroll past. */
function Screen({
  src,
  alt,
  caption,
  side = "center",
}: {
  src: string;
  alt: string;
  caption: string;
  side?: "center" | "left";
}) {
  return (
    <figure
      className={`my-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6 ${
        side === "center" ? "sm:justify-center" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={780}
        height={1688}
        loading="lazy"
        className="w-full max-w-[220px] sm:max-w-[240px] h-auto block rounded-xl border border-border bg-bg-muted flex-none"
      />
      <figcaption className="text-[11px] leading-[1.8] text-fg-muted sm:pt-1 sm:max-w-[260px]">
        {caption}
      </figcaption>
    </figure>
  );
}

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
        <span className="font-mono text-[11px] text-fg-muted">{number}</span>
        <h2 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-[13px] leading-[2] text-fg-body">{children}</div>
    </section>
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
        <span className="font-mono text-[11px] uppercase tracking-wider text-fg">
          {severity}
        </span>
        <span className="font-mono text-[11px] text-fg-muted">{file}</span>
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function FinanceDashboardCaseStudy() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 flex items-center max-w-[680px]">
          <Link
            href="/"
            className="text-[13px] text-fg-secondary hover:text-fg transition-colors duration-300"
          >
            ← Back
          </Link>
        </div>
      </nav>

      <article className="container mx-auto px-6 py-16 max-w-[680px]">
        <header className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
            Case study
          </p>
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            A ledger that behaves like a product
          </h1>
          <p className="text-[13px] leading-[2] text-fg-body mt-4 max-w-[560px]">
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
                className="text-[11px] px-2.5 py-1 border border-border rounded-full text-fg-secondary"
              >
                {tag}
              </span>
            ))}
          </div>

          <a
            href={LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 text-[13px] font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
          >
            View the live dashboard
          </a>
        </header>

        <Screen
          src={SCREENS[0].src}
          alt={SCREENS[0].alt}
          caption={SCREENS[0].caption}
        />

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
          <p>
            The full study — method, every chart, the competitor breakdown and
            the opportunity matrix — is{" "}
            <Link
              href="/work/finance-dashboard/research"
              className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
              the executive summary
            </Link>
            .
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
          <Screen
            src={SCREENS[1].src}
            alt={SCREENS[1].alt}
            caption={SCREENS[1].caption}
          />
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
          <p>
            Liquid means current assets only — accounts under{" "}
            <span className="font-mono">11xx</span> in the chart of accounts. A
            term deposit at <span className="font-mono">1200</span> is money I
            have and cannot spend this week, so it sits outside the allowance
            on purpose.
          </p>
          <p>
            The part worth being honest about is where it is still wrong.
            Budgets do not carry over, so last month&apos;s overspend leaves no
            mark on this one. Categories are free text and undeduplicated, so{" "}
            <span className="text-fg">Makan</span> and{" "}
            <span className="text-fg">Makan &amp; Minum</span> can sit side by
            side and split their own total. And an actual is matched to a
            category by its description rather than by its GL account — which
            means the one screen built on a general ledger is the one screen
            not using it. That is written down as the next thing to fix.
          </p>
        </Section>

        <Section number="04" title="Forecasting">
          <p>
            The dashboard projects an end-of-month balance from the current
            spending pattern and flags the result when liquid funds are on track
            to run out before month end. An automatic budget runs alongside it,
            projecting a shortfall figure against any goal that has been set.
          </p>
          <p>
            The planning sheet states its own rule underneath the figures, in
            the app, in plain Indonesian: numbers come from a{" "}
            <span className="text-fg">
              three-month trailing average plus the account&apos;s actual
              balance, with adjustment and reconciliation entries excluded
            </span>
            . That exclusion is the part I care about. A reconciliation entry
            is me correcting the books, not me spending money; averaging it in
            would let my own bookkeeping mistakes forecast my future.
          </p>
          <Screen
            src={SCREENS[2].src}
            alt={SCREENS[2].alt}
            caption={SCREENS[2].caption}
          />
          <p>
            Printing the rule on the screen rather than burying it is the same
            instinct. A projected number that will not say where it came from
            is a number nobody should act on.
          </p>
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
            The teardown also settled the navigation. It shipped as five tabs —
            Beranda, Jurnal, Buku Besar, Laporan — around a{" "}
            <span className="text-fg">single centre button for adding</span>,
            sitting where the thumb already rests. That replaced an
            eighteen-item side navigation. A double-entry app has a great many
            places to go, and the fix was not to shorten that list but to stop
            showing it all at once.
          </p>
          <p>
            A FIRE calculation sits beside it: annualised spending is multiplied
            by 25 (the 4% withdrawal rule) to produce a target, with current
            position tracked against it as a percentage. Beside that sits{" "}
            <span className="text-fg">Tangga Keuangan</span> — budget, emergency
            fund, debt, saving, investing, retirement — six rungs in a fixed
            order, with a plain count of how many are done. It is the one screen
            that answers &ldquo;what should I do next&rdquo; rather than
            &ldquo;what did I do.&rdquo;
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
          <p>
            The statement screen further down this page is what became of that
            review. The red <span className="text-fg">Tidak Balance</span> tag
            with nothing behind it is gone; in its place is a quiet green{" "}
            <span className="text-fg">Catatan seimbang ✓</span>, sitting under
            assets, liabilities, capital and retained earnings, so the check
            reads as reassurance rather than an alarm you cannot act on.
          </p>
        </Section>

        <Section number="09" title="What is still open">
          <p>
            Both gaps the May review named have since closed: monthly budgeting
            by the prorate view, and debt by the planning sheet, which now
            carries totals for debt and investments beside the rest. What has
            not moved is the shape — it is a mobile-first PWA and stays one for
            now, with no native app.
          </p>
          <p>
            Both audits are dated documents rather than a finished state, and I
            would rather show them that way. The interesting part of this project
            was never that it works; it is that I wrote down where it did not.
          </p>
        </Section>

      </article>
    </main>
  );
}
