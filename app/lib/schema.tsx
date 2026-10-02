// app/lib/schema.ts
// Structured data — the JSON-LD that tells a search engine what a page is,
// rather than leaving it to infer from the prose.
//
// There was none anywhere: 0 of 13 pages. What it buys is not a ranking boost
// but a correct answer to "who is this" — a `Person` with a name, a job title
// and the profiles that corroborate it is the difference between a knowledge
// panel built from this site and one assembled from guesses.
//
// Everything here comes from something already on the page or already in the
// metadata. Nothing is invented: no ratings, no awards, no claimed employers.
// A schema that says something the page does not is worse than no schema,
// because it is the one part of a page a search engine reads as a statement
// of fact rather than as marketing.
import { SITE } from "./site";

export const PERSON_ID = `${SITE}/#fauzy`;
const SITE_ID = `${SITE}/#site`;

/** Serialises for a <script type="application/ld+json">. */
export const ld = (data: unknown) => JSON.stringify(data);

export const person = () => ({
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Muhammad Fauzy",
  url: SITE,
  jobTitle: "Data Analyst",
  description:
    "Accounting background, moving into data analysis. Writes about ledgers, forecasts and geospatial questions, and photographs in between.",
  knowsAbout: [
    "Data analysis",
    "Geospatial analysis",
    "Financial reporting",
    "Accounting",
    "Photography",
  ],
  address: { "@type": "PostalAddress", addressLocality: "Jakarta", addressCountry: "ID" },
});

export const website = () => ({
  "@type": "WebSite",
  "@id": SITE_ID,
  url: SITE,
  name: "Surfing Whale",
  inLanguage: "en-GB",
  publisher: { "@id": PERSON_ID },
});

/** The home page: who this is, and what the site is. */
export const homeGraph = () => ({
  "@context": "https://schema.org",
  "@graph": [person(), { ...website(), about: { "@id": PERSON_ID } }],
});

/**
 * A piece of writing — a post, an essay or a case study.
 *
 * `dateModified` is deliberately only set when something real is passed. A
 * page that claims it was updated today, every day, is a page a crawler
 * learns to stop believing.
 */
export const articleGraph = (a: {
  headline: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  type?: "Article" | "ImageGallery";
}) => ({
  "@context": "https://schema.org",
  "@graph": [
    person(),
    website(),
    {
      "@type": a.type ?? "Article",
      headline: a.headline.slice(0, 110),
      ...(a.description ? { description: a.description } : {}),
      url: a.url,
      mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
      ...(a.image ? { image: [a.image.startsWith("http") ? a.image : `${SITE}${a.image}`] } : {}),
      ...(a.datePublished ? { datePublished: a.datePublished } : {}),
      ...(a.dateModified ? { dateModified: a.dateModified } : {}),
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      isPartOf: { "@id": SITE_ID },
      inLanguage: "en-GB",
    },
  ],
});

/** A breadcrumb trail, for the case studies that sit under /work. */
export const breadcrumbs = (trail: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: `${SITE}${t.path}`,
  })),
});

/** Drops a graph into a page. Server-rendered, so a crawler sees it in the HTML. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // The content is built from our own data above, never from anything a
      // visitor supplied, so there is nothing here to escape.
      dangerouslySetInnerHTML={{ __html: ld(data) }}
    />
  );
}
