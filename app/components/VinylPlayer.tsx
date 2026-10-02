// app/components/VinylPlayer.tsx
//
// A record on the turntable while the photographs are open: California
// Dreamin', from the Apple Music preview. After the vinyl card on
// shwn.design — a clear disc with the sleeve as its label, an arm that drops
// onto it, and the track named beside it.
//
// It starts on its own, because it only ever mounts in answer to a click — the
// switch to Photographs — and a browser lets a page play sound in answer to
// one. If the browser still says no, it waits, arm up, for a tap. Switching
// back to Data unmounts it, which stops it.
//
// The preview is thirty seconds, and it plays for as long as the gallery is
// open: each pass rises out of the one before and falls into the next, two
// and a half seconds of overlap, so the seam is a crossfade rather than a cut.
// That needs a gain that can move, and iOS ignores writes to
// HTMLMediaElement.volume — so the record is played through Web Audio, from a
// buffer decoded once, with every pass and its fades scheduled on the audio
// clock. If Web Audio cannot have it, a plain looping <audio> plays instead.
//
// The audio and the sleeve are Apple's preview assets, used the way Apple
// provides them: to play a sample and point at the full track, which the
// "Apple Music" link does. The full song is not hosted here; it is not ours to.
"use client";

import { useEffect, useRef, useState } from "react";

const TRACK = {
  title: "California Dreamin'",
  artist: "The Mamas & The Papas",
  album: "If You Can Believe Your Eyes and Ears",
  preview:
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/21/30/9a/21309af6-0458-39c9-f420-22bb0f0ac11b/mzaf_5048935370131739463.plus.aac.p.m4a",
  sleeve:
    "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/19/39/88/193988e9-02c3-b879-5881-2d31c9774bbf/06UMGIM04100.rgb.jpg/600x600bb.jpg",
  link: "https://music.apple.com/us/album/california-dreamin-single/1440795791?i=1440796325",
};

const VOLUME = 0.7;
/** Seconds each pass overlaps the next. */
const XFADE = 2.5;
/** The single runs 2:42; the arm crosses the record in that time, then returns. */
const SIDE = 162;

type Position = { pass: number; side: number };

/** The record player behind the picture: one AudioContext, one decoded buffer. */
class Turntable {
  kind: "web audio" | "element" = "web audio";
  closed = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private loading: Promise<AudioBuffer> | null = null;
  private first = 0;
  private next = 0;
  private pump = 0;
  private element: HTMLAudioElement | null = null;

  constructor(private url: string) {
    // Web Audio follows the ring/silent switch on iOS unless told this is
    // playback, like music, rather than a sound effect.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      this.kind = "element";
      return;
    }
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  private async load(): Promise<AudioBuffer> {
    const res = await fetch(this.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.arrayBuffer();
    // The callback form, which every Safari that has Web Audio understands.
    return new Promise((ok, no) => this.ctx!.decodeAudioData(data, ok, no));
  }

  /** True once sound is actually coming out. */
  async play(): Promise<boolean> {
    if (this.kind === "element") return this.playElement();
    const ctx = this.ctx!;
    // Asked for first, while this is still the tap's (or the click's) call
    // stack — Safari only lets a context start from inside one.
    const resumed = ctx.resume().catch(() => {});
    try {
      this.buffer ??= await (this.loading ??= this.load());
    } catch {
      this.kind = "element";
      void ctx.close().catch(() => {});
      return this.playElement();
    }
    await resumed;
    if (this.closed || ctx.state !== "running") return false;
    if (!this.first) {
      this.first = this.next = ctx.currentTime + 0.05;
      this.schedule();
      this.pump = window.setInterval(() => this.schedule(), 500);
    }
    this.fade(VOLUME, 0.9);
    return true;
  }

  async pause(): Promise<void> {
    if (this.kind === "element") {
      this.element?.pause();
      return;
    }
    this.fade(0, 0.25);
    await new Promise((r) => setTimeout(r, 260));
    if (!this.closed) await this.ctx!.suspend().catch(() => {});
  }

  /** Where the arm and the bar are: through this pass, and across the side. */
  position(): Position {
    if (this.kind === "element") {
      const a = this.element;
      const pass = a && a.duration ? a.currentTime / a.duration : 0;
      return { pass, side: pass };
    }
    if (!this.first || !this.buffer) return { pass: 0, side: 0 };
    const t = Math.max(0, this.ctx!.currentTime - this.first);
    const lap = this.buffer.duration - XFADE;
    return { pass: (t % lap) / lap, side: (t % SIDE) / SIDE };
  }

  close() {
    this.closed = true;
    window.clearInterval(this.pump);
    this.element?.pause();
    void this.ctx?.close().catch(() => {});
  }

  // Keeps a few seconds of passes queued on the audio clock. A suspended
  // context's clock stands still, so pausing never lets the queue run ahead.
  private schedule() {
    const ctx = this.ctx!;
    const b = this.buffer;
    if (!b || this.closed) return;
    while (this.next < ctx.currentTime + 4) {
      const at = this.next;
      const src = ctx.createBufferSource();
      src.buffer = b;
      const g = ctx.createGain();
      const opening = at === this.first;
      g.gain.setValueAtTime(opening ? 1 : 0, at);
      if (!opening) g.gain.linearRampToValueAtTime(1, at + XFADE);
      g.gain.setValueAtTime(1, at + b.duration - XFADE);
      g.gain.linearRampToValueAtTime(0, at + b.duration);
      src.connect(g).connect(this.master!);
      src.onended = () => {
        src.disconnect();
        g.disconnect();
      };
      src.start(at);
      this.next = at + b.duration - XFADE;
    }
  }

  private fade(to: number, secs: number) {
    const g = this.master!.gain;
    const now = this.ctx!.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to, now + secs);
  }

  private async playElement(): Promise<boolean> {
    if (!this.element) {
      this.element = new Audio(this.url);
      this.element.loop = true;
      this.element.volume = VOLUME;
    }
    try {
      await this.element.play();
      return !this.closed;
    } catch {
      return false;
    }
  }
}

export function VinylPlayer() {
  const deck = useRef<Turntable | null>(null);
  const [playing, setPlaying] = useState(false);
  const [kind, setKind] = useState<Turntable["kind"]>("web audio");
  const [{ pass, side }, setPosition] = useState<Position>({ pass: 0, side: 0 });

  useEffect(() => {
    const t = new Turntable(TRACK.preview);
    deck.current = t;
    void t.play().then((on) => {
      if (t.closed) return;
      setPlaying(on);
      setKind(t.kind);
    });
    const tick = window.setInterval(() => setPosition(t.position()), 250);
    return () => {
      window.clearInterval(tick);
      t.close();
      deck.current = null;
    };
  }, []);

  // Called straight from the tap, so play() can still start the context.
  const toggle = () => {
    const t = deck.current;
    if (!t) return;
    if (playing) {
      setPlaying(false);
      void t.pause();
    } else {
      void t.play().then((on) => {
        if (t.closed) return;
        setPlaying(on);
        setKind(t.kind);
      });
    }
  };

  return (
    <div className="flex items-center gap-5" data-deck={kind}>
      {/* The turntable: disc, label, spindle and arm. Decoration only — the
          button beside it is the control. */}
      <div aria-hidden="true" className="relative shrink-0 w-[128px] h-[128px]">
        <div className="vinyl-spin absolute inset-0 rounded-full" data-playing={playing ? "" : undefined}>
          {/* Clear vinyl: a pale disc with fine grooves pressed into it. */}
          <div
            className="absolute inset-0 rounded-full shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(0,0,0,0.06)]"
            style={{
              background:
                "repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0.045) 0 1px, transparent 1px 3px), radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--bg) 55%, white) 0%, color-mix(in srgb, var(--bg) 80%, white) 70%, color-mix(in srgb, var(--fg) 10%, var(--bg)) 100%)",
            }}
          />
          {/* The sleeve as the centre label. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TRACK.sleeve}
            alt=""
            className="absolute left-1/2 top-1/2 w-[46%] h-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-[0_0_0_2px_color-mix(in_srgb,var(--bg)_60%,white)]"
          />
          <span className="absolute left-1/2 top-1/2 w-[6px] h-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />
        </div>
        {/* Light falls on the record from one side and stays there while it
            turns — which is what makes the turning visible. */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full mix-blend-soft-light"
          style={{
            background:
              "conic-gradient(from 20deg, transparent 0deg, rgba(255,255,255,0.7) 25deg, transparent 60deg, transparent 180deg, rgba(255,255,255,0.55) 205deg, transparent 240deg)",
          }}
        />
        {/* The arm pivots just off the top-right corner. Its 60px reach is set
            so the stylus lands on the outer grooves at about 9° and tracks in
            to the last grooves near 33° as the side plays — distances off the
            centre worked out from the pivot, not eyeballed — then swings off
            the record, to -10°, when the music stops. */}
        <span className="absolute -right-2 -top-2 w-[14px] h-[14px] rounded-full bg-bg shadow-[0_0_0_1px_var(--border-strong),0_2px_4px_rgba(0,0,0,0.15)] z-10" />
        <span
          className="absolute -top-[2px] right-[-1.5px] w-[3px] h-[60px] origin-top rounded-full bg-fg-muted transition-transform duration-700 ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{ transform: `rotate(${playing ? 9 + side * 24 : -10}deg)` }}
        >
          {/* The headshell. */}
          <span className="absolute -left-[2px] bottom-0 w-[7px] h-[9px] rounded-[2px] bg-fg-muted" />
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-[11px] leading-[1.6] uppercase tracking-[0.14em] text-fg-label">
          {playing ? "Now playing" : "Paused"}
        </p>
        <p className="text-[15px] leading-[1.35] font-medium tracking-[-0.02em] text-fg mt-1">{TRACK.title}</p>
        <p className="text-[11px] leading-[1.6] text-fg-muted">{TRACK.artist}</p>

        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Pause ${TRACK.title}` : `Play ${TRACK.title}`}
            className="relative w-9 h-9 shrink-0 rounded-full bg-fg text-bg grid place-items-center hover:opacity-90 transition-opacity duration-200 after:absolute after:-inset-1 after:content-['']"
          >
            {playing ? (
              <svg viewBox="0 0 12 12" aria-hidden="true" className="w-3 h-3 fill-current">
                <rect x="2.5" y="2" width="2.5" height="8" rx="0.6" />
                <rect x="7" y="2" width="2.5" height="8" rx="0.6" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" aria-hidden="true" className="w-3 h-3 fill-current translate-x-[1px]">
                <path d="M3 1.8v8.4c0 .5.5.8.9.5l6.4-4.2c.4-.2.4-.8 0-1L3.9 1.3c-.4-.3-.9 0-.9.5z" />
              </svg>
            )}
          </button>
          <div className="w-[96px] h-[2px] rounded-full bg-border overflow-hidden" aria-hidden="true">
            <div className="h-full bg-fg origin-left" style={{ transform: `scaleX(${pass})` }} />
          </div>
        </div>

        <a
          href={TRACK.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[11px] leading-[1.6] text-fg-muted hover:text-fg underline decoration-border-strong underline-offset-[3px] transition-colors duration-200"
        >
          Full song on Apple Music ↗
        </a>
      </div>
    </div>
  );
}
