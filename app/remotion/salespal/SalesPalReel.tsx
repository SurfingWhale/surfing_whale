// app/remotion/salespal/SalesPalReel.tsx
//
// Thirty seconds on what SalesPal actually argues: the position of a
// conversation already exists, in a chat nobody is going to re-type, so the
// record is READ OUT of it rather than filled in.
//
// The previous film for this page was the build story — artboards, spec rows,
// merges. Those figures are still here, but they are the end card rather than
// the film: a number of artboards is a fact about the making, and the reason
// to watch is the product's own move. The figures that land in scene 06 are
// the ones section 08 of the page states.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, FPS, HEADER, SCENES, STAGE } from "./tokens";
import { Bubble, Card, Count, Field, Label, Phone, Stage } from "./parts";

const S = Object.fromEntries(SCENES.map((s) => [s.id, { from: s.from * FPS, dur: (s.to - s.from) * FPS }])) as
  Record<(typeof SCENES)[number]["id"], { from: number; dur: number }>;

/** The renderer has nothing of the page around it: a composition that only
 *  NAMES a face renders in system-ui. These are the site's own faces, served
 *  out of public/work/salespal/fonts and declared inside the composition. */
const Faces: React.FC = () => (
  <style>{`
    @font-face {
      font-family: 'Oswald SalesPal';
      src: url('${staticFile("work/salespal/fonts/Oswald-var-latin.woff2")}') format('woff2');
      font-weight: 400 700; font-display: block;
    }
    @font-face {
      font-family: 'Jakarta SalesPal';
      src: url('${staticFile("work/salespal/fonts/PlusJakartaSans-var-latin.woff2")}') format('woff2');
      font-weight: 400 700; font-display: block;
    }
    @font-face {
      font-family: 'Geist Mono SalesPal';
      src: url('${staticFile("work/salespal/fonts/GeistMono-var-latin.woff2")}') format('woff2');
      font-weight: 400 600; font-display: block;
    }
  `}</style>
);

/* ------------------------------------------------------------------ 01 chat */
// The conversation that already happened. It arrives, it goes quiet, and the
// position it is in — waiting on a price from me — is sitting in plain text.
const SceneChat: React.FC = () => {
  const frame = useCurrentFrame();
  const quiet = spring({ frame: frame - 108, fps: FPS, config: { damping: 200 }, durationInFrames: 20 });
  return (
    <Stage>
      <Label>The work is already in the chat</Label>
      <Phone x={(STAGE.w - 360) / 2}>
        <Bubble at={6} y={18}>Pak, paket yang kemarin masih ada?</Bubble>
        <Bubble at={20} y={92} out>Masih ada, Bu. Saya kirim rinciannya ya</Bubble>
        <Bubble at={38} y={178}>Boleh. Tapi harganya agak di atas budget kami</Bubble>
        <Bubble at={56} y={264} out>Saya cek dulu, nanti saya kabari</Bubble>
        <Bubble at={74} y={338}>Oke, saya tunggu kabarnya</Bubble>
        <div style={{
          position: "absolute", top: 436, left: 18, right: 18,
          borderTop: `1px dashed ${C.lineStrong}`, paddingTop: 12,
          fontFamily: F.mono, fontSize: 14, letterSpacing: "0.08em",
          color: C.faint, textAlign: "center", opacity: quiet,
        }}>— lalu diam, 19 hari —</div>
      </Phone>
    </Stage>
  );
};

/* ----------------------------------------------------------------- 02 tarik */
// The inversion. Where a CRM puts a form, the app puts one button, and the
// record fills itself from the thread on the left.
const SceneTarik: React.FC = () => {
  const frame = useCurrentFrame();
  const press = spring({ frame: frame - 16, fps: FPS, config: { damping: 14, stiffness: 180 }, durationInFrames: 22 });
  // A single pass of light over the thread: the chat being read, once.
  const sweep = interpolate(frame, [34, 86], [-120, 620], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Stage>
      <Label>Read out of the chat, not typed in</Label>
      <div style={{ position: "absolute", left: 10, top: 0, width: 360, height: STAGE.h }}>
        <Phone x={0} h={620}>
          <Bubble at={0} y={14}>Pak, paket yang kemarin masih ada?</Bubble>
          <Bubble at={0} y={88} out>Masih ada, Bu. Saya kirim rinciannya ya</Bubble>
          <Bubble at={0} y={174}>Boleh. Tapi harganya agak di atas budget kami</Bubble>
          <Bubble at={0} y={260} out>Saya cek dulu, nanti saya kabari</Bubble>
          <Bubble at={0} y={334}>Oke, saya tunggu kabarnya</Bubble>
          <div style={{
            position: "absolute", left: 0, right: 0, top: sweep, height: 90,
            background: `linear-gradient(180deg, transparent, ${C.blue}1f, transparent)`,
          }} />
          {/* The app's own words, and the order it puts them in: pulling from
              the chat is the filled button; typing it is the outline one. */}
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
            <div style={{
              background: C.blue, color: C.blueInk, borderRadius: 10,
              padding: "12px 0", textAlign: "center",
              fontFamily: F.ui, fontSize: 16, fontWeight: 600,
              transform: `scale(${1 - press * 0.04})`,
            }}>Tarik dari WhatsApp</div>
            <div style={{
              marginTop: 8, border: `1px solid ${C.lineStrong}`, color: C.muted,
              borderRadius: 10, padding: "11px 0", textAlign: "center",
              fontFamily: F.ui, fontSize: 16,
            }}>Isi manual</div>
          </div>
        </Phone>
      </div>
      <Card x={440} enter={40}>
        <div style={{
          fontFamily: F.mono, fontSize: 13, letterSpacing: "0.16em",
          textTransform: "uppercase", color: C.blue, marginBottom: 20,
        }}>Prospek · dibaca dari chat</div>
        <Field at={56} label="Nama" value="Ibu Sari — PT Harum Jaya" />
        <Field at={70} label="Posisi" value="Menunggu harga revisi dari saya" accent />
        <Field at={84} label="Terakhir dibalas" value="19 hari lalu" />
        <Field at={98} label="Nilai" value="Rp 24.000.000" />
      </Card>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 03 skor */
// A score is only useful if it can be disagreed with, so the reasons and their
// weights are on screen next to the number.
const REASONS = [
  { at: 44, text: "Balas rata-rata dalam 2 jam", w: "+18", good: true },
  { at: 58, text: "Nilai di atas median prospek", w: "+12", good: true },
  { at: 72, text: "Diam 19 hari sejak balasan terakhir", w: "−24", good: false },
];

const SceneSkor: React.FC = () => (
  <Stage>
    <Label>A score that shows its working</Label>
    <div style={{ position: "absolute", left: 60, top: HEADER + 110 }}>
      <Count at={10} to={66} size={150} color={C.blue} />
      <div style={{
        fontFamily: F.mono, fontSize: 14, letterSpacing: "0.16em",
        textTransform: "uppercase", color: C.faint, marginTop: 12,
      }}>Skor prospek</div>
    </div>
    <div style={{ position: "absolute", left: 360, top: HEADER + 110, width: 580 }}>
      {REASONS.map((r) => <Reason key={r.text} {...r} />)}
      <div style={{
        marginTop: 22, paddingTop: 16, borderTop: `1px solid ${C.line}`,
        fontFamily: F.ui, fontSize: 18, color: C.muted, lineHeight: 1.5,
      }}>
        Setiap baris bisa dibantah. Itu gunanya ditulis.
      </div>
    </div>
  </Stage>
);

const Reason: React.FC<{ at: number; text: string; w: string; good: boolean }> = ({ at, text, w, good }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 10,
      padding: "14px 18px", marginBottom: 10,
      opacity: e, transform: `translateX(${(1 - e) * 16}px)`,
    }}>
      <span style={{ fontFamily: F.ui, fontSize: 19, color: C.ink }}>{text}</span>
      <span style={{
        fontFamily: F.mono, fontSize: 19, fontWeight: 600,
        color: good ? C.good : C.warn,
      }}>{w}</span>
    </div>
  );
};

/* --------------------------------------------------------------- 04 hariini */
// Not a pipeline, not a funnel: three sentences in the imperative.
const TODAY = [
  { at: 24, text: "Kirim harga revisi ke Ibu Sari", meta: "19 hari" },
  { at: 40, text: "Tanya kabar ke Pak Dedi", meta: "7 hari" },
  { at: 56, text: "Tutup atau lepas — CV Mitra Abadi", meta: "34 hari" },
];

const SceneHariIni: React.FC = () => (
  <Stage>
    <Label>The home screen names the work</Label>
    <div style={{ position: "absolute", left: 80, top: HEADER + 80, width: 840 }}>
      <div style={{
        fontFamily: F.display, fontSize: 48, fontWeight: 600,
        color: C.ink, marginBottom: 28,
      }}>Hari ini</div>
      {TODAY.map((t) => <Task key={t.text} {...t} />)}
      <div style={{
        marginTop: 24, fontFamily: F.ui, fontSize: 18, color: C.muted,
      }}>
        Bukan corong penjualan — daftar pekerjaan, tiga baris, di layar pertama.
      </div>
    </div>
  </Stage>
);

const Task: React.FC<{ at: number; text: string; meta: string }> = ({ at, text, meta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 20 });
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 18,
      background: C.card, border: `1px solid ${C.line}`,
      borderLeft: `3px solid ${C.blue}`, borderRadius: 10,
      padding: "18px 22px", marginBottom: 12,
      opacity: e, transform: `translateY(${(1 - e) * 14}px)`,
    }}>
      <span style={{ flex: 1, fontFamily: F.ui, fontSize: 22, fontWeight: 500, color: C.ink }}>{text}</span>
      <span style={{ fontFamily: F.mono, fontSize: 15, color: C.faint }}>{meta}</span>
    </div>
  );
};

/* ------------------------------------------------------------------ 05 lupa */
// The chat is read and then let go of. What stays is what was lifted out.
const SceneLupa: React.FC = () => {
  const frame = useCurrentFrame();
  const gone = interpolate(frame, [12, 62], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stay = spring({ frame: frame - 44, fps: FPS, config: { damping: 200 }, durationInFrames: 24 });
  return (
    <Stage>
      <Label>It reads the chat. It does not keep it.</Label>
      <div style={{ position: "absolute", left: 10, top: 0, width: 360, height: STAGE.h, opacity: gone }}>
        <Phone x={0} h={620}>
          <Bubble at={0} y={14}>Pak, paket yang kemarin masih ada?</Bubble>
          <Bubble at={0} y={88} out>Masih ada, Bu. Saya kirim rinciannya ya</Bubble>
          <Bubble at={0} y={174}>Boleh. Tapi harganya agak di atas budget kami</Bubble>
          <Bubble at={0} y={260} out>Saya cek dulu, nanti saya kabari</Bubble>
          <Bubble at={0} y={334}>Oke, saya tunggu kabarnya</Bubble>
        </Phone>
      </div>
      <div style={{ position: "absolute", left: 440, top: HEADER + 110, width: 480, opacity: stay }}>
        <Field at={44} label="Posisi" value="Menunggu harga revisi dari saya" accent />
        <Field at={52} label="Terakhir dibalas" value="19 hari lalu" />
        <Field at={60} label="Nilai" value="Rp 24.000.000" />
        <div style={{
          marginTop: 10, paddingTop: 16, borderTop: `1px solid ${C.line}`,
          fontFamily: F.mono, fontSize: 15, lineHeight: 1.6, color: C.muted,
        }}>
          Teks percakapan tidak ikut disimpan.<br />Yang tinggal hanya empat baris di atas.
        </div>
      </div>
    </Stage>
  );
};

/* ----------------------------------------------------------------- 06 kartu */
// The end card. Every vertical position here is computed from the line above
// it rather than guessed, because the DALRS film's first cut printed its end
// label straight through the line above — and a storyboard thumbnail is too
// small to show that.
const FIGURES = [
  ["14", "artboard"],
  ["96", "baris spesifikasi"],
  ["41", "merge ke main"],
  ["12", "alur Playwright"],
  ["123", "tes aturan"],
];

const SceneKartu: React.FC = () => {
  const frame = useCurrentFrame();
  const title = spring({ frame, fps: FPS, config: { damping: 200 }, durationInFrames: 26 });
  const sub = spring({ frame: frame - 12, fps: FPS, config: { damping: 200 }, durationInFrames: 22 });
  const rule = spring({ frame: frame - 62, fps: FPS, config: { damping: 200 }, durationInFrames: 24 });
  return (
    <Stage>
      {/* Centred as a column rather than stacked from a guessed top offset.
          The first cut pinned each line to a constant and left the bottom
          third of the frame empty; the DALRS film's end label collided for
          the same reason — positions that are typed in rather than derived. */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: F.display, fontSize: 132, fontWeight: 600,
          lineHeight: 1.02, letterSpacing: "-0.01em", color: C.ink,
          opacity: title, transform: `translateY(${(1 - title) * 14}px)`,
        }}>SalesPal</div>

        <div style={{
          marginTop: 14,
          fontFamily: F.ui, fontSize: 27, lineHeight: 1.5, color: C.muted,
          opacity: sub,
        }}>Membaca percakapan yang sudah ada.</div>

        <div style={{
          marginTop: 56, display: "flex", justifyContent: "center", gap: 40,
        }}>
          {FIGURES.map(([n, l], i) => (
            <FigureCell key={l} n={n} l={l} at={26 + i * 7} />
          ))}
        </div>

        <div style={{ marginTop: 52, textAlign: "center", opacity: rule }}>
          <div style={{ width: 54, height: 1, background: C.lineStrong, margin: "0 auto 18px" }} />
          <span style={{
            fontFamily: F.mono, fontSize: 14, letterSpacing: "0.22em",
            textTransform: "uppercase", color: C.faint,
          }}>Surfing Whale · 2026</span>
        </div>
      </div>
    </Stage>
  );
};

const FigureCell: React.FC<{ n: string; l: string; at: number }> = ({ n, l, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 20 });
  return (
    <div style={{
      width: 176, textAlign: "center",
      opacity: e, transform: `translateY(${(1 - e) * 10}px)`,
    }}>
      <div style={{
        fontFamily: F.display, fontSize: 58, fontWeight: 600,
        color: C.blue, lineHeight: 1, fontVariantNumeric: "tabular-nums",
      }}>{n}</div>
      <div style={{
        fontFamily: F.mono, fontSize: 13, letterSpacing: "0.08em",
        color: C.faint, marginTop: 10, lineHeight: 1.4,
      }}>{l}</div>
    </div>
  );
};

/* ------------------------------------------------------------------- film */
export const SalesPalReel: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Faces />
    <Sequence from={S.chat.from} durationInFrames={S.chat.dur}><SceneChat /></Sequence>
    <Sequence from={S.tarik.from} durationInFrames={S.tarik.dur}><SceneTarik /></Sequence>
    <Sequence from={S.skor.from} durationInFrames={S.skor.dur}><SceneSkor /></Sequence>
    <Sequence from={S.hariini.from} durationInFrames={S.hariini.dur}><SceneHariIni /></Sequence>
    <Sequence from={S.lupa.from} durationInFrames={S.lupa.dur}><SceneLupa /></Sequence>
    <Sequence from={S.kartu.from} durationInFrames={S.kartu.dur}><SceneKartu /></Sequence>
  </AbsoluteFill>
);
