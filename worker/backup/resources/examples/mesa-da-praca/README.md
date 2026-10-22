# Mesa da Praça — exemplar local

Site de demonstração **fictícia** para o brief `frontstep/local-briefs/restaurante-praca-do-sol.json`. Os preços, negócio e contato são exemplos. O resumo de pedido monta um link de inspeção para um número de teste inválido e não confirma nada.

Direção: cardápio como objeto editorial, com paleta vinho, creme, amarelo e verde do brief; pratos apresentados por fotografia licenciada de referência, sem alegar que retratam a Mesa da Praça. O hero revela a imagem como abertura de cardápio; entradas de conteúdo e confirmação visual do carrinho são as outras animações. Movimento reduzido e JavaScript desativado mantêm conteúdo e instruções.

As quatro fotos vêm de `frontstep/local-briefs/assets/mesa-da-praca/` e são copiadas em `public/media/`. Origem, licença e crédito constam no brief e no rodapé. Nenhuma imagem gerada é usada.

## Revisão visual local — 16/10/2026

As capturas desktop e mobile estão em `qa/desktop.png` e `qa/mobile.png`. Conferi as imagens no tamanho original: as quatro aparecem, inclusive na captura longa, e a primeira ocupa 37,6% do primeiro viewport desktop e 26,9% do mobile. Crédito e indicação de foto ilustrativa ficam visíveis. O cardápio mantém espaço e contraste no celular; não há rolagem lateral. Cores de texto principais conferidas por cálculo WCAG: creme sobre vinho 8,64:1, verde sobre creme 10,93:1, vinho escuro sobre amarelo 6,18:1, crédito amarelo sobre verde 8,37:1. As legendas sobre foto usam fundo escuro opaco; foram ampliadas para 11–12 px após inspeção.

Autoavaliação visual: **8,5/10**. A composição é específica para um almoço de bairro, tem fotografia presente e interação clara. O limite é a identidade sintética: fotos licenciadas não mostram pratos reais da marca, e faltam endereço, horários e voz real do negócio. Por isso o exemplar é uma referência de qualidade do builder, não uma entrega pronta para um restaurante verdadeiro.

O QA padrão passou em desktop e mobile, incluindo uso das quatro fotos, créditos, aviso fictício, pedido de 2 pratos + 1 suco (R$ 85,00), fallback sem JS e zero erros de console/HTTP. Cenários adicionais em `remove-one.scenario.json` e `empty-order.scenario.json` passaram: total de R$ 47,00 após remover um prato, e R$ 0,00 com ação indisponível ao esvaziar. O QA usa `prefers-reduced-motion: reduce`; as capturas mostram todo o conteúdo visível nesse modo. Em modo normal, a imagem do hero revela, seções entram por `IntersectionObserver` e o carrinho confirma mudanças; essas animações foram revisadas no código, sem medição de fluidez em dispositivo físico.

Para verificar:

```powershell
node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/mesa-da-praca/public --brief frontstep/local-briefs/restaurante-praca-do-sol.json --scenario frontstep/local-briefs/restaurante-praca-do-sol.scenario.json --out frontstep/local-factory/examples/mesa-da-praca/qa --json
```
