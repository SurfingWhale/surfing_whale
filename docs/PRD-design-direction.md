# PRD — Design Direction: Surfing Whale

**Status:** Draft
**Owner:** Muhammad Fauzy (@SurfingWhale)
**Last updated:** 2026-08-18

---

## 1. Background

The site currently ships a dark "terminal / cyberpunk" aesthetic: near-black
canvas (`#080808`), high-saturation orange accent (`#ff6a00`), monospace-heavy
labels (`[ DATA_GARDENER ]`, `INITIATE_CONTACT →`, `SURFINGWHALE_TERMINAL
[ONLINE]`), and Three.js/Spline set pieces.

The desired direction is different: **clean, quiet, typography-led** — the
register of Apple's product and marketing pages. This document records that
target so implementation work has a spec to build against.

---

## 2. Naming the style (and one correction)

Three terms get used interchangeably. They are not the same thing.

| Term | What it actually is | Applies here? |
|---|---|---|
| **Editorial minimalism** (Swiss / International Typographic Style) | A layout and type *system*: generous whitespace, neutral palette, strict grid, tight tracking on large type. Typography carries the design. | **Yes — this is the target.** |
| **Glassmorphism** | A surface *treatment*: `backdrop-filter: blur()`, semi-transparent fill, hairline border. Apple uses it for OS chrome (menu bars, sheets), not for page bodies. | Partially — already in use, keep it scoped. |
| **Flat / neumorphism** | Unrelated older trends. Neumorphism = soft extruded shadows. | No. |

**Correction to note:** the "Apple feel" being chased here is editorial
minimalism, not glassmorphism. Glassmorphism is already present in this
codebase — `app/page.tsx:27` (nav), `Mobilenav.tsx:33`, `Projectmodal.tsx:112`
— all using `backdrop-blur-sm`. It stays, but only on floating chrome.

**Rule:** glass belongs on elements that float *over* content (nav, modal
backdrop, sticky headers). It never goes on content surfaces (cards, sections,
the page body).

---

## 3. Design principles

1. **Typography does the work.** Hierarchy comes from size, weight, and
   spacing — not from borders, glows, or color.
2. **Whitespace is a feature.** Sections breathe. When in doubt, add space
   rather than a divider.
3. **One accent, used sparingly.** Orange marks the single most important
   action in view, nothing else.
4. **Motion is subtle and purposeful.** Fades and small translations. No
   character-by-character reveals on body content.
5. **Restraint over novelty.** A 3D scene must earn its place; it is not
   decoration by default.

---

## 4. Design tokens

### 4.1 Color — light theme (target)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Page canvas |
| `--bg-subtle` | `#FAFAF9` | Alternating sections, card fills |
| `--fg` | `#18181B` | Primary text |
| `--fg-muted` | `#71717A` | Secondary text, captions |
| `--fg-subtle` | `#A1A1AA` | Metadata, disabled |
| `--border` | `#E4E4E7` | Hairlines, card edges |
| `--accent` | `#FF6A00` | Fills, graphic marks, large display accents |
| `--accent-text` | `#C2410C` | Accent applied to **text and links** |

**Contrast note:** `#ff6a00` on white measures roughly 2.9:1 — below the WCAG
AA 4.5:1 minimum for body text. Keep it for fills and large graphic elements
(where it sits behind white text at 3:1+), and switch to `--accent-text`
(≈5.9:1 on white) whenever the accent is the text itself. Do not use raw
`#ff6a00` for links or small labels on a light background.

### 4.2 Color — dark theme (retained)

Dark mode is kept as a toggle, not deleted. Map the same token names to the
existing dark values (`#080808` canvas, `#F8F8FF` foreground) so components
reference tokens rather than literals.

### 4.3 Typography

Face: **Inter** (`--font-inter`, wired in `app/layout.tsx`).
Mono: **Geist Mono** (`--font-geist-mono`) — retained for code and data only.

| Role | Size | Weight | Tracking | Line height |
|---|---|---|---|---|
| Display | `clamp(2.5rem, 6vw, 4.5rem)` | 600 | `-0.03em` | 1.05 |
| H1 | `clamp(2rem, 4vw, 3rem)` | 600 | `-0.02em` | 1.15 |
| H2 | `1.75rem` | 600 | `-0.02em` | 1.2 |
| H3 | `1.25rem` | 500 | `-0.01em` | 1.3 |
| Body | `1.0625rem` (17px) | 400 | `0` | 1.6 |
| Small | `0.875rem` | 400 | `0` | 1.5 |
| Label | `0.75rem` | 500 | `0.02em` | 1.4 |

**Rules:**
- Negative tracking scales with size — large type gets tighter, body stays at 0.
- Weight 700+ is reserved for the display line. Nothing else goes black/heavy.
- Monospace is for data, code, and timestamps. **Not** for navigation, buttons,
  or body copy.
- No `uppercase` on body or navigation. Sentence case throughout.

### 4.4 Spacing & shape

- Spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128` px.
- Section vertical rhythm: `96px` desktop, `64px` mobile.
- Content max-width: `1120px`. Prose max-width: `680px`.
- Radius: `8px` cards, `12px` modals, `9999px` pills. No sharp `rounded-sm`.
- Borders: `1px solid var(--border)`. No glows, no neon edges.

---

## 5. Component direction

| Component | Change |
|---|---|
| **Nav** | Sentence case, Inter not mono, drop `tracking-[0.3em]`. Keep the glass (`backdrop-blur`) — this is the one place it belongs. |
| **Hero** | Retire `[ DATA_GARDENER ]` bracket-label and the per-character reveal. One display line, one sentence of bio, one primary CTA. Reassess whether the Spline scene stays. |
| **CTAs** | "Get in touch" / "View work" — not `INITIATE_CONTACT →` / `VIEW_ARCHIVE`. Primary = accent fill, secondary = bordered ghost. |
| **Cards** | `--bg-subtle` fill, hairline border, no glow on hover. Hover = subtle lift or border darken. |
| **Footer** | Retire `SURFINGWHALE_TERMINAL [ONLINE]` / `SYSTEM_STATUS_NOMINAL`. Name, year, social links. |
| **Photography grid** | Already aligned (`PhotographySection.tsx`). Recheck filter pill contrast against a light canvas. |
| **Mode toggle** | Already aligned (`ProfileContent.tsx`). Recheck contrast on light. |

---

## 6. Migration plan

The dark values are hardcoded across 6+ files, so the light shift is a real
refactor, not a one-line flip.

1. **Tokenize.** Define the table in §4.1 as CSS custom properties in
   `app/globals.css` and expose via Tailwind's `@theme`.
2. **Replace literals.** Swap every `bg-[#080808]`, `text-[#F8F8FF]`,
   `bg-[#ff6a00]` for token-based classes. Affected: `page.tsx`,
   `HeroSection`, `CVSection`, `SkillsSection`, `ActivitySection`,
   `ContactSection`, `ProjectSection`, `Projectmodal`, `Mobilenav`.
3. **Flip the default** to light; keep dark behind a toggle.
4. **Detox the copy** — terminal-isms out (§5).
5. **Apply the type scale** (§4.3).
6. **Audit contrast**, especially accent-on-white.

Steps 1–2 are mechanical and unblock everything else. Step 4 is independent and
can land first if a quick visible win is wanted.

---

## 7. Open decisions

- [ ] **Light as default, or dark-first with a light toggle?** Assumed light
      default here. Reverses the site's current identity — confirm before
      step 3.
- [ ] **Does the Spline 3D scene survive?** It is the loudest surviving element
      of the old aesthetic and the heaviest asset on the page.
- [ ] **Does orange stay the accent?** It reads hot against white. A deeper
      rust or a neutral-with-one-accent scheme may sit better.
- [ ] **Photography assets** — `app/data/photography.ts` is placeholder data;
      real images still needed.

---

## 8. Out of scope

Guestbook / visitor-card features, i18n, and CMS restructuring. Notion +
Cloudinary stay as-is.
