// app/work/p/[slug]/page.tsx
//
// A project's own page. The slide-over panel on the homepage has no URL, so
// sharing one meant sending someone the homepage and telling them which
// folder to open. This is the same content at an address.
//
// The cut happens here, on the server. With the gate on, a visitor who has
// not been approved is sent the opening of the page and nothing else — not
// the whole thing with the tail hidden.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getPageBlocks } from "@/app/lib/notion";
import { BlockRenderer, FREE_BLOCKS } from "@/app/components/ProjectBlocks";
import { AccessProvider } from "@/app/components/AccessGate";
import { ReadMoreGate } from "@/app/components/ReadMoreGate";
import { gateEnabled, isReader } from "@/app/lib/accessSession";

const column = "container mx-auto px-6 max-w-[680px]";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Not found — Surfing Whale" };

  // The description is the first paragraph of the page itself, so a link
  // pasted into a chat previews the actual opening rather than a slogan.
  const blocks = await getPageBlocks(project.id).catch(() => []);
  const opening = blocks.find(
    (b) => b.type === "paragraph" && (b.text?.length ?? 0) > 40
  )?.text;
  const description = opening?.slice(0, 200) ?? project.title;
  const image = project.image?.includes("placeholder") ? "/og.png" : project.image;

  return {
    title: `${project.title} — Surfing Whale`,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "article",
      images: [{ url: image || "/og.png", alt: project.title }],
    },
    twitter: { card: "summary_large_image", images: [image || "/og.png"] },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const blocks = await getPageBlocks(project.id).catch(() => []);
  const locked = gateEnabled() && !(await isReader());
  const shown = locked ? blocks.slice(0, FREE_BLOCKS) : blocks;
  const withheld = locked && blocks.length > FREE_BLOCKS;

  return (
    <main className="min-h-screen bg-bg text-fg">
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
        <header className={`${column} mb-8`}>
          {project.subGroup && (
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-3">
              {project.subGroup}
              {project.date ? ` · ${project.date.slice(0, 4)}` : ""}
            </p>
          )}
          <h1 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.6] text-fg">
            {project.title}
          </h1>
          {project.tags.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 border border-border rounded-full text-fg-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {project.link && project.link !== "#" && (
            <p className="mt-5">
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
              >
                Open project →
              </a>
            </p>
          )}
        </header>

        {project.image && !project.image.includes("placeholder") && (
          <div className={`${column} mb-10`}>
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className={column}>
          {shown.length === 0 ? (
            <p className="text-[13px] leading-[2] text-fg-muted">
              Nothing written up for this one yet.
            </p>
          ) : (
            shown.map((block, i) => <BlockRenderer key={i} block={block} />)
          )}

          {withheld && (
            <AccessProvider>
              <ReadMoreGate reason="Project" />
            </AccessProvider>
          )}
        </div>
      </article>
    </main>
  );
}
