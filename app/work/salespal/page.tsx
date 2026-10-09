// app/work/salespal/page.tsx
//
// SalesPal, written up from four sources: the context document and the
// screenshots Fauzy exported on 9 October 2026, and the two design artifacts
// he opened afterwards —
//
//   the 14-artboard canvas "SalesPal Redesign" (five screens, a screen-and-flow
//   map, a screen-against-collection data matrix, six per-button specification
//   sheets, and the 78-row deploy check), and
//
//   PRD-005, "Tarik report bulanan dari HP", the monthly client report that
//   joins content numbers to revenue.
//
// Reading them corrected two things this page used to say. "Five artboards" is
// the five screens, not the canvas: there are fourteen boards. And the PRD-005
// report flow is NOT BUILT — its own closing note says so — so section 06 says
// so too, rather than letting the parts list imply it shipped.
//
// The per-button counts here were taken from the canvas twice, by two methods
// that do not share an assumption: counting the numbered badges in each sheet,
// and counting the grid rows minus each sheet's header. 96 both ways.
//
// Two things are deliberately NOT on this page:
//
//   Links to those artifacts. Both are private, and a portfolio that links a
//   page the reader cannot open is worse than one that does not mention it, so
//   they are quoted and not linked — their own row labels, not paraphrase. The
//   same goes for the claude-config repository, which holds the checklist: it
//   is quoted by its structure rather than linked.
//
//   Anything that would read as a sales page for the product. This is a
//   logbook entry about how a thing was built and what was measured, not a
//   landing page for it.
//
// Where something is built but not yet live — Threads Radar waits on a Meta
// app review — the page says so rather than letting the list imply it shipped.
//
// A fifth source: the Notion row "SalesPAL", which used to publish as a card
// of its own beside this page. Its STORY half is merged into section 01 — the
// position-not-the-name opening, the two jobs, and why a one-person tool is
// not a team tool. Three things from it are deliberately left out:
//
//   Everything under its "## Technical" heading, which that page itself marks
//   "Tidak untuk dipublikasikan" and which the site's own storyOnly() has
//   always withheld: the stack, the four archetype definitions, the objection
//   matrix, the pull-request log and the roadmap.
//
//   Its "Kondisi sebenarnya" paragraph, which is from September and says the
//   per-user login and the answer library are not built. Both are. The deploy
//   check has rows for them.
//
//   The row itself, now that its story is here. It is listed in SUPERSEDED in
//   app/lib/notion.ts, so it no longer publishes as a card or at its own URL.
import type { Metadata } from "next";
import Link from "next/link";
import { CaseHeader } from "@/app/components/CaseHeader";
import { Showreel } from "@/app/components/Showreel";
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
  // Cut out of the same exports. A crop is the honest way to point at one
  // control without a red circle drawn over a whole screen.
  ask: [455, 270],
  panel: [455, 415],
  "lead-map": [1280, 630],
  tabs: [780, 480],
  stages: [1740, 195],
};

// How wide a shot is allowed to be drawn. Absent, it fills the column. A crop
// 455px wide stretched to 680 is a 1.5x upscale of a 1x screenshot, which puts
// soft type on a page whose whole argument is that the type was checked.
const CAP: Record<string, number> = { ask: 455, panel: 455, tabs: 390 };

function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const [w, h] = SHOT[src] ?? [1280, 900];
  const cap = CAP[src];
  if (cap) {
    return (
      <figure className="my-6" style={{ maxWidth: cap }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/work/salespal/${src}.webp`}
          alt={alt}
          width={w}
          height={h}
          loading="lazy"
          className="w-full h-auto block bg-white border border-border rounded-lg"
        />
        <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2">
          {caption}
        </figcaption>
      </figure>
    );
  }
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

// A specification row, quoted from the canvas: the control, what pressing it
// does, and what it writes. Three columns at 13px inside a 680px measure is a
// table nobody can read on a phone, so it stacks instead — the control on its
// own line, the consequence under it, the write target last and in the mono
// face, because that is the column somebody scans for.
function Spec({
  rows,
}: {
  rows: { el: string; does: string; writes?: string }[];
}) {
  return (
    <div className="my-6 border-t border-border-strong">
      {rows.map((r) => (
        <div key={r.el} className="py-3 border-b border-border">
          <p className="text-[13px] leading-[1.7] font-medium text-fg">{r.el}</p>
          <p className="text-[13px] leading-[1.8] text-fg-body mt-0.5">{r.does}</p>
          {r.writes && (
            <p className="font-mono text-[11px] leading-[1.7] text-fg-muted mt-1">
              {r.writes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Five signals, each a measurement of one field, each field written by named
// buttons. Quoted from the canvas's data board, which draws it as a chain:
// button → field → signal → score → where the score is used.
const SIGNALS: { signal: string; max: string; field: string; how: string; by: string }[] = [
  {
    signal: "Respons",
    max: "30",
    field: "lastReplyAt",
    how: "Replied today 30, falling to 0 past thirteen days",
    by: "“Mereka bales hari ini”, a WhatsApp pull, or a reply to a hunt",
  },
  {
    signal: "Langkah berikutnya",
    max: "20",
    field: "nextActionDate",
    how: "Scheduled 20, overdue 10",
    by: "Jadwalkan, or Tunda on the home screen",
  },
  {
    signal: "Nilai deal",
    max: "20",
    field: "value",
    how: "Value ÷ Rp 20 jt × 20",
    by: "Adding a lead, an import, or a quotation being approved",
  },
  {
    signal: "WhatsApp",
    max: "10",
    field: "phone",
    how: "A number on file, 10",
    by: "Adding a lead, a shared contact, or a scanned business profile",
  },
  {
    signal: "Kontak terakhir",
    max: "20",
    field: "lastContact",
    how: "Contacted today 20, falling to 0 past thirteen days",
    by: "“Mereka bales hari ini”, marking a follow-up done, or a WhatsApp pull",
  },
];

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
              { label: "Specified", value: "A 14-artboard design canvas: five screens, a screen-and-flow map, a screen-against-collection data matrix, six per-button sheets totalling 96 rows, and the 78-row deploy check" },
              { label: "Stack", value: "Next.js 14 App Router and TypeScript; Firebase Auth and Firestore with per-role rules; Vercel for deploys and cron; Web Push over VAPID; a service worker for the Android share target" },
              { label: "Tested", value: "12 Playwright flows against the Firebase emulator at 390px and 1280px, every screen re-checked at 320px; 123 Firestore rules tests" },
              { label: "Span", value: "Late September to 9 October 2026 — 41 pull requests to main" },
            ]}
          />
        </div>

        {/* The film sits between the header and the first section, which is
            where the reader is still deciding whether to read. It is offered,
            not played: nothing below waits for it, and the poster is what the
            page actually costs unless somebody presses. */}
        <div className={column}>
          <Showreel
            src="/work/salespal/showreel"
            poster="/work/salespal/showreel-poster.webp"
            posterSmall="/work/salespal/showreel-poster-960.webp"
            posterAlt="The film's title card: “Five screens. Every button written down.”, and under it “Fourteen artboards, 96 rows of specification, 41 merges. About two weeks.”"
            seconds={15}
            label="How SalesPal was built: canvas, spec, build, reconcile, audit, check — with the project's own figures."
          >
            Fifteen seconds, the whole build in order: fourteen artboards,
            ninety-six rows of specification, six staged pull requests, a pass
            to make the visuals agree, the interface audit, and the 78-row
            deploy check. The figures that land at the end are the ones in
            section 08 below — 12 flows, 123 rules tests, 130 strings raised,
            nothing left open. Generated frame by frame from{" "}
            <code className="font-mono text-[11px]">scripts/build-showreel.mjs</code>,
            in this site&rsquo;s faces rather than the app&rsquo;s.
          </Showreel>
        </div>

        <Section number="01" title="The tools ask for data. The work is already in the chat.">
          <p>
            What goes missing is never the name. It is the position — which one
            said &ldquo;I&rsquo;ll let you know&rdquo; three weeks ago, which
            one needs one more number before it closes, which one is not worth
            chasing any more. Ten conversations fit in a head. Forty do not.
          </p>
          <p>
            What usually gets used to patch that is a note on the phone, a
            spreadsheet filled in when remembered, or nothing at all, and all
            three fail in the same place: they store{" "}
            <strong className="font-medium text-fg">contacts</strong>, not the{" "}
            <strong className="font-medium text-fg">position of a
            conversation</strong>.
          </p>
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
          <p>
            It sets itself two jobs, and the second is what makes it more than
            a notebook. The first is to hold where each lead stands — not a
            list of names but a list of states: who is waiting on an answer
            from me, who am I waiting on, and for how long. The second is to
            help at the moment of being stuck. Rejections repeat in shape — it
            costs more than the other one, let me think about it, then silence
            — and only the person changes, so the reply can be written before
            it is needed rather than invented in a panic. A list of leads tells
            you <em>who</em> to contact. It is no help at all with{" "}
            <em>what to write</em>.
          </p>
          <p>
            Tools of this shape exist, and nearly all of them are built for a
            team: an administrator, a shared pipeline, a report that goes
            upward. Someone selling on their own needs none of that. They need
            one screen that opens in the gaps of a day, on a phone, and answers
            one question — who do I contact first today. Team mode came
            afterwards and is a switch; the workspace a new account starts in
            is still the personal one.
          </p>
          <Shot
            src="ask"
            alt="The Profil block of an empty lead record. Instead of input fields it reads 'Belum diisi. Tarik dari chat WhatsApp, atau isi sendiri setelah chat pertama' above two buttons: a filled 'Tarik dari WhatsApp' and an outlined 'Isi manual'."
            caption="The whole inversion is in one block. Where a CRM puts a form, this puts an offer to read the chat — and typing it in by hand is the second button, not the first."
          />
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
          <Shot
            src="lead-map"
            alt="The lead map: twelve leads plotted as dots, potential score along the bottom from 60 to 100 and deal value up the side from Rp 10 jt to Rp 25 jt, with the four quadrants labelled and counted. One dot is selected and shows a card reading 'Kedai Senja, 83 skor, Rp 12,5 jt' with buttons to open the lead or to chat. Beside it, a 'Kejar sekarang' list of the three leads in that quadrant."
            caption="The table above, drawn. Both axes are labelled with their real units, the quadrants carry their counts, and selecting a point gives the lead rather than a tooltip — the chart is a way into the record, not a picture of one."
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
          <p>
            The canvas draws the mechanism as a chain rather than a formula —
            a named button writes one field, each field is measured into one
            signal, the five signals sum. The point of drawing it that way is
            that every signal can be traced back to something a person did:
          </p>
          <div className="my-6 border-t border-border-strong">
            {SIGNALS.map((x) => (
              <div key={x.signal} className="py-3 border-b border-border">
                <p className="text-[13px] leading-[1.7] text-fg">
                  <span className="font-medium">{x.signal}</span>
                  <span className="font-mono text-[12px] text-fg-muted">
                    {" "}· max {x.max} ·{" "}
                  </span>
                  <span className="font-mono text-[12px] text-fg-body">{x.field}</span>
                </p>
                <p className="text-[13px] leading-[1.8] text-fg-body mt-0.5">{x.how}</p>
                <p className="text-[12px] leading-[1.7] text-fg-muted mt-0.5">
                  Written by: {x.by}
                </p>
              </div>
            ))}
          </div>
          <p>
            The total is banded rather than left as a bare number — 85 and over
            is <em>Sangat tinggi</em>, 70 to 84 <em>Tinggi</em>, 50 to 69{" "}
            <em>Sedang</em>, 30 to 49 <em>Rendah</em>, under 30{" "}
            <em>Sangat rendah</em> — and the same figure drives four other
            things: the five coloured dots on a lead card, the{" "}
            <em>Potensi tinggi</em> count on the home screen, the horizontal
            axis of the lead map, and the <em>Kejar sekarang</em> cut at a score
            of 60 and Rp 10 jt. One number, computed on open, used in five
            places and stored in none of them.
          </p>
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
          <p>
            That archetype is not a label for its own sake; it is the first
            axis of the second job. The profile screen has a{" "}
            <em>Buka script</em> control, and what it opens is a reply chosen
            by archetype against objection — the price one, say, for a customer
            who decides fast — in a formal and a casual version, with a button
            to copy it and a button to send it over WhatsApp. The archetype
            sets the <strong className="font-medium text-fg">tone</strong>; the
            objection sets the{" "}
            <strong className="font-medium text-fg">content</strong>. Two axes,
            not one list of answers. It has its own row in the deploy check,
            which is how this page knows it is built and not just drawn.
          </p>
          <Shot
            src="profile"
            alt="A customer profile: 26 messages since September, a 20-minute average reply time, peak activity between 10 and 12, a weekly message chart, a who-talks-more comparison, an archetype card reading 'Singa — dominant, decides fast', and a list of questions the customer asked, one flagged as unanswered since 8 October."
            caption="The profile from 26 sample messages. The last block is the useful one: a question asked on 8 October and still marked unanswered."
          />
          <Shot
            src="panel"
            alt="The same Profil block as in section 01, now filled: a brief reading '26 messages since 9 September. They reply in about 20 minutes, most active between 10 and 12. Their style is Singa — short, direct, focused on results. 2 questions still unanswered.' Underneath, a line reading 'Dari chat WhatsApp, 9 Okt' with a 'Tarik ulang' link."
            caption="The same block as section 01, after the parse. Four sentences where there was a form, with the date it was read and a link to read it again — and the chat it came from is still only on the phone."
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
          {/* Every other section on this page carries a picture. This one
              cannot, and saying so is better than finding something adjacent
              to photograph: a screenshot here would show a button missing,
              which is the one piece of evidence that proves nothing. */}
          <figure className="my-6 border border-border rounded-lg p-5 bg-bg-subtle">
            <figcaption className="text-[11px] uppercase tracking-[0.14em] leading-[1.5] text-fg-label">
              No screenshot
            </figcaption>
            <p className="text-[12px] leading-[1.9] text-fg-body mt-2">
              There is nothing to photograph. What enforces a role is a rule in{" "}
              <code className="font-mono text-[12px]">firestore.rules</code>,
              and a screenshot of a screen with one button missing would be
              evidence of the interface rather than of the permission. The 123
              tests are the picture.
            </p>
          </figure>
        </Section>

        <Section number="06" title="What else is in it">
          <Rows
            head={["Part", "What it does"]}
            rows={[
              ["Hunting Mode", "Logs which template each DM used, so the one that actually gets replies is visible"],
              ["Quotes and invoices", "Package to quotation to invoice to deposit, sent over WhatsApp or printed to PDF"],
              ["Client report", "Traces each thread through to payment and freezes a monthly report. Built."],
              ["Morning push", "Web Push at 08:00 WIB over Vercel cron — only when something needs doing"],
              ["Threads Radar", "Built and waiting on a Meta app review. Not live."],
            ]}
          />
          <p>
            A second artifact specifies where the client report goes next, and
            it is worth saying plainly that <strong className="font-medium text-fg">
            this part is not built</strong>. PRD-005 joins the content numbers
            to the revenue: every post gets a code, a nightly job stores its
            views and engagement — Instagram only keeps ninety days, so it has
            to be collected daily rather than at report time — and the month
            closes with a funnel from views to paid, revenue split by source,
            and the part nobody shows: how much came in with no source at all.
          </p>
          <p>
            The interesting work there is the arithmetic it refuses. A first
            month is written &ldquo;baseline&rdquo;, never ▲100%. Under ten
            events it prints X → Y and no percentage. A change in a rate is
            given in percentage points. Reach is reported per platform and
            never summed. It is staged so that everything needing no
            platform permission can ship first, and only the automatic
            collection waits on a Meta review.
          </p>
          <Shot
            src="tabs"
            alt="The floating navigation bar on a phone, over the leads list: five tabs — Beranda, Hunting, Leads, Jualan and Lainnya — with Leads selected, and a round chat button at the right edge."
            caption="Where the list above lives. Five tabs, within thumb reach: Hunting holds the templates, Jualan the quotations and invoices, Lainnya the reports and the team. The chat button is the one control that is always on screen, because the work is always in WhatsApp."
          />
        </Section>

        <Section number="07" title="Every button, written down before it was built">
          <p>
            The design canvas is not five pictures of screens. It is fourteen
            artboards in four groups: the five screens, a map of where every
            button goes, a matrix of which screen reads or writes which
            collection, six specification sheets, and the deploy check. The
            sheets are the part that made the build go quickly — before any of
            it was coded, every control on every screen had a row.
          </p>
          <Rows
            head={["Group", "What is in it"]}
            rows={[
              ["Arah desain baru", "Five screens — Beranda at 1440 and at 390, Leads with its panel, the customer profile, the WhatsApp pull"],
              ["Alur & relasi data", "The screen map, the data matrix, and the header and menu spec"],
              ["Tiap layar, tiap tombol", "Five more sheets — Beranda, Leads, Beranda on a phone, the profile, the WhatsApp pull"],
              ["Uji tiap deploy", "78 rows in 12 groups, 6 of them mandatory"],
            ]}
          />
          <p>
            Every specification row carries the same five columns: the number
            on the screenshot, the element, the action, where it leads, and —
            the column that made this worth doing —{" "}
            <em>data yang berubah</em>, what it writes. Ninety-six rows across
            the six sheets, counted twice and by two different methods, because
            the summary that came with the screenshots said five artboards and
            that is only the screens.
          </p>
          <Spec
            rows={[
              {
                el: "Ruang kerja (Pribadi / guild)",
                does: "Pick one, and every screen's data follows the workspace chosen.",
                writes: "users/{uid} ↔ guilds/{g}",
              },
              {
                el: "Tunda",
                does: "Pushes a follow-up to tomorrow — one tap, from the card, without opening the lead.",
                writes: "leads.nextActionDate +1",
              },
              {
                el: "Titik lead (on the map)",
                does: "Press to select and get a frosted card; hover for a tooltip of name, score and value.",
              },
              {
                el: "Simpan N bagian ke {lead}",
                does: "Saves only the sections that are switched on, closes the sheet, fills the profile.",
                writes: "leads.profile, phone, lastReplyAt",
              },
              {
                el: "Screenshot profil bisnis",
                does: "Reads a photo on the server — and spends one of the scan quota, which is why the quota is in the row.",
                writes: "usage/ (kuota)",
              },
            ]}
          />
          <p>
            That last column is also the data map. Twelve collections —{" "}
            <code className="font-mono text-[12px]">leads</code>,{" "}
            <code className="font-mono text-[12px]">hunts</code>,{" "}
            <code className="font-mono text-[12px]">quotes</code>,{" "}
            <code className="font-mono text-[12px]">invoices</code>,{" "}
            <code className="font-mono text-[12px]">clients/&#123;c&#125;/deals</code>,{" "}
            <code className="font-mono text-[12px]">guilds/&#123;g&#125;/deals</code>,{" "}
            <code className="font-mono text-[12px]">rejections</code>,{" "}
            <code className="font-mono text-[12px]">pushSubs</code>,{" "}
            <code className="font-mono text-[12px]">usage</code> and three
            settings paths — against nine screens, each cell saying read, write,
            or neither, and naming the button that does it. Everything sits
            under the active workspace, either{" "}
            <code className="font-mono text-[12px]">users/&#123;uid&#125;/…</code>{" "}
            or <code className="font-mono text-[12px]">guilds/&#123;g&#125;/…</code>,
            which is the single decision that makes personal and team mode the
            same code.
          </p>
          <p className="text-[11px] leading-[1.7] text-fg-muted">
            The canvas itself is private, so it is quoted here rather than
            linked. Nothing above is paraphrase: the row labels are its own.
          </p>
        </Section>

        <Section number="08" title="How it was checked">
          <p>
            The order was canvas, then spec, then code, then audit — fourteen
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
            The checklist is the fourteenth artboard, and it is not a list of
            good intentions. Seventy-eight rows in twelve groups — sign-in and
            session, header and navigation, the home screen, leads, the
            WhatsApp pull, hunting, selling, the client report, guild, morning
            push, and appearance — each row an ID, a step, what has to be
            visible, and a box for phone and for desktop. Six of them are
            marked smoke and run on every deploy without exception.
          </p>
          <Rows
            head={["Rule", "What it says"]}
            rows={[
              ["Before anything", "Vercel shows the newest deploy READY on the right commit, and Profil → Cek update reports that version"],
              ["What to re-test", "git diff --name-only <last tested commit>..origin/main, matched against a table of fourteen source paths"],
              ["components/LeadDetail.tsx, lib/score.ts", "→ re-run rows L4–L12"],
              ["app/globals.css, or any colour or font change", "→ rows X1–X4, and a look at every screen in both themes"],
              ["firestore.rules", "→ rows G1–G9 and L1–L2, and run the rules tests before deploying them"],
              ["A failure in smoke", "Roll back in Vercel — promote the previous deploy. Any other failure opens an issue under that row's ID."],
            ]}
          />
          <p>
            That middle rule is the one worth stealing: the checklist does not
            ask for all 78 rows every time. It asks which files changed, and
            the table turns that into the rows that have to be re-tested. A
            checklist nobody can finish is a checklist nobody runs.
          </p>
          <p>
            Eight PRDs sit in the repository under{" "}
            <code className="font-mono text-[12px]">docs/prd/</code>, each
            naming what it covers and whether it is built, partly built, or
            waiting on something outside the project.
          </p>
          <Shot
            src="stages"
            alt="Six stages in a row, each numbered: 01 Canvas, fourteen boards, five of them screens; 02 Spec, 96 rows, one per control; 03 Build, six pull requests staged; 04 Reconcile, one pass to make the visuals agree; 05 Audit, keyboard, errors, 12px and 320px reflow; 06 Check, 78 rows, six mandatory every deploy."
            caption="The order, as a still — the same six the film at the top of this page runs through. It is also the loop this site is built with, one project wide instead of one component wide."
          />
        </Section>

        <Section number="09" title="See it">
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
            The design canvas and the monthly-report specification are quoted
            throughout and not linked, because both are private — a link a
            reader cannot open is worse than no link.
          </p>
        </Section>

        <Section number="10" title="Related">
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
