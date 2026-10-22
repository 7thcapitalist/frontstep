# Relatório da fábrica local pelo Codex

## Substituição da prévia aberta em 16/10/2026

O endereço antigo da Mesa da Praça, `/preview/23d0d24c-80ee-451b-bd0d-6edd8cbcd05d/`, agora serve o exemplar novo com quatro fotografias reais licenciadas e crédito visível. O código anterior foi preservado em `local-factory/jobs/23d0d24c-80ee-451b-bd0d-6edd8cbcd05d/site/historical-public-before-photo-replacement/`. O QA reexecutado sobre o mesmo diretório publicado passou; resultado em `qa-replaced/qa-result.json`. A página foi aberta no próprio endereço antigo e o primeiro viewport mostrou a nova fotografia. A revisão antiga de 8/10 abaixo descreve somente o código anterior, não a página que o URL mostra agora. Os nove exemplares atuais estão em `local-factory/examples/`, com galeria local na porta 4191.

Os nove exemplares atuais passaram outra rodada de QA, com 40, 34, 32, 34, 34, 32, 32, 32 e 32 verificações por nicho, sem falhas. A URL antiga do restaurante passou 36 verificações depois da substituição. A auditoria de movimento dos nove exemplares observa eventos reais de animação ou transição, sem erros de página nem conteúdo principal oculto em movimento reduzido. O job automático recente de contabilidade `ac4bd8ab-b34a-419d-88bf-56e9dbc3037b` passou no QA mas terminou em 8/10 na quinta crítica; sua nova prévia ficou bloqueada. Isto é evidência de que o agente ainda precisa melhorar a composição para novos briefs, apesar dos exemplares prontos e do gate funcional. Seu último código recebeu um reparo manual dos três pontos apontados, seguido por QA e auditoria de movimento aprovados em `qa-manual-final/`; sem uma nova crítica visual independente, esse reparo não foi publicado como job aprovado.

O job automático de beleza `ccb35cba-fc2a-4ad2-838a-b0939d74e330` também passou no QA e na auditoria de movimento, mas evoluiu de 7 para 8/10 e não atingiu o mínimo de 9/10 após cinco tentativas; ficou bloqueado. O job de papelaria `bfb8c66c-196c-49ce-9a69-5b719e937284` teve o mesmo corte em 8/10. A análise comum: o agente produzia uma composição alternativa mais genérica mesmo com o exemplar do nicho disponível. O próximo job recebe instrução revisada para usar o código local do exemplar como sistema visual inicial quando adequado, adaptando fatos, marca, mídia e interação ao novo brief. Essa instrução passou na checagem de sintaxe, mas sua primeira rodada visual ficou aquém da meta; os nove exemplares da galeria seguem como as prévias confiáveis.

Uma rodada com essa instrução revisada foi iniciada: `46e37576-1a4e-4203-bc5e-e0a109bdb122`. O plano escolheu uma direção baseada no exemplar. QA funcional passou; a primeira auditoria de movimento detectou resumo oculto em movimento reduzido e o agente reparou o defeito. A segunda crítica visual avaliou a página em 7/10, apontando tipografia uniforme, repetição e conflito de um link de salto com o título no celular. A execução foi interrompida na terceira tentativa para evitar mais gasto em reparos sem evidência de melhora; não existe prévia aprovada desse job. A hipótese de simplesmente fornecer o exemplar como partida ainda não está validada.

## Correção em 16/10/2026: novo critério visual e insumos obrigatórios

As aprovações de 8/10 descritas abaixo são **históricas**, anteriores à exigência de fotos reais para restaurantes e ao novo mínimo de 9/10. Não servem como aprovação visual atual. O conteúdo original do preview Mesa da Praça `23d0d24c-80ee-451b-bd0d-6edd8cbcd05d` foi reavaliado: o QA reprovava `FOOD_MEDIA_USED` e `FOOD_MEDIA_FIRST_VIEWPORT` em desktop e mobile. As duas ilustrações geradas como experimento foram removidas do job após rejeição do usuário. O URL agora mostra o exemplar corrigido, conforme a seção acima.

O builder local agora incorpora as instruções recuperadas de `frontstep-coder` e três skills MIT de `Leonxlnx/taste-skill` (design, direção visual e redesign). Ele gera três direções locais, registra a escolha e seus motivos no plano, valida alegações contra o brief e copia as fotos locais para o job com manifesto. Fotos de comida devem ser arquivos locais JPEG, PNG ou WebP declarados em `media.photos`; sem elas, o brief recebe HTTP 400. Um brief sem foto, diferencial concreto ou endereço também recebe HTTP 400. Isso evita gerar uma página aparentemente acabada a partir de identidade fictícia insuficiente. O post do Instagram enviado pelo usuário é uma lista de ferramentas e não fornece fotos de pratos ou dados de empresa.

Teste completo antes da nova validação de identidade: o job de contabilidade `d33bf627-0680-42db-8881-7dbda5632f69` passou no QA funcional depois de reparo, mas a revisão visual ficou em aproximadamente 6,4/10 após três tentativas. Status final `failed`, sem novo preview aprovado. Depois, os dois briefs sintéticos existentes foram submetidos novamente: contabilidade recebeu HTTP 400 por falta de identidade concreta; restaurante recebeu HTTP 400 por falta de `media.photos`. Esses bloqueios são o resultado esperado. `node --check` dos módulos modificados, `npm test` do QA e testes locais do seletor de direções passaram. O servidor já em execução precisa ser reiniciado para carregar o código novo.

As alterações ficaram restritas à fábrica local, QA e documentação. Nenhum worker de produção, deploy, mensagem, pagamento ou fluxo n8n foi alterado.

**Data:** 16/10/2026, horário de Nova York. **Resultado:** restaurante e contabilidade sintéticos aprovados no QA funcional e na revisão visual independente com 8/10. Nenhum lead, mensagem, pagamento, n8n ou deploy de produção foi acionado.

## Atualização: skills de frontend e revisão visual

Foram pesquisados repositórios públicos com grande adoção e fixadas versões locais da [Anthropic Frontend Design](https://github.com/anthropics/skills/tree/main/skills/frontend-design), [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) e [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines), esta última também usada pela [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines). Estrelas, commits, licenças e modo de uso estão em `local-factory/design-kit/README.md`. Estrelas indicam adoção, não garantem qualidade visual.

O servidor local agora pesquisa candidatos com o motor UI/UX Pro Max, pede duas direções e uma escolha justificada em `site/design-plan.json`, constrói a página a partir do plano, executa QA funcional e envia screenshots desktop/mobile, inclusive o estado preenchido da feature, a um agente Codex independente em modo somente leitura. Nota abaixo de 8/10 impede preview e aciona até dois reparos. O revisor recebeu instrução explícita para avaliar fixtures fictícias sem exigir depoimentos, credenciais ou fotos inventadas. O roteiro está em `local-factory/design-kit/DESIGN-WORKFLOW.md`; o procedimento de execução em `RUN-CODEX.md`.

| Segunda rodada | Resultado observado | Evidência |
|---|---|---|
| Vila Clara Contabilidade, job `40cc6403-39d3-49fc-aaca-2dcd55c2e8cc` | QA passou; revisão visual terminou em 6/10 e bloqueou o preview. Havia repetição de conteúdo e composição genérica. Esta execução usou a versão anterior do prompt de revisão, que também pediu provas incompatíveis com o brief fictício. | `local-factory/jobs/40cc6403-39d3-49fc-aaca-2dcd55c2e8cc/qa/visual-review-3.json` |
| Mesa da Praça, job `23d0d24c-80ee-451b-bd0d-6edd8cbcd05d` | Primeira revisão visual 7/10. Corrigidos manualmente a bandeja e a legenda no mobile após esgotar reparos automáticos. QA reexecutado com sucesso e nova revisão independente aprovou com 8/10. Preview local liberado. | `local-factory/jobs/23d0d24c-80ee-451b-bd0d-6edd8cbcd05d/qa-manual/qa-result.json`, `visual-review.json`, screenshots |
| Vila Clara, nova rodada, job `62c49e3e-8759-4a19-9bb0-1ba3cedf9931` | Após as tentativas anteriores em 7/10, foi feita uma reformulação coerente: hero com título dominante e pauta visual de três entradas, serviços em linhas abertas e botão explícito para revisar a mensagem. O estado preenchido mobile oculta as etapas anteriores. QA principal, edição de escolha e bloqueio de cidade vazia passaram; nova revisão independente aprovou com 8/10. | `local-factory/jobs/62c49e3e-8759-4a19-9bb0-1ba3cedf9931/qa-redesign/qa-result.json`, `visual-review.json`, screenshots; `qa-edit/qa-result.json`; `qa-empty/qa-result.json` |

Previews aprovados: [Mesa da Praça](http://127.0.0.1:4178/preview/23d0d24c-80ee-451b-bd0d-6edd8cbcd05d/) e [Vila Clara](http://127.0.0.1:4178/preview/62c49e3e-8759-4a19-9bb0-1ba3cedf9931/). Em 16/10/2026, ambos retornaram `succeeded`, QA `passed` e revisão 8/10; HTML, CSS e JS da Vila Clara retornaram HTTP 200. A revisão final apontou ajustes opcionais no texto auxiliar mobile, repetição do aviso de demonstração e alinhamento das linhas de serviço. O primeiro preview da contabilidade continua disponível como histórico, mas só foi aprovado no gate funcional antigo.

## Fonte e implementação

- O código real de `7thcapitalist/frontstep-coder`, branch `main`, commit `0c24be3ea0990abcd0860450de89c09d55c0438d`, foi recuperado em `builder/`. Os 80 arquivos coincidem com os hashes de blob do GitHub. Detalhes em `BUILDER-ORIGIN.md`. O snapshot anterior em `coder-skill/` foi preservado.
- O modo local está em `local-factory/server.mjs`, separado do worker histórico. Ele escuta `127.0.0.1:4178`, valida briefs sintéticos e slug, persiste fila e idempotência, limita retries/reparos, trata falha de spawn/timeout/interrupção e só libera preview com artefatos e QA aprovado. O subprocesso usa `codex exec --json --sandbox workspace-write -C <site>`; seus eventos JSONL, mensagem final e erros ficam por job. O ambiente do Codex é uma lista permitida de variáveis locais sem tokens de infraestrutura.
- Cada job recebe cópias de cinco referências recuperadas do builder (nicho, direção, estilo, acessibilidade e conversão). O prompt local proíbe deploy, serviços externos e dados reais. O worker de `builder/worker/` não foi iniciado, pois ainda chama Claude, faz `vercel deploy --prod` e callbacks n8n.
- O gate em `local-qa/` usa Playwright 1.56.1 com Chromium instalado por `npm run install-browser`. Testa desktop (1365 px) e mobile (390 px), título, idioma, H1, overflow, âncoras, links internos, labels, nomes de botões, imagens, erros de console e HTTP, aviso fictício, feature interativa e fallback sem JS. Saída ausente, ilegível ou não zero bloqueia o job.

O checkout `frontstep/` estava em `main` no commit `5b083d5b650906b88c5100085f96ccdd3febc09d` antes destas alterações. Há mudanças locais não commitadas em `.gitignore` e `README.md`, mais `builder/`, `BUILDER-ORIGIN.md`, `local-briefs/`, `local-factory/`, `local-qa/`, `RUN-CODEX.md` e este relatório. Nenhum commit ou push foi feito.

## Builds reais

| Site fictício | Job | Tempo observado | QA principal | Preview local |
|---|---|---:|---|---|
| Vila Clara Contabilidade, triagem | `dd539a93-d02b-40e7-99c5-b313bf6291af` | 2 min 59 s, 04:43:58–04:46:57 | 30 checks, 0 falhas, 1 tentativa | `http://127.0.0.1:4178/preview/dd539a93-d02b-40e7-99c5-b313bf6291af/` |
| Mesa da Praça, pedido | `3f887b97-516b-4a28-b01f-e0c8af532ccd` | 3 min 05 s, 04:46:59–04:50:04 | 30 checks, 0 falhas, 1 tentativa | `http://127.0.0.1:4178/preview/3f887b97-516b-4a28-b01f-e0c8af532ccd/` |

Os sites são HTML/CSS/JS estáticos sem dependências de runtime. Cada um usa um único arquivo JS e CSS, então não houve etapa separada de bundling. O custo financeiro ou de tokens não foi medido; não foi estimado.

### Evidências da contabilidade

Brief: `local-briefs/contabilidade-vila-clara.json`. Fonte: `local-factory/jobs/dd539a93-d02b-40e7-99c5-b313bf6291af/site/public/`. Resultado principal: `.../qa/qa-result.json`; screenshots `.../qa/desktop.png`, `mobile.png`, `desktop-feature.png`, `mobile-feature.png`, `desktop-nojs.png`, `mobile-nojs.png`. Eventos e saída final: `.../codex-events-1.jsonl`, `codex-final-1.txt`.

O cenário principal preenche assunto **Trocar contador**, estágio **Empresa ativa** e cidade **Campinas**; confere resumo e URL demonstrativa sem clicar em WhatsApp. Após inspeção, foi corrigido um defeito: a ação mostrava URL pronta com campos vazios. Agora os campos são obrigatórios, o erro é visível e não há `href` enquanto a triagem está incompleta. O gate foi reexecutado com 30/30 checks. Cenários extras `qa-empty/` e `qa-change/` passaram com 30/30 checks cada: vazio sem URL, e mudança para **Abrir empresa** refletida no resumo/URL. Screenshots desktop e mobile foram revisados visualmente.

### Evidências do restaurante

Brief: `local-briefs/restaurante-praca-do-sol.json`. Fonte: `local-factory/jobs/3f887b97-516b-4a28-b01f-e0c8af532ccd/site/public/`. Resultado principal e seis screenshots ficam em `.../qa/`; eventos e saída final em `.../codex-events-1.jsonl` e `codex-final-1.txt`. Os quatro preços do cardápio são fixtures fictícias, rotuladas como tal no site.

O cenário principal adiciona dois pratos de R$ 38,00 e um suco de R$ 9,00, confere total de **R$ 85,00** e URL demonstrativa. Cenários extras `qa-remove-one/` e `qa-empty/` passaram com 30/30 checks: remover um prato resulta em **R$ 47,00**; remover tudo resulta em **R$ 0,00** e ação indisponível. Screenshots desktop e mobile foram revisados visualmente. Nenhum pedido foi enviado.

## Testes do sistema e operação

Comandos executados:

```powershell
cd frontstep/local-qa
npm test
# positive: exit 0, 0 failures
# negative: exit 1, 16 failures

cd ../..
node frontstep/local-factory/test-api.mjs
# passou: slug inválido, erro de spawn, idempotência, conflito de chave,
# limite de retries, persistência, reinício com queued e marcação de running como interrupted

node frontstep/local-factory/run-demos.mjs
# dois jobs succeeded, QA passed, sem tentativa de reparo automático
```

O serviço local foi iniciado em segundo plano e consultado em 16/10/2026: `/health` retornou `status: ok`, fila zero, `externalSystems: not checked`; os dois previews e os quatro assets CSS/JS retornaram HTTP 200. Para iniciar, parar, submeter e consultar jobs, use `RUN-CODEX.md`. HTTP 200 isolado não foi usado como aprovação; os relatórios Playwright e os cenários de feature são a evidência.

A instância deixada rodando nesta execução usa o processo Windows PID `13396`. Para encerrá-la agora: `Stop-Process -Id 13396` em PowerShell. Depois de reiniciar o serviço em primeiro plano, use `Ctrl+C` para parar.

## Limites e próximos passos

Esta prova cobre somente a geração local de fixtures. Os arquivos de jobs e screenshots ficam no computador em `local-factory/jobs/` e são ignorados pelo Git; copie essa pasta se quiser arquivar ou compartilhar a evidência. O servidor precisa estar rodando para abrir os previews. O painel histórico em `C:\Users\joaov\Documents\frontstep-dashboard-handoff-20261001-2` não foi incorporado, pois é snapshot e não traz estado vivo dos jobs.

Para conectar a produção, João precisa informar **máquina e sistema operacional de destino, porta e domínio/túnel, contrato atual do endpoint e callback n8n, autenticação, projeto/escopo Vercel e regra explícita de preview versus publicação**. Depois, exportar os workflows atuais e testar com uma fixture e callback controlado, com rollback preparado. Confirmar separadamente WAHA, janela de envio, aceite do cliente e pagamento antes de alterar esses caminhos. Nenhum desses ambientes foi verificado por este teste local.
