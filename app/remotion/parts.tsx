// app/remotion/parts.tsx
//
// The pieces every scene is built from: the isometric projection DALRS draws
// with, the ticket, and the chain block. Kept here so the six scenes read as
// a storyboard rather than as geometry.
import React from "react";
import { C, F } from "./tokens";

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

export type Pt = [number, number];

/**
 * The same projection as apps/web/src/iso.ts — (x−y)·cos30·U across,
 * (x+y)·0.5·U − z·U down — so a crate drawn here sits at the same angle as
 * every drawing on DALRS's own pages. Copied rather than imported because
 * that module builds SVG strings for a different runtime; the maths is the
 * part worth sharing, and it is four lines.
 */
export const project = (x: number, y: number, z: number, U = 34): Pt => [
  (x - y) * COS * U,
  (x + y) * SIN * U - z * U,
];

const face = (ps: Pt[]) => `M${ps.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}Z`;

export function Box({
  x, y, z = 0, w, d, h, U = 34, skin = "light", tape = false, opacity = 1,
}: {
  x: number; y: number; z?: number; w: number; d: number; h: number;
  U?: number; skin?: "light" | "dark" | "wood"; tape?: boolean; opacity?: number;
}) {
  const P = (a: number, b: number, c: number) => project(a, b, c, U);
  const fills = {
    light: ["#ffffff", "#e8eaee", "#cfd3d9"],
    dark: ["#3a3d43", "#24262b", "#15161a"],
    wood: ["#e4e1da", "#cfcac0", "#b9b3a7"],
  }[skin];
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  const a = P(x, y + d / 2, z + h), b = P(x + w, y + d / 2, z + h);
  const c = P(x + w, y + d / 2, z + h * 0.15);
  const edge = { stroke: C.ink, strokeWidth: 1.3, strokeLinejoin: "round" as const };
  return (
    <g opacity={opacity}>
      <path d={face(left)} fill={fills[1]} {...edge} />
      <path d={face(right)} fill={fills[2]} {...edge} />
      <path d={face(top)} fill={fills[0]} {...edge} />
      {tape && (
        <>
          <path d={`M${a}L${b}`} stroke={C.tape} strokeWidth={0.2 * U} fill="none" />
          <path d={`M${b}L${c}`} stroke={C.tapeShade} strokeWidth={0.2 * U} fill="none" />
        </>
      )}
    </g>
  );
}

/** The dashed floor the scene assembles onto. */
export function Floor({ nx, ny, U = 34, reveal = 1 }: { nx: number; ny: number; U?: number; reveal?: number }) {
  const lines: React.ReactNode[] = [];
  for (let i = 0; i <= Math.round(nx * reveal); i++) {
    const a = project(i, 0, 0, U), b = project(i, ny, 0, U);
    lines.push(<line key={`x${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
  }
  for (let j = 0; j <= Math.round(ny * reveal); j++) {
    const a = project(0, j, 0, U), b = project(nx, j, 0, U);
    lines.push(<line key={`y${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
  }
  return <g stroke={C.lineStrong} strokeWidth={1} strokeDasharray="2 5">{lines}</g>;
}

/**
 * The ticket from DALRS's landing page: a torn stub. The notches are a mask
 * of two circles, which is how the artifact draws it; `dark` is the exception
 * ticket.
 */
export function Ticket({
  kind, id, line, dark = false, width = 300,
}: { kind: string; id: string; line: string; dark?: boolean; width?: number }) {
  const fg = dark ? C.onInk : C.ink;
  const bg = dark ? C.ink : C.bg;
  const sub = dark ? "#a7abb3" : C.muted;
  const maskId = `notch-${id.replace(/[^a-z0-9]/gi, "")}`;
  const h = 150;
  return (
    <svg width={width} height={(width / 300) * h} viewBox={`0 0 300 ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <mask id={maskId}>
          <rect width="300" height={h} fill="#fff" rx="10" />
          <circle cx="0" cy={h * 0.58} r="11" fill="#000" />
          <circle cx="300" cy={h * 0.58} r="11" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <rect width="300" height={h} rx="10" fill={bg} stroke={C.ink} strokeWidth={2.4} />
        <text x="22" y="32" fill={sub} style={{ font: `600 15px ${F.mono}` }}>{kind}</text>
        <text x="278" y="32" textAnchor="end" fill={sub} style={{ font: `600 15px ${F.mono}` }}>valid</text>
        <text x="22" y="72" fill={fg} style={{ font: `650 30px ${F.mono}`, letterSpacing: "-0.02em" }}>{id}</text>
        <text x="22" y="99" fill={fg} style={{ font: `400 16px ${F.display}` }}>{line}</text>
        <line x1="0" y1={h * 0.78} x2="300" y2={h * 0.78} stroke={dark ? "#4a4d54" : C.lineStrong} strokeWidth={2} strokeDasharray="6 5" />
        {Array.from({ length: 26 }).map((_, i) => (
          <rect key={i} x={22 + i * 10} y={h * 0.82} width={i % 3 ? 2.2 : 4} height={18} fill={fg} />
        ))}
      </g>
    </svg>
  );
}

/** One link of the audit chain. `broken` is the row somebody edited. */
export function ChainBlock({
  n, hash, broken = false, x, y,
}: { n: string; hash: string; broken?: boolean; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="138" height="76" rx="10" fill={C.bg} stroke={C.ink} strokeWidth={broken ? 3 : 1.6} />
      {broken && <rect width="138" height="76" rx="10" fill="rgba(0,0,0,.05)" />}
      <text x="16" y="32" fill={C.ink} style={{ font: `600 19px ${F.mono}` }}>{n}</text>
      <text x="16" y="58" fill={broken ? C.ink : C.muted} style={{ font: `400 17px ${F.mono}` }}>{hash}</text>
    </g>
  );
}
