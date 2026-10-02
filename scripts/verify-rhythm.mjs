// Run: node scripts/verify-rhythm.mjs
//
// Two things, both about whether the page's spacing was chosen or just
// happened. Neither needs a browser.
//
// 1. THE SPACING HISTOGRAM. Every spacing step the source uses, and how often.
//    A step used once or twice is an accident — nobody decides a value and
//    then uses it once. A scale is a handful of steps used a lot.
//
//    It does NOT demand that everything sit on --space-1..6. Six hundred
//    existing utilities are not worth rewriting to satisfy a rule, and a
//    checker that fails on all of them is a checker people turn off. It fails
//    on the accidents only, so drift is caught while it is still one line.
//
// 2. THE RANGE THAT MATTERS. Between 4px and 14px is where GROUPING is
//    decided — whether two things read as one thing. A reader cannot tell 6px
//    from 8px as a signal, only as untidiness. More than four distinct steps
//    in that range and the grouping stops carrying meaning.
//
// Why doubling, in globals.css: the eye reads ratio, not difference. The gap
// between two groups has to be about twice the gap inside one or the grouping
// reads as noise.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../app", import.meta.url).pathname;
const STEP = /\b(?:gap|gap-x|gap-y|space-y|space-x|p|px|py|pt|pb|m|mx|my|mt|mb)-(\d+(?:\.\d+)?)\b/g;

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const f = join(d, e);
    if (statSync(f).isDirectory()) walk(f);
    else if (f.endsWith(".tsx")) files.push(f);
  }
})(ROOT);

const used = new Map();           // step -> count
const where = new Map();          // step -> [file:line]
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(STEP)) {
      const n = Number(m[1]);
      if (n === 0) continue;
      used.set(n, (used.get(n) ?? 0) + 1);
      if (!where.has(n)) where.set(n, []);
      if (where.get(n).length < 4) where.get(n).push(`${f.replace(ROOT, "app")}:${i + 1}`);
    }
  });
}

const px = (n) => n * 4;
const steps = [...used.entries()].sort((a, b) => a[0] - b[0]);
console.log(`${files.length} files, ${steps.length} distinct spacing steps\n`);
const max = Math.max(...steps.map(([, c]) => c));
for (const [n, c] of steps) {
  const bar = "#".repeat(Math.max(1, Math.round((c / max) * 34)));
  console.log(`  ${String(px(n)).padStart(3)}px  ${String(c).padStart(3)}x  ${bar}`);
}

let fails = 0;
const accidents = steps.filter(([, c]) => c <= 2);
console.log(`\n-- steps used once or twice --`);
if (!accidents.length) console.log("  none");
for (const [n, c] of accidents) {
  console.log(`  FAIL  ${px(n)}px used ${c}x   ${where.get(n).join(", ")}`);
  fails++;
}

const small = steps.filter(([n]) => px(n) >= 4 && px(n) <= 14);
console.log(`\n-- the grouping range (4-14px) --`);
console.log(`  ${small.length} distinct steps: ${small.map(([n]) => px(n) + "px").join(", ")}`);
if (small.length > 4) {
  console.log(`  FAIL  more than four. Below 14px a reader reads a difference as untidiness, not as a signal.`);
  fails++;
}

console.log(`\n${fails ? fails + " FAILED" : "ALL PASS"}`);
process.exit(fails ? 1 : 0);
