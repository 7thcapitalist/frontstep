# Spatial storytelling for the builder

The photographic-frame flagship was rejected by the user. The new Frontstep direction uses a full-viewport physical scene with three genuinely different geometric states and a moving camera. A frame around a photo, a zoom, or a spinning generic object does not satisfy that request.

## Available local implementation

`public/vendor/frontstep-spatial.js` is an **optional** standalone ESM bundle, built from the current flagship source with Three.js 0.186.0. It does not need a CDN or npm on the generated site. Importing it loads the 3D engine; ordinary sites should not import it without a justified spatial concept. The Three.js MIT notice is shipped beside it. Rebuild from `design-kit/runtime/build-spatial.mjs` after source changes.

The module exports `mountKineticSculpture({canvas, container, onReady, colors, stateBuilder})`. It returns `{setProgress(value), destroy(), getState()}`. Progress is 0–1. Reduced motion freezes idle motion; the page controller must reset progress and remove extended scroll on a preference change. The module handles context failure with `getState().fallback === true`; retain a designed static composition and contact.

Its default knot, stepped terrain and radial expansion belong to the Frontstep experiment. **Do not reuse the default sculpture on every business.** `colors` accepts `ground`, `accent`, `ceramic`, `metal`. `stateBuilder({index,count,lane,t})` can return arrays for `flow`, `assembled`, `expanded` positions and `flowRotation`, `expandedRotation` Euler angles. This changes the geometry's three poses. If a real product model or another geometry is required, implement that scene separately.

```js
import {mountKineticSculpture} from './vendor/frontstep-spatial.js';
const host=document.querySelector('.spatial-stage');
const scene=mountKineticSculpture({
  canvas:host.querySelector('canvas'),container:host,
  colors:{ground:'#edf1f2',accent:'#22675e'},
  // Example illustrated assembly study, not a real manufactured product.
  stateBuilder:({index,lane,t})=>({
    flow:[Math.cos(t)*3,Math.sin(t)*3,(lane-1)*1.4],
    assembled:[(index%12-5.5)*.55,0,(Math.floor(index/12)-5.5)*.55],
    expanded:[Math.cos(t)*5,Math.sin(t)*3.5,(lane-1)*2]
  })
});
// Connect scene.setProgress(0…1) to your native-scroll GSAP controller.
// On fallback: remove sticky scroll extension; preserve the static composition.
// Before removing the host: scene.destroy(). A disposed canvas must be replaced.
```

This is an API example, not a completed business page. The generated page still needs its own composition, scroll range, useful action, responsive camera framing, semantic controls and cleanup. Do not declare dependencies that the static site cannot load.

## Mandatory design reasoning for an ambitious 3D brief

Write `spatialPlan` in the design output:

- `businessMetaphor`: why this object/environment belongs to the business.
- `firstViewport`: focal object, scale, type and contact placement, light and background.
- `states`: at least three entries with exact keys `trigger`, `geometry`, `camera`, `purpose` (strings describing the input/interval, geometric change, camera decision and business purpose). A color change alone is not a state.
- `assets`: real product/model provenance or clearly illustrative procedural geometry.
- `mobile`: camera, scale, copy and simplified sequence; keep touch scrolling native.
- `fallback`: complete static view for no WebGL/JS and reduced motion.
- `budget`: instance/triangle budget, capped DPR, offscreen pause and disposal.
- `continuation`: how the rest of the page carries the direction through projects, process, useful interaction and contact.

For restrained business briefs, a strong editorial or photographic scene may be more appropriate. The Frontstep request for studio-level 3D is not a mandate for unrelated businesses to receive a heavy 3D landing page.

## Review the actual result

Capture initial, intermediate, assembled and expanded states. Check that the canvas occupies the intended first viewport and that real geometry and camera change. Compare reverse scrolling. Inspect copy against the objects, silhouettes inside the mobile canvas, shadow/material quality and a useful action through to its result. Review every page section, not only the hero.

Test reduced motion changing live, re-entry, no WebGL and no JS. Freeze offscreen work and dispose resources. Report actual constraints. Functional checks and a self-assigned score cannot prove aesthetic excellence or user approval.

Flagship implementation reference: `reference/spatial-source/`; temporal screenshots in `reference/benchmarks/frontstep-kinetic-*`. These are manual experiments, not evidence of consistent automatic generation.

Mark the actual scene canvas `data-spatial-canvas` inside the `data-motion-signature` region. The audit reads canvas pixels in animation frames, excluding overlaid HTML. Pixel differences prove rendered change, not artistic quality or genuine 3D by themselves; review the source and the temporal storyboard.

Declare `renderingMode: "dom"` or `"webgl"` in the design plan. A DOM recipe explicitly saying it will not load Three.js must not be treated as a spatial implementation. Positive WebGL recipes and explicit spatial plans still require the complete three-state design.
