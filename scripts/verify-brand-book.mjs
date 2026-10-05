// Run: node scripts/verify-brand-book.mjs
//
// Is the brand book still true?
//
// The book is generated from app/globals.css, which means it is right on the
// day it is built and silently wrong after the next token change. Nobody
// remembers to rebuild a PDF, so this does the remembering: it compares the
// fingerprint written beside the book against the stylesheet as it is now, and
// fails when they have drifted.
//
// It does not open the PDF. It does not need to — the lock file is written by
// the same run that wrote the PDF, from the same values, so if the lock agrees
// with the stylesheet the book does too.
//
// Fix a failure by rebuilding, never by editing the lock:
//
//   npm run brand-book
import { readFileSync, existsSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK = join(ROOT, 'docs/brand/brand-book.lock.json');
const PDF = join(ROOT, 'docs/brand/brand-book.pdf');
let fails = 0;
const check = (n, ok, got) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : '  -> ' + got}`); if (!ok) fails++; };

check('the book exists', existsSync(PDF), 'docs/brand/brand-book.pdf is missing');
check('its fingerprint exists', existsSync(LOCK), 'docs/brand/brand-book.lock.json is missing — rebuild');
if (fails) { console.log(`\n${fails} FAILED — run: npm run brand-book`); process.exit(1); }

const lock = JSON.parse(readFileSync(LOCK, 'utf8'));
const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');
const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('--ease-out'));
// Same rule as the builder: pick the dark block by what is in it. The first
// mention of the media query in this stylesheet is a custom-media definition,
// and indexing it sliced the light :root. Both files had that bug identically,
// so they agreed with each other and the check passed — a shared bug that
// cancels out is the worst kind, and only reading the lock file found it.
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
const tokenIn = (block, name) => {
  const m = block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};

const drifted = [];
for (const [key, was] of Object.entries(lock.tokens)) {
  const name = key.replace(/^(light|dark)/, '--').replace(/^--(--)/, '--');
  const bare = key.startsWith('light') ? key.slice(5) : key.startsWith('dark') ? key.slice(4) : key;
  const block = key.startsWith('dark') ? darkBlock : key.startsWith('light') ? lightBlock : css;
  const now = tokenIn(block, bare);
  if (now !== was) drifted.push(`${bare}${key.startsWith('dark') ? ' (dark)' : ''}: book says ${was}, css says ${now ?? '(gone)'}`);
}
check(`all ${Object.keys(lock.tokens).length} tokens still match the book`, drifted.length === 0,
  '\n          ' + drifted.join('\n          '));

// The faces are matched by content. Next's media filenames carry a build hash
// that changes while the font does not, so a name comparison would fail after
// any rebuild and mean nothing. And with no build in this tree there is nothing
// to compare against — that is "not checked", not "failed": a check that fails
// because the project has not been built reports on the environment, not on
// the book.
const faceDir = join(ROOT, '.next/static/media');
if (!existsSync(faceDir)) {
  console.log('  ----  the faces: not checked, no build in this tree (npm run build)');
} else {
  const have = new Set(readdirSync(faceDir)
    .filter((f) => f.endsWith('.woff2'))
    .map((f) => createHash('sha256').update(readFileSync(join(faceDir, f))).digest('hex').slice(0, 16)));
  const gone = Object.entries(lock.faces).filter(([, h]) => !have.has(h)).map(([k]) => k);
  check('the faces it embedded are the faces the site serves', gone.length === 0,
    `${gone.join(', ')} changed since the book was built`);
}

console.log(fails ? `\n${fails} FAILED — the book no longer describes this site.\nRun: npm run brand-book` : `\nALL PASS — the book matches the code (built ${lock.built}, ${lock.pages} pages).`);
process.exit(fails ? 1 : 0);
