// app/studio/ui.tsx
// The studio's shared pieces. The rooms were built one at a time and each
// grew its own idea of a button, until the action that publishes looked
// exactly like the one that opens a file picker. Everything a room is made of
// comes from here now, so the rooms read as one product and a filled button
// means the same thing wherever it appears: the thing this screen is for.
"use client";

import { useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

// ── rooms ──────────────────────────────────────────────────────────────────
export type Room = "write" | "darkroom" | "photos" | "notes" | "access";

export const ROOM_ORDER: Room[] = ["write", "darkroom", "photos", "notes", "access"];

// The nav names a room; the line under its title says what it is for and
// where its work ends up, which is the question a name alone cannot answer.
export const ROOMS: Record<Room, { label: string; lede: string }> = {
  write: {
    label: "Write",
    lede: "Posts for /writing. Drafts stay private until you publish.",
  },
  darkroom: {
    label: "Darkroom",
    lede: "Photo essays for /photo. Writing and frames, in the order they publish.",
  },
  photos: {
    label: "Photos",
    lede: "Your photo library. Upload once, use in any essay or post — nothing here is public by itself.",
  },
  notes: {
    label: "Notes",
    lede: "Guest notes waiting for you. Publish, hide or delete.",
  },
  access: {
    label: "Access",
    lede: "People asking to read the case studies.",
  },
};

export function RoomHeader({ room, action }: { room: Room; action?: ReactNode }) {
  const { label, lede } = ROOMS[room];
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 mb-6 lg:mb-8">
      <div className="min-w-0">
        <h2 className="text-[15px] leading-[1.5] font-medium tracking-[-0.02em] text-fg">{label}</h2>
        <p className="text-[13px] leading-[1.7] text-fg-body mt-1">{lede}</p>
      </div>
      {action}
    </header>
  );
}

// ── fields ─────────────────────────────────────────────────────────────────
export const labelClass = "block text-[11px] leading-[1.6] text-fg-label";
export const hintClass = "text-[11px] leading-[1.7] text-fg-muted";
// 16px on a phone: iOS zooms the page into any field set smaller.
export const inputClass =
  "w-full h-11 rounded-lg border border-border bg-bg px-3 text-[16px] sm:text-[13px] text-fg placeholder:text-fg-muted focus:border-fg transition-colors duration-200";
export const textareaClass =
  "block w-full rounded-lg border border-border bg-bg px-3 py-3 text-[16px] sm:text-[13px] leading-[1.8] text-fg placeholder:text-fg-muted focus:border-fg transition-colors duration-200";

/**
 * A label that stays above its field. A placeholder standing in for one
 * disappears on the first keystroke, and with it the only clue to what the
 * field was for. The hint sits on the label's line, so it is part of the
 * field's name for a screen reader too.
 */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2">
        <span className={labelClass}>{label}</span>
        {hint && <span className={hintClass}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}

// ── buttons ────────────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "quiet" | "chip" | "confirm";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[opacity,border-color,color,background-color] duration-200 disabled:cursor-not-allowed";

// A chip's hit area, kept apart so the confirming chip below shares it.
const CHIP_BOX =
  "relative min-w-7 px-2 py-1 rounded-md border bg-bg text-[11px] leading-[1.6] disabled:opacity-30 after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-['']";

const VARIANT: Record<Variant, string> = {
  // The one action a screen is for. There is at most one of these in view.
  primary:
    "h-11 px-4 rounded-lg bg-fg text-bg text-[13px] font-medium hover:opacity-90 disabled:opacity-50",
  secondary:
    "h-11 px-4 rounded-lg border border-border bg-bg text-fg text-[13px] font-medium hover:border-border-strong disabled:opacity-50",
  quiet:
    "h-11 px-3 rounded-lg text-fg-body text-[13px] font-medium hover:text-fg hover:bg-bg-muted disabled:opacity-50",
  // Small controls on a row. The box is 28px, the same as the hold-to-approve
  // chip it sits beside; the pseudo-element takes the part a thumb lands on
  // most of the way to 44px without making the row any taller.
  chip: `${CHIP_BOX} border-border text-fg-body hover:text-fg hover:border-border-strong`,
  // The second press of something that cannot be undone: same size as the
  // chip it replaces, drawn in ink so it is plainly not the first press.
  confirm: `${CHIP_BOX} border-fg text-fg font-medium`,
};

export function buttonClass(variant: Variant = "secondary", extra = "") {
  return `${BASE} ${VARIANT[variant]} ${extra}`;
}

export function Button({
  variant = "secondary",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />;
}

export function Plus() {
  return (
    <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 stroke-current stroke-[1.5] [stroke-linecap:round]" fill="none" aria-hidden="true">
      <path d="M7 2.5v9M2.5 7h9" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 14 14"
      className={`w-3.5 h-3.5 shrink-0 stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M3.5 5.5L7 9l3.5-3.5" />
    </svg>
  );
}

// ── state ──────────────────────────────────────────────────────────────────
/**
 * Draft or published, spelled out. The accent is the site's one colour and
 * it is spent here, on "this is live"; the selection pair it borrows keeps
 * dark ink on it in both themes, where --fg would turn pale on a pale fill.
 */
export function Badge({ live, children }: { live: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center shrink-0 px-2 py-0.5 rounded-md text-[11px] leading-[1.6] ${
        live
          ? "bg-[var(--accent-soft)] text-[var(--sel-fg)]"
          : "border border-border-strong text-fg-body"
      }`}
    >
      {children}
    </span>
  );
}

export function StatusChip({ published, note }: { published: boolean; note?: string }) {
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <Badge live={published}>{published ? "Published" : "Draft"}</Badge>
      {note && <span className="text-[11px] leading-[1.6] text-fg-muted truncate">· {note}</span>}
    </span>
  );
}

export type Busy = null | "draft" | "publish" | "update" | "unpublish";
export interface Message {
  tone: "error" | "done";
  text: string;
}

const BUSY_LABEL: Record<Exclude<Busy, null>, string> = {
  draft: "Saving…",
  publish: "Publishing…",
  update: "Updating…",
  unpublish: "Unpublishing…",
};

/**
 * Where an editor's work leaves it. Pinned to the bottom of the screen, so
 * the answer to "how do I publish this" is in view however long the piece
 * is, and the two outcomes are two buttons with their outcome in the label —
 * not one Save that does whichever a checkbox halfway up the page says.
 *
 * Once a piece is live, "Save draft" would quietly take it down, so it gives
 * way to Update and a separate, quieter Unpublish.
 */
export function ActionBar({
  published,
  dirty,
  saved,
  busy,
  live,
  message,
  onDraft,
  onPublish,
  onUnpublish,
}: {
  published: boolean;
  dirty: boolean;
  /** Saved in this sitting, and nothing changed since. */
  saved: boolean;
  busy: Busy;
  /** The public address, once there is one to visit. */
  live?: string;
  message: Message | null;
  onDraft: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  const note = busy ? undefined : dirty ? "unsaved changes" : saved ? "saved" : undefined;
  // A success line goes stale the moment the piece changes again; an error
  // stays until the next attempt replaces it.
  const shown = message && (message.tone === "error" || !dirty) ? message : null;

  return (
    <div className="sticky bottom-0 z-10 mt-8 -mx-6 px-6 lg:mx-0 lg:px-0 bg-bg border-t border-border pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div aria-live="polite" aria-atomic="true">
        {shown && (
          <p
            className={`text-[13px] leading-[1.7] mb-3 ${
              shown.tone === "error" ? "text-fg font-medium" : "text-fg-body"
            }`}
          >
            {shown.text}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap min-w-0">
          <StatusChip published={published} note={note} />
          {published && live && (
            <a
              href={live}
              target="_blank"
              rel="noopener"
              className="text-[13px] leading-[1.7] font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
              View live <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
        {/* One row on a phone whenever it fits — every pixel of this bar is
            a pixel less of the piece above it. */}
        <div className="flex items-center gap-2 ml-auto">
          {published ? (
            <Button variant="quiet" onClick={onUnpublish} disabled={busy !== null}>
              {busy === "unpublish" ? BUSY_LABEL.unpublish : "Unpublish"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onDraft} disabled={busy !== null}>
              {busy === "draft" ? BUSY_LABEL.draft : "Save draft"}
            </Button>
          )}
          <Button variant="primary" onClick={onPublish} disabled={busy !== null}>
            {busy === "publish" || busy === "update"
              ? BUSY_LABEL[busy]
              : published
                ? "Update"
                : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── lists ──────────────────────────────────────────────────────────────────
export interface Item {
  id: string;
  slug: string;
  title: string;
  date: string;
  published: boolean;
}

/** "2026-10-01" or an ISO timestamp → "1 Oct 2026". */
export function when(iso: string) {
  if (!iso) return "";
  // A bare date is a calendar day, not midnight in London; read in local time
  // it slips to the day before anywhere west of Greenwich.
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(dayOnly ? { timeZone: "UTC" } : {}),
  });
}

/**
 * The pieces that already exist, beside the one being edited. A column of
 * its own on a wide screen; on a phone it folds behind one button so the
 * editor is what the screen opens on, with New always beside it.
 */
export function ItemList({
  noun,
  items,
  error,
  openId,
  draftTitle,
  onOpen,
  onNew,
}: {
  noun: string;
  items: Item[] | null;
  error: string | null;
  openId?: string;
  /** The title of a piece that has not been saved yet, shown as its row. */
  draftTitle: string;
  onOpen: (item: Item) => void;
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const count = items && !error ? ` · ${items.length}` : "";

  const row = (active: boolean) =>
    `block w-full text-left rounded-lg px-3 py-3 transition-colors duration-200 ${
      active ? "bg-bg-muted" : "hover:bg-bg-subtle"
    }`;

  return (
    <div>
      <div className="flex gap-2 lg:block">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden flex-1 min-w-0 h-11 px-3 rounded-lg border border-border bg-bg hover:border-border-strong flex items-center justify-between gap-2 text-[13px] font-medium text-fg transition-colors duration-200"
        >
          <span className="truncate">
            Your {noun}s{count}
          </span>
          <Chevron open={open} />
        </button>
        <Button variant="secondary" onClick={onNew} className="lg:w-full">
          <Plus />
          New {noun}
        </Button>
      </div>

      <div id={listId} className={`${open ? "block" : "hidden"} lg:block mt-3 lg:mt-6`}>
        <p className={`${labelClass} hidden lg:block mb-2`}>
          Your {noun}s{count}
        </p>
        <ul className="-mx-3 space-y-0.5">
          {openId === undefined && (
            <li>
              <div aria-current="true" className={row(true)}>
                <span className="block text-[13px] leading-[1.5] font-medium text-fg truncate">
                  {draftTitle.trim() || "Untitled"}
                </span>
                <span className="block text-[11px] leading-[1.6] text-fg-muted mt-1">
                  New {noun}, not saved yet
                </span>
              </div>
            </li>
          )}
          {error ? (
            <li className="px-3 py-2 text-[13px] leading-[1.7] text-fg-body">{error}</li>
          ) : items === null ? (
            <li className="px-3 py-2 text-[13px] text-fg-muted">Loading…</li>
          ) : items.length === 0 && (
            <li className="px-3 py-2 text-[13px] leading-[1.7] text-fg-muted">
              Nothing saved yet. Each {noun} you save is listed here.
            </li>
          )}
          {!error && items?.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-current={item.id === openId ? "true" : undefined}
                onClick={() => {
                  setOpen(false);
                  onOpen(item);
                }}
                className={row(item.id === openId)}
              >
                <span className="block text-[13px] leading-[1.5] font-medium text-fg truncate">
                  {item.title}
                </span>
                <span className="flex items-center gap-2 mt-1">
                  <Badge live={item.published}>{item.published ? "Published" : "Draft"}</Badge>
                  {item.date && (
                    <span className="text-[11px] leading-[1.6] text-fg-muted tabular-nums">
                      {when(item.date)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** List beside editor from 1024px; stacked, list first, below that. */
export function TwoPane({ label, list, children }: { label: string; list: ReactNode; children: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 lg:items-start">
      <nav aria-label={label} className="mb-6 lg:mb-0">
        {list}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ── photographs in ─────────────────────────────────────────────────────────
export interface Pending {
  name: string;
  state: "compressing" | "uploading" | "failed";
  error?: string;
  /** "6.2 MB → 410 KB", once compressing is done. */
  saved?: string;
}

/**
 * Where photographs come in. On a phone there is nothing to drag, so the
 * button is the way in and is set as one; the drop target is the same box,
 * for the laptop.
 */
export function DropZone({
  onFiles,
  hint,
  extra,
}: {
  onFiles: (files: FileList) => void;
  hint: ReactNode;
  /** A second way to add to the same place, set beside Choose photos. */
  extra?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      // Leaving for a child is not leaving; without this the outline flickers
      // every time the pointer crosses the button inside.
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border border-dashed px-4 py-6 sm:px-6 sm:py-8 text-center transition-colors duration-200 ${
        drag ? "border-fg bg-bg-muted" : "border-border-strong"
      }`}
    >
      <p className="text-[13px] leading-[1.7] text-fg-body">
        <span className="hidden [@media(hover:hover)]:inline">Drop photographs here, as many at once as you like.</span>
        <span className="[@media(hover:hover)]:hidden">Add as many photographs at once as you like.</span>
      </p>
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-center gap-2">
        <Button variant="secondary" onClick={() => input.current?.click()} className="w-full sm:w-auto">
          <Plus />
          Choose photos
        </Button>
        {extra}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className={`${hintClass} mt-4 max-w-[56ch] mx-auto`}>{hint}</p>
    </div>
  );
}

export function PendingList({ pending }: { pending: Pending[] }) {
  if (!pending.length) return null;
  return (
    <ul className="space-y-2">
      {pending.map((p, i) => (
        <li key={`${p.name}-${i}`} className="flex flex-wrap gap-x-3 text-[11px] leading-[1.7] text-fg-body">
          <span className="truncate max-w-[240px]">{p.name}</span>
          <span className={p.state === "failed" ? "text-fg font-medium" : "text-fg-muted"}>
            {p.state === "failed" ? `failed: ${p.error}` : `${p.state}…`}
          </span>
          {p.saved && <span className="font-mono text-fg-muted">{p.saved}</span>}
        </li>
      ))}
    </ul>
  );
}
