// app/colophon/page.tsx
//
// A colophon: traditionally the note at the back of a book saying how it was
// made. Here it is the part of a portfolio that can be checked.
//
// Nothing on this page is a claim about ability. Every rule is one the
// repository already follows, and every one of them is stated with the
// specific thing that went wrong to produce it, by file and by number. The
// evidence is in docs/PRD-v3-admin-mode.md and in scripts/, both of which a
// reader can open.
//
// The brand book's voice page lists "Self-correcting — says when it was
// wrong" as one of five traits, with the note that the book cannot describe a
// voice the site does not have. This page is where that trait is the subject
// rather than a side effect.
import type { Metadata } from "next";
import Link from "next/link";
import { CaseHeader } from "@/app/components/CaseHeader";
import { ReadBlock, ReadNav, ReadPage, ReadSection } from "@/app/components/Read";
import { ShareRow } from "@/app/components/ShareRow";
import { JsonLd, articleGraph, breadcrumbs } from "@/app/lib/schema";
import { SITE } from "@/app/lib/site";

const TITLE = "Colophon";
const DESCRIPTION =
  "The rules this site is checked against, and the specific mistake that set each one.";

export const metadata: Metadata = {
  alternates: { canonical: "/colophon" },
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

const linkish =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200";

const mono = "font-mono text-[11px]";

export default function ColophonPage() {
  return (
    <ReadPage>
      <JsonLd data={articleGraph({ headline: TITLE, description: DESCRIPTION, url: `${SITE}/colophon` })} />
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "Colophon", path: "/colophon" }])} />
      {/* Back to the site, not to the work index: this page is about how the
          site is made, not one of the studies in it. */}
      <ReadNav href="/" label="Home" share={{ url: `${SITE}/colophon`, title: TITLE }} />

      <article className="py-16">
        <ReadBlock>
          <CaseHeader
            scale="display"
            kicker="Colophon · 2026"
            title="Every rule here was a mistake first"
            facts={["20 checkers", "One repository", "2026"]}
            claim="A portfolio is a claim about judgement, and a claim about judgement is worth nothing unless it can be checked — so this is the page that can be. Seven rules this site is tested against, each one stated with the thing that went wrong to produce it."
            made={[
              { label: "Checked by", value: "Twenty scripts in scripts/, each run against a production build in a real browser rather than against the source" },
              { label: "Built with", value: "Next.js 16 App Router and TypeScript, React 18.3.1, Tailwind v4; Remotion 4.0.532, pinned exact, for the two films" },
              { label: "Set in", value: "Plus Jakarta Sans for anything read, Geist Mono for every figure, Instrument Serif where a person speaks, Oswald only where a word is the artwork" },
              { label: "Recorded in", value: "docs/PRD-v3-admin-mode.md — forty entries, each naming what failed, including the failures nobody would have found" },
            ]}
          />
        </ReadBlock>

        <ReadSection number="01" title="A check that passes because the thing is missing is checking nothing">
          <p>
            The film at the head of the DALRS page is tested by asking whether
            it animates. The first version of that check looked for a{" "}
            <code className={mono}>&lt;canvas&gt;</code>. Remotion renders the
            composition as ordinary DOM — divs and SVG — so the selector matched
            nothing, that check went red, and{" "}
            <strong className="font-medium text-fg">the two checks after it
            went green by comparing −1 to −1</strong>.
          </p>
          <p>
            Three results, one of them real. The suite reported a pass rate, and
            the pass rate was the reason nobody looked.
          </p>
          <p>
            The same fault appeared again, in a different shape, when the work
            stage was fixed for touch screens. A check scrolled to the last row
            and asserted that row was lit. Scrolling is what lights a row. It
            passed against the broken stylesheet, and it was really the check
            above it run a third time. It now runs with JavaScript off, which is
            the state the rule it guards actually exists for.
          </p>
        </ReadSection>

        <ReadSection number="02" title="Break it first, or the check is a decoration">
          <p>
            No checker here is trusted until the bug it claims to catch is put
            back and the checker is watched going red. Not reasoned about —
            watched.
          </p>
          <p>
            The stage has two faults behind it and they are proved separately.
            Reverting the component turns checks 3 and 4 red: the counter and
            the caption stop following the row you are on. Reverting the
            stylesheet turns check 2 red, and it prints{" "}
            <code className={mono}>6 row(s) at 0.69, 0.60, 0.52, 0.52, 0.52, 0.52</code>.
          </p>
          <p>
            That is not a description of the bug. That is the fade a phone was
            showing, measured, in the units it was showing it in.
          </p>
        </ReadSection>

        <ReadSection number="03" title="Say the measurement, not the thing standing in for it">
          <p>
            The brief for the DALRS page asked for a line reading
            &ldquo;tap&rarr;frame ~40&nbsp;ms&rdquo;. The repository&rsquo;s own{" "}
            <code className={mono}>docs/native-audit.md</code> lists that
            measurement under <em>Not measured yet</em>.
          </p>
          <p>
            Section 06 of that page says it was not measured. A page whose whole
            argument is that the controls were tested cannot carry a number
            nobody took — and the version with the number in it would have read
            better, which is exactly why the rule has to be written down rather
            than left to judgement in the moment.
          </p>
        </ReadSection>

        <ReadSection number="04" title="A still is bigger than the place the film is shown">
          <p>
            The SalesPal film was composed inside a box 1000 pixels wide,
            floating at actual size in a 1920-pixel frame. Interface text set at
            14px stayed 14px. The page scales that 1920-pixel frame down into a
            680-pixel column, which put the text on screen at roughly{" "}
            <strong className="font-medium text-fg">five pixels</strong>.
          </p>
          <p>
            It was perfectly legible in the full-size still being used to check
            it, and illegible in every place a reader would ever meet it. The
            box is now a coordinate system that scales to fit whatever frame it
            is rendered into.
          </p>
          <p>
            Checking a thing at a size nobody sees it at is the same error as
            checking it with the wrong selector. Both produce a green result
            about a case that does not exist.
          </p>
        </ReadSection>

        <ReadSection number="05" title="Lazy that is not lazy costs everyone and shows nobody">
          <p>
            The film loads only when its figure comes near the screen. The first
            version of that used an ordinary{" "}
            <code className={mono}>await import()</code> inside an effect, which
            reads as lazy and is not: the production build folded Remotion into
            the route&rsquo;s own bundle, so every visitor paid{" "}
            <strong className="font-medium text-fg">312&nbsp;KB</strong> for a
            film whether they pressed it or not.
          </p>
          <p>
            Nothing on screen looked different. No error, no warning, no visible
            delay on a fast connection — only a number, and only if somebody
            measured it. The split is now made by{" "}
            <code className={mono}>next/dynamic</code> around a module holding
            nothing else, and the checker counts the bytes on load against the
            bytes on approach so that it stays made.
          </p>
        </ReadSection>

        <ReadSection number="06" title="Written down once is not applied once">
          <p>
            Rows in the work index fade as they get further from the one being
            read. That fade is gated behind a media query, with a comment giving
            the reason: on a touch screen nothing moves the active row, so the
            ramp would freeze on the first one and leave everything below it
            permanently faded.
          </p>
          <p>
            The reasoning was correct, written down clearly, and applied to{" "}
            <strong className="font-medium text-fg">one of the two components
            that needed it</strong>. The second one shipped, and a photograph of
            a phone showed seven project names with six of them greying out down
            the list.
          </p>
          <p>
            A note explaining a decision is not the same as the decision being
            held. The note has to be looked for by whoever writes the next
            component, and nothing in a codebase makes that happen on its own.
          </p>
        </ReadSection>

        <ReadSection number="07" title="Say what the thing is not">
          <p>
            The brand book lists three rules for how this site speaks. One of
            them is <em>admit the limit in the same breath</em>, and its example
            is a caption on a screenshot of a map:{" "}
            <strong className="font-medium text-fg">a picture of a map is not
            a map.</strong>
          </p>
          <p>
            Most of what is written here is in that shape. A film replaced on
            the SalesPal page is described as having been about the build — the
            artboards and the merges — which is a fact about the making rather
            than a reason to watch. The case study for DALRS is in Indonesian
            and says why: translating <em>serah terima</em> and <em>BAST</em>{" "}
            would have been translating the subject.
          </p>
          <p>
            None of this makes the work better. It makes the description of the
            work true, which is a different and smaller claim, and the only one
            a page like this is entitled to make.
          </p>
        </ReadSection>

        <ReadSection number="08" title="Where to check">
          <p>
            Every number above is in the repository.{" "}
            <code className={mono}>docs/PRD-v3-admin-mode.md</code> records each
            change with what failed and what was tried;{" "}
            <code className={mono}>scripts/</code> holds the twenty checkers,
            and each one opens with a note on the faults found in the checker
            itself.
          </p>
          <p>
            The work those rules were learned on is{" "}
            <Link href="/work/dalrs" className={linkish}>DALRS</Link> and{" "}
            <Link href="/work/salespal" className={linkish}>SalesPal</Link>.
          </p>
        </ReadSection>

        <ShareRow url={`${SITE}/colophon`} title={TITLE} />
      </article>
    </ReadPage>
  );
}
