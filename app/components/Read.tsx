// app/components/Read.tsx
// The parts every reading page is built from — a case study, the Testament,
// a post, a photo essay. Using these is what gives a page the layout; the
// widths and type sizes live once, in the "Reading pages" block of
// globals.css, and nowhere in a page.
//
//   <ReadPage>                  the page: scales with the screen (globals.css)
//   <ReadNav back share />      the sticky bar: the way back, and Share
//   <ReadBlock>…</ReadBlock>    content in the text column, nothing in the rail
//   <ReadSection number title>  a numbered section: its name in the rail
//   <ShareRow />                the end of the page (already a ReadSection)
//
// On a phone it is the single column it always was. From 66rem it is the
// home page's twelve columns: the rail at 1–3, the text at 4–10, pictures
// out to 12.
import Link from "next/link";
import { ShareButton } from "./ShareButton";

/** Running text. Its size steps up with the screen (globals.css). */
export const prose = "read-prose";

/** The whole reading page. On a wide screen everything in it — type, rules,
 *  pictures, gaps — grows together, so 1920px shows the 1440px page larger
 *  rather than the same small page with more empty paper round it. */
export function ReadPage({ children }: { children: React.ReactNode }) {
  return <main className="read-page min-h-screen bg-bg text-fg">{children}</main>;
}

export function ReadNav({
  href = "/#project",
  label = "Work",
  share,
}: {
  href?: string;
  label?: string;
  /** The page's own address and title, from SITE — never the address bar. */
  share?: { url: string; title: string };
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="frame h-14 flex items-center justify-between">
        <Link href={href} className="text-[13px] text-fg-secondary hover:text-fg transition-colors duration-300">
          ← {label}
        </Link>
        {share && <ShareButton url={share.url} title={share.title} />}
      </div>
    </nav>
  );
}

/** A block in the text column with nothing in the rail: a page's header, a
 *  run of paragraphs on a page without numbered sections. */
export function ReadBlock({
  children,
  className = "",
  text = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Running text: sized and measured as prose. */
  text?: boolean;
}) {
  return (
    <div className={`frame read-grid ${className}`}>
      <div className={text ? `read-body ${prose}` : "read-body"}>{children}</div>
    </div>
  );
}

export function ReadSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="read-section">
      <div className="frame read-grid">
        <div className="read-rail">
          <span className="font-mono text-[11px] text-fg-muted">{number}</span>
          <h2 className="read-title">{title}</h2>
        </div>
        <div className={`read-body space-y-4 ${prose}`}>{children}</div>
      </div>
    </section>
  );
}
