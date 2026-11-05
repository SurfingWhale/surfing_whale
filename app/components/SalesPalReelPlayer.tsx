"use client";
// app/components/SalesPalReelPlayer.tsx
//
// The SalesPal film, bound to the shell in ReelPlayer.tsx. A sibling of
// DalrsReelPlayer.tsx for the same two reasons: the dynamic import needs a
// client module, and naming a different chunk here is what stops a reader of
// one case study paying for the other one's composition.
import dynamic from "next/dynamic";
import { ReelPlayer, type ReelStrings } from "./ReelPlayer";

const Stage = dynamic(() => import("./SalesPalStage"), { ssr: false });

// This page is written in English, so these are too. The film itself quotes
// the app's own Indonesian — "Tarik dari WhatsApp" is what the button says.
const EN: ReelStrings = {
  play: (s) => `Play · ${s} sec · silent`,
  openFile: "Open the film as a video file",
  calmNote: "— the animation is off because this device asks for as little motion as possible.",
};

export function SalesPalReelPlayer(
  props: Omit<React.ComponentProps<typeof ReelPlayer>, "stage" | "strings">
) {
  return <ReelPlayer {...props} stage={Stage} strings={EN} />;
}
