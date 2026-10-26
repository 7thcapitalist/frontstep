import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');

test('poster do hero eager com preload, fontes locais, JS e imagens só depois do primeiro paint', async () => {
  const [html, bundle, css] = await Promise.all([read('../index.html'), read('../build/main.js'), read('../site.css')]);

  assert.match(html, /rel="preload" as="image" href="\/img\/hero-m\.webp" media="\(max-width:480px\)" fetchpriority="high"/);
  assert.match(html, /rel="preload" as="image" href="\/img\/hero\.webp" media="\(min-width:481px\)" fetchpriority="high"/);
  assert.match(html, /class="scrub-video"[^>]+preload="none"/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic/);
  assert.match(html, /rel="preload" as="font" type="font\/woff2" href="\/fonts\/archivo-latin\.woff2" crossorigin/);
  assert.doesNotMatch(html, /<script type="module" src="\/build\/main\.js">/);
  assert.match(html, /import\("\/build\/main\.js"\)[\s\S]*first-contentful-paint/);
  assert.doesNotMatch(html, /loading="lazy"/);
  assert.match(css, /@font-face\{font-family:"Archivo"[^}]*font-display:swap/);
  assert.match(bundle, /\["wheel","touchstart","keydown","pointerdown","scroll"\]/);
  assert.doesNotMatch(bundle, /document\.readyState==="complete"\?\w+\(\):addEventListener\("load"/);
  // o h1 sobe por CSS no primeiro frame (sem GSAP) e o vídeo carrega 2,5 s após o load, ou na 1ª interação
  assert.doesNotMatch(bundle, /A\.from\("\.hero h1 \.ln>span/);
  assert.match(css, /@keyframes ln-up/);
  assert.match(bundle, /setTimeout\(y,2500\)/);
  assert.match(bundle, /classList.toggle\("moving"/);
});

test('imagens abaixo da dobra usam data-src e o JS usa o poster certo', async () => {
  const [html, bundle] = await Promise.all([read('../index.html'), read('../build/main.js')]);
  assert.ok((html.match(/data-src="\/img\//g) || []).length >= 6);
  assert.match(bundle, /querySelector\("img"\)\?\.dataset\.src/);
});

test('ativos críticos ficam abaixo de 350 kB, sem contar fontes', async () => {
  const paths = ['../index.html', '../site.css', '../build/main.js', '../img/hero-m.webp'];
  const sizes = await Promise.all(paths.map((path) => stat(new URL(path, import.meta.url))));
  const bytes = sizes.reduce((total, entry) => total + entry.size, 0);
  assert.ok(bytes < 350_000, `critical assets total ${bytes} bytes`);
});
