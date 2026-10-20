# Fluxo manual no Windows — 20/10/2026

Implementado na pasta original autorizada `C:\Users\joaov\Documents\frontstep`,
somente em `worker/backup/`. A geração local permanece pausada. Não houve
consulta ao mini PC, n8n, credenciais, saldo ou modelos reais nesta etapa.

## O que está conectado

`manual_flow.submit` valida o JSON do brief, exige IDs explícitos de construção
e revisão, verifica os recursos recuperados e registra o pedido em `Ledger.jobs`
pela fila existente. A admissão funciona pausada, sem adquirir posse ou chamar
IA. Reenvio idêntico é idempotente. Alteração do brief, recursos, mídias ou
baseline sob a mesma identidade falha, preservando o registro anterior.
O normalizador legado e a entrada manual usam o mesmo namespace de identidade:
trocar o perfil de entrada não cria outra tentativa para a mesma revisão.

`manual_flow.execute_claim` liga a posse durável à construção: lê o pedido
persistido, verifica hashes, monta o contexto das skills e recursos, executa
pelo Executor existente e confirma a fila após resultado conhecido. Inicial
e reparo usam o mesmo job, histórico, orçamento e posse. Não há fila paralela,
consumidor contínuo, retry automático ou reset na retomada.

A construção produz HTML/CSS/JS estático, plano, registro de uso das referências,
assets locais, relatório de QA e capturas. A revisão visual humana continua
obrigatória. Nos testes, respostas, navegador e capturas são simulados; não
comprovam qualidade visual real ou equivalência com a instalação do mini PC.
As referências recuperadas ficam disponíveis no workspace; as referências
selecionadas são incluídas no contexto da chamada.

## Comandos preparados

Execute a partir de `C:\Users\joaov\Documents\frontstep`. Os comandos abaixo
documentam o uso; nenhum pedido real foi admitido durante esta implementação.

```powershell
# Consulta local, sem produção.
python -B worker/backup/manual_flow.py status

# Admissão local, ainda pausada. Use brief revisado e IDs explícitos.
python -B worker/backup/manual_flow.py submit --brief C:\caminho\brief.json --construction-id cliente-001 --revision-id r1

# Bloqueado: exit code 2, generation_paused, generation_started=false.
python -B worker/backup/manual_flow.py build
```

O brief exige `slug`, `business.name`, `business.niche`, `business.city` e
`contact.whatsapp`. `fase` aceita `previa` ou `final`.
`examples/manual-brief.mock.json` mostra a estrutura com dados fictícios.
JSON ambíguo, números inválidos e campos de credenciais são recusados.

Mídias precisam existir localmente: `--media-root` delimita a pasta permitida,
com caminhos relativos em `media.uploads` ou `media.local_files`. URLs de fotos
não são baixadas; exigem cópias locais explicitamente mapeadas. Para revisão,
use um `revision-id` novo e `--existing-site` apontando para um resultado dentro
de `worker/backup/workspaces`. O digest do site anterior entra no pedido;
o site anterior não é sobrescrito. Não troque IDs para repetir uma fase falha.

O CLI usa somente `worker/backup/.state/manual.sqlite`; não oferece argumento
para trocar de banco e zerar limites. Status/admissão podem criar esse banco
pausado. `build` falha antes de abrir banco, adquirir posse ou criar arquivos.
Não existe comando de retomada nem transporte real conectado ao fluxo manual.
Alterar `paused` para `false` também falha pelo carregador central.

## Recuperação e limites

A execução injetável foi testada com mocks. Um chamador futuro precisará guardar
a mesma `Claim` antes de executar. Após queda antes da chamada, só essa posse
pode continuar; após inicial inválida, resta apenas o reparo. Reserva de
resultado incerto bloqueia qualquer repetição. Posse perdida, estado terminal
sem confirmação ou saída incompleta exigem reconciliação, sem limpeza automática.
`execute_claim` recusa reexecutar estado terminal; a confirmação de resultado
terminal conhecido é uma operação separada da fila existente. Não há comando
para forçar desbloqueio.

Antes de cada chamada, recursos, mídia e baseline são verificados novamente,
e o Executor revalida pausa, orçamento autorizado, saldo, medição, modelo e
esforço. O limite continua uma inicial e no máximo um reparo. Nenhum modelo real
foi escolhido: `model: null` é intencional enquanto faltarem metadados de
disponibilidade e autorização. O saldo histórico de 7% não é usado.

## Verificação

Resultado final observado em 20/10/2026: **111 testes Python passaram em
8,145 s**, incluindo 16 testes novos do fluxo manual; **3 testes Node passaram**
com navegador falso. A integridade dos **682 arquivos** foi confirmada.
`site_builder.py status` retornou `paused: true`, `model: null`,
`api_transport_enabled: false` e `production_verified: false`. O comando
`manual_flow.py build` retornou código **2** com `generation_paused` e
`generation_started: false`. O teste desse bloqueio também confirma que o CLI
não abre o ledger. Não se trata de prova de pausa remota.

```powershell
python -B -m unittest discover -s worker/backup/tests -q
node --test worker/backup/tests/browser_qa.test.mjs
python -B worker/backup/resource_pack.py verify
python -B worker/backup/site_builder.py status --config worker/backup/config.example.json
python -B worker/backup/manual_flow.py build
```

A suíte usa apenas mocks de IA/HTTP/navegador e processos descartáveis dos testes
de recuperação. Os testes novos do fluxo manual bloqueiam socket, HTTP e criação
de subprocessos. O teste do CLI usa brief e recursos fictícios em temporário,
sem pedido na fila operacional. Os testes Python usam a permissão de temporários
já autorizada neste ambiente, sem alterar ACLs.

Git permaneceu em `main`, commit `5b083d5b650906b88c5100085f96ccdd3febc09d`,
com apenas `?? worker/backup/`, sem diff rastreado ou staged. Os arquivos
anteriores do reserva foram ampliados, preservando recursos e histórico;
nenhum reset, limpeza, commit ou push foi executado.

Pendências: runtime real auditado e autorizado, disponibilidade de modelo econômico
sem geração, orçamento/saldo/medição atuais, supervisão real de processos e
validação visual humana. Não há integração de publicação, mensagens ou pagamento
conectada. Produção e pausa remota não foram verificadas. O fluxo manual local
não comprova exclusividade entre máquinas; conectar o mini PC futuramente exige
coordenação comum e transferência de posse.
