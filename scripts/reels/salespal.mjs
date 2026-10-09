// scripts/reels/salespal.mjs
//
// SalesPal's reel: canvas → spec → code → audit, the order the app was
// actually built in. Every figure in Act 4 is from the context document that
// came with the screenshots, which took them from the repository and its test
// runs:
//
//   12   Playwright flows against the Firebase emulator, at 390px and 1280px
//   123  Firestore rules tests, one per role per path
//   130  UI strings raised to 12px or more during the interface audit
//   0    findings left open of the 2 HIGH and 5 MEDIUM the audit raised
//
// Act 3 is the home screen's three versions. A opened on four stat tiles,
// which told a freelancer how many leads they had and nothing about what to do
// with them. B was a pipeline board — the thing every CRM already is. C opens
// with a sentence naming what has to be done today, and C shipped.
export default {
  slug: 'salespal',
  kicker: 'SalesPal &middot; how it was built',
  title: 'Five artboards<br>to a shipped app.',
  sub: 'Canvas, spec, code, audit. Six stages, about two weeks, 41 merges.',

  stages: [
    ['01', 'Canvas', 'five artboards, before any code'],
    ['02', 'Spec', 'PRD-008 — what each screen owes'],
    ['03', 'Build', 'six pull requests, staged'],
    ['04', 'Reconcile', 'one pass to make the visuals agree'],
    ['05', 'Audit', 'keyboard, errors, 12px, 320px reflow'],
    ['06', 'Checklist', '78 lines, six of them mandatory'],
  ],

  metrics: [
    ['Flows', '12', 'automated', '390 & 1280'],
    ['Rules tests', '123', 'per role', 'all pass'],
    ['UI strings', '130', 'raised', '≥ 12px'],
    ['Open findings', '0', 'of 7', '= 0'],
  ],

  cards: [
    // A — four stat tiles. The counters, and nothing to do with them.
    '<div style="position:absolute;left:22px;top:84px;width:70px;height:54px;background:rgba(17,17,17,.14)"></div>'
    + '<div style="position:absolute;left:104px;top:84px;width:70px;height:54px;background:rgba(17,17,17,.14)"></div>'
    + '<div style="position:absolute;left:186px;top:84px;width:70px;height:54px;background:rgba(17,17,17,.14)"></div>'
    + '<div style="position:absolute;left:268px;top:84px;width:70px;height:54px;background:rgba(17,17,17,.14)"></div>'
    + '<div style="position:absolute;left:22px;top:160px;width:180px;height:8px;background:rgba(17,17,17,.08)"></div>'
    + '<div style="position:absolute;left:22px;top:178px;width:240px;height:8px;background:rgba(17,17,17,.08)"></div>',
    // B — a pipeline board. Four columns of cards, which is every other CRM.
    '<div style="position:absolute;left:22px;top:84px;width:74px;height:8px;background:rgba(17,17,17,.3)"></div>'
    + '<div style="position:absolute;left:112px;top:84px;width:74px;height:8px;background:rgba(17,17,17,.3)"></div>'
    + '<div style="position:absolute;left:202px;top:84px;width:74px;height:8px;background:rgba(17,17,17,.3)"></div>'
    + '<div style="position:absolute;left:22px;top:106px;width:74px;height:46px;background:rgba(17,17,17,.1)"></div>'
    + '<div style="position:absolute;left:112px;top:106px;width:74px;height:46px;background:rgba(17,17,17,.1)"></div>'
    + '<div style="position:absolute;left:202px;top:106px;width:74px;height:46px;background:rgba(17,17,17,.1)"></div>'
    + '<div style="position:absolute;left:22px;top:160px;width:74px;height:46px;background:rgba(17,17,17,.1)"></div>'
    + '<div style="position:absolute;left:202px;top:160px;width:74px;height:46px;background:rgba(17,17,17,.1)"></div>',
    // C — a sentence, then one card per thing to do, then the counters.
    '<div style="position:absolute;left:22px;top:84px;width:250px;height:16px;background:#111"></div>'
    + '<div style="position:absolute;left:22px;top:108px;width:170px;height:16px;background:#111"></div>'
    + '<div style="position:absolute;left:22px;top:154px;width:150px;height:92px;background:#2154a4;opacity:.9"></div>'
    + '<div style="position:absolute;left:186px;top:154px;width:150px;height:92px;background:rgba(17,17,17,.08)"></div>'
    + '<div style="position:absolute;left:22px;top:272px;width:60px;height:34px;background:rgba(17,17,17,.14)"></div>'
    + '<div style="position:absolute;left:94px;top:272px;width:60px;height:34px;background:rgba(17,17,17,.14)"></div>'
    + '<div style="position:absolute;left:166px;top:272px;width:60px;height:34px;background:rgba(17,17,17,.14)"></div>',
  ],
  chosen: 2,
  chosenLabel: 'Chosen — the screen that gives an instruction',

  refusedLabel: 'Refused',
  refused: 'a score nobody could argue with — now five signals',

  mark: 'public/work/salespal/logo-mark.png',
  endLine: '“Selamat pagi. Ada 2 hal yang perlu ditindak hari ini.”',
  endLabel: 'salespal &middot; 2026',
  endSize: 40,
  // The title card. Two frames were tried first and both failed for the same
  // reason, measured at the width this site is mostly read at: a 1920-wide
  // frame drawn into a 382px column is a 5x downscale, so only type set very
  // large survives it. The stage rail (135) puts 30px names in the bottom
  // third and reads as a figure that failed to load; the measurement HUD (354)
  // is the film's best claim but its 15px labels land at 3px on a phone. The
  // title is 124px — 25px after the downscale, and still a sentence.
  posterFrame: 52,
};
