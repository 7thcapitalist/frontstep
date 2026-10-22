# Rodar a fábrica local com Codex

Este modo usa a assinatura ChatGPT já autenticada no Codex CLI. Ele gera **demonstrações sintéticas locais** em `local-factory/jobs/`. O worker histórico em `builder/worker/` continua reservado para a integração futura: não execute `builder/install.sh` nem `builder/worker/worker.mjs` para estes testes.

## Pré-requisitos

PowerShell, Node 20+, Python 3, `codex` no PATH e login ativo (`codex login status`). Python executa a busca local da UI/UX Pro Max. Na pasta `frontstep/local-qa`, instale o gate reproduzível:

```powershell
npm ci
npm run install-browser
npm test
```

O gate falha se Playwright ou Chromium não puder iniciar. O servidor local não precisa de token Claude, Vercel, n8n, WAHA ou pagamento. Nenhum desses tokens é passado ao subprocesso Codex.

## Iniciar e parar

Na pasta `frontstep`:

```powershell
node local-factory/server.mjs
```

O servidor escuta somente em `127.0.0.1:4178`. Pare com `Ctrl+C` na mesma janela. Para mudar a porta, defina `FRONTSTEP_LOCAL_PORT` antes de iniciar. Para selecionar outros executáveis, defina `FRONTSTEP_CODEX` e `FRONTSTEP_PYTHON` para caminhos absolutos. `FRONTSTEP_BUILD_TIMEOUT_MS`, `FRONTSTEP_QA_TIMEOUT_MS` e `FRONTSTEP_REVIEW_TIMEOUT_MS` ajustam os limites de tempo. `FRONTSTEP_MAX_REPAIR` controla os reparos (padrão 4, máximo 5). O agente local usa raciocínio `high` por padrão; `FRONTSTEP_CODEX_REASONING_EFFORT` aceita `medium`, `high` ou `xhigh`.

## Submeter e consultar

Em outra janela, ainda na pasta `frontstep`:

```powershell
Invoke-RestMethod http://127.0.0.1:4178/health
Invoke-RestMethod http://127.0.0.1:4178/jobs
Invoke-RestMethod http://127.0.0.1:4178/jobs/ID_DO_JOB
```

Há nove briefs fictícios em `local-briefs/`, um por família de nicho, com cenários de teste e fotos de referência licenciadas. O [manifesto de mídia](local-briefs/MEDIA-SOURCES.md) registra a origem. Use `node local-factory/run-demos.mjs --new --slug=contabilidade-vila-clara` ou outro slug que tenha par `.json` e `.scenario.json`. Sem `--slug`, o script percorre todos os pares disponíveis em ordem alfabética; cada job passa por plano, build, QA, auditoria de movimento executado no navegador, crítica visual e até quatro reparos por padrão. Jobs registram o PID do worker para que servidores locais concorrentes não adotem ou interrompam o trabalho uns dos outros. Uma foto de banco serve para testar uma composição, mas não comprova o estabelecimento, profissional ou produto de um cliente real.

O submit retorna um ID, estado (`queued`, `running`, `succeeded`, `failed` ou `interrupted`) e fase atual. A mesma submissão retorna o mesmo ID por idempotência. Para gerar novamente o mesmo brief como novo job, adicione `--new` ao comando `submit.mjs`. Depois de corrigir uma falha, tente até duas vezes:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:4178/jobs/ID_DO_JOB/retry
```

Um job aprovado abre em `http://127.0.0.1:4178/preview/ID_DO_JOB/`. O preview só é servido depois de QA funcional e revisão visual com nota ponderada estritamente acima de 9,0/10. Jobs antigos aprovados antes deste gate continuam históricos; uma prévia antiga não prova que passaria nas regras atuais. Um job em execução quando o processo para reaparece como `interrupted`, sem retomada automática; o operador decide se tenta de novo.

## Arquivos por job

`local-factory/jobs/ID_DO_JOB/` contém `job.json`, brief e cenário em `site/`, plano visual em `site/design-plan.json`, fontes e recomendações copiadas em `site/reference/`, código em `site/public/`, eventos Codex, saídas do agente, erros padrão, `qa/qa-result.json`, screenshots desktop/mobile/feature/fallback e `qa/visual-review-N.json`. Esses arquivos são locais e ignorados pelo Git. Faça cópia da pasta se precisar conservar ou compartilhar evidências.

## Como o agente usa as skills de design

O kit versionado está em `local-factory/design-kit/README.md`, com fontes, licenças e commits fixados. O [contrato do agente](local-factory/design-kit/BUILDER-AGENT.md) roteia as dez skills enviadas pelo usuário pelas fases de plano, build, crítica e redesenho. Cada job pesquisa candidatos com a UI/UX Pro Max local, recebe a skill **Anthropic Frontend Design**, a `frontstep-coder` recuperada do Claude e as referências da **taste-skill**. O script `draw.mjs` oferece três direções; o plano escolhe uma e registra afirmações com provas do brief, inventário de mídia e lacunas. Playwright verifica comportamento, serviços visíveis, fotos carregadas e mídia de comida no primeiro viewport; uma revisão visual independente examina screenshots desktop e mobile sem editar o site. Nota de 9,0 ou menos aciona reparo; cada uma das sete dimensões também deve atingir pelo menos 8,5. O brief e o conteúdo real prevalecem sobre sugestões de estilo.

Para ver os nove exemplares concluídos, rode `node local-factory/preview-examples.mjs` e abra `http://127.0.0.1:4191/`. O [índice de exemplares](local-factory/examples/README.md) descreve cada página e suas limitações. `node local-factory/verify-examples.mjs` repete o QA dos nove. Ao criar um novo job, o builder recebe as capturas e o código do exemplar aprovado da mesma família como ponto de partida: pode adaptar composição e interação já testadas, mas precisa substituir identidade, fatos, fotos, créditos e contatos pelos dados válidos do novo brief.

Para rodar QA de novo sobre um site, na pasta `frontstep`:

```powershell
node local-qa/qa.mjs local-factory/jobs/ID_DO_JOB/site/public --brief local-factory/jobs/ID_DO_JOB/site/brief.json --scenario local-factory/jobs/ID_DO_JOB/site/scenario.json --out local-factory/jobs/ID_DO_JOB/qa-manual --json
```

Saída zero e `passed: true` em `qa-result.json` são necessários para aprovar. HTTP 200 ou uma mensagem de conclusão do Codex não são prova de site funcional.

## Escopo atual

O servidor local usa referências recuperadas de `builder/skills/frontstep-coder/references/` e o novo kit de design, incluindo os dez itens da lista enviada e playbooks de texto adicionais do Impeccable. Ele não executa o instalador, detector ou extensão dessa skill durante os jobs. Também não faz captura de leads, envio de mensagens, pagamento, callback n8n ou deploy. Para conectar produção, confirme primeiro a máquina de destino, contrato de callback, autenticação, preview e publicação, além do estado atual dos workflows e canais de comunicação.

## Movimento e evidência visual

As sete novas skills oficiais GSAP/Emil complementam as dez fornecidas, com arquivos completos e hashes em cada job. O builder recebe `public/vendor/` com GSAP/ScrollTrigger fixados e nove primitivas por nicho; o plano precisa compô-las em uma cena específica, não apenas aplicar zoom ou fade em cards. As fontes são locais. O resultado registra decisões verificáveis em `skill-usage.json`.

O QA gera hero, página completa, seção e feature em desktop/mobile. A auditoria mede transform, opacity, clip-path e desenho SVG entre quadros, distingue hover de cena e captura os estados da mesma cena em `qa/motion/storyboard.png`. Movimento reduzido é verificado em desktop e celular. Caminhos de assets devem ser relativos para funcionarem dentro de `/preview/ID/`.

Para lotes selecionados: `node local-factory/run-demos.mjs --new --slugs=atelie-aurora,casa-do-papel --port=4196`. Use portas diferentes ao executar workers separados. A galeria mantém exemplos manuais separados dos jobs automáticos aprovados. Uma nota é avaliação interna documentada, não uma garantia universal de gosto.

## Auditoria de 17/10/2026 — operação e evidência atual

As amostras manuais da galeria e as notas históricas não certificam novas gerações. A rodada automática congelada desta auditoria reprovou o restaurante em 8,665 após cinco tentativas; a contabilidade ainda deve concluir. Não anunciar a fábrica como consistente acima de 9 antes de duas novas amostras representativas passarem com recursos atuais.

No computador desta auditoria, `codex` não estava no PATH do shell. O CLI já autenticado existe dentro da instalação do aplicativo. Antes de iniciar um worker novo, resolva o executável existente (sem instalar ou criar credenciais):

```powershell
$codexCommand = Get-Command codex -ErrorAction SilentlyContinue
if ($codexCommand) {
  $env:FRONTSTEP_CODEX = $codexCommand.Source
} else {
  $codexCandidate = Get-ChildItem -LiteralPath "$env:LOCALAPPDATA\OpenAI\Codex\bin" -Filter codex.exe -File -Recurse |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $codexCandidate) { throw 'CLI Codex existente não encontrado; selecione seu caminho antes de iniciar.' }
  $env:FRONTSTEP_CODEX = $codexCandidate.FullName
}
& $env:FRONTSTEP_CODEX --version
& $env:FRONTSTEP_CODEX login status
```

Se o login não estiver ativo, interrompa o início e resolva a sessão existente com o proprietário. Não copie chaves de API nem credenciais de outra ferramenta. Defina também `FRONTSTEP_PYTHON` para o Python existente quando ele não estiver no PATH. Nesta máquina foi verificado `C:\Users\joaov\AppData\Local\Programs\Python\Python313\python.exe`. Node existente: `C:\Program Files\nodejs\node.exe`.

Os reparos recentes exigem evidência funcional, visual, temporal e digest atual dos bytes públicos. A nota é calculada dos sete critérios sem arredondar antes da comparação: >9 e cada critério >=8,5; rejeição do revisor continua bloqueando. Um plano inválido recebe no máximo dois reparos delimitados; a evidência anterior é preservada. DOM pode recusar WebGL explicitamente, mas uma implementação 3D positiva precisa do plano espacial completo.

O QA agora verifica 1440, 768, 390 e 360 px. `scenario.json` pode incluir até seis `checkpoints`: cada objeto tem `name` em letras minúsculas/números/hífen, `steps`, `assertions` e `captureSelector` opcional. As mesmas ações e asserções do cenário principal se aplicam. Cada checkpoint produz uma captura, testa overflow e reprova se a asserção falhar. Os nomes/seletores fazem parte do contrato a implementar, não uma sugestão para ignorar. A amostra de restaurante inclui correção, mensagem local e estado vazio. O teste não navega a origens externas nem abre abas de WhatsApp.

O revisor recebe as capturas mobile desses estados e o storyboard de interação real, além das vistas iniciais e da página completa. A auditoria temporal registra intervalos reais antes/depois da captura; não altera duração, não fabrica frames e não infere fluidez de uma imagem. Evidências são copiadas por tentativa antes do reparo seguinte. O sampler de canvas tenta até 12 frames apenas para buffers limpos de renderizadores limitados; canvas ausente/invisível/contaminado e canvas permanentemente vazio continuam reprovando. Limites de pixels/idle não foram reduzidos.

O runtime espacial opcional foi reconstruído da fonte final da flagship, com perfil econômico de software, pausa fora da tela, controle de movimento reduzido e fallback. O uso do módulo e testes técnicos não estabelecem direção de arte de cliente nem nota visual. Consulte `site/qa/FACTORY-HANDOFF.md` e a evidência da auditoria antes de atualizar referências.

Nenhuma publicação, mensagem, cobrança ou integração comercial foi executada nesta rodada. Para produção, confirmar destinos e condições atuais e apresentar versão, mudanças e evidência final antes da autorização específica.
