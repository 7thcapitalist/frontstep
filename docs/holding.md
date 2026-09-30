# Holding layer (manager of factories)

Goal: run several automated businesses ("factories") from n8n, track each one's money, reinvest in winners, clone them, kill losers, test pricing/scripts. Joao approves every big move (new number, clone, kill, workflow changes).

## Build order
1. DONE 2026-09-29: ledger + event logging in Frontstep workflows.
2. DONE 2026-09-29: pricing A/B test in the sales bot (wf 6) + negotiation events in the ledger.
3. DONE 2026-09-29: weekly Holding report (workflow sCHVPhr3kF3veK5v).
4. Clone logic and factory 2 after Frontstep has ~10 sales.

## Tables (n8n data tables)
- holding_ledger: factory_id, event, kind (revenue/cost/metric), amount_brl, qty, cost_type, lead_id, variant, source, note, occurred_at. Rows 1-2 are a test (variant "TESTE | TESTE, MG"); ignore them in reports.
- holding_factories: factory_id, name, status, vertical, market, whatsapp_number, started_at, notes. Row: frontstep_br.
- holding_fixed_costs: item, factory_id (or "shared"), monthly_brl, currency_original, amount_original, active, notes.
- holding_experiments: experiment, factory_id, variant, weight, config_json, active, started_at, notes.
- holding_reports: weekly report history.

## Events logged (inside existing workflows, no extra executions)
- wf 0 Captura de leads: apify_search (cost) + leads_captured (metric, qty). Variant = "nicho | cidade".
- wf 1 Outreach: outreach_sent per template. Variant = template name.
- wf 5 Prévia: site pronto: demo_built / demo_failed. Variant = fx.
- wf 6 Vendas: llm_sales_message, price_quoted, checkout_sent, handoff_joao, optout. Variant = price_variant.
- wf 7 Pagamento confirmado: sale_paid (revenue) + payment_fee (cost). Variant = price_variant.
- Every ledger node has onError continueRegularOutput so logging never breaks the pipeline.

## Pricing experiment
- experiment "pricing": A_tabela (1290/790, 2190/1390, 2990/1990) weight 50; B_entrada_baixa (990/690, 1890/1290, 2690/1890) weight 50. config_json = {plan:{list,floor}}.
- wf 6 assigns a variant per lead (stable hash of lead_id, by weight) and saves it in frontstep_leads.price_variant. "Aplicar regras" enforces the variant's floors.
- To change the test: edit rows in holding_experiments (weight 0 or active=false stops assigning).

## Weekly report
- "Holding | Relatório semanal" (sCHVPhr3kF3veK5v): Mondays 09:00 America/Sao_Paulo, 1 execution/week, plus manual "Rodar agora".
- Code computes numbers and a fixed-rule action per factory (validar, avaliar_fechar, escalar, manter) and bottleneck flags. Claude only writes the WhatsApp text (<=1.300 chars, PT-BR, no dashes). Sent via WAHA; saved in holding_reports.

## Painel da Holding
- Artifact "Painel da Holding": https://claude.ai/artifact/7ind7smdfuUDBKHv2a9qoC. Reads n8n live through the claude.ai n8n connector (reads cost no executions).
- Edits go through "Holding | Admin do painel" (t6QIsYRUKD2WRknA): n8n-login form, validates columns/types. Each edit = 1 execution.
