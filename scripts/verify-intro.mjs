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
//      still leaves, by CSS, and the page underneath is what a tap hits
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
  await p.waitForTimeout(2600);
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
console.log(fails?`\n${fails} FAILED`:'\nALL PASS');
await b.close();
process.exit(fails?1:0);
