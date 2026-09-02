// app/lib/mail.ts
// Outbound email through Resend, over fetch rather than the SDK — one POST
// does not justify a dependency, and this keeps the failure surface visible.
//
// Every call is best-effort and returns a reason rather than throwing. Nothing
// on this site should break because a mail provider is down or unconfigured:
// approving someone still works, the link is still generated, and the studio
// shows it so it can be sent by hand.

export interface MailResult {
  sent: boolean;
  /** Why it did not send, for the studio to show. Never shown to a visitor. */
  reason?: string;
}

export const mailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<MailResult> {
  if (!mailConfigured()) {
    return { sent: false, reason: "RESEND_API_KEY or MAIL_FROM is not set" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      // Resend's own message is the useful part — a sender on an unverified
      // domain fails here, and the studio should say so in those words.
      const body = await res.text();
      return { sent: false, reason: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/** The one message this site sends. Plain text: it is a link, not a newsletter. */
export function approvalEmail(name: string, url: string) {
  const who = name.trim() ? `Hi ${name.trim()},` : "Hi,";
  return {
    subject: "Your reading access to Surfing Whale",
    text: `${who}

You asked to read the full case studies on Surfing Whale. You're in — open this link and it stays open on that browser:

${url}

The link is yours; please don't pass it on.

— Muhammad Fauzy
surfing-whale.vercel.app`,
  };
}
