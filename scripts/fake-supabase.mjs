// Run: PORT=4999 [FAKE_PGRST_FAIL=1] node scripts/fake-supabase.mjs
//
// A Supabase stand-in: Storage list/remove and a PostgREST select, enough to
// drive the real library routes without a project, a key, or a network.
//
// It exists because the studio answered a failed delete with "Could not delete
// it." and nothing else. Finding out what that actually meant needed the real
// route handler running against a storage layer whose behaviour could be
// chosen — including the failure. Reading the code had not found it.
//
// The default state is the one the studio was in: the SAME eight uploads
// sitting in both `library/` and `darkroom/`, which is what the merge of the
// archive and the darkroom left behind.
//
// FAKE_PGRST_FAIL=1 makes the essays/posts table answer PGRST205, the "not in
// the schema cache" error a missing table arrives as.
import { createServer } from "node:http";

const FILES = ["camera", "stairway", "mountain", "teddy", "sunset", "boatblue", "bwboat", "manboat"]
  .map((n, i) => ({
    name: `2026-09-${String(i + 1).padStart(2, "0")}-${n}-aabbccdd-1200x800.webp`,
    created_at: `2026-09-0${i + 1}T00:00:00Z`,
  }));
const STORE = { library: [...FILES], darkroom: [...FILES], archive: [] };

// The photographs table, in memory, so the publish path can be driven end to
// end: upsert a row, then read the published ones back the way the home page
// does.
const PHOTOS = new Map();

createServer(async (req, res) => {
  let body = "";
  for await (const c of req) body += c;
  console.log(`${req.method} ${req.url} ${body.slice(0, 300)}`);
  const send = (code, obj) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  if (req.method === "POST" && req.url.startsWith("/storage/v1/object/list/"))
    return send(200, STORE[JSON.parse(body || "{}").prefix ?? ""] ?? []);

  // Supabase's remove() does not fail on a path that is not there, and neither
  // does this — deletePhoto() names every library folder and relies on it.
  if (req.method === "DELETE" && req.url.startsWith("/storage/v1/object/"))
    return send(200, (JSON.parse(body || "{}").prefixes ?? []).map((p) => ({ name: p })));

  if (req.url.startsWith("/rest/v1/surfingwhale_photos")) {
    if (process.env.FAKE_PGRST_FAIL)
      return send(404, { code: "PGRST205", message: "Could not find the table in the schema cache" });
    if (req.method === "POST") {
      for (const row of [].concat(JSON.parse(body || "[]"))) PHOTOS.set(row.public_id, row);
      return send(201, []);
    }
    if (req.method === "DELETE") return send(200, []);
    // GET: published=true for the gallery, public_id=in.(...) for the studio.
    const rows = [...PHOTOS.values()];
    return send(200, req.url.includes("published=eq.true") ? rows.filter((r) => r.published) : rows);
  }

  if (req.method === "GET" && req.url.startsWith("/rest/v1/"))
    return process.env.FAKE_PGRST_FAIL
      ? send(404, { code: "PGRST205", message: "Could not find the table in the schema cache" })
      : send(200, []);

  send(200, {});
}).listen(Number(process.env.PORT || 4999), () =>
  console.log(`fake supabase on ${process.env.PORT || 4999}`)
);
