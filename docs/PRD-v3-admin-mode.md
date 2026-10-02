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
| Image dimensions | The research page serves **10 images with no width/height** — layout shift, which is a Core Web Vitals cost. |

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
