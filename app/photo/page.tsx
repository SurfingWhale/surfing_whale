// app/photo/page.tsx
// The essays, newest first. Drafts are absent — listEssays filters on
// Published, so an unfinished one never appears here or in the sitemap.
import type { Metadata } from "next";
import Link from "next/link";
import { listEssays } from "@/app/lib/darkroom";
import { SectionLabel } from "@/app/components/SectionLabel";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Darkroom — Surfing Whale",
  description: "Photo essays: writing, and the photographs that go with it.",
  openGraph: {
    title: "Darkroom",
    description: "Photo essays: writing, and the photographs that go with it.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default async function DarkroomIndex() {
  const essays = await listEssays();

  return (
    <main className="min-h-screen bg-bg text-fg">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 flex items-center max-w-[720px]">
          <Link href="/" className="text-[13px] text-fg-secondary hover:text-fg transition-colors duration-300">
            ← Back
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-[720px]">
        <SectionLabel note="Writing, and the photographs that go with it.">
          Darkroom
        </SectionLabel>

        {essays.length === 0 ? (
          <p className="text-[13px] leading-[2] text-fg-muted">Nothing developed yet.</p>
        ) : (
          <ul className="border-t border-border">
            {essays.map((essay) => (
              <li key={essay.id} className="border-b border-border">
                <Link href={`/photo/${essay.slug}`} className="group flex items-center gap-5 py-5 no-underline">
                  {essay.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={essay.cover} alt="" loading="lazy"
                      className="w-16 h-16 object-cover rounded-md border border-border bg-bg-muted flex-none" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg group-hover:underline underline-offset-4 decoration-1">
                      {essay.title}
                    </span>
                    {essay.subtitle && (
                      <span className="block text-[13px] leading-[1.8] text-fg-body truncate">
                        {essay.subtitle}
                      </span>
                    )}
                    <span className="block text-[11px] leading-[1.6] text-fg-muted">
                      {essay.count} photograph{essay.count === 1 ? "" : "s"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
