// app/remotion/salespal/tokens.ts
//
// SalesPal's own look, sampled from the app's own screenshots in
// public/work/salespal/ rather than guessed: a cool grey ground (#f3f5f7 is
// 36% of every screen), white cards on top of it, and one blue — #005eb0,
// which is the logo mark's only colour and the fill of every primary button.
//
// The faces are THIS SITE'S, not the app's: Oswald for display, Plus Jakarta
// Sans for anything that stands in for interface text, Geist Mono for labels
// and figures. That is the same choice the previous showreel made and said so
// in its caption — the app's own faces are not in this repository, and a film
// that guessed at them would be claiming something it cannot show.
//
// DALRS's film is white + amber in Archivo; this one is grey-blue in Oswald.
// Two products, two looks, one site around them.
export const C = {
  bg: "#f3f5f7",
  card: "#ffffff",
  ink: "#0b0d10",
  muted: "#5b6068",
  faint: "#8b9199",
  line: "#e6e9ee",
  lineStrong: "#cfd5dd",
  blue: "#005eb0",
  blueInk: "#ffffff",
  // The received-message bubble. WhatsApp's own outgoing green is their
  // trademark, so the chat here is drawn in the app's greys and blue.
  bubbleIn: "#ffffff",
  bubbleOut: "#005eb0",
  good: "#1a7f52",
  warn: "#b06a00",
} as const;

export const F = {
  display: "'Oswald SalesPal', system-ui, sans-serif",
  ui: "'Jakarta SalesPal', system-ui, sans-serif",
  mono: "'Geist Mono SalesPal', ui-monospace, Menlo, monospace",
} as const;

/** 30 fps, like the DALRS film, so the two cut together. */
export const FPS = 30;

/** Scene starts and ends, in seconds — the storyboard in one place. */
export const SCENES = [
  { id: "chat", from: 0, to: 5 },
  { id: "tarik", from: 5, to: 11 },
  { id: "skor", from: 11, to: 17 },
  { id: "hariini", from: 17, to: 22 },
  { id: "lupa", from: 22, to: 26 },
  { id: "kartu", from: 26, to: 30 },
] as const;

export const DURATION = SCENES[SCENES.length - 1].to * FPS;

/** The whole film is drawn inside this box, centred and scaled to fit whatever
 *  frame it is rendered into — which is why the 4:5 social cut needs no second
 *  storyboard. HEADER is a band at the top of it that belongs to the scene
 *  label. The label used to sit at top:-40, OUTSIDE the box: at 1:1 that was
 *  merely unusual, and the moment the box started scaling to fill the frame it
 *  put the label above the frame's own top edge and sliced it off in every
 *  scene. Anything the viewer must read lives inside the box. */
export const STAGE = { w: 1000, h: 780 } as const;
export const HEADER = 64;
