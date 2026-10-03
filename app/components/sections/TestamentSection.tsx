// app/components/sections/TestamentSection.tsx
// One line of the testament and the way in. Outside both halves of the home
// page on purpose: it is about the photographs and the data work alike, so it
// shows whichever half the reader is in.
import Link from "next/link";
import { SectionLabel } from "@/app/components/SectionLabel";
import { TESTAMENT } from "@/app/data/testament";

export function TestamentSection() {
  return (
    <section data-spot id="testament" className="w-full py-24 border-t border-border section-rule">
      <div data-reveal className="frame frame-split">
        <SectionLabel note="Why this site exists.">Testament</SectionLabel>

        {/* The same size and measure as the hero's sentence: the other place
            on the page where one line is asked to carry the whole thing. */}
        <blockquote className="text-[clamp(19px,2.1vw,26px)] leading-[1.45] tracking-[-0.011em] text-fg max-w-[19ch] sm:max-w-[23ch]">
          {TESTAMENT.pull}
        </blockquote>

        <p className="text-[13px] leading-[2] mt-8">
          <Link
            href="/testament"
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
          >
            Read the testament →
          </Link>
        </p>
      </div>
    </section>
  );
}
