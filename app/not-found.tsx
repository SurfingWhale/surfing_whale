// app/not-found.tsx
// There was no 404 page, so a mistyped URL fell through to the framework's
// default: black Helvetica on white, no way back, and nothing to say whose
// site it was. A dead end is still a page someone is standing on.
import type { Metadata } from "next";
import Link from "next/link";
import { ChromeMark } from "./components/ChromeMark";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg text-fg grid place-items-center px-6 py-20">
      <div className="max-w-[420px] text-center">
        {/* The hot palette here and nowhere else. This is the one page with
            nothing on it to compete with and nobody staying long, so it can
            take the technique at full strength. */}
        <div className="flex justify-center">
          <ChromeMark size={168} tone="hot" title="Surfing Whale" />
        </div>

        <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-label">
          404
        </p>
        <h1 className="mt-4 font-display font-bold text-[clamp(32px,9vw,56px)] leading-[0.95]">
          Nothing here
        </h1>
        <p className="mt-5 text-[13px] leading-[2] text-fg-body">
          This address does not point at anything. It may have been renamed, or
          it may never have existed.
        </p>

        <div className="mt-8 flex justify-center gap-5 text-[13px]">
          <Link
            href="/"
            className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
          >
            The work
          </Link>
          <Link
            href="/archive"
            className="text-fg-body hover:text-fg transition-colors duration-200"
          >
            The archive
          </Link>
        </div>
      </div>
    </main>
  );
}
