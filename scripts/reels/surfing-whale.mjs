// scripts/reels/surfing-whale.mjs
//
// The site's own reel: how one component here gets built. Six stages, and the
// numbers in Act 4 are the ones the checkers in scripts/ actually report.
//
// The three cards in Act 3 are the three hero directions. A was a wordmark
// over an embedded frame, B a split of type against photograph, C the plate —
// one photograph the full width with the name on a card over it. C was taken.
export default {
  slug: 'surfing-whale',
  kicker: 'Surfing Whale &middot; how a component gets built',
  title: 'How one component<br>gets built.',
  sub: 'Six stages. The same six for a hero, a greeting, a form.',

  stages: [
    ['01', 'Decide', 'which line in Part A it answers'],
    ['02', 'Three', 'built thin, never one'],
    ['03', 'Render', '390 · 768 · 1440, both themes'],
    ['04', 'Measure', 'contrast, targets, rhythm, overflow'],
    ['05', 'Refuse', 'the thing that measured badly'],
    ['06', 'Check', 'a script that fails on the bug'],
  ],

  metrics: [
    ['Contrast', '4.52', ':1', '≥ 4.5'],
    ['Tap target', '31', 'px', '≥ 24'],
    ['Overflow', '0', 'px', '= 0'],
    ['Pages cut', '0', '', '= 0'],
  ],

  cards: [
    // A — a wordmark over an embedded frame
    '<div style="position:absolute;left:22px;top:84px;width:200px;height:52px;background:#111"></div>'
    + '<div style="position:absolute;left:22px;top:150px;width:150px;height:8px;background:rgba(17,17,17,.14)"></div>'
    + '<div style="position:absolute;left:22px;top:168px;width:230px;height:8px;background:rgba(17,17,17,.08)"></div>',
    // B — type against photograph, split down the middle
    '<div style="position:absolute;left:22px;right:22px;top:84px;height:1px;background:#111"></div>'
    + '<div style="position:absolute;left:22px;top:100px;width:70px;height:8px;background:rgba(17,17,17,.2)"></div>'
    + '<div style="position:absolute;right:22px;top:100px;width:110px;height:8px;background:rgba(17,17,17,.3)"></div>'
    + '<div style="position:absolute;left:22px;right:22px;top:130px;height:1px;background:rgba(17,17,17,.14)"></div>'
    + '<div style="position:absolute;left:22px;top:146px;width:70px;height:8px;background:rgba(17,17,17,.2)"></div>'
    + '<div style="position:absolute;right:22px;top:146px;width:90px;height:8px;background:rgba(17,17,17,.3)"></div>',
    // C — the plate: one picture the full width, the name on a card over it
    '<div style="position:absolute;left:0;right:0;top:70px;height:240px;background:#2154a4;opacity:.9"></div>'
    + '<div style="position:absolute;left:22px;top:330px;width:200px;height:14px;background:#111"></div>'
    + '<div style="position:absolute;left:22px;top:358px;width:130px;height:8px;background:rgba(17,17,17,.2)"></div>',
  ],
  chosen: 2,
  chosenLabel: 'Chosen — and what it costs',

  refusedLabel: 'Refused',
  refused: 'a soft gradient under white type — 2.23:1',

  mark: 'public/logo-mark.webp',
  endLine: 'A place where I can leave traces of the things I chose to care about.',
  endLabel: 'surfing whale &middot; 2026',
  posterFrame: 135,
};
