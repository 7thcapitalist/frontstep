# Revisão de movimento: a checagem da QA

Consolidado de `review-animations` (+STANDARDS) e das oito categorias de `improve-animations/AUDIT`. Para rodar no passo 5 do processo, lendo este arquivo. Valores exatos ficam em `motion.md` e em `motion-rules.md`: cite, não aproxime.

**Postura.** O viés é movimento que *parece certo*, não movimento que roda. Uma transição que funciona mas parece lenta, sai da origem errada ou derruba frames é regressão, não aprovação. **O default é sinalizar. Aprovação se conquista.**

Quando não der para decidir se o movimento parece certo lendo o código, diga isso em vez de chutar, e aponte a verificação (2-5x a duração, frame a frame, olho descansado no dia seguinte).

---

## Os dez padrões inegociáveis

Cada animação da página é medida contra estes. Violação é achado.

1. **Movimento justificado.** Responde "por que isto anima?" com feedback, consistência espacial, indicação de estado, explicação ou evitar salto brusco. "Fica legal" em elemento visto com frequência é bloqueio.
2. **Adequado à frequência.** O visitante vê a página uma vez: entrada é barata, hover que ele encontra a cada card rolando é caro.
3. **Easing responsivo.** Entrando/saindo usa `ease-out` ou curva forte. `ease-in` em UI é bloqueio.
4. **UI abaixo de 300 ms.** Acima disso num elemento de UI precisa de justificativa escrita. Camada de assinatura tem outro orçamento (`motion-rules.md`).
5. **Origem e fisicalidade.** Popover/menu escalam do gatilho, não do centro. Nunca `scale(0)`. Modal é exceção, fica centrado.
6. **Interrompível.** O que dispara rápido usa transition, não keyframes.
7. **Só GPU.** `transform` e `opacity` (mais `clip-path`). Animar `width`/`height`/`margin`/`padding`/`top`/`left` é achado de performance.
8. **Acessibilidade.** `prefers-reduced-motion` respeitado. Hover com movimento atrás de `@media (hover: hover) and (pointer: fine)`.
9. **Enter/exit assimétricos.** Fase deliberada lenta, resposta do sistema rápida. Tempo simétrico num press-and-release é achado.
10. **Coesão.** O movimento combina com a personalidade do negócio. Clínica é discreta e rápida; padaria pode ser mais solta. Quando estiver em dúvida se o movimento ajuda, apagar costuma ser a jogada mais forte.

---

## Gatilhos de escalada: sinalize na hora

- `transition: all`
- `scale(0)`, ou entrada em fade puro sem transform inicial
- `ease-in` em qualquer interação de UI
- Duração de UI acima de 300 ms sem motivo declarado
- `transform-origin: center` em popover/menu/tooltip ancorado num gatilho
- Keyframes em algo disparado rapidamente
- Animação de propriedade de layout
- Variável CSS no pai dirigindo transform de filho
- `prefers-reduced-motion` ausente em qualquer movimento
- `:hover` com movimento sem gate de ponteiro
- Tudo entrando de uma vez onde cabia stagger de 30-80 ms
- **Duas seções entrando do mesmo jeito** (`motion-rules.md` regra 10)
- **`opacity: 0` inicial no CSS** em vez de estado inicial em JS: a página quebra sem JS
- **Objeto decorativo sem relação com o negócio** (regra 3 do SKILL.md)
- Efeito de assinatura num negócio que vende tempo e julgamento (clínica, advogado, contador): `fx-library.md` diz que não leva

---

## Hierarquia de correção

Ao propor conserto, prefira o movimento mais alto da lista:

1. **Apagar** a animação (frequência alta, sem propósito).
2. **Reduzir**: duração menor, transform menor, menos propriedades.
3. **Corrigir o easing**: `ease-in` vira `ease-out` ou curva forte.
4. **Corrigir origem/fisicalidade**: `transform-origin`, `scale(0)` vira `scale(0.95)` + opacidade.
5. **Tornar interrompível**: keyframes viram transition.
6. **Mover para a GPU**: propriedade de layout vira transform/opacity.
7. **Assimetria**: lentidão na fase deliberada, resposta rápida.
8. **Acabamento**: blur para mascarar crossfade, stagger, `@starting-style`.
9. **Acessibilidade e coesão**: reduced motion, gate de hover, ajuste à personalidade.

---

## Varreduras

Antes de julgar, mapeie. Comandos úteis em `sites/<slug>/`:

```bash
grep -rn "transition\|animation\|@keyframes" public/styles.css
grep -rn "transition: all\|ease-in\b\|scale(0)\|transform-origin" public/styles.css
grep -rn "prefers-reduced-motion\|hover: hover" public/styles.css
grep -rn "gsap\.\|ScrollTrigger\|scrub\|pin:" entry.js fx/
```

O que procurar em cada categoria: propósito e frequência · easing e duração · fisicalidade e origem · interrompibilidade · performance · acessibilidade · coesão e tokens (cinco cubic-beziers quase iguais é achado de consolidação) · oportunidades perdidas (estado que teleporta).

---

## Vetar o falso positivo

Releia o código citado antes de reportar. Rejeite o que for por desenho:

- `transform-origin: center` num **modal** está certo.
- Duração longa numa entrada de **seção** está certa: é a camada de assinatura, não UI.
- `linear` numa **barra de progresso** ou marquee está certo.
- `height` num **acordeão** é tolerado: não existe equivalente em transform.
- Movimento documentado no `plan.md` como decisão deliberada não se re-litiga. Anote, não reporte.

Nunca apresente achado que você não confirmou no arquivo e na linha.

---

## Formato de saída

Duas partes, nesta ordem.

### Parte 1: tabela de achados

Uma tabela markdown só. Uma linha por problema. Nunca lista com "Antes:/Depois:" em linhas separadas.

| Antes | Depois | Por quê |
|---|---|---|
| `transition: all 300ms` | `transition: transform 200ms var(--ease-out)` | `all` anima propriedade não intencional fora da GPU |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nada aparece do nada |
| `ease-in` no menu | `var(--ease-out)` | `ease-in` atrasa o instante que a pessoa está olhando |
| `:hover` sem gate | `@media (hover: hover) and (pointer: fine)` | No toque o card fica preso no estado hover depois do tap |

Cite `arquivo:linha`.

### Parte 2: veredito

Agrupe o resto por impacto, do maior para o menor, omitindo nível vazio:

1. Regressões de sensação (easing lento, aparece do nada, dispara em ação de alta frequência)
2. Simplificações perdidas (o que devia ser apagado ou muito reduzido)
3. Performance (propriedade fora da GPU, risco de frame perdido)
4. Interrompibilidade e tempo
5. Origem, fisicalidade e coesão
6. Acessibilidade

Feche com decisão explícita:

- **Bloqueia** se houver regressão de sensação, `scale(0)` ou `ease-in` em UI, animação fora da GPU com conserto fácil, `opacity: 0` inicial no CSS, ou efeito de assinatura num negócio que não leva.
- **Aprova** quando não houver regressão de sensação, nada óbvio a apagar, durações e curvas dentro dos limites, interrompibilidade resolvida e reduced motion respeitado.

Depois de corrigir, rode a QA de novo (`scripts/qa.mjs`) e pare. Uma passada de correção, uma reverificação.
