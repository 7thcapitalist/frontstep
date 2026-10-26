import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const bundlePath = new URL('../build/main.js', import.meta.url);

test('hero poster stays eager and hero video waits for user intent', async () => {
  const [html, bundle] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(bundlePath, 'utf8'),
  ]);

  assert.match(html, /rel="preload" as="image" href="\/img\/hero-film\.webp" fetchpriority="high"/);
  assert.match(html, /class="scrub-video"[^>]+preload="none"/);
  assert.match(bundle, /\["wheel","touchstart","keydown","pointerdown","scroll"\]/);
  assert.doesNotMatch(bundle, /document\.readyState==="complete"\?\w+\(\):addEventListener\("load"/);
});

test('critical local assets stay below a 350 kB safety budget', async () => {
  const paths = ['../index.html', '../site.css', '../build/main.js', '../img/hero-film.webp'];
  const sizes = await Promise.all(paths.map((path) => stat(new URL(path, import.meta.url))));
  const bytes = sizes.reduce((total, entry) => total + entry.size, 0);

  assert.ok(bytes < 350_000, `critical assets total ${bytes} bytes`);
});
