import test from 'node:test'
import assert from 'node:assert/strict'
import { eventoDecisao, motivoSemResposta } from './decision-ledger.mjs'

test('agradecimento de lead sem interesse vira decisão explícita sem resposta', () => {
  assert.equal(motivoSemResposta({ lead_status: 'sem_interesse', text: 'Obrigado!' }), 'agradecimento_final')
  const evento = eventoDecisao(
    { lead_id: 'gm-exemplo', lead_status: 'sem_interesse', text: 'Obrigado!' },
    new Date('2026-10-29T19:50:00Z'),
  )
  assert.equal(evento.event, 'wf2_sem_resposta')
  assert.equal(evento.lead_id, 'gm-exemplo')
  assert.equal(evento.occurred_at, '2026-10-29T19:50:00.000Z')
  assert.match(evento.note, /motivo=agradecimento_final/)
  assert.ok(!JSON.stringify(evento).includes('Obrigado'), 'ledger não guarda texto da conversa')
})

test('caminhos humanos e mídia vazia também ganham decisão durável', () => {
  assert.equal(motivoSemResposta({ status: 'precisa_joao', text: 'Pode me ligar?' }), 'atendimento_joao')
  assert.equal(motivoSemResposta({ status: 'inbound', text: 'Olá' }), 'atendimento_humano')
  assert.equal(motivoSemResposta({ status: 'sem_interesse', text: '[sticker]' }), 'sem_texto')
})

test('recusa registro sem lead_id', () => {
  assert.throws(() => eventoDecisao({ status: 'sem_interesse', text: 'Valeu' }), /lead_id obrigatório/)
})
