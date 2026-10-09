// app/photo/[slug]/page.tsx
// The published essay. Rows are laid out by aspect ratio so photographs that
// share a row share a height and end flush, whatever shapes they are — the
// arrangement in the darkroom is the arrangement here.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, articleGraph } from "@/app/lib/schema";
import { SITE } from "@/app/lib/site";
import { ShareRow } from "@/app/components/ShareRow";
import { prose, ReadBlock, ReadNav, ReadPage } from "@/app/components/Read";
import { getEssay, listEssays } from "@/app/lib/darkroom";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const essay = await getEssay(slug);
  if (!essay) return { title: "Not found" };
  return {
    alternates: { canonical: `/photo/${slug}` },
    title: `${essay.title} — Surfing Whale`,
    description: essay.subtitle || undefined,
    openGraph: {
      title: essay.title,
      description: essay.subtitle || undefined,
      // Falls back to the site card rather than unfurling bare.
      images: [{ url: essay.cover || "/og-surfing-whale.jpg" }],
    },
  };
}

export async function generateStaticParams() {
  return (await listEssays()).map((e) => ({ slug: e.slug }));
}

export default async function EssayPage({ params }: Params) {
  const { slug } = await params;
  const essay = await getEssay(slug);
  // A draft has a slug but no business being readable by its URL.
  if (!essay || !essay.published) notFound();

  return (
    <ReadPage>
      <JsonLd
        data={articleGraph({
          headline: essay.title,
          description: essay.subtitle || undefined,
          url: `${SITE}/photo/${slug}`,
          image: essay.cover || undefined,
          datePublished: essay.date || undefined,
          // A photo essay is a gallery with words, and saying so is more use
          // to a search engine than calling it an Article.
          type: "ImageGallery",
        })}
      />
      <ReadNav href="/photo" label="Darkroom" share={{ url: `${SITE}/photo/${slug}`, title: essay.title }} />

      <article className="py-16">
        <ReadBlock className="mb-12">
          <header>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
              {essay.date
                ? new Date(essay.date).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : "Photo essay"}
            </p>
            <h1 className="read-h1">
              {essay.title}
            </h1>
            {essay.subtitle && (
              <p className={`${prose} mt-4 max-w-[560px]`}>
                {essay.subtitle}
              </p>
            )}
          </header>
        </ReadBlock>

        {essay.blocks.map((block, i) =>
          block.type === "text" ? (
            <ReadBlock key={i} text className="py-6">
              {block.value.split(/\n{2,}/).map((para, k) => (
                <p key={k} className="mb-5 last:mb-0">
                  {para}
                </p>
              ))}
            </ReadBlock>
          ) : (
            <div key={i} className="photo-row">
              {block.items.map((shot) => (
                <figure
                  key={shot.url}
                  style={{ ["--ratio" as string]: String(shot.width / shot.height) }}
                  className="m-0 min-w-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shot.url}
                    alt={shot.alt}
                    width={shot.width}
                    height={shot.height}
                    loading={i < 2 ? "eager" : "lazy"}
                    className="w-full h-auto block bg-bg-muted"
                  />
                </figure>
              ))}
            </div>
          )
        )}

        <ShareRow url={`${SITE}/photo/${slug}`} title={essay.title} />
      </article>
    </ReadPage>
  );
}
