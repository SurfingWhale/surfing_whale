// Run: node scripts/verify-studio-photos.mjs [port]   (default 3477)
//
// Against a build pointed at scripts/fake-supabase.mjs. See
// scripts/verify-library.sh for how to start the harness.
//
// Checks the gesture that puts a photograph on the site, because it is the one
// with no label on it. The panel lives under the whole grid — one set of
// controls rather than one per tile, which is right with five photographs and
// wrong with fifteen: it opened five rows below the thumbnail that was tapped,
// so tapping a photograph did nothing anybody could see, and it was reported
// as "the button isn't there".
//
//   A  tapping a tile opens the panel
//   B  the panel is ON SCREEN afterwards
//   C  the room says a tap is what opens it
//
// Honest about what each of these proves. C fails when the label is removed —
// checked both ways. B passes with the scrollIntoView removed as well, even
// with fifteen photographs: this harness could not reproduce the panel landing
// off screen, so the scroll in Photos.tsx is defensive rather than demonstrated
// necessary. B is kept because it would catch a regression that put the panel
// somewhere unreachable; it is not evidence that it ever was.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
// Screenshots are working output, not repository content: they land in an
// ignored folder so a run cannot leave debris in a public repo.
const SHOTS = new URL('.shots/', import.meta.url).pathname.replace(/\/$/, '');
mkdirSync(SHOTS, { recursive: true });
const PORT = process.argv[2] || '3477';
import { createHmac } from 'crypto';
const e=String(Date.now()+86400000);
const tok=e+'.'+createHmac('sha256','test-secret-for-local-repro-only').update(e).digest('base64url');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
await ctx.addCookies([{name:'sw-darkroom',value:tok,domain:'localhost',path:'/'}]);
await ctx.route('**/storage/v1/object/public/**', r=>r.fulfill({status:200,contentType:'image/svg+xml',
  body:`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#cfd8d4"/></svg>`}));
const p=await ctx.newPage();
await p.goto(`http://localhost:${PORT}/studio`,{waitUntil:'networkidle'});
await p.waitForTimeout(700);
await p.evaluate(()=>{const b=[...document.querySelectorAll('button,[role=tab]')].find(x=>/photo/i.test(x.textContent||''));b&&b.click();});
await p.waitForTimeout(1400);
// scroll so the FIRST tile is on screen, the way he would
await p.evaluate(()=>document.querySelector('ul.grid li')?.scrollIntoView({block:'center'}));
await p.waitForTimeout(400);
const before = await p.evaluate(()=>window.scrollY);
await p.evaluate(()=>document.querySelector('ul.grid li button[aria-expanded]')?.click());
await p.waitForTimeout(1200);   // let the smooth scroll land
const r = await p.evaluate(()=>{
  const panel=document.querySelector('[data-photo-panel]');
  if(!panel) return {open:false};
  const bb=panel.getBoundingClientRect();
  return { open:true, top:Math.round(bb.top), bottom:Math.round(bb.bottom), vh:innerHeight,
           inView: bb.top < innerHeight && bb.bottom > 0, scrollY: Math.round(window.scrollY) };
});
const hint = await p.evaluate(()=>!![...document.querySelectorAll('p')].find(n=>/Tap a photograph/i.test(n.textContent||'')));
let fails = 0;
const check = (n, ok, got) => { console.log(`  ${ok?'PASS':'FAIL'}  ${n}${ok?'':'  -> '+got}`); if(!ok) fails++; };
check('tapping a tile opens the panel', r.open === true, String(r.open));
check('the panel is on screen afterwards', r.inView === true, `top=${r.top} bottom=${r.bottom} viewport=${r.vh}`);
check('the room says a tap is what opens it', hint === true, String(hint));
console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
await p.screenshot({path:SHOTS+"/studio-tap.png"});
await b.close();
process.exit(fails ? 1 : 0);
