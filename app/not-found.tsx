// app/not-found.tsx
// There was no 404 page, so a mistyped URL fell through to the framework's
// default: black Helvetica on white, no way back, and nothing to say whose
// site it was. A dead end is still a page someone is standing on.
import type { Metadata } from "next";
import Link from "next/link";
import { ChromeWord } from "./components/ChromeWord";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg text-fg grid place-items-center px-6 py-20">
      <div className="max-w-[420px] text-center">
        {/* The number IS the artwork here, so it is not also set as a label
            underneath — saying 404 twice on a page with four lines on it. */}
        <ChromeWord text="404" height={150} tone="hot" rounded="rounded-[16px]" />

        <h1 className="mt-8 font-display font-bold text-[clamp(32px,9vw,56px)] leading-[0.95]">
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
