# Ateliê Aurora — exemplar local

Página de demonstração fictícia baseada em `frontstep/local-briefs/atelie-aurora.json`. O salão, os preços e o contato são exemplos. Selecionar serviço e turno apenas prepara uma mensagem para número de teste inválido; não reserva um horário.

A direção usa curvas de mechas desenhadas em SVG, recorte em arco para fotografia de ferramentas, tipos editoriais e paleta ameixa/rosa do brief. As duas fotos licenciadas são referências visuais: uma de ferramentas e outra de interior. Nenhuma retrata trabalho, equipe ou espaço do salão fictício. Créditos ficam visíveis no rodapé.

## Revisão visual local — 16/10/2026

Inspecionei as capturas completas `qa/desktop.png`, `qa/mobile.png` e os estados preenchidos `qa/*-feature.png`: as duas fotos carregam, a primeira aparece no primeiro viewport desktop e mobile, o recorte em arco mantém o assunto visível e os créditos/avisos ficam legíveis. O traço de mecha em SVG substituiu um símbolo decorativo que não tinha a mesma qualidade. Paleta e composição são distintas dos exemplares de restaurante e contabilidade.

Autoavaliação visual: **8,8/10 como demo sintética**. O desenho tem personalidade, boa hierarquia e um agendamento leve. Sem fotos próprias de cabelo, trabalhos ou espaço do salão, não seria honesto apresentá-lo como portfólio real. As fotos de ferramentas e interior permanecem identificadas como referências.

Contraste calculado: ameixa sobre papel 9,84:1; terracota escuro em texto pequeno sobre papel 6,16:1; rosa sobre ameixa 6,15:1; branco sobre ameixa 11,02:1; créditos claros no rodapé 8,91:1. O terracota original aparece em elementos grandes, com variante escura nos textos menores.

QA padrão passou em desktop/mobile: três serviços, duas fotos e créditos, seleção de Corte + manhã, resumo e link para número de teste, sem overflow, erro de console ou resposta HTTP quebrada. O cenário `change-turn.scenario.json` confirmou que mudar para tarde atualiza resumo e link; `clear-service.scenario.json` confirmou que a ação fica indisponível ao limpar o serviço. Capturas com `prefers-reduced-motion: reduce` mostram tudo visível, e o fallback sem JS explica a consulta sem simular reserva. Traço SVG e revelações têm fim estático e foram revisados no código; não houve medição de fluidez em dispositivo físico.

```powershell
node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/atelie-aurora/public --brief frontstep/local-briefs/atelie-aurora.json --scenario frontstep/local-briefs/atelie-aurora.scenario.json --out frontstep/local-factory/examples/atelie-aurora/qa --json
```
