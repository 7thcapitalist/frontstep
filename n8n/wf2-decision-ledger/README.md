# wf2: decisão durável para caminhos sem resposta

O ramo falso de `Atendente responde?` termina sem mensagem automática de propósito. Hoje ele depende apenas do nó
`Anotar última mensagem (outras etapas)` no Google Sheets. Se esse update falhar, a execução continua como sucesso,
mas o vigia não encontra decisão para a mensagem.

## Patch no n8n

No workflow `yOtlTtVm6yPaftQT`:

1. preserve a ligação falsa de `Atendente responde?` para `Anotar última mensagem (outras etapas)`;
2. ligue o mesmo ramo falso a um Code node `Decisão: sem resposta`, usando o conteúdo de `n8n-code-node.js`;
3. ligue-o a um Data Table insert `Ledger: decisão sem resposta`, tabela `holding_ledger`, com as mesmas colunas do
   nó `Ledger: gravar` do wf6;
4. no insert, use `onError = continueRegularOutput`. O evento não contém telefone nem texto;
5. publique e rode `node scripts/bot-replay/checar-publicado.mjs` conforme o playbook.

O evento `wf2_sem_resposta` é uma decisão explícita. Ele não deve ser criado antes de `Atendente responde?`, pois
isso esconderia uma parada silenciosa anterior no fluxo.
