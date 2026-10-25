// Gera n8n-code-node.js (cole num nó Code "Run Once for Each Item"). Entrada: texto, tipo_ultima_msg.
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync(new URL('./classificador.mjs', import.meta.url), 'utf8').replace(/^export /gm, '');
writeFileSync(new URL('./n8n-code-node.js', import.meta.url), src + `
const j = $input.item.json;
const r = classificar(j.texto ?? j.text ?? j.body, { tipoUltimaMsg: j.tipo_ultima_msg });
return { json: { ...j, classe: r.rotulo, regra_aplicada: r.regra, nota_classe: r.nota } };
`);
