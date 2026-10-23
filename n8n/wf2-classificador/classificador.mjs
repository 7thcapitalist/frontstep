// Classificador de respostas do wf2 (WEB-16 regras, WEB-27 implementação). Determinístico, sem LLM.
// classificar(texto, { tipoUltimaMsg }) -> { rotulo, regra, nota? }
//   tipoUltimaMsg: 'oferta' | 'previa' | 'outro' (última mensagem do bot, aba `mensagens`)
// Rótulos: opt_out | duvida | nao | sim | ack | automatica
// Prioridade: automática (filtro "Resposta automática?", roda antes do IF) > opt-out > dúvida > não > sim > sim-por-contexto > ambíguo=dúvida.
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');

const AUTO = [
  /goomer|saipos|dmfweb/,
  /agradece (o |seu )?contato/,
  /bem[- ]?vind[oa]/,
  /(^|\n)\s*[1-9][\s).\-:]+\S.*\n\s*[1-9][\s).\-:]+\S/,
  /(horario de (atendimento|funcionamento)|loja fechada|estamos fechados|fora do horario|no momento nao (estamos|podemos))/,
  /assim que possivel/,
  /mensagem automatica|resposta automatica|assistente virtual/,
];
export const ehAutomatica = t => AUTO.some(r => r.test(norm(t)));

const OPT_OUT = [
  /\bpar(a|e|ar) de (me )?(mandar|enviar|ligar|chamar|escrever|insistir)/,
  /\bpode parar\b/, /^pare\b/, /^para[.!]*$/, /\bsai (daqui|fora)\b|^sai[.!]*$/,
  /nao me (chame|chama|mande|manda|procure|envie)( mais)?/,
  /\b(remov\w+|tir\w+|exclu\w+) (o )?(meu )?(numero|contato|cadastro)/,
  /\bspam\b|denunci|bloque|descadastr|nao quero (mais )?(receber|mensagem)/,
];
const DUVIDA = /\?|\b(quanto|como|qual|quais|quem|onde|prazo|preco|valor|custa|custo|o que e|de graca|gratis|gratuito)\b/;
const NAO = /\b(nao|sem interesse|ja tenho site|agora nao)\b/;
const SIM = /\b(sim|quero|pode (fazer|mandar|enviar)|vamos|topo|fechado|com certeza)\b/;
const CURTAS = new Set(['ok', 'okay', 'blz', 'beleza', 'pode', 'ser', 'ta', 'bom', 'bora', 'claro', 'uhum', 'combinado', 'show', 'manda', 'ai', '👍', '👌']);
const MIDIA = /^\[?\s*(audio|figurinha|sticker|imagem|video|midia|foto)\s*\]?$/;

const soCurtas = t => {
  const limpo = t.replace(/[^\p{L}\p{N}\p{Extended_Pictographic}\s]/gu, ' ').replace(/(\p{Extended_Pictographic})/gu, ' $1 ');
  const tk = limpo.split(/\s+/).filter(Boolean);
  return tk.length > 0 && tk.length <= 4 && tk.every(x => CURTAS.has(x));
};

export function classificar(texto, ctx = {}) {
  const t = norm(texto).trim();
  if (ehAutomatica(texto)) return { rotulo: 'automatica', regra: 6 };
  if (OPT_OUT.some(r => r.test(t))) return { rotulo: 'opt_out', regra: 1 };
  if (MIDIA.test(t)) return { rotulo: 'duvida', regra: 7, nota: 'mídia: humano olha' };
  if (DUVIDA.test(t)) return { rotulo: 'duvida', regra: 2 };
  if (NAO.test(t)) return { rotulo: 'nao', regra: 3, ...(/agora nao|mes que vem|talvez/.test(t) ? { nota: 'retomar depois' } : {}) };
  if (SIM.test(t)) return { rotulo: 'sim', regra: 4 };
  if (soCurtas(t)) return ctx.tipoUltimaMsg === 'oferta' ? { rotulo: 'sim', regra: 5 } : { rotulo: 'ack', regra: 5 };
  return { rotulo: 'duvida', regra: 7, nota: 'ambíguo: humano olha' };
}
