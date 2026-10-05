// Run: node scripts/verify-tap-targets.mjs [port]   (default 3477)
//
// Standalone controls on a phone, against WCAG 2.5.8 AA: 24×24 CSS pixels.
//
// What this does NOT count, and why it matters that it does not: a link
// inside a sentence. 2.5.8 exempts them by name, and an earlier sweep that
// counted them reported two dozen "failures" on pages that had none — every
// one of them a phrase like "Read how it was made →" sitting in a paragraph,
// where the target is the line of text and making it 24px tall would mean
// setting body copy at 24px. Counting those would be measuring the wrong
// thing and reporting it as a fault, which is worse than not measuring.
//
// So: a control is standalone when it is not inside a <p> and has no text
// sibling beside it. Those are the ones a finger has to find on its own.
import { chromium } from 'playwright';
const PORT = process.argv[2] || '3477';
const PAGES = ['/', '/photo', '/writing', '/testament', '/work/crime-la', '/work/padel', '/work/coffee-access', '/work/finance-dashboard'];
const MIN = 24;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
let fails = 0;

for (const path of PAGES) {
  await p.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.documentElement.classList.remove('intro'));
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(450);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(350);
  const small = await p.evaluate((MIN) => {
    const out = [], seen = new Set();
    for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), textarea, select')) {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.05) continue;
      if (r.width === 0 || r.height === 0) continue;
      if (el.closest('p')) continue;                       // a link in a sentence
      const sib = [...el.parentElement.childNodes].some(n => n.nodeType === 3 && n.textContent.trim() && n !== el);
      if (sib && el.tagName === 'A') continue;             // reads as running text
      if (r.height >= MIN && r.width >= MIN) continue;
      const label = (el.getAttribute('aria-label') || el.textContent || el.placeholder || '').trim().slice(0, 34);
      const k = label + Math.round(r.width) + 'x' + Math.round(r.height);
      if (seen.has(k)) continue; seen.add(k);
      out.push({ label, w: Math.round(r.width), h: Math.round(r.height) });
    }
    return out;
  }, MIN);
  const ok = small.length === 0;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${path}`);
  small.forEach(s => console.log(`          ${s.w}x${s.h}  "${s.label}"`));
  if (!ok) fails++;
}
console.log(fails ? `\n${fails} page(s) FAILED` : '\nALL PASS');
await b.close();
process.exit(fails ? 1 : 0);
