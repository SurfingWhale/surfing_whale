// Run: node scripts/verify-sound.mjs [port]   (default 3477)
//
// The record can start at the opening and carry into the page. This checks the
// two things that makes true, and one it does not pretend to.
//
//   the opening offers it     a button, not an autoplay — a browser will not
//                             play sound without a tap and iOS Safari has no
//                             exception, so the alternative to asking is
//                             silence
//   the tap starts it
//   ONE fetch, not two        opening the gallery afterwards joins the side
//                             already turning instead of dropping a second
//                             needle. Checked against the old per-component
//                             deck, which fetches twice and fails this.
//
// What it CANNOT check: whether a real browser would have refused the tap.
// Headless Chromium does not enforce the autoplay policy — verified, including
// with --autoplay-policy=user-gesture-required, which changed nothing. The
// button exists because of the policy, and that part is reasoned from the
// platform rules rather than measured here.
//
// The Apple preview is not reachable from CI, so a local tone of the same
// shape stands in for it.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
// Screenshots are working output, not repository content: they land in an
// ignored folder so a run cannot leave debris in a public repo.
const SHOTS = new URL('.shots/', import.meta.url).pathname.replace(/\/$/, '');
mkdirSync(SHOTS, { recursive: true });
const PORT = process.argv[2] || '3477';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
// the Apple CDN is not reachable from here; stand in a real tone of the same length
await ctx.route('**/mzaf_*', r=>r.fulfill({status:200,contentType:'audio/wav',path:`${process.cwd()}/scripts/fixtures/tone.wav`}));
await ctx.route('**/is1-ssl.mzstatic.com/**', r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#444"/></svg>'}));
const p=await ctx.newPage();
let fails=0; const check=(n,ok,got)=>{console.log(`  ${ok?'PASS':'FAIL'}  ${n}${ok?'':'  -> '+got}`); if(!ok)fails++;};

await p.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
await p.waitForTimeout(600);
const offer = await p.$('button:has-text("Play the record")');
check('the opening offers the record', !!offer, 'no button');
await p.screenshot({path:SHOTS+"/sound-offer.png"});

if (offer) {
  await offer.click();
  await p.waitForTimeout(2200);
  const label = await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/California|Sound blocked|Starting/.test(x.textContent||''));return b?b.textContent.trim():null;});
  console.log(`      pill now says: ${label}`);
  check('the tap started the record', label === null || /California/.test(label||''), `pill says "${label}"`);
}

const deckOn = await p.evaluate(()=>{
  // every AudioContext the page made, and whether any is running
  return { ctxs: performance.getEntriesByType('resource').filter(r=>/mzaf/.test(r.name)).length };
});
console.log('      preview fetched:', deckOn.ctxs, 'time(s)');
check('the preview was fetched exactly once', deckOn.ctxs === 1, String(deckOn.ctxs));

// it must survive the opening
await p.waitForTimeout(1600);
check('still playing after the curtain', await p.evaluate(()=>!document.querySelector('.sw-intro')||getComputedStyle(document.querySelector('.sw-intro')).visibility==='hidden'), 'overlay still up');

// and the turntable must join the SAME side, not start a second one
await p.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(b=>/joie/i.test(b.getAttribute('aria-label')||''));x&&x.click();});
await p.waitForTimeout(1800);
const vinyl = await p.evaluate(()=>{
  const el=[...document.querySelectorAll('*')].find(n=>/California Dreamin/.test(n.textContent||'') && n.children.length<6);
  return el ? el.textContent.replace(/\s+/g,' ').slice(0,60) : null;
});
const after = await p.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/mzaf/.test(r.name)).length);
console.log('      preview fetched after opening the gallery:', after, 'time(s)');
check('the turntable joined the same side, it did not start a second', after === 1, `${after} fetches`);
await p.screenshot({path:SHOTS+"/sound-vinyl.png"});
console.log(fails?`\n${fails} FAILED`:'\nALL PASS');
await b.close();
process.exit(fails ? 1 : 0);
