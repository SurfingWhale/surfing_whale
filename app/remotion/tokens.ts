// app/remotion/tokens.ts
//
// DALRS's own look, lifted from apps/web/src/landing.css rather than guessed:
// white ground, black ink, one amber accent. Archivo stretched wide for
// display (the app sets font-stretch 115–120%, like stencilled warehouse
// signage) and IBM Plex Mono for every label and figure.
//
// These are the film's values only. The page around it keeps Surfing Whale's
// tokens — the film is a window onto another product, not a second theme for
// this site.
export const C = {
  bg: "#ffffff",
  surface: "#f4f5f7",
  ink: "#000000",
  muted: "#5b6068",
  line: "#e3e5e9",
  lineStrong: "#c7cbd1",
  tape: "#f5a623",
  tapeShade: "#e39612",
  onInk: "#ffffff",
} as const;

export const F = {
  display: "'Archivo', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, Menlo, monospace",
} as const;

/** 30 fps. Every scene boundary in the film is expressed in seconds × FPS. */
export const FPS = 30;

/** Scene starts and ends, in seconds — the storyboard in one place. */
export const SCENES = [
  { id: "lantai", from: 0, to: 4 },
  { id: "scan", from: 4, to: 10 },
  { id: "serah", from: 10, to: 16 },
  { id: "rantai", from: 16, to: 21 },
  { id: "bukti", from: 21, to: 26 },
  { id: "kartu", from: 26, to: 30 },
] as const;

export const DURATION = SCENES[SCENES.length - 1].to * FPS;
