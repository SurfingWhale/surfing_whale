// Run: node scripts/make-footer-sea.mjs  →  public/footer-sea.svg
//
// The engraving at the foot of the home page: a sea to the horizon, headlands
// either side, and one whale's tail in the middle of all that water — the
// lone rider of the reference footer, made this site's own.
//
// Generated rather than drawn so it can be changed by editing numbers, and
// seeded so every run gives the same picture. The sky is left transparent:
// it is the footer's own blue, so the two can never drift apart.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const W = 1600;
const H = 640;
const HORIZON = 330;
const INK = "#1f3b9f";
const PAPER = "#f2e7cf";

// mulberry32 — small, fast, and the same numbers on every machine.
let seed = 20261003;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const range = (a, b) => a + (b - a) * rnd();
const r1 = (n) => Math.round(n * 10) / 10;

// Value noise, 1D and 2D, for everything that should look found, not placed.
const lattice = Array.from({ length: 4096 }, rnd);
const at = (i) => lattice[((i % 4096) + 4096) % 4096];
const smooth = (t) => t * t * (3 - 2 * t);
const noise1 = (x) => {
  const i = Math.floor(x);
  return at(i) + (at(i + 1) - at(i)) * smooth(x - i);
};
const noise2 = (x, y) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const h = (a, b) => at(a * 157 + b * 311);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const top = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * u;
  const bot = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * u;
  return top + (bot - top) * v;
};
const fbm1 = (x) => noise1(x) * 0.5 + noise1(x * 2.1) * 0.3 + noise1(x * 4.3) * 0.2;

// ---- Headlands -----------------------------------------------------------
// Gaussian bumps for the big shapes, noise on top for the rock.
const BUMPS = [
  [60, 150, 62], [250, 120, 44], [420, 90, 22], [520, 50, 8],
  [1010, 90, 26], [1150, 70, 70], [1215, 95, 112], [1330, 90, 60],
  [1470, 120, 78], [1610, 110, 52],
];
const height = (x) => {
  let h = 0;
  for (const [x0, w, a] of BUMPS) h += a * Math.exp(-(((x - x0) / w) ** 2));
  if (h < 1.5) return 0;
  return h + (fbm1(x / 18) - 0.5) * Math.min(14, h * 0.35);
};
const ridge = (x) => HORIZON - height(x);

// ---- Strokes, batched by width so the file is a handful of paths ----------
const batches = new Map();
const stroke = (w, d) => {
  const k = r1(w).toFixed(1);
  if (!batches.has(k)) batches.set(k, []);
  batches.get(k).push(d);
};

// The whale sits here. The sea leaves calm water round where the tail comes
// out — an ellipse, not a box, or the gap reads as a hole cut in the picture.
const WX = 812;
const WY = 452;
const clear = (x, y, pad = 0) =>
  ((x - WX) / (96 + pad)) ** 2 + ((y - WY - 2) / (16 + pad * 0.4)) ** 2 < 1;

// Headland hatching: contour lines that follow the ridge down to the water.
// Light comes from the left, so slopes that face it (rising to the right) are
// mostly bare paper and the far sides are cut close.
for (let k = 1; k < 60; k++) {
  const off = k * 3.3;
  let seg = [];
  const flush = () => {
    if (seg.length > 1) stroke(0.9 + Math.min(0.5, k * 0.012), "M" + seg.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L"));
    seg = [];
  };
  for (let x = -20; x <= W + 20; x += 3) {
    const h = height(x);
    const y = ridge(x) + off;
    if (h < 2 || y > HORIZON - 1.2) {
      flush();
      continue;
    }
    const slope = height(x + 3) - height(x - 3);
    const lit = slope > 0.4;
    const crest = off < 7;
    const gap = crest ? 0.7 : lit ? 0.62 : 0.06;
    if (rnd() < gap * (seg.length ? 0.18 : 1)) flush();
    else seg.push([x, y + (rnd() - 0.5) * 0.6]);
  }
  flush();
}

// The headlands' feet: a dark line of rock where they meet the water.
for (let x = 0; x <= W; x += 2) {
  const h = height(x);
  if (h > 4) stroke(1.4, `M${x} ${HORIZON - 1}L${x + 2} ${HORIZON - 1}`);
}

// ---- The sea ---------------------------------------------------------------
// Rows that open out towards the viewer; short dashes near the horizon,
// long curved strokes and heavy line weight in front.
let y = HORIZON + 2.2;
let row = 0;
while (y < H + 4) {
  const z = (y - HORIZON) / (H - HORIZON); // 0 at the horizon, 1 at our feet
  const len = 3 + 52 * z ** 1.25;
  const w = 0.6 + 2.1 * z ** 1.1;
  let x = -rnd() * len * 2;
  while (x < W + len) {
    const l = len * range(0.55, 1.45);
    // Swell: where the noise is high this is the face of a wave, in shadow,
    // and the strokes crowd; where it is low the water catches the light.
    const swell = noise2(x / (140 + 260 * z), y / (10 + 40 * z) + row * 0.07);
    const dark = swell > 0.56;
    const gap = l * (dark ? range(0.15, 0.6) : range(0.9, 2.6));
    if (!clear(x + l / 2, y, 6)) {
      const sag = l * (dark ? 0.1 : 0.06) * (rnd() < 0.7 ? 1 : -1);
      const yy = y + (rnd() - 0.5) * (0.6 + 2 * z);
      stroke(dark ? w * 1.15 : w * 0.85, `M${r1(x)} ${r1(yy)}Q${r1(x + l / 2)} ${r1(yy + sag)} ${r1(x + l)} ${r1(yy)}`);
    }
    x += l + gap;
  }
  row++;
  y += 1.6 + 13 * z ** 1.35 + rnd() * (0.6 + 3 * z);
}

// Foreground wavelets: stacks of arcs, each shorter than the one above,
// which read as a breaking crest the way the reference's tufts read as brush.
for (let i = 0; i < 30; i++) {
  const cx = range(-40, W + 40);
  const cy = range(HORIZON + 140, H + 10);
  if (clear(cx, cy, 40)) continue;
  const z = (cy - HORIZON) / (H - HORIZON);
  const span = range(40, 120) * (0.5 + z);
  const n = 3 + Math.floor(rnd() * 4 + z * 3);
  for (let j = 0; j < n; j++) {
    const l = span * (1 - j / (n + 1.2));
    const yy = cy + j * (2.4 + 2 * z);
    const lift = (4 + 5 * z) * (1 - j / n);
    const x0 = cx - l / 2 + (rnd() - 0.5) * 4;
    stroke(1 + 1.6 * z, `M${r1(x0)} ${r1(yy)}Q${r1(x0 + l * 0.55)} ${r1(yy - lift)} ${r1(x0 + l)} ${r1(yy + 1)}`);
  }
}

// ---- The whale's tail ------------------------------------------------------
// Drawn in a 100-wide box and placed; the flukes spread wider than they are
// tall, with the notch at the centre of the trailing edge.
const S = 1.5; // 100 units → 150px
const tx = (u) => r1(WX + (u - 50) * S);
const ty = (v) => r1(WY - (100 - v) * S * 0.86);
const P = (u, v) => `${tx(u)} ${ty(v)}`;
const TAIL =
  `M${P(39.5, 100)}C${P(42, 84)} ${P(44, 68)} ${P(45.5, 57)}` +
  `C${P(36, 52)} ${P(14, 41)} ${P(-2, 16)}` +
  `C${P(12, 25)} ${P(30, 28)} ${P(44, 31)}` +
  `Q${P(49, 33)} ${P(50, 39)}` +
  `Q${P(51, 33)} ${P(56, 31)}` +
  `C${P(70, 28)} ${P(88, 25)} ${P(102, 16)}` +
  `C${P(86, 41)} ${P(64, 52)} ${P(53.5, 57)}` +
  `C${P(56, 68)} ${P(58, 84)} ${P(60.5, 100)}Z`;

// Paper-coloured cuts across the ink, as an engraver would shade a body that
// is mostly in shadow: diagonal, close, and only on the lit (left) side.
const cuts = [];
// The right lobe is left solid: that is the side away from the light.
for (let i = -30; i < 42; i++) {
  const x0 = WX - 100 + i * 3.3;
  cuts.push(`M${r1(x0)} ${r1(WY - 130)}L${r1(x0 + 52)} ${r1(WY + 10)}`);
}

// Water streaming off the trailing edge, and the drops it throws.
const drips = [];
for (let i = 0; i < 12; i++) {
  const u = rnd() < 0.5 ? range(4, 38) : range(62, 96);
  const v0 = u < 50 ? 17 + (u - 2) * 0.38 : 17 + (98 - u) * 0.38;
  const len = range(5, 20);
  drips.push(`M${tx(u)} ${ty(v0 + 6)}L${r1(WX + (u - 50) * S + range(-1.5, 1.5))} ${r1(ty(v0 + 6) + len)}`);
}
const drops = [];
for (let i = 0; i < 22; i++) {
  const side = rnd() < 0.5 ? -1 : 1;
  const x = WX + side * range(10, 82);
  const y0 = WY - range(4, 70);
  drops.push(`<circle cx="${r1(x)}" cy="${r1(y0)}" r="${r1(range(0.7, 1.8))}"/>`);
}

// Rings where the tail leaves the water.
const rings = [];
for (let i = 0; i < 5; i++) {
  const rx = 20 + i * 15 + range(-2, 2);
  const ry = 3 + i * 1.6;
  const yy = WY + 2 + i * 2.2;
  rings.push(`M${r1(WX - rx)} ${r1(yy)}A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(WX + rx)} ${r1(yy)}`);
}

// ---- Out -------------------------------------------------------------------
const islandFill =
  "M-20 " + HORIZON +
  Array.from({ length: Math.ceil((W + 40) / 4) + 1 }, (_, i) => {
    const x = -20 + i * 4;
    return `L${x} ${r1(Math.min(HORIZON, ridge(x)))}`;
  }).join("") +
  `L${W + 20} ${HORIZON}Z`;

const paths = [...batches.entries()]
  .sort((a, b) => Number(a[0]) - Number(b[0]))
  .map(([w, ds]) => `<path stroke-width="${w}" d="${ds.join("")}"/>`)
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">
<!-- Generated by scripts/make-footer-sea.mjs. Edit the script, not this. -->
<defs><clipPath id="t"><path d="${TAIL}"/></clipPath></defs>
<rect x="-20" y="${HORIZON}" width="${W + 40}" height="${H - HORIZON + 20}" fill="${PAPER}"/>
<path d="${islandFill}" fill="${PAPER}"/>
<g fill="none" stroke="${INK}" stroke-linecap="round">
${paths}
</g>
<path d="${TAIL}" fill="${INK}"/>
<g clip-path="url(#t)" stroke="${PAPER}" stroke-width="0.9" opacity="0.85"><path d="${cuts.join("")}"/></g>
<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-width="1.1"><path d="${drips.join("")}"/></g>
<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-width="1.6"><path d="${rings.join("")}"/></g>
<g fill="${INK}">${drops.join("")}</g>
</svg>
`;

const out = fileURLToPath(new URL("../public/footer-sea.svg", import.meta.url));
writeFileSync(out, svg);
console.log(`footer-sea.svg  ${(svg.length / 1024).toFixed(0)} KB, ${[...batches.values()].reduce((n, b) => n + b.length, 0)} strokes`);
