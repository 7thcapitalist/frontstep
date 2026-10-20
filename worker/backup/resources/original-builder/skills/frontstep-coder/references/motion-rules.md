# How it moves: motion rules

Premium, big-tech-grade motion (Apple product pages, Stripe, Linear, Awwwards winners) on a static site. GSAP 3.15 (all plugins free), Lenis 1.3.26 and Three.js 0.186, bundled with esbuild.

## Stack
GSAP, Lenis and Three.js come from npm and are bundled by esbuild into one `app.bundle.js` (`<script type="module" src="app.bundle.js">`). `fx/common.js` registers the plugins and exports them.
```js
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduce || !window.gsap) return;          // page is complete without motion
document.documentElement.classList.add("motion");
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create("house", "0.7,0,0.2,1");     // scrubs, morphs
CustomEase.create("settle", "0.16,1,0.3,1");   // entrances
const lenis = new Lenis({ lerp: 0.09 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
```

## Toolbox (pick, don't pile up)
- **Pinned scroll story**: `pin` + `scrub: 1`, 150-420% of the viewport. The signature moment.
- **Kinetic type**: SplitText lines/chars inside masks; variable-font axes (`--w` on `font-variation-settings`) morphing on load or scroll.
- **Clip-path reveals**: `inset(18% 10% round 36px)` to `inset(0)` while the inner image scales 1.25 to 1.
- **Horizontal pinned gallery**: `x: -(track.scrollWidth - innerWidth)` with `containerAnimation` for child reveals. Desktop only; mobile gets native scroll-snap.
- **Counters**: numbers counting toward a real figure (rating, years, price) once on enter.
- **Marquee**: duplicated track, `xPercent: -50` loop, skew and speed from scroll velocity.
- **Magnetic CTA**: `gsap.quickTo` x/y at 0.3x the pointer offset, fine pointers only.
- **Grain**: SVG feTurbulence at 4-6% opacity on a fixed pseudo-element.
- **Cross-page transitions** (multi-page final sites): `@view-transition { navigation: auto; }` plus shared `view-transition-name` on the hero image.

## Rules
1. One signature moment per page. Everything else is quieter.
2. Animate only transform, opacity, clip-path (filter sparingly).
3. House eases only. Entrances 0.8-1.4 s, UI 150-250 ms. Big things move slower.
4. Choreograph with overlapping offsets (`"<0.15"`), staggers at or under 0.08 s, only on lines or chars.
5. `scrub: 1` on pinned sections, never `scrub: true` on big moves.
6. Text reveals through masks, not plain fades. `autoSplit: true` so breaks survive font loading.
7. Initial hidden states are set in JS, never CSS `opacity: 0`. No JS means everything is visible.
8. Wrap breakpoints in `gsap.matchMedia()`. Reduced motion: no Lenis, pins, scrubs, marquee or cursor effects.
9. 60 fps on a mid-range Android: at most one canvas, `will-change` only while animating.
10. If two sections animate the same way, change one.
11. Anchor links, keyboard and native scrollbar keep working with Lenis.
12. Split words as well as chars (`type: "words,chars"`) so words never break mid-word.
13. Check that giant type fits at 390px and 1440px: measure the widest word at its widest animated state.

## Sources
- GSAP pricing (all plugins free): https://gsap.com/pricing/
- SplitText: https://gsap.com/docs/v3/Plugins/SplitText/
- Lenis: https://github.com/darkroomengineering/lenis
- Cross-document view transitions: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- Linear design refresh: https://linear.app/now/behind-the-latest-design-refresh
- AI design tells: https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it

## Advanced effects
The WebGL/canvas effects now live as tested modules in `assets/fx/` and are documented in `references/fx-library.md`. Use them; don't rewrite from scratch.

Frame sequences from a client video (Higgsfield or phone footage), for a scroll-scrubbed video:
```bash
ffmpeg -i clip.mp4 -vf "fps=18,scale=1280:-2" -c:v libwebp -quality 60 frames/f-%03d.webp   # 80-120 frames, under 4 MB total
```
