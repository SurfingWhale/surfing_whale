// Run: npm run reel            — renders every film
//      npm run reel -- salespal — renders one
//
// Renders a Remotion film: the 1920x1080 cut the page serves, the 1080x1350
// cut for a social post, and the poster frame. Everything lands in the page's
// own public/ folder, which is where both the page and the <Player> read from.
//
// Remotion drives its own browser and asks for OLD headless, which current
// Chrome has removed. Playwright ships chrome-headless-shell, which IS that
// old implementation, so the renderer is pointed at it. Without this the
// render dies with "Old Headless mode has been removed from the Chrome
// binary" and no frames at all.
import { execFileSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = 'app/remotion/index.ts';

// A poster is a still somebody decides from, so each one is the single frame
// that says what its film is about — not frame 0, which in both films is an
// empty stage mid-entrance.
const FILMS = {
  dalrs: {
    out: 'public/work/dalrs',
    wide: 'DalrsReel',
    portrait: 'DalrsReelPortrait',
    // 3.6 s in: the warehouse built and the title settled.
    posterFrame: 108,
  },
  salespal: {
    out: 'public/work/salespal',
    wide: 'SalesPalReel',
    portrait: 'SalesPalReelPortrait',
    // 9.7 s in: the thread on the left and the record it produced on the
    // right, complete — the one image that is the whole argument.
    posterFrame: 290,
  },
};

const SHELL = process.env.REMOTION_HEADLESS_SHELL
  ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (!existsSync(SHELL)) {
  console.error(`No chrome-headless-shell at ${SHELL}.`);
  console.error('Set REMOTION_HEADLESS_SHELL to one, or run `npx playwright install chromium`.');
  process.exit(2);
}

const asked = process.argv.slice(2);
const bad = asked.filter((a) => !FILMS[a]);
if (bad.length) {
  console.error(`Unknown film: ${bad.join(', ')}. Known: ${Object.keys(FILMS).join(', ')}`);
  process.exit(2);
}
const names = asked.length ? asked : Object.keys(FILMS);

const run = (args) =>
  execFileSync('npx', ['remotion', ...args, `--browser-executable=${SHELL}`, '--concurrency=2'],
    { cwd: ROOT, stdio: 'inherit' });

for (const name of names) {
  const f = FILMS[name];
  const out = join(ROOT, f.out);
  console.log(`\n── ${name} ───────────────────────────────────────────────`);
  run(['render', ENTRY, f.wide, join(out, 'reel.mp4')]);
  run(['render', ENTRY, f.portrait, join(out, 'reel-portrait.mp4')]);
  run(['still', ENTRY, f.wide, join(out, 'reel-poster.png'), `--frame=${f.posterFrame}`]);

  for (const n of ['reel.mp4', 'reel-portrait.mp4', 'reel-poster.png'])
    console.log(`${n.padEnd(22)} ${(statSync(join(out, n)).size / 1024 / 1024).toFixed(2)} MB`);
}
console.log('\nreel-poster.png still needs converting to webp — see PRD §37.');
