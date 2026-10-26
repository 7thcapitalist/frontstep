# Frontstep

Fábrica de sites para pequenos negócios: acha o lead no Google Maps, oferece uma prévia pelo WhatsApp, monta o site com Claude Code no mini PC, negocia, cobra e entrega. Repositório privado.

## Pastas

| Pasta | O que tem |
|---|---|
| `coder-skill/` | A skill `frontstep-coder`: regras do builder, referências e o QA gate (`scripts/qa-gate.mjs`) |
| `worker/` | Servidor do mini PC (POST /build, Claude Code headless, gate, deploy na Vercel) |
| `n8n/workflows/` | Export dos workflows Frontstep e Holding, sem segredos |
| `site/` | Site da Frontstep |
| `docs/` | Status, marca, holding, n8n + Kapso |
| `scripts/` | Sincronização, backup do n8n e preview auditável da vitrine (`deploy-vitrine.mjs`) |

## Fluxo

```
0 Captura (Apify/Maps) -> planilha CRM
1 Outreach (template Kapso) -> 2 Respostas (classifica sim/não)
sim -> 3 Montar brief -> POST /build no mini PC -> Claude Code + frontstep-coder -> QA gate -> Vercel
    -> 5 Site pronto (manda a prévia, janela 08-20 BRT)
6 Bot de vendas (preço, piso, domínio, link Mercado Pago) -> 7 Pagamento confirmado -> 8 Pós-venda
Holding: ledger de custos e receita, teste de preço, relatório semanal
```

## Segredos ficam fora do repo

Tokens moram só em `/etc/frontstep-worker.env` no mini PC e nas credenciais do n8n. `.env.example` lista os nomes. Antes de commitar algo novo:

```
git grep -nE "sk-ant|APP_USR|ghp_|Bearer [A-Za-z0-9]{20}"
```

## Tarefas comuns

**Trazer o que está no mini PC** (no Windows, na pasta do repo):
```
powershell -ExecutionPolicy Bypass -File scripts\pull-from-minipc.ps1
```

**Backup do n8n** (qualquer máquina com Node 18+ e acesso à internet):
```
N8N_API_KEY=... node scripts/export-n8n.mjs
```

**Atualizar o mini PC** (depois que ele tiver um clone do repo):
```
cd ~/frontstep && git pull && sudo bash worker/update.sh
```

**Gerar preview e cartão de publicação da vitrine** (depois que um PR entrar na `main`):
```
node scripts/deploy-vitrine.mjs
```
O script passa pelo guard de orçamento, publica apenas em Preview, verifica HTTP/console,
roda Lighthouse mobile e desktop, anexa os comparativos ao Paperclip e abre o cartão
“Publicar a vitrine nova?”. Ele registra sucesso ou falha em `ledger/runs.jsonl` e nunca
promove para produção sozinho.

## Regras que valem para tudo

- Nunca fazer polling no n8n. Contar execuções em todo desenho (plano Starter, 2.500/mês).
- Mensagem para cliente só entre 08:00 e 20:00 BRT; fora disso agenda, nunca descarta.
- Sem travessão nos textos.
