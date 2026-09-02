// app/lib/accessRequests.ts
// Records the email a visitor leaves to unlock the CV or a project detail.
// Stored in its own Notion database, deliberately separate from guest notes —
// these addresses are never displayed anywhere, and keeping them apart means
// no moderation slip can surface one.
//
// Expected database properties:
//   Email       — title
//   Name        — text
//   Message     — text      (why they are asking; the basis for approving)
//   Requested   — select    (CV | Project)
//   Token       — text      (issued at request time, only useful once approved)
//   Approved    — checkbox
//   Approved At — date

import { randomBytes } from "crypto";

const NOTION_VERSION = "2022-06-28";
const NOTION = "https://api.notion.com/v1";

const HEADERS = () => ({
  Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
});

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  message: string;
  reason: AccessReason;
  token: string;
  approved: boolean;
  date: string;
}

export const NAME_MAX = 80;
export const MESSAGE_MAX = 500;

export type AccessReason = "CV" | "Project";

export const EMAIL_MAX = 254;

function databaseId() {
  const id = process.env.NOTION_ACCESS_DATABASE_ID;
  if (!id) throw new Error("NOTION_ACCESS_DATABASE_ID is not set");
  return id;
}

export function isValidEmail(email: string): boolean {
  return (
    email.length > 0 &&
    email.length <= EMAIL_MAX &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

const text = (p: { rich_text?: { plain_text: string }[] } | undefined) =>
  (p?.rich_text ?? []).map((t) => t.plain_text).join("");

/**
 * Records a request and returns the token minted for it. The token exists from
 * the start but is worthless until Approved is ticked — issuing it here means
 * approving is a single property write with nothing to generate or race.
 */
export async function recordAccess(
  email: string,
  reason: AccessReason,
  { name = "", message = "" } = {}
): Promise<string | null> {
  const token = randomBytes(24).toString("base64url");
  const res = await fetch(`${NOTION}/pages`, {
    method: "POST",
    headers: HEADERS(),
    body: JSON.stringify({
      parent: { database_id: databaseId() },
      properties: {
        Email: { title: [{ text: { content: email.trim() } }] },
        Name: { rich_text: [{ text: { content: name.slice(0, NAME_MAX) } }] },
        Message: { rich_text: [{ text: { content: message.slice(0, MESSAGE_MAX) } }] },
        Requested: { select: { name: reason } },
        Token: { rich_text: [{ text: { content: token } }] },
        Approved: { checkbox: false },
      },
    }),
  });

  if (!res.ok) {
    console.error("Notion access request error:", await res.text());
    return null;
  }
  return token;
}

/** Every request, newest first. Behind the studio session — carries emails. */
export async function listRequests(): Promise<AccessRequest[]> {
  const res = await fetch(`${NOTION}/databases/${databaseId()}/query`, {
    method: "POST",
    headers: HEADERS(),
    cache: "no-store",
    body: JSON.stringify({
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 100,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((page: any): AccessRequest => {
    const p = page.properties ?? {};
    return {
      id: page.id,
      email: (p.Email?.title ?? []).map((t: any) => t.plain_text).join(""),
      name: text(p.Name),
      message: text(p.Message),
      reason: p.Requested?.select?.name === "Project" ? "Project" : "CV",
      token: text(p.Token),
      approved: Boolean(p.Approved?.checkbox),
      date: page.created_time ?? "",
    };
  });
}

/**
 * The token a row already carries, minting one if it has none. Rows written
 * before the Token column existed have nothing to unlock with, and approving
 * one of those should still produce a working link rather than a dead /unlock/.
 */
export async function ensureToken(id: string): Promise<string | null> {
  const res = await fetch(`${NOTION}/pages/${id}`, {
    headers: HEADERS(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const page = await res.json();
  const existing = text(page.properties?.Token);
  if (existing.length >= 16) return existing;

  const token = randomBytes(24).toString("base64url");
  const write = await fetch(`${NOTION}/pages/${id}`, {
    method: "PATCH",
    headers: HEADERS(),
    body: JSON.stringify({
      properties: { Token: { rich_text: [{ text: { content: token } }] } },
    }),
  });
  return write.ok ? token : null;
}

export async function setApproved(id: string, approved: boolean): Promise<boolean> {
  const res = await fetch(`${NOTION}/pages/${id}`, {
    method: "PATCH",
    headers: HEADERS(),
    body: JSON.stringify({
      properties: {
        Approved: { checkbox: approved },
        "Approved At": approved
          ? { date: { start: new Date().toISOString() } }
          : { date: null },
      },
    }),
  });
  if (!res.ok) console.error("Notion approve error:", await res.text());
  return res.ok;
}

/**
 * Looks a token up. Notion has no index on a text property, so this filters
 * server-side — fine at this volume, and it keeps the token out of any URL
 * Notion logs. Returns null for an unknown or unapproved token alike: a
 * visitor holding a pending token learns nothing from the difference.
 */
export async function findApprovedToken(token: string): Promise<AccessRequest | null> {
  if (!token || token.length < 16) return null;
  const res = await fetch(`${NOTION}/databases/${databaseId()}/query`, {
    method: "POST",
    headers: HEADERS(),
    cache: "no-store",
    body: JSON.stringify({
      filter: {
        and: [
          { property: "Token", rich_text: { equals: token } },
          { property: "Approved", checkbox: { equals: true } },
        ],
      },
      page_size: 1,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const page = (data.results ?? [])[0];
  if (!page) return null;
  const p = page.properties ?? {};
  return {
    id: page.id,
    email: (p.Email?.title ?? []).map((t: any) => t.plain_text).join(""),
    name: text(p.Name),
    message: text(p.Message),
    reason: p.Requested?.select?.name === "Project" ? "Project" : "CV",
    token,
    approved: true,
    date: page.created_time ?? "",
  };
}
