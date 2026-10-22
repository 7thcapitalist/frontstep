# Normalizador offline do contrato /build

Implementado em 20/10/2026, somente dentro de `worker/backup/`. Nenhum arquivo
preexistente foi modificado nesta etapa. A referência de transporte é o payload
legado observado: `row_id`, `build_token`, `brief`. Não há endpoint, consumidor,
callback, rede ou chamada de IA neste módulo.

## Interface

Na etapa posterior do [fluxo manual](MANUAL-WINDOWS.md), `construction_job_id`
centraliza a mesma identidade de construção/revisão para os dois perfis de
admissão. Trocar de perfil sob o mesmo par gera conflito de reconciliação,
preservando o histórico, sem criar outra tentativa.

- `normalize_build(payload, identity=...)`: valida e devolve um snapshot
  normalizado com ID estável. Não persiste nem executa trabalho.
- `admit_build(queue, payload, identity=...)`: registra esse snapshot na
  `DurableQueue` já existente e devolve somente o ID. Não adquire a fila,
  altera pausa, configura modelo ou inicia execução.

`payload` aceita um objeto ou seu texto JSON original. `brief` aceita objeto ou
texto JSON, conforme o worker histórico. Não há preenchimento de dados,
derivação de slug, escolha de modelo ou defaults de conteúdo. O brief passa
pelo validador de site existente.

O perfil offline exige exatamente os três campos legados. Campos extras,
ausentes, valores de tipo inesperado, JSON não finito, estruturas excessivas,
chaves JSON duplicadas e brief inválido são recusados com códigos fixos.
O corpo bruto é necessário para detectar duplicações que outro parser ainda
não tenha descartado; receber um dicionário já colapsado não permite reconstruir
ambiguidades perdidas antes da função. Uma futura entrada deverá preservar o
texto bruto para essa validação.

O perfil conservador de `row_id` aceita inteiro positivo seguro em JavaScript
ou identificador textual ASCII de até 128 caracteres. Inteiro e sua grafia
decimal canônica são equivalentes. Booleanos, floats, espaços e grafias numéricas
com zeros iniciais são recusados. A correlação exige texto ASCII imprimível sem
espaços, de 1 a 1.024 caracteres. Esses limites são validação local explícita;
os tipos/valores reais de clientes e toda a compatibilidade de produção não
foram observados ou certificados nesta etapa.

## Identidade explícita obrigatória

O contrato legado **não fornece informação suficiente** para estabelecer uma
identidade estável de construção e revisão. `row_id` sozinho identifica apenas
o registro correlacionado; o valor de correlação não é usado como identidade.

O chamador deve fornecer, em argumento separado, exatamente:

```json
{
  "construction_id": "synthetic-construction-A",
  "revision_id": "revision-1"
}
```

Ambos são identificadores textuais explícitos, sensíveis a caixa e sem espaços,
com até 128 caracteres. O identificador da fila é um SHA-256 de uma estrutura
JSON versionada contendo esse par. Não depende de `row_id` sozinho, slug,
correlação, timestamp, UUID ou qualquer sorteio. Não há revisão inicial presumida.

- Mesmo par e pedido semanticamente idêntico retornam o mesmo job, inclusive
  após reabrir o ledger. Ordem das chaves e representação JSON do brief não
  criam outro pedido.
- Mesmo par com outro registro, brief divergente ou correlação alterada retorna
  `build_reconciliation_required`, preservando o pedido e o histórico anteriores.
  Não escolhe outro ID e não cria outra tentativa.
- Uma revisão distinta só existe com `revision_id` explicitamente distinto.
  A função não infere revisão a partir de alterações do conteúdo ou da fase.
- A autoridade e legitimidade desses identificadores precisam ser acordadas
  antes de conectar um produtor real. Declarar outra revisão não constitui
  autorização de execução, orçamento ou aprovação comercial.

Portanto, o payload legado sem identidade adicional é recusado. Não conectar
automaticamente o workflow atual supondo que ele já forneça esses dados.

## Correlação e diagnóstico

O valor bruto de `build_token` é validado somente em memória. Não é retornado,
persistido, usado como ID de job ou copiado para o brief. Não foi lido, criado
ou reutilizado qualquer token real; os testes usam somente valores sintéticos.

Um fingerprint SHA-256 do envelope canônico fica no pedido interno para detectar
alteração da correlação sem guardar seu valor bruto. Esse fingerprint não é
credencial, autorização nem substituto do token exigido pelo callback e não
deve ser publicado como diagnóstico. Não há callback implementado aqui.

Campos de credencial conhecidos no brief e ecos do valor de correlação no
conteúdo, identidade ou saída persistida são recusados, em vez de removidos
silenciosamente. Isso pode bloquear valores curtos que coincidam com conteúdo;
não há geração de outra correlação para contornar a recusa.

O normalizador não faz logging. Sua representação padrão mostra só o ID do
job. Erros de parser e dependência são substituídos por códigos fixos, sem
expor valores recebidos ou a cadeia bruta de exceções nos diagnósticos normais.
Não é um mecanismo geral de detecção de todos os possíveis segredos; nenhum
payload real ou dado de cliente foi utilizado.

## Resultado de testes

```powershell
python -B -m unittest discover -s worker/backup/tests -p test_build_contract.py -v
python -B -m unittest discover -s worker/backup/tests -q
node --test worker/backup/tests/browser_qa.test.mjs
python -B worker/backup/site_builder.py status --config worker/backup/config.example.json
```

- Os **13 testes novos do contrato passaram**: formas de JSON, reabertura do
  ledger, identidade obrigatória, revisões explícitas, idempotência, conflitos,
  tipos, campos ausentes, duplicações, não mutação e diagnóstico sem correlação.
- A **regressão completa passou com 95 testes Python em 6,992 s**.
- Os **3 testes Node passaram**, com navegador falso.
- A admissão dos testes permaneceu em pausa, sem aquisição, calls ou execução.
- O status final confirmou `paused=true`, `model=null`, API desativada,
  `real_generation=blocked` e `production_verified=false`.

Branch `main`, commit `5b083d5b650906b88c5100085f96ccdd3febc09d` preservados.
A árvore continua com `worker/backup/` não rastreado e sem diferenças em arquivos
rastreados ou staged. Não houve alteração de configuração ou permissões,
instalação, SSH, conexão ao n8n, consumidor, IA real, publicação, push ou merge.

## Arquivos adicionados nesta etapa

- `build_contract.py`.
- `tests/test_build_contract.py`.
- `BUILD-CONTRACT.md`.

## Limites restantes

A integração com o produtor, a autoridade da identidade, o tratamento seguro de
correlação para um eventual callback e a adaptação ao consumidor de sites ainda
dependem de contrato e autorização futuros. O normalizador não autentica
requisições nem certifica disponibilidade, saldo, custo ou runtime. A fila local
continua exigindo propriedade exclusiva compartilhada antes de qualquer
failover entre hosts; essa etapa não altera esse requisito nem ativa produção.
