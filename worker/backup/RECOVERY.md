# Recuperação do material de construção

Recuperação local em 20/10/2026, sem conexão ao mini PC, instalação ou execução
dos pacotes. O mini PC foi informado offline pelo proprietário. O estado atual
dos arquivos e processos dessa máquina não foi verificado.

## Origem original

O repositório local `C:\Users\joaov\Downloads\frontstep-coder` está limpo no
commit `0c24be3ea0990abcd0860450de89c09d55c0438d`. A recuperação leu diretamente os
80 blobs desse commit pelo Git, preservando os bytes originais sem depender da
conversão de LF/CRLF do checkout.

A procedência registrada anteriormente em
`C:\Users\joaov\Documents\Codex\2026-10-15\website-factory-heitor\frontstep\BUILDER-ORIGIN.md`
identifica o mesmo commit de 02/10/2026. A comparação dos textos entre essa
cópia e Downloads não encontrou divergências após normalizar finais de linha.
Isso confirma a correspondência desses backups locais, não a produção atual.

| Conteúdo recuperado | Local neste pacote |
|---|---|
| Skill original completa, 13 arquivos de referência, regras por nicho | `resources/original-builder/skills/frontstep-coder/` |
| Scripts de QA e gate originais | `resources/original-builder/skills/frontstep-coder/scripts/` |
| Starter, build, efeitos, pesquisa UI/UX e bases de dados | Subpastas `assets/` e `references/scripts/` da skill original |
| Worker, hook e instalador históricos | `resources/original-builder/`, preservados com sufixo `.source.txt` |
| Painel histórico | `resources/original-builder/painel/`, sem integração/ativação |
| Skills posteriores de design, acessibilidade, taste, React, GSAP e Three.js, fontes e runtime de movimento | `resources/design-kit/` |
| Exemplares sintéticos, screenshots e evidência histórica | `resources/examples/` |
| Briefs sintéticos, cenários e mídia de referência | `resources/local-briefs/` |
| QA funcional e auditoria de movimento posteriores, fixtures e lockfile | `resources/local-qa/` |
| Código posterior da fábrica local (incluindo planejamento, crítica, retries e servidor) | `resources/local-factory-source/*.source.txt` |

As extensões `.source.txt` preservam o código integral, mas evitam disponibilizar
um worker/instalador como comando normal de execução. Nenhum desses arquivos é
importado pelo núcleo do reserva. O `CLAUDE.md` histórico também é referência
textual, não política global instalada.

O conjunto posterior veio da cópia local do projeto de 15/10, com trabalho
documentado em 16 e 17/10/2026. Essa cópia tinha alterações locais preexistentes,
que não foram modificadas. Logs, jobs, segredos, `node_modules`, caches de Python
e saídas temporárias de testes não foram importados. A cópia de `site/` da
Frontstep não foi alterada nem substituída.

## Evidência de consumo excessivo no código recuperado

No worker histórico do mini PC (`original-builder/worker/worker.mjs.source.txt`):

- Chamadas `run("claude", ...)` para build e reparo, sem seleção explícita de
  modelo; até 250 turnos no build e 120 no reparo.
- Deduplicação em memória por `Set`, removida ao terminar: não impõe teto
  persistente por job após retry ou reinício.
- Saída em texto, sem registro estruturado de tokens por chamada.
- Timeout apenas envia sinal ao pai e não comprova encerramento dos filhos.

No servidor posterior (`local-factory-source/server.mjs.source.txt`):

- Esforço padrão `high`; configuração inválida também cai silenciosamente em
  `high`.
- Planejamento por IA, até dois reparos do plano, geração e até quatro reparos
  por padrão, além de crítica por IA em cada tentativa. Isso pode chegar a 13
  invocações do CLI num ciclo; cada invocação ainda pode fazer múltiplas chamadas
  internas. Não equivale a 13 requisições medidas ao modelo.
- Endpoint de retry pode executar novamente o ciclo. Não há teto persistente
  conjunto para todas as fases de IA.

Esses caminhos não foram ativados ou conectados ao reserva. A política nova
recusa fases extras e adaptadores não auditados. Corrigir uma cópia textual não
altera o executor já instalado no mini PC ou o servidor da outra pasta.

## Integridade e preservação

O manifesto contém origem, caminho, tamanho e SHA-256 de cada um dos 682
arquivos, totalizando 145.349.331 bytes. Cada arquivo importado passou na
verificação local. O importador faz pré-checagem de colisões e cria arquivos de
modo exclusivo; um arquivo existente diferente aborta a importação. Nenhum dos
arquivos preexistentes da pasta original foi sobrescrito.

O manifesto identifica o conteúdo recuperado. Não atesta completude da máquina
remota, instalação das dependências, disponibilidade de modelo, medição de
quota, capacidade operacional de geração ou qualidade de novos sites.
