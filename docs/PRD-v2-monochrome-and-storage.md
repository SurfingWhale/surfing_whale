# PRD v2 — Monochrome Redesign, Photography Mode & Storage Decision

**Status:** Draft
**Owner:** Muhammad Fauzy (@SurfingWhale)
**Supersedes:** `PRD-design-direction.md` (§4.1 palette, §7 open decisions)
**Last updated:** 2026-08-18

---

## 1. What changed since v1

v1 assumed a light canvas that **kept the orange accent** (`#ff6a00`) and left
"light vs dark default" open. That is now decided:

- **Light is the default.** Not a toggle-first afterthought.
- **The palette is monochrome** — black, white, and greys. Reference points:
  Vercel's product surfaces and muhraufan.com's editorial restraint.

This closes two open decisions from v1 §7 and **resolves a defect v1 raised**:
`#ff6a00` on white measured ~2.9:1, failing WCAG AA for text. Going monochrome
removes the problem outright — black on white is 21:1.

Three workstreams follow: **A** the visual system, **B** photography mode,
**C** the finance dashboard as a featured case study.

---

## 2. Workstream A — Monochrome visual system

### 2.1 Rationale

For a site that carries photographs, monochrome chrome is not just an aesthetic
preference — it is functional. Neutral surroundings let the photographs supply
all the colour in view. Any brand accent competes with the work.

### 2.2 Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Page canvas |
| `--bg-subtle` | `#FAFAFA` | Alternating sections |
| `--bg-muted` | `#F2F2F2` | Card fills, inactive pills |
| `--fg` | `#000000` | Primary text, primary button fill |
| `--fg-secondary` | `#666666` | Body secondary, captions |
| `--fg-muted` | `#999999` | Metadata, placeholders |
| `--border` | `#EAEAEA` | Hairlines, card edges |
| `--border-strong` | `#D4D4D4` | Hover borders, dividers |

**Semantic colours are permitted in exactly one place:** data visualisation and
status states inside the finance dashboard case study (§4). Green/red for
surplus/deficit carry meaning there. They do not leak into site chrome.

### 2.3 Buttons (the Vercel pattern)

- **Primary:** black fill (`--fg`), white text. Hover → `#333333`.
- **Secondary:** transparent fill, `--border` hairline, `--fg` text.
  Hover → `--border-strong`.
- No gradient fills, no glows.

### 2.4 Typography

Inter is already wired (`--font-inter`, `app/layout.tsx`). The v1 type scale
(PRD v1 §4.3) stands unchanged — it was written face-agnostic.

Geist Mono is retained **for data only**: figures in the finance case study,
timestamps, code. Never for navigation, buttons, or body copy.

### 2.5 Dark mode

Retained as a toggle, not deleted. Tokens invert; component code must reference
tokens rather than literals so the swap is a token change, not a refactor.

---

## 3. Workstream B — Photography mode

The role toggle (`app/components/ProfileContent.tsx`) and the filterable grid
(`app/components/sections/PhotographySection.tsx`) are **already built and
merged**. What remains is content and a storage decision.

### 3.1 The actual question

"Do I need Supabase, or can Firebase handle it?" — this conflates two different
needs:

| Need | What it requires |
|---|---|
| Displaying **your own** photos | Storage + CDN + image optimisation |
| Storing **visitor-generated** data (guestbook, comments, uploads) | A database + auth |

Photography mode is entirely the first. **It needs no database at all.** A
Backend-as-a-Service is the wrong shape of tool for it.

### 3.2 Options compared

| | **Cloudinary** *(already in repo)* | **Supabase Storage** | **Firebase Storage** | **`/public` + next/image** |
|---|---|---|---|---|
| Free allowance | 25 credits/mo — flexible across ~25 GB storage / 25 GB bandwidth / 25K transformations | 1 GB storage, 5 GB egress | 5 GB storage, 100 GB egress (N. America) | Bounded by repo size + Vercel limits |
| **Credit card required?** | No | No | **Yes — Blaze plan mandatory since 3 Feb 2026** | No |
| Sleeps when idle? | No | **Yes — paused after 7 days of DB inactivity** | No | No |
| Built-in image transforms | **Yes** — resize, `quality:auto`, `format:auto` | Limited | No (needs an Extension) | Yes, via next/image |
| Add photos without redeploy | Yes | Yes | Yes | **No** |
| Already configured here | **Yes** | No | No | Partially |
| Overage behaviour | Warns, then disables — never bills a surprise | Overage charges on paid tiers | Billed to the linked card | N/A |

### 3.3 Two findings that decide this

**Firebase Storage is no longer free-without-a-card.** Since 3 February 2026,
creating or keeping a Cloud Storage bucket requires a linked billing account —
the Blaze plan — regardless of volume. Projects on the free Spark plan get
`402`/`403` errors on every bucket call. The "Always Free" quota (5 GB) still
exists, but only *behind* a billing account. So the answer to "can Firebase
handle it?" is: technically yes, but a credit card is now mandatory just to
begin.

**Supabase free-tier projects pause after 7 days of database inactivity.** The
timer tracks database queries — not page views. A portfolio that goes a quiet
week comes back to a ~30-second cold start for the first visitor. Keeping it
awake means running a scheduled ping (GitHub Action or cron) purely as
life-support. That is real operational overhead for a static gallery.

### 3.4 Recommendation

**Use Cloudinary. It is already installed, configured, and running.**

`app/lib/cloudinary.ts` already holds a working upload helper, `next.config.ts`
already whitelists `res.cloudinary.com`, and the existing project-image pipeline
already writes into a `surfing-whale/projects` folder. Photography needs one
sibling folder — `surfing-whale/photography` — and nothing else.

It also wins on merit, not just on being present: the existing transformation
chain (`quality: auto:good`, `fetch_format: auto`) is exactly what a photo
gallery depends on — it serves AVIF/WebP to browsers that accept them and sizes
per device. Supabase Storage and Firebase Storage are generic blob stores; both
would need that optimisation layer built by hand.

**Sizing sanity check:** ~180 photographs at ~400 KB optimised ≈ 72 MB storage —
about 3 of 25 monthly credits. Bandwidth is the tighter constraint, but with
`format:auto` and responsive sizing a gallery view costs roughly 1–2 MB, giving
room for well over 10,000 monthly visits before the free tier strains.

**Revisit only if** the site later gains visitor-generated features — a
guestbook like Raufan's, comments, or visitor uploads. Those genuinely need a
database and auth, and Supabase is the better fit there (no card required to
start). That is a separate decision for a separate feature.

### 3.5 Implementation notes

1. Create the `surfing-whale/photography` folder in Cloudinary.
2. Extend `app/lib/cloudinary.ts` with a listing helper (Admin API / Search API)
   or keep `app/data/photography.ts` as a hand-maintained manifest of
   `public_id` + category. The manifest is simpler and avoids an API call per
   render — prefer it until the count makes it tedious.
3. Replace the placeholder `src` fields with Cloudinary URLs.
4. Swap the raw `<img>` in `PhotographySection.tsx` for `next/image` so sizing
   and lazy-loading are handled.
5. Categories stay as-is: Portraits / Everyday / Landscapes.

---

## 4. Workstream C — Finance dashboard as featured case study

**Live:** `financialdashboardwhale.vercel.app`

### 4.1 Why this is the strongest portfolio asset

It demonstrates the exact combination that makes the "Data Analyst with an
Accounting background" positioning credible — and it does so with a real,
shipped product rather than a notebook:

- **Accounting fluency:** GL account structure (`Akun GL`), bank reconciliation,
  tax estimation — vocabulary a self-taught dashboard builder would not reach for.
- **Analytical depth:** forecasting, prorate allocation against *working days*
  (not calendar days), savings-rate tracking, FIRE calculation (`Angka Bebas`,
  25× / 4% rule).
- **Product thinking:** the persona system (`Sang Penikmat #SiRoyal`), badge
  progression, and a shareable story card — turning a spreadsheet problem into
  something with retention mechanics.

### 4.2 Case study structure

Follow the folder-card pattern muhraufan.com uses (one card per case study,
opening to a longer page) rather than burying it in the Notion project list:

1. **Problem** — why existing budgeting apps fail for Indonesian income patterns.
2. **Approach** — why a GL structure instead of flat categories.
3. **Prorate model** — the working-day allocation logic, the most distinctive
   idea in the product.
4. **Forecasting** — how end-of-month projection is derived.
5. **Persona system** — the retention layer.
6. **Screens** — the three views already captured.

### 4.3 Constraint

The dashboard's own visual language (teal gradient hero, green/red semantics) is
**not** subject to §2. It is a separate product with its own identity. Only the
portfolio chrome around the case study goes monochrome — screenshots keep their
colour, which is precisely why the surrounding page should not compete.

---

## 5. Migration plan

Ordered so that each step lands independently.

| # | Step | Depends on |
|---|---|---|
| 1 | Tokenise §2.2 into `globals.css` + Tailwind `@theme` | — |
| 2 | Replace hardcoded literals (`bg-[#080808]`, `text-[#F8F8FF]`, `bg-[#ff6a00]`) across `page.tsx`, all 6 sections, `Projectmodal`, `Mobilenav` | 1 |
| 3 | Flip default to light; dark behind toggle | 2 |
| 4 | Copy detox — retire `[ DATA_GARDENER ]`, `INITIATE_CONTACT →`, `SURFINGWHALE_TERMINAL [ONLINE]`, `SYSTEM_STATUS_NOMINAL` | — (independent) |
| 5 | Apply v1 type scale | 1 |
| 6 | Photography content via Cloudinary (§3.5) | — (independent) |
| 7 | Finance case study page (§4.2) | 1–3 |

Steps 4 and 6 are independent of the colour refactor and can land first for a
visible win.

---

## 6. Decisions taken

- [x] **Orange is retired entirely.** No accent survives; black is the primary
      action colour. Verified by a computed-style sweep over the rendered page —
      zero orange-range values remain.
- [x] **Spline 3D is archived.** Removed from `HeroSection` and `CVSection`,
      along with the Three.js particle backdrop in `ProjectSection`. The
      `@splinetool/runtime`, `three`, and `@types/three` dependencies were
      dropped with them (12 packages removed). Git history holds the previous
      implementations if they are ever wanted back.
- [x] **Role labels avoid "photographer".** The toggle reads **Data Analyst /
      Joie de Vivre**; the photography tagline is *"I love capturing moments —
      joie de vivre."*

- [x] **Guest notes are Notion-backed, not Supabase.** §3.4 said a database
      would only be justified by visitor-generated features — that case has now
      arrived. Notion still wins: the client, key, and query patterns already
      exist, there is no 7-day pause to work around, and moderation happens in
      the Notion app. Supabase is only required if email gating later needs
      real verification (magic link), which Notion cannot do.

      Implementation: `app/lib/guestNotes.ts`, `app/api/guest-notes/route.ts`,
      `app/components/sections/GuestNotesSection.tsx`. Notes are created
      **unapproved** and stay hidden until the `Approved` checkbox is ticked.
      Visitor emails are stored but **never** included in the shape returned by
      the public GET route.

### Still open

- [ ] **Case study page or modal?** Existing projects use `Projectmodal` fed by
      Notion. A finance case study of the depth in §4.2 likely warrants its own
      route.
- [ ] **Photography manifest vs Cloudinary API listing** (§3.5 step 2).
- [ ] **Orphaned components.** `ScrollVelocity`, `RotatingText`, and `GooeyNav`
      are no longer imported anywhere. They only depend on framer-motion, so
      they are harmless, but they are dead code.
- [ ] **Avatar assets.** `AvatarMorph` expects `/public/avatar-analyst.jpg` and
      `/public/avatar-capture.jpg`. Until both exist it renders a labelled
      placeholder rather than a broken image.
- [ ] **Email gate — what does it protect?** Requested but not built: the
      target content was never settled. Recommended scope is the CV alone
      (identity for a download is a fair trade), leaving the portfolio and
      gallery open so a hurried recruiter is never turned away. Gating the
      whole site is the highest-risk option.
- [ ] **Gate strictness.** A soft gate (record the email, admit immediately)
      needs nothing beyond the Notion setup already in place. Real magic-link
      verification requires Supabase Auth — a new service, plus the 7-day
      pause to work around.
- [ ] **Notion guestbook database** must be created with the properties listed
      at the top of `app/lib/guestNotes.ts`, and `NOTION_GUESTBOOK_DATABASE_ID`
      set. The section renders an empty state until then.

---

## 7. Out of scope

Guestbook / visitor-generated features, i18n, and any change to the finance
dashboard's own codebase. Notion stays as the project CMS.

---

## Sources

- [Cloud Storage for Firebase — billing requirements after Sept 2024](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
- [Supabase — Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Cloudinary — how credits work](https://cloudinary.com/documentation/developer_onboarding_faq_credits)
- [Cloudinary — compare plans](https://cloudinary.com/pricing/compare-plans)
