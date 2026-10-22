# Skills de movimento para o builder local

> Atualização de integração, 16/10/2026: as pendências descritas na pesquisa inicial abaixo foram implementadas em `design-resources.mjs` e `runtime/`. Os jobs agora recebem as sete skills completas, o runtime GSAP 3.15.0 local e auditoria de propriedades renderizadas. Consulte `BUILDER-AGENT.md`, `runtime/MOTION-RUNTIME.md` e `VISUAL-RUBRIC.md`. O texto abaixo registra o estado encontrado antes dessa integração, não o estado atual.

Pesquisa e cópia feitas em 16/10/2026. As skills são **instruções para o agente**, não são a biblioteca JavaScript GSAP. Nenhum pacote, script dos repositórios ou CDN foi executado/instalado. O helper local `skill-installer` copiou os diretórios de skills dos commits fixados abaixo para `design-kit/skills/`.

| Fonte verificada | Commit fixado | Licença e adoção observada | Skills instaladas |
|---|---|---|---|
| [GreenSock / gsap-skills](https://github.com/greensock/gsap-skills) | [`aed9cfd3277740755f6bfc1155c7aa645403b760`](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760) | [MIT](skills/GSAP-LICENSE.txt); 16.509 estrelas na consulta | [gsap-core](skills/gsap-core/SKILL.md), [gsap-timeline](skills/gsap-timeline/SKILL.md), [gsap-scrolltrigger](skills/gsap-scrolltrigger/SKILL.md), [gsap-performance](skills/gsap-performance/SKILL.md), [gsap-plugins](skills/gsap-plugins/SKILL.md) |
| [Emil Kowalski / skills](https://github.com/emilkowalski/skills) | [`2d228630ba1446365f614a108cb8252f1feda202`](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202) | [MIT](skills/EMIL-LICENSE.txt); 46.717 estrelas na consulta | [emil-design-eng](skills/emil-design-eng/SKILL.md), [improve-animations](skills/improve-animations/SKILL.md), mais `AUDIT.md` e `PLAN-TEMPLATE.md` dessa última |

Os SHAs foram confirmados por `git ls-remote` antes da cópia. A licença MIT de cada repositório foi salva a partir do mesmo commit; os arquivos instalados contêm somente Markdown. Estrelas indicam uso popular, não medem qualidade de uma página. A cópia permanece estável mesmo que `main` mude.

## Adequação ao builder

O builder atual gera HTML/CSS/JS estático local, sem instalar dependências em cada job e sem buscar scripts na rede. As cinco skills GSAP ajudam a **planejar e revisar** movimento, mas os exemplos com `import gsap from "gsap"` só funcionam quando o runtime GSAP estiver empacotado localmente. Hoje ele **não está** no kit. A instalação das skills não deve fazer o agente gerar `<script src="https://...">`, `npm install` no job ou import que o navegador não consegue resolver. Para a maioria das prévias, CSS transitions, keyframes e Web Animations API são suficientes e evitam peso extra.

O `server.mjs` usa uma lista fixa de arquivos em `copyReferences` (linhas 230–249 na pesquisa) e prompts que citam somente as referências anteriores. Portanto, **as sete novas skills estão instaladas, mas ainda não são copiadas para jobs nem lidas automaticamente pelo builder**. Esta tarefa não altera `server.mjs`; a ativação futura precisa adicionar roteamento de fase explícito e testar o tamanho dos prompts.

### Roteamento proposto por fase

| Fase | Referência | Uso preciso |
|---|---|---|
| Direção | `emil-design-eng` | Decidir **se** algo anima, por quê, frequência de uso, origem física, durações e personalidade do nicho. Produzir no plano no máximo 2–3 momentos com propósito e estado final estático. |
| Construção básica | `gsap-core` | Para movimento programático simples, usar a semântica de transform/opacity, controle de interrupção e `prefers-reduced-motion`; implementar com CSS/WAAPI quando não há runtime GSAP. |
| Sequência | `gsap-timeline` | Coreografar duas ou mais etapas dependentes, com ordem e rótulos. Em HTML estático, usar WAAPI `finished`/promessas ou CSS com classes; GSAP real só após bundle local verificado. |
| Rolagem | `gsap-scrolltrigger` | Apenas quando a posição na página carrega significado; evitar pin/scrub genéricos. Sem GSAP, `IntersectionObserver` ativa uma classe com estado inicial legível e estado final persistente. |
| Desempenho | `gsap-performance` | Revisar transform/opacity, quantidades de elementos, `will-change` pontual, leituras/escritas DOM e limpeza de observadores/tweens. Sempre durante build e revisão. |
| Efeitos específicos | `gsap-plugins` | Consultar somente quando houver necessidade concreta de Flip, desenho SVG, SplitText ou drag. Exige plugin/runtime local; não deve ser padrão visual do nicho. |
| Auditoria | `improve-animations` | **Somente revisão e plano** em uma etapa separada após a página existir. A própria skill proíbe editar fonte, instalar e executar mutações; não pode ser instrução do agente de build que precisa corrigir arquivos. O builder pode ler o `AUDIT.md` como critérios, mas não invocar o fluxo inteiro para implementação. |

### Aplicação concreta em HTML estático

1. **Movimento editorial:** camada abstrata ou foto de referência com `transform: translate/scale` e keyframe discreto; não mover texto longo nem rotular imagem de banco como foto do negócio. O primeiro quadro deve ser completo e legível.
2. **Resposta a formulário:** progresso visual de etapas por `transform: scaleX()` e `transition: transform 180–350ms ease-out`; atualizar a classe ou variável somente após entrada válida. O resumo textual em `aria-live` contém toda a informação, sem depender da animação.
3. **Entrada por rolagem:** `IntersectionObserver` adiciona uma classe a detalhes secundários; conteúdo principal fica visível por padrão. Se JS falhar, tudo continua visível. Se o elemento estiver fora do viewport, evitar animação contínua desnecessária.
4. **Movimento reduzido:** desligar deslocamentos, zoom, pin e scrub em `@media (prefers-reduced-motion: reduce)` e no código que cria animações. Uma mudança instantânea de estado ou transição de cor/opacity discreta pode permanecer se ajudar compreensão.
5. **Testes:** QA funcional, captura desktop/mobile, captura com movimento reduzido e `motion-audit.mjs` para observar `animationstart`/`transitionrun`/WAAPI na carga, rolagem e cenário. Contar eventos é evidência de execução, não nota de design; revisar duração, composição, contraste, foco e legibilidade em vídeo ou inspeção temporal quando necessário.

Exemplo sem dependência externa para uma revelação **decorativa** por rolagem:

```css
.accent-line { transform: scaleX(1); transform-origin: left; }
.js .accent-line[data-waiting] { transform: scaleX(.05); }
.js .accent-line.is-seen { transform: scaleX(1); transition: transform 300ms ease-out; }
@media (prefers-reduced-motion: reduce) {
  .js .accent-line[data-waiting] { transform: none; }
  .js .accent-line.is-seen { transition: none; }
}
```

```js
document.documentElement.classList.add('js');
const line = document.querySelector('.accent-line');
if (line && !matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  line.dataset.waiting = '';
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      line.classList.add('is-seen');
      observer.disconnect();
    }
  }, { threshold: .2 });
  observer.observe(line);
}
```

Se um job realmente precisar de timeline, ScrollTrigger ou plugin, a decisão deve entrar no plano. Um passo de infraestrutura separado precisa fornecer versão fixada do pacote público `gsap` como arquivo local `public/vendor/`, com licença do runtime e teste de carregamento offline. Até esse passo existir, exemplos GSAP das skills são **referência de comportamento**, não código pronto para colar no job.

## Contradições e limites das fontes

- `improve-animations` se autodefine como consultor **somente leitura**, com instrução de não modificar código nem rodar builds. Isso conflita com o agente construtor, cuja tarefa é aplicar ajustes e testar. Usá-la apenas em revisão independente; passar achados concretos ao construtor.
- `emil-design-eng` usa exemplos de Framer Motion/React e uma resposta inicial padronizada. O builder é HTML estático e recebe tarefa concreta; aplicar os princípios de decisão/easing/feedback, sem importar React nem trocar o briefing por uma frase de apresentação.
- `gsap-core` recomenda GSAP como biblioteca padrão para animação JS, e outras skills mostram `npm install gsap`. O contrato atual do job proíbe instalar pacotes ou carregar scripts externos. A recomendação não supera esse contrato: CSS/WAAPI agora, bundle local planejado depois.
- `gsap-plugins` oferece efeitos de grande impacto, mas SplitText, ScrollSmoother e pinning podem prejudicar conteúdo sem JS, rolagem natural ou acessibilidade. Só usar por necessidade demonstrável, com fallback estático e revisão visual. A afirmação de licenciamento dos plugins deve ser conferida novamente no momento de incluir o **runtime**; aqui foi instalada apenas documentação MIT.
- A orientação de `autoAlpha: 0`/visibilidade escondida em GSAP exige atenção ao fallback: conteúdo central não pode começar oculto por CSS se o JS não carregar. A regra local de verdade do brief, procedência das imagens e legibilidade vale acima de qualquer exemplo de animação.

## Resultado desta tarefa

Sete skills instaladas com fonte, licença e commit verificáveis; nenhuma mudança no servidor, QA ou sites existentes. **Instalar uma skill não ativa seu uso automático no builder atual.** A próxima integração deve copiar referências selecionadas por fase e, se necessário, disponibilizar GSAP como runtime local antes de aceitar código GSAP nos sites.
