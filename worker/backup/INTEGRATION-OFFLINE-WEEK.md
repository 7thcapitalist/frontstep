# Plano local para a semana sem mini PC — 20/10/2026

Destino autorizado: `C:\Users\joaov\Documents\frontstep\worker\backup`.
Este documento prepara a operação manual; não autoriza geração, serviços,
integrações externas ou retirada da pausa. Offline aqui significa independente
do mini PC e do n8n. Uma chamada futura a um provedor de IA ainda dependeria
de rede, runtime, modelo, medição e orçamento autorizados; não é IA sem internet.

## Verificação de trabalho concorrente

Antes deste acréscimo, o inventário de chats mostrou esta tarefa ativa e
“Revisar build do builder” ativa. O registro dessa outra tarefa trata da
recuperação visual na cópia `website-factory-heitor/frontstep`, incluindo
restaurante, contabilidade e direção de agência. Não foi identificado outro
plano equivalente de integração semanal no inventário e no registro consultados.
Não é prova de ausência de qualquer atividade fora desse inventário.

Para preservar esse trabalho, esta etapa acrescenta apenas este documento na
pasta original do reserva. Não altera o builder visual, recursos recuperados,
configuração, código operacional ou arquivos da outra tarefa. Nenhuma mensagem
foi enviada, tarefa interrompida ou executor iniciado.

## O que funciona agora e o que está bloqueado

| Parte | Evidência local | Limite atual |
|---|---|---|
| Executor alternativo | Python **3.13.15** e Node **v24.11.1** encontrados neste Windows; suíte local executada anteriormente | Runtime de IA real não conectado ao fluxo manual; instalação não comprova modelo/acesso/orçamento |
| Recursos de construção | Snapshot recuperado, 682 arquivos verificados; skill original e kit adicional | Snapshot não comparado à instalação atual do mini PC; ter referências não certifica qualidade |
| Brief e identidade | `build_contract.py` valida legado; `manual_flow.submit` valida entrada manual | IDs precisam vir de autoridade explícita; não são deduzidos de slug, linha ou token |
| Fila | `DurableQueue`, no mesmo `Ledger.jobs`/`calls`; admissão persistente e posse exclusiva local | Sem consumidor, endpoint HTTP, polling ou coordenação entre hosts |
| Site | `SiteBuilder` ligado à posse manual; arquivos, assets, QA e até um reparo | Construção integral testada somente com IA e navegador simulados |
| Início real | CLI `manual_flow.py build` | Bloqueado antes de abrir ledger ou adquirir job; não há comando de ativação |
| Entrega | Resultado local `awaiting_visual_review`, `published: false` | Sem publicação, callback, atualização de CRM ou mensagem |

O worker histórico recuperado executava Claude Code headless, QA, Vercel e
varredura de `next-job` ao iniciar. Não será iniciado. O builder visual com
Codex na cópia local é outro pipeline, com chamadas e revisões próprias; não
é substituto aprovado do transporte controlado. Não usar `claude -p`,
`codex exec`, servidor visual ou histórico de assinatura para presumir que
uma invocação equivale a uma única chamada medida.

O estado local confirmado continua `paused: true`, `model: null`, API opcional
desativada e `production_verified: false`. Saldo atual é desconhecido; o registro
histórico de aproximadamente 7% não autoriza consumo atual.

## Contrato que o produtor deverá fornecer

| Campo | Origem e regra |
|---|---|
| `construction_id` | ID explícito e estável da entrega, escolhido pelo responsável; não apenas a linha do lead |
| `revision_id` | ID explícito da revisão comercial; repetição técnica conserva o ID, revisão de escopo exige decisão explícita |
| `row_id` | Correlação do contrato legado, quando aplicável; inteiro positivo seguro ou identificador textual validado |
| `build_token` | Correlação legada validada em memória; não vai para o brief, prompt, logs ou ledger como valor bruto |
| `brief` | Objeto ou JSON original; campos mínimos de negócio/contato/slug e `fase` válida, sem credenciais |
| Mídias | Arquivos locais aprovados sob `media_root`, caminhos relativos e correspondência explícita com fotos remotas; sem downloads automáticos |
| Baseline | Para revisão, site anterior dentro dos workspaces e digest verificado; preservar o original |
| Histórico reconciliado | Mesma identidade, chamadas e resultados já tentados; resultados incertos impedem execução |

Os IDs aceitam os identificadores ASCII explícitos de até 128 caracteres do
contrato implementado. A legitimidade desses IDs não é autenticada pelo módulo.
O envelope legado estrito continua contendo **somente** `row_id`, `build_token`
e `brief`; os IDs adicionais entram no argumento separado `identity` do
normalizador, sem inventar campos extras aceitos pelo endpoint existente.

Há dois perfis de admissão, com o mesmo ID canônico: legado e manual. Escolher
o perfil **antes** de enfileirar. Um pedido legado não é executável diretamente
pelo consumidor manual: falta o snapshot de recursos/mídia/baseline. Admitir
legado e depois tentar substituir por manual provoca reconciliação necessária.
Não editar `request_json`, digest, fases ou ID para converter esse pedido.
Uma futura conversão exigiria implementação transacional e testes que preservem
todo o histórico; ela não está implementada nem autorizada aqui.

## Mapeamento dos três workflows observados

Fonte: registro de leitura publicado nesta tarefa em **20/10/2026,
13h50–13h51 America/New_York**. Não houve nova consulta ao n8n nesta etapa.
As três definições apareciam ativas nessa observação; isso não prova execução
em andamento nem pausa global. Estado atual e pedidos pendentes são desconhecidos.

| Workflow observado | Papel histórico | Substituição manual nesta semana | Requisito para integrar futuramente |
|---|---|---|---|
| `Frontstep \| 3. Prévia: montar brief` | POST para host `joao-vitor-default-string.tail3eaee6.ts.net`, `/build`, com `row_id`, `build_token`, `brief` | Responsável fornece brief aprovado, identidade explícita e mídias locais; admissão manual pausada | Confirmar destino, identidade, autenticação e transferência exclusiva antes de mudar o produtor; não redirecionar agora |
| `Frontstep \| 4. Prévia: worker pega site` | `frontstep/next-job`; lê uma linha, marca construindo e devolve job; publicado difere do rascunho | Não consultar endpoint. Seleção explícita de um pedido local, sem polling ou marcação remota | Demonstrar aquisição atômica/posse comum e reconciliar CRM, ledger e tentativas antigas; não presumir suporte atual |
| `Frontstep \| 5. Prévia: site pronto` | `frontstep/build-done`, respostas 200/403; três nós WAHA habilitados | Revisão humana dos arquivos e relatório locais, sem callback ou mensagem | Confirmar destino, correlação protegida, idempotência, aprovação de entrega e efeitos de mensagens; não enviar um “sucesso” com URL fictícia |

O reserva não expõe `/build`, `/health`, `/upload` ou esses webhooks. Não se
apresenta como substituto transparente do serviço de produção. Neste modo
manual, não há alterações nos três workflows ou dependência de suas execuções.

## Procedimento manual disponível agora

Na pasta original, consultar política e verificar os recursos:

```powershell
python -B worker/backup/site_builder.py status --config worker/backup/config.example.json
python -B worker/backup/resource_pack.py verify
```

Preparar brief/mídia e obter IDs do responsável. A admissão local, se solicitada
separadamente, usa o comando já implementado abaixo e **não inicia geração**:

```powershell
python -B worker/backup/manual_flow.py submit --brief C:\caminho\brief.json --construction-id entrega-001 --revision-id r1
python -B worker/backup/manual_flow.py status
```

`--media-root` e `--existing-site` são opcionais conforme o caso. Esta etapa
não admitiu pedidos reais. Status/admissão podem criar o banco local pausado.
O caminho operacional é fixo: `worker/backup/.state/manual.sqlite`. Não trocar
de banco para ganhar tentativas.

**Início da construção real:** indisponível. `manual_flow.py build` retorna
código 2 e `generation_paused`, antes de abrir banco ou adquirir posse.
`load_policy` recusa `paused: false` no modo real. Não existe comando secreto
de retomada; `allow_simulation` não pode despausar um ledger real.

**Parada agora:** não há serviço/consumidor iniciado por este fluxo para parar.
Os testes sintéticos são finitos; podem ser interrompidos no terminal que os
iniciou. Interrupção não autoriza apagar estado. Para um futuro chamador auditado,
`Ledger.pause()` bloqueia novas reservas; pausa não prova cancelamento de chamada
já enviada. Esse chamador precisará encerrar apenas seus processos supervisionados,
confirmar término e preservar reservas incertas. Não usar encerramento genérico
de processos Python/Node, expiração de posse ou “PID morto” para liberar limite.

## Ledger, posse e custos

- Uma única verdade local: `jobs`, `calls`, `meta`; reserva em transação,
  unicidade `(job_id, phase)` e uma chamada reservada global. Posse não expira.
- Uma inicial e no máximo um reparo, incluindo retry, retomada e concorrência.
  Mesmo ID com conteúdo diferente bloqueia; trocar entrada legada/manual não
  reinicia o histórico. Guardar a mesma Claim antes da execução futura.
- Revalidar pausa, modelo/esforço comprovados, autorização cumulativa, saldo,
  medição recente e proprietário antes de cada chamada. Desconhecido bloqueia.
- Registrar job/fase, modelo solicitado/efetivo, duração, tentativas e tokens
  de entrada/cache/saída. Ausência é desconhecida; cache não é somado outra vez
  à entrada total. Separar estimativas de medições; não converter assinatura
  em dólares nem porcentagem em permissões de chamadas.
- A autoridade de permissões não existe em produção neste reserva. Não
  inventar orçamento, saldo, limites de tokens ou disponibilidade pelo nome.
  API paga permanece desligada e exige aprovação específica, separada da assinatura.
- O SQLite local não coordena outra máquina ou pipeline. A declaração humana
  de mini PC desligado não reconcilia chamadas históricas nem comprova o estado
  dos workflows. Não importar pedidos antigos como se nunca tivessem consumido.

## Checklist para um único teste futuro, ainda não autorizado

1. Confirmar que nenhum trabalho equivalente usa os mesmos insumos/identidade;
   fixar um caso sintético sem destinatário, pagamentos ou entrega comercial.
   Não usar um pedido antigo cuja execução não possa ser reconciliada nesta semana.
2. Revisar o código e autorizar explicitamente o runtime e um ponto de execução
   finito de **um job**. Esse ponto ainda precisa ser conectado e testado;
   não iniciar o worker histórico nem adaptar por comando solto.
3. Confirmar modelo econômico e esforço por metadados válidos da conta, sem
   geração de teste. Sem confirmação, parar. Não consultar credenciais nesta etapa.
4. Obter orçamento explicitamente autorizado, saldo atual, medição requerida,
   propriedade exclusiva e limites de tempo/tentativas. Definir expressamente
   se o único teste permite reparo; não presumir a segunda chamada como gratuita.
5. Reconciliar ledger e fontes do pedido. Preparar mídia/referências verificadas,
   congelar identidade e hashes; preservar histórico e salvar a Claim.
6. Após aprovação futura de ativação e somente com os bloqueios resolvidos,
   executar uma vez, sem loops. Verificar novamente as condições antes da inicial
   e de eventual reparo autorizado. Timeout/uso ausente/resultado incerto: pausar,
   preservar reserva e exigir reconciliação, sem tentar outra máquina ou modelo.
7. Registrar uso real e inspecionar arquivos, QA e capturas. Revisão humana
   decide qualidade; mocks não certificam esta etapa. Confirmar resultado terminal
   conhecido, manter publicação/callback/mensagens desligados e voltar à pausa.
8. Comparar o ledger antes/depois e documentar limitações. Um teste aprovado
   não autoriza lotes, automação ou integração comercial.

Hoje só estão autorizados testes com mocks. Condições faltantes impedem o teste
real; este checklist não é uma liberação de consumo ou alteração de produção.

## Evidências e próximos responsáveis

O guia `MANUAL-WINDOWS.md` registra a última regressão completa: **111 testes
Python**, incluindo 16 manuais, e **3 testes Node** com navegador falso;
integridade de 682 recursos confirmada. Relatórios anteriores de 73/82/95 testes
são etapas históricas, não regressões atuais nem prova de produção.

Nesta preparação documental, foram reexecutados somente os testes pertinentes,
no Windows original e com temporários autorizados:

```powershell
python -B -m unittest discover -s worker/backup/tests -p test_manual_flow.py -q
python -B -m unittest discover -s worker/backup/tests -p test_build_contract.py -q
```

Resultados reais: **16 testes manuais OK em 3,379 s** e **13 testes de contrato
OK em 0,284 s**. Apenas dados e runtimes sintéticos; nenhum pedido operacional
foi admitido. A regressão completa não foi repetida nesta etapa de documentação.

Responsável pelo produtor deverá definir identidade, seleção e histórico;
responsável pelo runtime deverá fornecer capacidade/medição/orçamento auditáveis;
responsável pela entrega deverá confirmar destinos e efeitos antes de qualquer
integração. Nenhuma aprovação, capacidade ou saldo faltante foi presumido.
Não houve SSH, n8n, rede de produção, leitura de segredos, IA real, serviço,
publicação, push ou merge nesta etapa. Produção e pausa remota não verificadas.
