import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, styles, floatSafety] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../site.css', import.meta.url), 'utf8'),
  readFile(new URL('../build/wa-safe.js', import.meta.url), 'utf8'),
]);

test('nav usa cores opacas com contraste acima de 4,5:1', () => {
  assert.match(styles, /\.top\{[^}]*background:var\(--ink\);color:var\(--cream\)/);
  assert.doesNotMatch(styles, /\.top\{[^}]*mix-blend-mode/);

  const channel = (hex) => {
    const value = Number.parseInt(hex, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => 0.2126 * channel(hex.slice(1, 3))
    + 0.7152 * channel(hex.slice(3, 5))
    + 0.0722 * channel(hex.slice(5, 7));
  const light = luminance('#EFEAE0');
  const dark = luminance('#0B0C10');
  const contrast = (light + 0.05) / (dark + 0.05);

  assert.ok(contrast >= 4.5, `contraste calculado: ${contrast.toFixed(2)}:1`);
});

test('troca de texto do CTA existe somente dentro de hover:hover', () => {
  assert.match(html, /class="pill-label"/);
  assert.match(html, /Falar no WhatsApp/);
  assert.match(styles, /@media\(hover:hover\)\{[\s\S]*?\.pill:hover \.pill-label>span:last-child\{transform:none;opacity:1\}[\s\S]*?\}/);
  assert.doesNotMatch(styles.split('@media(hover:hover)')[0], /\.pill:hover \.pill-label/);
});

test('flutuante mobile fica compacto e sai antes da CTA final', () => {
  assert.match(styles, /@media\(max-width:480px\)\{\.wa-float\{width:52px;height:52px/);
  assert.match(styles, /\.wa-float\.wa-obscured\{transform:translateY\(140%\);pointer-events:none\}/);
  assert.match(floatSafety, /querySelectorAll\('\.cta-sec, \.foot'\)/);
  assert.match(floatSafety, /classList\.toggle\('wa-obscured'/);
});
