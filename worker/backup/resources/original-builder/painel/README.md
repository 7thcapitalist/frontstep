# Painel da Fábrica

Visão operacional da Frontstep. Publicado como artifact no claude.ai e lido ao vivo do n8n
pelo conector do João: só leitura, nenhuma chamada daqui gasta execução do plano.

## O que mostra

- Placar: leads no CRM, a abordar, abordados, responderam, builds prontos, custo variável 30d.
- Funil por etapa, com contagem e percentual.
- O builder: se o mini PC está livre ou com quem, e todo build com estado e link da prévia.
- Por nicho: onde vale continuar.
- Captura: cada alvo com ativo, esgotado ou desligado, e há quanto tempo foi buscado.
- Operação: workflow ligado ou desligado, e quantas execuções recentes falharam.
- Atividade: últimos eventos do `holding_ledger`.

## De onde vêm os números

| Seção | Fonte |
|---|---|
| Funil e por nicho | tabela `frontstep_funil` (`jEGear4IteyXOkXx`) |
| Builder | tabela `frontstep_leads` (`oBinMFWcxuao8UI6`) |
| Captura | tabela `frontstep_alvos` (`EG01zb0SiQWhQWwP`) |
| Custos e atividade | tabela `holding_ledger` (`NfTDqOIs50U4Im4I`) |
| Operação | `search_workflows` e `search_workflow_executions` |

`frontstep_funil` é um retrato das contagens por etapa do CRM. Ele é gravado pelo nó
`Snapshot do funil` do workflow 0 (captura), que pega carona numa execução que já acontece
de hora em hora. O painel não lê a planilha direto: conector de planilha e CRM estão em
contas diferentes, e consultar a planilha de dentro da página gastaria execução.

## Cuidado ao mexer

O nó `Leads no poço` do workflow 0 precisa continuar com `executeOnce`. Sem isso ele lê a
planilha uma vez por alvo, a contagem do poço sai multiplicada, e tanto o painel quanto a
decisão de gastar Apify ficam errados. O `Snapshot do funil` deduplica por `lead_id` como
segunda linha de defesa, mas a decisão de captura não.

## Publicar uma versão nova

O arquivo é autocontido: nada de CDN, nada de fetch externo. A página declara a capacidade
`mcp` com o servidor `n8n` e três ferramentas de leitura. Para publicar, use o Claude com
a ferramenta Artifact apontando para este arquivo e para a URL do artifact existente.
