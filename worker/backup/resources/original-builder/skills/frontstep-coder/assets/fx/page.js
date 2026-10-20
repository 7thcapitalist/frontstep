// Page-level polish shared by every Frontstep site: WhatsApp links, smooth scroll, masked
// headline reveals, sticky header surface, custom cursor and magnetic buttons.
// initPage({ whatsapp, message, headlines: ".display", reveals: ".display-2", magnetic: ".btn-lg" })
import { reduce, fine, gsap, ScrollTrigger, SplitText, CustomEase, Lenis } from "./common.js";

export function initPage({ whatsapp, message = "", headlines = "h1", reveals = "h2", magnetic = ".btn-lg", header = ".top", cursor = ".cursor" } = {}) {
  if (whatsapp) document.querySelectorAll("[data-wa]").forEach(a => {
    a.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(a.dataset.wa || message)}`;
    a.target = "_blank"; a.rel = "noopener";
  });
  CustomEase.create("settle", "0.16,1,0.3,1");
  CustomEase.create("house", "0.7,0,0.2,1");

  const bar = document.querySelector(header);
  if (bar) addEventListener("scroll", () => bar.classList.toggle("scrolled", scrollY > 40), { passive: true });
  if (reduce) return;
  document.documentElement.classList.add("motion");

  {
    const lenis = new Lenis({ lerp: 0.085 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { duration: 1.6 }); }
    }));
  }

  document.fonts.ready.then(() => {
    document.querySelectorAll(headlines).forEach(h => SplitText.create(h, {
      type: "lines,words", mask: "lines", autoSplit: true,
      onSplit: s => gsap.from(s.lines, { yPercent: 105, duration: 1.4, ease: "settle", stagger: 0.1, delay: 0.15 })
    }));
    document.querySelectorAll(reveals).forEach(h => SplitText.create(h, {
      type: "lines", mask: "lines", autoSplit: true,
      onSplit: s => gsap.from(s.lines, { yPercent: 105, duration: 1.2, ease: "settle", stagger: 0.08, scrollTrigger: { trigger: h, start: "top 85%" } })
    }));
    ScrollTrigger.refresh();
  });

  const c = document.querySelector(cursor);
  if (fine && c) {
    const x = gsap.quickTo(c, "x", { duration: 0.35, ease: "power3" }), y = gsap.quickTo(c, "y", { duration: 0.35, ease: "power3" });
    addEventListener("pointermove", e => { c.classList.add("on"); x(e.clientX); y(e.clientY); });
    document.querySelectorAll("a, button").forEach(el => {
      el.addEventListener("pointerenter", () => gsap.to(c, { scale: 3.2, duration: 0.3 }));
      el.addEventListener("pointerleave", () => gsap.to(c, { scale: 1, duration: 0.3 }));
    });
  }
  if (fine) document.querySelectorAll(magnetic).forEach(b => {
    const bx = gsap.quickTo(b, "x", { duration: 0.5, ease: "power3" }), by = gsap.quickTo(b, "y", { duration: 0.5, ease: "power3" });
    b.addEventListener("pointermove", e => { const q = b.getBoundingClientRect(); bx((e.clientX - q.left - q.width / 2) * 0.3); by((e.clientY - q.top - q.height / 2) * 0.3); });
    b.addEventListener("pointerleave", () => { bx(0); by(0); });
  });
}

/** Browser-window mockups that open up as they scroll in (used on Frontstep's own site). */
export function openWindows(selector = ".demo .window") {
  if (reduce) return;
  document.querySelectorAll(selector).forEach(w => gsap.fromTo(w, { clipPath: "inset(8% 6% 8% 6% round 40px)", scale: 0.94 }, {
    clipPath: "inset(0% 0% 0% 0% round 22px)", scale: 1, ease: "none",
    scrollTrigger: { trigger: w.closest("section"), start: "top bottom", end: "top top", scrub: true }
  }));
}

/** Number that counts from `from` to its real value when it scrolls in. */
export function countTo(el, from, to, { locale = "pt-BR" } = {}) {
  const fmt = n => Math.round(n).toLocaleString(locale);
  if (reduce) { el.textContent = fmt(to); return; }
  const o = { v: from }; el.textContent = fmt(from);
  gsap.to(o, { v: to, duration: 2.2, ease: "expo.out", onUpdate: () => (el.textContent = fmt(o.v)), scrollTrigger: { trigger: el, start: "top 80%" } });
}
