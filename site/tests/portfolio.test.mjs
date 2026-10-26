import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const home = readFileSync(join(root, 'index.html'), 'utf8');
const work = readFileSync(join(root, 'trabalhos', 'index.html'), 'utf8');
const styles = readFileSync(join(root, 'site.css'), 'utf8');

const demoUrls = [
  'https://fs-demo-floricultura.vercel.app',
  'https://fs-demo-loja.vercel.app',
  'https://fs-demo-festa.vercel.app',
  'https://fs-demo-advocacia-v2.vercel.app',
  'https://fs-demo-contabilidade-v2.vercel.app',
];

test('a home apresenta cinco prévias com print e link navegável', () => {
  for (const url of demoUrls) {
    assert.match(home, new RegExp(`href="${url.replaceAll('.', '\\.')}`));
  }

  assert.equal((home.match(/class="m showcase-card"/g) || []).length, 5);
  assert.equal((home.match(/\/img\/demo-[^"]+-desk\.webp/g) || []).length, 5);
  assert.match(home, /negócios são fictícios/i);
  assert.match(home, /não clientes reais/i);
  assert.doesNotMatch(home, />Padaria</);
  assert.doesNotMatch(home, />Clínica e bem-estar</);
});

test('a página detalhada preserva os cinco links e não chama demo de cliente', () => {
  for (const url of demoUrls) {
    assert.match(work, new RegExp(`href="${url.replaceAll('.', '\\.')}`));
  }

  assert.match(work, /negócios são fictícios/i);
  assert.doesNotMatch(work, /produto real do cliente/i);
});

test('assets locais referenciados existem', () => {
  const files = [
    home,
    work,
    readFileSync(join(root, 'media', 'clips.json'), 'utf8'),
  ];
  const references = new Set();

  for (const source of files) {
    for (const match of source.matchAll(/["']\/(img|media|build)\/([^"']+)["']/g)) {
      references.add(`${match[1]}/${match[2]}`);
    }
  }

  assert.ok(references.size >= 20, 'esperava validar os assets da landing e dos cases');
  for (const reference of references) {
    assert.ok(existsSync(join(root, reference)), `asset ausente: ${reference}`);
  }
});

test('o hero fixado termina em 150svh e a cena seguinte não abre vazia', () => {
  assert.match(styles, /\.scrub\{height:150svh;/);
  assert.doesNotMatch(styles, /\.scrub\{height:(?:4[0-9]{2}|[5-9][0-9]{2})svh;/);
  assert.match(styles, /\.mani \.m\{position:absolute;inset:0;clip-path:none!important\}/);
});
