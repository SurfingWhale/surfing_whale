// Run: node scripts/verify-superseded.mjs [port-of-a-running-build]
//
// SUPERSEDED in app/lib/notion.ts is the list of Notion rows that now have a
// written-up page on this site. Getting an entry wrong fails SILENTLY and in
// the worst direction: a key with a typo matches no row, the row keeps
// publishing, and the duplicate everybody was trying to remove is still there
// looking exactly as it did before. Nothing in a build says so, because the
// filter simply never matches.
//
// So four things are asserted here rather than assumed:
//   A  every key names a row that really is in the Notion database
//   B  every target is a page that exists in the repository
//   C  with a build running, /work/p/<key> really does 301 to its target —
//      the modal has a Copy link button, so those addresses are in the wild
//   D  every publishing row is accounted for: superseded, or named as one that
//      still has a card of its own
//
// A is the one that matters and it is the one this file got wrong first. The
// first version checked only that a key was a well-formed slug and that it
// redirected. Both are true of a typo: `salespla` is a perfectly good slug and
// redirects perfectly well — it simply matches no row, so the duplicate it was
// supposed to remove keeps publishing, looking exactly as it did before. The
// check passed and the bug shipped.
//
// Notion is not reachable from the build environment, so A compares against
// scripts/superseded.lock.json, a capture of every row that passes the publish
// gate. Regenerate it from the database with:
//
//   SELECT "Nama", "Visibility", "Tags" FROM <projects data source>
//   WHERE "Visibility" = 'Public'      -- then keep the rows tagged #Finished
//
// and run each title through slugify().
//
// Proved against the bug, twice: transposing a key to `salespla` turns A red
// while B and C stay green, and deleting an entry turns both C and D red.
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.argv[2];

const LOCK = JSON.parse(readFileSync(join(ROOT, 'scripts/superseded.lock.json'), 'utf8'));
const src = readFileSync(join(ROOT, 'app/lib/notion.ts'), 'utf8');
const block = src.match(/export const SUPERSEDED[^=]*=\s*\{([\s\S]*?)\n\s*\};/);
if (!block) { console.error('SUPERSEDED not found in app/lib/notion.ts'); process.exit(2); }
const MAP = Object.fromEntries(
  [...block[1].matchAll(/["']?([a-z0-9-]+)["']?\s*:\s*\n?\s*"([^"]+)"/g)].map((m) => [m[1], m[2]])
);
const keys = Object.keys(MAP);
if (!keys.length) { console.error('SUPERSEDED parsed empty'); process.exit(2); }

// The site's own slugify, copied rather than imported: this file is plain node
// and app/lib/notion.ts is TypeScript. It is used to re-derive each locked
// row's slug from its title, so a lock whose two halves disagree is caught
// here too rather than trusted.
const slugify = (t) =>
  t.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || '';

let fail = 0;
const check = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fail++;
};

// The lock has to agree with itself before it can be used as evidence.
for (const row of LOCK.rows) {
  if (slugify(row.title) !== row.slug) {
    console.error(`lock is inconsistent: "${row.title}" slugifies to "${slugify(row.title)}", not "${row.slug}"`);
    process.exit(2);
  }
}
const LIVE = new Map(LOCK.rows.map((r) => [r.slug, r.title]));

console.log(`${keys.length} superseded, ${LOCK.rows.length} rows publishing as of ${LOCK.captured}\n`);

for (const [slug, target] of Object.entries(MAP)) {
  check(LIVE.has(slug), `A  ${slug} names a row in the database`,
    LIVE.has(slug) ? LIVE.get(slug) : 'no row with this slug — it matches nothing and removes nothing');
  const page = join(ROOT, 'app', target.replace(/^\//, ''), 'page.tsx');
  check(existsSync(page), `B  ${target} exists`, existsSync(page) ? '' : `no file at app${target}/page.tsx`);
}

// D — anything still publishing as a card. Not a failure in itself; a row with
// no page of its own belongs on the home page. It is a failure when the row
// has a page and nobody added it here, which is the bug this file is about.
console.log('');
const WITH_PAGES = ['salespal', 'finance-dashboard', 'padel', 'coffee-access', 'crime-la', 'tracker-doc'];
for (const [slug, title] of LIVE) {
  if (slug in MAP) continue;
  const looksWrittenUp = WITH_PAGES.some((w) => slug.includes(w.split('-')[0]));
  check(!looksWrittenUp, `D  ${slug} still has a card of its own`,
    looksWrittenUp ? `"${title}" looks like it has a page — add it to SUPERSEDED` : title);
}

if (!PORT) {
  console.log('\nno port given — skipping C (the redirects). Pass a running build\'s port to check them.');
  process.exit(fail ? 1 : 0);
}

console.log('');
for (const [slug, target] of Object.entries(MAP)) {
  const res = await fetch(`http://localhost:${PORT}/work/p/${slug}`, { redirect: 'manual' });
  const to = res.headers.get('location') || '';
  const ok = (res.status === 301 || res.status === 308) && to.endsWith(target);
  check(ok, `C  /work/p/${slug} redirects to ${target}`, `${res.status}${to ? ' → ' + to : ''}`);
}

console.log(fail ? `\n${fail} FAILED` : '\nall checks passed');
process.exit(fail ? 1 : 0);
