# Verificação local de recuperação, 20/10/2026

Pasta: `C:\Users\joaov\Documents\frontstep`.
Branch: `main`. Commit: `5b083d5b650906b88c5100085f96ccdd3febc09d`.
Árvore inicial: somente `?? worker/backup/`; sem diferenças rastreadas ou staged.
Nenhum reset, clean, stash, commit ou alteração do histórico foi feito.

## Resultado observado

| Comando | Resultado real |
|---|---|
| `python -B -m unittest discover -s worker/backup/tests -v` | 73 testes, OK, 13,391 s |
| `node --test worker/backup/tests/browser_qa.test.mjs` | 3 testes, 3 passaram; navegador falso |
| `python -B worker/backup/site_builder.py status --config worker/backup/config.example.json` | `paused=true`, `model=null`, `api_transport_enabled=false`, `real_generation=blocked`, `production_verified=false` |
| `python -B worker/backup/executor.py status` | `paused=true`, `model=null`, orçamento desconhecido, adaptador indisponível para uso |

As suítes foram executadas com a permissão já solicitada para o temporário do
Python/Node, no mesmo Windows e na pasta original. Não houve bloqueio nesta
execução. A execução anterior com 71 testes permanece registrada no README;
esta verificação acrescentou somente dois casos que faltavam.

## Cobertura de recuperação

- Inicialização em pausa e bloqueio antes de qualquer chamada simulada.
- Um processo sintético grava um job `needs_repair` e o ledger e termina.
  Outro processo abre o mesmo SQLite e compara integralmente o estado anterior.
  Repetir a geração inicial ou trocar o ID para reenviar o mesmo brief falha.
- Orçamento desconhecido bloqueia o reparo. Quando a autorização sintética é
  restaurada, somente o reparo ainda não usado pode ser executado. Uma terceira
  tentativa falha; os ordinais persistidos continuam `[1, 2]`.
- Um processo de teste reserva a execução e espera em stdin, sem chamar modelo.
  Um segundo processo é bloqueado. O teste encerra apenas o processo que criou;
  um terceiro processo continua bloqueado pela reserva persistida. O consumo
  ausente permanece desconhecido, sem pressupor zero ou liberar automaticamente.
- A suíte preexistente cobre concorrência, duplicação, orçamento ausente,
  timeout, encerramento/kill simulados e ausência de retries automáticos.

Os filhos são processos Python descartáveis de teste usando `MockRuntime`,
não workers, serviços ou modelos reais. O ambiente encaminhado contém apenas
variáveis do sistema/temporário; não são encaminhadas credenciais da aplicação.
O fixture também bloqueia chamadas de socket. Não houve consulta ao mini PC,
publicação, mensagem, instalação ou acesso à conta de IA.

## O que ainda não foi demonstrado

**Não há fila durável implementada neste reserva.** Foram comprovadas a
persistência de jobs, estado de reparo e reservas do ledger. Isso não prova
enfileiramento, ordenação, consumo ou recuperação da fila de produção.

O pipeline de arquivos e seus limites funcionam sob mocks. O adaptador opcional
de API existe, mas permanece desativado e não equivale ao runtime da assinatura
original. Nenhum modelo, saldo, dependência de navegador, custo real ou qualidade
visual foi certificado. O SQLite local não coordena o mini PC com o Windows.
O estado dos processos, filas e pausa de produção não foi verificado.

## Proposta de failover, não executada

1. Usar uma autoridade transacional comum aos dois executores para os IDs
   canônicos de job, fases, permissões de orçamento, reservas e proprietário.
   Nunca criar um histórico novo ou zerar limites na troca de máquina.
2. Ambos devem validar um token de proprietário com geração crescente
   (fencing token) antes de cada chamada. Revogar o proprietário anterior antes
   de conceder controle ao reserva. Um lock SQLite isolado em cada máquina ou
   um heartbeat sem resposta não implementam essa exclusão entre máquinas.
3. Não transferir trabalho com consumo ou término incertos: manter a reserva
   bloqueada até reconciliação. Revogar um token não cancela uma requisição que
   já chegou ao provedor; a expiração de uma lease não prova que ela terminou.
4. Confirmar interrupção/drenagem do principal e ausência de chamadas pendentes,
   reconciliar o ledger e obter orçamento, saldo e evidência de modelo atuais.
   Só então uma autorização futura explícita poderá retirar a pausa do reserva.
   Aplicar a mesma exclusividade e reconciliação na volta ao principal.

Essa proposta exige integração futura dos dois lados e destino confirmado;
não foi implantada nem ensaiada em produção. A geração permanece pausada.

## Arquivos adicionados nesta verificação

- `tests/test_process_recovery.py`: somente os dois testes entre processos que
  faltavam e seu fixture de execução sintética.
- `RECOVERY-VERIFICATION.md`: esta evidência e os limites da conclusão.

Nenhum código operacional, arquivo de configuração, recurso recuperado ou
arquivo preexistente foi alterado nesta verificação.
