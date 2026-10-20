# Auditoria de movimento e passe visual independente

Data: 16/10/2026. Chromium via Playwright 1.56.1, viewport desktop 1365 × 900. Cada exemplar foi aberto com movimento normal, percorrido em quatro posições, exercitado com os passos do cenário e inspecionado em até quatro controles por hover. O script registra eventos CSS/WAAPI e amostra `transform`/`opacity` computados a cada quadro. Depois a página é reaberta em desktop e mobile com `prefers-reduced-motion: reduce`. Nenhum link de WhatsApp foi acionado.

| Nicho e exemplar | Eventos CSS/WAAPI | Grupos com mudança computada | `hasMeaningfulChange` |
|---|---:|---:|---|
| Contabilidade, [Vila Clara](motion-evidence/vila-clara/motion-report.json) | 23 | 31 | sim, hero |
| Restaurante, [Mesa da Praça](motion-evidence/mesa-da-praca/motion-report.json) | 52 | 159 | sim, imagem do hero |
| Papelaria, [Casa do Papel](motion-evidence/casa-do-papel/motion-report.json) | 4 | 37 | não |
| Hospedagem, [Recanto das Pedras](motion-evidence/recanto-das-pedras/motion-report.json) | 2 | 13 | não |
| Indústria, [Metal Linha](motion-evidence/metal-linha/motion-report.json) | 2 | 2 | não |
| Fitness, [Movimento do Bairro](motion-evidence/movimento-bairro/motion-report.json) | 16 | 39 | sim, cena visual |
| Beleza, [Ateliê Aurora](motion-evidence/atelie-aurora/motion-report.json) | 17 | 29 | sim, cena visual com traço SVG |
| Assistência técnica, [Conserta Bairro](motion-evidence/conserta-bairro/motion-report.json) | 3 | 37 | não |
| Saúde, [Espaço Cuidado](motion-evidence/espaco-cuidado/motion-report.json) | 3 | 1 | não |

Todos os nove relatórios terminaram sem erro de página ou nos passos do cenário. `matchMedia` confirmou `reduce` em desktop e mobile; nenhum título, seção principal ou região de feature que deveria estar visível ficou oculto. Um título dentro de painel inicialmente fechado da Vila Clara foi excluído corretamente por seu ancestral `[hidden]`. Nenhuma chamada a `Element.animate` foi registrada. Cada pasta de evidência inclui `storyboard.png`, `reduced-motion.png` e `reduced-motion-mobile.png`.

**Interpretação:** `hasMeaningfulChange` é uma medida conservadora de mudança real e substancial numa cena marcada ou hero/visual/feature de exemplo antigo, excluindo hover e controles. Não equivale a aprovação estética. Cinco exemplos antigos retornaram `false` sob esse critério embora alguns tenham eventos; o novo contrato do builder fornece `data-motion-signature`, `data-motion-purpose` e `data-motion-part` para medir a intenção da cena com precisão. A [fixture de movimento](motion-evidence/runtime-fixture/motion-report.json) provou `true` com zero eventos CSS/WAAPI: o auditor mediu translação, recorte e um traço SVG que avançou durante a janela amostrada. O [storyboard da fixture](motion-evidence/runtime-fixture/storyboard.png) mostra entrada real em 59, 252 e 1.014 ms, além de três capturas da mesma cena durante a rolagem. O relatório registra os tempos medidos, que variam entre execuções. Cada relatório dos nove exemplares levou cerca de 10 a 14 segundos, abaixo do orçamento de 120 segundos.

## Passe visual

Revisei as capturas `qa/desktop.png` e `qa/mobile.png` dos nove exemplares. Em Conserta Bairro, as duas fotos de ferramentas estão presentes e têm legenda de referência; não encontrei texto cortado ou layout quebrado. Em Espaço Cuidado, a imagem do ambiente clínico está presente e identificada como referência que não representa a clínica fictícia. A faixa superior, os textos e a área de contato ficam legíveis nas duas larguras. Nos outros sete exemplares, as fotografias de referência também têm legendas explícitas. Não identifiquei imagem ausente, tipografia visivelmente cortada ou fotografia apresentada como se fosse do negócio. Nenhuma correção visual bloqueante foi encontrada nas capturas.

Limite da revisão: capturas de página inteira foram reduzidas para inspeção visual e mostram o estado inicial. Elas não provam todos os estados interativos, foco de teclado ou contraste de cada elemento. O gate funcional e testes específicos continuam necessários antes de publicação.
