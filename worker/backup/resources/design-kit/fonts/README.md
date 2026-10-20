# Self-hosted font library

These WOFF2 files work without a runtime font CDN. Copy `fonts.css`, the selected face files and their matching `LICENSE-*.txt` into the site's `public/fonts/` folder, then add `<link rel="stylesheet" href="./fonts/fonts.css">` to `public/index.html`. The `url("./...")` paths in `fonts.css` resolve relative to that stylesheet. Unused faces are not downloaded by the browser. The Latin subset covers common Portuguese characters, including `á à â ã é ê í ó ô õ ú ç` and their capitals. The existing DM Sans and Fraunces `latin-ext` files offer broader European coverage; add separate subset rules if a brief needs them.

| Family in `fonts.css` | Face shipped | Suggested use |
| --- | --- | --- |
| DM Sans | normal, 400–700 | neutral body and interface copy |
| Fraunces | normal, 400–700 | warm editorial display |
| Space Grotesk | normal variable, 300–700 | industry, technology, utilitarian display |
| Bricolage Grotesque | normal variable, 200–800 | expressive food, hospitality, playful headlines |
| Instrument Serif | normal and italic, 400 only | beauty and hospitality display; pair with a readable sans for body |
| Archivo Black | normal, 400 only | strong fitness, food or poster headlines |

These are the weight and style declarations exposed by this kit. Do not request italic from the variable sans families or bold from Instrument Serif/Archivo Black: browsers would synthesize it. Keep body text at 16px or larger; most display faces work best in short headings.

Example pairings after importing `fonts.css`:

```css
/* Food: expressive display, calm body */
body { font-family: "DM Sans", sans-serif; }
h1, h2 { font-family: "Bricolage Grotesque", sans-serif; font-weight: 700; }

/* Industry: a more technical voice */
.industrial h1 { font-family: "Space Grotesk", sans-serif; font-weight: 700; }

/* Beauty or hospitality: editorial accent */
.editorial h1 { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; }
.editorial em { font-family: "Instrument Serif", Georgia, serif; font-style: italic; }

/* Fitness or a compact restaurant poster */
.poster h1 { font-family: "Archivo Black", Impact, sans-serif; font-weight: 400; }
```

## Provenance and licenses

The four new families were copied from the [Fontsource font-files repository](https://github.com/fontsource/font-files) at commit [`86edcf1aab7fd27e8960ea3555aab50e3480a098`](https://github.com/fontsource/font-files/commit/86edcf1aab7fd27e8960ea3555aab50e3480a098) on 16 October 2026. Each file matched the GitHub blob SHA after copying. The Fontsource CSS for [Space Grotesk](https://github.com/fontsource/font-files/blob/86edcf1aab7fd27e8960ea3555aab50e3480a098/fonts/variable/space-grotesk/wght.css), [Bricolage Grotesque](https://github.com/fontsource/font-files/blob/86edcf1aab7fd27e8960ea3555aab50e3480a098/fonts/variable/bricolage-grotesque/wght.css), [Instrument Serif](https://github.com/fontsource/font-files/blob/86edcf1aab7fd27e8960ea3555aab50e3480a098/fonts/google/instrument-serif/400.css), and [Archivo Black](https://github.com/fontsource/font-files/blob/86edcf1aab7fd27e8960ea3555aab50e3480a098/fonts/google/archivo-black/400.css) verifies names, weight ranges, styles and Latin subsets. Their original SIL Open Font License texts are included as `LICENSE-*.txt` beside the fonts.

| File | SHA-256 |
| --- | --- |
| `space-grotesk-latin-wght-normal.woff2` | `0640890476fc1198ab4de571fb658de443c4d85b66466ec09534a8737ab1ce9d` |
| `bricolage-grotesque-latin-wght-normal.woff2` | `a97804dc9fbe5fc972a08018c5eda4dab7ef2346f64c57e61419d05e6de4ea1c` |
| `instrument-serif-latin-400-normal.woff2` | `5eb09b5ac0e28b67c2f041c8ba6d244604ca0c0980d65912ab2d47fed84ddc31` |
| `instrument-serif-latin-400-italic.woff2` | `5a51946dfffa82972bc98745359c46761515641fda557c25116459a9f83da4a7` |
| `archivo-black-latin-400-normal.woff2` | `25f33e61cf995abd6be62931cf03bf427286259177b43618cc410ee0157cfd30` |

The existing DM Sans and Fraunces files were retrieved from Google Fonts on 16 October 2026: [DM Sans](https://fonts.google.com/specimen/DM+Sans), [Fraunces](https://fonts.google.com/specimen/Fraunces). Their SIL Open Font License texts are included as `LICENSE-dm-sans.txt` and `LICENSE-fraunces.txt` from the [Google Fonts repository](https://github.com/google/fonts).
