// app/lib/site.ts
// The site's own address, in one place.
//
// It was written out three times — in layout.tsx, in the access route, and in
// the Firebase sign-in host — which is three places to miss on the day a
// custom domain lands. The sitemap and robots.txt need it too, and a sitemap
// listing the wrong host is worse than no sitemap.
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://surfing-whale.vercel.app")
  .trim()
  .replace(/\/+$/, "");
