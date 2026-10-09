// Run: node scripts/build-showreel.mjs [programme] [outDir]
//
// A 15-second motion piece. The engine is here; what it says is in
// scripts/reels/<programme>.mjs — `surfing-whale` is how a component on this
// site gets built, `salespal` is how that app was built. Two reels, one
// storyboard, because the second one was going to be this file copied with the
// words changed and that is how the timings drift apart.
//
// Driven by an explicit render(t) rather than CSS animations, so a frame is a
// pure function of time. Playwright asks for t = 0, 1/30, 2/30 … and gets the
// same picture every run — no real-time capture, no dropped frames, no
// "it looked different that time".
//
// Set in the site's own faces and tokens, embedded from the build's woff2 the
// way the brand book does it. A showreel for this site that used somebody
// else's typeface and somebody else's blue would be a showreel for a site that
// does not exist.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NAME = process.argv[2] || 'surfing-whale';
const OUT = process.argv[3] || join(ROOT, '.showreel', NAME);
const P = (await import(`./reels/${NAME}.mjs`)).default;
// A programme that is missing a field renders a reel with a hole in it and no
// error, which is the kind of thing that only shows up in the encode.
for (const k of ['slug','kicker','title','sub','stages','metrics','cards','chosen','chosenLabel','refusedLabel','refused','endLine','endLabel'])
  if (P[k] === undefined) { console.error(`programme ${NAME} is missing "${k}"`); process.exit(2); }
if (P.stages.length !== 6) { console.error(`programme ${NAME}: expected 6 stages, got ${P.stages.length}`); process.exit(2); }
if (P.metrics.length !== 4) { console.error(`programme ${NAME}: expected 4 metrics, got ${P.metrics.length}`); process.exit(2); }
if (P.cards.length !== 3) { console.error(`programme ${NAME}: expected 3 cards, got ${P.cards.length}`); process.exit(2); }
const FRAMES = join(OUT, 'frames');
const W = 1920, H = 1080, FPS = 30, SECONDS = 15;
const TOTAL = FPS * SECONDS;

const round = Math.round;
const MEDIA = join(ROOT, '.next/static/media');
const FACE = {
  jk: 'fba5a26ea33df6a3-s.p.0eehd8tgys7nv.woff2',
  mn: '797e433ab948586e-s.p.08e28id.o-okb.woff2',
  sr: 'e41d5df559864f9e-s.p.0gq7fw9.sy_5..woff2',
  sri: '7ebf22b5a21034f8-s.p.10_7676vm7pyy.woff2',
};
const b64 = (f) => {
  const p = join(MEDIA, f);
  if (!existsSync(p)) { console.error(`Missing face ${f}. Run \`npm run build\` first.`); process.exit(2); }
  return readFileSync(p).toString('base64');
};
const font = (fam, file, style = 'normal', weight = '100 900') =>
  `@font-face{font-family:'${fam}';font-style:${style};font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64(file)}) format('woff2')}`;

const markPath = P.mark ? join(ROOT, P.mark) : null;
const markType = P.mark?.endsWith('.png') ? 'image/png' : 'image/webp';
const MARK = markPath && existsSync(markPath)
  ? `data:${markType};base64,${readFileSync(markPath).toString('base64')}`
  : null;
if (P.mark && !MARK) { console.error(`programme ${NAME}: mark not found at ${P.mark}`); process.exit(2); }

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
${font('JK', FACE.jk)}
${font('MN', FACE.mn)}
${font('SR', FACE.sr, 'normal', '400')}
${font('SR', FACE.sri, 'italic', '400')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#fafafa}
body{font-family:JK,sans-serif;color:#111;position:relative}
#stage{position:absolute;inset:0;overflow:hidden}
.lab{font-size:15px;font-weight:500;text-transform:uppercase;letter-spacing:.14em;color:#76736f;white-space:nowrap}
.mn{font-family:MN,monospace;font-variant-numeric:tabular-nums}
.sr{font-family:SR,Georgia,serif;font-weight:400}
.abs{position:absolute}
.rule{position:absolute;background:#111;height:1px;transform-origin:left center}
.hair{position:absolute;background:rgba(17,17,17,.14);height:1px;transform-origin:left center}
</style></head><body><div id="stage"></div>
<script>
const W=${W},H=${H};
const stage=document.getElementById('stage');
const el=(cls,style,html)=>{const d=document.createElement('div');d.className=cls||'';if(style)d.setAttribute('style',style);if(html!=null)d.innerHTML=html;stage.appendChild(d);return d;};

// ── easing ───────────────────────────────────────────────────────────────
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
// Progress of t through [a,b], eased. The site's own curve, cubic-bezier(.2,0,0,1),
// approximated: fast out of the gate, long settle. Motion that arrives and stops.
const ease=x=>{x=clamp(x);return 1-Math.pow(1-x,3.2);};
const seg=(t,a,b)=>ease((t-a)/(b-a));
const out=(t,a,b)=>1-clamp((t-a)/(b-a));           // linear fade out
const win=(t,a,b,fin=.35,fout=.35)=>Math.min(ease((t-a)/fin), 1-clamp((t-(b-fout))/fout));
const lerp=(a,b,p)=>a+(b-a)*p;

// ── the content: the real flow of whichever programme was asked for ─────
const STAGES=${JSON.stringify(P.stages)};
const METRICS=${JSON.stringify(P.metrics)};
const CHOSEN=${P.chosen};

// ── build the DOM once; render(t) only moves it ──────────────────────────
const M=120;                      // page margin
const topRule = el('rule','left:'+M+'px;top:96px;width:'+(W-2*M)+'px');
const kicker  = el('lab abs','left:'+M+'px;top:62px',${JSON.stringify(P.kicker)});
const counter = el('lab mn abs','right:'+M+'px;top:62px;color:#111;font-weight:700','00 / 06');

const title = el('sr abs','left:'+M+'px;top:280px;font-size:124px;line-height:1.02;letter-spacing:-.02em;width:1300px','');
const sub   = el('abs','left:'+M+'px;top:586px;font-size:24px;line-height:1.6;color:#6f6f6f;width:720px','');

// Act 2 — the six stages as a rail
const rail=[];
for(let i=0;i<6;i++){
  const x=M+i*((W-2*M)/6);
  const g={};
  g.rule = el('hair','left:'+x+'px;top:620px;width:'+((W-2*M)/6-40)+'px');
  g.num  = el('lab mn abs','left:'+x+'px;top:638px;color:#111;font-weight:700;font-size:15px',STAGES[i][0]);
  g.name = el('abs','left:'+x+'px;top:666px;font-size:30px;letter-spacing:-.02em;color:#111',STAGES[i][1]);
  g.note = el('lab abs','left:'+x+'px;top:710px;width:'+((W-2*M)/6-40)+'px;white-space:normal;line-height:1.5',STAGES[i][2]);
  rail.push(g);
}

// Act 3 — three directions, one survives
const CARDS=${JSON.stringify(P.cards)};
const cards=[];
for(let i=0;i<3;i++){
  const c = el('abs','width:360px;height:460px;background:#fafafa;box-shadow:0 0 0 1px rgba(17,17,17,.14)');
  c.innerHTML =
    '<div style="position:absolute;left:22px;top:20px;font:700 14px MN,monospace;color:#111;letter-spacing:.08em">'+String.fromCharCode(65+i)+'</div>'+
    '<div style="position:absolute;left:22px;right:22px;top:52px;height:1px;background:rgba(17,17,17,.14)"></div>'+
    // The wireframe per card comes from the programme: three directions have
    // to look like three things, and what those three things were is the one
    // part of this act that is different for every reel.
    CARDS[i];
  cards.push(c);
}
const pickRule = el('rule','top:0;left:0;width:300px;opacity:0');
const pickLab  = el('lab abs','top:0;left:0;color:#111;font-weight:700;opacity:0',${JSON.stringify(P.chosenLabel)});

// Act 4 — the measurement HUD
const hud=[];
for(let i=0;i<4;i++){
  const y=420+i*98;
  const g={};
  g.rule=el('hair','left:'+M+'px;top:'+y+'px;width:'+(W-2*M)+'px');
  g.lab =el('lab abs','left:'+M+'px;top:'+(y+20)+'px',METRICS[i][0]);
  g.val =el('mn abs','left:'+(M+420)+'px;top:'+(y+2)+'px;font-size:52px;font-weight:700;color:#111','0');
  g.unit=el('lab abs','left:'+(M+640)+'px;top:'+(y+34)+'px',METRICS[i][2]);
  g.gate=el('lab mn abs','right:'+(M+180)+'px;top:'+(y+20)+'px',METRICS[i][3]);
  g.verdict=el('lab mn abs','right:'+M+'px;top:'+(y+20)+'px;font-weight:700','');
  g.bar =el('abs','left:'+M+'px;top:'+(y+88)+'px;height:2px;background:#2154a4;width:0');
  hud.push(g);
}
const refuseLab = el('lab abs','left:'+M+'px;top:800px;color:#111;font-weight:700;opacity:0',${JSON.stringify(P.refusedLabel)});
const refuseItem= el('abs','left:'+(M+200)+'px;top:792px;font-size:26px;color:#6f6f6f;opacity:0',${JSON.stringify(P.refused)});
const strike    = el('rule','left:'+(M+200)+'px;top:806px;width:0;background:#2154a4;height:2px');

// Act 5 — resolve
const mark = ${MARK ? `el('abs','width:220px;opacity:0').appendChild(Object.assign(document.createElement('img'),{src:'${MARK}'})).parentElement` : `el('abs','width:220px;height:120px;opacity:0')`};
mark.setAttribute('style','position:absolute;width:220px;opacity:0;left:'+(W/2-110)+'px;top:360px');
if(mark.firstChild&&mark.firstChild.tagName==='IMG'){mark.firstChild.setAttribute('style','width:100%;height:auto;display:block');}
const spine = el('sr abs','left:0;top:620px;width:'+W+'px;text-align:center;font-style:italic;font-size:${P.endSize ?? 46}px;color:#111;opacity:0',${JSON.stringify(P.endLine)});
// Below the line, not through it. The first version pinned this at 640px —
// twenty pixels under a line whose own box is seventy tall — so the label ran
// straight across the italic. It survived a review because the only picture
// taken of it was a storyboard thumbnail, at a size where a label struck
// through a sentence looks like a sentence.
const endlab= el('lab abs','left:0;top:${620 + round((P.endSize ?? 46) * 1.45) + 30}px;width:'+W+'px;text-align:center;opacity:0',${JSON.stringify(P.endLabel)});

const show=(n,o)=>{n.style.opacity=o;};
const T=(n,x,y,s)=>{n.style.transform='translate('+x+'px,'+y+'px)'+(s!=null?' scale('+s+')':'');};

// ── the storyboard ───────────────────────────────────────────────────────
function render(t){
  // chrome
  topRule.style.width=((W-2*M)*ease(t/0.9))+'px';
  show(kicker, win(t,.35,14.4,.5,.4));
  show(counter, win(t,.35,14.4,.5,.4));
  const stageNo = t<2.2?0 : t<5.6?Math.min(6,Math.floor((t-2.2)/.5)+1) : t<9.4?2 : t<12.6?4 : 6;
  counter.textContent = String(stageNo).padStart(2,'0')+' / 06';

  // ACT 1 — the question
  const a1=win(t,.55,2.30,.55,.40);
  show(title,a1);
  title.innerHTML=${JSON.stringify(P.title)};
  T(title,0, lerp(26,0,seg(t,.55,1.5)));
  show(sub,win(t,1.0,2.30,.5,.40));
  sub.textContent=${JSON.stringify(P.sub)};
  T(sub,0,lerp(18,0,seg(t,1.0,1.9)));

  // ACT 2 — six stages
  rail.forEach((g,i)=>{
    const a=2.40+i*0.17;
    const p=win(t,a,5.5,.45,.35);
    g.rule.style.width=((W-2*M)/6-40)*ease((t-a)/.5)+'px';
    [g.num,g.name,g.note].forEach(n=>{show(n,p);T(n,0,lerp(22,0,seg(t,a,a+.5)));});
    g.rule.style.opacity=p;
  });

  // ACT 3 — three directions, one survives
  //
  // The losers have to go SOMEWHERE. The first version moved card i by
  // (i-1)*70, which is zero for the middle card: it stayed exactly where the
  // winner was heading and spent the whole beat hidden behind it. Each card
  // now has an explicit lane, and the losers leave along it.
  const CW=360, GAP=100, LANE=CW+GAP;           // three lanes, centred as a group
  const CX=W/2-CW/2, CY=330;
  const dealt=win(t,5.65,9.3,.5,.4);
  cards.forEach((c,i)=>{
    const a=5.7+i*0.16;
    const p=clamp(ease((t-a)/.55));
    const chosen = i===CHOSEN;
    const dealX = CX+(i-1)*LANE*p;              // fan out from the middle
    const k = clamp((t-7.9)/.75);               // the moment of choosing
    // winner walks to centre; losers continue outward and step back
    const x = chosen ? lerp(dealX, CX, ease(k))
                     : lerp(dealX, dealX+(i-1)*230, ease(k));
    const y = CY + (chosen ? lerp(0,-22,ease(k)) : lerp(0,34,ease(k)));
    c.style.opacity = dealt*p*(chosen ? 1 : lerp(1,.14,ease(k)));
    T(c, x, y, chosen ? lerp(1,1.14,ease(k)) : lerp(1,.9,ease(k)));
    c.style.zIndex = chosen?3:1;
    c.style.filter = chosen?'none':'grayscale('+ease(k)+')';
  });
  const pw=clamp((t-8.45)/.6);
  pickRule.style.opacity=dealt*pw;
  pickRule.style.width=(CW*1.14*ease(pw))+'px';
  pickRule.style.left=(W/2-CW*1.14/2)+'px';
  pickRule.style.top=(CY-22+460*1.14+34)+'px';
  show(pickLab, dealt*clamp((t-8.7)/.55));
  pickLab.style.left=(W/2-CW*1.14/2)+'px';
  pickLab.style.top=(CY-22+460*1.14+52)+'px';

  // ACT 4 — measure
  const a4=win(t,9.45,12.5,.5,.4);
  hud.forEach((g,i)=>{
    const a=9.5+i*0.11;
    const p=win(t,a,12.5,.4,.35);
    [g.rule,g.lab,g.val,g.unit,g.gate,g.verdict].forEach(n=>{n.style.opacity=p;});
    T(g.lab,0,lerp(16,0,seg(t,a,a+.45)));
    // the figure counts up to its real value
    const cp=ease((t-a-.15)/.85);
    const target=parseFloat(METRICS[i][1]);
    g.val.textContent = (METRICS[i][1].includes('.')? (target*cp).toFixed(2) : Math.round(target*cp));
    g.bar.style.opacity=p;
    g.bar.style.width=((W-2*M)*ease((t-a-.1)/.8))+'px';
    // the verdict lands only once the bar has finished
    const done=(t-a-.1)/.8>=1;
    g.verdict.textContent = done?'PASS':'…';
    g.verdict.style.color = done?'#2154a4':'#76736f';
  });
  show(refuseLab, win(t,11.2,12.5,.4,.35));
  show(refuseItem, win(t,11.2,12.5,.4,.35));
  strike.style.opacity=win(t,11.6,12.5,.3,.35);
  strike.style.width=(560*ease((t-11.65)/.5))+'px';

  // ACT 5 — resolve
  const a5=clamp((t-12.65)/.8);
  show(mark, ease(a5));
  T(mark,0,lerp(26,0,ease(a5)));
  show(spine, ease((t-12.95)/.85));
  show(endlab, ease((t-13.5)/.8));
  // the top rule retracts on the last beat
  if(t>14.2) topRule.style.width=((W-2*M)*(1-ease((t-14.2)/.8)))+'px';
}
window.__render=(t)=>{render(t);return true;};
render(0);
</script></body></html>`;

mkdirSync(OUT, { recursive: true });
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
const htmlPath = join(OUT, `${P.slug}.html`);
writeFileSync(htmlPath, HTML);
console.log(`html   -> ${htmlPath} (${(Buffer.byteLength(HTML)/1024).toFixed(0)} KB)`);

const require_ = createRequire(join(ROOT, 'package.json'));
const pw = await import(require_.resolve('playwright'));
const chromium = pw.chromium ?? pw.default?.chromium;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

for (let i = 0; i < TOTAL; i++) {
  await page.evaluate((t) => window.__render(t), i / FPS);
  await page.screenshot({ path: join(FRAMES, `f${String(i).padStart(4, '0')}.png`) });
  if (i % 60 === 0) process.stdout.write(`  frame ${i}/${TOTAL}\r`);
}
await browser.close();
console.log(`frames -> ${TOTAL} at ${FPS}fps`);

const ffmpeg = execFileSync('python3', ['-I', '-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const mp4 = join(OUT, `${P.slug}-showreel.mp4`);
execFileSync(ffmpeg, ['-y', '-framerate', String(FPS), '-i', join(FRAMES, 'f%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
  '-movflags', '+faststart', mp4], { stdio: 'inherit' });
const { statSync } = await import('fs');
console.log(`mp4    -> ${mp4} (${(statSync(mp4).size/1024/1024).toFixed(2)} MB, ${SECONDS}s)`);

// A vp9 encode as well, and the page lists it SECOND. The assumption going in
// was that vp9 would win on flat vector-ish frames; measured, it loses — 509 KB
// against 390 KB for the same fifteen seconds. So the mp4 goes first and
// everything mainstream takes it; this file exists for a Chromium built
// without proprietary codecs, which is what the checkers here drive.
const webm = join(OUT, `${P.slug}-showreel.webm`);
execFileSync(ffmpeg, ['-y', '-framerate', String(FPS), '-i', join(FRAMES, 'f%04d.png'),
  '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-crf', '32', '-b:v', '0',
  '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', webm], { stdio: 'inherit' });
console.log(`webm   -> ${webm} (${(statSync(webm).size/1024/1024).toFixed(2)} MB, ${SECONDS}s)`);

// The poster is a real frame, not a separate drawing: the still somebody sees
// before pressing play is the film's own picture of its subject.
const poster = join(OUT, `${P.slug}-poster.png`);
execFileSync(ffmpeg, ['-y', '-i', join(FRAMES, `f${String(P.posterFrame ?? 135).padStart(4, '0')}.png`),
  '-frames:v', '1', poster], { stdio: 'inherit' });
console.log(`poster -> ${poster} (frame ${P.posterFrame ?? 135})`);
