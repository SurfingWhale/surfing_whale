// Run: node scripts/verify-lang.mjs <port-of-a-running-build>
//
// The EN/ID interface switch.
//
// The scope is the point, and it is the thing worth asserting. This switches
// the CHROME — buttons, labels, the words a reader operates. It does not
// touch the writing. PRD §38: /work/dalrs is in Indonesian because DALRS is
// an Indonesian product and translating "serah terima" would have been
// translating the subject. The brand book's voice was extracted from live
// copy; running that copy through a second language would flatten the thing
// it describes.
//
// So check 5 is as important as checks 2 and 3: the prose must NOT move.
//
// Check 1 is the guard. Every assertion after it depends on there being a
// control to press, and a selector that matches nothing would otherwise let
// "the text did not change" read as a pass.
import { chromium } from 'playwright';

const PORT = process.argv[2];
if (!PORT) { console.error('usage: verify-lang.mjs <port>'); process.exit(2); }

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fail = 0;
const check = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fail++;
};

const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
await p.addInitScript(() => sessionStorage.setItem('sw-intro-seen', '1'));
await p.goto(`http://localhost:${PORT}/work/salespal`, { waitUntil: 'networkidle' });

const toggle = p.locator('[data-lang-toggle]').first();
const box = await toggle.boundingBox({ timeout: 4000 }).catch(() => null);
check(!!box && box.width >= 24 && box.height >= 24, '1  guard: a real control exists',
  box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'none found');
if (!box) { console.log('\nguard failed — nothing after this is meaningful'); process.exit(1); }

// The nav back-link is the clearest piece of chrome on a reading page.
const back = p.locator('nav a').first();
const beforeNav = (await back.innerText()).trim();
check(/Work/i.test(beforeNav), '2  it starts in English', beforeNav);

// The prose is sampled BEFORE and AFTER, so check 5 compares like with like.
const proseBefore = (await p.locator('article p').first().innerText()).trim();

await toggle.click();
await p.waitForTimeout(500);
const afterNav = (await back.innerText()).trim();
check(afterNav !== beforeNav && /Karya/i.test(afterNav),
  '3  pressing it switches the chrome to Indonesian', afterNav);

const proseAfter = (await p.locator('article p').first().innerText()).trim();
check(proseAfter === proseBefore,
  '5  and leaves the writing exactly as it was authored',
  proseAfter === proseBefore ? 'unchanged' : 'THE PROSE MOVED');

await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(400);
const afterReload = (await p.locator('nav a').first().innerText()).trim();
check(/Karya/i.test(afterReload), '4  the choice survives a reload', afterReload);

// Back to English, so the check leaves nothing behind in storage.
await p.locator('[data-lang-toggle]').first().click();
await p.waitForTimeout(400);
check(/Work/i.test((await p.locator('nav a').first().innerText()).trim()),
  '6  and it switches back');

await ctx.close();
await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nall checks passed');
process.exit(fail ? 1 : 0);
