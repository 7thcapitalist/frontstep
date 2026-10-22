# Recanto das Pedras — exemplar de hospedagem

Conceito editorial fictício de pousada em Serra Negra. O ritmo visual é deliberadamente lento: fotografia ampla, serifa, cores de floresta e areia, linhas de horizonte. As duas paisagens brasileiras são **referências**, e cada imagem traz aviso visível de que não representa Serra Negra, o terreno ou a vista de uma pousada real.

## Consulta de interesse

Entrada, saída e número de adultos formam um resumo antes da mensagem. A saída deve ser posterior à entrada; hóspedes devem ser inteiros positivos. A mensagem pergunta sobre possibilidade, estrutura e tarifa, sem mostrar disponibilidade, preço, quarto ou reserva confirmada. Sem JS, instruções de consulta manual ficam disponíveis.

## Insumos faltantes

O bloco `data-slot="real-property-photography"` indica a necessidade de fotos reais do imóvel. Capacidade, inclusões, endereço, tarifas e inventário também dependem de verificação. Este exemplar **não é publicável** como anúncio de hospedagem. A pousada é fictícia e nenhuma reserva será recebida.

## QA e revisão visual

Inspecionei as capturas completas desktop e celular. Ambas as fotos carregam, as legendas aparecem e os formulários seguem legíveis sem overflow. QA passou nos dois tamanhos, incluindo cenário de 12/03/2027 a 15/03/2027 para 2 adultos, fallback no-JS e ausência de erros de rede/console. `prefers-reduced-motion` remove rolagem animada.

**Autoavaliação: 8,5/10 como conceito visual.** A direção tem atmosfera forte; a falta de imagens e dados do imóvel limita intencionalmente a credibilidade comercial.

## Movimento verificado

Em modo normal, a paisagem de abertura respira lentamente e a linha de interesse avança quando as datas e o número de adultos ficam válidos. A [auditoria de movimento](motion/motion-report.json) registrou **2 eventos reais**: `animationstart` na carga e `transitionrun` no segundo passo do cenário. Com movimento reduzido, nenhum elemento principal ficou oculto; sem JS, o conteúdo e a linha estática permanecem visíveis. QA reexecutado e aprovado após a mudança.

Executar: `node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/recanto-das-pedras/public --brief frontstep/local-briefs/recanto-das-pedras.json --scenario frontstep/local-briefs/recanto-das-pedras.scenario.json --out frontstep/local-factory/examples/recanto-das-pedras/qa --json`
