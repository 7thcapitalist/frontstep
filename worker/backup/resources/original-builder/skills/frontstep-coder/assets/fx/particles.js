// FX: thousands of particles rise like steam/smoke/sparks, then gather into the business name
// as you scroll. The cursor scatters them. Works for any business: just pass its name.
// mountParticleWord({ section, canvas, stage, text, font, colors, source: "steam"|"cloud" })
import { THREE, makeRenderer, autoSize, whileVisible, scrubSection, reduce, fine, small, clamp, ease } from "./common.js";

export function mountParticleWord({
  section, canvas, stage = canvas.parentElement,
  text = "GRÃO", font = '800 220px "Unbounded", sans-serif',
  colors = ["#F3E6D3", "#C8955F", "#8A5A3B"], size = small ? 3 : 3.8,
  max = small ? 5000 : 11000, source = "steam", wordY = 0.1   // wordY: offset up (fraction of height)
}) {
  const r = makeRenderer(canvas, { alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  let W = 1, H = 1, N = 0, geo, start, target, delay, seed, pts;

  const sampleText = () => {
    const c = document.createElement("canvas");
    const cw = Math.round(Math.min(W * 0.86, 1400)), ch = Math.round(cw * 0.42);
    c.width = cw; c.height = ch;
    const g = c.getContext("2d");
    let px = parseInt(font.match(/(\d+)px/)[1], 10);
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff";
    // shrink the font until the word fits the box
    do { g.font = font.replace(/\d+px/, px + "px"); px -= 4; } while (g.measureText(text).width > cw * 0.96 && px > 20);
    g.fillText(text, cw / 2, ch / 2);
    const d = g.getImageData(0, 0, cw, ch).data, out = [];
    const step = Math.max(2, Math.round(Math.sqrt((cw * ch * 0.18) / max)));
    for (let y = 0; y < ch; y += step) for (let x = 0; x < cw; x += step) if (d[(y * cw + x) * 4 + 3] > 140) out.push(x - cw / 2, ch / 2 - y + H * wordY);
    return out;
  };

  const build = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    camera.left = -W / 2; camera.right = W / 2; camera.top = H / 2; camera.bottom = -H / 2; camera.updateProjectionMatrix();
    const t = sampleText(); N = Math.min(max, t.length / 2);
    target = new Float32Array(N * 3); start = new Float32Array(N * 3); delay = new Float32Array(N); seed = new Float32Array(N);
    const col = new Float32Array(N * 3), sz = new Float32Array(N), tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const j = Math.floor(Math.random() * (t.length / 2)) * 2;       // random subset of the sampled pixels
      target[i * 3] = t[j] + (Math.random() - 0.5) * 1.5; target[i * 3 + 1] = t[j + 1] + (Math.random() - 0.5) * 1.5;
      seed[i] = Math.random(); delay[i] = Math.random() * 0.35 + (t[j] / W + 0.5) * 0.15;
      tmp.set(colors[Math.random() < 0.6 ? 0 : Math.random() < 0.6 ? 1 : 2]); col.set([tmp.r, tmp.g, tmp.b], i * 3);
      sz[i] = size * (0.6 + Math.random() * 0.9);
    }
    if (pts) { scene.remove(pts); geo.dispose(); }
    geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uDPR: { value: r.getPixelRatio() } },
      vertexShader: `attribute float size; varying vec3 vColor; uniform float uDPR;
        void main(){ vColor = color; gl_PointSize = size * uDPR; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `varying vec3 vColor; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vColor, smoothstep(.5, .1, d) * .85); }`,
      vertexColors: true
    });
    pts = new THREE.Points(geo, mat); scene.add(pts);
  };

  const mouse = { x: 1e5, y: 1e5 };
  if (fine) stage.addEventListener("pointermove", e => { const b = stage.getBoundingClientRect(); mouse.x = e.clientX - b.left - W / 2; mouse.y = H / 2 - (e.clientY - b.top); });
  stage.addEventListener("pointerleave", () => { mouse.x = mouse.y = 1e5; });

  let p = reduce ? 1 : 0;
  const frame = tms => {
    const t = (tms || 0) / 1000, pos = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const s = seed[i];
      // source motion: a curling column of steam rising from the bottom center (or a drifting cloud)
      let sx, sy;
      if (source === "steam") {
        const life = (t * 0.12 + s) % 1;
        sy = -H / 2 + life * H * 1.05;
        sx = Math.sin(life * 9 + s * 20 + t * 0.8) * (30 + life * W * 0.18) + Math.sin(s * 50) * 20;
      } else {
        sx = Math.sin(s * 91 + t * 0.3) * W * 0.45; sy = Math.cos(s * 57 + t * 0.25) * H * 0.4;
      }
      const m = ease("power3.inOut")(clamp(0, 1, (p - 0.12 - delay[i] * 0.5) / 0.35));
      let x = sx + (target[i * 3] - sx) * m, y = sy + (target[i * 3 + 1] - sy) * m;
      // settled particles breathe a little, and scatter away from the cursor
      x += Math.sin(t * 1.3 + s * 40) * 0.8 * m; y += Math.cos(t * 1.1 + s * 30) * 0.8 * m;
      const dx = x - mouse.x, dy = y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 12000) { const f = (1 - d2 / 12000) * 38; const d = Math.sqrt(d2) || 1; x += dx / d * f; y += dy / d * f; }
      pos[i * 3] = x; pos[i * 3 + 1] = y;
    }
    geo.attributes.position.needsUpdate = true;
    r.render(scene, camera);
  };
  autoSize(r, null, stage, () => { build(); frame(0); });
  document.fonts.ready.then(() => { build(); frame(0); });
  if (reduce) frame(0); else {
    whileVisible(stage, frame);
    scrubSection(section, v => { p = v; }, { start: "top 60%" });
  }
}
