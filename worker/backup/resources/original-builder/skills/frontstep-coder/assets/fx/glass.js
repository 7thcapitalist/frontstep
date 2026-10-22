// FX: glass object refracting a backdrop, following the pointer. Hero use.
// mountGlass({ canvas, container, shape: "step"|"torus"|"pill", tint, ground, accent })
import { THREE, makeRenderer, autoSize, whileVisible, reduce, fine, small, gsap } from "./common.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

function shapeGeometry(kind) {
  if (kind === "torus") return new THREE.TorusGeometry(1.35, 0.55, 64, 128);
  if (kind === "pill") return new THREE.CapsuleGeometry(0.9, 1.6, 16, 48);
  const s = new THREE.Shape(); // two-stair profile
  s.moveTo(0, 0); s.lineTo(2.4, 0); s.lineTo(2.4, 2.4); s.lineTo(1.2, 2.4); s.lineTo(1.2, 1.2); s.lineTo(0, 1.2); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.14, bevelSegments: 8, curveSegments: 8 });
  g.center(); return g;
}

export function mountGlass({ canvas, container = canvas.parentElement, shape = "step", tint = "#2E5BFF", ground = "#ECE6DA", line = "rgba(14,18,32,.09)", side = "right" }) {
  const r = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ground);
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.03).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // backdrop: ground color, fine grid, soft glow and a ring in the tint color
  const bc = document.createElement("canvas"); bc.width = 2048; bc.height = 1280;
  const g = bc.getContext("2d");
  g.fillStyle = ground; g.fillRect(0, 0, bc.width, bc.height);
  const cx = side === "right" ? 1450 : 1024, cy = 560;
  const t = new THREE.Color(tint), rgb = `${Math.round(t.r * 255)},${Math.round(t.g * 255)},${Math.round(t.b * 255)}`;
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, 620);
  glow.addColorStop(0, `rgba(${rgb},.75)`); glow.addColorStop(.45, `rgba(${rgb},.22)`); glow.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = glow; g.fillRect(0, 0, bc.width, bc.height);
  g.strokeStyle = line; g.lineWidth = 2;
  for (let x = 0; x <= bc.width; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, bc.height); g.stroke(); }
  for (let y = 0; y <= bc.height; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(bc.width, y); g.stroke(); }
  g.strokeStyle = `rgba(${rgb},.55)`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 300, 0, Math.PI * 2); g.stroke();
  const tex = new THREE.CanvasTexture(bc); tex.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  plate.position.z = -3; scene.add(plate);

  const glass = new THREE.Mesh(shapeGeometry(shape), new THREE.MeshPhysicalMaterial({
    transmission: 1, thickness: 1.4, roughness: 0.04, ior: 1.52, dispersion: small ? 0 : 2.5,
    attenuationColor: new THREE.Color(tint), attenuationDistance: 3.6, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.2
  }));
  scene.add(glass);

  const st = { rx: -0.35, ry: 0.65, px: 0, py: 0, lift: 0 }, target = { rx: -0.35, ry: 0.65 };
  if (fine) addEventListener("pointermove", e => {
    target.ry = 0.65 + (e.clientX / innerWidth - 0.5) * 0.9;
    target.rx = -0.35 + (e.clientY / innerHeight - 0.5) * 0.6;
  });
  autoSize(r, camera, container, () => {
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * 17, vw = vh * camera.aspect;
    const cover = Math.max(vw / 1.6, vh); plate.scale.set(cover * 1.6, cover, 1);
    const gh = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * 14, gw = gh * camera.aspect;
    st.px = small || side !== "right" ? 0 : gw * 0.24;
    st.py = small ? gh * 0.18 : 0.2;
    glass.scale.setScalar(small ? 0.8 : 1.15);
  });

  const clock = new THREE.Clock();
  const frame = () => {
    const t = clock.getElapsedTime();
    st.rx += (target.rx - st.rx) * 0.05; st.ry += (target.ry - st.ry) * 0.05;
    glass.rotation.set(st.rx + Math.sin(t * 0.6) * 0.05, st.ry + (reduce ? 0 : t * 0.12), Math.sin(t * 0.4) * 0.04);
    glass.position.set(st.px, st.py + Math.sin(t * 0.9) * 0.08 + st.lift, 0);
    r.render(scene, camera);
  };
  if (reduce) frame(); else {
    whileVisible(container, frame);
    gsap.to(st, { lift: 3, ease: "none", scrollTrigger: { trigger: container, start: "top top", end: "bottom top", scrub: 1 } });
    gsap.from(glass.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 1.8, ease: "expo.out", delay: 0.3 });
  }
}
