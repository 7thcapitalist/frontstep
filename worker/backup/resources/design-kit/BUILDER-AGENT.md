# Frontstep Builder Agent

This is the local agent's phase contract for synthetic preview jobs. `server.mjs` launches the same Codex agent in four bounded roles: art direction, build, independent critique, and redesign. Each phase gets the brief, selected direction, media provenance, and the relevant skill texts. The agent writes only inside its job directory. A skill is guidance, not proof that an image or interaction works.

Read `reference/QUALITY-BAR.md` in every phase. Apply its visual and interaction checks to the specific business. When `reference/exemplar/` exists, inspect its desktop/mobile screenshots, source and `case-study.md` as a verified example for that niche family. The exemplar is locally authored starter code: reuse its tested composition, responsive hierarchy, interaction or motion patterns when they fit the brief. Adapt the brand expression and replace all example business facts, photos, credits and contacts with current validated material. Do not restart from a generic layout merely to be different.

## The ten supplied skills and where they act

| Skill | Local reference | Phase and concrete use |
|---|---|---|
| `frontend-design` | `frontend-design.md` | Art direction and build: business-specific visual thesis, typography, layout; challenge template defaults. |
| `vercel-react-best-practices` | `react-best-practices.md` | Build and review **only when React/Next is actually used**. Current static HTML jobs record this as inapplicable; React-specific rules must not be forced into vanilla JS. |
| `web-design-guidelines` | `web-design-guidelines.md` plus `vercel-web-interface-guidelines.md` | Build, critique and redesign: accessibility, responsive behavior, focus, forms, content and interaction. The local pinned guideline text is used; do not fetch upstream during jobs. |
| `design-taste-frontend` | `taste-skill.md`, `taste-options.md`, `taste-direction.md` | Art direction: draw three candidates, select one ID, then build from its full direction sheet. |
| `high-end-visual-design` | `high-end-visual-design.md` | Build: composition polish, refined type and spacing; use only what fits the brief. |
| `redesign-existing-projects` | `redesign-existing-projects.md` | Repair: diagnose concrete flaws in the generated page and fix them without placeholder claims. |
| `minimalist-ui` | `minimalist-ui.md` | Art direction: consider restrained editorial treatment as one candidate; do not impose warm monochrome on every niche. |
| `ui-ux-pro-max` | `ui-ux-pro-max.md`, `design-research.md` | Research: local search script proposes patterns, palette and motion; plan accepts or rejects each against the brief. |
| `vercel-composition-patterns` | `composition-patterns.md` | Build and review **only when React components are present**. Static HTML jobs record it as inapplicable. |
| `gpt-taste` | `gpt-taste.md`, `taste-motion.md` | Art direction and build: consider ambitious layout and motion ideas; choose one purposeful signature move and implement reduced-motion fallback. Do not blindly adopt GSAP or huge empty section spacing. |

The recovered Claude `frontstep-coder.md` and its niche/motion references remain the project-specific brief. Order of authority: facts and image provenance in `brief.json` and `media-manifest.json`; local scope and QA contract; selected design plan; then skill ideas. When skills disagree, pick the rule that makes this site's information clearer and record the reason in the design plan. Do not stack every style onto one page.

The user also supplied an Instagram carousel with design, redesign, motion, Figma and browser tools. `IMPECCABLE-ADAPTATION.md` explains the additional Impeccable layout, motion and polish text playbooks used here. They supplement the ten requested skills; no Impeccable binary, browser extension or Figma connector runs in a job. The local browser QA and motion audit provide the executable checks.

## Art direction output

`design-plan.json` names a selected taste direction, one rejected alternative, justified type/palette/hero/rhythm, at least three signature details, claim/evidence pairs, media inventory, missing inputs, a `motionConcept`, and a `motionFallback`. The motion concept must relate to the business or interaction. The fallback must describe the same information visible with JavaScript disabled or reduced motion enabled.

## Media truth

`media.photos[]` is a local asset manifest, even for synthetic fixtures. Every entry has `local_path` and `provenance`:

- `business_photo`: a real photo supplied for this business; may depict its product, people or premises if caption is accurate.
- `licensed_stock`: an illustrative licensed image. It needs `source_url`, `license`, and `credit`, and must be credited or disclosed in the demo. It cannot prove what this business sells or looks like.
- `generated_illustration`: an illustrative generated asset. It must be disclosed in the demo and cannot be presented as a documentary product or customer photo.

Default visual choice: use a properly licensed real photograph when the image is meant to feel documentary. If none fits, solve the composition with type, color, shape, a diagram or an honest nonphotographic illustration. Do not use generated photorealism to stand in for food, people, premises, products or client work. An apparently realistic AI image is a visual quality defect even when labeled illustrative; use generated art only when its illustrative nature is immediately clear and it serves the concept.

All assets must be in `frontstep/local-briefs/assets/`. The worker copies them into each job's `public/media/` and writes `reference/media-manifest.json`. A finished preview can use licensed or generated art as a concept when the brief is synthetic. A real-business delivery would require a separate verification and rights workflow.

## Review and repair

Browser QA checks functional and mobile states. A separate motion audit observes browser animation/transition events during load, scroll, the scenario and hover, and checks that meaningful content stays visible under reduced motion. The independent reviewer receives desktop/mobile screenshots, reads site CSS/JS plus `reference/motion-report.json`, and records specific `motionEvidence`. Event counts do not prove aesthetic quality or smoothness. A passing review requires a weighted score strictly above 9.0/10 under VISUAL-RUBRIC.md, every criterion at least 8.5, no major visual defect and no misleading media. Repair uses the redesign skill to address the actual screenshot findings, then repeats QA, motion audit and critique. The job fails rather than presenting an unapproved preview.

Read `scenario.json` during critique and repair. Preserve every selector, required value, and action contract that browser QA has passed. If a semantic improvement would change a tested control, redesign it so that the required observable behavior still works. Never replace the demonstrative `wa.me` link expected by a scenario with an element that has no `href`; QA never navigates or sends the message.

The numeric caps in `taste-critique.md` are opinionated heuristics, not binding rules for Frontstep. In particular, **do not cap design at 6.5 for fewer than four photographs** in accounting, legal, health, industry or other text-led niches where extra stock would mislead. Likewise, an eyebrow, small index number, hairline, or three-line headline is not an automatic failure; judge its actual composition, clarity and relevance in the rendered screenshot. The user's brief, niche constraints and media truth take priority over aesthetic absolutes.

## Executable motion and skill receipts

Read `MOTION-RUNTIME.md` for the real locally bundled animation API in `public/vendor/`. Read `VERCEL-BENCHMARKS.md` for observations of the user’s published Frontstep and preview sites. The eleven complete motion skill folders in `reference/motion-skills/` retain their relative references. Design reads `emil-design-eng`; implementation reads it plus `gsap-performance` and the specific GSAP core/timeline/scrolltrigger guides if used. Independent critique reads `improve-animations` and its `AUDIT.md`; the audit-only skill must not prevent the build phase from editing source.

The plan records a concrete `motionRecipe`, a three-state `motionStoryboard`, and three or more `skillApplications` with principle/decision. Every build and repair produces `skill-usage.json`, an array of `{skill, principle, application, files}` tied to actual `public/` source. These are traceable decisions, not proof by themselves: the reviewer inspects the implementation and browser evidence. The worker stores skill source hashes.

Mark the business-specific signature scene `data-motion-signature`, explain its purpose in `data-motion-purpose`, and mark moving descendants `data-motion-part`. The browser measures actual computed property changes and captures a storyboard. A button hover or fake dispatch event does not satisfy the signature-motion gate. Input feedback remains immediate, no keyboard trap, native scroll, and complete reduced-motion/no-JS states.

The independent reviewer receives hero, full-page, populated mobile and temporal storyboard captures, not only a long static image. It gives decimal ratings for seven criteria; the worker calculates the weighted total. The requested threshold is strictly above 9.0. Failed reviews return concrete edits and the previous two critiques, so repairs preserve successful work instead of oscillating blindly between styles.

## Spatial scene refinement

Read `SPATIAL-STORYTELLING.md` for ambitious 3D briefs. The locally bundled optional engine and source reference support real geometric changes, lighting, shadows, camera movement, pointer input and native scroll. Write `spatialPlan`, inspect temporal canvas evidence and compose the entire page. The earlier photo-frame flagship was rejected; its screenshots are not an approved ceiling. Defaults are a Frontstep-specific reference, not a universal visual recipe.
