// Run: node scripts/verify-stage.mjs <port-of-a-running-build>
//
// The work stage on `/` — the dark panel with the display-size names over the
// backdrop. It is driven by `active`, and `active` used to move on mouseenter
// and on focus only. Neither fires on a phone: a tap on a <Link> navigates
// rather than focusing it, so the component sat on row 0 for ever. Three
// things were wrong at once and all three are visible in one screenshot:
//
//   1  the counter read 01 / 04 next to a list of seven
//   2  the line at the foot described row 0 while you looked at row 5
//   3  .stage-row's opacity ramp was NOT behind a pointer query — the ramp
//      that .work-row gates in the next rule down — so every row under the
//      first was faded to 0.52 with nothing able to undim it
//
// Check 2 is deliberately run with javascript OFF. Its first version scrolled
// to a row and asserted it was lit, which scrolling guarantees on its own: it
// passed against the un-gated CSS and was testing nothing.
//
// The fix drives `active` from scroll position where there is no pointer, so
// what is checked here is the user-visible consequence, not the mechanism.
//
// THE GUARD MATTERS MORE THAN THE CHECKS. Every assertion below is about what
// happens with no pointer, and a context that quietly reports (hover: hover)
// would pass all of them while testing nothing. So the first check is that
// the emulated profile really has no hover, and the run stops if it does not.
//
// Proved against the bug: reverting WorkStage to mouseenter-and-focus-only
// turns checks 2, 3 and 4 red and leaves 1 and 5 green.
import { chromium, devices } from 'playwright';

const PORT = process.argv[2];
if (!PORT) { console.error('usage: verify-stage.mjs <port>'); process.exit(2); }

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fail = 0;
const check = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fail++;
};

// ── no pointer ────────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

  const noHover = await p.evaluate(() => matchMedia('(hover: none)').matches);
  check(noHover, '1  guard: the mobile profile really reports (hover: none)');
  if (!noHover) { console.log('\nguard failed — the rest would be meaningless'); process.exit(1); }

  const rows = p.locator('[data-stage-row]');
  const n = await rows.count();
  const method = p.locator('[data-stage-method]');
  const count = p.locator('[data-stage-count]');

  const firstMethod = (await method.innerText()).trim();
  const firstCount = (await count.innerText()).trim();

  // Scroll the LAST row to the middle of the screen, which is what a reader
  // does by scrolling, and what the pointer used to do by arriving.
  await rows.nth(n - 1).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(700);

  const nowMethod = (await method.innerText()).trim();
  check(nowMethod !== firstMethod, '3  the line at the foot follows the row you are on',
    nowMethod === firstMethod ? `still "${firstMethod.slice(0, 44)}…"` : `"${nowMethod.slice(0, 44)}…"`);

  const nowCount = (await count.innerText()).trim();
  check(nowCount !== firstCount, '4  the counter follows too',
    `${firstCount} -> ${nowCount}`);

  await ctx.close();
}

// ── no pointer AND no javascript ──────────────────────────────────────────
// This is what check 2 used to get wrong. It scrolled to the last row and
// asserted that row was lit — but scrolling MAKES that row active, so its
// --row-dim is 1 whether the CSS is gated or not. It passed with the bug
// reinstated and was really just checks 3 and 4 a third time.
//
// The gating's actual job is the state where nothing is driving `active` at
// all: before hydration, or if the script never arrives. Then every row must
// read at full strength, because the ramp has no reader to follow.
{
  const ctx = await b.newContext({ ...devices['Pixel 7'], javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  const faded = await p.$$eval('[data-stage-row]', (els) =>
    els.map((el) => parseFloat(getComputedStyle(el).opacity)).filter((o) => o < 0.95));
  check(faded.length === 0, '2  with no pointer and no script, no row is stuck faded',
    faded.length ? `${faded.length} row(s) at ${faded.map((o) => o.toFixed(2)).join(', ')}` : 'all at full strength');
  await ctx.close();
}

// ── with a pointer, nothing changed ───────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  const rows = p.locator('[data-stage-row]');
  const method = p.locator('[data-stage-method]');
  const before = (await method.innerText()).trim();
  await rows.nth(3).hover();
  await p.waitForTimeout(400);
  const after = (await method.innerText()).trim();
  check(before !== after, '5  hover still drives it where there is a pointer',
    before === after ? 'caption did not move' : 'caption moved');
  await ctx.close();
}

await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nall checks passed');
process.exit(fail ? 1 : 0);
