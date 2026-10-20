# Casa do Papel — exemplar de papelaria

Prévia local fictícia para uma papelaria no Centro de Campinas. A direção visual usa grade pontilhada de caderno, selo giratório, blocos de cores, serifa editorial e desenhos simples dos produtos. Os cartões são ilustrações em CSS; não fingem ser fotografias de itens vendidos.

## Catálogo de consulta

Filtro por Cadernos, Escrita e Acessórios, produto e quantidade inteira positiva. O resumo calcula o valor fictício em BRL; 2 Cadernos pontilhados = **R$ 48,00**. O link apenas prepara mensagem de consulta de disponibilidade em número demonstrativo, sem confirmar estoque, entrega, pagamento ou pedido. Sem JavaScript, catálogo e valores permanecem legíveis.

## Fotos e limites

As duas fotos são referências visuais licenciadas pela Pexels, com crédito e links no rodapé e legendas que deixam claro que não são produtos da loja. Todos os preços e dados do negócio são fictícios. Não há endereço, horários ou avaliações inventados.

## QA visual

Inspecionei as capturas completas desktop e celular. Hero, fotos, quatro cards e formulário aparecem sem recorte horizontal, com contraste e hierarquia legíveis. O QA passou em ambos tamanhos: filtros, resumo R$ 48,00, link de consulta, imagens, fallback sem JS e nenhum erro de rede/console. `prefers-reduced-motion` desliga a animação do selo e das formas.

**Autoavaliação: 8,8/10 como demonstração.** Linguagem própria e consulta funcional; limita-se pela ausência de fotos de produtos, estoque e dados reais da loja.

Executar: `node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/casa-do-papel/public --brief frontstep/local-briefs/casa-do-papel.json --scenario frontstep/local-briefs/casa-do-papel.scenario.json --out frontstep/local-factory/examples/casa-do-papel/qa --json`
