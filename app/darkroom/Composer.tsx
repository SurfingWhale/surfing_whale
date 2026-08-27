// app/darkroom/Composer.tsx
// Write, drop photographs in, decide which of them share a row. The order you
// see is the order the essay publishes in — there is no separate preview mode
// to drift out of sync with.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Block, EssayMeta, Shot } from "@/app/lib/darkroom";
import { downscale } from "./downscale";

const MAX_PER_ROW = 3;

const link =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200 disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed";
const field =
  "w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-2 text-[13px] leading-[2] text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg transition-colors duration-200";
const chip =
  "text-[11px] leading-[1.6] px-2 py-1 rounded-md border border-border text-fg-body hover:text-fg hover:border-border-strong disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200";

interface Pending {
  name: string;
  state: "resizing" | "uploading" | "failed";
  error?: string;
}

export function Composer() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [notion, setNotion] = useState(true);

  useEffect(() => {
    fetch("/api/darkroom/session")
      .then((r) => r.json())
      .then((d) => {
        setUnlocked(Boolean(d.unlocked));
        setReady(Boolean(d.configured));
        setNotion(Boolean(d.notion));
      })
      .catch(() => setUnlocked(false));
  }, []);

  if (unlocked === null) {
    return <Shell><p className="text-fg-muted">Checking…</p></Shell>;
  }
  if (!unlocked) {
    return <Shell><Lock configured={ready} notion={notion} onIn={() => setUnlocked(true)} /></Shell>;
  }
  return <Shell wide><Editor /></Shell>;
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className={`container mx-auto px-6 py-16 ${wide ? "max-w-[900px]" : "max-w-[420px]"}`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label mb-8">
          Darkroom
        </p>
        {children}
      </div>
    </main>
  );
}

export function Lock({ configured, notion, onIn }: { configured: boolean; notion: boolean; onIn: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/darkroom/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (res?.ok) return onIn();
    setError((await res?.json().catch(() => null))?.error ?? "Could not reach the server.");
    setBusy(false);
  };

  return (
    <>
      <input
        type="password"
        value={password}
        autoFocus
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && password) submit(); }}
        placeholder="Password"
        aria-label="Darkroom password"
        className={field}
      />
      <button onClick={submit} disabled={!password || busy} className={`${link} text-[13px] mt-5`}>
        {busy ? "Opening…" : "Open →"}
      </button>
      {error && <p className="text-[13px] leading-[2] text-fg mt-4">{error}</p>}
      {!configured && (
        <p className="text-[11px] leading-[1.7] text-fg-muted mt-6">
          DARKROOM_PASSWORD and DARKROOM_SECRET are not both set on this
          deployment, so nothing will unlock.
        </p>
      )}
      {configured && !notion && (
        <p className="text-[11px] leading-[1.7] text-fg-muted mt-6">
          NOTION_DARKROOM_DATABASE_ID is not set, so essays would upload but
          have nowhere to save.
        </p>
      )}
    </>
  );
}

export function Editor() {
  const [essays, setEssays] = useState<EssayMeta[]>([]);
  const [id, setId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    fetch("/api/darkroom/essay")
      .then((r) => r.json())
      .then((d) => setEssays(d.essays ?? []))
      .catch(() => {});
  }, []);
  useEffect(refresh, [refresh]);

  const blank = () => {
    setId(undefined); setTitle(""); setSubtitle("");
    setDate(new Date().toISOString().slice(0, 10));
    setPublished(false); setBlocks([]); setStatus(null);
  };

  const open = async (slug: string) => {
    const res = await fetch(`/api/darkroom/essay?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return setStatus("Could not open that one.");
    const { essay } = await res.json();
    setId(essay.id); setTitle(essay.title); setSubtitle(essay.subtitle);
    setDate(essay.date || new Date().toISOString().slice(0, 10));
    setPublished(essay.published); setBlocks(essay.blocks ?? []);
    setStatus(null);
  };

  // ── taking photographs in ────────────────────────────────────────────────
  const ingest = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setPending(list.map((f) => ({ name: f.name, state: "resizing" })));

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const mark = (state: Pending["state"], error?: string) =>
        setPending((p) => p.map((q, k) => (k === i ? { ...q, state, error } : q)));
      try {
        const small = await downscale(file);
        mark("uploading");
        const body = new FormData();
        body.append("file", small.file);
        const res = await fetch("/api/darkroom/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        const shot: Shot = {
          url: data.url, publicId: data.publicId,
          width: data.width, height: data.height,
          alt: "",
        };
        // Appended as it arrives, so a long batch is visibly making progress.
        setBlocks((b) => [...b, { type: "images", items: [shot] }]);
      } catch (err) {
        mark("failed", err instanceof Error ? err.message : String(err));
      }
    }
    // Leave failures on screen; clear the rest.
    setPending((p) => p.filter((q) => q.state === "failed"));
  };

  // ── arranging ────────────────────────────────────────────────────────────
  const edit = (fn: (b: Block[]) => Block[]) => setBlocks((b) => fn([...b]));

  const moveRow = (i: number, dir: -1 | 1) =>
    edit((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b;
      [b[i], b[j]] = [b[j], b[i]];
      return b;
    });

  const dropRow = (i: number) => edit((b) => b.filter((_, k) => k !== i));

  /** Pull the next row's photographs up into this one, up to three across. */
  const mergeDown = (i: number) =>
    edit((b) => {
      const a = b[i], c = b[i + 1];
      if (!a || !c || a.type !== "images" || c.type !== "images") return b;
      if (a.items.length + c.items.length > MAX_PER_ROW) return b;
      b[i] = { type: "images", items: [...a.items, ...c.items] };
      b.splice(i + 1, 1);
      return b;
    });

  const splitRow = (i: number) =>
    edit((b) => {
      const row = b[i];
      if (!row || row.type !== "images" || row.items.length < 2) return b;
      b.splice(i, 1, ...row.items.map((s) => ({ type: "images" as const, items: [s] })));
      return b;
    });

  const dropShot = (i: number, j: number) =>
    edit((b) => {
      const row = b[i];
      if (!row || row.type !== "images") return b;
      const items = row.items.filter((_, k) => k !== j);
      if (items.length) b[i] = { type: "images", items };
      else b.splice(i, 1);
      return b;
    });

  const nudgeShot = (i: number, j: number, dir: -1 | 1) =>
    edit((b) => {
      const row = b[i];
      if (!row || row.type !== "images") return b;
      const k = j + dir;
      if (k >= 0 && k < row.items.length) {
        const items = [...row.items];
        [items[j], items[k]] = [items[k], items[j]];
        b[i] = { type: "images", items };
        return b;
      }
      // Past the edge of its row, the photograph moves to the neighbouring one.
      const ni = i + dir;
      const neighbour = b[ni];
      if (!neighbour || neighbour.type !== "images") return b;
      if (neighbour.items.length >= MAX_PER_ROW) return b;
      const shot = row.items[j];
      const rest = row.items.filter((_, m) => m !== j);
      b[ni] = {
        type: "images",
        items: dir === -1 ? [...neighbour.items, shot] : [shot, ...neighbour.items],
      };
      if (rest.length) b[i] = { type: "images", items: rest };
      else b.splice(i, 1);
      return b;
    });

  const setAlt = (i: number, j: number, alt: string) =>
    edit((b) => {
      const row = b[i];
      if (!row || row.type !== "images") return b;
      const items = [...row.items];
      items[j] = { ...items[j], alt };
      b[i] = { type: "images", items };
      return b;
    });

  const addText = (at?: number) =>
    edit((b) => {
      const block: Block = { type: "text", value: "" };
      b.splice(at ?? b.length, 0, block);
      return b;
    });

  const setText = (i: number, value: string) =>
    edit((b) => {
      const row = b[i];
      if (row?.type === "text") b[i] = { type: "text", value };
      return b;
    });

  // ── saving ───────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/darkroom/essay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, subtitle, date, published, blocks }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) {
      setId(data.id);
      setStatus(published ? `Published at /photo/${data.slug}` : "Saved as a draft.");
      refresh();
    } else {
      setStatus(data?.error ?? "Could not save.");
    }
    setSaving(false);
  };

  const shots = blocks.reduce(
    (n, b) => n + (b.type === "images" ? b.items.length : 0), 0
  );

  return (
    <>
      {/* ── the essays that already exist ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] pb-6 border-b border-border">
        <button onClick={blank} className={link}>New essay</button>
        {essays.map((e) => (
          <button
            key={e.id}
            onClick={() => open(e.slug)}
            className={`text-fg-body hover:text-fg transition-colors duration-300 ${
              e.id === id ? "text-fg underline decoration-border-strong underline-offset-[3px]" : ""
            }`}
          >
            {e.title}
            {!e.published && <span className="text-fg-muted"> · draft</span>}
          </button>
        ))}
      </div>

      {/* ── what it is called ─────────────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 py-8 border-b border-border">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title" aria-label="Title" className={`${field} sm:col-span-2`} />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
          placeholder="One line underneath" aria-label="Subtitle" className={`${field} sm:col-span-2`} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          aria-label="Date" className={field} />
        <label className="flex items-center gap-2.5 text-[13px] text-fg-body">
          <input type="checkbox" checked={published}
            onChange={(e) => setPublished(e.target.checked)} className="accent-fg" />
          Published
        </label>
      </div>

      {/* ── bringing photographs in ───────────────────────────────────── */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); ingest(e.dataTransfer.files); }}
        className="my-8 border border-dashed border-border-strong rounded-xl px-6 py-10 text-center"
      >
        <p className="text-[13px] leading-[2] text-fg-body">
          Drop photographs here, as many at once as you like.
        </p>
        <button onClick={() => fileInput.current?.click()} className={`${link} text-[13px] mt-1`}>
          Or choose files →
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden
          onChange={(e) => { if (e.target.files) ingest(e.target.files); e.target.value = ""; }} />
        <p className="text-[11px] leading-[1.7] text-fg-muted mt-4">
          Resized to 2000px in the browser before they go up, so a full memory
          card does not have to cross the wire at full size.
        </p>
      </div>

      {pending.length > 0 && (
        <ul className="mb-8 space-y-1.5">
          {pending.map((p, i) => (
            <li key={i} className="text-[11px] leading-[1.7] text-fg-body flex gap-3">
              <span className="truncate max-w-[240px]">{p.name}</span>
              <span className={p.state === "failed" ? "text-fg" : "text-fg-muted"}>
                {p.state === "failed" ? `failed — ${p.error}` : `${p.state}…`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* ── the arrangement ───────────────────────────────────────────── */}
      {blocks.length === 0 ? (
        <p className="text-[13px] leading-[2] text-fg-muted">
          Nothing in here yet.{" "}
          <button onClick={() => addText()} className={link}>Start with some writing →</button>
        </p>
      ) : (
        <ul className="space-y-6">
          {blocks.map((block, i) => (
            <li key={i} className="border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-mono text-[11px] text-fg-muted mr-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button onClick={() => moveRow(i, -1)} disabled={i === 0} className={chip}>↑</button>
                <button onClick={() => moveRow(i, 1)} disabled={i === blocks.length - 1} className={chip}>↓</button>
                {block.type === "images" && (
                  <>
                    <button
                      onClick={() => mergeDown(i)}
                      disabled={
                        blocks[i + 1]?.type !== "images" ||
                        block.items.length +
                          ((blocks[i + 1] as { items: Shot[] })?.items.length ?? 0) > MAX_PER_ROW
                      }
                      className={chip}
                    >
                      Merge with next
                    </button>
                    <button onClick={() => splitRow(i)} disabled={block.items.length < 2} className={chip}>
                      One per row
                    </button>
                  </>
                )}
                <button onClick={() => addText(i + 1)} className={chip}>+ Text below</button>
                <button onClick={() => dropRow(i)} className={`${chip} ml-auto`}>Remove</button>
              </div>

              {block.type === "text" ? (
                <textarea
                  value={block.value}
                  onChange={(e) => setText(i, e.target.value)}
                  rows={4}
                  placeholder="Write…"
                  aria-label={`Text block ${i + 1}`}
                  className={`${field} resize-y`}
                />
              ) : (
                <div className="flex gap-3 items-start">
                  {block.items.map((shot, j) => (
                    // Weighted by aspect ratio exactly as the published row is,
                    // so the arrangement here is the arrangement there.
                    <figure
                      key={shot.url}
                      style={{ flex: `${shot.width / shot.height} 1 0`, minWidth: 0 }}
                      className="m-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot.url} alt="" width={shot.width} height={shot.height}
                        className="w-full h-auto block max-h-[320px] object-contain object-top rounded-md border border-border bg-bg-muted" />
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={() => nudgeShot(i, j, -1)} className={chip}>◀</button>
                        <button onClick={() => nudgeShot(i, j, 1)} className={chip}>▶</button>
                        <button onClick={() => dropShot(i, j)} className={`${chip} ml-auto`}>✕</button>
                      </div>
                      <input
                        value={shot.alt}
                        onChange={(e) => setAlt(i, j, e.target.value)}
                        placeholder="Describe it, for anyone who cannot see it"
                        aria-label="Alt text"
                        className={`${field} text-[11px] leading-[1.7] mt-1`}
                      />
                    </figure>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── out ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-5 mt-10 pt-6 border-t border-border text-[13px]">
        <button onClick={save} disabled={saving || !title} className={link}>
          {saving ? "Saving…" : "Save →"}
        </button>
        <span className="text-[11px] text-fg-muted">
          {shots} photograph{shots === 1 ? "" : "s"} · {blocks.length} row
          {blocks.length === 1 ? "" : "s"}
        </span>
        {status && <span className="text-fg-body">{status}</span>}
      </div>
    </>
  );
}
