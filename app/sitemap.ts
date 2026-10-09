// app/sitemap.ts
// /sitemap.xml did not exist, and §5 of the PRD claimed admin routes never
// appeared in it — true only because there was no sitemap.
//
// It matters most for the two pages a crawler cannot otherwise reach: /photo
// and /writing are linked from the home page only once they have something
// behind them, so until the first essay or post is published there is no path
// to either. They go in the sitemap regardless, which is the point of having
// one.
import type { MetadataRoute } from "next";
import { listPosts } from "./lib/writing";
import { listEssays } from "./lib/darkroom";
import { SITE } from "./lib/site";

// An hour. The lists come from Supabase, and a sitemap rebuilt on every
// crawler request is a database round trip bought by anyone who asks.
export const revalidate = 3600;

const STATIC: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/photo", priority: 0.8 },
  { path: "/writing", priority: 0.8 },
  { path: "/testament", priority: 0.7 },
  { path: "/work/finance-dashboard", priority: 0.7 },
  { path: "/work/finance-dashboard/research", priority: 0.5 },
  { path: "/work/salespal", priority: 0.7 },
  { path: "/work/coffee-access", priority: 0.7 },
  { path: "/work/crime-la", priority: 0.7 },
  { path: "/work/padel", priority: 0.7 },
  { path: "/work/tracker-doc", priority: 0.7 },
];

// A date that is not a date tells a crawler nothing and can get a whole entry
// dropped, so an unparseable one is simply left off.
function on(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Published only — both listers filter drafts, and a draft's URL 404s.
  // Failures inside them return [], so a database that is down costs the
  // essays and the posts rather than the whole sitemap.
  const [posts, essays] = await Promise.all([listPosts(), listEssays()]);

  return [
    ...STATIC.map((s) => ({
      url: `${SITE}${s.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: s.priority,
    })),
    ...essays.map((e) => ({
      url: `${SITE}/photo/${e.slug}`,
      lastModified: on(e.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${SITE}/writing/${p.slug}`,
      lastModified: on(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
