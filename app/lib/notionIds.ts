// app/lib/notionIds.ts
// Which Notion databases the site reads.
//
// These are identifiers, not secrets. A database id grants nothing on its own
// — every request still has to carry NOTION_API_KEY, and that stays in the
// environment where it belongs. Keeping the ids here means the only things
// Fauzy has to set by hand are the two values that are genuinely secret.
//
// The environment still wins when it is set, so pointing the site at a
// different database stays a one-variable change and needs no deploy of this
// file. It also survives the case that caused this: a Notion merge moved every
// row to a new database and the old id kept resolving, to nothing, which looks
// exactly like a code fault and is not one.

const pick = (fromEnv: string | undefined, fallback: string) => {
  const v = (fromEnv ?? "").trim();
  return v || fallback;
};

/** Portfolio projects — DA&WEB_Projects, after the September 2026 merge. */
export const PROJECTS_DB_DEFAULT = "32d537d3e1fb8059b32bfb3e6f200479";

export const PROJECTS_DB = () =>
  pick(process.env.NOTION_DATABASE_ID, PROJECTS_DB_DEFAULT);

// Writing and the darkroom moved to Supabase (app/lib/db.ts) in October 2026.
