// app/archive/page.tsx
// Every frame, in the order it went up. Not a selection and not an essay —
// the homepage already carries a selection of five, and /photo carries the
// essays. This is the pile the other two are drawn from, which is the thing
// a visual archive is for.
import type { Metadata } from "next";
import Link from "next/link";
import { listArchivePhotos } from "@/app/lib/storage";
import { SectionLabel } from "@/app/components/SectionLabel";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Archive",
  description: "Photographs, in the order they were taken in.",
};

export default async function ArchivePage() {
  const frames = await listArchivePhotos(300);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="container mx-auto px-6 py-16 max-w-[1100px]">
        <Link
          href="/"
          className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-label hover:text-fg transition-colors duration-200"
        >
          ← Surfing Whale
        </Link>

        <div className="mt-8">
          <SectionLabel as="h1">Archive</SectionLabel>
        </div>
        <p className="text-[13px] leading-[2] text-fg-body mt-4 max-w-[560px]">
          {frames.length > 0
            ? `${frames.length} frames, newest first. No sequence and no argument — the selected work is on the front page and the essays are under Photo.`
            : "Nothing here yet."}
        </p>

        {frames.length > 0 && (
          // Columns rather than a grid: every frame keeps its own aspect
          // ratio, so a portrait is not cropped square to sit beside a
          // landscape. The browser balances the column heights itself.
          <div className="mt-10 [column-fill:_balance] columns-2 sm:columns-3 lg:columns-4 gap-3">
            {frames.map((f) => (
              <figure key={f.publicId} className="mb-3 break-inside-avoid">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt=""
                  width={f.width}
                  height={f.height}
                  loading="lazy"
                  decoding="async"
                  // width and height are real, so the column reserves the
                  // right space before the image arrives and nothing jumps.
                  className="w-full h-auto rounded-md bg-bg-muted"
                />
              </figure>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
