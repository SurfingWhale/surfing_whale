"use client";
// app/components/SalesPalStage.tsx
//
// The SalesPal film's Player, in one module with nothing else in it — the
// same CHUNK BOUNDARY trick as ReelStage.tsx. Two separate stage modules
// rather than one that switches on a prop: a reader of /work/dalrs must not
// download SalesPal's composition, and a module that imports both would hand
// them both in the same chunk.
import { Player, type PlayerRef } from "@remotion/player";
import { forwardRef } from "react";
import { SalesPalReel } from "@/app/remotion/salespal/SalesPalReel";
import { DURATION, FPS } from "@/app/remotion/salespal/tokens";

export default forwardRef<PlayerRef>(function SalesPalStage(_props, ref) {
  return (
    <Player
      ref={ref}
      component={SalesPalReel}
      durationInFrames={DURATION}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={FPS}
      controls
      loop={false}
      style={{ width: "100%", height: "100%" }}
      acknowledgeRemotionLicense
      // Silent film, so a mute control is a button that does nothing.
      showVolumeControls={false}
      // Remotion's own fullscreen button measures 16x37, under WCAG 2.5.8's
      // 24x24. This page is in English, so are its labels.
      renderFullscreenButton={({ isFullscreen }) => (
        <button
          type="button"
          aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
          style={{
            display: "grid", placeItems: "center", width: 44, height: 44, padding: 0,
            background: "transparent", border: 0, color: "#fff", cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            {isFullscreen
              ? <path d="M6 1v5H1M10 15v-5h5" stroke="currentColor" strokeWidth="1.6" />
              : <path d="M1 6V1h5M15 10v5h-5" stroke="currentColor" strokeWidth="1.6" />}
          </svg>
        </button>
      )}
    />
  );
});
