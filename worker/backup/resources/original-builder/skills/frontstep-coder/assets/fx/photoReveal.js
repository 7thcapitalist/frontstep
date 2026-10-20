// FX: real photos, cinematic. The first photo opens from a small card to full screen,
// then each next photo wipes in from below, scrubbed by scroll, with its caption.
// Markup: <div class="pr-stage"><figure class="pr-slide" data-caption="..."><img ...></figure>...</div>
// mountPhotoReveal({ section, stage, captionEl })
import { gsap, reduce, clamp, ease, small } from "./common.js";

export function mountPhotoReveal({ section, stage, captionEl }) {
  const slides = [...stage.querySelectorAll(".pr-slide")];
  const imgs = slides.map(s => s.querySelector("img"));
  const n = slides.length;
  slides.forEach((s, i) => { s.style.position = "absolute"; s.style.inset = "0"; s.style.margin = "0"; s.style.zIndex = i + 1; });
  let lastCap = -1;
  const setCaption = i => {
    if (!captionEl || i === lastCap) return;
    lastCap = i;
    const text = slides[i].dataset.caption || "";
    if (reduce) { captionEl.textContent = text; return; }
    gsap.to(captionEl, { yPercent: -60, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => {
      captionEl.textContent = text;
      gsap.fromTo(captionEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out" });
    } });
  };
  const inset = small ? "18% 10%" : "22% 30%";
  const render = p => {
    // first 30%: open the first photo; the rest: wipe each next photo in
    const open = ease("power3.inOut")(clamp(0, 1, p / 0.3));
    const k = 1 - open;
    slides[0].style.clipPath = `inset(${inset.split(" ").map(v => parseFloat(v) * k + "%").join(" ")} round ${28 * k}px)`;
    imgs[0].style.transform = `scale(${1 + 0.3 * k})`;
    const seg = 0.7 / Math.max(1, n - 1);
    let current = 0;
    for (let i = 1; i < n; i++) {
      const t = ease("power2.inOut")(clamp(0, 1, (p - 0.3 - (i - 1) * seg) / seg));
      slides[i].style.clipPath = `inset(${(1 - t) * 100}% 0 0 0)`;
      imgs[i].style.transform = `scale(${1.15 - 0.15 * t}) translateY(${(1 - t) * 8}%)`;
      if (t > 0.5) current = i;
    }
    setCaption(current);
  };
  if (reduce) { render(1); return; }
  const st = { p: 0 };
  gsap.to(st, { p: 1, ease: "none", onUpdate: () => render(st.p), scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.8 } });
  render(0);
}
