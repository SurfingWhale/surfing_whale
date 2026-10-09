// app/work/salespal/page.tsx
//
// SalesPal, written up from the context document and the screenshots Fauzy
// exported on 9 October 2026.
//
// Two things are deliberately NOT on this page:
//
//   The design canvas and the report-flow artifact are still private. A
//   portfolio that links a page the reader cannot open is worse than one that
//   does not mention it, so they are described and not linked. The same goes
//   for the claude-config repository, which is private: the checklist it holds
//   is quoted by its numbers rather than linked.
//
//   Anything that would read as a sales page for the product. This is a
//   logbook entry about how a thing was built and what was measured, not a
//   landing page for it.
//
// Every figure below comes from the context document, which took them from the
// repository and its test runs. Where something is built but not yet live —
// Threads Radar waits on a Meta app review — the page says so rather than
// letting the list imply it shipped.
import type { Metadata } from "next";
import Link from "next/link";
import { CaseHeader } from "@/app/components/CaseHeader";
import { JsonLd, articleGraph, breadcrumbs } from "@/app/lib/schema";
import { SITE } from "@/app/lib/site";

const TITLE = "The CRM opens with a form. This one opens with today.";
const DESCRIPTION =
  "A PWA for freelancers and small sales teams in Indonesia, where selling happens in WhatsApp rather than in a CRM: a home screen that names the four things to do today, a potential score you can argue with, and a chat parser that keeps the chat on the phone.";

export const metadata: Metadata = {
  alternates: { canonical: "/work/salespal" },
  title: `${TITLE} — Surfing Whale`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    images: [{ url: "/og-surfing-whale.jpg", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", images: ["/og-surfing-whale.jpg"] },
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

// Each shot carries its real pixel size, so the browser reserves the box from
// the aspect ratio and the caption under it does not jump when the bytes land.
const SHOT: Record<string, [number, number]> = {
  beranda: [1280, 1965],
  "beranda-phone": [780, 1900],
  leads: [1280, 1410],
  profile: [1280, 900],
  "wa-choose": [1280, 900],
  "wa-result": [1280, 900],
};

function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const [w, h] = SHOT[src] ?? [1280, 900];
  return (
    <figure className="my-6 -mx-6 sm:mx-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/work/salespal/${src}.webp`}
        alt={alt}
        width={w}
        height={h}
        loading="lazy"
        className="w-full h-auto block bg-white border-y sm:border border-border sm:rounded-lg"
      />
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2 px-6 sm:px-0">
        {caption}
      </figcaption>
    </figure>
  );
}

function Rows({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <div className="my-6 border-t border-border-strong">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4 py-2 border-b border-border">
        {head.map((h) => (
          <span
            key={h}
            className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label"
          >
            {h}
          </span>
        ))}
      </div>
      {rows.map(([a, b]) => (
        <div
          key={a}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4 py-2 border-b border-border"
        >
          <span className="text-[13px] leading-[1.8] text-fg">{a}</span>
          <span className="text-[13px] leading-[1.8] text-fg-body">{b}</span>
        </div>
      ))}
    </div>
  );
}

export default function SalesPalPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <JsonLd data={articleGraph({ headline: TITLE, description: DESCRIPTION, url: `${SITE}/work/salespal` })} />
      <JsonLd data={breadcrumbs([{ name: "Work", path: "/" }, { name: "SalesPal", path: "/work/salespal" }])} />
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
        <div className={column}>
          <CaseHeader
            scale="display"
            kicker="Product · Sept–Oct 2026"
            title="SalesPal"
            facts={["Product + build", "PWA · Indonesia", "2026"]}
            claim="Selling services in Indonesia happens in WhatsApp and DMs, not in a CRM — so this one reads the chat that already exists, and opens on the handful of things that need doing today."
            made={[
              { label: "Role", value: "Product owner, design and build, with Claude Code as a pair" },
              { label: "Stack", value: "Next.js 14 App Router and TypeScript; Firebase Auth and Firestore with per-role rules; Vercel for deploys and cron; Web Push over VAPID; a service worker for the Android share target" },
              { label: "Tested", value: "12 Playwright flows against the Firebase emulator at 390px and 1280px, every screen re-checked at 320px; 123 Firestore rules tests" },
              { label: "Span", value: "Late September to 9 October 2026 — 41 pull requests to main" },
            ]}
          />
        </div>

        <Section number="01" title="The tools ask for data. The work is already in the chat.">
          <p>
            Every CRM starts the same way: a form. Add the lead, set the stage,
            log the activity. The work it is meant to support, in Indonesia,
            happened hours ago in a WhatsApp thread that nobody is going to
            re-type.
          </p>
          <p>
            So the premise here is inverted twice. The home screen does not
            report a pipeline, it names what has to be done today. And the lead
            record is not something you fill in — it is read out of the chat
            export you already have.
          </p>
        </Section>

        <Section number="02" title="A home screen that gives an instruction">
          <p>
            The first line is a sentence, not a number:{" "}
            <em>&ldquo;Ada 2 hal yang perlu ditindak hari ini.&rdquo;</em> Under
            it, one card per thing — a follow-up due, a quotation sitting more
            than three days, an invoice past its date, a deal stalled beyond a
            week — and each card carries one button: open WhatsApp, open the
            lead, or snooze.
          </p>
          <p>
            The counts live <em>below</em> that, not above it. An earlier
            version opened on four stat tiles, which told a freelancer how many
            leads they had and nothing about what to do with them.
          </p>
          <Shot
            src="beranda"
            alt="SalesPal home screen: a line reading 'Selamat pagi. Ada 2 hal yang perlu ditindak hari ini', four counters beneath it, a row of action cards each with an open and a snooze button, and a lead map plotting each lead as a point across four quadrants."
            caption="The home screen. Sample data on a test account — the business names are made up. Counters sit under the instruction, not above it, and the lead map puts every lead on two axes: potential score against deal value."
          />
          <Shot
            src="beranda-phone"
            alt="The same home screen on a phone: the instruction, a horizontally scrolling rail of action cards, a smaller lead map, and a floating navigation bar at the bottom."
            caption="The same screen at 390px. It is a PWA and most of its use is on a phone, so this is the layout that matters: the action cards become a rail, the map shrinks, and the nav floats within thumb reach."
          />
          <Rows
            head={["Quadrant", "What it means"]}
            rows={[
              ["Kejar sekarang", "High score, high value — chase today"],
              ["Rawat", "High value, low score — needs warming before it is worth time"],
              ["Cepat closing", "High score, low value — quick to close, small"],
              ["Nanti", "Low on both — leave it"],
            ]}
          />
        </Section>

        <Section number="03" title="A score that can be argued with">
          <p>
            The first version scored leads with a number nobody could question.
            It was replaced with five signals that each name their own weight —
            response 30, next step 20, deal value 20, WhatsApp 10, last contact
            20 — and two lines beside the total: <em>&ldquo;Kenapa 90&rdquo;</em>, which
            itemises where the points came from, and <em>&ldquo;Biar naik&rdquo;</em>,
            which names the button that would raise it and by how much.
          </p>
          <p>
            It is recomputed every time the screen opens and never stored. A
            stored score is a number that goes stale quietly; a derived one
            cannot disagree with the record it came from.
          </p>
          <Shot
            src="leads"
            alt="The leads list beside a detail panel. The panel shows a score of 90 out of 100, a breakdown of five signals with their points out of their maximums, and a suggestion line naming the one action that would raise the score."
            caption="Twelve sample leads, filtered by potential tier. The panel shows the whole arithmetic: +24 of 30 for response, +20 of 20 for next step, and a line saying which action is worth six more points."
          />
        </Section>

        <Section number="04" title="Reading the chat without keeping it">
          <p>
            A customer profile is built from a WhatsApp export — the{" "}
            <code className="font-mono text-[12px]">.txt</code> Android produces
            or the <code className="font-mono text-[12px]">.zip</code> from an
            iPhone. The parser runs <strong className="font-medium text-fg">on
            the phone</strong>. The server never sees the conversation; it
            receives only the sections the user ticks.
          </p>
          <Shot
            src="wa-choose"
            alt="A sheet titled 'Tarik dari WhatsApp' offering three sources — a chat export, a shared contact, or a screenshot of a business profile — with step-by-step export instructions underneath."
            caption="Three ways in, ranked by how much they yield. On Android the share sheet can send the export straight to the app."
          />
          <Shot
            src="wa-result"
            alt="A results sheet headed 'Ketemu dari 26 pesan' listing six findings — brief, customer type, objection, questions, chat pattern, last reply — each with its own toggle, above a save button and a line stating that the chat itself is not stored."
            caption="What the parse found, section by section, each with a switch. The line under the button is the promise the architecture makes: the chat is not kept, only the summary that was ticked."
          />
          <p>
            What comes out is a brief, a reply-time pattern, one of four
            customer archetypes, the objections raised, and — the part that
            earns its place — the questions asked and never answered, dated.
          </p>
          <Shot
            src="profile"
            alt="A customer profile: 26 messages since September, a 20-minute average reply time, peak activity between 10 and 12, a weekly message chart, a who-talks-more comparison, an archetype card reading 'Singa — dominant, decides fast', and a list of questions the customer asked, one flagged as unanswered since 8 October."
            caption="The profile from 26 sample messages. The last block is the useful one: a question asked on 8 October and still marked unanswered."
          />
        </Section>

        <Section number="05" title="Team permissions live in the database">
          <p>
            Guild is the team mode: Leader, Officer, Member and Viewer, with a
            shared pipeline, a team report, an activity log, and a switch
            between a personal and a team workspace.
          </p>
          <p>
            The roles are enforced in{" "}
            <code className="font-mono text-[12px]">firestore.rules</code>, not
            in the interface — a hidden button is not a permission — and there
            are <strong className="font-medium text-fg">123 rules tests</strong>{" "}
            that assert what each role can and cannot read or write.
          </p>
        </Section>

        <Section number="06" title="What else is in it">
          <Rows
            head={["Part", "What it does"]}
            rows={[
              ["Hunting Mode", "Logs which template each DM used, so the one that actually gets replies is visible"],
              ["Quotes and invoices", "Package to quotation to invoice to deposit, sent over WhatsApp or printed to PDF"],
              ["Client report", "Traces each thread through to payment and freezes a monthly report"],
              ["Morning push", "Web Push at 08:00 WIB over Vercel cron — only when something needs doing"],
              ["Threads Radar", "Built and waiting on a Meta app review. Not live."],
            ]}
          />
        </Section>

        <Section number="07" title="How it was checked">
          <p>
            The order was canvas, then spec, then code, then audit — five
            artboards to a PRD, six staged pull requests, a pass to make the
            visuals agree, then an interface audit.
          </p>
          <Rows
            head={["Check", "Result"]}
            rows={[
              ["Automated flows", "12, on Playwright against the Firebase emulator, at 390px and 1280px"],
              ["Reflow", "Every screen re-checked at 320px, against WCAG 1.4.10"],
              ["Firestore rules", "123 tests, one per role per path"],
              ["Interface audit", "2 HIGH and 5 MEDIUM findings, all fixed; 130 UI strings raised to 12px or more"],
              ["Per-deploy checklist", "78 lines, of which a 6-line smoke test is mandatory"],
              ["Shipped", "41 pull requests to main in about two weeks"],
            ]}
          />
          <p>
            Eight PRDs sit in the repository under{" "}
            <code className="font-mono text-[12px]">docs/prd/</code>, each
            naming what it covers and whether it is built, partly built, or
            waiting on something outside the project.
          </p>
        </Section>

        <Section number="08" title="See it">
          <p>
            <a
              href="https://salespal-alpha.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              The app, live
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/SurfingWhale/sales_pal"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              Source
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/SurfingWhale/sales_pal/blob/main/docs/prd/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              The eight PRDs
            </a>
          </p>
          <p className="text-[11px] leading-[1.7] text-fg-muted">
            Every screenshot on this page is a test account with sample data.
            The design canvas and the monthly-report walkthrough are not linked
            because they are still private.
          </p>
        </Section>

        <Section number="09" title="Related">
          <p>
            The other thing on this site built around a question rather than a
            dataset is{" "}
            <Link href="/work/coffee-access" className={linkish}>
              15 minutes to coffee
            </Link>{" "}
            — same instinct, a map instead of a pipeline.
          </p>
        </Section>
      </article>
    </main>
  );
}
