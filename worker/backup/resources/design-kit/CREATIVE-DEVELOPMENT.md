# Creative development: new ambition, 16 October 2026

The user rejected the prior local flagship and its internal 9.1 assessment. The old published Frontstep site is a floor. Neither that score nor the v2 screenshots demonstrate customer approval. Build a distinctive visual experience, and evaluate the actual rendered interaction.

## Primary references inspected in the browser

- [Lusion](https://lusion.co/): dominant real-time sculpture, reflective materials, a restrained surrounding interface. Transfer: give the central scene scale, deliberate lighting and room to breathe. Do not copy their geometry or assets.
- [Active Theory](https://activetheory.net/): a continuous atmospheric world, dimensional logo, camera and pointer response. Transfer: carry a visual idea through changes of state rather than attaching unrelated entrance effects to cards.
- [Igloo](https://www.igloo.inc/): a coherent snowy 3D environment with atmospheric depth and a small interface around it. Transfer: design the whole environment and its lighting together. A floating object alone does not create a world.

These observations are visual references, not endorsements of their accessibility, performance or suitability for every local business. Their code and assets were not copied.

## Skills added and how to apply them

[CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills), pinned commit `b1c623076c661fc9b03dac19292e825a5d106823`. GitHub showed 3,588 stars when inspected. README declares MIT; no separate LICENSE at this commit. Full upstream README and provenance are retained alongside the skill folders.

| Skill | Concrete application | Acceptance evidence |
|---|---|---|
| threejs-shaders | Curved photo surfaces, UV-correct image transitions, localized refraction | Compare rendered states; inspect shader errors and transition endpoints |
| threejs-textures | Local real photos with correct color space, aspect preservation, cleanup | Credit/source, no broken assets, correct crop at 320px and desktop |
| threejs-interaction | Pointer-relative viewing, drag, native controls with meaningful states | Input changes the scene; keyboard alternative; touch still scrolls |
| threejs-postprocessing | Optional only when a specific effect improves the art direction | Explicit purpose, GPU budget and readable non-WebGL alternative |

The flagship currently uses the first three plus GSAP ScrollTrigger. Postprocessing is available, not applied. Do not claim all installed skills were used. These skills describe techniques; the storyboard supplies the art direction.

## Builder brief requirements

1. Choose one central visual idea from the business and available truthful assets. Describe three states and the input that connects them.
2. Compose the first viewport before adding animation. Large images, purposeful silhouettes, type and depth must read as a finished still.
3. Connect the experience to a useful action: product configuration, menu exploration, stay inquiry, service selection or brief. Keep contact discoverable.
4. Keep native scrolling. At narrow widths, compose a deliberate alternative; with reduced motion or no JS, every essential chapter and action remains accessible.
5. Show actual before/mid/after evidence and test remounting a WebGL scene after media-query changes. A still image does not prove motion quality.
6. Review the result without relying on its author's score. Passing functional checks is necessary but does not certify visual excellence.

Current manual experiment: `frontstep/site/CINEMATIC-DIRECTION.md`. It is not evidence that the automatic builder already produces this standard consistently.

Inspect `benchmarks/frontstep-cinematic-hero.png` and `frontstep-cinematic-travel.png` as the current manual experiment. These captures show spatial photography and scene-specific typography; they are not user approval or proof of temporal smoothness.

## Current kinetic revision

The user also rejected the photo-frame iteration. The current direction replaces that opening with an original full-viewport modular sculpture, native scroll geometry/camera transformations, then redesigned project, process, product and brief sections. Read `SPATIAL-STORYTELLING.md` and inspect `spatial-source/`. Earlier photo-frame screenshots are historical experiments. The optional local WebGL module and canvas-pixel audit make this technique available to the builder; no self-assigned score certifies its visual result.
