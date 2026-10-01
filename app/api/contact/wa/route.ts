// app/api/contact/wa/route.ts
//
// The WhatsApp number, handed out only to an approved reader.
//
// It used to be a const in a "use client" component, which means it was in
// the JavaScript bundle shipped to every visitor and to every scraper that
// ever fetched the page. Behind this route it exists only on the server, and
// only a request carrying a valid reader cookie gets an answer.
//
// The number itself moves to an environment variable. Hardcoding it also put
// it in the repository, which is public — see the note in the commit.
import { NextRequest, NextResponse } from "next/server";
import { isReader } from "@/app/lib/accessSession";

const MAX_TEXT = 600;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isReader())) {
    // 403 rather than 404: the reader is being told the door exists and that
    // they are not through it yet, which is what the gate in front of it says.
    return NextResponse.json({ error: "Not approved yet." }, { status: 403 });
  }

  const number = process.env.WHATSAPP_NUMBER;
  if (!number) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.slice(0, 80) : "";
  const message =
    typeof body?.message === "string" ? body.message.slice(0, MAX_TEXT) : "";

  const text = encodeURIComponent(
    `Halo, nama saya ${name}.\n\n${message}`.trim()
  );
  const res = NextResponse.json({ url: `https://wa.me/${number}?text=${text}` });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
