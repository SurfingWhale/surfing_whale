// app/lib/accessRequests.ts
// Records the email a visitor leaves to unlock the CV or a project detail.
// Stored in its own Notion database, deliberately separate from guest notes —
// these addresses are never displayed anywhere, and keeping them apart means
// no moderation slip can surface one.
//
// Expected database properties:
//   Email     — title
//   Requested — select (CV | Project)

const NOTION_VERSION = "2022-06-28";

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

export async function recordAccess(
  email: string,
  reason: AccessReason
): Promise<boolean> {
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId() },
      properties: {
        Email: { title: [{ text: { content: email.trim() } }] },
        Requested: { select: { name: reason } },
      },
    }),
  });

  if (!res.ok) {
    console.error("Notion access request error:", await res.text());
    return false;
  }
  return true;
}
