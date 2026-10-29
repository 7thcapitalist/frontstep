const ACK_WORDS = new Set([
  'ok', 'okay', 'okk', 'okey', 'blz', 'beleza', 'obrigado', 'obrigada',
  'obrigadao', 'obg', 'brigado', 'brigada', 'valeu', 'vlw', 'tmj', 'show',
  'top', 'certo', 'entendi', 'entendido', 'combinado', 'tranquilo', 'perfeito',
  'legal', 'joia', 'sucesso', 'abraco', 'abracos', 'abs', 'grato', 'grata',
])

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function motivoSemResposta({ status, lead_status: leadStatus, text }) {
  const s = String(status || leadStatus || '')
  const limpo = String(text || '').replace(/\[(reaction|sticker|reacao|figurinha)\]/gi, '').trim()
  if (!limpo) return 'sem_texto'
  if (s === 'optout') return 'optout'
  if (s === 'inbound') return 'atendimento_humano'
  if (s === 'precisa_joao') return 'atendimento_joao'
  if (s === 'sem_interesse') {
    const palavras = normalizar(limpo)
    if (palavras.length > 0 && palavras.every(p => ACK_WORDS.has(p))) return 'agradecimento_final'
  }
  return 'sem_resposta_automatica'
}

export function eventoDecisao(input, agora = new Date()) {
  const leadId = String(input.lead_id || '').trim()
  if (!leadId) throw new Error('lead_id obrigatório para registrar decisão')
  const motivo = motivoSemResposta(input)
  return {
    factory_id: 'frontstep_br',
    event: 'wf2_sem_resposta',
    kind: 'metric',
    amount_brl: 0,
    qty: 1,
    cost_type: '',
    lead_id: leadId,
    variant: '',
    source: '2. Respostas',
    note: `motivo=${motivo};status=${String(input.status || input.lead_status || '')}`,
    occurred_at: agora.toISOString(),
    sales_flow: '',
  }
}
