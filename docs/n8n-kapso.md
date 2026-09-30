# n8n + Kapso: outreach loop (2026-09-21)

n8n cloud: jvcarvalho.app.n8n.cloud (personal project). Plan: Starter (2,500 executions/month) since the trial ran out. RULE: never poll n8n; count executions for every design.

## Workflows
- **Frontstep | 1. Outreach (envio do template)** id 6Pj4l8q7lpX10KB6. NOT published yet (run manually for tests). Weekdays 13:00 UTC (10h BRT) + manual. Reads `leads` where status=pronto, limit 15/run, one at a time, sends Kapso template via HTTP, marks `contatado` (writes phone_e164, wa_key, outreach_sent_at, outreach_wamid). Random 25-70s pause between sends. Send error -> `erro_envio` + error text. Template = lead's `template` column if filled, else Config default `frontstep_sem_site_v1`. Phone: numbers starting with "+" are used as-is (international); otherwise Brazil (55) is assumed.
- **Frontstep | 2. Respostas do WhatsApp (Kapso)** id yOtlTtVm6yPaftQT. PUBLISHED. Webhook (POST, rawBody on). Code node "Verificar assinatura Kapso" checks X-Webhook-Signature = HMAC-SHA256(raw body, secret); invalid requests dropped (secret only inside that node, redacted in the exported JSON). Looks up lead by wa_key (first 2 digits after country code + last 8; handles the missing 9th digit on BR numbers). Non-leads ignored. Logs to `mensagens`. If status=contatado: Text Classifier (Claude Sonnet via n8n gateway credits) -> sim/nao/optout/duvida(+fallback).
  - sim -> aceitou_previa, auto reply, POST to `pipeline_demo_url` (/webhook/frontstep/lead)
  - nao -> sem_interesse; optout -> optout; duvida/other -> precisa_joao (no auto reply)
  - previa_enviada / negociando / aguardando_pagamento are routed to "6. Vendas: bot de negociação".
- **Frontstep | 8. Follow-up (sem resposta)** id Qx1JF4MXIAtPf4C0. NOT published yet (wait for template approval). Weekdays 14:00 UTC (11h BRT) + manual. Leads in `contatado`: no reply 3 days after outreach and no follow-up yet -> sends `frontstep_followup_v1` once, writes `followup_sent_at`; follow-up older than 4 days and still `contatado` -> `sem_resposta`. ~22 executions/month.
- Workflows 0 and 3-7 belong to the preview/sales pipeline (see status docs).

## Sheet "Frontstep CRM"
- Native Google Sheet (not .xlsx); tabs leads, mensagens.
- leads: lead_id, business_name, niche, city, phone, rating, reviews, maps_url, status, phone_e164, wa_key, outreach_sent_at, outreach_wamid, intent, last_reply, last_reply_at, demo_url, notes, error, followup_sent_at (+ optional `template`, `photos`)
- mensagens: received_at, lead_id, phone, direction, type, text, wamid, conversation_id
- Status flow: novo -> pronto (Joao approves) -> contatado -> aceitou_previa | sem_interesse | optout | precisa_joao | erro_envio | sem_resposta -> (preview/sales statuses)

## Kapso
- Current number: free Kapso US number (phone_number_id set in the Config nodes of wf 1, 2, 8). A Brazilian number comes later; then swap phone_number_id everywhere (and the new number's webhook needs the same URL + its secret in the Code node).
- Send: POST https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages, header X-API-Key.
- 24h rule: free-form only within 24h of the lead's last message; otherwise approved templates only. Still needed: demo-ready template, payment reminders.

## Templates (MARKETING, pt_BR, named param nome_negocio, quick replies "Quero ver"/"Agora não")
- frontstep_sem_site_v1 (default), frontstep_site_melhorias_v1, frontstep_followup_v1
- Payloads: button 0 = previa_sim, button 1 = previa_nao.
