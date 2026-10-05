// Run: node scripts/verify-hallo.mjs [port]   (default 3477)
//
// The greeting's pinboard: plates scattered round the word, each cycling its
// own pictures. Four things, two of which are the ones a screensaver gets
// wrong.
//
//   A  the plates are where they are supposed to be — six on a wide screen,
//      four on a phone — and none of them lands on the word.
//   B  the pictures change on their own.
//   C  with prefers-reduced-motion they do NOT. A screensaver that ignores
//      that setting is the whole page moving at somebody who asked it not to.
//   D  no note is cut off. The picture can be cropped; the note is the part
//      that is supposed to be readable, and a capped single line turned every
//      one of them into "A PLANK IN CILI…".
import { chromium } from 'playwright';
import { createHash } from 'crypto';
const PORT = process.argv[2] || '3477';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (n, ok, got) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : '  -> ' + got}`); if (!ok) fails++; };

const open = async (w, h, reduced) => {
  const ctx = await b.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: 1,
    isMobile: w < 700, hasTouch: w < 700,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  return { ctx, p };
};
const sources = (p) => p.evaluate(() =>
  [...document.querySelectorAll('.hallo-plate img')].map((i) => i.getAttribute('src')).join('|'));

for (const [w, h, want] of [[1440, 900, 6], [390, 844, 4]]) {
  console.log(`\n-- ${w}x${h} --`);
  const { ctx, p } = await open(w, h, false);

  const layout = await p.evaluate(() => {
    const vis = [...document.querySelectorAll('.hallo-plate')].filter((e) => getComputedStyle(e).display !== 'none');
    // The WORD, not the box it sits in. `.hallo-word` is a full-width block,
    // so measuring against it reported four plates "on the word" when none of
    // them touched a letter. The <text> node's rect is the ink.
    const word = document.querySelector('.hallo-word text')?.getBoundingClientRect();
    const hits = vis.filter((e) => {
      const r = e.getBoundingClientRect();
      return word && r.left < word.right && r.right > word.left && r.top < word.bottom && r.bottom > word.top;
    }).length;
    const clipped = [...document.querySelectorAll('.hallo-note')].filter((e) => e.scrollWidth > e.clientWidth + 1)
      .map((e) => e.textContent.trim());
    const offTop = vis.filter((e) => e.getBoundingClientRect().top < 56).length;
    // The numbers: one per visible plate, reading (1)..(n) in order, each one
    // ABOVE its own picture. Hidden plates are last in the source so a phone
    // showing four of six still reads 1,2,3,4 rather than 1,2,4,6.
    const nums = vis.map((e) => e.querySelector('.hallo-num')?.textContent?.trim() ?? null);
    const aboveImg = vis.every((e) => {
      const nu = e.querySelector('.hallo-num'), im = e.querySelector('img');
      return nu && im && nu.getBoundingClientRect().bottom <= im.getBoundingClientRect().top + 1;
    });
    return { n: vis.length, hits, clipped, offTop, nums, aboveImg, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  check(`A. ${want} plates on screen`, layout.n === want, `${layout.n}`);
  check('   none of them on the word', layout.hits === 0, `${layout.hits} overlap`);
  check('   none under the header', layout.offTop === 0, `${layout.offTop} too high`);
  check('   no sideways scroll', layout.overflow <= 0, `${layout.overflow}px`);
  check('D. no note is cut off', layout.clipped.length === 0, JSON.stringify(layout.clipped));

  const wantNums = Array.from({ length: want }, (_, k) => `(${k + 1})`);
  check('E. every plate is numbered, in order', JSON.stringify(layout.nums) === JSON.stringify(wantNums), JSON.stringify(layout.nums));
  check('   and the number is above its picture', layout.aboveImg, 'a number sits beside or under its frame');

  // One plate changes per 700ms tick, so a 2.5s window must move at least
  // two of them. A window that could contain either N or N+1 changes makes
  // the test a coin toss, which is how the stagger bug survived its first
  // check.
  const a = (await sources(p)).split('|');
  await p.waitForTimeout(2500);
  const c = (await sources(p)).split('|');
  const moved = a.filter((v, i) => v !== c[i]).length;
  check('B. the pictures change on their own', moved >= 2, `${moved} of ${a.length} moved in 2.5s`);
  check('   and not all at once', moved < a.length, `all ${moved} changed together`);
  await ctx.close();
}

console.log('\n-- prefers-reduced-motion: reduce --');
{
  const { ctx, p } = await open(1440, 900, true);
  const a = await sources(p);
  await p.waitForTimeout(2500);
  const c = await sources(p);
  check('C. nothing moves', a === c, `changed: ${createHash('sha1').update(a).digest('hex').slice(0,8)} -> ${createHash('sha1').update(c).digest('hex').slice(0,8)}`);
  await ctx.close();
}

console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
await b.close();
process.exit(fails ? 1 : 0);
