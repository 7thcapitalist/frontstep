# Conserta Bairro — exemplar de serviço local

Prévia local fictícia de assistência técnica no Taquaral e bairros próximos. Visual de etiqueta de oficina: amarelo quente, azul escuro, desenhos simples de aparelhos e sequência aparelho → bairro → turno. As duas fotos Pexels são de referência e não mostram a equipe, ferramentas ou reparos do serviço fictício.

## Pedido de visita de avaliação

O formulário pede somente tipo de aparelho, bairro e turno preferido. Mostra resumo antes de preparar uma mensagem que pergunta se a região é atendida e como funciona a avaliação. Não coleta endereço completo, telefone ou série do aparelho; não apresenta vagas, diagnóstico, preço ou garantia. Sem JS, as instruções de consulta manual permanecem visíveis.

## QA visual

Inspecionei capturas completas desktop e celular. Fotos carregam, cartões e formulário são legíveis e não há corte horizontal. QA passou em ambos viewports com Geladeira/Taquaral/tarde, imagens, fallback no-JS e ausência de erros. `prefers-reduced-motion` desliga selo e faixa animados.

**Autoavaliação: 8,7/10 como demonstração.** É cordial e prático, com fluxo curto e honesto. Dados operacionais e fotos reais do serviço faltam para uso público.

Executar: `node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/conserta-bairro/public --brief frontstep/local-briefs/conserta-bairro.json --scenario frontstep/local-briefs/conserta-bairro.scenario.json --out frontstep/local-factory/examples/conserta-bairro/qa --json`
