// Run: node scripts/verify-headings.mjs <port-of-a-running-build>
//
// Every page gets exactly one h1, and the levels below it must not skip.
// Added because three pages had no h1 at all — SectionLabel renders an h2,
// which is right inside the home page and wrong when the label IS the page.
const BASE = 'http://localhost:' + (process.argv[2] || '3000');
import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await (await b.newContext({viewport:{width:430,height:900}})).newPage();
// /archive is not a page any more: it redirects home, so reading its h1 would
// only re-check the home page. Its redirect is asserted on its own below.
for (const path of ['/','/photo','/writing','/studio','/nope']) {
  const r=await p.goto(BASE+path,{waitUntil:'networkidle'});
  await p.waitForTimeout(500);
  const m=await p.evaluate(()=>{
    const hs=[...document.querySelectorAll('h1,h2,h3')].map(h=>+h.tagName[1]);
    const h1=document.querySelectorAll('h1');
    // a level must not be skipped from the top
    let ok=true, prev=0;
    for(const l of hs){ if(prev===0&&l!==1) ok=false; if(l-prev>1) ok=false; prev=l; }
    return {h1Count:h1.length, h1:h1[0]?.innerText.slice(0,26)??null, order:hs.slice(0,6), noSkips:ok};
  });
  console.log(`${path.padEnd(10)} ${r.status()}  h1×${m.h1Count} "${m.h1}"  levels ${JSON.stringify(m.order)}  ${m.h1Count===1&&m.noSkips?'ok':'CHECK'}`);
}
const a=await p.goto(BASE+'/archive',{waitUntil:'networkidle'});
console.log(`/archive   ${a.status()}  lands on ${new URL(p.url()).pathname}  ${new URL(p.url()).pathname==='/'?'ok':'CHECK'}`);
await b.close();
