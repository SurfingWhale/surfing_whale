// app/testament/page.tsx
// The statement the site stands on. Laid out exactly like a published post
// (app/writing/[slug]) so it reads as part of the same archive, not as a
// landing page about it.
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, articleGraph } from "@/app/lib/schema";
import { SITE } from "@/app/lib/site";
import { ShareRow } from "@/app/components/ShareRow";
import { TESTAMENT, testamentWords } from "@/app/data/testament";

const DESCRIPTION =
  "It is a place where I can leave traces of the things I chose to care about.";

export const metadata: Metadata = {
  alternates: { canonical: "/testament" },
  title: "Testament — Surfing Whale",
  description: DESCRIPTION,
  openGraph: {
    title: "Testament",
    description: DESCRIPTION,
    type: "article",
    images: [{ url: "/og-surfing-whale.jpg", width: 1200, height: 630 }],
  },
};

const column = "container mx-auto px-6 max-w-[680px]";
const prose = "text-[13px] leading-[2] text-fg-body max-w-[560px]";

export default function TestamentPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <JsonLd
        data={articleGraph({
          headline: TESTAMENT.title,
          description: DESCRIPTION,
          url: `${SITE}/testament`,
          datePublished: TESTAMENT.date,
        })}
      />
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className={`${column} h-14 flex items-center`}>
          <Link href="/" className="text-[13px] text-fg-secondary hover:text-fg transition-colors duration-300">
            ← Surfing Whale
          </Link>
        </div>
      </nav>

      <article className="py-16">
        <header className={`${column} mb-10`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
            {new Date(TESTAMENT.date).toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric",
            })}
            {` · ${Math.max(1, Math.round(testamentWords / 200))} min read`}
          </p>
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            {TESTAMENT.title}
          </h1>
        </header>

        {TESTAMENT.paragraphs.map((text, i) => (
          <div key={i} className={column}>
            <p className={`${prose} mb-5`}>{text}</p>
          </div>
        ))}

        <div className={column}>
          <ShareRow url={`${SITE}/testament`} title={TESTAMENT.title} />
        </div>
      </article>
    </main>
  );
}
