// app/darkroom/Composer.tsx
// Write, drop photographs in, decide which of them share a row. The order you
// see is the order the essay publishes in — there is no separate preview mode
// to drift out of sync with.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Block, EssayMeta, Shot } from "@/app/lib/darkroom";
import { size } from "./downscale";
import { sendPhoto } from "./sendPhoto";
import {
  ActionBar,
  Button,
  DropZone,
  Field,
  ItemList,
  PendingList,
  Plus,
  RoomHeader,
  TwoPane,
  inputClass,
  labelClass,
  textareaClass,
  type Busy,
  type Item,
  type Message,
  type Pending,
} from "@/app/studio/ui";
import { LibraryPicker, type LibraryPhoto } from "@/app/studio/LibraryPicker";

const MAX_PER_ROW = 3;

const today = () => new Date().toISOString().slice(0, 10);

/** What the form holds, as one comparable string — "unsaved" is a difference. */
const snap = (title: string, subtitle: string, date: string, blocks: Block[]) =>
  JSON.stringify([title, subtitle, date, blocks]);

interface Loaded {
  id?: string;
  slug?: string;
  title: string;
  subtitle: string;
  date: string;
  published: boolean;
  blocks: Block[];
}

export function Editor() {
  const [essays, setEssays] = useState<EssayMeta[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [id, setId] = useState<string | undefined>();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [date, setDate] = useState(today);
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [savedAs, setSavedAs] = useState(() => snap("", "", today(), []));
  const [savedHere, setSavedHere] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [picking, setPicking] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const titleInput = useRef<HTMLInputElement>(null);

  const dirty = snap(title, subtitle, date, blocks) !== savedAs;
  const uploading = pending.some((p) => p.state !== "failed");

  const refresh = useCallback(() => {
    fetch("/api/darkroom/essay")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
        setEssays(d.essays ?? []);
        setListError(null);
      })
      .catch((err) => {
        setEssays([]);
        setListError(`Unable to load your essays. ${err instanceof Error ? err.message : ""}`.trim());
      });
  }, []);
  useEffect(refresh, [refresh]);

  // Closing the tab on an unsaved arrangement asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const load = (e: Loaded) => {
    setId(e.id);
    setSlug(e.slug ?? "");
    setTitle(e.title);
    setSubtitle(e.subtitle);
    setDate(e.date);
    setPublished(e.published);
    setBlocks(e.blocks);
    setSavedAs(snap(e.title, e.subtitle, e.date, e.blocks));
    setSavedHere(false);
    setMessage(null);
    setUploadNote(null);
  };

  const leave = () =>
    !dirty || window.confirm("Leave this essay without saving? The changes since your last save will be lost.");

  const blank = () => {
    if (!leave()) return;
    load({ title: "", subtitle: "", date: today(), published: false, blocks: [] });
    titleInput.current?.focus();
  };

  const open = async (item: Item) => {
    if (item.id === id || !leave()) return;
    const res = await fetch(`/api/darkroom/essay?slug=${encodeURIComponent(item.slug)}`).catch(() => null);
    if (!res?.ok) return setMessage({ tone: "error", text: "Could not open that one. Try again in a moment." });
    const { essay } = await res.json();
    load({
      id: essay.id,
      slug: essay.slug,
      title: essay.title,
      subtitle: essay.subtitle,
      date: essay.date || today(),
      published: essay.published,
      blocks: essay.blocks ?? [],
    });
  };

  // ── taking photographs in ────────────────────────────────────────────────
  const ingest = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploadNote(null);
    setPending(list.map((f) => ({ name: f.name, state: "compressing" })));

    let before = 0, after = 0, sent = 0;
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const mark = (patch: Partial<Pending>) =>
        setPending((p) => p.map((q, k) => (k === i ? { ...q, ...patch } : q)));
      try {
        const shot = await sendPhoto(file, (b, a) =>
          mark({ state: "uploading", saved: `${size(b)} → ${size(a)}` })
        );
        before += shot.before; after += shot.after; sent++;
        const { url, publicId, width, height } = shot;
        // Appended as it arrives, so a long batch is visibly making progress.
        setBlocks((b) => [...b, { type: "images", items: [{ url, publicId, width, height, alt: "" }] }]);
      } catch (err) {
        mark({ state: "failed", error: err instanceof Error ? err.message : String(err) });
      }
    }
    // Leave failures on screen; clear the rest.
    setPending((p) => p.filter((q) => q.state === "failed"));
    if (sent) setUploadNote(`${sent} up, compressed from ${size(before)} to ${size(after)}.`);
  };

  // Photographs already in the library go in the same way uploads do: one row
  // each, at the end, in the order they were picked.
  const fromLibrary = (photos: LibraryPhoto[]) =>
    setBlocks((b) => [
      ...b,
      ...photos.map(({ url, publicId, width, height }) => ({
        type: "images" as const,
        items: [{ url, publicId, width, height, alt: "" }],
      })),
    ]);

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
  // The buttons stay pressable with something missing and say what it is,
  // rather than greying out and leaving the reason to be guessed.
  const save = async (publish: boolean) => {
    if (busy) return;
    if (!title.trim()) {
      setMessage({ tone: "error", text: "Add a title first." });
      titleInput.current?.focus();
      return;
    }
    if (publish && blocks.length === 0) {
      setMessage({ tone: "error", text: "Add a photograph or some writing before publishing." });
      return;
    }
    // Saved mid-batch, the essay would go up without the frames still on
    // their way, and the bar would say "saved" over an arrangement that is not.
    if (uploading) {
      setMessage({ tone: "error", text: "Wait for the photographs to finish uploading." });
      return;
    }

    const was = published;
    setBusy(publish ? (was ? "update" : "publish") : was ? "unpublish" : "draft");
    setMessage(null);
    const sending = snap(title, subtitle, date, blocks);
    const res = await fetch("/api/darkroom/essay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, subtitle, date, published: publish, blocks }),
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
        text: data?.error ?? "Could not save. Check the connection and try again.",
      });
    }
    setBusy(null);
  };

  const shots = blocks.reduce(
    (n, b) => n + (b.type === "images" ? b.items.length : 0), 0
  );

  return (
    <>
      <RoomHeader room="darkroom" />
      <TwoPane
        label="Your essays"
        list={
          <ItemList
            noun="essay"
            items={essays}
            error={listError}
            openId={id}
            draftTitle={title}
            onOpen={open}
            onNew={blank}
          />
        }
      >
        {/* ── what it is called ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <Field label="Title">
            <input
              ref={titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputClass} font-medium`}
            />
          </Field>
          <Field label="Subtitle" hint="One line under the title">
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Date" className="w-full max-w-[200px]">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </Field>
        </div>

        {/* ── the essay itself: rows, then the way more comes in ────────── */}
        <section aria-labelledby="essay-sequence" className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2">
            <h3 id="essay-sequence" className={labelClass}>Frames and writing</h3>
            <span className="text-[11px] leading-[1.6] text-fg-muted tabular-nums">
              {shots} photograph{shots === 1 ? "" : "s"} · {blocks.length} row
              {blocks.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="rounded-xl border border-border">
            {blocks.length === 0 ? (
              <p className="px-4 py-5 text-[13px] leading-[1.7] text-fg-body">
                Nothing in this essay yet. Photographs and writing appear here in
                the order they will publish, top to bottom.
              </p>
            ) : (
              <ol className="divide-y divide-border">
                {blocks.map((block, i) => (
                  <li key={i} className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="font-mono text-[11px] text-fg-muted tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[11px] leading-[1.6] text-fg-label mr-1">
                        {block.type === "text"
                          ? "Writing"
                          : block.items.length === 1
                            ? "Photograph"
                            : `${block.items.length} photographs, one row`}
                      </span>
                      <Button variant="chip" onClick={() => moveRow(i, -1)} disabled={i === 0} aria-label={`Move row ${i + 1} up`}>↑</Button>
                      <Button variant="chip" onClick={() => moveRow(i, 1)} disabled={i === blocks.length - 1} aria-label={`Move row ${i + 1} down`}>↓</Button>
                      {block.type === "images" && (
                        <>
                          <Button
                            variant="chip"
                            onClick={() => mergeDown(i)}
                            disabled={
                              blocks[i + 1]?.type !== "images" ||
                              block.items.length +
                                ((blocks[i + 1] as { items: Shot[] })?.items.length ?? 0) > MAX_PER_ROW
                            }
                          >
                            Merge with next
                          </Button>
                          <Button variant="chip" onClick={() => splitRow(i)} disabled={block.items.length < 2}>
                            One per row
                          </Button>
                        </>
                      )}
                      <Button variant="chip" onClick={() => addText(i + 1)}>+ Text below</Button>
                      <Button variant="chip" onClick={() => dropRow(i)} className="ml-auto">Remove row</Button>
                    </div>

                    {block.type === "text" ? (
                      <textarea
                        value={block.value}
                        onChange={(e) => setText(i, e.target.value)}
                        rows={4}
                        placeholder="Write…"
                        aria-label={`Writing, row ${i + 1}`}
                        className={`${textareaClass} resize-y`}
                      />
                    ) : (
                      // Side by side from 640px and stacked below it — the same
                      // break the published row makes, so the arrangement here
                      // is the arrangement there on either screen.
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 items-stretch sm:items-start">
                        {block.items.map((shot, j) => (
                          // Weighted by aspect ratio exactly as the published row is.
                          <figure
                            key={shot.url}
                            style={{ flex: `${shot.width / shot.height} 1 0`, minWidth: 0 }}
                            className="m-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={shot.url} alt="" width={shot.width} height={shot.height}
                              className="w-full h-auto block max-h-[320px] object-contain object-top rounded-md border border-border bg-bg-muted" />
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Button variant="chip" onClick={() => nudgeShot(i, j, -1)} aria-label={`Move photograph ${j + 1} of row ${i + 1} earlier`}>◀</Button>
                              <Button variant="chip" onClick={() => nudgeShot(i, j, 1)} aria-label={`Move photograph ${j + 1} of row ${i + 1} later`}>▶</Button>
                              <Button variant="chip" onClick={() => dropShot(i, j)} className="ml-auto" aria-label={`Remove photograph ${j + 1} of row ${i + 1}`}>✕</Button>
                            </div>
                            <Field label="Alt text" hint="Read aloud in its place" className="mt-2">
                              <input
                                value={shot.alt}
                                onChange={(e) => setAlt(i, j, e.target.value)}
                                placeholder="Describe the photograph"
                                className={inputClass}
                              />
                            </Field>
                          </figure>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {/* New frames land at the end, so this is where they come in. */}
            <div className="border-t border-border p-2 sm:p-3 space-y-3">
              <PendingList pending={pending} />
              <DropZone
                onFiles={ingest}
                extra={
                  <>
                    <Button onClick={() => setPicking(true)} className="w-full sm:w-auto">
                      From library
                    </Button>
                    <Button onClick={() => addText()} className="w-full sm:w-auto">
                      <Plus />
                      Add writing
                    </Button>
                  </>
                }
                hint={
                  <>
                    New photos are compressed in the browser — 2400px on the long
                    edge, the location a phone writes into them left behind — and
                    kept in the library for next time.
                  </>
                }
              />
              <LibraryPicker open={picking} onPick={fromLibrary} onClose={() => setPicking(false)} />
              <p role="status" className="text-[11px] leading-[1.7] text-fg-body empty:hidden px-2">
                {uploadNote}
              </p>
            </div>
          </div>
        </section>

        <ActionBar
          published={published}
          dirty={dirty}
          saved={savedHere}
          busy={busy}
          live={slug ? `/photo/${slug}` : undefined}
          message={message}
          onDraft={() => save(false)}
          onPublish={() => save(true)}
          onUnpublish={() => save(false)}
        />
      </TwoPane>
    </>
  );
}
