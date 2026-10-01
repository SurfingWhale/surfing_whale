// app/lib/supabase.ts
// The one Supabase client this site has: server-only, holding the
// service-role key. It writes photographs to Storage (storage.ts) and essays
// and posts to Postgres (db.ts).
//
// supabase-js builds a realtime client inside createClient and needs a native
// WebSocket to do it, which Node has from 22. Vercel runs this on 24.x
// (package.json engines); on an older local Node the client throws.
//
// The browser never gets a Supabase key. Everything it may do goes through a
// route that checks the studio session first, so the rule for who may write
// lives in one place (darkroomSession.ts) and not also in RLS policies.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseUrl(): string {
  return (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
}

export const supabaseConfigured = () =>
  Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);

let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!supabaseConfigured()) throw new Error("Supabase is not configured.");
  client ??= createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
