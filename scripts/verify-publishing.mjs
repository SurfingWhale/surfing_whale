// Run: node scripts/verify-publishing.mjs
//
// The publishing gate in app/lib/notion.ts — isRestricted() and storyOnly().
//
// WHY THIS FILE EXISTS. On 2 September 2026 a Notion row marked
// "INTERNAL / RESTRICTED — jangan di-publish ke portfolio website" went live
// for about three and a half hours. docs/PUBLISHING-RULES.md was written
// after it, and §5 lists what must never reach a page regardless of which
// heading it sits under. All of that was implemented. None of it was tested.
// It was the only safety-critical code in the repository with no checker.
//
// Everything here is a fixture. Nothing touches the real Notion workspace,
// and no real credential is in this file: the fake tokens are assembled at
// run time from a prefix and a body, so no committed line is itself a
// credential-shaped string that a scanner would flag.
//
// TWO FAILURE MODES, AND BOTH ARE CHECKED. A gate can be too loose — it
// publishes a secret. It can also be too tight — it withholds ordinary prose,
// and then it gets loosened by whoever is annoyed by it. The second half of
// this file is the "must publish" set, and PUBLISHING-RULES §5 names the
// cases that belong in it: naming a password is not leaking one, and a DAX
// assignment like `KALENDER =` is not an env var.
//
// Proved against the bug: emptying the SECRETS array turns 11 of the
// must-withhold checks red while every must-publish check stays green;
// returning false from the top of isRestricted() turns all 7 restriction
// checks red.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = mkdtempSync(join(tmpdir(), 'sw-publishing-'));

// notion.ts is TypeScript with extensionless imports, which Node's ESM loader
// will not resolve. CommonJS output resolves them, and NODE_PATH lets the
// compiled supabase module find its package. tsc exits non-zero on two
// `next: { revalidate }` options that are Next's additions to RequestInit and
// not in the stock lib types — that is a type complaint, not an emit failure,
// so the exit code is ignored and the emitted file is what is checked.
try {
  execFileSync('npx', ['tsc', 'app/lib/notion.ts', '--outDir', OUT,
    '--module', 'commonjs', '--target', 'es2022', '--moduleResolution', 'node',
    '--skipLibCheck', '--esModuleInterop'], { cwd: ROOT, stdio: 'pipe' });
} catch { /* type errors only; the emit is verified next */ }

if (!existsSync(join(OUT, 'notion.js'))) {
  console.error('tsc emitted nothing — cannot check the gate'); process.exit(2);
}
process.env.NODE_PATH = join(ROOT, 'node_modules');
const { Module } = await import('node:module');
Module._initPaths();
const { isRestricted, storyOnly } = createRequire(import.meta.url)(join(OUT, 'notion.js'));

let fail = 0;
const check = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fail++;
};

// A row Notion would return. Only the fields isRestricted reads are set.
const row = ({ title = 'A clean project', tags = ['#Finished'], icon = '',
               citation = '', subGroup = '' } = {}) => ({
  icon: icon ? { emoji: icon } : undefined,
  properties: {
    Name: { title: [{ plain_text: title }] },
    Tags: { multi_select: tags.map((name) => ({ name })) },
    Citation: { rich_text: [{ plain_text: citation }] },
    'Sub Group': { status: { name: subGroup } },
  },
});

console.log('\n── isRestricted: a row carrying any marker is withheld ──────────');
check(isRestricted(row({ title: 'INTERNAL / RESTRICTED — jangan di-publish' })),
  'title says RESTRICTED');
check(isRestricted(row({ title: 'Catatan rahasia klien' })), 'title says rahasia');
check(isRestricted(row({ tags: ['#Finished', 'confidential'] })), 'a tag says confidential');
check(isRestricted(row({ icon: '🔒' })), 'the page icon is a padlock');
check(isRestricted(row({ citation: 'jangan dipublish' })), 'Citation says jangan dipublish');
check(isRestricted(row({ subGroup: 'Internal' })), 'Sub Group says Internal');

console.log('\n── isRestricted: unreadable means restricted ───────────────────');
// PUBLISHING-RULES §2: "A row whose markers cannot be read is not a row
// anyone can vouch for." Optional chaining would otherwise report a row with
// no properties as carrying no markers, which is the dangerous reading.
check(isRestricted({}) && isRestricted(null) && isRestricted({ properties: null }),
  'a row with no readable properties is withheld');

console.log('\n── isRestricted: a clean row still publishes ───────────────────');
check(isRestricted(row()) === false, 'an ordinary finished project is not withheld');

// ── storyOnly ────────────────────────────────────────────────────────────
const p = (text) => ({ type: 'paragraph', text });
const withheldFor = (text) => storyOnly([p('Ordinary opening line.'), p(text)]).withheld;
const kept = (text) => storyOnly([p(text)]).blocks.length;

// Assembled at run time so no line here is a contiguous credential.
const NTN = 'ntn_' + 'A1b2C3d4E5f6G7h8';
const SK = 'sk-' + 'A1b2C3d4E5f6G7h8';
const GHP = 'ghp_' + 'A1b2C3d4E5f6G7h8';
const AKIA = 'AKIA' + 'IOSFODNN7EXAMPLE';
const XOX = 'xoxb-' + '123456789012-abcdef';

console.log('\n── storyOnly: credentials never reach a page ───────────────────');
for (const [label, text] of [
  ['an env assignment naming a key', 'NOTION_API_KEY=' + NTN],
  ['a bare Notion token', 'The integration uses ' + NTN + ' to read.'],
  ['an OpenAI-shaped key', 'Set it to ' + SK],
  ['a GitHub token', 'Deploy with ' + GHP],
  ['an AWS access key id', 'Access key ' + AKIA],
  ['a Slack bot token', 'Bot token ' + XOX],
  ['a private key block', '-----BEGIN RSA PRIVATE KEY-----'],
  ['a bearer token', 'Authorization: Bearer abcdef0123456789'],
  ['a password with a value', 'password: hunter2'],
  ['a quoted password value', 'lalu input password 123 di form itu'],
  ['a path off a personal machine', 'Notebook at /Users/someone/Documents/x.ipynb'],
]) check(withheldFor(text) === 1, label);

console.log('\n── storyOnly: the handle allowlist ─────────────────────────────');
check(withheldFor('Repo: https://github.com/someone-else/private-thing') === 1,
  'a repo under another owner is withheld');
check(kept('Repo: https://github.com/SurfingWhale/surfing_whale') === 1,
  'a repo under the allowlisted owner publishes');

console.log('\n── storyOnly: it must not be too tight ─────────────────────────');
// PUBLISHING-RULES §5: "Naming a password is not leaking one." A gate that
// eats ordinary sentences gets loosened by whoever it annoys, and then it is
// not a gate at all.
for (const [label, text] of [
  ['ordinary prose publishes', 'The dashboard reconciles on working days.'],
  ['naming a password publishes', 'Mereka berbagi satu password untuk semua staf.'],
  ['a DAX assignment publishes', 'KALENDER = CALENDAR(DATE(2026,1,1), DATE(2026,12,31))'],
  ['the word key in prose publishes', 'The key finding was that nobody re-types the chat.'],
]) check(kept(text) === 1, label);

console.log('\n── storyOnly: the Technical split ──────────────────────────────');
const doc = [
  { type: 'heading_2', text: 'Story' },
  p('What the problem was.'),
  { type: 'heading_2', text: 'Technical' },
  p('The Firestore schema, written while thinking out loud.'),
  { type: 'heading_2', text: 'Result' },
  p('What happened in the end.'),
];
const split = storyOnly(doc);
const texts = split.blocks.map((b) => b.text);
check(!texts.includes('The Firestore schema, written while thinking out loud.'),
  'content under a Technical heading is withheld');
check(texts.includes('What happened in the end.'),
  'the next heading of the same level ends the held section');
check(split.withheld === 2, 'the page can say how much was held back', `withheld ${split.withheld}`);

// Also recognised without renaming, per PUBLISHING-RULES §4.
for (const name of ['Teknis', 'Environment Variables', 'Konfigurasi', 'Credential']) {
  const r = storyOnly([{ type: 'heading_2', text: name }, p('secret-ish detail')]);
  check(r.blocks.length === 0, `"${name}" is recognised as a Technical heading`);
}

// ── getProjectNotes: the newest surface, and the one that cannot be tested
//    against the real workspace from a container with no NOTION_API_KEY ─────
//
// The six written case studies now show the notes from the Notion row they
// replaced. That path reaches Notion, so it is exercised here with a stubbed
// fetch: the gate, the slug resolution and storyOnly are the real code, only
// the network is fake. Without this the first run of a new publication
// surface would be in production.
const { getProjectNotes } = createRequire(import.meta.url)(join(OUT, 'notion.js'));

const notionStub = ({ visibility = 'Public', tags = ['#Finished'] } = {}) => async (url) => {
  const body = String(url).includes('/blocks/')
    ? { results: [
        { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Gap score weights emptiness 0.6 and density 0.4.' }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Technical' }] } },
        { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'The scraper schema, written while thinking out loud.' }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Catatan' }] } },
        { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Set env variable: export GMAPS_API_KEY="AIza..."' }] } },
      ] }
    : { results: [{
        id: 'row-1',
        icon: null,
        properties: {
          Name: { title: [{ plain_text: 'Padel Bintaro — Isochrone & Gap Analysis' }] },
          Tags: { multi_select: tags.map((name) => ({ name })) },
          Visibility: { select: { name: visibility } },
          Citation: { rich_text: [] },
          'Sub Group': { status: { name: 'CodingLearn' } },
          Image: { url: '' },
          URL: { url: '' },
          Date: { date: { start: '2026-03-24' } },
        },
      }] };
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
};

console.log('\n── getProjectNotes: a cleared row reaches its page ─────────────');
globalThis.fetch = notionStub();
const notes = await getProjectNotes('/work/padel');
check(!!notes, 'a publishable superseded row resolves from the page path');
if (notes) {
  const texts = notes.blocks.map((b) => b.text);
  check(texts.some((t) => t?.includes('Gap score weights')), 'the story half publishes');
  check(!texts.some((t) => t?.includes('thinking out loud')), 'the Technical half does not');
  // The credential sits under "Catatan", which is NOT a Technical heading —
  // so this is the net in §5 catching it, not the heading split.
  check(!texts.some((t) => t?.includes('GMAPS_API_KEY')),
    'a credential outside the Technical half is still withheld');
  check(notes.withheld >= 2, 'the page can say how much was held back', `withheld ${notes.withheld}`);
}

console.log('\n── getProjectNotes: the gate still decides ─────────────────────');
globalThis.fetch = notionStub({ visibility: 'Restricted' });
check((await getProjectNotes('/work/padel')) === null, 'Visibility=Restricted yields nothing');
globalThis.fetch = notionStub({ tags: [] });
check((await getProjectNotes('/work/padel')) === null, 'a row without #Finished yields nothing');
globalThis.fetch = notionStub();
check((await getProjectNotes('/colophon')) === null, 'a page that supersedes nothing yields nothing');
globalThis.fetch = async () => { throw new Error('network down'); };
check((await getProjectNotes('/work/padel')) === null, 'Notion unreachable yields nothing, not a crash');

rmSync(OUT, { recursive: true, force: true });
console.log(fail ? `\n${fail} FAILED` : '\nall checks passed');
process.exit(fail ? 1 : 0);
