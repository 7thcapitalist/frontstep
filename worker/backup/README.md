# Executor reserva local do Frontstep

Estado em 20/10/2026: fluxo local de construção e reparo implementado, recursos
recuperados e testes com mocks, **geração real bloqueada**. Destino: este Windows, na pasta original
`C:\Users\joaov\Documents\frontstep`. Requer Python 3.13, já disponível aqui.
Nenhuma dependência foi instalada e nenhum serviço foi iniciado.

Este pacote ainda não é uma substituição operacional do mini PC. Ele contém o
material do builder original e do builder local posterior, pipeline de arquivos,
QA e adaptador de chamada única. Não há integração ativa com a fila de produção
nem disponibilidade de modelo/saldo comprovados. Não anunciar paridade visual
ou operacional com produção com base nos testes com mocks.

## Arquivos locais

| Arquivo | Função |
|---|---|
| `executor.py` | Política central, SQLite, pausa, reservas por job/fase, orçamento e uso |
| `durable_queue.py` | Admissão, aquisição e retomada local no mesmo `jobs`/ledger, sem consumidor contínuo |
| `DURABLE-QUEUE.md` | Contrato da fila, evidência atual de testes entre processos e limitações |
| `config.py`, `config.example.json` | Configuração estrita; `site_builder.py status --config` carrega o arquivo, sem retomar geração |
| `site_builder.py` | Brief, contexto real das referências, mídia local, arquivos do site, QA e até um reparo |
| `messages_runtime.py` | Protocolo de chamada única e transporte opcional de API, desligado por padrão |
| `browser_qa.mjs` | QA local determinístico, sem servidor e com rotas externas bloqueadas |
| `process_transport.py` | Transporte JSON de processo para futura integração, ainda desconectado |
| `import_resources.py` | Recuperação sem sobrescrita, filtros e manifesto de procedência |
| `resource_pack.py` | Verificação dos hashes e montagem offline de workspace novo |
| `tests/` | Testes com runtimes, resultados e processos simulados |
| `resources/manifest.json` | Inventário completo, origens e SHA-256 por arquivo |
| `RECOVERY.md` | Fontes recuperadas, cobertura e pendências de equivalência |

Os arquivos anteriores em `coder-skill/`, `site/`, `worker/README.md` e nas
pastas de origem foram preservados. Não há instalação de skills globais.

## Fila durável local

A etapa posterior à verificação histórica `RECOVERY-VERIFICATION.md` implementou
uma fila local no mesmo SQLite, sem segunda tabela de fila ou outro banco.
Pedidos podem ser registrados enquanto pausada; aquisição e execução continuam
bloqueadas. A API é explícita e finita, sem servidor, polling ou consumidor
persistente. Só resultados conhecidos e terminais podem ser confirmados.

A evidência atual está em [DURABLE-QUEUE.md](DURABLE-QUEUE.md): **82 testes Python
e 3 testes Node passaram**, incluindo corrida de aquisição e queda antes,
durante e após uma chamada simulada. Uma chamada reservada de resultado incerto
permanece bloqueada para reconciliação. Isso não implementa failover entre hosts
nem ativa a fila de produção, o adaptador ou a geração.

## Controles implementados

- `Policy.paused=True`, modelo `None`, esforço `low`. Não foi confirmado modelo
  real disponível na conta sem geração. Não há escolha por nome presumido,
  fallback caro, nem comando para retomar execução real.
- Um registro SQLite compartilhado por todos os processos locais: `BEGIN
  IMMEDIATE`, uma reserva ativa global e `UNIQUE(job_id, phase)` para `initial`
  e `repair`. A reserva é gravada antes da chamada. Erros, retries e reinícios
  não apagam contadores. Reservas de execução com término incerto nunca expiram
  automaticamente. Não apagar, recriar ou trocar o banco para tentar novamente.
- Mesmo ID com brief alterado falha. Mesmo brief com outro ID também falha.
  A deduplicação global entre máquinas ainda depende de uma autoridade comum.
- Modelo, esforço, disponibilidade e contrato de chamada única do adaptador
  precisam ser válidos. Etapas extras de planejamento, crítica, imagem e status
  não são fases executáveis. A execução real continua bloqueada, inclusive se
  alguém editar apenas `paused` ou preencher o JSON de exemplo.
- Saldo desconhecido, autorização ausente, leitura vencida, medição indisponível
  ou transferência exclusiva de controle ausente bloqueiam a execução. Há uma
  nova verificação após reservar e antes da chamada, e outra antes do reparo.
- `Reading` representa permissões **cumulativas de chamadas** dentro de uma
  autorização identificada, não o saldo percentual de uma assinatura. Os
  contadores precisam incluir as reservas já contabilizadas. Uma porcentagem
  de quota não pode ser convertida em permissões por estimativa. Ainda não há
  autoridade real de quota/permissões conectada. O saldo histórico de 7% não foi
  usado como saldo atual, orçamento ou dado de teste.
- Timeout solicitado de 60 segundos, teto de configuração de 300 segundos,
  nenhum retry automático. O transporte HTTP isolado inclui DNS no prazo do
  processo e encerra o processo próprio no timeout, escalando para kill. Os testes
  com processo simulado comprovam o fluxo de timeout,
  encerramento e bloqueio quando não há confirmação de término da árvore.
- A chamada registra job, fase, modelo solicitado/efetivo quando disponível,
  início, duração, ordinal da tentativa no job, entrada total, entrada em cache
  e saída. Campos ausentes ficam `NULL` (JSON `null`), não zero. Estimativas ficam
  separadas. Entrada total já inclui cache: total = entrada total + saída.
  Não há conversão de tokens da assinatura em dólares.
- O contrato exige normalização das métricas pelo futuro adaptador. Não passar
  um campo de entrada sem cache como se já fosse entrada total.
- Brief e conteúdo de reparo são limitados em caracteres; não há histórico de
  sessões nem limite de tokens inventado. O valor de caracteres não garante um
  teto de tokens ou de consumo do provedor.

## Fluxo de construção implementado

`SiteBuilder.build(job_id, brief)` é a interface local. Ela verifica pausa,
política e orçamento antes de montar o workspace. As referências selecionadas
são lidas integralmente e enviadas como texto com seus hashes, não apenas como
nomes de skills. O conjunto inclui a skill original, nichos, direção,
acessibilidade, conversão, movimento e guias adicionais de implementação.

O runtime retorna um mapa JSON completo de arquivos estáticos, mais `plan.md` e
`skill-usage.json`. O pipeline grava HTML/CSS/JS em uma pasta nova por tentativa,
copia bibliotecas de navegador e fontes já recuperadas e mantém vendor/mídia
protegidos contra sobrescrita pelo modelo. Não executa npm, instaladores,
scripts de build gerados, hooks ou ferramentas do agente. O starter original
permanece disponível como referência; o retorno precisa conter o site estático
já utilizável, sem depender de npm para finalizar a resposta.

Fotos e uploads só são lidos de uma raiz local explicitamente fornecida. Aceita
`media.local_files`, `media.uploads` e fotos com `local_path`. URLs remotas precisam
de cópia local previamente verificada e associada por `source_url`; não há
download silencioso ou busca de imagem por IA. Cada conteúdo local participa
da identidade persistente da execução.

O QA recebe os arquivos reais da tentativa, verifica o digest antes/depois,
registra checks e screenshots, e bloqueia se faltar medição. `browser_qa.mjs`
orquestra desktop/mobile, layout, imagens, semântica, links, erros JS, recursos
locais e movimento reduzido. Features exigem `brief.qa_scenario` com ações e
asserções declarativas, mais prova de fallback em contexto com JavaScript
desligado. HTTP externo e WebSocket são bloqueados; nenhum link de WhatsApp é
seguido ou mensagem enviada. O módulo requer Playwright já instalado e um
transporte de processo supervisionado para uso real, que não foi ativado aqui.

Falha verificável pode gerar apenas um reparo. Infraestrutura ou evidência de
QA ausente interrompe o fluxo sem pedir outro passe de IA. O reparo grava em
outra pasta e não destrói a primeira tentativa. Revisões podem fornecer
`existing_site` dentro da raiz de workspaces: o código anterior entra no
contexto, páginas precisam ser preservadas e o original permanece intacto.

Mesmo com QA aprovado, o estado final é `awaiting_visual_review`, com
`human_review_required: true` e `published: false`. Os checks não substituem
todo o gate histórico nem certificam estética, qualidade acima de 9 ou
equivalência visual ao original. Não existe fase extra de crítica por IA.

## Adaptador de IA implementado, desativado

`MessagesRuntime` implementa uma requisição Messages por fase, sem ferramentas,
histórico, redirects, SDK com retry ou fallback. O transporte de produção aceito
é `IsolatedMessagesTransport`, cujo processo só executa HTTP, sem agentes ou
filhos de build. Timeout ou resposta desconhecida preserva a reserva e pausa;
fechar o processo não comprova cancelamento nem consumo no provedor.

Esse é um adaptador **opcional para API**, não um adaptador certificado do plano
Max/Claude Code. Usar API não é automaticamente coberto pela assinatura. O código
não lê tokens OAuth, não configura chave, não migra cobrança e não serve como
fallback: rede e autorização de cobrança são falsas por padrão. Seu uso futuro
exige aprovação explícita desse modo, credencial correspondente, orçamento,
saldo e metadados reais de disponibilidade. A assinatura original permanece
sem integração de execução certificada sob o limite de chamadas internas.

`capability_from_catalog` consome um catálogo previamente obtido para a conta,
com captura recente, escopo e aprovação econômica explícitos; não faz consulta
de modelos. Exige ID exato, lifecycle ativo e esforço anunciado. Dados públicos
não comprovam acesso da conta. Nenhum modelo real foi selecionado neste trabalho.

O `max_output_tokens` explícito vale apenas para a API que oferece esse controle;
não representa limite de tokens da assinatura. O normalizador de uso soma
entrada sem cache, leitura e criação de cache para obter entrada total; se
algum componente não vier, o total fica desconhecido e a execução bloqueia.
O cache de leitura continua separado e não é somado novamente ao total.

Contratos consultados: [Messages](https://platform.claude.com/docs/en/build-with-claude/working-with-messages),
[esforço](https://platform.claude.com/docs/en/build-with-claude/effort),
[catálogo de modelos](https://platform.claude.com/docs/en/api/models/list),
[cache](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) e
[rotas do Playwright](https://playwright.dev/docs/api/class-browsercontext#browser-context-route).

As referências históricas importadas podem instruir deploy, várias revisões,
geração de imagem ou loops de QA. São material de construção, não autorização:
todos os passos de IA deverão compartilhar o limite persistente. QA, status e
controle devem continuar determinísticos. Uma invocação de CLI de agente pode
fazer muitas chamadas internas; não basta conectar `claude -p` ou `codex exec`
ao transporte e declarar que o limite foi cumprido.

## Verificações seguras

Na raiz original:

```powershell
python -B -m unittest discover -s worker/backup/tests -v
node --test worker/backup/tests/browser_qa.test.mjs
node --check worker/backup/browser_qa.mjs
python -B worker/backup/resource_pack.py verify
python -B worker/backup/executor.py status
python -B worker/backup/site_builder.py status --config worker/backup/config.example.json
python -B worker/backup/executor.py mock-demo
```

Os testes incluem construção completa de arquivos com respostas simuladas,
contexto das referências reais, revisão sem sobrescrita, cenário funcional,
fallback sem JS, protocolo HTTP falso, kill e deadline simulados, além de um reparo, timeout e
encerramento simulado, concorrência por conexões independentes, duplicação,
retries/reinícios, configuração inválida, orçamento, medição, cache, pausa e
importação preservando arquivos. A verificação de integridade confirmou **682
arquivos**, sendo os 80 arquivos do commit original e 23 `SKILL.md` no conjunto.
Essas contagens descrevem recursos, não sites novos gerados ou skills invocadas.

Registro anterior da etapa de construção: **71 testes Python passaram em 10,525 s**;
**3 testes Node passaram**, com navegador falso. `node --check` também passou.
O status carregando `config.example.json` retornou `paused: true`, `model: null`,
`api_transport_enabled: false`, `real_generation: "blocked"` e
`production_verified: false`. As capturas dos testes são bytes simulados, não
evidência de um navegador real. Não houve geração real de site para avaliar.

O sandbox inicialmente bloqueou o temporário do Python; os testes passaram com
a permissão ampliada solicitada, no mesmo Windows e na mesma pasta. Não houve
mudança de executor ou de diretório para contornar o bloqueio.

`mock-demo` usa exclusivamente `MockRuntime` e um banco temporário marcado como
simulação. Não aceita banco real e não retoma a geração real. `status` sem
`--state` mostra a política padrão local; não consulta o mini PC ou produção.

`resource_pack.prepare(pack, destino_novo)` monta a skill original, o kit
adicional e o QA em um workspace novo, sem executar nenhum arquivo. Ela falha
se o destino já existir ou se algum hash estiver incorreto. Montagem não gera
site nem certifica o funcionamento de um runtime.

## Pendências para equivalência e ativação futura

1. Comparar o snapshot de 02/10/2026 com a instalação atual do mini PC quando
   estiver acessível. Não há evidência de que sejam idênticos hoje.
2. Confirmar o modo real de runtime, acesso a modelo econômico por metadados
   sem geração e esforço suportado. O adaptador opcional de API está implementado
   e desligado; não ativar API paga sem aprovação específica. A integração ao
   runtime da assinatura requer prova de limite sobre as chamadas internas.
3. Autorização de orçamento e saldo/medição reais. Se a assinatura não fornecer
   medição suficiente, a geração permanece bloqueada; não migrar silenciosamente
   para uma API cobrada à parte.
4. Coordenação comum entre mini PC e Windows com transferência exclusiva de
   controle e histórico por job. Mini PC offline não prova que seus processos
   pararam. O banco local isolado não resolve a volta simultânea das duas máquinas.
5. Confirmar dependências locais para build e QA (Node, bibliotecas do starter,
   Playwright e Chromium). Foram recuperados manifestos e lockfiles, não
   `node_modules`, navegador ou credenciais. Nenhum build/QA real foi executado.
6. Antes de conectar produção, confirmar contrato de entrada, callback,
   autenticação existente e destino de publicação. Não há n8n, mensagens,
   cobrança ou deployment ativos neste reserva.

O transporte genérico `process_transport.py`, previsto para QA, é infraestrutura
preliminar: em Windows, o término
de descendentes após saída normal do pai ainda precisa de supervisão auditada
(por exemplo, um Job Object). A saída vai para arquivos para limitar RAM, mas
ainda não há teto de bytes gravados enquanto o processo executa. Por isso ele
não está conectado a um runtime real. Isso é separado do processo HTTP próprio
implementado em `IsolatedMessagesTransport`, que não executa agentes ou processos
de build. Os testes simulados não certificam término
de processos reais nem custos da conta.

Produção, serviços, filas, saldo atual e pausa remota **não foram verificados**.
Nenhum processo de IA, serviço, lote, job real ou integração externa foi iniciado.

## Fluxo manual preparado no Windows

O [guia manual](MANUAL-WINDOWS.md) descreve a entrada do brief, admissão na fila
persistente e construção ligada à mesma posse e aos mesmos limites. O CLI
permite admissão/status locais e mantém `build` bloqueado pela pausa, antes de
abrir o banco. A construção completa é exercitada apenas por mocks injetados,
incluindo retomada e revisão sem sobrescrever o site anterior. Não há consumidor
contínuo, dependência do mini PC, acesso a n8n ou leitura de credenciais.

Regressão final desta etapa: **111 testes Python passaram em 8,145 s** e
**3 testes Node passaram** com navegador falso. Integridade dos **682 recursos**
confirmada. `manual_flow.py build` retornou `generation_paused` (código 2);
status confirmou `paused: true`, `model: null` e API desativada.
