// Run: node scripts/build-brand-book.mjs [outDir]
//
// Builds docs/brand/brand-book.html and prints it to docs/brand/brand-book.pdf.
//
// Every value in the book is read from the source it documents — the tokens
// out of app/globals.css, the faces out of the build's own self-hosted woff2,
// the contrast ratios computed here rather than quoted. A brand book that
// drifts from the thing it describes is worse than none, so the rule is: if a
// number is not derivable, it does not go in.
//
// The book is also held to its own rules. No gradient, no shadow where a rule
// will do, the label alphabet for labels, the mono for every figure. If the
// system cannot set a fifteen-page document about itself, it is not a system.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { createRequire } from 'module';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || join(ROOT, 'docs/brand');
mkdirSync(OUT, { recursive: true });

/* ── the faces ─────────────────────────────────────────────────────────── */
// Next self-hosts the Google faces into .next/static/media at build time, so
// the book can embed the exact files the site serves. No request leaves for a
// font CDN here either.
const MEDIA = join(ROOT, '.next/static/media');
const FACES = {
  jakarta: 'fba5a26ea33df6a3-s.p.0eehd8tgys7nv.woff2',
  mono: '797e433ab948586e-s.p.08e28id.o-okb.woff2',
  oswald: '6ad1cda2f16975ee-s.p.0t8o_f0a-dk8w.woff2',
  serif: 'e41d5df559864f9e-s.p.0gq7fw9.sy_5..woff2',
  serifItalic: '7ebf22b5a21034f8-s.p.10_7676vm7pyy.woff2',
};
const b64 = (f) => {
  const p = join(MEDIA, f);
  if (!existsSync(p)) {
    console.error(`Missing ${f}. Run \`npm run build\` first — the faces come from .next/static/media.`);
    console.error(`What is there: ${existsSync(MEDIA) ? readdirSync(MEDIA).join(', ') : '(no media dir)'}`);
    process.exit(2);
  }
  return readFileSync(p).toString('base64');
};
const face = (family, file, weight = '400', style = 'normal') =>
  `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};font-display:block;` +
  `src:url(data:font/woff2;base64,${b64(file)}) format('woff2')}`;

/* ── the tokens, read from the stylesheet they live in ─────────────────── */
const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');

// Part A is not invented. It is read out of app/data/testament.ts — Fauzy's own
// statement of what this site is for, in his words, unedited — the same way the
// colours are read out of the stylesheet. A brand foundation written ABOUT
// somebody by somebody else is a guess with a letterhead; this one quotes him.
const testamentSrc = readFileSync(join(ROOT, 'app/data/testament.ts'), 'utf8');
const TEST_PARAS = [...testamentSrc.matchAll(/^\s{4}"((?:[^"\\]|\\.)*)",$/gm)].map((m) => m[1]);
const TEST_PULL = (testamentSrc.match(/pull:\s*"((?:[^"\\]|\\.)*)"/) || [, ''])[1];
if (TEST_PARAS.length < 5 || !TEST_PULL) {
  console.error(`Could not read the Testament (${TEST_PARAS.length} paragraphs, pull="${TEST_PULL}").`);
  console.error('Part A quotes it directly — building without it would mean writing his beliefs for him.');
  process.exit(2);
}
// One sentence out of a paragraph, by its opening words, so a quote is always
// his sentence and never a paraphrase that drifted.
const sentence = (i, starts) => {
  const hit = (TEST_PARAS[i].match(/[^.]+\./g) || []).find((x) => x.trim().startsWith(starts));
  if (!hit) { console.error(`Testament paragraph ${i} no longer contains: "${starts}"`); process.exit(2); }
  return hit.trim();
};
const tokenIn = (block, name) => {
  const m = block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};
const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('--ease-out'));
// The spacing scale is declared in a second :root block, below the one the
// colours live in — so it is read from the whole stylesheet. Slicing to the
// first block silently produced a Space page with its scale missing, which is
// the failure mode of every generator that reads its source by offset.
const spaceBlock = css;
// Pick the dark block by what is IN it, not by the first mention of the
// media query. The stylesheet opens with a custom-media definition that also
// says `prefers-color-scheme: dark`, forty lines above the theme itself — so
// indexing the first match sliced the LIGHT :root and the book published the
// light values in its dark column and in half its contrast table. The
// assertion below is the cheap invariant that would have caught it.
const darkBlock = (() => {
  // The right block is the one whose --bg is not the light --bg. Testing only
  // that a window "contains --bg" is not enough: the first match here is a
  // custom-media definition forty lines above the light :root, and a window
  // from it reaches that :root and passes. The value is the discriminator.
  const lightBgRaw = (lightBlock.match(/--bg\s*:\s*([^;]+);/) || [])[1];
  const re = /prefers-color-scheme:\s*dark/g;
  let m;
  while ((m = re.exec(css))) {
    const block = css.slice(m.index, m.index + 2400);
    const bg = (block.match(/--bg\s*:\s*([^;]+);/) || [])[1];
    if (bg && bg.trim() !== (lightBgRaw || '').trim()) return block;
  }
  return '';
})();

const TEXT_TOKENS = ['--fg', '--fg-secondary', '--fg-muted', '--fg-body', '--fg-label', '--brand-ink'];
const SURFACE_TOKENS = ['--bg', '--bg-subtle', '--bg-muted', '--doc', '--folder'];
const LINE_TOKENS = ['--border', '--border-strong'];
const SPACE_TOKENS = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6'];

const read = (names, block) => names.map((n) => [n, tokenIn(block, n)]).filter(([, v]) => v);

/* ── contrast, computed ────────────────────────────────────────────────── */
const parse = (v) => {
  let m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1];
  m = v.match(/rgba?\(([^)]+)\)/);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0], p[1], p[2], p[3] ?? 1]; }
  return null;
};
const lum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const flatten = (fg, bg) => fg[3] >= 1 ? fg : fg.map((c, i) => i < 3 ? Math.round(c * fg[3] + bg[i] * (1 - fg[3])) : 1);
const ratio = (fg, bg) => {
  const a = lum(flatten(fg, bg)), b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const lightBg = parse(tokenIn(lightBlock, '--bg'));
const darkBg = parse(tokenIn(darkBlock, '--bg'));
// If the two themes read the same, a block was sliced wrong and every colour
// page below is a lie. Refuse to build rather than publish it.
if (!darkBg || tokenIn(darkBlock, '--fg') === tokenIn(lightBlock, '--fg')) {
  console.error('The dark block did not parse: dark --fg reads the same as light.');
  console.error('The book would publish the light palette twice. Fix the parser, not this message.');
  process.exit(2);
}
const contrastRows = TEXT_TOKENS.map((n) => {
  const l = parse(tokenIn(lightBlock, n)), d = parse(tokenIn(darkBlock, n));
  return { n, l: l && ratio(l, lightBg), d: d && ratio(d, darkBg) };
}).filter((r) => r.l && r.d);


/* ── the book's own stylesheet ─────────────────────────────────────────── */
// Held to the rules it documents: the site's five tokens for ink, its spacing
// scale, rules instead of shadows, the mono for every figure, the label
// alphabet for every label.
const STYLE = `
${face('JK', FACES.jakarta, '200 800')}
${face('MN', FACES.mono, '100 900')}
${face('OS', FACES.oswald, '400 700')}
${face('SR', FACES.serif)}
${face('SR', FACES.serifItalic, '400', 'italic')}

:root{
  --bg:#fafafa; --fg:#111111; --fg-body:#6f6f6f; --fg-label:#76736f;
  --fg-muted:rgba(17,17,17,.58); --border:rgba(17,17,17,.08);
  --border-strong:rgba(17,17,17,.14); --brand:#2154a4;
  --s1:4px; --s2:8px; --s3:16px; --s4:32px; --s5:64px;
}
@page{ size:A4 portrait; margin:0 }
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:JK,sans-serif;background:var(--bg);color:var(--fg);
     font-size:9.5pt;line-height:1.6;font-weight:400}

.page{
  width:210mm; height:297mm; padding:20mm 18mm 16mm;
  background:var(--bg); position:relative; overflow:hidden;
  page-break-after:always; break-after:page;
  display:flex; flex-direction:column;
}
.page:last-child{page-break-after:auto;break-after:auto}

/* The running head: a rule, a label left, a figure right. The same three
   pieces as an index row on the site, because that is the site's one way of
   heading a block of anything. */
.rh{display:flex;align-items:baseline;justify-content:space-between;gap:var(--s3);
    border-top:1px solid var(--fg);padding-top:var(--s2);margin-bottom:var(--s4)}
.lab{font-size:7.5pt;font-weight:500;text-transform:uppercase;letter-spacing:.14em;
     line-height:1.5;color:var(--fg-label)}
.fig{font-family:MN,monospace;font-size:7.5pt;font-variant-numeric:tabular-nums;
     color:var(--fg-muted);flex-shrink:0}
.fig-strong{font-family:MN,monospace;font-weight:700;font-variant-numeric:tabular-nums;color:var(--fg)}

h1{font-family:SR,Georgia,serif;font-weight:400;font-size:30pt;line-height:1.04;
   letter-spacing:-.015em;margin-bottom:var(--s3)}
h2{font-family:SR,Georgia,serif;font-weight:400;font-size:19pt;line-height:1.1;
   letter-spacing:-.012em;margin-bottom:var(--s2)}
h3{font-size:9.5pt;font-weight:600;margin-bottom:var(--s1)}
p{color:var(--fg-body);max-width:62ch}
p + p{margin-top:var(--s2)}
p.lead{color:var(--fg);font-size:11pt;line-height:1.55;max-width:48ch}
em{font-family:SR,Georgia,serif;font-style:italic;font-size:1.08em;color:var(--fg)}
strong{font-weight:600;color:var(--fg)}
.foot{margin-top:auto;padding-top:var(--s3);border-top:1px solid var(--border);
      display:flex;justify-content:space-between;align-items:baseline}

.rule{border-top:1px solid var(--border);margin:var(--s4) 0 var(--s3)}
.cols{display:grid;grid-template-columns:repeat(12,1fr);gap:6mm}
.row{display:flex;align-items:baseline;justify-content:space-between;gap:var(--s3);
     padding:5px 0;border-bottom:1px solid var(--border)}
.row:first-of-type{border-top:1px solid var(--border-strong)}

/* Swatches. A hairline round each, never a shadow — a shadow would make the
   page claim a depth the site does not have. */
.sw{display:flex;align-items:center;gap:var(--s3);padding:5px 0;border-bottom:1px solid var(--border)}
.chip{width:22mm;height:11mm;flex-shrink:0;box-shadow:0 0 0 1px var(--border-strong) inset}
.sw .name{font-family:MN,monospace;font-size:8pt;color:var(--fg);min-width:34mm}
.sw .val{font-family:MN,monospace;font-size:7.5pt;color:var(--fg-muted);min-width:34mm}
.sw .use{font-size:8pt;color:var(--fg-body)}

.do-dont{display:grid;grid-template-columns:1fr 1fr;gap:var(--s4);margin-top:var(--s3)}
.box{border-top:1px solid var(--fg);padding-top:var(--s2)}
.box.no{border-top-color:var(--border-strong)}
.box li{list-style:none;font-size:8.5pt;color:var(--fg-body);padding:3px 0 3px 14px;position:relative}
.box li::before{content:"—";position:absolute;left:0;color:var(--fg-muted)}

.spec{font-family:MN,monospace;font-size:7.5pt;color:var(--fg-muted)}
.note{font-size:8pt;color:var(--fg-muted);max-width:60ch;margin-top:var(--s2)}
.bar{height:6px;background:var(--fg)}
`;

/* ── the pages ─────────────────────────────────────────────────────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
let pageNo = 0;
const PAGES = [];
// Filled in once every page exists, so the folio can say "07 / 13" instead of
// carrying a dash where the total should be.
const FOLIO = '@@TOTAL@@';
const page = (label, html, { noNumber = false } = {}) => {
  if (!noNumber) pageNo++;
  PAGES.push(`<section class="page">
  <div class="rh"><span class="lab">${label}</span><span class="fig">${noNumber ? '' : String(pageNo).padStart(2, '0')}</span></div>
  ${html}
  <div class="foot"><span class="lab">Surfing Whale</span><span class="fig">${noNumber ? '' : `${String(pageNo).padStart(2, '0')} / ${FOLIO}`}</span></div>
</section>`);
};

const USE = {
  '--fg': 'Headings, the name, any figure that must be read first.',
  '--fg-secondary': 'Rarely. Standfirsts and pull quotes.',
  '--fg-muted': 'Counters, years, the second half of a label pair.',
  '--fg-body': 'Running copy. Every paragraph on the site.',
  '--fg-label': 'The label alphabet — section labels, plate notes, kickers.',
  '--brand-ink': 'The whale. The logo and nothing else.',
  '--bg': 'The page.',
  '--bg-subtle': 'A band that needs to separate without becoming a panel.',
  '--bg-muted': 'An image placeholder before the image arrives.',
  '--doc': 'Paper — a document handed to you, whiter than the page.',
  '--folder': 'The case folder. Warm, so it does not vanish into the page.',
  '--border': 'Every hairline. The site’s default way of separating things.',
  '--border-strong': 'A rule that has to be seen from across the page.',
};

/* Cover. The mark is the one piece of chroma on a default screen, so it is the
   one thing on the cover that is not type. */
const MARK = existsSync(join(ROOT, 'public/logo-mark.webp'))
  ? `data:image/webp;base64,${readFileSync(join(ROOT, 'public/logo-mark.webp')).toString('base64')}`
  : null;
PAGES.push(`<section class="page" style="justify-content:flex-start">
  <div>
    <div class="rh"><span class="lab">Brand book</span><span class="fig">Ed. 01 &nbsp;&rsquo;26</span></div>
    <p class="lab">Muhammad Fauzy &middot; Jakarta</p>
  </div>
  ${MARK ? `<img src="${MARK}" alt="" style="width:46mm;height:auto;margin:30mm 0 var(--s5)">` : '<div style="height:40mm"></div>'}
  <div>
    <h1 style="font-size:46pt">Surfing&nbsp;Whale</h1>
    <p class="lead" style="margin-top:var(--s3)">
      The rules this site already follows, written down — so the next decision
      can be made without guessing, and so a decision that breaks one of them
      breaks it <em>on purpose</em>.
    </p>
  </div>
  <div class="foot">
    <span class="lab">Not a proposal. A description.</span>
    <span class="fig">A4 &middot; 15pp</span>
  </div>
</section>`);

/* 00 */
page('How to read this', `
  <h2>Every number here was taken, not chosen.</h2>
  <p>The colours are read out of <span class="spec">app/globals.css</span> when this
  book is built. The faces are the same <span class="spec">.woff2</span> files the site
  serves. The contrast ratios are computed here, not quoted from memory. If a value
  in this book and a value in the code disagree, the code is right and this book is
  stale — rebuild it with <span class="spec">node scripts/build-brand-book.mjs</span>.</p>

  <div class="rule"></div>
  <h3>Four layers, in order of what settles first</h3>
  <p style="margin-bottom:var(--s2)"><strong>A</strong> says why the site exists
  and <strong>B</strong> says how it talks; both are quoted from what he has
  already written. <strong>C</strong> is how it looks and behaves, read out of
  the code. <strong>D</strong> is what keeps the three from drifting. A decision
  taken at a lower letter may not contradict a higher one.</p>
  <div style="margin-top:var(--s2)">
    ${[['A', 'Foundation', 'Why this exists · what it is and is not · who it is for · personality'],
       ['B', 'Verbal identity', 'How it speaks · do and do not · names and numbers'],
       ['C', 'Design system', 'The five decisions · colour · type · space · surface · parts · motion · pictures · refusals'],
       ['D', 'Governance', 'What is checked automatically · colophon'],
      ].map(([k, t, d]) =>
      `<div style="border-bottom:1px solid var(--border);padding:8px 0">
         <div style="display:flex;align-items:baseline;gap:var(--s3)">
           <span class="fig-strong" style="font-size:9pt;min-width:8mm">${k}</span>
           <span style="font-size:10pt;color:var(--fg)">${t}</span>
         </div>
         <p class="note" style="margin:2px 0 0 8mm">${d}</p>
       </div>`).join('')}
  </div>

  <p class="note">The site is a logbook kept in the open: work, photographs and
  notes, dated and numbered, by someone moving into data analysis from accounting.
  It is not a job application and must never read as one.</p>
`);

/* ── PART A · FOUNDATION ────────────────────────────────────────────────
   Every line in this part is quoted from app/data/testament.ts, which is his
   own statement, unedited. Nothing here is written about him. */

page('A · Foundation — why this exists', `
  <h2>It is already written. This page only quotes it.</h2>
  <p>A brand foundation composed by somebody else about somebody else is a
  guess with a letterhead. This one does not need writing: the statement exists
  in the repository, in his words, and the site is built on it. Everything
  below is lifted from <span class="spec">app/data/testament.ts</span> when this
  book is built.</p>

  <div style="margin-top:var(--s4);border-top:1px solid var(--fg);padding-top:var(--s3)">
    <p class="lab" style="margin-bottom:var(--s3)">The purpose, in one sentence</p>
    <p style="font-family:SR,Georgia,serif;font-size:17pt;line-height:1.3;letter-spacing:-.012em;color:var(--fg);max-width:38ch">
      &ldquo;${esc(sentence(2, 'It is a place where I can leave traces'))}&rdquo;
    </p>
  </div>

  <div style="margin-top:var(--s4);border-top:1px solid var(--border);padding-top:var(--s3)">
    <p class="lab" style="margin-bottom:var(--s2)">The belief the whole archive rests on</p>
    <p style="font-family:SR,Georgia,serif;font-size:14pt;line-height:1.35;color:var(--fg);max-width:42ch">
      &ldquo;${esc(TEST_PULL)}&rdquo;
    </p>
  </div>

  <div style="margin-top:var(--s4);border-top:1px solid var(--border);padding-top:var(--s3)">
    <p class="lab" style="margin-bottom:var(--s2)">The tension it refuses to hide</p>
    <p>&ldquo;${esc(sentence(3, 'I still want recognition'))} &hellip;
    ${esc(sentence(3, 'But I do not want attention'))}
    ${esc(sentence(3, 'I want meaning to exist'))}&rdquo;</p>
    <p class="note">This is the sentence that governs more of the site than any
    design rule: it is why there is no availability notice, no call to action on
    the first screen, and no counter that exists to look impressive.</p>
  </div>
`);

page('A · Foundation — what it is, and is not', `
  <h2>&ldquo;${esc(sentence(2, 'It is not only a portfolio'))}&rdquo;</h2>

  <div class="do-dont" style="margin-top:var(--s4)">
    <div class="box">
      <p class="lab" style="margin-bottom:var(--s2)">It is</p>
      <ul>
        <li>A logbook kept in the open: dated, numbered, counted</li>
        <li>A record that something was chosen and cared about</li>
        <li>Two sides of one person &mdash; the data and the photographs</li>
        <li>Allowed to hold things that are unfinished or small</li>
      </ul>
    </div>
    <div class="box no">
      <p class="lab" style="margin-bottom:var(--s2)">It is not</p>
      <ul>
        <li>A job application, or a site arranged around one</li>
        <li>A portfolio of only the impressive things</li>
        <li>A claim to be a photographer, or a programmer</li>
        <li>A place where reach decides whether something mattered</li>
      </ul>
    </div>
  </div>

  <div class="rule"></div>
  <h3>Why the two halves are one site</h3>
  <p>&ldquo;${esc(sentence(0, 'I can choose photography without becoming a photographer'))}
  ${esc(sentence(0, 'I can learn to code without becoming a programmer'))}&rdquo;</p>
  <p>That is the argument the mode switch makes. <em>Data</em> and
  <em>Photographs</em> are two things one person cares about, not two careers
  being advertised &mdash; which is why they share a page, a palette and a
  voice, and why neither is a sub-site of the other.</p>
`);

page('A · Foundation — who it is for', `
  <h2>A stranger, three paragraphs in, deciding whether to keep reading.</h2>
  <p>The site makes one assumption about its reader and it is visible in every
  section note: that they arrived without context, owe nothing, and will leave
  the moment it asks for something before it has shown anything.</p>

  <div style="margin-top:var(--s4)">
    <p class="lab" style="margin-bottom:var(--s2)">What the copy already assumes</p>
    ${[['They do not know who he is', 'The work is shown before the name, and the name carries a trade beside it.'],
       ['They might disagree', '&ldquo;If something here is useful, wrong, or worth arguing about &mdash; say so. I answer everything.&rdquo;'],
       ['They might only want one thing', 'Every section says what it is in a note, so any of them can be the only one read.'],
       ['They owe nothing', 'No sign-up, no gate on the work, no notice asking for an opportunity.']].map(([a, b]) =>
      `<div style="border-bottom:1px solid var(--border);padding:7px 0">
         <p style="font-size:9pt;color:var(--fg)">${a}</p>
         <p class="note" style="margin-top:2px">${b}</p>
       </div>`).join('')}
  </div>

  <p class="note" style="margin-top:var(--s4)"><strong>Open, and his to answer:</strong>
  whether there is a narrower reader than &ldquo;a stranger&rdquo; &mdash; a hiring manager,
  a fellow analyst, a friend &mdash; that the site should be arranged around. It is
  not written here because it has not been decided, and guessing it would put a
  stranger&rsquo;s assumptions into his book.</p>
`);

page('A · Foundation — personality', `
  <h2>Five traits, each with the evidence that it is true.</h2>
  <p>Not adjectives chosen because they sound good. Each one is a pattern
  already visible in the site or in the way it was built.</p>

  <div style="margin-top:var(--s3)">
  ${[
    ['Plain', 'Says the thing and stops.', 'Error messages read &ldquo;Could not save that. Try again in a moment.&rdquo; &mdash; no apology, no blame, what to do next.'],
    ['Specific', 'Prefers a number to an adjective.', '&ldquo;15 minutes to coffee&rdquo;, &lsquo;26, Plate 01, 4.52:1. Never &ldquo;beautifully crafted&rdquo;.'],
    ['Unhurried', 'Does not chase.', 'No call to action on the first screen. The ways to reach him are at the end, where someone who wants them will be.'],
    ['Self-correcting', 'Says when it was wrong.', 'The PRD records every over-count and every failed check by name, including the ones nobody would have found.'],
    ['Unimpressed by itself', 'Refuses the flourish that would flatter it.', 'No superlatives, nothing &ldquo;featured&rdquo;, and a counter that says how many rather than how good.'],
  ].map(([t, d, e], i) => `
    <div style="border-top:1px solid ${i === 0 ? 'var(--fg)' : 'var(--border)'};padding:var(--s3) 0">
      <div style="display:flex;align-items:baseline;gap:var(--s3)">
        <span class="fig-strong" style="font-size:8pt">(${i + 1})</span>
        <h3 style="margin:0;font-size:10.5pt">${t}</h3>
        <span style="font-size:9pt;color:var(--fg-body)">${d}</span>
      </div>
      <p class="note" style="margin-top:4px">${e}</p>
    </div>`).join('')}
  </div>
`);

/* ── PART B · VERBAL IDENTITY ──────────────────────────────────────────── */

page('B · Voice — how it speaks', `
  <h2>First person, past tense, no adjectives doing a number&rsquo;s job.</h2>
  <p>The site already has a voice and it is consistent enough to write down.
  Every rule below is taken from copy that is live.</p>

  <div style="margin-top:var(--s3)">
  ${[
    ['Write as a person, not as a site', '&ldquo;I answer everything.&rdquo; &mdash; not &ldquo;All enquiries are responded to.&rdquo;'],
    ['Say what happened, not what it proves', '&ldquo;The finding was not the coffee &mdash; it was that almost every branch sits on a road you drive.&rdquo;'],
    ['Let the number carry the claim', '&ldquo;07 entries&rdquo;, &ldquo;15 minutes to coffee&rdquo;, &ldquo;4.52:1&rdquo;. An adjective standing where a figure belongs is a hole in the argument.'],
    ['Never promise what has not happened', 'A note shows &ldquo;once I have read them&rdquo;, not &ldquo;we will get back to you shortly&rdquo;.'],
    ['Admit the limit in the same breath', '&ldquo;A picture of a map is not a map.&rdquo; The caption says what the thing is not.'],
    ['Short sentences when it matters', 'The heaviest lines on the site are the shortest ones.'],
  ].map(([r, e]) => `
    <div style="border-bottom:1px solid var(--border);padding:7px 0">
      <p style="font-size:9pt;color:var(--fg)">${r}</p>
      <p class="note" style="margin-top:2px">${e}</p>
    </div>`).join('')}
  </div>

  <div class="rule"></div>
  <h3>Tone, by situation</h3>
  <div class="row"><span style="font-size:9pt">Showing work</span><span class="fig">flat, specific, no selling</span></div>
  <div class="row"><span style="font-size:9pt">Asking for something</span><span class="fig">once, with a reason, never twice</span></div>
  <div class="row"><span style="font-size:9pt">Something broke</span><span class="fig">what failed, what to do, no apology</span></div>
  <div class="row"><span style="font-size:9pt">Writing about himself</span><span class="fig">past tense, no claim to a title</span></div>
`);

page('B · Voice — do and do not', `
  <h2>Taken from live copy, not invented for the example.</h2>
  <div class="do-dont" style="margin-top:var(--s3)">
    <div class="box">
      <p class="lab" style="margin-bottom:var(--s2)">Written</p>
      <ul>
        <li>&ldquo;Anyone can write in here &mdash; a hello, a question, a correction.&rdquo;</li>
        <li>&ldquo;Could not reach the server.&rdquo;</li>
        <li>&ldquo;Add your name so I know who stopped by.&rdquo;</li>
        <li>&ldquo;Learning it in the open&rdquo;</li>
        <li>&ldquo;Read how it was made&rdquo;</li>
        <li>&ldquo;It will show up below once I have had a look.&rdquo;</li>
      </ul>
    </div>
    <div class="box no">
      <p class="lab" style="margin-bottom:var(--s2)">Not written</p>
      <ul>
        <li>&ldquo;We&rsquo;d love to hear from you!&rdquo;</li>
        <li>&ldquo;Oops! Something went wrong.&rdquo;</li>
        <li>&ldquo;Name is required&rdquo;</li>
        <li>&ldquo;Passionate about data&rdquo;</li>
        <li>&ldquo;Learn more&rdquo;</li>
        <li>&ldquo;Thanks! We&rsquo;ll be in touch soon.&rdquo;</li>
      </ul>
    </div>
  </div>

  <div class="rule"></div>
  <h3>Names and numbers</h3>
  <div class="row"><span style="font-size:9pt">The site</span><span class="fig">Surfing Whale &mdash; two words</span></div>
  <div class="row"><span style="font-size:9pt">The person</span><span class="fig">Muhammad Fauzy; Fauzy after first use</span></div>
  <div class="row"><span style="font-size:9pt">A year beside a name</span><span class="fig">&rsquo;26, never 2026</span></div>
  <div class="row"><span style="font-size:9pt">A counter</span><span class="fig">01, zero-padded, mono</span></div>
  <div class="row"><span style="font-size:9pt">A plate or an entry</span><span class="fig">Plate 01 &mdash; what it shows</span></div>
  <p class="note">Sentence case everywhere except the label alphabet, which is
  uppercase by specification. Headings never take a full stop; a standfirst does.</p>
`);

/* 01 */
page('C · System — the five decisions', `
  <h2>Five decisions. Everything else follows.</h2>
  <div style="margin-top:var(--s4)">
  ${[
    ['The work comes before the person',
     'The first screen a stranger reaches shows what was made, not who made it. The name is the label on the plate. This is why the hero is a photograph with a card under it and not a wordmark.'],
    ['It is a logbook, not a portfolio',
     'Things are dated, numbered and kept — ’01, Plate 01, Note 02, Entry 07. Nothing is “featured”. The counter is the claim: it says people were here, work was done, time passed.'],
    ['Separation is drawn with rules',
     'A hairline, not a shadow; a border, not a card. Depth is reserved for things that are genuinely above other things — a dialog, a floating prompt. A page of soft-shadowed boxes is the look this site exists to not have.'],
    ['One alphabet for labels, one for figures',
     '11px uppercase at 0.14em tracking for every label, anywhere. Mono tabular for every number, anywhere. A second voice for either is a drift, not a decision.'],
    ['The measurement is the finding',
     'Claims about this site are checked by scripts in /scripts and reported as numbers. Where something cannot be measured here, it is stated as a platform rule and labelled as one, never dressed up as a test.'],
  ].map(([t, d], i) => `
    <div style="margin-bottom:var(--s4)">
      <div style="display:flex;align-items:baseline;gap:var(--s3);border-top:1px solid var(--fg);padding-top:var(--s2)">
        <span class="fig-strong" style="font-size:8pt">(${i + 1})</span>
        <h3 style="margin:0;font-size:11pt">${t}</h3>
      </div>
      <p style="margin-top:var(--s2);margin-left:0">${d}</p>
    </div>`).join('')}
  </div>
`);

/* 02 — colour light */
const swatch = (n, v, bgForChip) =>
  `<div class="sw">
     <span class="chip" style="background:${v}${bgForChip ? `;background-color:${v}` : ''}"></span>
     <span class="name">${n}</span>
     <span class="val">${esc(v)}</span>
     <span class="use">${USE[n] ?? ''}</span>
   </div>`;

page('C · Colour — light', `
  <h2>Paper and ink, and one blue that is only ever the whale.</h2>
  <p>There is no brand colour on this site in the usual sense. The page is paper,
  the type is ink at five strengths, and the only chroma on a default screen is the
  logo. Colour arrives in the work — a map, a photograph — and the page stays out of
  its way.</p>

  <div style="margin-top:var(--s4)">
    <p class="lab" style="margin-bottom:var(--s2)">Ink</p>
    ${read(TEXT_TOKENS, lightBlock).map(([n, v]) => swatch(n, v)).join('')}
  </div>
  <div style="margin-top:var(--s4)">
    <p class="lab" style="margin-bottom:var(--s2)">Surface</p>
    ${read(SURFACE_TOKENS, lightBlock).map(([n, v]) => swatch(n, v)).join('')}
  </div>
  <div style="margin-top:var(--s4)">
    <p class="lab" style="margin-bottom:var(--s2)">Line</p>
    ${read(LINE_TOKENS, lightBlock).map(([n, v]) => swatch(n, v)).join('')}
  </div>
`);

/* 03 — colour dark + contrast */
page('C · Colour — dark', `
  <h2>The dark theme is not the light one inverted.</h2>
  <p>Ink goes to <span class="spec">#f0f0f0</span> rather than white, the page to
  <span class="spec">#111111</span> rather than black, and the muted step is
  <em>raised</em> — 0.49 alpha against light mode&rsquo;s 0.58 — because the same
  alpha on a dark ground reads as a different weight. Both themes are measured;
  neither is assumed.</p>

  <div style="margin-top:var(--s4);background:#111111;padding:var(--s4) var(--s3)">
    ${read(TEXT_TOKENS, darkBlock).map(([n, v]) =>
      `<div style="display:flex;align-items:center;gap:var(--s3);padding:5px 0;border-bottom:1px solid rgba(240,240,240,.07)">
         <span style="width:22mm;height:11mm;flex-shrink:0;background:${v};box-shadow:0 0 0 1px rgba(240,240,240,.12) inset"></span>
         <span style="font-family:MN,monospace;font-size:8pt;color:#f0f0f0;min-width:34mm">${n}</span>
         <span style="font-family:MN,monospace;font-size:7.5pt;color:rgba(240,240,240,.49)">${esc(v)}</span>
       </div>`).join('')}
  </div>

  <div class="rule"></div>
  <h3>Measured against the page, both themes</h3>
  <div style="margin-top:var(--s2)">
    <div class="row"><span class="lab">Token</span><span class="lab">Light &nbsp;&middot;&nbsp; Dark</span></div>
    ${contrastRows.map((r) => `
      <div class="row">
        <span style="font-family:MN,monospace;font-size:8pt;color:var(--fg)">${r.n}</span>
        <span class="fig">${r.l.toFixed(2)}:1 &nbsp;&middot;&nbsp; ${r.d.toFixed(2)}:1</span>
      </div>`).join('')}
  </div>
  <p class="note"><strong>The floor is 4.5:1 and two tokens sit on it.</strong>
  <span class="spec">--fg-muted</span> measures ${contrastRows.find((r) => r.n === '--fg-muted').l.toFixed(2)}:1 in light
  and <span class="spec">--fg-label</span> ${contrastRows.find((r) => r.n === '--fg-label').l.toFixed(2)}:1. That is two
  hundredths of headroom. Do not lighten either token, and do not darken
  <span class="spec">--bg</span>, without re-running the contrast check.</p>
`);

/* 04 — the faces */
page('C · Type — the faces', `
  <h2>Four faces, each with one job.</h2>
  <p>All four are self-hosted at build time. No request leaves this site for a font
  CDN, which is also why this book can embed the identical files.</p>

  <div style="margin-top:var(--s4)">
    ${[
      ['Plus Jakarta Sans', 'JK', '400 500 600', 'Everything that is read: body copy, labels, controls, the interface. The site’s default voice.', 'Aa'],
      ['Instrument Serif', 'SR', '400 + italic', 'Anywhere a person speaks — the name on the plate, guest notes, card headings. Never for UI.', 'Aa'],
      ['Geist Mono', 'MN', '400 700', 'Every figure. Counters, years, coordinates, the numbering on the greeting. Always tabular.', '01'],
      ['Oswald', 'OS', '500 700', 'Display only, and only where a word is the artwork — the chrome wordmarks. Never as a heading face.', 'Aa'],
    ].map(([name, f, w, use, spec]) => `
      <div style="display:flex;gap:var(--s4);align-items:flex-start;border-top:1px solid var(--border);padding:var(--s3) 0">
        <div style="font-family:${f},serif;font-size:34pt;line-height:1;min-width:30mm;color:var(--fg)${f === 'MN' ? ';font-variant-numeric:tabular-nums' : ''}">${spec}</div>
        <div style="flex:1">
          <h3 style="font-size:10.5pt">${name}</h3>
          <p class="spec" style="margin-top:2px">${w}</p>
          <p style="margin-top:var(--s2);font-size:8.5pt">${use}</p>
        </div>
      </div>`).join('')}
  </div>

  <p class="note">Oswald is condensed and Instrument Serif is not a UI face. Both
  were put where they are on purpose and both are wrong everywhere else: Oswald at
  26px inside a small card reads as a label, and the serif in a button reads as a
  mistake.</p>
`);

/* 05 — the scale */
const SCALE = [
  ['11', 'Labels, counters, notes', 'The label alphabet. Uppercase, 0.14em.'],
  ['12–13', 'Captions, meta, fine print', ''],
  ['15–17', 'Running copy', 'Body text on a case page sits at 15; 13 is for dense index rows only.'],
  ['16', 'Form fields — minimum', 'Below this iOS Safari zooms the page on focus. Not a preference.'],
  ['19–26', 'Standfirsts, card headings', 'The sentence under a heading, the serif on a note card.'],
  ['30–38', 'Section headings', ''],
  ['51–72', 'The name, the plate', 'Serif. One per screen, never two.'],
];
page('C · Type — the scale', `
  <h2>Seven steps, and a floor.</h2>
  <div style="margin-top:var(--s3)">
    <div class="row"><span class="lab">Size</span><span class="lab">Where</span></div>
    ${SCALE.map(([px, where, note]) => `
      <div style="border-bottom:1px solid var(--border);padding:7px 0">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:var(--s3)">
          <span class="fig-strong" style="font-size:9pt;min-width:18mm">${px}px</span>
          <span style="flex:1;font-size:9pt;color:var(--fg)">${where}</span>
        </div>
        ${note ? `<p class="note" style="margin:3px 0 0 18mm;font-size:7.5pt">${note}</p>` : ''}
      </div>`).join('')}
  </div>

  <div class="rule"></div>
  <h3>The label alphabet</h3>
  <p>One specification, used everywhere a label appears — section labels, plate
  notes, the hero kicker, the standing facts, the footer heads. It is the most
  repeated thing on the site and the quickest to drift.</p>
  <div style="margin-top:var(--s3);border-top:1px solid var(--fg);padding-top:var(--s2);display:flex;gap:var(--s4);align-items:baseline">
    <span class="lab" style="font-size:9pt">Section label</span>
    <span class="spec">11px &middot; 500 &middot; uppercase &middot; 0.14em &middot; 1.5 &middot; --fg-label</span>
  </div>
  <div style="margin-top:var(--s2);display:flex;gap:var(--s4);align-items:baseline">
    <span class="fig-strong">(1)</span><span class="fig">01 &nbsp; &rsquo;26 &nbsp; 07</span>
    <span class="spec">Mono &middot; tabular &middot; 700 at full ink for a marker, 400 at --fg-muted for a counter</span>
  </div>

  <p class="note">Smart punctuation throughout: curly quotes, an en dash in ranges,
  <span class="spec">&rsquo;26</span> and not <span class="spec">2026</span> in any
  row that also carries a name.</p>
`);

/* 06 — space */
page('C · Space', `
  <h2>Six steps, each twice the one below.</h2>
  <div style="margin-top:var(--s3)">
    ${read(SPACE_TOKENS, spaceBlock).map(([n, v], i) => {
      const px = parseInt(v);
      const comment = (css.match(new RegExp(`${n}:\\s*${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*;?\\s*/\\*([^*]+)\\*/`)) || [, ''])[1].trim();
      return `<div style="display:flex;align-items:center;gap:var(--s3);border-bottom:1px solid var(--border);padding:6px 0">
        <span class="fig-strong" style="min-width:22mm;font-size:8.5pt">${n.replace('--space-', '')} &nbsp; ${px}px</span>
        <span class="bar" style="width:${Math.min(px, 128) * 0.62}mm"></span>
        <span style="font-size:8.5pt;color:var(--fg-body);margin-left:auto;text-align:right">${comment || ''}</span>
      </div>`;
    }).join('')}
  </div>

  <div class="rule"></div>
  <h2 style="font-size:15pt">The one rule about gaps</h2>
  <p class="lead" style="margin-top:var(--s2)">The gap between two groups must be at
  least twice the gap inside one.</p>
  <p>It is the whole difference between a layout that has air and one that is
  merely spaced out. A heading 8px from its own line of copy and 12px from the form
  below does not read as two groups; it reads as one block with nothing in it. That
  exact fault shipped, was caught by measurement, and is now a check.</p>

  <div class="rule"></div>
  <h3>The grid</h3>
  <div class="row"><span style="font-size:9pt">Columns</span><span class="fig">12</span></div>
  <div class="row"><span style="font-size:9pt">Gutter</span><span class="fig">24px</span></div>
  <div class="row"><span style="font-size:9pt">Column max</span><span class="fig">720px</span></div>
  <div class="row"><span style="font-size:9pt">Page gutter, phone</span><span class="fig">24px</span></div>
  <p class="note">A split section runs its content at <span class="spec">4 / span 7</span>
  with the label in the rail beside it. Sub-grids inside a section are allowed to
  have their own columns — they are not a breach of the twelve.</p>
`);

/* 07 — surface */
page('C · Surface', `
  <h2>A rule, not a shadow.</h2>
  <p>The site separates things with hairlines. Shadow is kept for the two or three
  objects that are genuinely floating above the page, and a radius is a decision
  made per object rather than a house style applied to everything.</p>

  <div style="margin-top:var(--s4);display:grid;grid-template-columns:1fr 1fr;gap:var(--s4)">
    <div>
      <p class="lab" style="margin-bottom:var(--s2)">Radius, as actually used</p>
      ${[['0', 'Photographs, plates, map frames, rules. The default.'],
         ['4px', 'Small marks and focus rings.'],
         ['7px', 'The index row card.'],
         ['11px', 'A solid button.'],
         ['14–20px', 'Cards that are objects: note cards, the guest-book card.'],
         ['pill', 'Only a pill — the sound offer, a tag.']].map(([r, u]) =>
        `<div class="row"><span style="font-size:8.5pt;color:var(--fg)">${u}</span><span class="fig">${r}</span></div>`).join('')}
    </div>
    <div>
      <p class="lab" style="margin-bottom:var(--s2)">Where shadow is allowed</p>
      <ul class="box" style="border-top:1px solid var(--fg);padding-top:var(--s2)">
        <li>A dialog over a dimmed page</li>
        <li>A card lifted on hover, 0 to 1 step</li>
        <li>The fan of guest notes — cards on cards</li>
        <li>Nothing else</li>
      </ul>
      <p class="note">Depth means <em>above</em>. When every box has a shadow,
      nothing is above anything, and the page has spent its only way of saying so.</p>
    </div>
  </div>

  <div class="rule"></div>
  <h3>Stacking</h3>
  <p>Any component whose internals need z-index must isolate itself. The guest-note
  fan deals its cards up to <span class="spec">z-index: 100</span>; those numbers
  mean &ldquo;in front of the card behind me&rdquo; and nothing more. Read against the whole
  document they outranked the dialog at <span class="spec">z-50</span>, and a note
  card landed on top of the form that asks for notes — 40% of it covered, measured.
  <strong>A component that counts in z-index gets <span class="spec">isolation: isolate</span>.</strong></p>
`);

/* 08 — parts */
page('C · The parts', `
  <h2>Six things this site is built from.</h2>
  <div style="margin-top:var(--s3)">
  ${[
    ['Index row', 'A label and a counter over a hairline, then the content, then a hairline and the attribution.',
     'The work index, the note cards, the hero plate card, the greeting plates. One shape, four jobs.'],
    ['Plate', 'A picture at full width with a card under it on the page’s own surface.',
     'Label and year on a rule, then the serif name or title, then the sentence. Never type over the picture.'],
    ['Field', 'A bottom hairline only — a ruled line to write on, not a box to fill in.',
     '16px minimum, placeholder at --fg-muted, the rule goes to --fg on focus.'],
    ['Solid button', 'Full-width, --fg on --bg inverted, 11px radius, 13px medium.',
     'One per card. It stays enabled and says what is missing rather than greying out.'],
    ['Section label', 'The label alphabet in the rail, with a note under it explaining what the section is.',
     'The note is written to a stranger, not to the author.'],
    ['Chrome word', 'A word filled with a sliding greyscale and run through a colour lookup.',
     'Two places only: the greeting and the guest-book card. A third would make it wallpaper.'],
  ].map(([n, what, how], i) => `
    <div style="border-top:1px solid ${i === 0 ? 'var(--fg)' : 'var(--border)'};padding:var(--s3) 0">
      <div style="display:flex;align-items:baseline;gap:var(--s3)">
        <span class="fig-strong" style="font-size:8pt">(${i + 1})</span>
        <h3 style="margin:0;font-size:10pt">${n}</h3>
      </div>
      <p style="margin-top:4px;font-size:8.5pt">${what}</p>
      <p class="note" style="margin-top:3px">${how}</p>
    </div>`).join('')}
  </div>
`);

/* 09 — motion */
page('C · Motion', `
  <h2>Motion says something is happening, or it does not happen.</h2>
  <div class="do-dont">
    <div class="box">
      <p class="lab" style="margin-bottom:var(--s2)">In use</p>
      <ul>
        <li>The opening: a count to 100 and a wave wipe, once per session</li>
        <li>The chrome words: a gradient sliding forever, paused off screen</li>
        <li>The greeting plates: one changes every 700ms, round the board</li>
        <li>Reveals: content arriving once, on first sight</li>
        <li>Hover lift: 0 to 1 step, 300ms, the site&rsquo;s own ease</li>
      </ul>
    </div>
    <div class="box no">
      <p class="lab" style="margin-bottom:var(--s2)">Never</p>
      <ul>
        <li>Anything that loops in the corner of the eye while reading</li>
        <li>Parallax</li>
        <li>An entrance that delays reading</li>
        <li>Sound without a tap &mdash; the browser forbids it and so does this</li>
        <li>Motion that continues after its section has scrolled away</li>
      </ul>
    </div>
  </div>

  <div class="rule"></div>
  <h3>Two rules, both enforced</h3>
  <div class="row"><span style="font-size:9pt">Everything animated observes <span class="spec">prefers-reduced-motion</span></span><span class="fig">checked</span></div>
  <div class="row"><span style="font-size:9pt">Everything animated pauses when off screen</span><span class="fig">IntersectionObserver</span></div>
  <div class="row"><span style="font-size:9pt">The opening survives a failed hydration</span><span class="fig">CSS, not React</span></div>
  <p class="note">The greeting staggers deliberately: one plate at a time, so a plate
  holds about four seconds and something is always about to move. Six slots on one
  clock is a strobe. The first attempt flipped all six together because the offset
  was a no-op, and the check that was supposed to catch it could not fail
  consistently — a test that cannot fail is not evidence.</p>
`);

/* 10 — pictures */
page('C · Pictures', `
  <h2>A photograph is evidence, so it is captioned and it is not decoration.</h2>
  <div style="margin-top:var(--s3)">
    <div class="row"><span style="font-size:9pt">Crop</span><span class="fig">named per image, never centred by default</span></div>
    <div class="row"><span style="font-size:9pt">Edge</span><span class="fig">1px hairline</span></div>
    <div class="row"><span style="font-size:9pt">Slot shape</span><span class="fig">fixed aspect-ratio</span></div>
    <div class="row"><span style="font-size:9pt">Alt text</span><span class="fig">what is in the frame</span></div>
    <div class="row"><span style="font-size:9pt">Caption</span><span class="fig">drawn from the alt, cut short</span></div>
  </div>

  <p style="margin-top:var(--s4)"><strong>The crop is named.</strong> A centred cover
  crop on the isochrone map at 390px landed on empty suburb and cut every branch out
  of the picture — the one thing the plate existed to show. Each image carries its own
  <span class="spec">object-position</span>.</p>

  <p><strong>The slot keeps its shape.</strong> Anywhere a picture is replaced —
  a screensaver slot, a mode switch — the box has a fixed aspect ratio. A landscape
  frame following a portrait one resizes the page, and a layout that nudges every
  second is a fault, not an effect.</p>

  <p><strong>Nothing is captioned from imagination.</strong> Every note on the
  greeting is its photograph&rsquo;s own alt text cut short, out of
  <span class="spec">app/data/photography.ts</span>. A caption written about a picture
  nobody looked at is a small lie on the front page.</p>

  <p><strong><span class="spec">alt=""</span> is an instruction.</strong> It means
  <em>ignore this, it is ornament</em>. Correct for a flourish; wrong for a chart,
  a screenshot or a photograph.</p>
`);

/* 11 — refusals */
page('C · Refusals', `
  <h2>What this site will not do, and why each one is here.</h2>
  <p>Every item below was proposed, built or nearly shipped. They are written down
  because the reason is easy to forget and the thing is easy to do again.</p>

  <div style="margin-top:var(--s4)">
  ${[
    ['A soft gradient under type on a photograph',
     'The most applied-by-default treatment there is. Measured on the hero direction it came from, the label ran at 2.23:1 against the pale half of the map. A plate does not fade into its label; it has a card under it.'],
    ['An availability notice',
     '“Open to data roles” puts the whole site in the service of one transaction, dates the moment it stops being true, and makes every project under it read as an application. The site is a logbook, and it holds whether he moves next year or never.'],
    ['A call to action on the first screen',
     'A page that opens by asking for an introduction is asking before it has shown anything. The ways to reach him are at the end, where someone who wants them will be.'],
    ['A borrowed palette',
     'Structure can be borrowed from a reference and is. Its colour cannot: it would make that one screen the only place on the site belonging to a different site.'],
    ['Essays as a condition of publishing',
     'A photograph can go on the site with a caption. Requiring a written piece before anything can be published is a dead end built by hand.'],
    ['A second alphabet for labels or figures',
     'There is one label specification and one numeric voice. A bold sans figure beside the mono counters is a fourth voice on a page that has one.'],
    ['Sound that starts on its own',
     'Audible playback needs a tap and iOS Safari has no exception. The record is offered, never imposed, and the offer outlives the opening so it can be noticed.'],
  ].map(([t, d], i) => `
    <div style="border-top:1px solid ${i === 0 ? 'var(--fg)' : 'var(--border)'};padding:var(--s3) 0">
      <h3 style="font-size:9.5pt">${t}</h3>
      <p class="note" style="margin-top:3px;font-size:8pt">${d}</p>
    </div>`).join('')}
  </div>
`);

/* 12 — checks */
const CHECKS = [
  ['verify-contrast', 'Every text node on the home page, both themes, against WCAG AA.'],
  ['verify-rhythm', 'The spacing steps in use. A step used once or twice is an accident.'],
  ['verify-tap-targets', 'Standalone controls at 24×24 minimum. Links inside sentences are exempt and not counted.'],
  ['verify-headings', 'One h1 per page, no level skipped.'],
  ['verify-intro', 'The opening cannot lock anyone out: no JS, no hydration, reduced motion, slow connection.'],
  ['verify-hallo', 'The greeting: plate count, numbering, nothing on the word, motion, and no motion under reduce.'],
  ['verify-guest-note', 'Nothing paints over the open card; every field is 16px or more.'],
  ['verify-sound', 'The record is offered not forced, and carries into the page as one fetch.'],
  ['verify-chrome-effect', 'The chrome words actually animate, and freeze under reduce.'],
  ['verify-photo-viewer', 'A way out of the gallery that is not the browser’s back button.'],
  ['verify-studio-photos', 'The gesture that puts a photograph on the site.'],
  ['audit-seo', 'Titles, descriptions, canonicals, structured data, orphans, measured layout shift.'],
];
page('D · Governance — what is checked', `
  <h2>The parts of this book a script will defend.</h2>
  <p>Rules that are only written down drift. These run against a production build in
  a real browser and exit non-zero when they fail.</p>
  <div style="margin-top:var(--s3)">
    <div class="row"><span class="lab">Script</span><span class="lab">What it holds</span></div>
    ${CHECKS.map(([s, w]) => `
      <div style="border-bottom:1px solid var(--border);padding:6px 0">
        <span class="spec" style="color:var(--fg);font-size:8pt">${s}</span>
        <p style="margin-top:2px;font-size:8pt">${w}</p>
      </div>`).join('')}
  </div>
  <p class="note"><strong>A check is only worth what its failure proves.</strong>
  Before a checker is trusted, the fault is put back and the checker is made to fail
  on it. Several here were written, passed, and were then found to pass on the broken
  code too — those were rewritten, not kept.</p>
`);

/* 13 — colophon */
page('D · Governance — colophon', `
  <h2>How this book is made.</h2>
  <p>Generated by <span class="spec">scripts/build-brand-book.mjs</span>. The colour
  values are parsed out of <span class="spec">app/globals.css</span> at build time,
  the contrast ratios are computed from those values, and the four faces are the
  same <span class="spec">.woff2</span> files the site serves, embedded from
  <span class="spec">.next/static/media</span>.</p>
  <p>Nothing in it was typed from memory, which is the only reason it is worth
  keeping. Rebuild after any change to the tokens:</p>
  <div style="margin-top:var(--s3);border-top:1px solid var(--fg);padding-top:var(--s2)">
    <span class="spec" style="font-size:8.5pt;color:var(--fg)">npm run build &amp;&amp; node scripts/build-brand-book.mjs</span>
  </div>

  <div class="rule"></div>
  <h3>Set in</h3>
  <div class="row"><span style="font-size:9pt">Plus Jakarta Sans</span><span class="fig">text, labels</span></div>
  <div class="row"><span style="font-size:9pt">Instrument Serif</span><span class="fig">headings</span></div>
  <div class="row"><span style="font-size:9pt">Geist Mono</span><span class="fig">every figure</span></div>
  <div class="row"><span style="font-size:9pt">Oswald</span><span class="fig">display, on the site</span></div>

  <div style="margin-top:auto">
    <p class="lead" style="margin-top:var(--s5)">This book describes a site that
    already exists. Where the two disagree, <em>the site is right</em> — and this
    page tells you how to make the book agree again.</p>
  </div>
`);

/* ── write ─────────────────────────────────────────────────────────────── */
const total = String(pageNo).padStart(2, '0');
for (let i = 0; i < PAGES.length; i++) PAGES[i] = PAGES[i].split('@@TOTAL@@').join(total);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Surfing Whale — brand book</title><style>${STYLE}</style></head>
<body>${PAGES.join('\n')}</body></html>`;
const htmlPath = join(OUT, 'brand-book.html');
writeFileSync(htmlPath, html);
console.log(`html  -> ${htmlPath}  (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);

// Playwright is CommonJS, so its exports land on `.default` on some Node
// versions and on the namespace on others.
const require_ = createRequire(join(ROOT, 'package.json'));
const pw = await import(require_.resolve('playwright'));
const chromium = pw.chromium ?? pw.default?.chromium;
const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await chromium.launch(launch);
const p = await browser.newPage();
await p.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
const pdfPath = join(OUT, 'brand-book.pdf');
await p.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
const { statSync } = await import('fs');
console.log(`pdf   -> ${pdfPath}  (${(statSync(pdfPath).size / 1024).toFixed(0)} KB, ${PAGES.length} pages)`);

// A fingerprint of everything the book claims, written beside it.
//
// The book is only worth keeping while it agrees with the code, and nobody is
// going to remember to rebuild it after changing a token. verify-brand-book.mjs
// reads this file and the current stylesheet and fails when they have drifted,
// so the suite says the book is stale rather than a reader finding out.
const lock = {
  built: new Date().toISOString().slice(0, 10),
  pages: PAGES.length,
  tokens: Object.fromEntries([
    ...read([...TEXT_TOKENS, ...SURFACE_TOKENS, ...LINE_TOKENS], lightBlock).map(([n, v]) => [`light${n}`, v]),
    ...read(TEXT_TOKENS, darkBlock).map(([n, v]) => [`dark${n}`, v]),
    ...read(SPACE_TOKENS, spaceBlock),
  ]),
  contrast: Object.fromEntries(contrastRows.map((r) => [r.n, [+r.l.toFixed(2), +r.d.toFixed(2)]])),
  // The faces by CONTENT, not by filename. Next's media filenames carry a
  // build hash that can change while the font does not, and a check that
  // fires on a renamed-but-identical file is a false alarm about the book's
  // truth — the kind that teaches people to ignore the check.
  faces: Object.fromEntries(Object.entries(FACES).map(([k, f]) =>
    [k, createHash('sha256').update(readFileSync(join(MEDIA, f))).digest('hex').slice(0, 16)])),
};
const lockPath = join(OUT, 'brand-book.lock.json');
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
console.log(`lock  -> ${lockPath}  (${Object.keys(lock.tokens).length} tokens fingerprinted)`);
