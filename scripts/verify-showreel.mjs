// Run: node <this> <port> <path>
//
// The three things the brand book's Motion page forbids, asserted against a
// running build rather than against the source:
//   A  the mp4 is not fetched until somebody presses play
//   B  nothing plays on its own
//   C  playback stops when the figure leaves the screen
//
// Proved to fail before it was trusted, and the second half of that was not a
// formality. Adding `autoplay loop muted preload=auto` turns A and B red, as
// expected. Gutting the IntersectionObserver AT THE SAME TIME left C green —
// because Chrome pauses an autoplaying muted video of its own accord when it
// scrolls out of view, so the browser was doing the work the check was
// crediting to this component. Breaking ONLY the observer, on an otherwise
// shipped build, turns C red (paused=false, t=4.00). Two bugs at once can
// cancel; break one thing at a time.
import { chromium } from 'playwright';
const PORT = process.argv[2], PATH = process.argv[3] || '/work/salespal';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
const p = await ctx.newPage();

const media = [];
p.on('request', (r) => { if (/\.(mp4|webm)(\?|$)/.test(r.url())) media.push(r.url()); });

await p.goto(`http://localhost:${PORT}${PATH}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);

let fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fail++;
};

// A — nothing fetched
check('mp4 not fetched before a press', media.length === 0, media.length ? media.join(', ') : 'no media requests');

// B — nothing playing
const v = p.locator('video').first();
await v.scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
const state0 = await v.evaluate((n) => ({ paused: n.paused, t: n.currentTime, preload: n.preload, autoplay: n.autoplay, loop: n.loop }));
check('video is paused on arrival', state0.paused === true, `paused=${state0.paused}`);
check('no autoplay attribute', state0.autoplay === false);
check('no loop attribute', state0.loop === false);
check('preload is none', state0.preload === 'none', `preload=${state0.preload}`);
check('still nothing fetched after it is on screen', media.length === 0, media.join(', '));

// the play affordance is a real control, not a bare icon
// A missing button is a FAIL, not a crash: autoplay unmounts the overlay, so
// the broken version is exactly the one where this locator never resolves.
const btn = p.locator('figure button').first();
const box = await btn.boundingBox({ timeout: 4000 }).catch(() => null);
check('play control is at least 24x24', !!box && box.width >= 24 && box.height >= 24,
  box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'no play control on the poster');

if (box) await btn.click();
await p.waitForTimeout(2500);
const state1 = await v.evaluate((n) => ({ paused: n.paused, t: n.currentTime, controls: n.controls }));
check('plays when pressed', state1.paused === false && state1.t > 0.2, `t=${state1.t.toFixed(2)} paused=${state1.paused}`);
check('native controls appear after the press', state1.controls === true);
check('mp4 fetched only after the press', media.length > 0, media.join(', '));

// C — scroll it away
await p.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
await p.waitForTimeout(1500);
const state2 = await v.evaluate((n) => ({ paused: n.paused, t: n.currentTime }));
check('pauses once it leaves the screen', state2.paused === true, `paused=${state2.paused} t=${state2.t.toFixed(2)}`);

await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nall checks passed');
process.exit(fail ? 1 : 0);
