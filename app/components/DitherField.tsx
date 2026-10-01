// app/components/DitherField.tsx
//
// The ground the name stands on: slow marbled waves, ordered-dithered into
// ink dots, after Maxime Heckel's "dithered waves" — rebuilt as one raw WebGL
// fragment shader instead of react-three-fiber, so the first screen does not
// pay ~150KB of three.js for a background.
//
// It belongs to the header: dense behind the bar, thinning just below it, and
// gone well before the name, so the type stands on a clean canvas with open
// space above it. The dots are the page's own ink at low opacity, read from
// --fg, so they follow the theme.
//
// Cheap on purpose: drawn at a third of the resolution and scaled up with
// pixelated sampling (the dots are meant to be blocky), about 30 frames a
// second, and not at all while the hero is off screen. With reduced motion it
// draws one still frame. Without WebGL it draws nothing and the page is
// exactly what it was.
"use client";

import { useEffect, useRef } from "react";

/** CSS pixels per dither dot. */
const DOT = 3;
const FRAME_MS = 33;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uInk;
uniform float uAlpha;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

// Ordered (Bayer) dithering without a lookup table: the 8x8 matrix built
// from the 2x2 one, folded twice.
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
#define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
#define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  // A fixed scale in dither dots, not a fraction of the canvas: the band is
  // short and wide, and scaling by its height would squash the waves flat.
  vec2 p = frag / 120.0;
  float t = uTime * 0.05;

  // Domain warping: the field is read through itself twice, which is what
  // turns plain noise into slow marbled bands.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.6 * t),
                fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.5 * t));
  float f = fbm(p + 3.0 * r);
  float tone = smoothstep(0.30, 0.95, f * f * 1.7 + 0.30 * length(q));

  // Full through the header, then fading, and gone before the band ends —
  // the band's last stretch is already empty page.
  float fromTop = 1.0 - uv.y;
  tone *= 1.0 - smoothstep(0.32, 0.9, fromTop);
  // Never a solid sheet, even at the densest point.
  tone *= 0.85;

  float on = step(bayer8(frag) + 0.002, tone);
  gl_FragColor = vec4(uInk * uAlpha * on, uAlpha * on);
}
`;

function ink(): { rgb: [number, number, number]; alpha: number } {
  const root = document.documentElement;
  const hex = getComputedStyle(root).getPropertyValue("--fg").trim();
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  const rgb: [number, number, number] = m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [0.07, 0.07, 0.07];
  // Light dots on a dark page read brighter than dark dots on a light one.
  const dark = rgb[0] > 0.5;
  return { rgb, alpha: dark ? 0.2 : 0.3 };
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("DitherField:", gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export function DitherField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // One triangle that covers the whole canvas.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uInk = gl.getUniformLocation(program, "uInk");
    const uAlpha = gl.getUniformLocation(program, "uAlpha");

    const setInk = () => {
      const { rgb, alpha } = ink();
      gl.uniform3f(uInk, rgb[0], rgb[1], rgb[2]);
      gl.uniform1f(uAlpha, alpha);
    };
    setInk();

    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    // A still frame is taken a little way in, where the bands have formed.
    const STILL_AT = 18;

    const draw = (now: number) => {
      gl.uniform1f(uTime, still.matches ? STILL_AT : STILL_AT + (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.drawn = "";
    };

    const resize = () => {
      const w = Math.max(1, Math.ceil(canvas.clientWidth / DOT));
      const h = Math.max(1, Math.ceil(canvas.clientHeight / DOT));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
      draw(performance.now());
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    resize();

    let raf = 0;
    let last = 0;
    let visible = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (visible && !still.matches) raf = requestAnimationFrame(loop);
      else draw(performance.now());
    };
    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    seen.observe(canvas);
    still.addEventListener("change", run);

    // The theme can change without a reload: the toggle sets data-theme, and
    // with none set the system preference decides.
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    const retint = () => {
      setInk();
      draw(performance.now());
    };
    const themed = new MutationObserver(retint);
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    scheme.addEventListener("change", retint);

    return () => {
      cancelAnimationFrame(raf);
      sizes.disconnect();
      seen.disconnect();
      themed.disconnect();
      still.removeEventListener("change", run);
      scheme.removeEventListener("change", retint);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      // Fades in once the first frame is on it, rather than popping.
      className={`opacity-0 data-[drawn]:opacity-100 transition-opacity duration-700 [image-rendering:pixelated] ${className}`}
    />
  );
}
