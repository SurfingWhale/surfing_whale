// Run: node scripts/audit-seo.mjs <port-of-a-running-build>
//
// Crawls the site from the home page and reports the machine-checkable half of
// an SEO checklist: title and description lengths, duplicates, canonicals,
// heading structure, alt text, image dimensions, lang, robots, schema.
//
// It crawls rather than taking a list of routes, because what a crawler can
// reach IS one of the findings — a page nobody links to and no sitemap names
// does not exist as far as a search engine is concerned.
//
// It does not judge keywords, intent or backlinks. Those are not measurable
// from here and a checker that pretends otherwise is worse than none.
import { chromium } from 'playwright';
const PORT=process.argv[2]||'3477';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1280,height:900}});
const p=await ctx.newPage();

// discover public pages by crawling from the home page
const seen=new Set(['/']); const queue=['/']; const pages=[];
while(queue.length){
  const path=queue.shift();
  const r=await p.goto(`http://localhost:${PORT}${path}`,{waitUntil:'networkidle'}).catch(()=>null);
  if(!r) continue;
  const data=await p.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const imgs=[...document.querySelectorAll('main img, article img')];
    return {
      lang: document.documentElement.lang,
      title: document.title,
      desc: q('meta[name=description]')?.content ?? null,
      canonical: q('link[rel=canonical]')?.href ?? null,
      robots: q('meta[name=robots]')?.content ?? null,
      h1: [...document.querySelectorAll('h1')].map(h=>h.textContent.trim().replace(/\s+/g,' ').slice(0,40)),
      levels: [...document.querySelectorAll('h1,h2,h3,h4')].map(h=>+h.tagName[1]),
      schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>{try{const j=JSON.parse(s.textContent);return Array.isArray(j)?j.map(x=>x['@type']).join(','):j['@type'];}catch{return 'INVALID JSON';}}),
      imgs: imgs.length,
      noAlt: imgs.filter(i=>!i.getAttribute('alt')).length,
      emptyAlt: imgs.filter(i=>i.getAttribute('alt')==='').length,
      noDims: imgs.filter(i=>!i.width||!i.height).length,
      links: [...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h&&h.startsWith('/')&&!h.startsWith('//')),
      breadcrumb: !!q('nav[aria-label*="readcrumb" i], [class*=breadcrumb]'),
    };
  });
  pages.push({path, status:r.status(), ...data});
  for(const l of data.links){ const clean=l.split('#')[0].split('?')[0];
    if(clean && !seen.has(clean) && !clean.startsWith('/studio') && !clean.startsWith('/api') && seen.size<30){seen.add(clean);queue.push(clean);} }
}

const C=(s,n)=>String(s??'').padEnd(n).slice(0,n);
console.log('\n================ PAGES CRAWLED: '+pages.length+' ================\n');
console.log(C('path',26)+C('st',5)+C('title len',10)+C('desc len',10)+'canon  schema');
for(const x of pages){
  const tl=x.title?.length??0, dl=x.desc?.length??0;
  console.log(C(x.path,26)+C(x.status,5)+C(tl+(tl>=50&&tl<=60?' ok':' <<'),10)+C(dl+(dl>=120&&dl<=160?' ok':' <<'),10)+C(x.canonical?'yes':'NO',7)+(x.schema.length?x.schema.join('|'):'none'));
}

console.log('\n---- titles in full ----');
for(const x of pages) console.log(`  ${String(x.title?.length??0).padStart(3)}  ${x.path}  "${x.title}"`);

console.log('\n---- duplicate meta descriptions ----');
const byDesc=new Map();
for(const x of pages){const k=x.desc??'(none)';byDesc.set(k,[...(byDesc.get(k)??[]),x.path]);}
for(const [d,ps] of byDesc) if(ps.length>1) console.log(`  ${ps.length} pages share one description: ${ps.join(', ')}\n     "${String(d).slice(0,90)}..."`);

console.log('\n---- headings ----');
for(const x of pages){
  const skips=[]; for(let i=1;i<x.levels.length;i++) if(x.levels[i]-x.levels[i-1]>1) skips.push(`h${x.levels[i-1]}->h${x.levels[i]}`);
  console.log(`  ${C(x.path,24)} h1x${x.h1.length} ${x.h1.length===1?'ok ':'<< '} levels ${JSON.stringify(x.levels)} ${skips.length?'SKIPS '+skips.join(','):''}`);
}

console.log('\n---- images ----');
for(const x of pages) if(x.imgs) console.log(`  ${C(x.path,24)} ${x.imgs} imgs | missing alt attr: ${x.noAlt} | alt="" (decorative): ${x.emptyAlt} | no width/height: ${x.noDims}`);

console.log('\n---- lang / robots / breadcrumbs ----');
for(const x of pages) console.log(`  ${C(x.path,24)} lang=${C(x.lang,5)} robots=${C(x.robots??'(default)',14)} breadcrumb=${x.breadcrumb}`);

await b.close();
