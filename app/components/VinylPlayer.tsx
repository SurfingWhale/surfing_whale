// app/components/VinylPlayer.tsx
//
// A record on the turntable while the photographs are open: California
// Dreamin', from the Apple Music preview. After the vinyl card on
// shwn.design — a clear disc with the sleeve as its label, an arm that drops
// onto it, and the track named beside it.
//
// It starts on its own, because it only ever mounts in answer to a click — the
// switch to Photographs — and a browser lets a page play sound in answer to
// one. If the browser still says no, it waits, arm up, for a tap. It plays the
// thirty-second preview once and lifts the arm at the end rather than looping
// the same half-minute. Switching back to Data unmounts it, which stops it.
//
// The audio and the sleeve are Apple's preview assets, used the way Apple
// provides them: to play a sample and point at the full track, which the
// "Apple Music" link does.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

export function VinylPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const fade = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [progress, setProgress] = useState(0);

  // Volume eased rather than switched: a needle dropping, not a door opening.
  //
  // On a timer, not requestAnimationFrame, so it finishes even when frames are
  // not being drawn — and what comes after it (a pause) never waits on one.
  // iOS ignores writes to volume entirely; there the ramp simply runs its
  // course in silence and the pause still lands on time.
  const ramp = useCallback((to: number, ms: number, then?: () => void) => {
    const a = audio.current;
    if (!a) return;
    window.clearInterval(fade.current);
    const from = a.volume;
    const start = performance.now();
    fade.current = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / ms);
      a.volume = from + (to - from) * k;
      if (k >= 1) {
        window.clearInterval(fade.current);
        then?.();
      }
    }, 30);
  }, []);

  const play = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    if (a.ended) a.currentTime = 0;
    a.volume = 0;
    a.play()
      .then(() => ramp(VOLUME, 900))
      // Refused without a gesture: stay arm-up until someone taps play.
      .catch(() => setPlaying(false));
  }, [ramp]);

  const pause = () => ramp(0, 250, () => audio.current?.pause());

  useEffect(() => {
    play();
    const a = audio.current;
    return () => {
      window.clearInterval(fade.current);
      a?.pause();
    };
  }, [play]);

  const label = ended ? "Played" : playing ? "Now playing" : "Paused";

  return (
    <div className="flex items-center gap-5">
      <audio
        ref={audio}
        src={TRACK.preview}
        preload="auto"
        onPlay={() => {
          setPlaying(true);
          setEnded(false);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        }}
      />

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
          style={{ transform: `rotate(${playing ? 9 + progress * 24 : -10}deg)` }}
        >
          {/* The headshell. */}
          <span className="absolute -left-[2px] bottom-0 w-[7px] h-[9px] rounded-[2px] bg-fg-muted" />
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-[11px] leading-[1.6] uppercase tracking-[0.14em] text-fg-label">{label}</p>
        <p className="text-[15px] leading-[1.35] font-medium tracking-[-0.02em] text-fg mt-1">{TRACK.title}</p>
        <p className="text-[11px] leading-[1.6] text-fg-muted">{TRACK.artist}</p>

        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => (playing ? pause() : play())}
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
            <div className="h-full bg-fg origin-left" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>

        <a
          href={TRACK.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[11px] leading-[1.6] text-fg-muted hover:text-fg underline decoration-border-strong underline-offset-[3px] transition-colors duration-200"
        >
          {ended ? "Hear the rest on Apple Music ↗" : "Apple Music ↗"}
        </a>
      </div>
    </div>
  );
}
