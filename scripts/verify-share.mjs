// Run: node scripts/verify-share.mjs <port-of-a-running-build> [path]
//
// The share row at the foot of a written-up page. What this is really here to
// catch is ONE bug, and it is the bug every share button has:
//
//   copying window.location.href instead of the page's own address.
//
// It cannot be caught by looking at the page, because on the machine where it
// was written the two are the same string. It shows up later, as a link in
// somebody's chat pointing at a Vercel preview deployment that asks a stranger
// to sign in, or at localhost, or at a branch URL that is deleted a week
// later. So the test loads the page from localhost on purpose and asserts the
// clipboard holds the canonical host instead.
//
// Proved against the bug: swapping `url` for `window.location.href` in the
// component turns B red (clipboard says http://localhost:<port>/…) while every
// other check stays green — including the ones that merely confirm a button is
// there and reacts, which is what a looser test would have checked.
import { chromium } from 'playwright';

const PORT = process.argv[2];
const PATHS = process.argv[3]
  ? [process.argv[3]]
  : ['/work/salespal', '/work/padel', '/work/coffee-access', '/work/crime-la',
     '/work/finance-dashboard', '/work/tracker-doc', '/testament'];
const CANON = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fail = 0;
const check = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fail++;
};

for (const path of PATHS) {
  console.log(`\n── ${path}`);
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);

  const row = p.locator('section[aria-labelledby="share-head"]');
  check(await row.count() === 1, 'A  the row is on the page', `${await row.count()} found`);
  if (!(await row.count())) { await ctx.close(); continue; }

  // The label goes back to "Copy link" 2.4 seconds after the press, so
  // everything that depends on having just pressed it is read FIRST, in one
  // go. The version before this one read the label after two more Playwright
  // round trips and reported the button broken — the window had closed. Same
  // fault as the greeting-plate test earlier in this project: an assertion
  // racing the thing it is asserting about is a coin toss, not a check.
  const copy = row.locator('button').first();
  await copy.scrollIntoViewIfNeeded();
  await copy.click();
  await p.waitForTimeout(200);
  const after = await p.evaluate(() => {
    const r = document.querySelector('section[aria-labelledby="share-head"]');
    return {
      label: r.querySelector('button')?.textContent?.trim() ?? '',
      live: r.querySelector('[aria-live]')?.textContent?.trim() ?? '',
    };
  });
  const clip = await p.evaluate(() => navigator.clipboard.readText());

  // B — the one that matters. The page was loaded from localhost; the
  // clipboard must not say so.
  check(CANON.test(clip) && !clip.includes('localhost'), 'B  copies the page\'s own address, not the one it was loaded from', clip);

  // C — the outbound links carry the same address
  const hrefs = await row.locator('a[href^="http"]').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  const encoded = encodeURIComponent(clip);
  check(hrefs.length >= 2, 'C  the outbound shares are there', `${hrefs.length} links`);
  check(hrefs.every((h) => h.includes(encoded) || h.includes(encodeURIComponent(clip).replace(/%20/g, '+'))),
    'C  every outbound link carries that same address',
    hrefs.map((h) => h.slice(0, 44)).join(' · '));

  // D — the button says something happened, and says it out loud
  check(after.label.toLowerCase().includes('copied'), 'D  the button reports it copied', after.label);
  check(after.live.toLowerCase().includes('copied'), 'D  and the live region announces it', after.live || '(empty)');

  // E — standalone controls, WCAG 2.5.8. Links inside a sentence are exempt
  // by name in that success criterion, and the row's closing line is two of
  // them; counting those reported a 122x15 "failure" on a row that has none,
  // which is the same over-count verify-tap-targets.mjs documents.
  const small = await row.evaluate((r) =>
    [...r.querySelectorAll('a, button')]
      .filter((e) => !(e.tagName === 'A' && e.closest('p')))
      .map((e) => ({ t: (e.textContent || '').trim().slice(0, 18), ...e.getBoundingClientRect().toJSON() }))
      .filter((b) => b.width < 24 || b.height < 24)
      .map((b) => `${b.t} ${Math.round(b.width)}x${Math.round(b.height)}`));
  check(small.length === 0, 'E  every standalone control is at least 24x24', small.join(', ') || 'all pass');

  // F — the reply line, which is the point of the whole row
  const note = await row.locator('p').last().textContent();
  check(/wall|write to me/i.test(note || ''), 'F  it says where a reply can go', (note || '').slice(0, 56) + '…');

  await ctx.close();
}

// G — the native share sheet. It is the button most people on a phone will
// actually use, and it only renders where navigator.share exists. This
// headless browser has none, so every run above checked the ABSENT case
// without saying so; here it is given one and the button has to appear.
// Without this the feature could have been dead on every phone and the suite
// would still have been green.
{
  console.log('\n── with navigator.share (stubbed)');
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      value: (d) => { window.__shared = d; return Promise.resolve(); },
      configurable: true,
    });
  });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}${PATHS[0]}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const row = p.locator('section[aria-labelledby="share-head"]');
  const share = row.getByRole('button', { name: /share/i });
  check(await share.count() === 1, 'G  the native share button appears', `${await share.count()} found`);
  if (await share.count()) {
    await share.scrollIntoViewIfNeeded();
    await share.click();
    await p.waitForTimeout(200);
    const sent = await p.evaluate(() => window.__shared);
    check(!!sent && CANON.test(sent.url) && !sent.url.includes('localhost'),
      'G  and hands the sheet the page\'s own address', sent ? sent.url : '(nothing)');
    check(!!sent?.title, 'G  with a title', sent?.title?.slice(0, 40));
  }
  await ctx.close();
}

await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nall checks passed');
process.exit(fail ? 1 : 0);
