// Code node "Decisão: sem resposta". Não grava telefone nem texto no ledger.
const ACK_WORDS = new Set([
  'ok', 'okay', 'okk', 'okey', 'blz', 'beleza', 'obrigado', 'obrigada',
  'obrigadao', 'obg', 'brigado', 'brigada', 'valeu', 'vlw', 'tmj', 'show',
  'top', 'certo', 'entendi', 'entendido', 'combinado', 'tranquilo', 'perfeito',
  'legal', 'joia', 'sucesso', 'abraco', 'abracos', 'abs', 'grato', 'grata',
])
const input = $input.first().json
const status = String(input.status || input.lead_status || '')
const limpo = String(input.text || '').replace(/\[(reaction|sticker|reacao|figurinha)\]/gi, '').trim()
const palavras = limpo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
let motivo = 'sem_resposta_automatica'
if (!limpo) motivo = 'sem_texto'
else if (status === 'optout') motivo = 'optout'
else if (status === 'inbound') motivo = 'atendimento_humano'
else if (status === 'precisa_joao') motivo = 'atendimento_joao'
else if (status === 'sem_interesse' && palavras.length && palavras.every(p => ACK_WORDS.has(p))) motivo = 'agradecimento_final'
const leadId = String(input.lead_id || '').trim()
if (!leadId) throw new Error('lead_id obrigatório para registrar decisão')
return [{ json: {
  factory_id: 'frontstep_br', event: 'wf2_sem_resposta', kind: 'metric', amount_brl: 0, qty: 1,
  cost_type: '', lead_id: leadId, variant: '', source: '2. Respostas',
  note: `motivo=${motivo};status=${status}`, occurred_at: new Date().toISOString(), sales_flow: '',
} }]
