// app/lib/db.ts
// Essays and posts live in Supabase Postgres (supabase/surfing-whale.sql),
// read and written with the server's service-role client. They used to live
// in Notion as a JSON code block per page; a table with a jsonb column is the
// same idea without the 2000-character chunking or the delete-then-append
// dance on every save.
import { supabaseAdmin, supabaseConfigured } from "./supabase";

export const dbConfigured = supabaseConfigured;

export type Table = "surfingwhale_essays" | "surfingwhale_posts";

export const table = (name: Table) => supabaseAdmin().from(name);

/**
 * The one failure worth spelling out: the tables were never made. Everything
 * else is a plain error. The message is the fix, because the person reading
 * it in the studio is the person who can run it.
 */
export class SetupError extends Error {
  constructor() {
    super(
      "The database tables are not set up yet. Run supabase/surfing-whale.sql once in Supabase → SQL Editor."
    );
  }
}

type PgError = { code?: string; message: string } | null;

export function unwrap<T>(res: { data: T; error: PgError }, what: string): T {
  if (!res.error) return res.data;
  const { code = "", message } = res.error;
  // 42P01: no such table. PGRST205: not in PostgREST's schema cache, which is
  // how a missing table usually arrives through supabase-js.
  if (code === "42P01" || code === "PGRST205" || /does not exist|schema cache/i.test(message)) {
    throw new SetupError();
  }
  throw new Error(`${what}: ${message}`);
}

/** Ids are uuids now; anything else (an old Notion id, a typo) matches nothing. */
export const isUuid = (s: unknown): s is string =>
  typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Slugs are used in URLs; keep them boring. */
export function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64)
    .replace(/-$/, "");
}

export const today = () => new Date().toISOString().slice(0, 10);

/**
 * The address a published piece already has, or null. Once something is
 * published its URL may have been shared, so retitling it keeps the address;
 * a draft has no readers yet, so its address can follow its title.
 */
export async function publishedSlug(name: Table, id: string | undefined): Promise<string | null> {
  if (!id || !isUuid(id) || !dbConfigured()) return null;
  const row = unwrap(
    await table(name).select("slug, published").eq("id", id).maybeSingle(),
    "Read address"
  ) as { slug: string; published: boolean } | null;
  return row?.published ? row.slug : null;
}
