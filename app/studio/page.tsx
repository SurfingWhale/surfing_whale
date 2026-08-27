// app/studio/page.tsx
// Fauzy's, not the audience's: behind a password and out of search results.
import type { Metadata } from "next";
import { Studio } from "./Studio";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false, nocache: true },
};

export default function StudioPage() {
  return <Studio />;
}
