// app/remotion/salespal/parts.tsx
//
// The pieces the SalesPal film is built from. SalesPal is a phone app, so the
// film is drawn as flat interface rather than the isometric world the DALRS
// film uses — each film takes its form from the thing it is about.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, HEADER, STAGE } from "./tokens";

/** Everything is laid out inside one centred box, so the 4:5 social cut is the
 *  same storyboard with more room above and below rather than a second film.
 *
 *  The box is a coordinate system, not a size: it SCALES to fit whatever frame
 *  it is rendered into. Without this the film was drawn at 1:1 inside a 1920
 *  frame, which put 14px interface text on screen at about 5px once the page
 *  had scaled 1920 down into its 680px column — legible in the still I was
 *  checking it in, and not legible anywhere a reader would meet it. */
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const scale = Math.min((width * 0.94) / STAGE.w, (height * 0.94) / STAGE.h);
  return (
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      transform: `translate(-50%, -50%) scale(${scale})`,
      width: STAGE.w, height: STAGE.h,
    }}>{children}</div>
  );
};

/** A scene label, top-left of the stage. Mono, letterspaced, the same role the
 *  DALRS film gives "GERBANG SCAN G-1". */
export const Label: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <div style={{
      position: "absolute", left: 0, top: 0,
      fontFamily: F.mono, fontSize: 17, letterSpacing: "0.18em",
      textTransform: "uppercase", color: C.faint,
      opacity: e, transform: `translateY(${(1 - e) * 6}px)`,
    }}>{children}</div>
  );
};

/** The phone column. Not a drawn handset — a rounded surface the width of a
 *  phone, which is what the app actually is on screen. */
export const Phone: React.FC<{
  x: number; children: React.ReactNode; w?: number; h?: number;
}> = ({ x, children, w = 360, h = 620 }) => (
  <div style={{
    position: "absolute", left: x, top: HEADER + (STAGE.h - HEADER - h) / 2,
    width: w, height: h,
    background: C.card, borderRadius: 26,
    border: `1px solid ${C.line}`,
    boxShadow: "0 18px 50px rgba(11,13,16,0.10)",
    overflow: "hidden",
  }}>
    {/* The app's own top bar: a name and nothing else. */}
    <div style={{
      height: 54, borderBottom: `1px solid ${C.line}`,
      display: "flex", alignItems: "center", paddingLeft: 20,
      fontFamily: F.ui, fontSize: 17, fontWeight: 600, color: C.ink,
    }}>Ibu Sari — PT Harum Jaya</div>
    <div style={{ position: "relative", height: h - 54 }}>{children}</div>
  </div>
);

/** One chat message. `at` is the frame it arrives on. */
export const Bubble: React.FC<{
  at: number; y: number; out?: boolean; children: React.ReactNode; w?: number;
}> = ({ at, y, out = false, children, w = 230 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 160 }, durationInFrames: 20 });
  return (
    <div style={{
      position: "absolute", top: y,
      left: out ? undefined : 18, right: out ? 18 : undefined,
      maxWidth: w,
      background: out ? C.bubbleOut : C.bubbleIn,
      color: out ? C.blueInk : C.ink,
      border: out ? "none" : `1px solid ${C.line}`,
      borderRadius: 14,
      borderBottomLeftRadius: out ? 14 : 4,
      borderBottomRightRadius: out ? 4 : 14,
      padding: "10px 13px",
      fontFamily: F.ui, fontSize: 17, lineHeight: 1.45,
      opacity: e,
      transform: `translateY(${(1 - e) * 10}px) scale(${0.96 + e * 0.04})`,
    }}>{children}</div>
  );
};

/** The lead record the film assembles out of the chat. */
export const Card: React.FC<{
  x: number; w?: number; children: React.ReactNode; enter?: number;
}> = ({ x, w = 420, children, enter = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - enter, fps, config: { damping: 200 }, durationInFrames: 26 });
  return (
    <div style={{
      position: "absolute", left: x, top: HEADER + 92, width: w,
      background: C.card, borderRadius: 16,
      border: `1px solid ${C.line}`,
      boxShadow: "0 18px 50px rgba(11,13,16,0.10)",
      padding: "22px 24px",
      opacity: e, transform: `translateX(${(1 - e) * 18}px)`,
    }}>{children}</div>
  );
};

/** One field of the record, which fills in rather than being typed. */
export const Field: React.FC<{
  at: number; label: string; value: string; accent?: boolean;
}> = ({ at, label, value, accent = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 16 });
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: F.mono, fontSize: 13, letterSpacing: "0.14em",
        textTransform: "uppercase", color: C.faint, marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: F.ui, fontSize: 24, fontWeight: 600,
        color: accent ? C.blue : C.ink,
        opacity: e,
        // The value slides up out of its own line rather than fading in on the
        // spot: it is being lifted out of the chat, not typed into a form.
        transform: `translateY(${(1 - e) * 12}px)`,
        clipPath: `inset(${(1 - e) * 100}% 0 0 0)`,
      }}>{value}</div>
    </div>
  );
};

/** A big figure that counts up. Integers are rounded BEFORE they are
 *  formatted — the DALRS film's first render printed "20.426,941" because
 *  every intermediate frame is rendered too, and a part-way integer is not an
 *  integer. */
export const Count: React.FC<{
  at: number; to: number; dur?: number; fmt?: (n: number) => string;
  size?: number; color?: string;
}> = ({ at, to, dur = 34, fmt = (n) => String(Math.round(n)), size = 92, color = C.ink }) => {
  const frame = useCurrentFrame();
  const n = interpolate(frame - at, [0, dur], [0, to], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <span style={{
      fontFamily: F.display, fontSize: size, fontWeight: 600,
      lineHeight: 1, color, fontVariantNumeric: "tabular-nums",
    }}>{fmt(n)}</span>
  );
};
