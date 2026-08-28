// app/photo/[slug]/page.tsx
// The published essay. Rows are laid out by aspect ratio so photographs that
// share a row share a height and end flush, whatever shapes they are — the
// arrangement in the darkroom is the arrangement here.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEssay, listEssays } from "@/app/lib/darkroom";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const essay = await getEssay(slug);
  if (!essay) return { title: "Not found" };
  return {
    title: `${essay.title} — Surfing Whale`,
    description: essay.subtitle || undefined,
    openGraph: {
      title: essay.title,
      description: essay.subtitle || undefined,
      // Falls back to the site card rather than unfurling bare.
      images: [{ url: essay.cover || "/og.png" }],
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
    <main className="min-h-screen bg-bg text-fg">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 flex items-center max-w-[680px]">
          <Link href="/photo" className="text-[13px] text-fg-secondary hover:text-fg transition-colors duration-300">
            ← Darkroom
          </Link>
        </div>
      </nav>

      <article className="py-16">
        <header className="container mx-auto px-6 max-w-[680px] mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
            {essay.date
              ? new Date(essay.date).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : "Photo essay"}
          </p>
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            {essay.title}
          </h1>
          {essay.subtitle && (
            <p className="text-[13px] leading-[2] text-fg-body mt-4 max-w-[560px]">
              {essay.subtitle}
            </p>
          )}
        </header>

        {essay.blocks.map((block, i) =>
          block.type === "text" ? (
            <div key={i} className="container mx-auto px-6 max-w-[680px] py-6">
              {block.value.split(/\n{2,}/).map((para, k) => (
                <p key={k} className="text-[13px] leading-[2] text-fg-body max-w-[560px] mb-5 last:mb-0">
                  {para}
                </p>
              ))}
            </div>
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
      </article>
    </main>
  );
}
