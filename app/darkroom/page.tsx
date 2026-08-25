// app/darkroom/page.tsx
// The darkroom is Fauzy's, not the audience's: it is behind a password and
// kept out of search results. Everything it produces is public, but this is
// the bench, not the print.
import type { Metadata } from "next";
import { Composer } from "./Composer";

export const metadata: Metadata = {
  title: "Darkroom",
  robots: { index: false, follow: false, nocache: true },
};

export default function DarkroomPage() {
  return <Composer />;
}
