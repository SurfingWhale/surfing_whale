// app/remotion/Root.tsx
// The entry Remotion's CLI renders from. Two films, each in two sizes:
// 1920×1080 for the page it sits on, and 1080×1350 (4:5) for a social post,
// which is the one shape Instagram and LinkedIn both give full height to.
import React from "react";
import { Composition } from "remotion";
import { DalrsReel } from "./DalrsReel";
import { DURATION as DALRS_DURATION, FPS as DALRS_FPS } from "./tokens";
import { SalesPalReel } from "./salespal/SalesPalReel";
import { DURATION as SALESPAL_DURATION, FPS as SALESPAL_FPS } from "./salespal/tokens";

export function RemotionRoot() {
  return (
    <>
      <Composition id="DalrsReel" component={DalrsReel}
        durationInFrames={DALRS_DURATION} fps={DALRS_FPS} width={1920} height={1080} />
      {/* The scenes lay out from the frame's own centre, so the portrait cut
          needs no separate storyboard — only room, which is why it is 1350
          tall rather than 1080 square. */}
      <Composition id="DalrsReelPortrait" component={DalrsReel}
        durationInFrames={DALRS_DURATION} fps={DALRS_FPS} width={1080} height={1350} />

      {/* SalesPal draws inside a centred 1000×700 box for the same reason. */}
      <Composition id="SalesPalReel" component={SalesPalReel}
        durationInFrames={SALESPAL_DURATION} fps={SALESPAL_FPS} width={1920} height={1080} />
      <Composition id="SalesPalReelPortrait" component={SalesPalReel}
        durationInFrames={SALESPAL_DURATION} fps={SALESPAL_FPS} width={1080} height={1350} />
    </>
  );
}
