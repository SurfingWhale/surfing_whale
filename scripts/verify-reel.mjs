// Run: node scripts/verify-reel.mjs <port-of-a-running-build> [path]
//
// The Remotion <Player> at the head of /work/dalrs. It is not a <video>, so
// verify-showreel.mjs cannot see it: there is no element to ask whether it is
// paused, and the frame lives in React state.
//
// Four things worth asserting, and the first is the one with teeth:
//
//   A  the player and the composition arrive LATE. 312 KB fetched for every
//      visitor who never pressed is the whole cost of this figure.
//   B  nothing plays on its own, and the control to start it is a real one
//   C  pressing it animates the thing, and scrolling away stops it
//   D  under prefers-reduced-motion there is no player at all — a poster, and
//      the rendered file offered as a link
//
// THREE FAULTS IN THIS FILE, all found by running it, none by reading it:
//
//   A matched request URLs against /remotion/i. Next hashes its chunk names,
//   so nothing ever matched and the check reported "no remotion requests"
//   whether the import was lazy or not.
//
//   A then counted bytes — and still reported the import as eager, three
//   builds in a row, because every viewport it used put the figure INSIDE the
//   observer's 320px margin. The chunk was being fetched during load because
//   the figure was already near, not because the split had failed. The split
//   had never failed. The check now uses a 100px viewport, which puts the
//   figure well below the fold and genuinely out of range, and the chunk
//   appears exactly on approach.
//
//   C looked for a <canvas>. Remotion's Player renders the composition as
//   ordinary DOM — divs and SVG — so the selector found nothing, C failed,
//   and the two checks after it passed by comparing -1 to -1. "Is it
//   animating" is now measured the only honest way available: the figure's
//   own markup, sampled twice, has to differ while playing and match while
//   stopped.
//
//   The press targets [data-reel-play], not the first button in the figure.
//   Once the Player mounts, its own "Play video" control is in there too, and
//   it sits under the poster overlay — so a click on it times out rather than
//   failing, which reads like a hang rather than a bug.
//
// Proved against the bug: importing ReelStage directly instead of through
// next/dynamic turns A red while B, C and D stay green.
import { chromium } from 'playwright';

const PORT = process.argv[2];
const PATH = process.argv[3] || '/work/dalrs';
if (!PORT) { console.error('usage: verify-reel.mjs <port> [path]'); process.exit(2); }

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fail = 0;
const check = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fail++;
};

// ── A, B, C ───────────────────────────────────────────────────────────────
{
  // 100px tall on purpose: it puts the figure far below the fold and outside
  // the observer's 320px margin, which is the only state in which "did this
  // load lazily" means anything.
  const ctx = await b.newContext({ viewport: { width: 430, height: 100 } });
  const p = await ctx.newPage();
  let js = 0, bytes = 0;
  p.on('response', async (r) => {
    if (!/\.js(\?|$)/.test(r.url())) return;
    js++;
    bytes += (await r.body().catch(() => Buffer.alloc(0))).length;
  });

  await p.goto(`http://localhost:${PORT}${PATH}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(1600);
  const onLoad = js, bytesOnLoad = bytes;

  const fig = p.locator('figure').first();
  const early = await fig.evaluate((f) => f.querySelectorAll('[title="Play video"]').length);
  check(early === 0, 'A  the player has not mounted before the figure is reached', `${early} player control(s)`);

  await fig.scrollIntoViewIfNeeded();
  await p.waitForTimeout(3000);
  check(js > onLoad, 'A  the player and composition arrive only on approach',
    `${onLoad} js files on load (${(bytesOnLoad / 1024).toFixed(0)}KB), ${js} after (${(bytes / 1024).toFixed(0)}KB)`);

  // The 100px viewport did its job; it is too short to press a 380x214
  // control in, so the rest of the run gets a real phone's height.
  await p.setViewportSize({ width: 430, height: 900 });
  await p.waitForTimeout(500);

  const btn = fig.locator('[data-reel-play]');
  const box = await btn.boundingBox({ timeout: 4000 }).catch(() => null);
  check(!!box && box.width >= 24 && box.height >= 24, 'B  a real play control on the poster',
    box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'none found');

  const before = await fig.evaluate((f) => f.innerHTML);
  await p.waitForTimeout(900);
  const stillBefore = await fig.evaluate((f) => f.innerHTML);
  check(before === stillBefore, 'B  nothing moves before it is pressed');

  if (box) await btn.click();
  await p.waitForTimeout(1800);
  const a = await fig.evaluate((f) => f.innerHTML);
  await p.waitForTimeout(900);
  const bHtml = await fig.evaluate((f) => f.innerHTML);
  check(a !== bHtml, 'C  pressing it animates the composition',
    a === bHtml ? 'markup identical 900ms apart' : `${Math.abs(a.length - bHtml.length)} chars changed`);

  await p.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
  await p.waitForTimeout(1500);
  const c = await fig.evaluate((f) => f.innerHTML);
  await p.waitForTimeout(1100);
  const d = await fig.evaluate((f) => f.innerHTML);
  check(c === d, 'C  and it stops once the figure leaves the screen',
    c === d ? 'frozen' : 'still animating off screen');
  await ctx.close();
}

// ── D ─────────────────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const chunks = [];
  p.on('request', (r) => { if (/remotion/i.test(r.url())) chunks.push(r.url()); });
  await p.goto(`http://localhost:${PORT}${PATH}`, { waitUntil: 'networkidle' });
  const fig = p.locator('figure').first();
  await fig.scrollIntoViewIfNeeded();
  await p.waitForTimeout(2000);

  check(await fig.locator('[data-reel-play]').count() === 0, 'D  reduced motion: no play control');
  check(await fig.locator('[title="Play video"]').count() === 0, 'D  reduced motion: no player mounts');
  check(await fig.locator('img').count() >= 1, 'D  reduced motion: the poster is there');
  const link = await fig.locator('a[href$=".mp4"]').count();
  check(link === 1, 'D  reduced motion: the rendered file is offered instead', `${link} mp4 link(s)`);
  await ctx.close();
}

await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nall checks passed');
process.exit(fail ? 1 : 0);
