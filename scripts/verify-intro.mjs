// Run: node scripts/verify-intro.mjs [port]  (default 3477)
//
// The opening is the one component that can lock somebody out of a site they
// have not seen yet, so this checks the ways it could, not the way it looks:
//
//   A  the ink is on screen before React, so there is no flash of the page
//   B  it plays once a session, not on every internal navigation
//   C  reduced motion gets no class and no overlay at all
//   D  with JavaScript off the page is simply served
//   E  with the JS chunks blocked — hydration never happens — the curtain
//      still leaves, and the page underneath is what a tap hits
//   F  on a slow connection there is no white before the ink, and no second
//      loading state. This is the bug it shipped with: the ink was in the
//      external stylesheet, the page is render-blocked on that file, and a
//      phone on 4G got 1.3s of white and THEN the counter
//   G  the colours inlined in <head> still match the tokens in globals.css —
//      the inline copy cannot use var(--fg), so it can drift
//
// E only means anything if the stylesheet still loads, so it blocks *.js and
// not everything under chunks/. Blocking both tests nothing: there would be
// no curtain to get stuck behind.
import { chromium } from 'playwright';
const PORT = process.argv[2] || '3477';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
let fails=0;
const check=(n,ok,got)=>{ console.log(`  ${ok?'PASS':'FAIL'}  ${n}${ok?'':'  -> '+got}`); if(!ok)fails++; };

// A — first paint is ink, not a flash of the page
{
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  const p=await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'commit'});
  await p.waitForTimeout(60);
  await p.screenshot({path:`${process.cwd()}/first.png`});
  const dark=await p.evaluate(()=>{
    const c=document.createElement('canvas');return getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
  });
  const cls=await p.evaluate(()=>document.documentElement.classList.contains('intro'));
  check('the class is on before anything renders', cls===true, String(cls));
  console.log('      --fg is', dark);
  for(let i=0;i<22;i++){ await p.screenshot({path:`${process.cwd()}/j${String(i).padStart(2,'0')}.png`}); await p.waitForTimeout(90); }
  await ctx.close();
}

// B — second visit in the same session plays nothing
{
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  const p=await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'networkidle'});
  await p.waitForTimeout(2600);
  await p.goto(`http://localhost:${PORT}/photo`,{waitUntil:'commit'});
  await p.waitForTimeout(80);
  const cls=await p.evaluate(()=>document.documentElement.classList.contains('intro'));
  check('second page in the same session: no intro', cls===false, String(cls));
  await ctx.close();
}

// C — reduced motion gets nothing at all
{
  const ctx=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const p=await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'commit'});
  await p.waitForTimeout(120);
  const cls=await p.evaluate(()=>document.documentElement.classList.contains('intro'));
  const el=await p.evaluate(()=>!!document.querySelector('.sw-intro'));
  check('reduced motion: no class', cls===false, String(cls));
  check('reduced motion: no overlay element', el===false, String(el));
  await p.screenshot({path:`${process.cwd()}/reduced.png`});
  await ctx.close();
}

// D — with JavaScript off the site is simply there
{
  const ctx=await b.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
  const p=await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
  await p.waitForTimeout(300);
  const hidden=await p.evaluate(()=>0).catch(()=>null);
  const txt=await p.textContent('body');
  check('JS off: the page content is served', (txt||'').includes('Muhammad'), (txt||'').slice(0,40));
  await p.screenshot({path:`${process.cwd()}/nojs.png`});
  await ctx.close();
}

// E — hydration never happens: the overlay must still leave
{
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  // Only the JavaScript. Aborting everything under chunks/ takes the
  // stylesheet with it, which tests nothing — there would be no curtain to
  // get stuck behind.
  await ctx.route('**/_next/static/chunks/**.js', r=>r.abort());
  const p=await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'commit'}).catch(()=>{});
  // Past the backstop in Intro.tsx (5s) plus its exit. React never mounts
  // here, so this is the only thing that can clear the ink.
  await p.waitForTimeout(6400);
  const blocked=await p.evaluate(()=>{
    const cs=getComputedStyle(document.documentElement,'::before');
    const hit=document.elementFromPoint(195,400);
    return {
      hadCurtain: cs.content !== 'none',
      visibility: cs.visibility,
      opacity: cs.opacity,
      hit: hit ? hit.tagName : 'none',
      hitIsPage: !!(hit && hit.closest('main')),
    };
  });
  check('no JS: there WAS a curtain to get stuck behind', blocked.hadCurtain===true, JSON.stringify(blocked));
  // The ink no longer moves — it is covered and then hidden — so the thing to
  // assert is that it stopped being visible, by CSS, with React never mounting.
  check('no JS: it left anyway (CSS, not React)', blocked.visibility==='hidden' || blocked.opacity==='0', `visibility=${blocked.visibility} opacity=${blocked.opacity}`);
  check('no JS: the page underneath is what you hit', blocked.hitIsPage===true, blocked.hit);
  await p.screenshot({path:`${process.cwd()}/nohydrate.png`});
  await ctx.close();
}
// F — a slow connection must show ink first, never white
{
  const { PNG } = await import('pngjs');
  const fs = await import('node:fs');
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  // Held back the way a real connection holds them back.
  await ctx.route('**/*.css', async r=>{ await new Promise(s=>setTimeout(s,900)); r.continue(); });
  await ctx.route('**/*.js',  async r=>{ await new Promise(s=>setTimeout(s,1200)); r.continue(); });
  const p=await ctx.newPage();
  const t0=Date.now();
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'commit'});
  let firstInk=null, whiteBefore=0, sawCount=false;
  for(let i=0;i<22;i++){
    const t=Date.now()-t0;
    const buf=await p.screenshot();
    const png=PNG.sync.read(buf);
    const idx=((png.height>>1)*png.width+(png.width>>1))<<2;
    const [r,g,bl]=[png.data[idx],png.data[idx+1],png.data[idx+2]];
    const ink = r<60&&g<60&&bl<60, white = r>230&&g>230&&bl>230;
    if (ink && firstInk===null) firstInk=t;
    if (firstInk===null && white) whiteBefore++;
    if (!sawCount) sawCount = await p.evaluate(()=>!!document.querySelector('.sw-intro-count')).catch(()=>false);
    await p.waitForTimeout(110);
  }
  check('slow connection: no white frame before the ink', whiteBefore===0, `${whiteBefore} white sample(s)`);
  check('slow connection: ink is up inside 300ms', firstInk!==null && firstInk<300, `first ink at ${firstInk}ms`);
  check('slow connection: the count still appears', sawCount===true, String(sawCount));
  await ctx.close();
}

// G — the inlined colours must not drift from the tokens
{
  const fs = await import('node:fs');
  const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const intro = fs.readFileSync(new URL('../app/components/Intro.tsx', import.meta.url), 'utf8');
  const light = (css.match(/--fg:\s*(#[0-9a-f]{3,8})/i)||[])[1];
  const dark  = [...css.matchAll(/--fg:\s*(#[0-9a-f]{3,8})/gi)].map(m=>m[1]).find(v=>v!==light);
  check(`inline ink matches --fg light (${light})`, intro.toLowerCase().includes(String(light).toLowerCase()), `globals has ${light}`);
  check(`inline ink matches --fg dark (${dark})`, intro.toLowerCase().includes(String(dark).toLowerCase()), `globals has ${dark}`);
}

console.log(fails?`\n${fails} FAILED`:'\nALL PASS');
await b.close();
process.exit(fails?1:0);
