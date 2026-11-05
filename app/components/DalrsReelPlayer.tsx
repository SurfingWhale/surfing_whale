"use client";
// app/components/DalrsReelPlayer.tsx
//
// The DALRS film, bound to the shell in ReelPlayer.tsx. This module exists
// because the dynamic import has to happen in a client module — the page that
// uses it is a server component, and next/dynamic with ssr:false throws
// there — and because the chunk it names is what keeps SalesPal's composition
// out of this page's bundle.
import dynamic from "next/dynamic";
import { ReelPlayer, type ReelStrings } from "./ReelPlayer";

// next/dynamic with ssr:false, not a bare import() in an effect. The bare one
// looked lazy and was not — see the note at the top of ReelStage.tsx.
const Stage = dynamic(() => import("./ReelStage"), { ssr: false });

// This page is written in Indonesian, so these are too.
const ID: ReelStrings = {
  play: (s) => `Putar · ${s} dtk · tanpa suara`,
  openFile: "Buka filmnya sebagai berkas video",
  calmNote: "— animasinya dimatikan karena perangkat ini minta gerak seminimal mungkin.",
};

export function DalrsReelPlayer(
  props: Omit<React.ComponentProps<typeof ReelPlayer>, "stage" | "strings">
) {
  return <ReelPlayer {...props} stage={Stage} strings={ID} />;
}
