// Run: node scripts/verify-guest-note.mjs [port]   (default 3477)
//
// The card that asks for a guest note, on a phone, with notes already on the
// page. It was reported with a screenshot: the form opened magnified, its
// wordmark cropped and its send button off the right edge, with a guest-note
// card sitting on top of the name field.
//
// Two separate faults, both checked here:
//
//   A  nothing paints over the open card. The fan deals its cards with
//      z-index up to 100 — fine inside a fan, except those numbers were read
//      against the whole document, where they outrank the dialog's z-50.
//      Remove `isolate` from the fan's track and this check fails with
//      roughly 40% of the card covered.
//
//   B  every field in the card is at least 16px. Safari on iOS zooms the page
//      when a smaller field takes focus, and this card focuses its name field
//      on open — so it arrived zoomed before anybody typed. This one is a
//      platform rule, not something measured here: headless Chromium does not
//      zoom, so the check reads the font size and trusts the rule.
//
//   C  the gap between the heading group and the form beats the gap inside
//      the heading group, so the two read as two groups.
import { chromium } from 'playwright';
const PORT = process.argv[2] || '3477';
const NOTES = { notes: [
  { id: '1', name: 'Hadi', message: 'Great Job bradder, keep going', date: '2026-10-01' },
  { id: '2', name: 'Rina', message: 'Suka banget sama fotonya', date: '2026-09-28' },
  { id: '3', name: 'Tom', message: 'The crime map is excellent work.', date: '2026-09-20' },
]};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
await ctx.route('**/api/guest-notes', r => r.request().method() === 'GET' ? r.fulfill({ json: NOTES }) : r.continue());
const p = await ctx.newPage();
let fails = 0;
const check = (n, ok, got) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : '  -> ' + got}`); if (!ok) fails++; };

await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
await p.evaluate(() => document.documentElement.classList.remove('intro'));
// Open it from where the fan is on screen — the dialog centres itself, so
// this is what puts the fan behind the card. It is also what a reader does:
// you press the card after you have scrolled to the notes.
await p.evaluate(() => document.querySelector('[aria-roledescription="carousel"]')?.scrollIntoView({ block: 'center' }));
await p.waitForTimeout(600);
const trigger = await p.$('#guest-notes button[aria-haspopup="dialog"]');
check('the guest book opens from the section', Boolean(trigger), 'no trigger card');
await trigger.click();
const appeared = await p.waitForSelector('[role="dialog"]', { timeout: 4000 }).then(() => true).catch(() => false);
check('the card opens when the trigger is pressed', appeared, 'no dialog after the click');
if (!appeared) { console.log('\n1 FAILED'); await b.close(); process.exit(1); }
await p.waitForTimeout(700);

const r = await p.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]');
  const card = dlg.querySelector('.relative.w-full');
  const cr = card.getBoundingClientRect();
  let covered = 0, total = 0;
  const who = new Map();
  for (let y = cr.top + 4; y < cr.bottom - 4; y += 6)
    for (let x = cr.left + 4; x < cr.right - 4; x += 6) {
      total++;
      const el = document.elementFromPoint(x, y);
      if (el && !dlg.contains(el)) {
        covered++;
        const k = (el.closest('article') ? 'guest-note card' : el.tagName);
        who.set(k, (who.get(k) ?? 0) + 1);
      }
    }
  const fields = [...dlg.querySelectorAll('input, textarea')]
    .filter(i => i.offsetParent !== null)
    .map(i => ({ name: i.placeholder || i.ariaLabel || i.name, px: parseFloat(getComputedStyle(i).fontSize) }));
  const title = dlg.querySelector('#guest-note-card-title');
  const sub = title.nextElementSibling;
  const form = sub.nextElementSibling;
  const gapInGroup = form ? sub.getBoundingClientRect().top - title.getBoundingClientRect().bottom : null;
  const gapToForm = form ? form.getBoundingClientRect().top - sub.getBoundingClientRect().bottom : null;
  return {
    total, covered, who: [...who.entries()], fields,
    gapInGroup: +gapInGroup.toFixed(1), gapToForm: +gapToForm.toFixed(1),
    cardFitsWidth: cr.left >= 0 && cr.right <= innerWidth,
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});

console.log(`      ${r.covered} of ${r.total} points on the card painted by something outside it`);
check('A. nothing on the page paints over the open card', r.covered === 0, JSON.stringify(r.who));
const small = r.fields.filter(f => f.px < 16);
check('B. every field is 16px or more (iOS will not zoom)', small.length === 0, JSON.stringify(small));
console.log(`      heading→copy ${r.gapInGroup}px, copy→form ${r.gapToForm}px`);
check('C. the form is further from the heading than the heading is from its copy',
  r.gapToForm >= r.gapInGroup * 2, `${r.gapToForm} vs ${r.gapInGroup}`);
check('   the card fits the width of the screen', r.cardFitsWidth, 'card runs off the edge');
check('   and the page has no sideways scroll', r.pageOverflow <= 0, `${r.pageOverflow}px`);

console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
await b.close();
process.exit(fails ? 1 : 0);
