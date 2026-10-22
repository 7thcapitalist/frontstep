# Motion: curva, duração, o que animar

Consolidado de `emil-design-eng`, `animate` (+RECIPES), `animation-vocabulary`, `improve-animations` (+AUDIT) e `apple-design`. Traduzido de React/Motion/Framer para o stack daqui: HTML estático, CSS, GSAP + Lenis bundlados por esbuild.

**Fronteira com `motion-rules.md`.** Os dois arquivos não se sobrepõem:
- `motion-rules.md` manda na **camada de assinatura**: pin, scrub, SplitText, marquee, galeria horizontal. Entradas de 0.8-1.4 s, eases da casa.
- Este arquivo manda na **camada de UI**: press, hover, foco, menu, acordeão, header, botão flutuante. Tudo abaixo de 300 ms.

Quando um número aqui contradiz `motion-rules.md`, é porque as duas camadas são diferentes, não porque uma está errada. Orçamento de UI nunca se aplica a um scrub; orçamento de scroll nunca se aplica a um botão.

---

## 1. O portão: isto deve animar?

Rode na ordem. Os dois primeiros passos existem para produzir zero linha de código às vezes. Isso é sucesso, não fuga.

### 1.1 Frequência

| Quantas vezes o visitante vê | Decisão |
|---|---|
| Centenas por dia (atalho de teclado, paleta de comando) | **Nunca anima.** Pare aqui. |
| Dezenas por dia (hover, navegação de lista) | Quase imperceptível, ou nada |
| Ocasional (modal, menu mobile, acordeão) | Animação padrão |
| Raro / primeira vez (entrada da página, confirmação) | É onde mora o orçamento de encanto |

Num site de negócio local quase tudo cai nas duas últimas linhas: o visitante vê a página uma vez. Isso libera a entrada, e **não** libera hover-scale em todo card, que ele encontra dezenas de vezes rolando.

Ação iniciada por teclado é desqualificação, não julgamento.

### 1.2 Propósito

Nomeie com uma destas palavras antes de continuar:

- **Feedback** — a interface ouviu o clique
- **Consistência espacial** — de onde veio, para onde foi
- **Indicação de estado** — deixar a mudança legível
- **Evitar salto brusco** — conteúdo que teleportaria
- **Explicação** — demonstrar algo (só hero/marketing)
- **Encanto** — só no nível raro/primeira vez

Não conseguiu nomear? Não construa. "Fica legal" num elemento visto com frequência é motivo para parar.

Teste extra de função: dado que o visitante está **lendo** não se mexe por estilo. Preço, horário, endereço, telefone, CRM. Um número que se anima enquanto a pessoa tenta copiar é um defeito.

---

## 2. Escolha da ferramenta, a mais barata que resolve

Desça a lista, pare na primeira que serve.

| Necessidade | Ferramenta |
|---|---|
| Hover, press, cor, um estado que você liga por classe | **CSS transition** |
| Entrada na montagem, sem JS | **CSS `@starting-style`** |
| Movimento predeterminado que precisa continuar liso enquanto a página carrega | **CSS animation** (roda fora da main thread) |
| Controle programático com performance de CSS, sem biblioteca | **WAAPI** (`element.animate()`) |
| Pin, scrub, SplitText, timeline encadeada | **GSAP** (já no bundle, ver `motion-rules.md`) |
| Seguir o ponteiro | **`gsap.quickTo`** |

CSS ganha de JS sob carga: animação CSS roda fora da main thread, `requestAnimationFrame` perde frames enquanto o browser carrega fontes e imagens. Use CSS para o que é predeterminado, GSAP para o que depende do scroll.

Não instale biblioteca para um fade.

---

## 3. Propriedades

- **Só `transform` e `opacity`.** Pulam layout e paint, rodam na GPU. `width`, `height`, `margin`, `padding`, `top`, `left` disparam os três estágios.
- **`clip-path` é a quarta sancionada** (reveals, wipes). `height` é tolerada só em acordeão, onde não existe equivalente em transform.
- **Nunca `scale(0)`.** Comece em `scale(0.95)` com `opacity: 0`. Nada no mundo real aparece do nada.
- **`transform-origin` no gatilho** para menu, popover, tooltip. Modal é exceção: não está ancorado em nada, fica centrado.
- **Porcentagem em `translate()`** é relativa ao próprio tamanho do elemento. `translateY(100%)` move pela própria altura, qualquer que seja o conteúdo. Prefira a pixel fixo.
- **`scale()` escala os filhos** (texto, ícone). Num press isso é o que faz parecer físico.
- **Nunca dirija o transform de um filho por variável CSS no pai.** Recalcula estilo de todos os filhos. Escreva `transform` direto no elemento.

```js
// ruim: recalcula em todos os filhos
el.parentNode.style.setProperty('--x', `${d}px`);
// bom
el.style.transform = `translateY(${d}px)`;
```

---

## 4. Easing

Ordem de decisão:

| Situação | Curva |
|---|---|
| Entrando ou saindo | `ease-out` |
| Movendo/transformando na tela | `ease-in-out` |
| Hover, mudança de cor | `ease` |
| Movimento constante (marquee, barra de progresso) | `linear` |
| Default | `ease-out` |

**Nunca `ease-in` em UI.** Começa devagar, atrasando exatamente o instante que a pessoa está olhando. `ease-out` a 200 ms *parece* mais rápido que `ease-in` a 200 ms.

As curvas embutidas do CSS são fracas demais para movimento deliberado. Use tokens:

```css
:root {
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);     /* UI entrando/saindo */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* movimento na tela */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* gaveta, estilo iOS */
}
```

Os eases da casa (`house` 0.7,0,0.2,1 e `settle` 0.16,1,0.3,1 em `motion-rules.md`) são para GSAP na camada de assinatura. Não misture os dois conjuntos no mesmo elemento.

Precisa de uma curva que não está aqui? Tire de easing.dev ou easings.co. Não invente à mão, e nunca escreva `cubic-bezier(0.4, 0, 0.2, 1)` só porque parece familiar.

---

## 5. Duração

| Elemento | Duração |
|---|---|
| Feedback de press | 100-160 ms |
| Tooltip, popover pequeno | 125-200 ms |
| Dropdown, select, menu mobile | 150-250 ms |
| Modal, gaveta | 200-500 ms |
| Entrada de seção, scroll, marketing | ver `motion-rules.md` (0.8-1.4 s) |

**UI fica abaixo de 300 ms.** Um dropdown de 180 ms parece mais responsivo que um de 400 ms.

Percepção de velocidade: um spinner mais rápido faz o carregamento parecer mais curto com o mesmo tempo real. Tooltip instantâneo depois do primeiro faz a barra inteira parecer rápida.

---

## 6. Interrupção e saída

- **Transition, não keyframes, para o que dispara rápido.** Transition retoma do valor atual; keyframes reinicia do zero. Vale para toast, toggle, qualquer coisa clicável duas vezes em um segundo.
- **Saia pelo caminho que entrou.** O que desliza de baixo sai por baixo. Caminho simétrico é o que torna óbvio como fechar.
- **Tempo assimétrico onde a pessoa decide.** Fase deliberada lenta (segurar para confirmar: 2 s linear), resposta do sistema rápida (soltar: 200 ms ease-out).
- **Nunca bloqueie input durante uma animação.** Stagger é decorativo: não pode travar clique enquanto roda.
- **Anime a partir do valor apresentado**, não do alvo lógico. Ao interromper, leia o transform que está na tela e comece dali, ou aparece um salto.

---

## 7. Reduced motion e ponteiro

Sai junto com a animação, sempre. Não é acabamento posterior.

```css
@media (prefers-reduced-motion: reduce) {
  .reveal { transition: opacity 200ms ease; transform: none; }
}

@media (hover: hover) and (pointer: fine) {
  .card:hover { transform: translateY(-2px); }
}
```

Duas regras diferentes por camada:

- **Camada de assinatura**: morre inteira. Sem Lenis, sem pin, sem scrub, sem marquee, sem cursor (`motion-rules.md` regra 8).
- **Camada quieta**: fica **mais suave, não zero**. Mantenha opacidade e cor, que ajudam a compreensão; tire deslocamento e posição.

Hover sem `@media (hover: hover)` dispara no toque e deixa o card grudado no estado hover depois do tap. É bug em celular, não detalhe.

Estado inicial escondido se define em JS, nunca `opacity: 0` no CSS. Sem JS a página tem que estar inteira visível.

---

## 8. Receitas

Curvas são os tokens da seção 4.

**Press** (qualquer coisa clicável)
```css
.btn { transition: transform 160ms var(--ease-out); }
.btn:active { transform: scale(0.97); }
```
Subtil: 0.95 a 0.98. Não precisa de gate de hover: `:active` é press real no toque.

**Menu mobile / dropdown**
```css
.menu {
  transform-origin: top right;          /* o gatilho, não o centro */
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.menu[hidden], .menu[data-closed] { opacity: 0; transform: scale(0.95); }
```

**Acordeão (FAQ)**
```css
.answer { overflow: hidden; transition: height 200ms var(--ease-out), opacity 200ms var(--ease-out); }
```
Curto, porque é das poucas que custa layout a cada frame. Meça a altura em JS; não anime para `auto`.

**Header ao rolar**
```css
.site-header { transition: background-color 200ms ease, box-shadow 200ms ease; }
```
Cor e sombra, não altura. Animar altura empurra a página inteira.

**Stagger de um grupo**
```css
.item { opacity: 0; transform: translateY(8px); animation: rise 300ms var(--ease-out) forwards; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
@keyframes rise { to { opacity: 1; transform: translateY(0); } }
```
Atraso entre itens: 30-80 ms. Mais que isso a página parece lenta.

**Reveal por clip-path** (preferido a fade puro, ver `motion-rules.md` regra 6)
```css
.reveal { clip-path: inset(0 0 100% 0); transition: clip-path 600ms var(--ease-in-out); }
.reveal[data-visible] { clip-path: inset(0 0 0 0); }
```
Dispare com `IntersectionObserver`, uma vez só. Re-animar a cada scroll é a interface brigando com o leitor.

**Segurar para confirmar** (ação destrutiva)
```css
.fill { clip-path: inset(0 100% 0 0); transition: clip-path 200ms var(--ease-out); }  /* soltar: rápido */
.btn:active .fill { clip-path: inset(0 0 0 0); transition: clip-path 2s linear; }     /* apertar: lento */
```
`linear` está certo aqui: é indicador de progresso, e progresso não tem ease.

**Crossfade que não assenta**: some `filter: blur(2px)` durante a transição. Sem blur o olho vê dois objetos se sobrepondo; com blur vira uma transformação só. Mantenha abaixo de 20 px, blur pesado é caro, sobretudo no Safari.

---

## 9. Física de gesto

De `apple-design`. **Raramente aplicável aqui**: um site estático de negócio local quase não tem superfície arrastável. Vale se algum dia entrar uma galeria com swipe.

- **Feedback no pointer-down, não no release.** Esperar o `click` para destacar parece morto.
- **Rastreio 1:1** com Pointer Events e `setPointerCapture`, respeitando o ponto onde a pessoa pegou. Saltar para o centro quebra a ilusão na hora.
- **Descarte por velocidade, não por distância.** `velocidade = |distância| / msDecorridos`; acima de ~0.11 dispensa. Um peteleco deve bastar.
- **Projete o ponto de parada** em vez de encaixar a partir do ponto de soltura:
  ```js
  const project = (v, d = 0.998) => (v / 1000) * d / (1 - d);
  ```
- **Rubber-banding nas bordas**: resistência crescente em vez de parede. Coisas reais desaceleram antes de parar.
- **Proteção multi-touch**: ignore dedos novos depois que o arrasto começou, senão o elemento salta.

---

## 10. Materiais e profundidade

De `apple-design`, adaptado. Usar com parcimônia: `backdrop-filter` é caro em celular.

- Header/overlay translúcido com `backdrop-filter: blur()` e fundo semitransparente, conteúdo rolando por baixo.
- **Só em elemento fixo ou sticky.** Blur em container que rola causa repaint contínuo e derruba o FPS no Android.
- **Nunca empilhe uma superfície translúcida clara sobre outra.** A legibilidade colapsa.
- Borda superior clara (`1px solid rgba(255,255,255,.4)`) lê como luz pegando no material.
- Texto sobre superfície translúcida não pode ser cinza claro: suba o contraste e o peso.
- Em vez de uma borda de 1 px sob o header sticky, prefira um gradiente/máscara curta onde o conteúdo encontra a barra.
- `@media (prefers-reduced-transparency: reduce)`: fundo sólido, `backdrop-filter: none`.

**Atenção de contexto**: `backdrop-filter` no header já causou um bug real num build (o header virou containing block do nav fixo e o menu mobile renderizou com altura zero). Se o nav for `position: fixed`, tire-o de dentro do `<header>`.

---

## 11. Tipografia em movimento e óptica

De `apple-design`, seção 15. Vale para o tipo estático também.

- **Tracking é específico do tamanho.** Display grande quer tracking negativo (`-0.02em`); corpo fica perto de `0`; texto pequeno aceita um pouco positivo. Um `letter-spacing` único para todos os tamanhos está errado em algum lugar.
- **Leading anda ao contrário do tamanho.** Apertado no título grande (`1.05`), folgado no corpo (`1.5-1.6`).
- **Hierarquia é peso + tamanho + leading juntos**, não só tamanho. Peso dá presença sem ocupar mais espaço.
- Espaçamento em `rem`/`em` para a página não quebrar quando a pessoa aumenta o texto do sistema.
- `font-optical-sizing: auto` quando a variável suportar.

---

## 12. Nunca entregue

Cada linha é bloqueio na revisão (`motion-review.md`).

| Nunca | Em vez disso |
|---|---|
| `transition: all` | Nomear as propriedades |
| `transform: scale(0)` na entrada | `scale(0.95)` + `opacity: 0` |
| `ease-in` em UI | `ease-out` ou curva forte |
| Built-in fraco em movimento deliberado | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Duração de UI acima de 300 ms sem motivo | 150-250 ms |
| `transform-origin: center` em popover ancorado | a origem no gatilho (modal é exceção) |
| Keyframes em coisa disparada rápido | CSS transition |
| Animar `width`/`height`/`margin`/`top`/`left` | `transform` / `opacity` |
| `:hover` com movimento sem gate | `@media (hover: hover) and (pointer: fine)` |
| Faltar `prefers-reduced-motion` | Variante mais suave, não zero |
| Tudo entrando ao mesmo tempo | stagger de 30-80 ms |
| Duas seções entrando igual | mudar uma (`motion-rules.md` regra 10) |
| `opacity: 0` inicial no CSS | estado inicial em JS |

---

## 13. Vocabulário

De `animation-vocabulary`. Serve para nomear com precisão no `plan.md` antes de construir. Só os termos que aparecem num site destes.

**Entradas e saídas** — Fade in/out · Slide in · Scale in · Pop in (com leve overshoot) · Reveal (por clip-path ou máscara) · Enter/Exit.

**Sequência** — Stagger (cascata com atraso curto) · Orchestration (várias animações cronometradas como um movimento só) · Delay · Duration · Fill mode.

**Transformações** — Translate · Scale · Rotate · Transform origin · **Origin-aware animation** (o elemento cresce do gatilho, não do próprio centro).

**Entre estados** — Crossfade · Morph · Layout animation · **Accordion/Collapse** · Continuity transition · Direction-aware transition.

**Scroll** — Scroll reveal · Scroll-driven animation · **Parallax** · View transition.

**Feedback** — Hover effect · **Press/tap feedback** · Hold to confirm · Swipe to dismiss · **Rubber-banding** · Shake/wiggle (erro) · Ripple.

**Easing** — Ease-out · Ease-in · Ease-in-out · Linear · Cubic-bezier · Asymmetric easing.

**Spring** — Spring · Stiffness · Damping · Mass · Bounce · **Momentum** · Velocity · **Interruptible animation**.

**Ambiente** — Marquee · Loop · Pulse · **Float** · Idle animation.

**Acabamento** — Blur · **Clip-path** · Mask · Line drawing (SVG que se desenha) · Skeleton/shimmer · **Number ticker** · **Tabular numbers** (dígitos de largura fixa, obrigatório em contador) · Typewriter.

**Performance** — FPS · **Jank** · Dropped frame · Compositing · `will-change` · **Layout thrashing**.

**Princípios** — Purposeful animation · Anticipation · Follow-through · **Perceived performance** · **Frequency of use** · Spatial consistency · Hardware acceleration · Reduced motion.

---

## 14. Quando o resultado depende de sensação

Há coisas que não dá para julgar lendo código: um crossfade, o par opacidade+altura numa lista que entra, o bounce de uma mola. Quando for o caso, diga no `plan.md` em vez de chutar um valor, e verifique assim:

- Rode a 2-5x a duração, ou no inspetor de animação do DevTools.
- Passe frame a frame para achar descompasso entre propriedades coordenadas.
- Olhe de novo no dia seguinte. Defeito invisível durante a construção aparece com olho descansado.
