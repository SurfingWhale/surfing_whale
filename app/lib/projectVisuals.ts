// app/lib/projectVisuals.ts
//
// A project's picture, when the picture lives here rather than in Notion.
//
// The Image property only accepts an allowlisted host, and that allowlist is
// what stops an <img src> from pointing at a server nobody vetted. Some work
// has no such URL — it exists as a screenshot of something running on a
// phone — and the wrong fix would be to widen the allowlist for one file.
// So the file is committed to public/ and matched by slug. A path with no
// host is ours by definition, and the rule stays as narrow as it was.
//
// Notion still wins. If he sets an Image on the row, that is a decision he
// made and it takes precedence over anything named here; this is the fallback
// for rows where he has not.
export interface ProjectVisual {
  /** Path under public/. */
  image: string;
  alt: string;
  caption: string;
}

export const PROJECT_VISUALS: Record<string, ProjectVisual> = {
  salespal: {
    image: "/work/salespal/lead-tracker.jpg",
    alt: "Three phone screens from SalesPAL side by side: a pipeline dashboard, a lead database listing companies and contacts, and an outreach tracker counting sent, replied, seen and rejected.",
    caption:
      "The three screens the whole thing is built around — the pipeline, the leads, and what happened after you contacted them. Seeded with example companies, not real ones.",
  },
};

export const visualFor = (slug: string): ProjectVisual | undefined =>
  PROJECT_VISUALS[slug];
