# Frontstep motion runtime

Local static-page motion kit. `public/` is copied intact to a generated site's
`public/vendor/`. No CDN, install step, build tool, smooth-scroll override, or
Three.js is needed at page runtime.

## Load it

Place these tags in the page. GSAP and ScrollTrigger are pinned to npm `gsap@3.15.0`;
the `GSAP-LICENSE.txt` notice ships beside them.

```html
<link rel="stylesheet" href="./vendor/frontstep-motion.css">
<script defer src="./vendor/gsap.min.js"></script>
<script defer src="./vendor/ScrollTrigger.min.js"></script>
<script defer src="./vendor/frontstep-motion.js"></script>
```

The script mounts automatically. Every animated scene needs **one**
`data-motion-signature`, a truthful `data-motion-purpose` explaining its role,
and the corresponding `data-motion-part` elements. Use one dominant signature
per page; a second small scene is acceptable only when it supports the story.
The motion API is also available as `window.FrontstepMotion.mount(root)`
(returns a disposer) and `window.FrontstepMotion.destroyAll()`.

## Recipe contract

| Niche | Signature | Parts | Purposeful use |
|---|---|---|---|
| Accounting | `accounting-documents` | `document` cards | Papers square up into an ordered stack as process becomes clear. |
| Restaurant | `food-photo` | `photo` figures with an `img` | Crop opens on actual licensed food photography; optional menu image follows the pointer. |
| Beauty | `beauty-line` | SVG `line` path | One fine drawn line connects appointment and treatment. |
| Fitness | `fitness-orbit` | `orbit` shapes | Rings move around a session plan, echoing movement. |
| Shop | `shop-product` | `product` cards, nested `product-image` | Product cards settle; hovered product gets tactile focus. |
| Lodging | `lodging-landscape` | `landscape` image | Slow landscape drift evokes time away. Label reference images honestly. |
| Industry | `industry-process` | `rail`, `step` elements | A production rail extends while process stages align. |
| Repairs | `repair-path` | SVG `path`, optional `tool` | The route from problem to repair draws in. |
| Health | `health-clarity` | `progress` bar and `data-motion-field` inputs | Intake progress responds to what the visitor has completed. |

Example restaurant scene, using a local licensed photo already in the brief:

```html
<section data-motion-signature="food-photo"
         data-motion-purpose="Reveal the licensed dish photograph as the menu story begins">
  <figure data-motion-part="photo">
    <img src="./media/prato-pexels.jpg" alt="Prato servido em mesa">
    <figcaption>Imagem ilustrativa. Foto: autor no Pexels.</figcaption>
  </figure>
  <ul data-motion-menu>
    <li data-motion-menu-item><img src="./media/prato-pexels.jpg" alt="Prato do menu ilustrativo"> Item do menu</li>
  </ul>
</section>
```

Example industrial scene:

```html
<section data-motion-signature="industry-process"
         data-motion-purpose="Trace the quote-to-fabrication sequence">
  <h2>Do desenho à peça pronta</h2>
  <div class="process-rail" data-motion-part="rail" aria-hidden="true"></div>
  <ol>
    <li data-motion-part="step">Desenho</li>
    <li data-motion-part="step">Orçamento</li>
    <li data-motion-part="step">Fabricação</li>
  </ol>
</section>
```

Example health form fragment. The progress rail should have an accessible text
status in the real form; animation alone must not convey form completion:

```html
<section data-motion-signature="health-clarity"
         data-motion-purpose="Show progress through a local prototype intake form">
  <div class="progress-track" aria-hidden="true"><div data-motion-part="progress"></div></div>
  <label>Área de interesse <select data-motion-field><option value="">Escolha</option><option>Consulta</option></select></label>
  <label>Nome <input data-motion-field autocomplete="name"></label>
  <p id="form-status" role="status">Preencha os dados para avançar.</p>
</section>
```

## Guardrails and budget

- The static HTML/CSS must show all content with JavaScript disabled. Never hide
  copy or imagery by default for an entrance effect. Motion is enhancement only.
- Reduced-motion preference disables all GSAP scenes and hover followers. The
  mobile/coarse-pointer layout never gets a menu image follower.
- Keep animation to transforms, clipping of decorative imagery, SVG stroke, and
  short opacity/scale changes. Avoid layout-affecting width/height animation.
- Prefer a single intentional scene, at most four photo clips, and at most seven
  process stages. Motion should explain the niche, not decorate every section.
- Runtime transfer is roughly 129 KB minified JS before compression: GSAP 73 KB,
  ScrollTrigger 45 KB, Frontstep ~11 KB. No runtime network dependencies.
- Use truthful photo credits and demo labels. The runtime makes no provenance
  claims and does not turn stock imagery into evidence of a real business.
- Dynamic page teardown: call the disposer from `mount(root)` or
  `FrontstepMotion.destroyAll()` before replacing its DOM. In normal generated
  static pages, automatic mount is sufficient.

## Composition standard

These recipes are low-level movements, **not a complete 9/10 design**. Each
preview still needs a composed hero or feature scene with a real focal object,
clear typography, spatial hierarchy, and a meaningful interaction. Plan two or
three visual states on paper first: what is visible at rest, what changes as the
story advances, and where it settles. The final state must strengthen the page's
business task. For example, an accounting hero can fan three sample documents
around a tax choice, then align them into the selected service path; an industrial
hero can use an exploded SVG part that assembles as specifications are entered;
a restaurant can frame one credited food photo with a deliberate aperture and
menu choice. The signatures above may contribute to those scenes, but a line
draw or 7% zoom on its own is insufficient. Build the page layout and feature
interaction first, then connect the primitive. Verify the actual changed pixels
in desktop and mobile screenshots and inspect the intermediate motion state.

The official runtime license is distinct from the MIT GSAP skill instructions.
See `public/GSAP-LICENSE.txt` and the official current terms before extending
the bundle to other products.

## Optional spatial scene

`frontstep-spatial.js` adds a standalone Three.js implementation; it is not imported by the basic motion runtime. Read `SPATIAL-STORYTELLING.md` for its configurable state API, truthful use, static alternatives, scrolling, camera and lifecycle requirements. The module is built locally from the flagship source. Its default knot is specific to the Frontstep experiment. Never load it just to make a simple business page heavier. `THREE-LICENSE.txt` and linked legal notices ship beside it.


## Optional articulated page recipe (Presence direction)

`frontstep-page-scene.js` exports `mountPageScene({canvas, container, photoUrl, paintPage, fontRequests, colors, onReady})`. Use it only when a physical page belongs to the actual brief; it is not a default object for all businesses. The module is standalone and is not imported by the base runtime. Keep accessible text, controls, choice and final result in HTML. No Recanto name, photograph, copy, font or cobalt palette is embedded.

`photoUrl` must be a same-origin authorized asset. `paintPage({canvas,context,photo,width,height})` paints the entire 1792x1408 texture without resizing it and may return a promise. `fontRequests` is an optional array of CSS font strings; load local fonts in the document first. `colors` accepts sky, ground, key, fill, edge and CSS shadow color. Bind native scroll or ordinary controls to `setProgress(number)` in [0,1]. `getState()` reports fallback/progress/frames/quality/drawCalls/triangles; `destroy()` is idempotent. Replace a discarded canvas before remounting. Invalid required parameters reject; decode/render failures return a fallback state and set the host marker. Provide a static alternative before mounting and retain it whenever fallback is true.

Three panels and poses are a specific recipe, not an arbitrary 3D engine. Initial framing fits the projected panels to 88% of the dominant dimension and centers them. Between progress .36 and .59 the painted interface dissolves to the clean image; text painted into the canvas intentionally disappears. The subsequent enlargement crops the image, so the actual HTML destination must assume the story with a tested handoff. With reduced motion the recipe keeps its initial pose; the controller must remove any extended scroll distance. Pause/idle/offscreen handling, DPR cap and cleanup are included; physical-device FPS and aesthetic approval are not.

The isolated original-vector fixture passed pixel-state, reverse, idle/offscreen, live reduced-motion, fallback and destroy/remount checks. Framing was corrected after the first fixture review. These technical results do not certify a client design. Recheck the actual texture, typography, mobile composition, final DOM result and complete task. Read source `reference/spatial-source/page-scene.js` when adapting. Linked legal notices and the existing Three MIT license ship beside the module. Do not import both standalone spatial bundles together.
