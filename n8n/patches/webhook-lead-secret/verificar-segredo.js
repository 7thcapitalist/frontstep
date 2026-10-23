// Corpo do Code node "Verificar segredo" (Run Once for All Items), logo depois do Webhook
// /webhook/frontstep/lead. Troque __SEGREDO__ pelo valor real direto no node (como o
// "Verificar assinatura Kapso" do workflow 2); nunca commite o valor.
// Sem o header certo, devolve [] e o fluxo para aqui: nenhum build entra na fila.
const crypto = require('crypto');
const esperado = '__SEGREDO__';
const h = $input.first().json.headers || {};
const recebido = String(h['x-frontstep-secret'] ?? '');
const a = crypto.createHash('sha256').update(recebido).digest();
const b = crypto.createHash('sha256').update(esperado).digest();
if (esperado.startsWith('__SEGRE' + 'DO') || !crypto.timingSafeEqual(a, b)) return [];
return $input.all();
