// FX: a menu or product list where a real photo follows the cursor, tilting with its speed,
// and swaps as you move between items. On touch screens each item shows its photo inline.
// Markup: <ul class="mh-list"><li data-img="url">Name <span>price</span></li>...</ul>
// mountMenuHover({ list, container })
import { gsap, fine, reduce } from "./common.js";

export function mountMenuHover({ list, container = list.parentElement, width = 300, ratio = 1.25 }) {
  const items = [...list.querySelectorAll("[data-img]")];
  if (!fine || reduce) {           // touch / reduced motion: inline thumbnails
    items.forEach(li => {
      const img = new Image(); img.src = li.dataset.img; img.alt = ""; img.loading = "lazy";
      img.className = "mh-thumb"; li.prepend(img);
    });
    return;
  }
  container.style.position = container.style.position || "relative";
  const box = document.createElement("div");
  box.className = "mh-float";
  Object.assign(box.style, { position: "absolute", left: 0, top: 0, width: width + "px", height: width * ratio + "px", pointerEvents: "none", overflow: "hidden", borderRadius: "14px", zIndex: 5, opacity: 0, scale: 0.6 });
  const imgs = items.map(li => {
    const im = new Image(); im.src = li.dataset.img; im.alt = "";
    Object.assign(im.style, { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0 });
    box.appendChild(im); return im;
  });
  container.appendChild(box);
  const x = gsap.quickTo(box, "x", { duration: 0.6, ease: "power3" });
  const y = gsap.quickTo(box, "y", { duration: 0.6, ease: "power3" });
  const rot = gsap.quickTo(box, "rotation", { duration: 0.8, ease: "power3" });
  let lastX = 0, active = -1;
  container.addEventListener("pointermove", e => {
    const r = container.getBoundingClientRect();
    const px = e.clientX - r.left - width / 2, py = e.clientY - r.top - (width * ratio) / 2;
    x(px); y(py); rot(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6)); lastX = e.clientX;
  });
  items.forEach((li, i) => li.addEventListener("pointerenter", () => {
    if (active === i) return;
    if (active >= 0) gsap.to(imgs[active], { opacity: 0, scale: 1.1, duration: 0.35 });
    gsap.fromTo(imgs[i], { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" });
    active = i;
    gsap.to(box, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" });
  }));
  list.addEventListener("pointerleave", () => { gsap.to(box, { opacity: 0, scale: 0.6, duration: 0.4 }); if (active >= 0) gsap.set(imgs[active], { opacity: 0 }); active = -1; });
}
