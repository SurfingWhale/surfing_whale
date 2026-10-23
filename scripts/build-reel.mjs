// Run: npm run reel
//
// Renders the DALRS film: the 1920x1080 cut the page serves, the 1080x1350
// cut for a social post, and the poster frame. Everything lands in
// public/work/dalrs, which is where both the page and the <Player> read from.
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
const OUT = join(ROOT, 'public/work/dalrs');
const ENTRY = 'app/remotion/index.ts';

const SHELL = process.env.REMOTION_HEADLESS_SHELL
  ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (!existsSync(SHELL)) {
  console.error(`No chrome-headless-shell at ${SHELL}.`);
  console.error('Set REMOTION_HEADLESS_SHELL to one, or run `npx playwright install chromium`.');
  process.exit(2);
}

const run = (args) =>
  execFileSync('npx', ['remotion', ...args, `--browser-executable=${SHELL}`, '--concurrency=2'],
    { cwd: ROOT, stdio: 'inherit' });

run(['render', ENTRY, 'DalrsReel', join(OUT, 'reel.mp4')]);
run(['render', ENTRY, 'DalrsReelPortrait', join(OUT, 'reel-portrait.mp4')]);
// Frame 108 — 3.6 s in, the opening scene with the warehouse built and the
// title settled. A poster is a still somebody decides from, so it is the one
// frame that says what the film is about.
run(['still', ENTRY, 'DalrsReel', join(OUT, 'reel-poster.png'), '--frame=108']);

for (const f of ['reel.mp4', 'reel-portrait.mp4', 'reel-poster.png'])
  console.log(`${f.padEnd(22)} ${(statSync(join(OUT, f)).size / 1024 / 1024).toFixed(2)} MB`);
console.log('\nreel-poster.png still needs converting to webp — see PRD §37.');
