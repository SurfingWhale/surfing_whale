"use client";
// app/components/IridescentClouds.tsx
// Slow, nacre-coloured clouds behind the greeting at the top of the home page.
//
// One fragment shader on one full-size triangle, no library: domain-warped
// noise for the cloud shapes, and a cosine palette driven by the warp for the
// colour, which is what makes it read as a film of oil or mother-of-pearl
// rather than as a rainbow. The dither that was tried here once (bde7345) came
// in through three.js and react-three-fiber; this is the whole thing.
//
// It costs nothing when it is not seen: drawn at a capped resolution (the
// clouds are soft, so the browser's upscale is invisible), at most ~30 frames
// a second, and not at all while scrolled away, while the tab is hidden, or
// past the first frame when the reader asked for reduced motion. Without
// WebGL the CSS gradient under the canvas is what shows.
import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBg;
uniform float uDark;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y) * 1.2;
  float t = uTime * 0.035;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - 0.8 * t));
  vec2 r = vec2(fbm(p + 1.6 * q + vec2(1.7, 9.2) + 0.6 * t),
                fbm(p + 1.6 * q + vec2(8.3, 2.8) - 0.5 * t));
  float f = fbm(p + 1.6 * r);

  // How much cloud is here, 0 to 1. A wide ramp: billows with soft edges
  // and open sky between, not marbling.
  float d = smoothstep(-0.15, 0.4, f);

  // Thin-film colour: the phase follows the warp, so the hue bends round the
  // cloud's own folds instead of running across the screen in bands.
  float phase = 1.7 * f + dot(r, vec2(0.9, 0.6)) + 0.6 * length(q) + 0.22 * uv.x + 0.4 * t;
  vec3 iri = 0.5 + 0.5 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));
  // Pearl leans pink, violet and blue; full-strength green reads as an oil
  // slick, so it is held back.
  iri *= vec3(1.0, 0.86, 1.0);

  vec3 light = mix(iri, vec3(1.0), 0.48);
  // In the dark a full rainbow dims to olive and brick. Violet, cyan and
  // pink only, so the clouds glow rather than stain.
  float w1 = 0.5 + 0.5 * cos(6.28318 * phase);
  float w2 = 0.5 + 0.5 * cos(6.28318 * (phase + 0.33));
  vec3 dark = mix(mix(vec3(0.48, 0.36, 1.0), vec3(0.31, 0.82, 1.0), w1), vec3(1.0, 0.48, 0.85), w2 * 0.6) * 0.5;
  vec3 tint = mix(light, dark, uDark);

  // Pearl cores, colour at the edges.
  float core = smoothstep(0.55, 1.0, d);
  vec3 cloud = mix(tint, mix(vec3(1.0), tint * 1.15, uDark), core * 0.35);
  float rim = d * (1.0 - d) * 4.0;
  cloud += rim * 0.07 * iri;

  vec3 col = mix(uBg, cloud, d * 0.92);

  // Settle into the page at the bottom, where the hero begins.
  col = mix(uBg, col, smoothstep(0.0, 0.42, uv.y));
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

/** The page colour, as the shader needs it: 0–1 floats. */
function pageColour(): { rgb: [number, number, number]; dark: number } {
  const probe = document.createElement("span");
  probe.style.color = "var(--bg)";
  document.body.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g)?.map(Number) ?? [250, 250, 250];
  probe.remove();
  const rgb: [number, number, number] = [m[0] / 255, m[1] / 255, m[2] / 255];
  const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return { rgb, dark: lum < 0.5 ? 1 : 0 };
}

export function IridescentClouds({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    } catch {
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // One triangle that covers the screen; cheaper than two.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uBg = gl.getUniformLocation(prog, "uBg");
    const uDark = gl.getUniformLocation(prog, "uDark");

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now() - 40_000; // begin mid-drift, not from the seed
    let visible = true;
    let raf = 0;
    let last = 0;

    const theme = () => {
      const { rgb, dark } = pageColour();
      gl.uniform3f(uBg, rgb[0], rgb[1], rgb[2]);
      gl.uniform1f(uDark, dark);
    };

    const size = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      // About 0.35 megapixels whatever the screen: plenty for something this
      // soft, and the same cost on a phone as on a 5K display.
      const scale = Math.min(window.devicePixelRatio || 1, Math.sqrt(350_000 / (w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.drawn = "";
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || still.matches) return;
      if (now - last >= 33) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (still.matches) draw(performance.now());
      else if (!raf) raf = requestAnimationFrame(loop);
    };

    theme();
    size();
    draw(performance.now());
    kick();

    const ro = new ResizeObserver(() => {
      size();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);
    const mo = new MutationObserver(() => {
      theme();
      draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      theme();
      draw(performance.now());
    };
    scheme.addEventListener("change", onScheme);
    still.addEventListener("change", kick);
    document.addEventListener("visibilitychange", kick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      scheme.removeEventListener("change", onScheme);
      still.removeEventListener("change", kick);
      document.removeEventListener("visibilitychange", kick);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`iri-canvas ${className}`} />;
}
