// scripts/generate-brand-assets.mjs
// Regenerates the two case-study share cards (og-finance, og-research) from
// public/whale-mark.svg,
// using the site's own webfont so the cards are set in the same typeface as
// the pages. Run after `npm run build` (it reads the built font), with
// playwright installed:
//
//   npm i -D playwright && node scripts/generate-brand-assets.mjs
//
// The icons, the favicon and the site's own share card are no longer made
// here. Since 2026-10-03 they come from the owner's whale-tail logo — blue
// ink on paper — cut out of its scan: public/logo-mark.webp (the mark),
// app/favicon.ico, public/favicon-32.png, public/icon-*.png,
// public/apple-touch-icon.png and public/og-surfing-whale.jpg. Running this
// used to overwrite all of them with the old wave-bars tile and the old card.
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

const whale = inline('public/whale-mark.svg');
const fontB64 = readFileSync(join(ROOT, FONT)).toString('base64');

const FACE = `@font-face{font-family:'Jakarta';src:url(data:font/woff2;base64,${fontB64}) format('woff2');font-weight:400 700;font-display:block}`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

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
  ['A ledger that behaves like a product.',
   'Case study \u00b7 Surfing Whale Finance', '/public/og-finance.png'],
  ['1,050 reviews, nine apps, two markets \u2014 read before a line was written.',
   'Market research \u00b7 April 2026', '/public/og-research.png'],
]) console.log('og', await shot(card(title, kicker, out), out));

await b.close();
