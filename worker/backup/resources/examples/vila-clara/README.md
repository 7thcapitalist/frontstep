# Vila Clara Contabilidade — exemplar local

Página fictícia baseada no brief `frontstep/local-briefs/contabilidade-vila-clara.json`. Empresa e contato não existem. O formulário monta uma pauta e um link para número de teste inválido; não transmite dados nem promete atendimento.

Direção visual: linguagem de pasta e documento, com camadas retangulares, numeração útil e fluxo de triagem. A tipografia sans, a paleta verde/sálvia/terracota e a animação de abertura do arquivo a distinguem do exemplar de restaurante. As fotos licenciadas de Campinas e de materiais de trabalho são contexto ilustrativo, não imagens da empresa. Créditos visíveis no rodapé.

## Revisão visual local — 16/10/2026

Capturas em `qa/desktop.png`, `qa/mobile.png`, `qa/desktop-feature.png` e `qa/mobile-feature.png`. Inspecionei as versões completas: fotos carregadas em ambas as larguras, tab da pasta e composição estáveis, campos legíveis e resumo integrado ao mesmo documento. A capa usa a foto de Campinas como contexto; a imagem de documentos fica identificada como ilustrativa. Os dois créditos aparecem no rodapé.

Autoavaliação visual: **9/10 como demo sintética**. O sistema visual difere do restaurante e tem um motivo ligado ao trabalho contábil, sem números, selos ou promessas fabricadas. Para uma entrega real ainda faltariam identidade e provas do escritório, horário, endereço e fotos próprias. Nada disso foi inventado.

Contraste principal calculado: papel sobre verde 10,83:1, texto verde sobre papel 11,63:1, terracota escuro sobre papel 5,59:1, botão branco sobre terracota escuro 5,94:1, créditos claros sobre verde escuro 8,95:1. O terracota original do brief permanece na composição; uma variante escura foi aplicada a textos pequenos e botões após a revisão de contraste.

QA padrão passou em desktop e mobile, com 3 serviços visíveis, 2 imagens carregadas, 2 créditos visíveis, triagem preenchida, resumo e link de exemplo, zero erro de console/HTTP, sem overflow e fallback sem JavaScript. O cenário `change-topic.scenario.json` confirmou atualização de resumo e link após mudar para Abrir empresa; `required-city.scenario.json` confirmou erro claro e campo inválido quando a cidade está vazia. O QA usa movimento reduzido e as capturas mostram o conteúdo legível nesse modo. A revelação da foto e do resumo foi revisada no código; não medi suavidade em dispositivo físico.

```powershell
node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/vila-clara/public --brief frontstep/local-briefs/contabilidade-vila-clara.json --scenario frontstep/local-briefs/contabilidade-vila-clara.scenario.json --out frontstep/local-factory/examples/vila-clara/qa --json
```
