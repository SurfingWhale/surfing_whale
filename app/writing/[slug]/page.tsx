// app/writing/[slug]/page.tsx
// The published post. Consecutive list items are gathered into one <ul> or
// <ol> at render time — the editor stores them as separate blocks, because
// that is how they are written, but a screen reader should hear "list of
// three items" rather than three unrelated lines.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, articleGraph } from "@/app/lib/schema";
import { SITE } from "@/app/lib/site";
import { ShareRow } from "@/app/components/ShareRow";
import { prose, ReadBlock, ReadNav, ReadPage } from "@/app/components/Read";
import { type Block, getPost, listPosts, readingMinutes } from "@/app/lib/writing";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || !post.published) return { title: "Not found" };
  return {
    alternates: { canonical: `/writing/${slug}` },
    title: `${post.title} — Surfing Whale`,
    description: post.standfirst || undefined,
    openGraph: {
      title: post.title,
      description: post.standfirst || undefined,
      type: "article",
      // Falls back to the site card rather than unfurling bare.
      images: [{ url: post.cover || "/og-surfing-whale.jpg" }],
    },
  };
}

export async function generateStaticParams() {
  return (await listPosts()).map((p) => ({ slug: p.slug }));
}

/** Runs of bullets or numbers become one list; everything else stands alone. */
function group(blocks: Block[]): (Block | { list: "bullet" | "number"; items: Block[] })[] {
  const out: (Block | { list: "bullet" | "number"; items: Block[] })[] = [];
  for (const block of blocks) {
    if (block.kind === "bullet" || block.kind === "number") {
      const last = out[out.length - 1];
      if (last && "list" in last && last.list === block.kind) {
        last.items.push(block);
        continue;
      }
      out.push({ list: block.kind, items: [block] });
      continue;
    }
    out.push(block);
  }
  return out;
}


// Plain elements: the page puts them all in one text column (ReadBlock),
// which sizes the type and holds the measure.
function Piece({ block }: { block: Block }) {
  switch (block.kind) {
    case "heading":
      return <h2 className="read-title mt-12 mb-3">{block.text}</h2>;
    case "subheading":
      return <h3 className="font-medium text-fg mt-8 mb-2">{block.text}</h3>;
    case "quote":
      return (
        <blockquote className="border-l-2 border-border-strong pl-5 my-6 not-italic">{block.text}</blockquote>
      );
    case "code":
      return (
        <pre className="my-6 p-4 rounded-lg bg-bg-subtle border border-border overflow-x-auto">
          <code className="font-mono text-[11px] leading-[1.8] text-fg whitespace-pre">{block.text}</code>
        </pre>
      );
    case "divider":
      return <hr className="border-0 border-t border-border my-12" />;
    case "image":
      return (
        <figure className="my-10 photo-row">
          <span style={{ ["--ratio" as string]: String((block.width ?? 3) / (block.height ?? 2)) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.url}
              alt={block.text}
              width={block.width}
              height={block.height}
              loading="lazy"
              className="w-full h-auto block bg-bg-muted"
            />
          </span>
        </figure>
      );
    default:
      return <p className="mb-5">{block.text}</p>;
  }
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  // A draft has an address but no business being readable by it.
  if (!post || !post.published) notFound();

  return (
    <ReadPage>
      <JsonLd
        data={articleGraph({
          headline: post.title,
          description: post.standfirst || undefined,
          url: `${SITE}/writing/${slug}`,
          image: post.cover || undefined,
          datePublished: post.date || undefined,
        })}
      />
      <ReadNav href="/writing" label="Writing" share={{ url: `${SITE}/writing/${slug}`, title: post.title }} />

      <article className="py-16">
        <ReadBlock className="mb-10">
          <header>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
              {post.date
                ? new Date(post.date).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : "Writing"}
              {post.words > 0 && ` · ${readingMinutes(post.words)} min read`}
            </p>
            <h1 className="read-h1">
              {post.title}
            </h1>
            {post.standfirst && (
              <p className={`${prose} mt-4`}>{post.standfirst}</p>
            )}
          </header>
        </ReadBlock>

        <ReadBlock text>
          {group(post.blocks).map((entry, i) =>
            "list" in entry ? (
              entry.list === "bullet" ? (
                <ul key={i} className="list-disc pl-5 marker:text-fg-muted mb-5 space-y-1">
                  {entry.items.map((item, k) => <li key={k}>{item.text}</li>)}
                </ul>
              ) : (
                <ol key={i} className="list-decimal pl-5 marker:text-fg-muted mb-5 space-y-1">
                  {entry.items.map((item, k) => <li key={k}>{item.text}</li>)}
                </ol>
              )
            ) : (
              <Piece key={i} block={entry} />
            )
          )}
        </ReadBlock>

        <ShareRow url={`${SITE}/writing/${slug}`} title={post.title} />
      </article>
    </ReadPage>
  );
}
