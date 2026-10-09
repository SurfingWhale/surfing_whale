// app/testament/page.tsx
// The statement the site stands on. Laid out exactly like a published post
// (app/writing/[slug]) so it reads as part of the same archive, not as a
// landing page about it.
import type { Metadata } from "next";
import { JsonLd, articleGraph } from "@/app/lib/schema";
import { SITE } from "@/app/lib/site";
import { ShareRow } from "@/app/components/ShareRow";
import { ReadBlock, ReadNav, ReadPage } from "@/app/components/Read";
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


export default function TestamentPage() {
  return (
    <ReadPage>
      <JsonLd
        data={articleGraph({
          headline: TESTAMENT.title,
          description: DESCRIPTION,
          url: `${SITE}/testament`,
          datePublished: TESTAMENT.date,
        })}
      />
      <ReadNav href="/" label="Surfing Whale" share={{ url: `${SITE}/testament`, title: TESTAMENT.title }} />

      <article className="py-16">
        <ReadBlock className="mb-10">
          <header>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
              {new Date(TESTAMENT.date).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
              {` · ${Math.max(1, Math.round(testamentWords / 200))} min read`}
            </p>
            <h1 className="read-h1">
              {TESTAMENT.title}
            </h1>
          </header>
        </ReadBlock>

        <ReadBlock text>
          {TESTAMENT.paragraphs.map((text, i) => (
            <p key={i} className="mb-5">
              {text}
            </p>
          ))}
        </ReadBlock>

        <ShareRow url={`${SITE}/testament`} title={TESTAMENT.title} />
      </article>
    </ReadPage>
  );
}
