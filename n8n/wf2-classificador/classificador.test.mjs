import { classificar } from './classificador.mjs';
import { casos } from './casos.mjs';
let bad = 0;
console.log('| # | texto | contexto | esperado | obtido | regra | ok |\n|---|---|---|---|---|---|---|');
casos.forEach(([t, ctx, esp], i) => {
  const r = classificar(t, { tipoUltimaMsg: ctx });
  const ok = r.rotulo === esp;
  if (!ok) bad++;
  console.log(`| ${i + 1} | ${t.replace(/\n/g, ' ⏎ ').slice(0, 50)} | ${ctx} | ${esp} | ${r.rotulo}${r.nota ? ' (' + r.nota + ')' : ''} | ${r.regra} | ${ok ? '✅' : '❌'} |`);
});
console.log(bad ? `FALHAS ${bad}/${casos.length}` : `OK ${casos.length}/${casos.length}`);
process.exit(bad ? 1 : 0);
