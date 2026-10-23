"use client";
// app/components/ReelStage.tsx
//
// The Player and the composition, in one module with nothing else in it.
//
// This exists to be a CHUNK BOUNDARY. ReelPlayer first did a bare
// `await import("@remotion/player")` inside its observer, which reads as lazy
// and is not: the production build folded Remotion into the route's own
// bundle, so every visitor paid ~312 KB for a film whether they pressed or
// not. Nothing on screen looked different. next/dynamic with ssr:false around
// this module is what actually splits it, and verify-reel.mjs measures the
// bytes to prove it still does.
import { Player, type PlayerRef } from "@remotion/player";
import { forwardRef } from "react";
import { DalrsReel } from "@/app/remotion/DalrsReel";
import { DURATION, FPS } from "@/app/remotion/tokens";

export default forwardRef<PlayerRef>(function ReelStage(_props, ref) {
  return (
    <Player
      ref={ref}
      component={DalrsReel}
      durationInFrames={DURATION}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={FPS}
      controls
      loop={false}
      style={{ width: "100%", height: "100%" }}
      acknowledgeRemotionLicense
      // The film is silent — there is no audio track — so a mute control is a
      // button that does nothing, sitting next to two that do.
      showVolumeControls={false}
      // Remotion's own fullscreen button measures 16x37, under the 24x24 of
      // WCAG 2.5.8, and verify-tap-targets caught it on the page. The render
      // prop is the supported way to replace it; Remotion still owns the
      // click, this only owns the box around the icon.
      renderFullscreenButton={({ isFullscreen }) => (
        <button
          type="button"
          aria-label={isFullscreen ? "Keluar dari layar penuh" : "Layar penuh"}
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
