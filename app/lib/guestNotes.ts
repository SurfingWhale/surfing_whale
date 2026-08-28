// app/lib/guestNotes.ts
// Guest notes are stored in a Notion database — no new service, and entries
// can be moderated straight from the Notion app.
//
// Expected database properties:
//   Name     — title
//   Message  — rich_text
//   Email    — email      (optional, PRIVATE — never leaves the server)
//   Approved — checkbox   (notes stay hidden until this is ticked)

const NOTION_VERSION = "2022-06-28";

export interface GuestNote {
  id: string;
  name: string;
  message: string;
  date: string;
}

export interface NewGuestNote {
  name: string;
  message: string;
  email?: string;
}

export const LIMITS = {
  name: 50,
  message: 500,
  email: 254,
} as const;

function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

function databaseId() {
  const id = process.env.NOTION_GUESTBOOK_DATABASE_ID;
  if (!id) throw new Error("NOTION_GUESTBOOK_DATABASE_ID is not set");
  return id;
}

/**
 * Approved notes, newest first.
 *
 * Deliberately maps only name/message/date — the Email property is never
 * included in the returned shape, so it cannot leak through the public route.
 */
export async function getApprovedNotes(): Promise<GuestNote[]> {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${databaseId()}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        filter: { property: "Approved", checkbox: { equals: true } },
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: 50,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.error("Notion guest notes read error:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.results.map((page: any) => ({
    id: page.id,
    name: page.properties.Name?.title?.[0]?.plain_text ?? "Anonymous",
    message: page.properties.Message?.rich_text?.[0]?.plain_text ?? "",
    date: page.created_time ?? "",
  }));
}

/** Returns an error string when invalid, or null when the note is acceptable. */
export function validateNote(note: NewGuestNote): string | null {
  const name = note.name?.trim() ?? "";
  const message = note.message?.trim() ?? "";
  const email = note.email?.trim() ?? "";

  if (name.length === 0) return "Name is required.";
  if (name.length > LIMITS.name) return `Name must be ${LIMITS.name} characters or fewer.`;
  if (message.length === 0) return "Message is required.";
  if (message.length > LIMITS.message) return `Message must be ${LIMITS.message} characters or fewer.`;
  if (email) {
    if (email.length > LIMITS.email) return "Email is too long.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That email does not look valid.";
  }
  return null;
}

/** Creates the note unapproved — it only becomes public once ticked in Notion. */
export async function addNote(note: NewGuestNote): Promise<boolean> {
  const email = note.email?.trim();

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: databaseId() },
      properties: {
        Name: { title: [{ text: { content: note.name.trim() } }] },
        Message: { rich_text: [{ text: { content: note.message.trim() } }] },
        ...(email ? { Email: { email } } : {}),
        Approved: { checkbox: false },
      },
    }),
  });

  if (!res.ok) {
    console.error("Notion guest notes write error:", await res.text());
    return false;
  }
  return true;
}

// ── Moderation ────────────────────────────────────────────────────────────
// Everything below is for the studio and requires a session at the route.
// The email address is included here and nowhere else; getApprovedNotes above
// deliberately does not map it, so the public route cannot leak it even by
// accident.

export interface ModeratedNote extends GuestNote {
  email: string;
  approved: boolean;
}

/** Every note, approved or not, newest first. */
export async function listAllNotes(): Promise<ModeratedNote[]> {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${databaseId()}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: 100,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.error("Notion guest notes moderation read error:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.results.map((page: any) => ({
    id: page.id,
    name: page.properties.Name?.title?.[0]?.plain_text ?? "Anonymous",
    message: page.properties.Message?.rich_text?.[0]?.plain_text ?? "",
    date: page.created_time ?? "",
    email: page.properties.Email?.email ?? "",
    approved: Boolean(page.properties.Approved?.checkbox),
  }));
}

/** Ticks or unticks the checkbox the public read filters on. */
export async function setApproved(id: string, approved: boolean): Promise<void> {
  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({ properties: { Approved: { checkbox: approved } } }),
  });
  if (!res.ok) throw new Error(await res.text());
}

/** Notion has no hard delete over the API; archiving is what its UI does too. */
export async function archiveNote(id: string): Promise<void> {
  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) throw new Error(await res.text());
}
