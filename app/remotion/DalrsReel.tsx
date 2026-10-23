// app/remotion/DalrsReel.tsx
//
// Thirty seconds on DALRS, in six scenes. Silent — there is no audio track,
// so nothing has to be unmuted and nothing can start making noise.
//
// Every figure that appears is one the repository can produce: 20.455 defects
// over 90 synthetic spreadsheets, 99,99% found at 3x rates, 0,9 s to trace one
// asset, 3.000 random flows with no custody leak. docs/evaluation.md and the
// property test in packages/domain are where they come from.
//
// NOT in the film: a tap-to-frame figure. The brief asked for "~40 ms";
// docs/native-audit.md lists K7 (tap → next frame) under "Not measured yet",
// and the standard's own target is p75 under 100 ms. A number nobody measured
// does not go on a reel whose whole subject is measuring things.
import React from "react";
import {
  AbsoluteFill, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { C, F, FPS, SCENES } from "./tokens";
import { Box, ChainBlock, Floor, Ticket, project } from "./parts";

const sec = (s: number) => Math.round(s * FPS);
const scene = (id: string) => {
  const s = SCENES.find((x) => x.id === id)!;
  return { from: sec(s.from), durationInFrames: sec(s.to - s.from) };
};

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "absolute", left: 96, top: 72, font: `500 20px ${F.mono}`,
      letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted,
    }}>{children}</div>
  );
}

function Caption({ children, at, len }: { children: React.ReactNode; at: number; len: number }) {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 12, at + len - 12, at + len], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div style={{
      position: "absolute", left: 96, bottom: 84, maxWidth: 960, opacity: o,
      font: `400 30px ${F.display}`, lineHeight: 1.45, color: C.muted,
    }}>{children}</div>
  );
}

// ── 1 · 0–4 s — the floor arrives, the warehouse assembles from below ──────
function Lantai() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grid = interpolate(f, [0, 34], [0, 1], { extrapolateRight: "clamp" });
  const rise = (i: number) => spring({ frame: f - 16 - i * 5, fps, config: { damping: 16, mass: 0.7 } });

  const shelf = [
    { x: 4.2, y: 0.3, w: 1.0, d: 0.9, h: 0.8, z: 0.15 },
    { x: 5.35, y: 0.3, w: 0.9, d: 0.9, h: 0.65, z: 0.15 },
    { x: 4.45, y: 0.3, w: 1.2, d: 0.9, h: 0.7, z: 1.35 },
  ];
  const pallet = [
    { x: 0.7, y: 3.6, w: 1.15, d: 1.0, h: 0.95, z: 0.34 },
    { x: 1.95, y: 3.6, w: 1.15, d: 1.0, h: 0.95, z: 0.34 },
    { x: 1.25, y: 3.95, w: 1.4, d: 1.1, h: 0.85, z: 1.29 },
  ];
  const title = (a: number, b: number) =>
    interpolate(f, [sec(a), sec(b)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Kicker>DALRS · siklus hidup aset</Kicker>
      {/* The scene is parked in the right half so the title has the left to
          itself. Centred, the two crossed. */}
      <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "center", paddingRight: 70 }}>
        <svg width={1120} height={680} viewBox="-400 -268 820 492" style={{ overflow: "visible" }}>
          <g opacity={grid}><Floor nx={8} ny={8} /></g>
          <g style={{ transform: `translateY(${(1 - rise(0)) * 90}px)`, opacity: rise(0) }}>
            <Box x={4.2} y={0.3} w={0.14} d={0.14} h={3.1} skin="dark" />
            <Box x={7.6} y={0.3} w={0.14} d={0.14} h={3.1} skin="dark" />
            <Box x={4.2} y={0.3} z={0.05} w={3.54} d={1.2} h={0.1} skin="dark" />
            <Box x={4.2} y={0.3} z={1.25} w={3.54} d={1.2} h={0.1} skin="dark" />
          </g>
          {shelf.map((b, i) => (
            <g key={i} style={{ transform: `translateY(${(1 - rise(i + 1)) * 70}px)`, opacity: rise(i + 1) }}>
              <Box {...b} tape />
            </g>
          ))}
          <g style={{ transform: `translateY(${(1 - rise(4)) * 70}px)`, opacity: rise(4) }}>
            <Box x={0.6} y={3.6} w={2.6} d={2.2} h={0.12} skin="wood" />
            <Box x={0.6} y={3.6} z={0.26} w={2.6} d={2.2} h={0.08} skin="wood" />
          </g>
          {pallet.map((b, i) => (
            <g key={i} style={{ transform: `translateY(${(1 - rise(i + 5)) * 70}px)`, opacity: rise(i + 5) }}>
              <Box {...b} tape />
            </g>
          ))}
        </svg>
      </AbsoluteFill>
      <div style={{
        position: "absolute", left: 96, bottom: 110, maxWidth: 860,
        opacity: title(1.1, 1.9), transform: `translateY(${(1 - title(1.1, 1.9)) * 22}px)`,
      }}>
        <div style={{
          font: `820 78px ${F.display}`, fontStretch: "118%", lineHeight: 1.0,
          letterSpacing: "-0.035em", color: C.ink,
        }}>
          Tahu siapa memegang<br />setiap barang, setiap saat.
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── 2 · 4–10 s — a carton rides the belt through the scan gate ─────────────
function Scan() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const travel = interpolate(f, [0, sec(3.6)], [0, 1], { extrapolateRight: "clamp" });
  const a = project(0.4, 2.2, 0.69), b = project(4.6, 2.2, 0.69);
  const dx = (b[0] - a[0]) * travel, dy = (b[1] - a[1]) * travel;
  // The beam fires as the carton passes the gate, and only then.
  const atGate = travel > 0.44 && travel < 0.72;
  const beam = atGate ? 0.18 + 0.26 * Math.abs(Math.sin(f * 0.34)) : 0.08;
  const ticket = spring({ frame: f - sec(2.4), fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Kicker>Gerbang scan G-1</Kicker>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width={1540} height={660} viewBox="-290 -170 620 270" style={{ overflow: "visible" }}>
          <Floor nx={7} ny={6} />
          <Box x={0.3} y={2.1} z={0.55} w={5.0} d={0.75} h={0.14} skin="dark" />
          {[0.45, 4.9].map((lx) => (
            <React.Fragment key={lx}>
              <Box x={lx} y={2.15} w={0.12} d={0.12} h={0.55} skin="dark" />
              <Box x={lx} y={2.7} w={0.12} d={0.12} h={0.55} skin="dark" />
            </React.Fragment>
          ))}
          {/* rollers: a dash offset that moves, not a CSS animation */}
          <path
            d={`M${project(0.4, 2.47, 0.69)}L${project(5.2, 2.47, 0.69)}`}
            stroke={C.ink} strokeWidth={1} strokeDasharray="2 6" strokeDashoffset={-f * 1.4}
          />
          <Box x={2.5} y={1.9} w={0.16} d={0.16} h={2.0} skin="dark" />
          <Box x={2.5} y={3.0} w={0.16} d={0.16} h={2.0} skin="dark" />
          <Box x={2.5} y={1.9} z={2.0} w={0.16} d={1.26} h={0.18} skin="dark" />
          <g transform={`translate(${dx} ${dy})`}>
            <Box x={0.4} y={2.2} z={0.69} w={0.8} d={0.6} h={0.55} tape />
          </g>
          <path
            d={`M${project(2.58, 1.98, 1.95)}L${project(2.58, 1.98, 0.7)}L${project(2.58, 3.1, 0.7)}L${project(2.58, 3.1, 1.95)}Z`}
            fill={C.tape} opacity={beam}
          />
        </svg>
      </AbsoluteFill>
      <div style={{
        position: "absolute", right: 110, top: 150,
        opacity: ticket, transform: `translateY(${(1 - ticket) * 40}px) rotate(-3deg)`,
      }}>
        <Ticket kind="SCAN" id="AST-000123" line="rak b-02 · jkt-warehouse" width={330} />
      </div>
      <Caption at={sec(0.5)} len={sec(5.2)}>
        Setiap barang punya satu ID. Serial yang mirip ditahan, bukan digabung diam-diam.
      </Caption>
    </AbsoluteFill>
  );
}

// ── 3 · 10–16 s — four steps, and custody turns over at exactly one ────────
const STEPS = [
  { n: "1", t: "Diminta", s: "pemegang mengajukan" },
  { n: "2", t: "Disetujui", s: "approver region, bukan pemohon" },
  { n: "3", t: "BAST", s: "bukti serah terima" },
  { n: "4", t: "Pemegang berganti", s: "sekali, di sini" },
];

function Serah() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lit = (i: number) => spring({ frame: f - sec(0.5) - i * sec(0.85), fps, config: { damping: 18 } });
  const ticket = spring({ frame: f - sec(2.5), fps, config: { damping: 14 } });
  const flag = spring({ frame: f - sec(4.0), fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Kicker>Serah terima</Kicker>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 40 }}>
        <div style={{ display: "flex", gap: 34, alignItems: "flex-start" }}>
          {STEPS.map((s, i) => {
            const on = lit(i);
            const key = i === 3;
            return (
              <div key={s.n} style={{ width: 290, opacity: 0.18 + 0.82 * on, transform: `translateY(${(1 - on) * 26}px)` }}>
                <div style={{
                  width: 62, height: 62, borderRadius: "50%", display: "grid", placeItems: "center",
                  background: key && flag > 0.4 ? C.ink : C.bg, color: key && flag > 0.4 ? C.onInk : C.ink,
                  boxShadow: `0 0 0 2px ${C.ink}`, font: `600 26px ${F.mono}`,
                }}>{s.n}</div>
                <div style={{ marginTop: 20, font: `720 36px ${F.display}`, fontStretch: "110%", color: C.ink, lineHeight: 1.1 }}>{s.t}</div>
                <div style={{ marginTop: 10, font: `400 23px ${F.display}`, color: C.muted, lineHeight: 1.35 }}>{s.s}</div>
                {key && (
                  <div style={{
                    marginTop: 18, display: "inline-block", padding: "8px 16px", borderRadius: 999,
                    background: C.tape, color: C.ink, font: `600 20px ${F.mono}`,
                    opacity: flag, transform: `scale(${0.9 + 0.1 * flag})`,
                  }}>custody berpindah</div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <div style={{
        position: "absolute", left: 660, bottom: 70, opacity: ticket,
        transform: `translateY(${(1 - ticket) * 44}px) rotate(2deg)`,
      }}>
        <Ticket kind="BAST" id="MV-0007" line="user-a → user-b · jkt-hq-5f" width={320} />
      </div>
    </AbsoluteFill>
  );
}

// ── 4 · 16–21 s — one row is edited and the chain breaks at that row ───────
function Rantai() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const show = (i: number) => spring({ frame: f - i * sec(0.3), fps, config: { damping: 18 } });
  const cut = interpolate(f, [sec(2.2), sec(3.0)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blocks = [["#41", "a3f9…"], ["#42", "7c10…"], ["#43", "e4d2…"], ["#44", "91bb…"]];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Kicker>Jejak audit berantai hash</Kicker>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width={1560} height={320} viewBox="0 0 1180 240" style={{ overflow: "visible" }}>
          {blocks.map(([n, h], i) => (
            <g key={n} opacity={show(i)} transform={`translate(0 ${(1 - show(i)) * 20})`}>
              <ChainBlock n={n} hash={h} broken={i === 2 && cut > 0.5} x={i * 280} y={60} />
              {i < 3 && (
                <path
                  d={`M${138 + i * 280} 98 H${i * 280 + 280}`}
                  stroke={C.ink} strokeWidth={4}
                  strokeDasharray={i >= 1 && cut > 0.5 ? "7 7" : "none"}
                  opacity={i >= 1 && cut > 0.5 ? 0.55 : 1}
                />
              )}
            </g>
          ))}
          <g opacity={cut}>
            <text x={608} y={44} textAnchor="middle" fill={C.ink} style={{ font: `650 40px ${F.mono}` }}>≠</text>
            <text x={608} y={200} textAnchor="middle" fill={C.ink} style={{ font: `500 22px ${F.mono}` }}>#43 diubah</text>
          </g>
        </svg>
      </AbsoluteFill>
      <Caption at={sec(0.4)} len={sec(4.3)}>
        Setiap kejadian menyimpan hash kejadian sebelumnya. Satu baris diubah, rantainya putus tepat di baris itu.
      </Caption>
    </AbsoluteFill>
  );
}

// ── 5 · 21–26 s — the exception ticket, then the numbers count up ──────────
//
// Math.round on the counts, not just on the final value. A count-up renders
// every intermediate number too, and 20455 part-way through is 20426.941 —
// which toLocaleString('id-ID') prints as "20.426,941", a figure with a
// thousands separator AND a decimal comma that nobody can read at 58px going
// past in half a second. The two real decimals keep theirs.
const STATS = [
  { v: 20455, fmt: (n: number) => Math.round(n).toLocaleString("id-ID"), l: "cacat disisipkan ke 90 spreadsheet sintetis" },
  { v: 99.99, fmt: (n: number) => `${n.toFixed(2).replace(".", ",")}%`, l: "ditemukan, bahkan saat data 3× lebih berantakan" },
  { v: 0.9, fmt: (n: number) => `${n.toFixed(1).replace(".", ",")} dtk`, l: "untuk menelusuri histori satu barang" },
  { v: 3000, fmt: (n: number) => Math.round(n).toLocaleString("id-ID"), l: "alur acak per pengujian, tanpa custody bocor" },
];

function Bukti() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ticket = spring({ frame: f - sec(0.2), fps, config: { damping: 15 } });
  const away = interpolate(f, [sec(1.5), sec(2.1)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Kicker>Rekonsiliasi bulanan</Kicker>
      <div style={{
        position: "absolute", left: "50%", top: 190, marginLeft: -170,
        opacity: ticket * (1 - away), transform: `translateY(${(1 - ticket) * 40 - away * 70}px) rotate(-2deg)`,
      }}>
        <Ticket kind="TIKET CEK" id="AST-000124" line="Exception: lokasi beda" dark width={340} />
      </div>
      <AbsoluteFill style={{
        alignItems: "center", justifyContent: "center", opacity: away,
        transform: `translateY(${(1 - away) * 30}px)`,
      }}>
        <div style={{ display: "flex", gap: 26, padding: "0 90px" }}>
          {STATS.map((s, i) => {
            const p = interpolate(f, [sec(2.0) + i * 5, sec(3.5) + i * 5], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const eased = 1 - Math.pow(1 - p, 3);
            return (
              <div key={s.l} style={{
                flex: 1, padding: "34px 30px", borderRadius: 22,
                background: `linear-gradient(180deg, ${C.bg}, ${C.surface})`,
                boxShadow: `0 0 0 1px ${C.line}, 0 18px 40px -22px rgba(14,17,22,.3)`,
              }}>
                <div style={{
                  font: `600 58px ${F.mono}`, letterSpacing: "-0.04em", color: C.ink,
                  fontVariantNumeric: "tabular-nums", lineHeight: 1,
                }}>{s.fmt(s.v * eased)}</div>
                <div style={{ marginTop: 16, font: `400 22px ${F.display}`, color: C.muted, lineHeight: 1.35 }}>{s.l}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── 6 · 26–30 s — the mark, the line, the address ──────────────────────────
function Kartu() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - 4, fps, config: { damping: 18 } });
  const b = spring({ frame: f - sec(0.8), fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <svg width={120} height={120} viewBox="0 0 32 32" fill="none"
        style={{ opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
        <path d="M16 4 28 10v13L16 29 4 23V10L16 4Z M4 10l12 6 12-6 M16 16v13"
          stroke={C.ink} strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M10 7l12 6v13" stroke={C.tape} strokeWidth={2.5} strokeLinejoin="round" />
      </svg>
      <div style={{
        marginTop: 36, font: `820 76px ${F.display}`, fontStretch: "118%",
        letterSpacing: "-0.03em", color: C.ink, opacity: a,
      }}>DALRS</div>
      <div style={{
        marginTop: 22, font: `400 34px ${F.display}`, color: C.muted, opacity: b,
        transform: `translateY(${(1 - b) * 16}px)`, textAlign: "center", maxWidth: 1100,
      }}>Tahu siapa memegang setiap barang, setiap saat.</div>
      <div style={{
        marginTop: 44, font: `500 26px ${F.mono}`, letterSpacing: "0.1em", color: C.ink, opacity: b,
      }}>dalrs.vercel.app</div>
    </AbsoluteFill>
  );
}

/**
 * The two faces, declared inside the film.
 *
 * The renderer runs in its own headless browser with nothing of the page
 * around it, so a composition that only *names* Archivo renders in system-ui
 * and nobody notices until the mp4 is watched. staticFile() points at the
 * copies in public/work/dalrs/fonts, which is also where the page loads them
 * from — one pair of files, one family name, so the <Player> and the render
 * cannot drift apart.
 */
function Faces() {
  return (
    <style>{`
      @font-face {
        font-family: 'Archivo';
        src: url('${staticFile("work/dalrs/fonts/Archivo-latin.woff2")}') format('woff2');
        font-weight: 400 800; font-stretch: 62% 125%; font-display: block;
      }
      @font-face {
        font-family: 'IBM Plex Mono';
        src: url('${staticFile("work/dalrs/fonts/IBMPlexMono-400-latin.woff2")}') format('woff2');
        font-weight: 400; font-display: block;
      }
      @font-face {
        font-family: 'IBM Plex Mono';
        src: url('${staticFile("work/dalrs/fonts/IBMPlexMono-600-latin.woff2")}') format('woff2');
        font-weight: 600; font-display: block;
      }
    `}</style>
  );
}

export function DalrsReel() {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: F.display }}>
      <Faces />
      <Sequence {...scene("lantai")}><Lantai /></Sequence>
      <Sequence {...scene("scan")}><Scan /></Sequence>
      <Sequence {...scene("serah")}><Serah /></Sequence>
      <Sequence {...scene("rantai")}><Rantai /></Sequence>
      <Sequence {...scene("bukti")}><Bukti /></Sequence>
      <Sequence {...scene("kartu")}><Kartu /></Sequence>
    </AbsoluteFill>
  );
}
