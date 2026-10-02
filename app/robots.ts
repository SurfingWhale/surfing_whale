// app/robots.ts
// /robots.txt did not exist. A framework with no robots route answers that
// path with its own 404 page, at Content-Type text/html, which a status check
// alone would pass — it was found by checking the body (scripts/audit-seo.mjs).
//
// Its real job here is the Sitemap: line. Everything else on this site is
// discoverable from the home page, with one exception worth excluding.
import type { MetadataRoute } from "next";
import { SITE } from "./lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // The studio and everything behind it.
          "/studio",
          "/darkroom",
          "/api/",
          // Raw files linked out of the case studies — maps, posters, a PDF.
          // Each is an indexable URL with no title, no h1 and no lang,
          // carrying the site's name. They belong to the pages that embed
          // them, not in a results list of their own.
          "/work/maps/",
          "/work/coffee/",
          "/work/padel/*.html",
          "/work/crime/",
          "/research/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
