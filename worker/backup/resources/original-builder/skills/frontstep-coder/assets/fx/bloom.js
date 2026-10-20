// FX: a generative bouquet that blooms with scroll and moves away from the cursor. Canvas 2D, no assets.
// mountBloom({ section, canvas, stage, palette, accent, greens, count, height })
import { DPR, small, fine, reduce, gsap, clamp, ease, whileVisible } from "./common.js";

export function mountBloom({
  section, canvas, stage = canvas.parentElement,
  palette = ["#F4C7CF", "#EBA3B3", "#F6D2B8", "#FFF3E2", "#DCCFF1", "#F9E1E5"],
  accent = "#B84A62",               // rare deep flower
  greens = ["#7E9C77", "#5E7E5B", "#A3B88F"],
  stem = "#6F8C68",
  count = small ? 34 : 64,
  top = 0.6                         // where the bouquet starts (fraction of height)
}) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, flowers = [], leaves = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random()) / 3 - 0.5;

  const build = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const tie = { x: W / 2, y: H * 1.08 };
    flowers = Array.from({ length: count }, () => {
      const depth = Math.random();
      const type = Math.random() < 0.45 ? "rose" : Math.random() < 0.6 ? "cosmos" : "bud";
      return {
        x: W / 2 + gauss() * W * (small ? 1.3 : 0.95),
        y: H * (top + depth * (0.94 - top)) + rnd(-16, 16),
        size: (small ? 26 : 38) * (0.7 + depth * 0.9) * rnd(0.8, 1.2),
        type, depth, tie,
        color: Math.random() < 0.07 ? accent : palette[Math.floor(Math.random() * palette.length)],
        delay: rnd(0, 0.55) + (1 - depth) * 0.1, phase: rnd(0, 6.28), rot: rnd(0, 6.28),
        petals: type === "cosmos" ? 8 : type === "rose" ? 6 : 3
      };
    }).sort((a, b) => a.depth - b.depth);
    leaves = Array.from({ length: Math.round(count * 0.55) }, () => ({ x: W / 2 + gauss() * W * 0.9, y: H * rnd(top + 0.02, 1.02), len: rnd(40, 90), ang: rnd(-2.6, -0.5), color: greens[Math.floor(Math.random() * greens.length)], delay: rnd(0, 0.3) }));
  };
  const petal = (len, wid) => {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(wid, -len * 0.3, wid * 0.8, -len * 0.92, 0, -len);
    ctx.bezierCurveTo(-wid * 0.8, -len * 0.92, -wid, -len * 0.3, 0, 0);
    ctx.fill();
  };
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = c => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  };

  const st = { p: reduce ? 1 : 0 };
  const mouse = { x: -9999, y: -9999 };
  if (fine) stage.addEventListener("pointermove", e => { const b = stage.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top; });
  stage.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  const draw = t => {
    const time = (t || 0) / 1000;
    ctx.clearRect(0, 0, W, H);
    leaves.forEach(l => {
      const g = clamp(0, 1, (st.p + 0.25 - l.delay) / 0.4); if (g <= 0) return;
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.ang + Math.sin(time * 0.7 + l.x) * 0.03);
      ctx.fillStyle = l.color; ctx.globalAlpha = 0.9; petal(l.len * g, l.len * 0.22 * g); ctx.restore();
    });
    ctx.globalAlpha = 1;
    flowers.forEach(f => {
      const b = ease("power2.out")(clamp(0, 1, (st.p - f.delay) / 0.4));
      const dx = f.x - mouse.x, dy = f.y - mouse.y, d = Math.hypot(dx, dy);
      const push = d < 160 ? (1 - d / 160) * 22 : 0;
      const hx = f.x + Math.sin(time * 0.8 + f.phase) * 4 + (d ? dx / d : 0) * push;
      const hy = f.y + (d ? dy / d : 0) * push * 0.5;
      ctx.strokeStyle = stem; ctx.lineWidth = 1.4 + f.depth;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + f.tie.x) / 2 + (hx - f.tie.x) * 0.2, (hy + f.tie.y) / 2, f.tie.x, f.tie.y); ctx.stroke();
      const s = f.size * (0.28 + 0.72 * b);
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(f.rot * b + Math.sin(time * 0.5 + f.phase) * 0.05);
      const rings = f.type === "rose" ? 3 : 1;
      for (let ring = 0; ring < rings; ring++) {
        const n = f.petals + (f.type === "rose" ? ring : 0), rs = 1 - ring * 0.28, open = b * (1 - ring * 0.25);
        ctx.fillStyle = ring === 0 ? f.color : shade(f.color, ring === 1 ? -0.08 : -0.16);
        for (let i = 0; i < n; i++) {
          const radial = (i / n) * Math.PI * 2 + ring * 0.4, closed = (i - (n - 1) / 2) * 0.22;
          ctx.save(); ctx.rotate(closed + (radial - closed) * open);
          petal(s * rs * (f.type === "cosmos" ? 1.15 : f.type === "bud" ? 0.9 : 0.85) * (0.55 + 0.45 * open), s * rs * (f.type === "cosmos" ? 0.28 : f.type === "bud" ? 0.5 : 0.62));
          ctx.restore();
        }
      }
      ctx.fillStyle = f.type === "cosmos" ? "#E9B949" : shade(f.color, -0.25);
      ctx.beginPath(); ctx.arc(0, 0, s * (f.type === "cosmos" ? 0.16 : 0.1) * (0.5 + b * 0.5), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  };
  build(); addEventListener("resize", build);
  if (reduce) draw(0); else {
    whileVisible(stage, draw);
    gsap.to(st, { p: 1, ease: "none", scrollTrigger: { trigger: section, start: "top 60%", end: "bottom bottom", scrub: 1 } });
  }
}
