// app/studio/Writer.tsx
// One block per line of thought, the way Notion does it: type `## ` and the
// block becomes a heading, `> ` a quote, `- ` a bullet. Enter splits at the
// caret, Backspace at the start of a block joins it to the one above.
//
// No toolbar. The shortcuts do the work, and a select beside each block is
// there for anything they miss — a real <select>, so it is keyboard-reachable
// and announces itself without any ARIA of its own.
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Block, BlockKind, PostMeta } from "@/app/lib/writing";
import { size } from "@/app/darkroom/downscale";
import { sendPhoto } from "@/app/darkroom/sendPhoto";
import { LibraryPicker, type LibraryPhoto } from "./LibraryPicker";
import {
  ActionBar,
  Button,
  Field,
  ItemList,
  Plus,
  RoomHeader,
  TwoPane,
  hintClass,
  inputClass,
  labelClass,
  type Busy,
  type Item,
  type Message,
} from "@/app/studio/ui";

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
// Every size is 16px on a phone first: iOS zooms into any field set smaller.
const KIND_CLASS: Record<BlockKind, string> = {
  paragraph: "text-[16px] sm:text-[13px] leading-[1.8] text-fg",
  heading: "text-[16px] sm:text-[15px] leading-[1.6] font-medium tracking-[-0.02em] text-fg",
  subheading: "text-[16px] sm:text-[13px] leading-[1.8] font-medium text-fg",
  quote: "text-[16px] sm:text-[13px] leading-[1.8] text-fg-body italic border-l-2 border-border-strong pl-4",
  bullet: "text-[16px] sm:text-[13px] leading-[1.8] text-fg pl-5",
  number: "text-[16px] sm:text-[13px] leading-[1.8] text-fg pl-5",
  code: "font-mono text-[16px] sm:text-[11px] leading-[1.8] text-fg bg-bg-subtle rounded-md p-3",
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

const today = () => new Date().toISOString().slice(0, 10);
const emptyBody = (): Block[] => [{ kind: "paragraph", text: "" }];

/** What the form holds, as one comparable string — "unsaved" is a difference. */
const snap = (title: string, standfirst: string, date: string, blocks: Block[]) =>
  JSON.stringify([title, standfirst, date, blocks]);

interface Loaded {
  id?: string;
  slug?: string;
  title: string;
  standfirst: string;
  date: string;
  published: boolean;
  blocks: Block[];
}

export function Writer() {
  const [posts, setPosts] = useState<PostMeta[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [id, setId] = useState<string | undefined>();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [standfirst, setStandfirst] = useState("");
  const [date, setDate] = useState(today);
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>(emptyBody);
  const [savedAs, setSavedAs] = useState(() => snap("", "", today(), emptyBody()));
  const [savedHere, setSavedHere] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [busyImage, setBusyImage] = useState(false);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const areas = useRef<(HTMLTextAreaElement | null)[]>([]);
  const wanted = useRef<{ index: number; caret: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const bodyLabel = useId();

  const dirty = snap(title, standfirst, date, blocks) !== savedAs;

  const refresh = useCallback(() => {
    fetch("/api/studio/post")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
        setPosts(d.posts ?? []);
        setListError(null);
      })
      .catch((err) => {
        setPosts([]);
        setListError(`Unable to load your posts. ${err instanceof Error ? err.message : ""}`.trim());
      });
  }, []);
  useEffect(refresh, [refresh]);

  // Closing the tab on unsaved writing asks first. A phone that reloads a
  // backgrounded tab does not ask anyone, which is why the bar says
  // "unsaved changes" in plain words the whole time.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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

  const load = (p: Loaded) => {
    setId(p.id);
    setSlug(p.slug ?? "");
    setTitle(p.title);
    setStandfirst(p.standfirst);
    setDate(p.date);
    setPublished(p.published);
    setBlocks(p.blocks);
    setSavedAs(snap(p.title, p.standfirst, p.date, p.blocks));
    setSavedHere(false);
    setMessage(null);
    setImageNote(null);
  };

  const leave = () =>
    !dirty || window.confirm("Leave this post without saving? The changes since your last save will be lost.");

  const blank = () => {
    if (!leave()) return;
    load({ title: "", standfirst: "", date: today(), published: false, blocks: emptyBody() });
    titleInput.current?.focus();
  };

  const open = async (item: Item) => {
    if (item.id === id || !leave()) return;
    const res = await fetch(`/api/studio/post?slug=${encodeURIComponent(item.slug)}`).catch(() => null);
    if (!res?.ok) return setMessage({ tone: "error", text: "Unable to open that one. Try again in a moment." });
    const { post } = await res.json();
    load({
      id: post.id,
      slug: post.slug,
      title: post.title,
      standfirst: post.standfirst,
      date: post.date || today(),
      published: post.published,
      blocks: post.blocks?.length ? post.blocks : emptyBody(),
    });
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

    // The keyboard shortcut keeps whatever state the post is in: a draft
    // stays a draft, a live post is updated. Publishing is always a press.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save(published);
    }
  };

  const setKind = (i: number, kind: BlockKind) =>
    edit((b) => {
      b[i] = { ...b[i], kind };
      return b;
    });

  const removeBlock = (i: number) =>
    edit((b) => (b.length === 1 ? emptyBody() : b.filter((_, k) => k !== i)));

  const addImage = async (files: FileList) => {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setBusyImage(true);
    setImageNote(null);
    try {
      const shot = await sendPhoto(file);
      edit((b) => [
        ...b,
        { kind: "image", text: "", url: shot.url, width: shot.width, height: shot.height },
        { kind: "paragraph", text: "" },
      ]);
      setImageNote(`Photo added, compressed from ${size(shot.before)} to ${size(shot.after)}.`);
    } catch (err) {
      setImageNote(err instanceof Error ? err.message : "Unable to add that photo.");
    }
    setBusyImage(false);
  };

  const fromLibrary = ([photo]: LibraryPhoto[]) => {
    if (!photo) return;
    edit((b) => [
      ...b,
      { kind: "image", text: "", url: photo.url, width: photo.width, height: photo.height },
      { kind: "paragraph", text: "" },
    ]);
    setImageNote("Photo added from the library.");
  };

  const words = blocks.reduce(
    (n, b) =>
      n + (b.kind === "image" || b.kind === "divider"
        ? 0
        : b.text.trim().split(/\s+/).filter(Boolean).length),
    0
  );
  const hasContent = words > 0 || blocks.some((b) => b.kind === "image");

  // The buttons stay pressable with something missing and say what it is,
  // rather than greying out and leaving the reason to be guessed.
  const save = async (publish: boolean) => {
    if (busy) return;
    if (!title.trim()) {
      setMessage({ tone: "error", text: "Add a title first." });
      titleInput.current?.focus();
      return;
    }
    if (publish && !hasContent) {
      setMessage({ tone: "error", text: "Write something in the body before publishing." });
      areas.current.find(Boolean)?.focus();
      return;
    }
    if (busyImage) {
      setMessage({ tone: "error", text: "Wait for the photo to finish uploading." });
      return;
    }

    const was = published;
    setBusy(publish ? (was ? "update" : "publish") : was ? "unpublish" : "draft");
    setMessage(null);
    const sending = snap(title, standfirst, date, blocks);
    const res = await fetch("/api/studio/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, standfirst, date, published: publish, blocks }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) {
      setId(data.id);
      setSlug(data.slug);
      setPublished(publish);
      setSavedAs(sending);
      setSavedHere(true);
      setMessage({
        tone: "done",
        text: publish
          ? was
            ? "Updated. The site shows this version now."
            : "Published. It is on the site now."
          : was
            ? "Unpublished. It is a draft again."
            : "Saved as a draft. Only you can see it.",
      });
      refresh();
    } else {
      setMessage({
        tone: "error",
        text: data?.error ?? "Unable to save. Check the connection and try again.",
      });
    }
    setBusy(null);
  };

  return (
    <>
      <RoomHeader room="write" />
      <TwoPane
        label="Your posts"
        list={
          <ItemList
            noun="post"
            items={posts}
            error={listError}
            openId={id}
            draftTitle={title}
            onOpen={open}
            onNew={blank}
          />
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <input
              ref={titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputClass} font-medium`}
            />
          </Field>
          <Field label="Standfirst" hint="One line under the title">
            <input value={standfirst} onChange={(e) => setStandfirst(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Date" className="w-full max-w-[200px]">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2">
            <span id={bodyLabel} className={labelClass}>Body</span>
            <span className={hintClass}>
              <span className="font-mono">##</span> heading · <span className="font-mono">&gt;</span> quote ·{" "}
              <span className="font-mono">-</span> list · <span className="font-mono">---</span> divider
            </span>
          </div>
          <div
            role="group"
            aria-labelledby={bodyLabel}
            className="rounded-lg border border-border bg-bg px-3 py-3 min-h-[240px] space-y-1 focus-within:border-fg transition-colors duration-200"
          >
            {blocks.map((block, i) => (
              <div key={i} className="group grid sm:grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                {block.kind === "divider" ? (
                  <hr className="border-0 border-t border-border my-4" />
                ) : block.kind === "image" ? (
                  <figure className="m-0 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={block.url} alt="" width={block.width} height={block.height}
                      className="w-full h-auto block max-h-[360px] object-contain object-left rounded-md border border-border bg-bg-muted" />
                    <Field label="Alt text" hint="Read aloud in its place" className="mt-2">
                      <input
                        value={block.text}
                        onChange={(e) => onChange(i, e.target.value)}
                        placeholder="Describe the photograph"
                        className={inputClass}
                      />
                    </Field>
                  </figure>
                ) : (
                  <div className="relative">
                    {block.kind === "bullet" && (
                      <span aria-hidden="true" className="absolute left-1 top-0 text-[16px] sm:text-[13px] leading-[1.8] text-fg-muted">•</span>
                    )}
                    {block.kind === "number" && (
                      <span aria-hidden="true" className="absolute left-0 top-0 text-[16px] sm:text-[13px] leading-[1.8] text-fg-muted tabular-nums">
                        {blocks.slice(0, i + 1).filter((b) => b.kind === "number").length}.
                      </span>
                    )}
                    <textarea
                      ref={(el) => { areas.current[i] = el; }}
                      rows={1}
                      value={block.text}
                      onChange={(e) => { onChange(i, e.target.value); grow(e.currentTarget); }}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      placeholder={i === 0 ? "Start writing." : ""}
                      aria-label={`${KIND_LABEL[block.kind]} block ${i + 1}`}
                      className={`block w-full bg-transparent border-0 rounded-none p-0 resize-none overflow-hidden focus:outline-none placeholder:text-fg-muted ${KIND_CLASS[block.kind]}`}
                    />
                  </div>
                )}

                {/* Beside the block on a wide screen, shown on hover or focus.
                    On a phone there is no hover and no room beside it, so the
                    controls open under whichever block has the caret. */}
                <div className="hidden group-focus-within:flex sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 items-center gap-2 pt-1 pb-2 sm:pb-0 sm:pt-0.5 transition-opacity duration-200">
                  <label className="sr-only" htmlFor={`kind-${i}`}>Block type</label>
                  <select
                    id={`kind-${i}`}
                    value={block.kind}
                    onChange={(e) => setKind(i, e.target.value as BlockKind)}
                    className="h-8 sm:h-7 bg-bg text-[16px] sm:text-[11px] text-fg-body border border-border rounded-md px-2 hover:border-border-strong"
                  >
                    {(Object.keys(KIND_LABEL) as BlockKind[])
                      .filter((k) => k !== "image" || block.kind === "image")
                      .map((k) => (
                        <option key={k} value={k}>{KIND_LABEL[k]}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeBlock(i)}
                    aria-label={`Remove block ${i + 1}`}
                    className="grid place-items-center w-8 h-8 sm:w-7 sm:h-7 rounded-md text-fg-muted hover:text-fg hover:bg-bg-muted transition-colors duration-200"
                  >
                    <svg viewBox="0 0 14 14" className="w-3 h-3 stroke-current stroke-[1.5] [stroke-linecap:round]" fill="none" aria-hidden="true">
                      <path d="M3 3l8 8M11 3l-8 8" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
            <Button onClick={() => fileInput.current?.click()} disabled={busyImage}>
              <Plus />
              {busyImage ? "Adding photo…" : "Add a photo"}
            </Button>
            <input ref={fileInput} type="file" accept="image/*" hidden
              onChange={(e) => { if (e.target.files) addImage(e.target.files); e.target.value = ""; }} />
            <Button onClick={() => setPicking(true)}>From library</Button>
            <LibraryPicker
              open={picking}
              multiple={false}
              onPick={fromLibrary}
              onClose={() => setPicking(false)}
            />
            <span className="text-[11px] leading-[1.6] text-fg-muted tabular-nums">
              {words} word{words === 1 ? "" : "s"}
            </span>
            <span role="status" className="text-[11px] leading-[1.6] text-fg-body">{imageNote}</span>
          </div>
        </div>

        <ActionBar
          published={published}
          dirty={dirty}
          saved={savedHere}
          busy={busy}
          live={slug ? `/writing/${slug}` : undefined}
          message={message}
          onDraft={() => save(false)}
          onPublish={() => save(true)}
          onUnpublish={() => save(false)}
        />
      </TwoPane>
    </>
  );
}
