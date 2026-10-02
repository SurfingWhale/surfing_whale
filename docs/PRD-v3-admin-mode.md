# PRD v3 — Admin mode

Status: draft · Author: Fauzy + Claude · 2026-08-25

## 1. Why

Everything on this site is either compiled into the repository or edited in
Notion. Publishing a sentence means a commit. Approving a guest note means
opening Notion and ticking a checkbox. The one exception is the darkroom,
which already writes photo essays from the site itself — and it works, which
is the reason to extend the idea rather than keep it as a one-off.

The ask: an admin mode on the site, where writing is composed in place.

## 2. What already exists

Worth being exact, because most of the foundation is built and the work here
is smaller than it looks.

| Piece | State | Where |
| --- | --- | --- |
| Password gate, HMAC cookie, rate limit | Shipped | `app/lib/darkroomSession.ts` |
| Photo upload → Cloudinary | Shipped | `app/api/darkroom/upload` |
| Essay composer (text + image rows) | Shipped | `app/darkroom` |
| Essay storage in Notion | Shipped | `app/lib/darkroom.ts` |
| Public essay rendering | Shipped | `app/photo/[slug]` |
| Guest notes capture | Shipped | `app/api/guest-notes` |
| Guest note approval | **Notion only** | `app/lib/guestNotes.ts:111` |
| Prose writing | **Missing** | — |
| Editing site copy | **Missing** | hard-coded in components |

Two things stand out. Notes are created with `Approved: false` and become
public only when the checkbox is ticked in Notion, so moderation lives
outside the product. And there is nowhere at all to publish writing that
isn't a photo essay.

## 3. Shape

One admin shell at `/studio`, with the darkroom becoming a room inside it
rather than a separate door.

```
/studio            → what needs attention: unapproved notes, drafts
/studio/write      → prose composer          → publishes to /writing/[slug]
/studio/darkroom   → the existing composer   → publishes to /photo/[slug]
/studio/notes      → approve, hide, delete guest notes
/studio/profile    → the hero's tagline and bio
```

`/darkroom` keeps working and redirects, so nothing that is already bookmarked
breaks.

### 3.1 Write

A prose composer, deliberately narrower than the photo one: a title, a
standfirst, and a body of blocks — paragraph, heading, quote, list, code,
image, and a divider. No rich-text toolbar. Markdown-ish shortcuts on a
plain textarea per block (`## ` for a heading, `> ` for a quote) beat a
toolbar for someone who writes in Notion all day.

An image inside a piece reuses the darkroom's upload path: browser-side
downscale, Cloudinary, permanent URL.

Published pieces list at `/writing` and render at `/writing/[slug]`, in the
same three-step type scale as the rest of the site.

### 3.2 Notes

Every note in one list with its state, and three actions: approve, hide,
delete. Approve flips the checkbox the API already reads, so the public
section needs no change. Email addresses are visible here and nowhere else —
the public read mapper already strips them and must keep doing so.

### 3.3 Profile

The hero's tagline and bio are strings in `HeroSection.tsx`, one pair per
mode. They move into the same Notion store, with the current values as the
fallback if the fetch fails. This is the smallest possible surface and it is
the one Fauzy will actually use most often.

## 4. Decisions

**Essays and posts live in Supabase Postgres** *(2026-10-01, were Notion)*.
`surfingwhale_essays` and `surfingwhale_posts` (supabase/surfing-whale.sql),
one row each, the blocks as jsonb, RLS on with no policies so only the
server's service-role key reaches them. Notion was storing each piece as a
chunked JSON code block and rewriting the page on every save; once photographs
were in Supabase anyway, keeping the words in a second system was the odd one
out. Projects, guest notes and access requests are still read from Notion.

**One photo library** *(2026-10-02)*. The archive room and the darkroom's
uploads were two piles of the same photographs, and the archive had a public
page of its own. Now every upload lands in one private library (the Photos
room); the darkroom and the writing room pick from it with "From library", and
a photograph reaches the site only inside an essay or a post. /archive is gone
(it redirects home). A photograph still used in an essay or a post cannot be
deleted from the library — the refusal names the pieces.

**Supabase Storage is the file store** *(2026-10-01, was Cloudinary)*. Notion's
own file URLs are signed and expire within the hour, which makes them unusable
for anything published. One public bucket, written only from the server with
the service-role key; the browser compresses first (WebP, long edge bounded,
EXIF and GPS dropped), so a phone upload is a few hundred kilobytes. Images
already on Cloudinary keep rendering.

**One session, not four** *(2026-10-01: Google sign-in, no password)*. Getting
in is a Firebase Google sign-in, per creative-hub's auth standard. The server
verifies the ID token against Google's keys for this project and checks the
verified admin email (`app/lib/adminAuth.ts`), then issues the same signed
cookie that carries the whole of `/studio`. There is no password to lose or
to guess at.

**Publishing is explicit.** Everything is a draft until a checkbox says
otherwise, and a draft's URL returns 404 rather than rendering. This already
holds for essays; writing inherits it.

**Revalidation is on-demand.** Public pages are ISR at 60 seconds today,
which means up to a minute of "did it save?". Saving should call
`revalidatePath` for the affected route so the change is visible on the next
load, with the 60-second window kept as the fallback.

## 5. Security

The gate is already server-side and stays that way. Restating what any new
route inherits, because these are the parts that are easy to lose in a
refactor:

- Every write route checks the session before it reads the body.
- Sign-in is a Google-signed token for this Firebase project with the admin's
  verified email; nothing else is accepted, so there is nothing to guess.
- A missing `DARKROOM_SECRET` signs with a per-boot random value, so a
  misconfigured deployment fails closed instead of using a guessable key.
  (This said `ADMIN_SECRET` until 2026-10-02; the code has always read
  `DARKROOM_SECRET` — see §10.)
- Everything from the browser is re-validated on the server before it reaches
  Notion, including that image URLs point at our own bucket.
- `/studio` is `noindex`, and admin routes never appear in the sitemap.

The in-memory rate limiter that guarded the password is gone with the
password.

## 6. Quality bar

The admin surfaces meet the same bar as the public ones, which the site now
passes and which was measured rather than assumed:

- One visible focus ring on every control, on `:focus-visible` only.
- A skip link as the first tab stop.
- No interactive target under 24×24px.
- Dialogs trap Tab, close on Escape and hand focus back to their trigger.
- Submit buttons stay enabled and name the field that is missing, rather than
  greying themselves out.
- Every form field carries a label and an `autocomplete` value.
- Motion is opt-in under `prefers-reduced-motion`.

## 7. Phases

**Phase 1 — Notes — shipped.** The Notes room in `/studio`: publish, hide,
delete, with a confirmation on delete. The loop that ran through Notion is
closed — a note left on the site is published from the site.

**Phase 2 — Write — shipped.** Block composer with Notion's markdown
shortcuts, `/writing` index, `/writing/[slug]`, images through the existing
upload path.

**Phase 3 — Shell — shipped in part.** `/studio` holds Write and Darkroom
behind one session; `/darkroom` redirects into it. Still to do: a landing
view showing what needs attention.

**Phase 4 — Profile (two hours, next).** Hero tagline and bio from the store, with
the current strings as fallback.

**Phase 5 — On-demand revalidation — shipped.** Saving or deleting an essay,
a post or an archive frame revalidates its public pages and the home page.

## 8. Non-goals

- More than one author, roles, or permissions.
- Comments, likes, or any social layer beyond the guest notes that exist.
- A rich-text WYSIWYG. Blocks and keyboard shortcuts, or nothing.
- Scheduled publishing.
- Analytics inside the studio; Vercel already has them.
- Editing the case study, which is prose in a component and belongs in the
  repository where its diff is reviewable.

## 9. Open questions

1. Should `/writing` sit in the main navigation, or stay reachable only from
   the darkroom the way photo essays currently are?
2. Do guest notes need an email reply from inside the studio, or is knowing
   the address enough?
3. ~~Is one password enough?~~ Answered 2026-10-01: Google sign-in.

## 10. Environment variables

Every `process.env` the app reads, what happens without it, and whether it is
actually set on the production deployment. **Values live in Vercel and
nowhere else** — this table carries names and states only, because the
repository is public.

"Set on prod" was read from the live deployment's own health endpoints on
2026-10-02, not assumed: `/api/access` reports `notionConfigured`, `gate` and
`gateBlockedBy`; `/api/darkroom/session` reports `configured`, `notion` and
`storage`. The MCP token this session has cannot list project env vars (403),
so anything those endpoints do not cover is marked **unverified** rather than
guessed at.

*Update 2026-10-02, later:* the names and targets below were then read with
`vercel env ls` from a linked checkout — names and environments only, no
value was decrypted. Rows marked "listed" are confirmed present on
Production and Preview; rows marked "unset" are confirmed absent.

### 10.1 Required — the gate and the studio stop working without these

| Variable | Without it | Set on prod |
| --- | --- | --- |
| `DARKROOM_SECRET` | Cookies are signed with a per-boot random value, so every session dies on the next request. The access gate refuses to switch on (`gateBlockers`). | ✅ (`gateBlockedBy: []`) |
| `NOTION_API_KEY` | No projects, no guest notes, no access requests. | ✅ |
| `NOTION_ACCESS_DATABASE_ID` | Access requests are not recorded; the gate refuses to switch on. | ✅ |
| `NOTION_GUESTBOOK_DATABASE_ID` | Guest notes return `{notes: [], configured: false}` — an empty guest book, not an error. | ✅ (3 approved notes live) |
| `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) | No essays, posts, or photo library. | ✅ (`storage: true`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same. This is the only key that reaches rows behind RLS — server only, never `NEXT_PUBLIC_`. | ✅ |

### 10.2 Switches and optional

| Variable | Default | Effect | Set on prod |
| --- | --- | --- | --- |
| `ACCESS_GATE` | unset → open | Must be the literal string `on`. Anything else — including `approval` or `true` — leaves the gate open and everything readable. | ✅ `on` (live reports `gate: "approval"`, which is the *reported* state, not the variable's value) |
| `WHATSAPP_NUMBER` | none | The WA button returns **503** to an approved reader. Digits only, no `+`. | ✅ set 2026-10-02, Production and Preview (Fauzy chose the original number; see §11.1 item 2). The Access room warns if it ever goes missing |
| `RESEND_API_KEY` + `MAIL_FROM` | none | Approval emails do not send. Approving still works and the studio shows the link to send by hand, so this is a convenience, not a dependency. Both are needed; one alone does nothing. | ✅ listed (values not checked; the Access room shows `mailConfigured`) |
| `ADMIN_EMAIL` | `fauzymuhamad43@gmail.com` | Which verified Google account may enter `/studio`. | unset — the fallback is the right address |
| `NOTION_DATABASE_ID` | a default id in `notionIds.ts` | The projects database. | ✅ (`notion: true`) |
| `SUPABASE_BUCKET` | `surfing-whale` | Storage bucket name. | unset — the default is right |
| `NEXT_PUBLIC_SITE_URL` | `https://surfing-whale.vercel.app` | The host written into approval links. **Must be changed the day a custom domain lands**, or approved readers get links to the old host. | ✅ listed (value not checked) |
| `SYNC_SECRET` | `""` | Guards `/api/sync-images`. Empty means the route **refuses every request** — it fails closed since `3512d72`; before that it fell back to `"dev-secret"`. | ✅ listed, Production and Preview (set 2026-10-01) |

### 10.3 Client-side (`NEXT_PUBLIC_*`) — these ship to every visitor

`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_APP_ID`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_SIGN_IN_HOST`.

All four have hardcoded fallbacks in `app/lib/firebaseConfig.ts`, so the
sign-in works whether or not they are set. That is deliberate and safe: a
Firebase web API key is a public project identifier, not a credential — what
actually protects `/studio` is the server verifying a Google-signed ID token
against this project *and* checking the verified email (`app/lib/adminAuth.ts`).
Nothing is gained by hiding them and a broken sign-in is lost by getting them
wrong.

`NEXT_PUBLIC_SIGN_IN_HOST` is the one to watch: it names the host Google
redirects back to. A custom domain means changing it here *and* in the
Firebase console's authorised domains.

### 10.4 Build and tooling only

`SW_FONT` (`scripts/generate-brand-assets.mjs`), `NEXT_PUBLIC_BASE_URL`
(`scripts/syncs-images.ts`), `NODE_ENV`. Nothing on the site reads these at
runtime.

## 11. Pending

Everything known to be unfinished, in the order it costs something.

### 11.1 Blocked on Fauzy

1. ~~**`WHATSAPP_NUMBER` is not set.**~~ Set 2026-10-02 on Production and
   Preview, to the original number — Fauzy's choice, made knowing item 2.
2. **The old WhatsApp number is in public git history.** It was a client-side
   const from `d33b890` until `f8fc9c8` moved it server-side. Removing it from
   the shipped bundle does not remove it from the commits, and the repository
   is public. The only real fix is a different number; rewriting history on a
   public repo is worse than the problem.
3. **`public/work/maps/indonesia-nik-provinsi.html` is an orphan** — 102KB,
   referenced by no page. Delete, or give it a page. (The poster next to it,
   `isochrone-tomoro-poster.jpg`, *is* used, by the hero.)
4. **The epub → Indonesian → PDF job for ElevenLabs** has never had its file.

### 11.2 Decided but not built

5. **Phase 3 is shipped in part.** `/studio` still has no landing view saying
   what needs attention — pending notes, drafts, pending access requests. It
   opens straight into a room.
6. **Phase 4 — Profile — not started.** The hero's tagline and bio are still
   strings in `HeroSection.tsx`.
7. ~~**Nothing reports WhatsApp or mail configuration to the admin.**~~ Done
   2026-10-02: `/api/studio/access` returns `whatsappConfigured` beside
   `mailConfigured`, and the Access room says when the number is missing. Not
   on `/api/darkroom/session` as first suggested — that route answers anyone,
   signed in or not, so it is the wrong place to describe the setup.

### 11.3 Verification gaps

8. **Safari/WebKit has never been tested.** Every measurement in this repo —
   contrast, the chrome effect, overflow, headings — was taken in Chromium.
   The session's proxy blocks the WebKit download, so this cannot be closed
   from here. The chrome effect is the live risk: it was already rebuilt once
   because SMIL `gradientTransform` does not animate in WebKit, and the rAF
   loop that replaced it is the thing that has never been seen on a real
   Safari.
9. ~~**`scripts/verify-headings.mjs` still checks `/archive`.**~~ Done
   2026-10-02: it checks `/photo` and `/writing` and asserts the `/archive`
   redirect on its own line.

### 11.4 Open design questions

10. **The hero typeface was never resolved.** It is Oswald — condensed — where
    the reference Fauzy sent uses a wide grotesque. Candidates offered and
    never chosen: Archivo Black, Inter Black, Figtree 900.
11. Items 1 and 2 of §9 are still open: whether `/writing` belongs in the main
    navigation, and whether guest notes need a reply from inside the studio.

### 11.5 Housekeeping

12. ~~**The repository has moved to `SurfingWhale/surfing_whale`.**~~ The local
    checkout on Fauzy's machine already points `origin` at
    `https://github.com/SurfingWhale/surfing_whale.git`; only other clones (the
    cloud session's) may still use the old owner's URL.

13. **Google sign-in from the home-screen app is still off.** The site's own
    redirect URI, `https://surfing-whale.vercel.app/__/auth/handler`, is still
    refused (`redirect_uri_mismatch`, re-checked 2026-10-02, about fourteen
    hours after it was said to be added) — too long for propagation, so it is
    most likely on the wrong client or in "Authorized JavaScript origins".
    It belongs under **Authorized redirect URIs** of the Web client whose ID
    starts `751278619218-posj0le1`, in the Google Cloud project
    `surfing-whale`. Once it passes, set `GOOGLE_IN_APP = true` in
    `app/lib/firebaseConfig.ts`. Browser tabs are unaffected: they sign in
    through `firebaseapp.com`.

## 12. Discoverability audit — 2026-10-02

Run against a production build with `scripts/audit-seo.mjs`, which crawls from
the home page rather than taking a list of routes, because what a crawler can
reach is itself one of the findings.

This is an SEO audit, not a QA one. It would not have caught the gallery
viewer having no way out — that was an interaction defect, and no checklist of
this kind contains it. Kept separate on purpose.

### 12.1 Nothing can find this site

Three findings, and the first two are the reason the rest barely matter.

1. **`/robots.txt` is a 404**, on localhost and on production.
2. **`/sitemap.xml` is a 404.** There is no `app/sitemap.ts` and no
   `public/sitemap.xml`. §5 of this document claims "admin routes never appear
   in the sitemap", which is true only because no sitemap exists.
3. **`/photo` and `/writing` are orphans.** Both have good titles and
   descriptions, and neither appears in the home page's served HTML. The only
   link to the darkroom is inside the photography section, which renders in
   the "capture" profile mode — client state, reached by a click. No sitemap
   plus no inbound link means the entire photo-essay and writing output is
   invisible to a crawler.

### 12.2 Measured, 13 pages crawled

| Check | Result |
| --- | --- |
| Canonical tags | **0 of 13.** None anywhere on the site. |
| Schema / structured data | **0 of 13.** No `application/ld+json` at all. |
| `<html lang>` | `id` on every page, and the copy is English. Wrong for both search and screen readers. |
| Titles 50–60 chars | 3 of 9 real pages. Home is 30 (`Muhammad Fauzy — Surfing Whale`), `/work/tracker-doc` is 26, the research page is 62. |
| Meta descriptions | Present and unique on all 9 real pages. 3 outside 120–160 chars. |
| One `<h1>` per page | 4 of 9. `/work/coffee-access`, `/work/padel` and the research page each carry **two**. |
| Heading skips | None. |
| Breadcrumbs | None anywhere. |
| Image dimensions | **Far worse than first reported.** The home page serves 23 images with no `width`/`height` attribute, the research page 10, `/work/crime-la` 4, `/work/coffee-access` 1 — every image on the site, in effect. The first pass said "10, on the research page only" because it read `img.width`, which returns the *rendered* width and is non-zero for anything that has loaded. The attributes are what reserve the box, and what layout shift depends on. Corrected 2026-10-02 by `seo-crawl`. |

### 12.3 Alt text is wrong where it matters

23 images on the home page; 19 carry `alt=""`, which declares them decorative
and hides them from search and from a screen reader.

Correct for `a2.jpg`–`a7.jpg` (the screensaver frames). **Wrong** for the rest,
which are content: `finance.jpg`, `coffee.jpg`, `crime.jpg` (the work
thumbnails), `sheet-recap.jpg`, `sheet-beranda.jpg`, `coffee-1..3.jpg`,
`crime-1..3.jpg`, `approval-flow.svg`. These are the case-study exhibits and
they describe themselves to nobody.

### 12.4 Raw files are being served as pages

Four of the thirteen URLs a crawler reaches are assets linked directly from
case studies: `/work/padel/gap-map.html`, `/work/padel/isochrone-multirange.html`,
`/work/crime/harbor-map.html`, `/research/finance/executive-summary.pdf`, plus
two `.jpg` paths. Empty title, no `<h1>`, no description, no `lang`. They are
indexable thin pages carrying the site's name. Either wrap them in a page or
exclude them in the robots.txt that does not yet exist.

This is also where `public/work/maps/indonesia-nik-provinsi.html` belongs
(§11.1 item 3) — the same class of file, with not even a link to it.

### 12.5 Not measurable from here

Keywords, search intent, cannibalisation, backlinks, competitor gaps, CTR and
impressions all need Google Search Console, which is not connected. Nothing in
this section guesses at them.

## 13. Dead ends — 2026-10-02

Asked for after the photo library turned out to lead nowhere: a sweep for
anything built that a reader, or Fauzy, cannot actually get to. Measured, not
guessed — reachability was read off a production build, the data flows off the
imports.

### 13.1 Fixed in this pass

**A photograph could not reach the site on its own.** There were two routes and
both went the long way: write an essay or a post and pick the frame inside it,
or hand-edit `app/data/photography.ts` and push a commit. The gallery read that
array and nothing else. Now a frame can be published from the Photos room —
description, category, on the site. See the commit "A photograph can go on the
site on its own now".

This one had been written into a comment as if it were a decision rather than
an oversight, which is how it survived two sessions.

### 13.2 Still dead

| What | State |
| --- | --- |
| ~~`/photo` and `/writing`~~ | **Fixed 2026-10-02.** Both are in the sitemap whatever the nav decides, the darkroom has a nav entry it never had, and robots.txt exists. They still carry no inbound link until the first essay and post are published — by design, so neither lands a reader on "Nothing published yet" — which is exactly the gap a sitemap is for. |
| `app/components/ScrollVelocity` | Imported by no file. |
| `app/components/RotatingText` | Imported by no file. |
| `/api/sync-images` | Called from no file in the app — it is a tool run by hand. **Not** open: `authorised()` refuses an empty `SYNC_SECRET`, so an unset secret locks everyone out rather than letting everyone in. §13.2 claimed otherwise until 2026-10-02; that was a misreading, not a bug. |
| `public/work/maps/indonesia-nik-provinsi.html` | 102KB, linked from nothing (§11.1). |
| WhatsApp, for an approved reader | 503 until `WHATSAPP_NUMBER` is set (§10.2). The gate's promise is partly false until then. |

### 13.3 The pattern

Every one of these is the same shape: a thing that works, with no route to it.
Nothing here is broken in a way a test would catch — the pages return 200, the
components compile, the routes respond. What is missing is the link, the
button, or the sitemap entry that lets anyone arrive.

So the check worth keeping is not "does it work" but **"what can reach it"**,
which is why `scripts/audit-seo.mjs` crawls from the home page rather than
taking a list of routes. A route list would have reported `/photo` and
`/writing` as healthy.

### 13.4 After the discoverability pass — 2026-10-02

Measured on a production build with `scripts/audit-seo.mjs`, before and after.

| | before | after |
| --- | --- | --- |
| blocking findings | 9 | **0** |
| warnings | 13 | 7 |
| `/robots.txt` | 404 | ok |
| `/sitemap.xml` | 404 | ok, 9 urls |
| canonical tags | 0 of 13 | every page not excluded in robots.txt |
| pages with two `<h1>` | 3 | 0 |
| `<html lang>` | `id` on English copy | `en-GB` |

Still open, and stated rather than closed quietly: no structured data on any
page, images without `width`/`height` attributes (23 on the home page alone —
§12.2), and three raw files still linked out of case studies as if they were
pages. The last are excluded in robots.txt now, which stops them being indexed
but does not stop them being linked.

## 14. The opening — 2026-10-02

Asked for from a recording of [carterogunsola.com](https://carterogunsola.com):
a count to 100 climbing the right edge of a black screen, a monogram pinned
bottom left, and a soft-edged wipe at the end.

Built as `app/components/Intro.tsx` with the wipe changed to the thing this
site is named after: the edge is ChromeWord's `SWELL`, the same cubic the
chrome type rides along, so the curtain is a wave rather than a straight line
and it is one idea used twice rather than two.

### 14.1 The rules it is built to

An intro is the only component that can lock somebody out of a site they have
not seen yet. Three rules, all checked by `scripts/verify-intro.mjs`:

1. **It never gates the content.** The page is server-rendered underneath and
   complete before this mounts. With JavaScript off, the pre-paint script
   never adds the class, nothing is painted, and the site is simply there.
2. **It cannot get stuck.** Everything that takes the overlay away is a CSS
   animation with `forwards`, not React state. Blocked JS chunks — hydration
   never happening — still leaves a usable page. React only drives the number.
3. **Once a session, and never under `prefers-reduced-motion`.** Replaying on
   every internal navigation is how a nice intro becomes the reason somebody
   leaves.

### 14.2 Two things found by capturing frames, not by reading code

**A flash of the whole site, then black, then the site again.** The overlay was
a React component, so it arrived a hydration late — measured at 149ms on a
production build. The ink moved to `html.intro::before`, set by the pre-paint
script.

**That fix was not enough, and a phone found the rest of it.** `::before` was
still defined in the external stylesheet, and the page is render-blocked on
that file. On 4G Fauzy got **1.3 seconds of white and then the counter** — two
loading states where the reference has one. Reproduced with the stylesheet
held back 900ms: first ink at 1313ms, with white before it.

The ink is now inlined in `<head>` as `INTRO_CRITICAL_CSS`. **First ink at
25ms, zero white frames.** It cannot use `var(--fg)` — those tokens are in the
file it is racing — so it carries `#111111` and `#f0f0f0` as literals, and
case G of the checker fails if they drift from `globals.css`.

**Nothing is on a clock that starts at first paint any more.** The exit used a
fixed 1400ms delay, which on a slow connection would have fired before React
had loaded to draw the number and skipped the whole count. Everything keys off
an `.intro-out` class that React adds when the count finishes — or that a
`setTimeout` in the inline script adds after 5s if React never arrives. That
backstop lives in the HTML rather than in a chunk that can fail to load, and
React stands down if it finds the exit already run.

**The wave was invisible.** Two versions of it. First the curtain was one tall
path whose top 30% was the swell: on a 390×844 phone the solid part came to
709px, less than the viewport, so the crest had to travel off the top before
the screen was covered. Then, with the crest riding on its own body, the ink
panel was *also* sliding up — and a straight bottom edge moving at the same
speed is all anyone saw. Nothing lifts now. The ink sits still and is covered,
which is what the reference does.

### 14.3 NumberFlow

Looked at per the ask. `@number-flow/react` 0.6.2, MIT, ~36KB unpacked plus a
~60KB core, custom-element based, and it ships `usePrefersReducedMotion` and
`useCanAnimate` — it is a good library.

**Not used for the opening.** A loading screen that waits for a library to
download before it can count is backwards, and this is on the critical path of
a first visit. The rolling digits here are a 10-high column translated by
`-digit × 10%`, which is about fifteen lines and no bytes.

**Worth it where numbers change after hydration** — the guest-note fan's
`{n} / {total}` as it is swiped is the honest case. Left as a decision rather
than taken.

### 14.4 The cost, stated

For one visit per session the overlay is the largest thing painted, so it is
what LCP measures: about 2.2s of ink. That is the price of the thing asked
for. A second page in the same session, and anyone with reduced motion, pay
nothing — no overlay is rendered at all.

## 15. What measuring changed — 2026-10-02

Three entries in this document were wrong, and one piece of work was nearly
done for nothing. All three were caught by measuring the thing rather than a
proxy for it.

**`/api/sync-images` is not open.** §13.2 called it a security hole on the
strength of `const SYNC_SECRET = process.env.SYNC_SECRET ?? ""`. Five lines
below, `authorised()` returns false whenever the secret is empty — it fails
closed, and a comment in the file says so. Corrected in §10.2 and §13.2. The
mistake was stopping at the first line that looked like an answer.

**Twenty-three images "causing layout shift" caused none.** The crawler
counted images with no `width`/`height` attribute and called the count layout
shift. Measured with a `layout-shift` PerformanceObserver on a throttled
phone, the whole site came to:

```
/                                 CLS 0.0005   good
/work/crime-la                    CLS 0.0690   good   <- the only real one
/work/finance-dashboard/research  CLS 0.0005   good
/work/coffee-access               CLS 0.0005   good
```

An image inside a box CSS has already sized shifts nothing. One of thirty-eight
was real — four charts on `/work/crime-la` at three different aspect ratios,
pushing their captions. Those four now carry their pixel size: **0.0690 →
0.0005**. The other fifteen files were not touched, and `seo-crawl` now
measures CLS instead of counting attributes.

**Structured data went from 0 pages to every page.** A `Person`, the `WebSite`,
an `Article` or `ImageGallery` per piece, and a `BreadcrumbList` on the case
studies — `app/lib/schema.tsx`. Everything in it comes from something already
on the page: no ratings, no awards, no claimed employers. A schema is the one
part of a page a search engine reads as a statement of fact, so inventing
anything there is worse than leaving it empty.

The crawler reported all of it as `?` at first — it read `@type` off the top
level, and a `@graph` has none. Fixed in the skill.

`ScrollVelocity` and `RotatingText` are deleted: 20KB imported by nothing.

| | before | after |
| --- | --- | --- |
| crawler warnings | 7 | **2** |
| blocking | 0 | 0 |
| structured data | 0 of 7 pages | 7 of 7 |
| worst CLS | 0.0690 | 0.0005 |

The two warnings left are both honest and both already explained: `/photo` and
`/writing` have no inbound link until the first essay and post are published
(the sitemap covers them), and two raw image files are still linked out of
case studies.

## 16. Rhythm — 2026-10-02

Fauzy: *"nuance offset dan symmetrical spacing-nya tuh gabisa lo create ya …
design mereka punya nafas, ga bertubrukan, gadipaksa berjarak … ai kerasa
banget design yang sesek."*

He is right about the mechanism, and measuring the site located it — after
three wrong counts, which are worth recording because they are the same
mistake each time.

### 16.1 Three over-counts before one real finding

| Claimed | Actual |
| --- | --- |
| 147 distinct left edges | 53 — the first count included `<path>` and `<g>` **inside SVGs** |
| 121 rogue edges | 43 — then most of those were items in a horizontal row, which legitimately each have their own x |
| 43 rogue edges | ~0 — the rest were the bounding boxes of **rotated** avatar cards |

Every one of these was a metric that counted something adjacent to the thing
it claimed to measure, which is the same failure as "23 images causing layout
shift" in §15. The pattern: build the measurement, then check what it is
actually counting before believing it.

### 16.2 What was real

**The hero's edges were emergent, not chosen.** `grid-template-columns:
minmax(0,1fr) auto` with `place-self: center` on the name meant nothing
decided where anything sat. At 1440 the name landed at x=282 and the facts
column at x=1252, with its own children at 1255, 1258 and 1262 — five edges
inside eleven pixels.

That is the difference between an offset and a near-miss. An offset is a
column line somebody picked; a near-miss is two things that look like they
were meant to line up and did not. The eye reads the second as a mistake.

The hero is now on the same twelve columns as every other section:

| | before | after |
| --- | --- | --- |
| name | x=282, emergent | x=260 — column 3, offset on purpose |
| facts | x=1252, emergent | flush right to x=1180 — the trailing line `.frame-split` already uses |
| sentence | x=24 | x=24, unchanged |

Ragged leading edge against a flush trailing one, opposite the sentence below
it. That asymmetry is chosen. Below 66rem nothing changed — the grid only
applies where there is room for it.

**Twenty-one spacing steps were in use.** 0, 2, 4, 6, 8, 10, 12, 14, 16, 20,
24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96px. Six of them sat between 4 and
14px, which is where *grouping* is decided — and with six near-identical
options nothing groups. A reader cannot tell 6px from 8px as a signal, only as
untidiness.

48 usages collapsed: 6→8, 10→12, 14→16, 56→64. The grouping range is now
three steps: **4, 8, 12px**.

`--space-1` to `--space-6` in globals.css are the scale new work should use,
each twice the one below, because the eye reads ratio rather than difference —
the rule the layout skill states as "the gap between two groups must be at
least twice the gap inside one".

### 16.3 What was not done, and why

The other ~500 utility classes were left alone. Rewriting them to sit on six
tokens is a day of changes nobody can eyeball, for a gain no one would see.
`scripts/verify-rhythm.mjs` fails on a step used once or twice — an accident,
since nobody decides a value and uses it once — and on more than four steps in
the 4–14px range. That catches drift while it is still one line.

### 16.4 The honest part

None of this is taste. It removes the noise that makes taste hard to hear —
near-misses, accidental steps, edges nobody chose. The judgement about whether
the result has breath is still Fauzy's, and the loop that has worked all
session is him saying it feels wrong and the measurement finding where.

### 16.5 The rest of the page, and where measuring stopped helping

The other six sections were measured against the same twelve column lines.
Almost every edge that came back "off grid" was legitimate once looked at one
at a time:

| Looked wrong | Actually |
| --- | --- |
| tilted photographs at x=448, 479, 865, 896, 913 | contents of a card, positioned against the card |
| cards at x=795 | cells of a two-column sub-grid inside the content column |
| x=534 in Activity, x=550 in Contact | the second item in a row |
| x=399, 461 in Guest notes | centred text inside a card |

One was real: `p-[18px]` on the project card's caption — the only arbitrary
pixel padding in the codebase that was off any scale. Now `p-4`.

**That is the fourth over-count** (§16.1 has the first three). A fifth followed:
a checker for the layout skill's grouping ratio — *the gap between groups must
be twice the gap inside one* — matched three containers out of a page, because
most of this layout uses CSS `gap` rather than stacked margins, and reported
the hero's deliberate 696px of air as a failure.

So the metric-building stopped there. Five measurements, four of which
measured something next to the thing they claimed to. The remaining finding
came from looking at a screenshot.

### 16.6 Sections spaced by force

Every section carried the same 96px of padding, so **Activity (one row) and
About (one paragraph) were separated by the same 192px as the work section
with five projects in it.** The gap was uniform regardless of what was being
spaced, which is what "dipaksa berjarak" looks like at page scale, and it
reads as both being equally important.

Both are short and both are about the person rather than the work, so they are
one group. Consecutive `data-weight="minor"` sections now halve the gap
between them and drop the hairline that would fence them apart again:

```
work  -> activity   192px
activity -> about    64px     <- one group
about -> notes      192px
notes -> contact    192px
```

Three to one, against a rule that asks for two. The air around the pair did
not change; what changed is that it is now around the pair rather than
through it.

## 17. Why Delete really failed — 2026-10-02

The message that §11-era work put in front of the error turned out to be the
whole point of putting it there. With "Could not delete it." replaced by the
reason, the studio said:

> Find essays using a photo: **invalid input syntax for type json**

`essaysUsing()` and `postsUsing()` ask Postgres whether any published piece
still shows a photograph, with jsonb containment:

```ts
.contains("blocks", [{ type: "images", items: [{ publicId }] }])
```

supabase-js branches on the **type** of that value. A string is passed through;
an object is `JSON.stringify`d; **an array becomes a Postgres ARRAY literal**,
built with `value.join(",")`:

```js
} else if (Array.isArray(value)) {
  this.url.searchParams.append(column, `cs.{${value.join(',')}}`)
}
```

An array of objects therefore went out as, verbatim:

```
blocks=cs.%7B%5Bobject+Object%5D%7D      ->      blocks=cs.{[object Object]}
```

Postgres parsed that as jsonb and answered "invalid input syntax for type
json" — on every delete, from the day it was written.

It shipped looking correct because `.contains(column, [...])` is exactly what
the documentation shows. That form is for an array **column**. For a jsonb
column the value has to be JSON, which means handing over the string:
`.contains("blocks", JSON.stringify([...]))`.

### 17.1 The check, and proving it is one

`scripts/verify-library.sh` case H reads the query the fake Supabase actually
received and fails on `{[object Object]}`.

A test that passes before and after a fix proves nothing, so it was run both
ways: **FAIL on the old code, PASS on the new.** The first version of the
assertion passed on the broken code — it looked for `object%20Object` and the
space is encoded as `+`. Caught by running it against the bug rather than
trusting it.

A, B, C, D, E, F, G, H: ALL PASS.

### 17.2 Still open

The library shows 22 photographs with visible repeats. Those are **separate
uploads of the same picture**, not the folder duplication §16 fixed — every
upload gets four random bytes in its name, so three uploads of one file are
three different objects and nothing can tell them apart by name. Deleting them
works; there is just nothing to deduplicate.

## 18. Why the photographs were not on the site — 2026-10-02

Delete works. Fauzy's next question: the gallery still shows the five
hardcoded photographs, not his fifteen.

The answer was already on his screen: **"In the library · 15 · 0 on the
site."** Nothing had been published. Publishing is a separate act — tap a
frame, describe it, "Put it on the site" — and nothing in the library goes up
on its own.

But "0 on the site" could not tell him *which* of two things was true, and
that is the real defect:

1. nothing has been published yet, or
2. nothing **can** be, because `surfingwhale_photos` was never created.

`/api/library/list` read the details with a `try`, logged the failure to a
server console nobody reads, and returned `published: false` for every frame.
Both cases produce the same screen.

**That is the same mistake as "Could not delete it." — in the same file, two
days after fixing it.** The pattern is: a failure that is survivable gets
swallowed so the screen still works, and the reason goes to a log the only
person who can act on it will never see.

The listing now carries `details: { ok, reason }`, the room drops "0 on the
site" when the table cannot be read, and says instead:

> Photographs cannot go on the site yet — the table they live in is not there.
> Run `supabase/surfing-whale.sql` once in Supabase → SQL Editor. It is safe
> to run again if it has been run before. Uploading and deleting work without
> it.

Case I in `scripts/verify-library.sh`: the failure is reported, it names the
fix, and a healthy table reports ok. A through I: ALL PASS.

## 19. "The button isn't there" — 2026-10-02

Fauzy, after the deploy: the publish button is missing, he probably needs to
clear his cache.

**Nothing was stale.** Checked rather than assumed:

- there is **no service worker** on this site — `app/manifest.ts` says so in a
  comment — so nothing holds old JavaScript on a phone;
- `11f3ffa` was deployed and `READY` on production;
- `GET /api/library/publish` answers **405 Method Not Allowed** with
  `x-matched-path: /api/library/publish` — the route exists, it just only has
  a POST.

So clearing the cache would have changed nothing, and the real cause was
simpler: **publishing had no label on it.** Delete is a chip on every tile
that says "Delete". Publishing was an unlabelled tap on the photograph itself,
and the panel it opens sits under the whole grid. Nothing on the screen said
so. "The button isn't there" was literally true — there was no button, only a
gesture nobody had been told about.

The room now says, above the grid: *Tap a photograph to describe it and put it
on the site.*

### 19.1 What each check actually proves

`scripts/verify-studio-photos.mjs`, run both ways:

| | |
| --- | --- |
| C the room says a tap opens it | **FAILS** with the label removed. This is the fix. |
| B the panel is on screen afterwards | **PASSES** with the `scrollIntoView` removed too, even with fifteen photographs. The harness could not reproduce the panel landing off screen. |

The scroll stays — it costs nothing and a long library makes it plausible —
but it is **defensive, not demonstrated**, and both the component and the
checker say so. Claiming it as the fix would have been inventing a cause that
matched a fix I had already written.

The fake Supabase now holds **fifteen** photographs rather than eight, because
a fixture smaller than the real thing is a fixture that passes on broken code.
That change did not make B fail either, which is how the above is known.
