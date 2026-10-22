# Metal Linha — exemplar industrial

Prévia local fictícia de usinagem B2B em Campinas. Linguagem técnica em grade modular, coordenadas, escala, divisões de processo e tipografia direta. As fotografias licenciadas são referências de CNC e torno, sempre rotuladas como tal. Elas não comprovam máquinas, instalações ou capacidade da fábrica fictícia.

## Triagem de cotação

Quatro entradas: peça/serviço, material, quantidade inteira positiva e prazo desejado. O resumo estruturado prepara uma mensagem de consulta, sem upload, envio automático, promessa de orçamento, tolerância ou prazo. O cenário de teste `Suporte em alumínio`, alumínio, 120 peças e 30/04/2027 passou. Sem JavaScript, a página mostra instrução de consulta manual.

## Dados pendentes

Antes de uso real, confirmar parque de máquinas, materiais atendidos, dimensões, tolerâncias, inspeções, certificações, condições comerciais, endereço e contato. A página não inventa esses dados nem deve ser publicada como fábrica existente.

## QA visual

Inspecionei capturas completas desktop e celular. Fotografias visíveis, hierarquia e contraste claros, formulário legível sem overflow. QA passou em ambos tamanhos: cenário funcional, imagens, no-JS e nenhum erro de console/rede. `prefers-reduced-motion` remove rolagem suave.

**Autoavaliação: 8,7/10 como demonstração.** A hierarquia técnica e o fluxo de triagem são bons; a falta de dados industriais verificáveis limita o valor comercial.

## Movimento verificado

Em modo normal, uma linha de varredura lenta atravessa a foto de referência e a régua de precisão do resumo se estende quando os quatro campos ficam válidos. A [auditoria de movimento](motion/motion-report.json) registrou **2 eventos reais**: `animationstart` na carga e `transitionrun` no quarto passo do cenário. Movimento reduzido desliga ambos; nenhum conteúdo principal fica oculto e a página permanece legível sem JS. QA reexecutado e aprovado após a mudança.

Executar: `node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/metal-linha/public --brief frontstep/local-briefs/metal-linha.json --scenario frontstep/local-briefs/metal-linha.scenario.json --out frontstep/local-factory/examples/metal-linha/qa --json`
