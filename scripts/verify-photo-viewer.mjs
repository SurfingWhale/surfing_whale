// Run: node scripts/verify-photo-viewer.mjs <port-of-a-running-build>
//
// The gallery's fullscreen viewer, checked the way it is actually used. It was
// shipped without any of this: Back left the site instead of closing the
// photograph, the only way out was a small grey ✕ at the bottom right over the
// phone's own chrome, and focus never entered the dialog that calls itself
// aria-modal.
//
// The first fix introduced a second bug this file caught — depending on the
// caller's inline `onClose` made every effect re-run on each step, so pressing
// → closed the viewer. That is why D exists.
import { chromium } from 'playwright';
const PORT = process.argv[2] || '3000';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
const p=await ctx.newPage();
const isOpen=()=>p.evaluate(()=>!!document.querySelector('[role=dialog][aria-modal=true]'));
const marker=()=>p.evaluate(()=>!!history.state?.photoViewer);
async function prime(){
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'networkidle'});
  await p.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(b=>/joie/i.test(b.getAttribute('aria-label')||''));x&&x.click();});
  await p.waitForTimeout(900);
  await p.evaluate(()=>document.querySelector('#photography')?.scrollIntoView());
  await p.waitForTimeout(400);
}
const open=async()=>{await p.evaluate(()=>{const b=document.querySelector('.photo-masonry figure button');b.focus();b.click();});await p.waitForTimeout(500);};
let fails=0;
const check=(name,got,want)=>{const ok=got===want;if(!ok)fails++;console.log(`  ${ok?'PASS':'FAIL'}  ${name}: ${got}${ok?'':' (expected '+want+')'}`);};

await prime();
console.log('-- A. close with the top-left Back button --');
await open(); check('dialog opened', await isOpen(), true); check('history entry marked ours', await marker(), true);
await p.evaluate(()=>[...document.querySelectorAll('[role=dialog] button')].find(b=>/Back/.test(b.textContent)).click());
await p.waitForTimeout(700);
check('dialog closed', await isOpen(), false);
check('our history entry was popped', await marker(), false);

console.log('\n-- B. Escape --');
await open(); await p.keyboard.press('Escape'); await p.waitForTimeout(700);
check('dialog closed', await isOpen(), false);
check('our history entry was popped', await marker(), false);

console.log('\n-- C. browser / system Back closes the photo, not the site --');
await open();
await p.goBack(); await p.waitForTimeout(800);
check('dialog closed', await isOpen(), false);
check('still on the site', p.url().startsWith(`http://localhost:${PORT}`), true);

console.log('\n-- D. stepping through photos adds no extra history entries --');
await prime(); await open();
for(let i=0;i<3;i++){await p.evaluate(()=>document.querySelector('[aria-label="Next photograph"]')?.click());await p.waitForTimeout(250);}
check('viewer still open after 3 steps', await isOpen(), true);
await p.goBack(); await p.waitForTimeout(800);
check('ONE Back closes it', await isOpen(), false);
check('still on the site', p.url().startsWith(`http://localhost:${PORT}`), true);

console.log('\n-- E. focus moves in, and comes back --');
await prime(); await open();
check('focus is inside the dialog', await p.evaluate(()=>{const d=document.querySelector('[role=dialog]');return !!(d&&d.contains(document.activeElement));}), true);
check('focus landed on the way out', await p.evaluate(()=>/Back/.test(document.activeElement?.textContent||'')), true);
await p.keyboard.press('Escape'); await p.waitForTimeout(700);
check('focus returned to the thumbnail', await p.evaluate(()=>!!document.activeElement?.closest('.photo-masonry')), true);

console.log('\n-- F. Tab is trapped --');
await open();
const seq=[];for(let i=0;i<6;i++){await p.keyboard.press('Tab');seq.push(await p.evaluate(()=>{const d=document.querySelector('[role=dialog]');return !!(d&&d.contains(document.activeElement));}));}
check('6 Tabs all stayed inside', seq.every(Boolean), true);

console.log('\n-- G. the way out is where the rest of the site puts it --');
const box=await p.evaluate(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(x=>/Back/.test(x.textContent));const r=b.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};});
console.log('  Back button box:', JSON.stringify(box));
check('in the top-left quadrant', box.x<innerWidthGuess()/2 && box.y<200, true);
check('hit area at least 24x24', box.w>=24&&box.h>=24, true);
function innerWidthGuess(){return 390;}
console.log(`\n${fails===0?'ALL PASS':fails+' FAILED'}`);
await b.close();
process.exit(fails?1:0);
