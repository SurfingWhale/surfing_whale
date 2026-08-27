// app/writing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { listPosts, readingMinutes } from "@/app/lib/writing";
import { SectionLabel } from "@/app/components/SectionLabel";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Writing — Surfing Whale",
  description: "Notes on taking something messy and finding the structure in it.",
};

export default async function WritingIndex() {
  const posts = await listPosts();

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
        <SectionLabel note="Taking something messy and finding the structure in it.">
          Writing
        </SectionLabel>

        {posts.length === 0 ? (
          <p className="text-[13px] leading-[2] text-fg-muted">Nothing published yet.</p>
        ) : (
          <ul className="border-t border-border">
            {posts.map((post) => (
              <li key={post.id} className="border-b border-border">
                <Link href={`/writing/${post.slug}`} className="group block py-5 no-underline">
                  <span className="block text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg group-hover:underline underline-offset-4 decoration-1">
                    {post.title}
                  </span>
                  {post.standfirst && (
                    <span className="block text-[13px] leading-[1.8] text-fg-body mt-1">
                      {post.standfirst}
                    </span>
                  )}
                  <span className="block text-[11px] leading-[1.6] text-fg-muted mt-1">
                    {post.date &&
                      new Date(post.date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    {post.words > 0 && ` · ${readingMinutes(post.words)} min read`}
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
