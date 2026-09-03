// scripts/generate-brand-assets.mjs
// Regenerates the icons from public/data-wave-mark.svg and the share cards
// from public/whale-mark.svg,
// using the site's own webfont so the cards are set in the same typeface as
// the pages. Run after `npm run build` (it reads the built font), with
// playwright installed:
//
//   npm i -D playwright && node scripts/generate-brand-assets.mjs
//
// FONT points at the Latin subset of Plus Jakarta Sans; the hash changes
// when the font or Next version does, so check .next/static/media if the
// cards come out in a fallback face.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = process.env.SW_FONT ?? '.next/static/media/fba5a26ea33df6a3-s.p.0eehd8tgys7nv.woff2';
// The files carry intrinsic width/height so an <image> can letterbox them;
// inline in HTML those same attributes make them render at their own size and
// overflow whatever box they are put in.
const inline = (file) => readFileSync(join(ROOT, file), 'utf8')
  .replace(/\swidth="\d+"\sheight="\d+"/, '')
  .replace('<svg ', '<svg style="width:100%;height:auto;display:block" preserveAspectRatio="xMidYMid meet" ');

// The whale still signs the share cards. It does not make the app icon: the
// rising arrow in it reads as finance, and this is a data portfolio.
const whale = inline('public/whale-mark.svg');
// Seven bars whose heights make a wave — a distribution, and the name. The
// 32px cut drops to four bars; seven would fall under three pixels each.
const waveMark = inline('public/data-wave-mark.svg');
const waveMark32 = inline('public/data-wave-mark-32.svg');
const fontB64 = readFileSync(join(ROOT, FONT)).toString('base64');

const FACE = `@font-face{font-family:'Jakarta';src:url(data:font/woff2;base64,${fontB64}) format('woff2');font-weight:400 700;font-display:block}`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// ── Icons ────────────────────────────────────────────────────────────────
// A filled tile, not the mark on paper. On a home screen the old icon sat on
// #fafafa like most other apps and its thin strokes disappeared at 48px; there
// was nothing to pick it out by. The brand green fills the whole tile now and
// the mark is knocked out of it in the site's paper colour.
const TILE = 'linear-gradient(145deg,#2E9E8F,#3F9E6F)';
const KNOCKOUT = '#FAFAFA';

// inset is the share of the canvas left clear around the mark. Android crops
// the maskable icon to whatever shape the launcher uses, so its mark has to
// sit well inside the circle that survives.
async function icon(size, inset, out, mark = waveMark) {
  const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;width:${size}px;height:${size}px;background:${TILE};
      color:${KNOCKOUT};display:grid;place-items:center">
    <div style="width:${100 - inset * 2}%;display:grid;place-items:center">${mark}</div></body>`);
  await p.waitForTimeout(120);
  await p.screenshot({ path: join(ROOT, out), omitBackground: false });
  await p.close();
  return out;
}

for (const [size, inset, out, mark] of [
  [192, 20, '/public/icon-192.png'],
  [512, 20, '/public/icon-512.png'],
  [512, 26, '/public/icon-maskable-512.png'],
  [180, 20, '/public/apple-touch-icon.png'],
  [32, 14, '/public/favicon-32.png', waveMark32],
]) console.log('icon', await icon(size, inset, out, mark));

// ── Share card ───────────────────────────────────────────────────────────
const card = (title, kicker, out) => `
<style>${FACE}
 *{margin:0;box-sizing:border-box}
 body{width:1200px;height:630px;background:#fafafa;font-family:Jakarta,sans-serif;
      display:flex;flex-direction:column;justify-content:space-between;
      padding:76px 80px;position:relative;overflow:hidden}
 .kicker{font-size:22px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#84817c}
 .title{font-size:58px;line-height:1.28;font-weight:500;letter-spacing:-.02em;color:#111;max-width:760px;text-wrap:balance}
 .foot{font-size:22px;color:#6f6f6f;letter-spacing:.02em}
 .mark{position:absolute;right:-40px;bottom:-30px;width:440px;opacity:.16}
 .rule{position:absolute;left:0;right:0;top:0;height:6px;
       background:linear-gradient(90deg,#2E9E8F,#71C08F,#A4DE6C)}
</style>
<div class="rule"></div>
<div class="mark">${whale}</div>
<div class="kicker">${kicker}</div>
<div class="title">${title}</div>
<div class="foot">surfing-whale.vercel.app</div>`;

async function shot(html, out) {
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.setContent(html);
  await p.evaluateHandle('document.fonts.ready');
  await p.waitForTimeout(250);
  await p.screenshot({ path: join(ROOT, out) });
  await p.close();
  return out;
}

for (const [title, kicker, out] of [
  ['I like building things that tell a story rather than report a number.',
   'Muhammad Fauzy', '/public/og.png'],
  ['A ledger that behaves like a product.',
   'Case study \u00b7 Surfing Whale Finance', '/public/og-finance.png'],
  ['1,050 reviews, nine apps, two markets \u2014 read before a line was written.',
   'Market research \u00b7 April 2026', '/public/og-research.png'],
]) console.log('og', await shot(card(title, kicker, out), out));

await b.close();
