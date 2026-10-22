# QA local Frontstep

Gate de bloqueio para sites estáticos. Requer Node 20+, `npm ci` e `npm run install-browser` nesta pasta. O Chromium é instalado no cache do usuário; não faz parte do repositório. Nenhum servidor ou token externo é necessário para executar o gate: o Playwright intercepta os pedidos HTTP do site e lê os arquivos da pasta `public`.

```powershell
cd frontstep/local-qa
npm ci
npm run install-browser
node qa.mjs ../local-jobs/<slug>/public --brief ../local-briefs/<brief>.json --scenario ../local-briefs/<brief>.scenario.json --out ../local-jobs/<slug>/qa --json
```

O processo sai com `0` quando aprova, `1` quando encontra defeitos e `2` quando não consegue rodar (arquivo ausente, Playwright/Chromium indisponível ou erro de infraestrutura). **Qualquer código diferente de zero bloqueia o job.** `qa-result.json` registra todos os checks. Os arquivos de página inteira `desktop.png`, `mobile.png`, `desktop-feature.png`, `mobile-feature.png`, `desktop-nojs.png` e `mobile-nojs.png` continuam em `--out`. Para revisão visual representativa, o gate também grava `desktop-hero.png`, `mobile-hero.png`, `desktop-section.png`, `mobile-section.png`, `desktop-feature-viewport.png`, `mobile-feature-viewport.png`, `desktop-storyboard.png` e `mobile-storyboard.png`. Ele percorre a página antes da captura completa para revelar conteúdo abaixo da dobra e esconde apenas links de salto não focados durante a captura, evitando artefatos de composição da imagem.

O brief pode declarar `premium_feature` como texto ou `{ "id": "triagem" }`. Nesse caso, a página precisa ter `[data-feature="triagem"]`, uma indicação visível de que é demonstração fictícia e um `[data-feature-fallback]` com orientação útil que aparece sem JavaScript. O cenário confirma o funcionamento da feature com ações e asserções reais, sem navegar para WhatsApp:

```json
{
  "steps": [
    { "action": "fill", "selector": "#nome", "value": "Ana Teste" },
    { "action": "click", "selector": "#gerar" }
  ],
  "assertions": [
    { "kind": "text", "selector": "#resumo", "includes": "Ana Teste" },
    { "kind": "attribute", "selector": "#link", "name": "href", "includes": "Ana%20Teste" }
  ]
}
```

As ações aceitas são `fill`, `click`, `check` e `select`. As asserções aceitas são `visible`, `text`, `attribute` e `value`, com `includes` ou `equals` opcionais. Use dados sintéticos. O gate verifica título, idioma, um `h1`, overflow horizontal, âncoras, links internos, nomes de botões, rótulos de formulário, imagens quebradas e sem `alt`, erros de console e respostas HTTP. Chamadas a serviços externos ainda podem falhar por rede e serão apontadas nos erros de navegação; os sites de demonstração devem usar recursos locais.

Prova do próprio gate:

```powershell
npm test
```

As fixtures verificam aprovação de uma página funcional e reprovação de outra com overflow, imagem e âncora quebradas, erro de console e feature ausente. Uma terceira fixture comprova que caminhos locais começando com `/` em HTML, CSS ou import de módulo são reprovados: a prévia é servida em `/preview/<id>/` e precisa de caminhos relativos como `./style.css` e `./media/photo.png`. O teste exige os códigos de saída `0` e `1` e lê o relatório gerado.

## Auditoria de movimento (observacional)

```powershell
node motion-audit.mjs ../local-factory/examples/mesa-da-praca/public --scenario ../local-briefs/restaurante-praca-do-sol.scenario.json --out motion-evidence/mesa-da-praca
```

Este script abre o site com `prefers-reduced-motion: no-preference`, registra `animationstart`, `transitionrun` e chamadas de `Element.animate`, e amostra `transform`, `opacity`, `clip-path`, `stroke-dashoffset` e `stroke-dasharray` computados a cada quadro para detectar também movimento feito com `requestAnimationFrame` ou GSAP. Percorre quatro posições da página, executa os passos do cenário e passa o ponteiro por até quatro controles. Salva `motion-hero.png`, `motion-section.png` e `motion-feature.png`. Se houver `[data-motion-signature]` na primeira tela, uma navegação nova com `waitUntil: domcontentloaded` captura `entrance-early.png`, `entrance-mid.png` e `entrance-settled.png`; `entranceTimeline.positions` registra o tempo real antes e depois de cada captura. As metas são aproximadamente 0, 250 e 1000 ms, sem prometer um quadro exatamente em 0 ms nem atrasar o site. Outra navegação captura `signature-start.png`, `signature-mid.png` e `signature-end.png` da mesma cena em três posições/instantes, mantendo o primeiro `[data-motion-part]` visível. O `storyboard.png` mostra a visão geral, a entrada quando disponível e a progressão da cena; `signatureScene.positions` registra rolagem e tempos reais. Em exemplos antigos sem marcador, tenta o hero como cena visual candidata. Depois reabre em desktop e mobile com `prefers-reduced-motion: reduce`, confere ancestral oculto de títulos/seções/feature e salva `reduced-motion.png` e `reduced-motion-mobile.png`. O relatório completo fica em `motion-report.json`.

`signatureEvidence.hasMeaningfulChange` exige pelo menos dois quadros de mudança computada fora de hover/controle e amplitude observada de opacidade ≥ 0,18, translação ≥ 12 px, escala ≥ 5%, rotação ≥ 8°, traço SVG ≥ 10% do comprimento do caminho ou `clip-path` ≥ 10% da região. Regiões com `data-motion-signature` são identificadas pelo marcador e podem declarar `data-motion-purpose`; partes móveis podem declarar `data-motion-part`. Para exemplos antigos sem marcadores, somente hero/cena visual/feature entra como candidato. Isso é evidência de mudança, não uma aprovação estética automática. Saída `2` significa que a auditoria não conseguiu rodar; saída `0` significa que registrou os dados. A fixture de movimento prova que o relatório detecta `requestAnimationFrame`, desenho de linha SVG e recorte de imagem mesmo com zero eventos CSS/WAAPI.

Os resultados observados nos nove exemplares e o passe visual estão em [MOTION-AUDIT.md](MOTION-AUDIT.md).
