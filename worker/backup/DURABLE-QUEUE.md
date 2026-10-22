# Fila durável local, 20/10/2026

Pasta autorizada: `C:\Users\joaov\Documents\frontstep\worker\backup`.
Branch `main`, commit `5b083d5b650906b88c5100085f96ccdd3febc09d`, sem alterações
em arquivos rastreados/staged da produção. `worker/backup/` permanece não
rastreado; nenhum commit, push, merge, reset, clean ou stash foi feito.

Antes da edição, a outra tarefa local do projeto aparecia ociosa no inventário
de chats. Não foi identificado trabalho concorrente conflitante. Nenhuma tarefa
foi interrompida ou mensagem enviada para alterar seu estado.

## Implementação

`DurableQueue` usa exclusivamente `Ledger.jobs`, `Ledger.calls` e `Ledger.meta`.
A migração aditiva em `Ledger` acrescenta `request_json`, `queue_owner` e
`queued_at` a `jobs`, em transação `BEGIN IMMEDIATE`. Os estados, artefatos,
histórico de fases e métricas anteriores são preservados. Não existe tabela
paralela de fila nem outro banco de estado.

| Operação | Comportamento |
|---|---|
| `enqueue(id, request)` | Persiste o pedido JSON e o digest. Mesmo ID/conteúdo é idempotente; ID alterado ou conteúdo duplicado sob novo ID falha. Não retoma geração. |
| `items()` | Consulta estados persistidos, inclusive com geração pausada. |
| `read_claim(claim)` | Lê o pedido persistido verificando posse, pausa, reservas e integridade do digest. |
| `acquire()` | Seleciona o primeiro pedido elegível pela ordem de inserção em `jobs`, em transação de escrita. A pausa, uma chamada reservada ou outro proprietário bloqueiam. |
| `resume(Claim(id, token))` | Retoma explicitamente a mesma posse persistida. Não cria outro token, expira lease, reencaminha pedido ou remove lock. |
| `run_claim(claim, executor, validator=...)` | Usa o payload persistido no mesmo ledger e chama o Executor existente. A posse, a reserva e a unicidade de fase são novamente verificadas atomicamente antes da chamada. |
| `acknowledge(claim)` | Confirma apenas estado terminal conhecido, sem chamadas reservadas, e encerra normalmente a posse da fila. Não apaga pedido, call, métricas ou limite. |

Estados da fila são os estados do próprio job: `queued`, `claimed`, `running`,
`needs_repair`, `complete`, `rejected` e `failed`. A seleção usa `rowid` do
registro, não relógio de parede, para manter ordem de inserção estável. O pedido
fica registrado mesmo depois de concluído para impedir reenvio como novo job.

A etapa posterior [manual no Windows](MANUAL-WINDOWS.md) conecta essa mesma fila
ao SiteBuilder. Os números abaixo registram a etapa original da fila; os
resultados da conexão manual estão no guia correspondente.

Há um índice parcial único que permite somente um job com `queue_owner`.
O índice de chamada ativa e `UNIQUE(job_id, phase)` continuam valendo. Chamadas
diretas ao Executor também são bloqueadas se tentarem contornar a posse de
fila. Geração inicial e reparo usam o mesmo histórico; não ganham tentativas
extras ao entrar na fila ou reiniciar o processo.

## Recuperação sem relançar consumo incerto

- **Pedido ainda não adquirido:** um novo processo encontra o mesmo registro
  pendente. Aquisição permanece bloqueada enquanto a geração estiver pausada.
- **Queda após aquisição, antes da reserva de chamada:** somente a mesma posse
  pode ser retomada explicitamente com seu token. Uma nova aquisição continua
  bloqueada. Não há liberação por PID morto ou prazo expirado.
- **Queda após reservar uma chamada, sem resultado conhecido:** aquisição,
  retomada, execução e acknowledgement falham por reconciliação necessária.
  A reserva e as métricas desconhecidas ficam intactas. Não há método de
  force-unlock, exclusão do ledger ou retry automático.
- **Queda após resultado terminal gravado, antes do acknowledgement:** o novo
  processo pode confirmar o resultado conhecido com a mesma posse. Não executa
  a fase novamente nem faz outra chamada.
- **Token perdido ou estado inconsistente:** exige intervenção/reconciliação
  futura. Esta etapa não fornece uma operação para limpar posse ou histórico.

## Testes e resultados observados

```powershell
python -B -m unittest discover -s worker/backup/tests -q
node --test worker/backup/tests/browser_qa.test.mjs
python -B worker/backup/site_builder.py status --config worker/backup/config.example.json
```

- **82 testes Python passaram em 20,023 s**, incluindo os nove testes novos da
  fila: quatro locais e cinco com processos separados.
- **3 testes Node passaram**, exclusivamente com interfaces de navegador falsas.
- A corrida solta dois processos de teste a partir de uma barreira; exatamente
  um adquire a posse. Nenhum chama IA nesse teste.
- As quedas encerram apenas um processo Python descartável criado pelo próprio
  teste, usando MockRuntime. Rede é bloqueada no fixture e não são encaminhadas
  credenciais da aplicação aos filhos.
- A primeira rodada da fila encontrou erro de cleanup porque a fixture de
  migração mantinha uma conexão SQLite aberta. O fechamento da própria conexão
  foi corrigido; a regressão completa acima passou. Não foi bloqueio de sandbox,
  remoção forçada de lock ou mudança de permissões.

Estado final confirmado pelo comando de status:

```json
{
  "paused": true,
  "model": null,
  "api_transport_enabled": false,
  "real_generation": "blocked",
  "production_verified": false
}
```

## Escopo e limitações

A fila tem o contrato de pedido do **Executor**. Não há consumidor contínuo,
agendamento, ingestão automática de n8n, serviço, endpoint público ou ligação
automática de `SiteBuilder.build` à fila. Um futuro consumidor deverá normalizar
o pedido antes do registro e usar `run_claim` com o contexto e o validador locais
correspondentes; não pode chamar o runtime diretamente ou criar um segundo
histórico de job.

O adaptador opcional de API permanece desativado, modelo não configurado e
orçamento real desconhecido. Os testes não demonstram disponibilidade da conta,
consumo real, qualidade visual ou compatibilidade do runtime da assinatura.
Nenhum modelo, browser real, serviço persistente, mini PC, WhatsApp, pagamento,
deployment ou publicação foi executado/acessado nesta etapa.

Essa exclusão vale para processos locais usando **o mesmo arquivo SQLite em
disco local**. Não distribui controle entre mini PC e Windows e não deve ser
tratada como lock de dois hosts ou implantada por simples cópia do banco.
Failover futuro exige autoridade transacional e propriedade exclusiva comuns,
com token de geração crescente verificado pelos dois executores antes de cada
chamada. Também exige reconciliar chamadas em andamento: revogar propriedade
não cancela uma requisição já recebida pelo provedor. Nenhum ensaio de
indisponibilidade ou failover de produção foi realizado.

## Arquivos desta etapa

- Novo: `durable_queue.py`.
- Novo: `tests/test_durable_queue.py`.
- Alterado: `executor.py`, migração aditiva e verificação atômica da posse.
- Alterado: `tests/test_process_recovery.py`, rótulo do fixture antigo corrigido
  para deixar claro que ele não exercita a fila.
- Alterado: `README.md`, índice e ligação para esta evidência.
- Novo: `DURABLE-QUEUE.md`, contrato e relatório desta etapa.

Configuração, recursos recuperados, testes anteriores e histórico foram
preservados. A verificação histórica sem fila permanece em
`RECOVERY-VERIFICATION.md`; seus limites descrevem a etapa anterior.
