// Shared helpers for the Frontstep FX library.
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
export { THREE, gsap, ScrollTrigger, SplitText, CustomEase, Lenis };

export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
export const small = matchMedia("(max-width: 820px)").matches;
export const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
export const clamp = (a, b, v) => Math.min(b, Math.max(a, v));
export const ease = name => gsap.parseEase(name);

/** Run fn every frame, only while `el` is on screen. */
export function whileVisible(el, fn) {
  let id = 0, on = false;
  const tick = t => { fn(t); if (on) id = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; id = requestAnimationFrame(tick); }
    else if (!e.isIntersecting) { on = false; cancelAnimationFrame(id); }
  }, { rootMargin: "150px" }).observe(el);
}

/** WebGL renderer with sane defaults. */
export function makeRenderer(canvas, { alpha = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: "high-performance" });
  r.setPixelRatio(DPR);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.outputColorSpace = THREE.SRGBColorSpace;
  if (alpha) r.setClearColor(0x000000, 0);
  return r;
}

/** Keep renderer + camera sized to an element. Calls after() on every resize. */
export function autoSize(renderer, camera, el, after) {
  const fit = () => {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    after && after(w, h);
  };
  addEventListener("resize", fit); fit();
  return fit;
}

/** Scroll progress (0..1) of a tall section, scrubbed. Calls onUpdate(p). */
export function scrubSection(section, onUpdate, { start = "top top", end = "bottom bottom", scrub = 1 } = {}) {
  const st = { p: 0 };
  if (reduce) { st.p = 1; onUpdate(1); return st; }
  gsap.to(st, { p: 1, ease: "none", onUpdate: () => onUpdate(st.p), scrollTrigger: { trigger: section, start, end, scrub } });
  onUpdate(0);
  return st;
}

/** Soft round shadow texture for "contact shadows" under objects. */
export function shadowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(0,0,0,.4)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/** Decode a base64 string into an ArrayBuffer (used to ship a .glb inside a JS module). */
export function b64ToBuffer(b64) {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}
