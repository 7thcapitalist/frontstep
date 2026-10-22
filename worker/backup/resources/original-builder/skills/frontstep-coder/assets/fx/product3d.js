// FX: a real 3D product (any .glb) drops onto the page, bounces, spins with scroll
// and switches colorways (KHR_materials_variants) by scroll or by buttons.
// mountProduct3D({ section, canvas, stage, src | buffer, width, variants, buttons, autoVariants })
import { THREE, makeRenderer, autoSize, scrubSection, shadowTexture, reduce, small, gsap, clamp, ease } from "./common.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export function mountProduct3D({
  section, canvas, stage = canvas.parentElement,
  src, buffer,                    // URL of a .glb, or an ArrayBuffer of one
  width = small ? 2.2 : 3.4,      // world units across
  offsetX = small ? 0 : 0.9, offsetY = small ? 0.95 : 0.05,
  variants = [],                  // variant names in scroll order, e.g. ["midnight","beach","street"]
  buttons = [],                   // elements with data-variant="<name>"
  autoVariants = true
}) {
  const r = makeRenderer(canvas, { alpha: true });
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 4); scene.add(key);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.4, 9);

  const floorY = offsetY - 1.2;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.25, width * 0.42), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(offsetX, floorY, 0); scene.add(shadow);

  const pivot = new THREE.Group(); scene.add(pivot);
  let gltf = null, picked = false, current = null, p = reduce ? 1 : 0;

  function selectVariant(name) {
    const ext = gltf && gltf.userData.gltfExtensions && gltf.userData.gltfExtensions.KHR_materials_variants;
    if (!ext || name === current) return;
    current = name;
    const idx = ext.variants.findIndex(v => v.name === name);
    gltf.scene.traverse(async o => {
      const m = o.isMesh && o.userData.gltfExtensions && o.userData.gltfExtensions.KHR_materials_variants;
      if (!m) return;
      o.userData.originalMaterial ??= o.material;
      const map = m.mappings.find(x => x.variants.includes(idx));
      o.material = map ? await gltf.parser.getDependency("material", map.material) : o.userData.originalMaterial;
      if (map) gltf.parser.assignFinalMaterial(o);
      render();
    });
    buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.variant === name)));
    gsap.fromTo(pivot.scale, { x: 0.94, y: 0.94, z: 0.94 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(2.4)" });
  }
  buttons.forEach(b => b.addEventListener("click", () => { picked = true; selectVariant(b.dataset.variant); }));

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  // Use <img>-based texture loading (works under strict CSPs that block fetch of data:/blob: URLs)
  loader.register(parser => { parser.textureLoader = new THREE.TextureLoader(parser.options.manager); parser.textureLoader.setCrossOrigin("anonymous"); return { name: "fs_img_textures" }; });
  const onLoad = g => {
    gltf = g;
    const model = g.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const k = width / size.x;
    model.scale.setScalar(k); model.position.copy(c).multiplyScalar(-k);
    pivot.add(model);
    if (variants[0]) selectVariant(variants[0]);
    render();
  };
  const onError = e => console.error("[product3d] model failed to load", e);
  if (buffer) loader.parse(buffer, "", onLoad, onError); else loader.load(src, onLoad, undefined, onError);

  // p: 0-0.3 drop + bounce, 0.25-0.8 full turn, 0.8-1 settle into a display pose
  function render() {
    const drop = clamp(0, 1, p / 0.3);
    const fall = ease("bounce.out")(drop);                // lands and bounces
    const squash = drop > 0.35 && drop < 0.6 ? Math.sin((drop - 0.35) / 0.25 * Math.PI) * 0.08 : 0;
    const spin = ease("power2.inOut")(clamp(0, 1, (p - 0.25) / 0.55));
    const pose = ease("power2.out")(clamp(0, 1, (p - 0.8) / 0.2));
    const top = 5.5;
    pivot.position.set(offsetX + pose * (small ? 0 : 0.35), offsetY + top * (1 - fall), 0);
    pivot.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6);
    pivot.rotation.set(
      (1 - drop) * 0.9 + Math.sin(spin * Math.PI) * 0.35,
      -0.5 + (1 - drop) * 1.4 + spin * Math.PI * 2 - pose * 0.35,
      (1 - drop) * -0.5 + 0.12 + Math.sin(spin * Math.PI) * -0.15
    );
    const hgt = 1 - fall; // shadow grows as the product gets close to the floor
    shadow.material.opacity = 0.25 + 0.75 * (1 - hgt);
    shadow.scale.setScalar(0.6 + 0.4 * (1 - hgt));
    shadow.position.x = pivot.position.x;
    if (autoVariants && !picked && gltf && variants.length) {
      const i = Math.min(variants.length - 1, Math.floor(clamp(0, 0.999, (p - 0.3) / 0.6) * variants.length));
      selectVariant(variants[Math.max(0, i)]);
    }
    r.render(scene, camera);
  }
  autoSize(r, camera, stage, render);
  scrubSection(section, v => { p = v; render(); }, { start: "top 70%" });
  return { selectVariant };
}
