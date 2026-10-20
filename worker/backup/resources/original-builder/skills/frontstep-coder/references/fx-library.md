# FX library: the signature effects

Tested modules in `assets/fx/`. **When a site gets a signature effect, use these instead of writing one from scratch.** Configured with the client's real name, photos and colors. Never ship Frontstep's demo content.

Live reference: https://frontstep.vercel.app (sneaker, burger, florist and café demos are these modules).

## When a site gets an effect, and when it does not

A signature effect is earned, not automatic. The test is simple: **is there something real to show?**

- **Yes**: food, a product, a bouquet, a physical space worth revealing. The effect is built from the client's real photos or a real 3D model.
- **No**: a business that sells a person's time and judgment. Clinics, doctors, lawyers, accountants, therapists, consultants, architects. These get **no signature 3D effect**. The first screen is the portrait, the typography and the space. That is the moment.

Never place a decorative object that has nothing to do with the business. A glass pill floating on a geriatrician's site is the mistake this rule exists to prevent: it reads as a stock AI landing page and it undoes the trust the rest of the page is building.

## No effect does not mean no design

This is the other half of the rule, and it is the half that is easy to get wrong. Dropping the signature effect is not permission to ship a clean template. A page that is merely correct does not sell. The client opens the preview, sees something tidy and generic, and decides it looks like anything else.

When there is no signature effect, the craft has to show up somewhere else, and it has to be visible in the first three seconds:

- **Typography does the heavy lifting.** A real scale, a headline large enough to be the image of the page, two weights with a clear job each, measured line length, deliberate tracking on the small caps.
- **Depth and layers.** Overlapping blocks, a portrait that breaks its container, a card that sits above the section edge, soft shadow used once with meaning instead of on everything.
- **Material.** A discreet grain, a paper or fabric texture at low opacity, a tinted band, a hairline rule. Enough that the background is not flat white.
- **Rhythm.** Sections must not share one layout. Alternate: full bleed, two columns, a narrow centered column, a list with generous leading. Three identical cards in a row is the sign that nothing was designed.
- **Details that only a person would add.** The frame around the portrait, the credentials card, the way a list is marked, the shape of the accordion, the header state on scroll.
- **Motion that makes the page feel alive while reading.** Staggered entrances per section, a light parallax on photos, a header that changes on scroll, smooth accordion and card transitions, intentional hover and focus states. Restrained, never decorative, always respecting `prefers-reduced-motion`.

Writing "no signature effect" in `plan.md` is a normal and frequent outcome, but it has to be followed by what the page gets instead. If `plan.md` says "no effect" and nothing else, the plan is not finished.

## The photo rule

- **Anything the customer buys or orders is shown with real photos**: products, dishes, bouquets, menu items. Use the client's photos from the brief (Google Maps / Instagram / what they send). 3D and generated art never replace product photos.
- 3D is for the entrance only (a hero moment), and only with a real model of the product (product3d).
- No procedural 3D food or objects. They look fake.

## Setup
```bash
mkdir -p sites/<slug> && cp -r assets/starter/* sites/<slug>/ && cp -r assets/fx sites/<slug>/fx
cd sites/<slug> && npm install && npm run build     # entry.js → public/app.bundle.js
```
Put `index.html`, `styles.css`, fonts and images in `public/`. Vercel builds with `npm run build` and serves `public/` (see `vercel.json`).
Sections that host an effect are tall wrappers (`height: 300-420vh`) with a sticky full-height pin inside; the canvas or photo stage fills a `position:relative` stage.

## Which effect for which business

| Business | Signature effect | Then, for buying |
|---|---|---|
| Restaurants, burgers, pizza, açaí, sushi, bakeries with food photos | `photoReveal` (real photos open to full screen, wipe through dishes) | `menuHover` menu with real dish photos |
| Sneakers, fashion, eyewear, bikes, electronics **with a .glb** | `product3d` in the hero | product grid of real photos |
| Cafés, bars, barbers, tattoo, bakeries where the name is the brand | `particleWord` (steam/particles form the name) | `menuHover` with real photos |
| Florists, decor, gifts, events | `bloom` (generative bouquet) | product grid of real bouquet photos |
| Hotels, pousadas, studios, salons with strong photos of the space | `photoReveal` with the real interior photos | rooms or services with real photos |
| **Clinics, doctors, law, accounting, therapy, consulting, architects** | **No 3D effect.** Typography, portrait, layers, texture and scroll motion carry the page, per "No effect does not mean no design" above | services, credentials, reviews |

`glass` stays in the library for a hero that genuinely calls for a tinted glass surface behind real content, for example a product in a premium retail context. It is not the default for service businesses and it is never a bare object floating on its own.

## APIs

```js
import { initPage, openWindows, countTo } from "./fx/page.js";
initPage({ whatsapp: "5531999999999", message: "Olá! Vi o site e quero agendar.", headlines: "h1", reveals: "h2" });
// data-wa on any link makes it a WhatsApp link; data-wa="custom text" overrides the message.
countTo(el, 0, 4.8);   // counters
```

```js
import { mountPhotoReveal } from "./fx/photoReveal.js";
// <div class="pr-stage"><figure class="pr-slide" data-caption="..."><img src=... alt=... width height></figure>...</div>
mountPhotoReveal({ section, stage: section.querySelector(".pr-stage"), captionEl });
// First photo opens from a card to full screen; each next photo wipes in from below with its caption. 3-4 photos.
```

```js
import { mountMenuHover } from "./fx/menuHover.js";
// <ul class="mh-list"><li data-img="photo.jpg"><span>Nome</span><em>descrição</em><b>R$ 42</b></li>...</ul>
mountMenuHover({ list, container: list.closest(".menu") });   // desktop: photo follows cursor; phone: inline thumbnails
```

```js
import { mountProduct3D } from "./fx/product3d.js";
mountProduct3D({ section, canvas, src: "assets/product.glb", variants: ["a","b","c"], buttons: [...document.querySelectorAll("[data-variant]")] });
// Drops in from above, bounces, spins with scroll, switches colorways (KHR_materials_variants) by scroll or buttons.
```

```js
import { mountBloom } from "./fx/bloom.js";
mountBloom({ section, canvas, palette: ["#F4C7CF","#EBA3B3","#F6D2B8","#FFF3E2","#DCCFF1"], accent: "#B84A62", top: 0.6 });
```

```js
import { mountParticleWord } from "./fx/particles.js";
mountParticleWord({ section, canvas, text: "GRÃO", font: '700 260px "Cormorant", serif', colors: ["#F3E6D3","#C8955F","#8A5A3B"], source: "steam" });
```

```js
import { mountGlass } from "./fx/glass.js";
mountGlass({ canvas, shape: "pill", tint: "#1F7A6D", ground: "#F4F1EC" });
```

## 3D models (product3d)
- Only with a real model of the product: from the client, or a licensed model of the category (KhronosGroup/glTF-Sample-Assets on GitHub; credit CC-BY in the footer).
- Optimize: `npx @gltf-transform/cli optimize in.glb public/assets/product.glb --texture-compress webp --texture-size 1024 --compress meshopt` (8 MB → ~0.5 MB).
- No model? Use photoReveal instead.

## Rules
- At most one signature effect per page, and often none. When there is none, the page still has to be designed: see "No effect does not mean no design".
- The quiet layer is always on: entrance reveals, fixed header, floating WhatsApp button, hover and focus states, from `page.js`.
- Before adding any motion, run `find-animation-opportunities`. In QA, run `review-animations` and fix everything it flags.
- QA screenshots must show the effect at the start, middle and end of its section, on phone and desktop. If text overlaps the object on phones, move it (offsetX/offsetY) or the copy.
- Reduced motion and no-WebGL still show a complete page.
