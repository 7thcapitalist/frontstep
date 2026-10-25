# Proteger /webhook/frontstep/lead com segredo

Problema: o webhook do workflow 3 (Brief) aceita qualquer POST; quem souber a URL enfileira builds (US$ 4 cada).
Quem chama hoje: workflow 2 (Respostas), no ramo "sim". Confirmar no n8n se há outro chamador (workflow 0 / formulário) antes de ligar.

## Como aplicar (ordem importa: chamador primeiro, receptor depois)
1. Gere um segredo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. **Workflow 2**, nó HTTP que faz POST em `/webhook/frontstep/lead`: adicione o header `x-frontstep-secret: <segredo>`. Publique.
3. **Workflow 3**: logo após o Webhook, adicione um Code node "Verificar segredo" com o conteúdo de `verificar-segredo.js`, trocando `__SEGREDO__` pelo valor (mesmo padrão do "Verificar assinatura Kapso"). Ligue a saída dele ao resto do fluxo. Publique.
4. Teste: `curl -i -X POST <url>/webhook/frontstep/lead -d '{}'` deve não enfileirar nada (execução termina no Code node); com `-H "x-frontstep-secret: <segredo>"` segue normal.
5. Não commite o segredo. O export `scripts/export-n8n.mjs` mascara.

Alternativa sem código: Webhook node > Authentication > Header Auth, com credencial nova. Equivalente, mas cria credencial.

Efeito colateral: o Code node devolve `[]`; o webhook (modo "Respond immediately") ainda responde 200. Se quiser 401, mude o Webhook para "Using Respond to Webhook" e responda 401 num ramo de falha (cuidado com a armadilha do Respond em ramo paralelo, ver CLAUDE.md do coder).

## Teste
`node test.mjs`: roda o corpo do node com entrada simulada. Rejeita sem header, com segredo errado, vazio e com placeholder; aceita o certo.
