// Run: node scripts/verify-glass.mjs <port-of-a-running-build>
//
// The liquid glass in globals.css — the nav pill, the mobile sheet and the
// visitor card. It already had a fallback for browsers with no
// backdrop-filter. It had none for the two settings where the material is
// actively worse than a solid surface:
//
//   prefers-reduced-transparency  somebody has told their system that
//                                 see-through surfaces make text hard to
//                                 read, which is what a tint over a moving
//                                 backdrop does
//   forced-colors                 a high-contrast mode where the user's own
//                                 palette replaces ours, and a tint plus a
//                                 specular sweep is decoration painted over
//                                 the colours they picked
//
// Neither word appeared anywhere in the stylesheet before this.
//
// The first check is a guard: the default must BE glass. Without it the whole
// file passes on a page that lost its backdrop-filter for some unrelated
// reason, reporting "filter off" three times and calling it a success.
//
// Playwright can emulate forced-colors directly; prefers-reduced-transparency
// has no API, so it goes through CDP's Emulation.setEmulatedMedia.
import { chromium } from 'playwright';

const PORT = process.argv[2];
if (!PORT) { console.error('usage: verify-glass.mjs <port>'); process.exit(2); }

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fail = 0;
const check = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fail++;
};

const read = async ({ transparency = false, forced = false }) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  if (transparency) {
    const s = await ctx.newCDPSession(p);
    await s.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
  }
  if (forced) await p.emulateMedia({ forcedColors: 'active' });
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  const got = await p.locator('.glass').first().evaluate((e) => {
    const c = getComputedStyle(e);
    return { filter: c.backdropFilter || c.webkitBackdropFilter || 'none' };
  });
  await ctx.close();
  return got;
};

const base = await read({});
check(base.filter !== 'none', 'guard: by default the glass is actually glass', base.filter);
if (base.filter === 'none') { console.log('\nguard failed — the rest would pass vacuously'); process.exit(1); }

const rt = await read({ transparency: true });
check(rt.filter === 'none', 'prefers-reduced-transparency: solid, not see-through', rt.filter);

const fc = await read({ forced: true });
check(fc.filter === 'none', 'forced-colors: the user’s palette is left alone', fc.filter);

await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nall checks passed');
process.exit(fail ? 1 : 0);
