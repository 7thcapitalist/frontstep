# Prévias locais por nicho

Estas páginas são demonstrações **fictícias** e não estão publicadas. Dados, preços e contatos são exemplos; fotos licenciadas são referências visuais, não prova do negócio retratado. Cada pasta contém `public/`, relatório e screenshots em `qa/`, e notas de revisão no próprio `README.md`.

A [auditoria de movimento](../../local-qa/MOTION-AUDIT.md) registra eventos executados no navegador e verifica que o conteúdo permanece visível com movimento reduzido.

Para navegar localmente por todos os exemplares concluídos:

```powershell
node frontstep/local-factory/preview-examples.mjs
```

Abra `http://127.0.0.1:4191/`. O índice usa `catalog.json` e mostra apenas exemplares com QA aprovado e captura disponível. Para repetir a verificação, execute `node frontstep/local-factory/verify-examples.mjs`.

As capturas [desktop](gallery.png) e [celular](gallery-mobile.png) mostram o índice. As nove miniaturas carregam integralmente.

| Família | Brief | Exemplar |
|---|---|---|
| comida | `restaurante-praca-do-sol` | `mesa-da-praca` |
| juridico_contabil | `contabilidade-vila-clara` | `vila-clara` |
| beleza | `atelie-aurora` | `atelie-aurora` |
| fitness | `movimento-bairro` | `movimento-bairro` |
| loja | `casa-do-papel` | `casa-do-papel` |
| hospedagem_eventos | `recanto-das-pedras` | `recanto-das-pedras` |
| industria_b2b | `metal-linha` | `metal-linha` |
| servico_local | `conserta-bairro` | `conserta-bairro` |
| saude | `espaco-cuidado` | `espaco-cuidado` (protótipo não publicável) |

Todas as nove famílias têm briefs, mídia com procedência, cenários de QA e um exemplar local. O de saúde é exclusivamente um estudo de interface e não pode ser publicado como página de clínica com os dados atuais.
