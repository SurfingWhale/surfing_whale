// Run: node scripts/verify-contrast.mjs <port-of-a-running-build>
//
// Walks every visible text node in both themes, resolves whatever CSS colour
// syntax it is written in, composites translucent ink over the background it
// actually sits on, and reports anything under WCAG AA.
//
// Two things it gets right that the obvious version does not, both of which
// it got wrong first:
//   it resolves colours through a canvas, because parsing numbers out of an
//   oklab() string reads lightness and two opponent axes as red, green and
//   blue — that reported every white-on-dark row in the work panel as 1.13:1;
//   it composites rgba text over its real background rather than over black.
import { chromium } from 'playwright';
const PORT=process.argv[2];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for (const theme of ['light','dark']) {
  const ctx=await b.newContext({viewport:{width:430,height:900}});
  const p=await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'networkidle'});
  await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t), theme);
  await p.waitForTimeout(600);
  const out = await p.evaluate(()=>{
    // Resolve ANY css colour — rgb, oklab, color-mix — through a canvas.
    // Parsing the numbers out of the string only works for rgb(); on an
    // oklab() string it reads lightness and two opponent axes as if they were
    // red, green and blue, which reported every white-on-dark row in the work
    // panel as 1.13:1. The checker was broken, not the page.
    const cv=document.createElement('canvas'); cv.width=cv.height=1;
    const cx=cv.getContext('2d',{willReadFrequently:true});
    // A translucent foreground has to be composited over the colour it
    // actually sits on. Compositing it over black — which is what filling the
    // canvas black first does — makes every rgba() text darker than it is and
    // the ratio wrong in both directions.
    const rgbOn=(c, under='#000')=>{cx.clearRect(0,0,1,1);cx.fillStyle=under;cx.fillRect(0,0,1,1);
      cx.fillStyle=c;cx.fillRect(0,0,1,1);const d=cx.getImageData(0,0,1,1).data;return [d[0],d[1],d[2]];};
    const rgbOf=(c)=>rgbOn(c,'#fff').join()===rgbOn(c,'#000').join()?rgbOn(c):rgbOn(c);
    const lumRGB=(arr)=>{const [r,g,b]=arr.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*r+.7152*g+.0722*b;};
    // bg is always opaque by the time bgOf finds it; fg is composited onto it.
    const ratio=(fg,bg)=>{const B=rgbOn(bg,'#fff'); const F=rgbOn(fg,`rgb(${B})`);
      const L1=lumRGB(F),L2=lumRGB(B);return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);};
    const bgOf=(el)=>{let n=el;while(n&&n!==document.documentElement){const c=getComputedStyle(n).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;n=n.parentElement;}return getComputedStyle(document.body).backgroundColor;};
    const sel=getComputedStyle(document.querySelector('p'),'::selection');
    const rows=[];
    rows.push({what:'::selection', fg:`rgb(${rgbOn(sel.color,'#fff')})`, bg:`rgb(${rgbOn(sel.backgroundColor,'#fff')})`,
               r:+ratio(sel.color,sel.backgroundColor).toFixed(2), size:16, bold:false});
    for (const el of document.querySelectorAll('p,span,a,button,li,h1,h2,h3,dd,label')) {
      const t=el.textContent?.trim(); if(!t||t.length<3) continue;
      if (el.querySelector('p,span,a,button,li,h1,h2,h3')) continue;
      const r=el.getBoundingClientRect(); if(r.width<4||r.height<4) continue;
      const cs=getComputedStyle(el); if(cs.visibility==='hidden'||+cs.opacity<0.3) continue;
      const fg=cs.color, bg=bgOf(el);
      const size=parseFloat(cs.fontSize), bold=+cs.fontWeight>=700;
      rows.push({what:t.slice(0,44), fg, bg, r:+ratio(fg,bg).toFixed(2), size, bold});
    }
    return rows;
  });
  const need=(x)=>(x.size>=24||(x.size>=18.66&&x.bold))?3:4.5;
  const fails=out.filter(x=>x.r<need(x));
  console.log(`\n=== ${theme} ===  ${out.length} text nodes checked, ${fails.length} below WCAG AA`);
  for (const f of fails.slice(0,12)) console.log(`  ${String(f.r).padStart(5)}:1 (needs ${need(f)})  ${f.fg} on ${f.bg}  "${f.what}"`);
  await ctx.close();
}
await b.close();
