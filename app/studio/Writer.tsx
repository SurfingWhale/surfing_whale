// app/studio/Writer.tsx
// One block per line of thought, the way Notion does it: type `## ` and the
// block becomes a heading, `> ` a quote, `- ` a bullet. Enter splits at the
// caret, Backspace at the start of a block joins it to the one above.
//
// No toolbar. The shortcuts do the work, and a select in the gutter is there
// for anything they miss — a real <select>, so it is keyboard-reachable and
// announces itself without any ARIA of its own.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Block, BlockKind, PostMeta } from "@/app/lib/writing";
import { downscale } from "@/app/darkroom/downscale";

const link =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200 disabled:text-fg-muted disabled:no-underline disabled:cursor-not-allowed";
const field =
  "w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-2 text-[13px] leading-[2] text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg transition-colors duration-200";

const KIND_LABEL: Record<BlockKind, string> = {
  paragraph: "Text",
  heading: "Heading",
  subheading: "Subheading",
  quote: "Quote",
  bullet: "Bulleted",
  number: "Numbered",
  code: "Code",
  divider: "Divider",
  image: "Image",
};

// What a block looks like while it is being written — close enough to the
// published page that there is no surprise, without pretending to be it.
const KIND_CLASS: Record<BlockKind, string> = {
  paragraph: "text-[13px] leading-[2] text-fg",
  heading: "text-[15px] leading-[1.6] font-medium tracking-[-0.02em] text-fg",
  subheading: "text-[13px] leading-[1.8] font-medium text-fg",
  quote: "text-[13px] leading-[2] text-fg-body italic border-l-2 border-border-strong pl-4",
  bullet: "text-[13px] leading-[2] text-fg pl-5",
  number: "text-[13px] leading-[2] text-fg pl-5",
  code: "font-mono text-[11px] leading-[1.8] text-fg bg-bg-subtle rounded-md p-3",
  divider: "",
  image: "",
};

/** Leading markers, checked longest-first so `### ` never matches `## `. */
const SHORTCUTS: [string, BlockKind][] = [
  ["### ", "subheading"],
  ["## ", "heading"],
  ["> ", "quote"],
  ["- ", "bullet"],
  ["* ", "bullet"],
  ["1. ", "number"],
  ["```", "code"],
];

export function Writer() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [id, setId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [standfirst, setStandfirst] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([{ kind: "paragraph", text: "" }]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyImage, setBusyImage] = useState(false);

  const areas = useRef<(HTMLTextAreaElement | null)[]>([]);
  const wanted = useRef<{ index: number; caret: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    fetch("/api/studio/post")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {});
  }, []);
  useEffect(refresh, [refresh]);

  // Focus moves after the DOM has the new block, not before it.
  useEffect(() => {
    const want = wanted.current;
    if (!want) return;
    wanted.current = null;
    const el = areas.current[want.index];
    if (!el) return;
    el.focus();
    el.setSelectionRange(want.caret, want.caret);
  }, [blocks]);

  const grow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => {
    areas.current.forEach(grow);
  }, [blocks]);

  const blank = () => {
    setId(undefined); setTitle(""); setStandfirst("");
    setDate(new Date().toISOString().slice(0, 10));
    setPublished(false);
    setBlocks([{ kind: "paragraph", text: "" }]);
    setStatus(null);
  };

  const open = async (slug: string) => {
    const res = await fetch(`/api/studio/post?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return setStatus("Unable to open that one.");
    const { post } = await res.json();
    setId(post.id); setTitle(post.title); setStandfirst(post.standfirst);
    setDate(post.date || new Date().toISOString().slice(0, 10));
    setPublished(post.published);
    setBlocks(post.blocks?.length ? post.blocks : [{ kind: "paragraph", text: "" }]);
    setStatus(null);
  };

  const edit = (fn: (b: Block[]) => Block[]) => setBlocks((b) => fn([...b]));

  const onChange = (i: number, value: string) => {
    for (const [marker, kind] of SHORTCUTS) {
      if (value.startsWith(marker)) {
        wanted.current = { index: i, caret: 0 };
        return edit((b) => {
          b[i] = { kind, text: value.slice(marker.length) };
          return b;
        });
      }
    }
    if (value.trim() === "---") {
      wanted.current = { index: i + 1, caret: 0 };
      return edit((b) => {
        b.splice(i, 1, { kind: "divider", text: "" }, { kind: "paragraph", text: "" });
        return b;
      });
    }
    edit((b) => {
      b[i] = { ...b[i], text: value };
      return b;
    });
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;

    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const caret = el.selectionStart;
      const before = el.value.slice(0, caret);
      const after = el.value.slice(caret);
      // A list carries on as a list; everything else drops back to prose.
      const next: BlockKind =
        blocks[i].kind === "bullet" || blocks[i].kind === "number"
          ? blocks[i].kind
          : "paragraph";
      wanted.current = { index: i + 1, caret: 0 };
      return edit((b) => {
        b[i] = { ...b[i], text: before };
        b.splice(i + 1, 0, { kind: next, text: after });
        return b;
      });
    }

    if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
      if (i === 0) {
        // Not a merge — just take a styled block back to plain text.
        if (blocks[0].kind !== "paragraph") {
          e.preventDefault();
          return edit((b) => {
            b[0] = { ...b[0], kind: "paragraph" };
            return b;
          });
        }
        return;
      }
      const prev = blocks[i - 1];
      if (prev.kind === "image" || prev.kind === "divider") {
        e.preventDefault();
        wanted.current = { index: i - 1, caret: 0 };
        return edit((b) => {
          b.splice(i - 1, 1);
          return b;
        });
      }
      e.preventDefault();
      wanted.current = { index: i - 1, caret: prev.text.length };
      return edit((b) => {
        b[i - 1] = { ...prev, text: prev.text + b[i].text };
        b.splice(i, 1);
        return b;
      });
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  };

  const setKind = (i: number, kind: BlockKind) =>
    edit((b) => {
      b[i] = { ...b[i], kind };
      return b;
    });

  const removeBlock = (i: number) =>
    edit((b) => (b.length === 1 ? [{ kind: "paragraph", text: "" }] : b.filter((_, k) => k !== i)));

  const addImage = async (files: FileList) => {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setBusyImage(true);
    setStatus(null);
    try {
      const small = await downscale(file);
      const body = new FormData();
      body.append("file", small.file);
      const res = await fetch("/api/darkroom/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      edit((b) => [
        ...b,
        { kind: "image", text: "", url: data.url, width: data.width, height: data.height },
        { kind: "paragraph", text: "" },
      ]);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to add that image.");
    }
    setBusyImage(false);
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/studio/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, standfirst, date, published, blocks }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) {
      setId(data.id);
      setStatus(published ? `Published at /writing/${data.slug}` : "Saved as a draft.");
      refresh();
    } else {
      setStatus(data?.error ?? "Unable to save.");
    }
    setSaving(false);
  };

  const words = blocks.reduce(
    (n, b) =>
      n + (b.kind === "image" || b.kind === "divider"
        ? 0
        : b.text.trim().split(/\s+/).filter(Boolean).length),
    0
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] pb-6 border-b border-border">
        <button onClick={blank} className={link}>New post</button>
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => open(post.slug)}
            className={`text-fg-body hover:text-fg transition-colors duration-300 ${
              post.id === id ? "text-fg underline decoration-border-strong underline-offset-[3px]" : ""
            }`}
          >
            {post.title}
            {!post.published && <span className="text-fg-muted"> · draft</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 py-8 border-b border-border">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title" aria-label="Title" className={`${field} sm:col-span-2 text-[15px] font-medium tracking-[-0.02em]`} />
        <input value={standfirst} onChange={(e) => setStandfirst(e.target.value)}
          placeholder="One line underneath" aria-label="Standfirst" className={`${field} sm:col-span-2`} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          aria-label="Date" className={field} />
        <label className="flex items-center gap-2.5 text-[13px] text-fg-body">
          <input type="checkbox" checked={published}
            onChange={(e) => setPublished(e.target.checked)} className="accent-fg" />
          Published
        </label>
      </div>

      <div className="py-8 space-y-1">
        {blocks.map((block, i) => (
          <div key={i} className="group grid grid-cols-[86px_1fr] gap-3 items-start">
            <div className="flex items-center gap-1 pt-1.5 opacity-0 focus-within:opacity-100 group-hover:opacity-100 transition-opacity duration-200">
              <label className="sr-only" htmlFor={`kind-${i}`}>Block type</label>
              <select
                id={`kind-${i}`}
                value={block.kind}
                onChange={(e) => setKind(i, e.target.value as BlockKind)}
                className="bg-transparent text-[11px] text-fg-muted border border-border rounded-md px-1 py-0.5 focus:outline-none"
              >
                {(Object.keys(KIND_LABEL) as BlockKind[])
                  .filter((k) => k !== "image" || block.kind === "image")
                  .map((k) => (
                    <option key={k} value={k}>{KIND_LABEL[k]}</option>
                  ))}
              </select>
              <button
                onClick={() => removeBlock(i)}
                aria-label={`Remove block ${i + 1}`}
                className="grid place-items-center w-6 h-6 text-fg-muted hover:text-fg transition-colors duration-200"
              >
                <svg viewBox="0 0 14 14" className="w-3 h-3 stroke-current stroke-[1.5] [stroke-linecap:round]" fill="none" aria-hidden="true">
                  <path d="M3 3l8 8M11 3l-8 8" />
                </svg>
              </button>
            </div>

            {block.kind === "divider" ? (
              <hr className="border-0 border-t border-border my-4" />
            ) : block.kind === "image" ? (
              <figure className="m-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.url} alt="" width={block.width} height={block.height}
                  className="w-full h-auto block max-h-[360px] object-contain object-left rounded-md border border-border bg-bg-muted" />
                <input
                  value={block.text}
                  onChange={(e) => onChange(i, e.target.value)}
                  placeholder="Describe it, for anyone who cannot see it"
                  aria-label={`Alt text for image ${i + 1}`}
                  className={`${field} text-[11px] leading-[1.7] mt-1`}
                />
              </figure>
            ) : (
              <div className="relative">
                {block.kind === "bullet" && (
                  <span aria-hidden="true" className="absolute left-1 top-0 text-[13px] leading-[2] text-fg-muted">•</span>
                )}
                {block.kind === "number" && (
                  <span aria-hidden="true" className="absolute left-0 top-0 text-[13px] leading-[2] text-fg-muted tabular-nums">
                    {blocks.slice(0, i + 1).filter((b) => b.kind === "number").length}.
                  </span>
                )}
                <textarea
                  ref={(el) => { areas.current[i] = el; }}
                  rows={1}
                  value={block.text}
                  onChange={(e) => { onChange(i, e.target.value); grow(e.currentTarget); }}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  placeholder={i === 0 ? "Write. ## for a heading, > for a quote, - for a list." : ""}
                  aria-label={`${KIND_LABEL[block.kind]} block ${i + 1}`}
                  className={`w-full bg-transparent border-0 rounded-none px-0 py-0 resize-none overflow-hidden focus:outline-none placeholder:text-fg-muted ${KIND_CLASS[block.kind]}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-6 border-t border-border text-[13px]">
        <button onClick={save} disabled={saving} className={link}>
          {saving ? "Saving…" : "Save →"}
        </button>
        <button onClick={() => fileInput.current?.click()} disabled={busyImage} className={link}>
          {busyImage ? "Adding…" : "Add a photo"}
        </button>
        <input ref={fileInput} type="file" accept="image/*" hidden
          onChange={(e) => { if (e.target.files) addImage(e.target.files); e.target.value = ""; }} />
        <span className="text-[11px] text-fg-muted">
          {words} word{words === 1 ? "" : "s"}
        </span>
        {status && <span role="status" className="text-fg-body">{status}</span>}
      </div>
    </>
  );
}
