// node test.mjs — roda o corpo do Code node com $input simulado.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const src = readFileSync(new URL('./verificar-segredo.js', import.meta.url), 'utf8');
const rodar = (headers, segredo = 'teste-123') => {
  const item = { json: { headers, body: { lead_id: 'x' } } };
  const $input = { first: () => item, all: () => [item] };
  return new Function('require', '$input', src.replaceAll('__SEGREDO__', segredo))(require, $input);
};
assert.equal(rodar({}).length, 0, 'sem header deve rejeitar');
assert.equal(rodar({ 'x-frontstep-secret': 'errado' }).length, 0, 'segredo errado deve rejeitar');
assert.equal(rodar({ 'x-frontstep-secret': '' }).length, 0, 'segredo vazio deve rejeitar');
assert.equal(rodar({ 'x-frontstep-secret': 'teste-123' }).length, 1, 'segredo certo deve passar');
// placeholder não substituído: fecha tudo, mesmo mandando o próprio placeholder
assert.equal(new Function('require', '$input', src)(require, { first: () => ({ json: { headers: { 'x-frontstep-secret': '__SEGREDO__' } } }), all: () => [1] }).length, 0, 'placeholder deve rejeitar');
console.log('ok: 5 casos');
