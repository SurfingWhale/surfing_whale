# Publishing rules

Rules for what may appear on surfing-whale.vercel.app. They exist because a
Notion row marked `INTERNAL / RESTRICTED — jangan di-publish ke portfolio
website` was published anyway, on 2 September 2026, for about three and a half
hours. The site had asked one question — is this tagged `#Finished`? — and had
no way to hear the answer to a different one.

These rules bind both the code and anyone, human or agent, working on it.

---

## 1. The absolute rule

**A project marked Restricted in Notion is never published. There is no
override.**

Fauzy's words, kept verbatim because they are the rule:

> restriction dari property notion sifatnya mutlak, jadi kalau udah restricted
> gabisa dimasukin ke project kecuali gw udah review ulang dan aman buat
> di-post.

What this forbids, specifically:

- No agent may publish a Restricted row because it "looks fine on review".
- No agent may publish a Restricted row because only part of it is sensitive.
- No agent may rewrite, summarise, paraphrase or excerpt a Restricted row's
  content into a hand-written page, a case study, or a description. Laundering
  the content through a different file is still publishing it.
- No agent may change `Visibility` from `Restricted` to `Public`, or clear a
  restriction marker, on its own initiative.

Only Fauzy lifts a restriction, and only after re-reading the row himself. An
agent that believes a row is safe says so and stops there.

## 2. What counts as Restricted

Any one of these is enough. They are checked independently, and one is enough
to withhold — they never outvote each other.

| Signal | Where |
| --- | --- |
| `Visibility` is anything other than `Public` | Notion property |
| `Status` is `Restricted` | Notion property |
| A padlock or 🚫 | title or page icon |
| restricted / confidential / internal / private / rahasia / NDA | title, tags, Sub Group, or Citation |
| `jangan dipublish`, `do not publish`, `not for publication` | same fields |
| The row cannot be read at all | — |

The last line is the important one: **unreadable means restricted.** A row
whose markers cannot be read is not a row anyone can vouch for.

`#Finished` is not in this table and never decides publication. It means the
work is done. Work can be finished and confidential at the same time — the
leak happened precisely because those two questions were being answered by one
tag.

## 3. What publication requires

Withholding is the default. To reach the site a row needs, positively:

1. `Tags` contains `#Finished` — the work is done, and
2. `Visibility` is exactly `Public` — Fauzy has decided it may be seen, and
3. no restriction signal from §2 is present anywhere on the row.

A blank `Visibility` publishes nothing. A row nobody has classified is a row
nobody has cleared.

## 4. Story is published; technical notes are not

A project page has two halves, and only one is for readers.

- **Story** — the problem, the decision, the result, what it looked like.
- **Technical** — schemas, queries, configuration, setup steps, and whatever
  got typed while thinking out loud.

Everything under a `Technical` heading stays in Notion. The section ends at the
next heading of the same or higher level, so `Story / Technical / Result` reads
the way it looks. Also recognised, without renaming: Teknis, Backend,
Implementation, Implementasi, Setup, Environment Variables, Env Var, Config,
Konfigurasi, Credential.

## 5. What never leaves, wherever it is written

The heading split is a convention, and conventions get forgotten mid-sentence.
These are enforced on every block regardless of which half it sits in, because
relying on the right heading is the same class of mistake as relying on the
right tag:

- **Credentials.** Env assignments whose name says key, secret, token,
  password, credential, auth, private, DSN or database id; vendor prefixes
  that are only ever live credentials (`ntn_`, `secret_`, `sk-`, `ghp_`,
  `AKIA`, `xox…`); private key blocks; bearer tokens; a password quoted with
  an actual value.
- **The private account handle**, in prose as well as in URLs. Only repos
  under an allowlisted owner may be linked; every other owner is withheld.
- **Images from unknown hosts.** Only allowlisted hosts are loaded, because an
  `<img src>` is a request the visitor's browser makes to whatever host is
  named.

Note the shape these share: each names what is *allowed* rather than what is
forbidden. Allowlisting what is public means never having to write down what
is private — so the handle stays out of the source, and out of the source maps
built from it.

Naming a password is not leaking one. "Berbagi satu password" publishes;
"input password 123" does not.

## 6. Where the cut happens

**On the server, always.** Sending a whole page and hiding part of it in CSS
is not a gate; anyone who opens the network tab reads straight past it. The
project list filters before render, `/api/notion/[id]` serves only ids the
list publishes, and the story/technical split runs before the page description
is chosen — so a link preview cannot quote a section the page itself withheld.

## 7. Clearing something for publication

The only path:

1. Fauzy re-reads the page in Notion, in full.
2. He removes what should not be public — or decides none of it should be.
3. He sets `Visibility` to `Public` himself.
4. He writes why in `Restriction Note`, so the reasoning survives to the next
   time someone edits the row.

An agent may **report** that a row looks publishable, and may say precisely
what it found. It may not take step 3.

## 8. If in doubt

Ask. Do not publish, and do not quietly hide either — hiding a row Fauzy has
cleared is also a decision that is not an agent's to make. State what was
found, name the specific concern, and let him choose.

---

*Enforced in `app/lib/notion.ts` (`isRestricted`, `storyOnly`, `publicImage`,
`publicLink`) and `app/api/notion/[id]/route.ts`. Changing those files means
changing this document first.*
