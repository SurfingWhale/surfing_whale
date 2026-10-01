import { chromium } from 'playwright';
import { PNG } from 'pngjs';
// Run: node scripts/verify-chrome-effect.mjs <port-of-a-running-build>
// Proves each of the five steps the effect is built from, against the real
// page rather than a prototype. Added because "it works" is not a claim
// anyone should have to take on trust.
const PORT = process.argv[2];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const p = await ctx.newPage();
await p.goto(`http://localhost:${PORT}/`,{waitUntil:'networkidle'});
await p.evaluate(()=>document.getElementById('guest-notes').scrollIntoView());
await p.locator('#guest-notes').getByRole('button',{name:'Leave a note'}).first().click();
await p.waitForSelector('[role=dialog] svg[role="img"]');
await p.waitForTimeout(800);
const band = await p.$('[role=dialog] svg[role="img"]');

const dom = await p.evaluate(()=>{
  const s=document.querySelector('[role=dialog] svg[role="img"]');
  return {
    smil: s.querySelectorAll('animate,animateTransform,animateMotion,set').length,
    hasText: s.querySelectorAll('text').length,
    words: [...s.querySelectorAll('text')].map(t=>t.textContent),
    material: !!s.querySelector('filter[id$="-material"] feComposite[operator=arithmetic]'),
    lut: [...s.querySelectorAll('filter[id$="-surface"] feComponentTransfer > *')].map(n=>n.tagName+':'+n.getAttribute('type')),
    gradStops: s.querySelectorAll('linearGradient stop').length,
    spread: s.querySelector('linearGradient').getAttribute('spreadMethod'),
  };
});

const gt = [];
for (let i=0;i<4;i++){
  gt.push(await p.evaluate(()=>document.querySelector('[role=dialog] linearGradient').getAttribute('gradientTransform')));
  await p.waitForTimeout(140);
}

function stats(buf){
  const png=PNG.sync.read(buf); let ink=0,satSum=0,satMax=0,n=0,hues=new Set();
  for(let i=0;i<png.data.length;i+=4){
    const r=png.data[i],g=png.data[i+1],bl=png.data[i+2]; n++;
    const mx=Math.max(r,g,bl),mn=Math.min(r,g,bl),sat=mx-mn;
    if(mx<235) ink++; satSum+=sat; if(sat>satMax)satMax=sat;
    if(sat>45) hues.add(Math.round(Math.atan2(Math.sqrt(3)*(g-bl),2*r-g-bl)*57.3/20));
  }
  return {inkPct:+(100*ink/n).toFixed(1),satMean:+(satSum/n).toFixed(1),satMax,hues:hues.size};
}
function diff(a,b){const A=PNG.sync.read(a),B=PNG.sync.read(b);let c=0,t=0;
  for(let i=0;i<A.data.length;i+=4){t++;if(Math.abs(A.data[i]-B.data[i])+Math.abs(A.data[i+1]-B.data[i+1])+Math.abs(A.data[i+2]-B.data[i+2])>40)c++;}
  return +(100*c/t).toFixed(1);}

const shots=[]; for(let i=0;i<6;i++){shots.push(await band.screenshot()); await p.waitForTimeout(1000);}
const S0=stats(shots[0]);
await ctx.close();

// reduced motion must freeze it
const rc=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const rp=await rc.newPage();
await rp.goto(`http://localhost:${PORT}/`,{waitUntil:'networkidle'});
await rp.evaluate(()=>document.getElementById('guest-notes').scrollIntoView());
await rp.locator('#guest-notes').getByRole('button',{name:'Leave a note'}).first().click();
await rp.waitForSelector('[role=dialog] svg[role="img"]');
await rp.waitForTimeout(700);
const rb=await rp.$('[role=dialog] svg[role="img"]');
const r1=await rb.screenshot(); await rp.waitForTimeout(1500); const r2=await rb.screenshot();
const rmDiff=diff(r1,r2);
await b.close();

const rows=[
 ['Step 1  One plain shape — real <text>, not a path or an icon',
  // Asserts the SHAPE of the thing, not the copy — the words are allowed to
  // change without turning this red.
  dom.hasText>=1 && dom.words.every(w=>w && w.trim().length>0),
  `${dom.hasText} <text> element(s): ${dom.words.join(' / ')}`],
 ['Step 2  Inner shadow — feComposite arithmetic carving the bevel',
  dom.material, dom.material?'filter[-material] feComposite operator="arithmetic" present':'MISSING'],
 ['Step 3  A stripe that never stops — gradient, 3 stops, repeating',
  dom.gradStops===3 && dom.spread==='repeat', `${dom.gradStops} stops, spreadMethod="${dom.spread}"`],
 ['Step 3a  …and it actually moves (pixels change every second)',
  diff(shots[0],shots[1])>2, `${diff(shots[0],shots[1])}% of pixels changed in 1s`],
 ['Step 3b  …and it NEVER stops (still moving at t=5s)',
  diff(shots[4],shots[5])>2, `${diff(shots[4],shots[5])}% changed between 4s and 5s`],
 ['Step 3c  …driven by rAF, not SMIL (the WebKit hole)',
  dom.smil===0 && new Set(gt).size>1,
  `${dom.smil} SMIL elements; gradientTransform took ${new Set(gt).size} distinct values in 0.4s`],
 ['Step 4  Grey becomes colour — feFuncR/G/B type="table"',
  dom.lut.length===3 && dom.lut.every(x=>x.endsWith(':table')), dom.lut.join(', ')],
 ['Step 4a  …colour is actually on screen',
  S0.satMean>12, `mean saturation ${S0.satMean}/255, peak ${S0.satMax}`],
 ['Step 4b  …a range of hues, not one tint',
  S0.hues>=4, `${S0.hues} distinct hue buckets`],
 ['Extra   Band is not blank',
  S0.inkPct>8, `ink covers ${S0.inkPct}% of the band`],
 ['Extra   prefers-reduced-motion freezes it',
  rmDiff<2, `${rmDiff}% of pixels changed over 1.5s with reduce on`],
];
let pass=0;
console.log('STEP-BY-STEP CHECK — Chromium, production build\n');
for(const [n,ok,d] of rows){console.log(`${ok?'PASS':'FAIL'}  ${n}\n        ${d}`); if(ok)pass++;}
console.log(`\n${pass}/${rows.length} passed`);
