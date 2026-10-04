// app/lib/turntable.ts
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
export const TRACK = {
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
export const SIDE = 162;

export type Position = { pass: number; side: number };

/** The record player behind the picture: one AudioContext, one decoded buffer. */
export class Turntable {
  kind: "web audio" | "element" = "web audio";
  closed = false;
  /** True once a side is actually turning, so a second caller does not start one. */
  started = false;
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
    if (this.kind === "element") {
      const on = await this.playElement();
      this.started = on;
      return on;
    }
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
    this.started = true;
    return true;
  }

  async pause(): Promise<void> {
    this.started = false;
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
    this.started = false;
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


/**
 * ONE deck for the whole page.
 *
 * It used to be constructed inside VinylPlayer and closed on unmount, so the
 * record started when the gallery opened and died when you left it. That is
 * fine as long as the gallery is the only place sound happens — and it is not
 * any more: the opening can start the same track, and the point of starting it
 * there is that it is still playing three screens later when the turntable
 * comes into view, at the right place in the side.
 *
 * Nothing here starts on its own. Every caller reaches it from a tap, because
 * a browser will not play sound otherwise.
 */
let deck: Turntable | null = null;

export function theDeck(): Turntable {
  return (deck ??= new Turntable(TRACK.preview));
}

/** Whether a record is on, for a caller that must not start a second one. */
export function deckPlaying(): boolean {
  return Boolean(deck && deck.started && !deck.closed);
}
