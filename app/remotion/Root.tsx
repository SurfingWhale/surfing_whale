// app/remotion/Root.tsx
// The entry Remotion's CLI renders from. Two sizes of the same film: 1920×1080
// for the page, and 1080×1350 (4:5) for a social post, which is the one shape
// Instagram and LinkedIn both give full height to.
import React from "react";
import { Composition } from "remotion";
import { DalrsReel } from "./DalrsReel";
import { DURATION, FPS } from "./tokens";

export function RemotionRoot() {
  return (
    <>
      <Composition id="DalrsReel" component={DalrsReel}
        durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
      {/* The scenes lay out from the frame's own centre, so the portrait cut
          needs no separate storyboard — only room, which is why it is 1350
          tall rather than 1080 square. */}
      <Composition id="DalrsReelPortrait" component={DalrsReel}
        durationInFrames={DURATION} fps={FPS} width={1080} height={1350} />
    </>
  );
}
