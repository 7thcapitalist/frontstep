# Acessibilidade e UX: o portão

Consolidado das Web Interface Guidelines da Vercel (o conteúdo que a skill `web-design-guidelines` buscava por rede e que aqui está vendorizado) e da categoria de acessibilidade do `ui-ux-pro-max`.

**Por que está vendorizado.** A skill de origem tinha 1231 bytes e nenhuma regra: ela mandava buscar `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` via WebFetch a cada revisão. O worker não libera WebFetch, então ela nunca rodou em nenhum build. As regras abaixo são o conteúdo real daquele arquivo, baixado em 2026-09-29, adaptado de React/Next para HTML estático e pt-BR.

**O que foi cortado e por quê.** As regras de cópia em inglês da fonte (Title Case em títulos e botões, segunda pessoa, `&` no lugar de "and", numeral em vez de palavra) não se aplicam: a cópia aqui é pt-BR e quem manda nela é o `SKILL.md`. As regras de hidratação de React e de `nuqs` também saíram: não há React.

Este é o passo 6 do processo. **Corrija todo achado crítico e sério antes de terminar.**

---

## Saída

Agrupe por arquivo, use `arquivo:linha`, seja terso. Sacrifique a gramática pela brevidade, sinal alto e ruído baixo. Sem preâmbulo.

```text
## public/index.html

public/index.html:42 - botão só com ícone sem aria-label
public/index.html:118 - img sem width/height
public/index.html:203 - h2 depois de h4, hierarquia pula

## public/styles.css

public/styles.css:67 - transition: all, nomear propriedades
public/styles.css:210 - outline: none sem substituto de foco

## public/contato.html

✓ passa
```

---

## 1. Semântica e acessibilidade

- `<button>` para ação, `<a>` para navegação. **Nunca `<div onclick>`.**
- Botão só com ícone precisa de `aria-label`.
- Campo de formulário precisa de `<label>` ou `aria-label`.
- Elemento interativo customizado precisa de manipulador de teclado, não só de clique.
- `<img>` precisa de `alt`, ou `alt=""` se for puramente decorativa.
- Ícone decorativo ao lado de texto visível: `aria-hidden="true"`.
- Atualização assíncrona (toast, validação) num container com `aria-live="polite"`.
- HTML semântico antes de ARIA. `<button>`, `<a>`, `<label>`, `<nav>`, `<main>`, `<table>`.
- Títulos hierárquicos de `<h1>` a `<h6>`, **sem pular nível**. Um `<h1>` por página.
- Link de pular para o conteúdo principal.
- `scroll-margin-top` em âncora de título, igual à altura do header fixo.
- Mídia com significado precisa de legenda, transcrição ou descrição. Mídia decorativa fica escondida da árvore de acessibilidade.
- **Cor nunca é o único indicador.** Erro, sucesso e estado ativo levam ícone ou texto junto.
- Contraste: 4.5:1 no texto normal, 3:1 em texto grande (18px+) e em limite de componente.

## 2. Foco

- Todo interativo tem foco visível. Anel de 2 a 4px, com contraste próprio de 3:1.
- **Nunca `outline: none`** sem substituto.
- Use `:focus-visible`, não `:focus`, para não pintar o anel no clique de mouse.
- `:focus-within` em controle composto.
- **Header sticky, overlay e botão flutuante não podem cobrir o elemento com foco.** Neste site o botão fixo do WhatsApp é o suspeito habitual: teste navegando só de Tab até o rodapé.
- Ordem de tabulação bate com a ordem visual.
- Modal e menu: foco entra ao abrir, `Esc` fecha, foco volta ao gatilho.

## 3. Formulários

Ver também `ui-patterns.md` seção 6.

- Campo com `autocomplete` e `name` com significado.
- `type` correto (`email`, `tel`, `url`, `number`) e `inputmode`.
- **Nunca bloqueie colar.**
- Rótulo clicável (`for` ou envolvendo o controle).
- `spellcheck="false"` em e-mail, código e usuário.
- Checkbox e radio: rótulo e controle num alvo único, sem zona morta.
- Botão de envio segue habilitado até a requisição começar, depois spinner.
- Erro inline junto do campo; foco no primeiro erro ao enviar.
- Placeholder, quando existir, termina em `…` e mostra o formato esperado.
- Avise antes de sair com alteração não salva.
- Reaproveite informação já dada no mesmo processo.
- Autenticação, se houver, aceita gerenciador de senha e colar.

## 4. Animação

Ver `motion.md` e `motion-review.md` para os valores. O portão verifica:

- `prefers-reduced-motion` respeitado, com variante mais suave ou desligamento.
- Só `transform` e `opacity`.
- **Nunca `transition: all`**, nomeie as propriedades.
- `transform-origin` correto.
- SVG: transform no `<g>` com `transform-box: fill-box; transform-origin: center`.
- Animação interrompível, responde a input no meio.
- Movimento automático acima de 5s junto de outro conteúdo precisa de controle de pausar, parar ou esconder.
- Loop decorativo mudo para sob `prefers-reduced-motion`.
- Conteúdo que gira sozinho tem controle de pausa e para no foco.

## 5. Tipografia

- `…` e não `...`.
- Aspas tipográficas e não retas.
- Espaço inquebrável: `10&nbsp;MB`, `R$&nbsp;120`, nome de marca.
- Estado de carregamento termina em `…`.
- `font-variant-numeric: tabular-nums` em coluna de número, preço, horário e contador.
- `text-wrap: balance` ou `pretty` em título, para não deixar palavra órfã.

## 6. Conteúdo que varia

- Container de texto lida com conteúdo longo: `truncate`, `line-clamp` ou `overflow-wrap`.
- Filho de flex precisa de `min-width: 0` para truncar.
- Trate o vazio: não renderize UI quebrada para string ou lista vazia.
- Antecipe entrada curta, média e muito longa.

## 7. Imagens

- `width` e `height` explícitos, sempre. Previne CLS.
- `loading="lazy"` abaixo da dobra.
- `fetchpriority="high"` na imagem crítica do topo.

## 8. Performance

- Lista grande (acima de 50 itens): `content-visibility: auto` ou virtualização.
- Sem leitura de layout durante render (`getBoundingClientRect`, `offsetHeight`, `scrollTop`).
- Agrupe leituras e escritas de DOM, não intercale.
- `<link rel="preconnect">` para domínio de asset.
- Fonte crítica com `preload as="font"` e `font-display: swap`.
- `<video autoplay muted loop playsinline>` em vez de GIF animado, com still alternativo.

## 9. Navegação e estado

- Estado que importa vai para a URL: aba, filtro, painel aberto.
- Link usa `<a>`, para Cmd/Ctrl+clique e botão do meio funcionarem.
- Ação destrutiva precisa de confirmação ou janela de desfazer. Nunca imediata.

## 10. Toque

- `touch-action: manipulation`.
- `-webkit-tap-highlight-color` definido de propósito.
- `overscroll-behavior: contain` em modal e gaveta.
- Durante arrasto: desabilite seleção de texto.
- Gesto de arrastar, deslizar ou pinçar precisa de alternativa por clique e teclado.
- `autofocus` com parcimônia: só desktop, num campo principal. Evite no celular, abre o teclado sozinho.

## 11. Área segura e layout

- Layout de borda a borda usa `env(safe-area-inset-*)` por causa do notch.
- Sem barra de rolagem indesejada: conserte o conteúdo que transborda em vez de esconder com `overflow-x: hidden` por cima do problema.
- Flex e grid em vez de medição por JS.

## 12. Tema

- `color-scheme: dark` no `<html>` quando o tema é escuro. Sem isso a barra de rolagem e os campos nativos ficam claros.
- `<meta name="theme-color">` igual ao fundo da página.
- `<select>` nativo com `background-color` e `color` explícitos, senão some no modo escuro do Windows.

## 13. Localização

Os sites são pt-BR. O que importa aqui:

- Data e hora com `Intl.DateTimeFormat`, não formato fixo no código.
- Número e moeda com `Intl.NumberFormat`.
- Nome de marca e identificador com `translate="no"`, para a tradução automática do navegador não embaralhar.
- `<html lang="pt-BR">`.

## 14. Estados de hover

- Botão e link têm estado `hover`.
- Estado interativo **aumenta** o contraste: hover, active e focus mais proeminentes que o repouso, nunca menos.

---

## Antipadrões: sinalize na hora

- `user-scalable=no` ou `maximum-scale=1` desabilitando zoom
- `onpaste` com `preventDefault`
- `transition: all`
- `outline: none` sem substituto de `:focus-visible`
- `<div>` ou `<span>` com manipulador de clique onde cabia `<button>`
- Navegação por `onclick` sem `<a>`
- Imagem sem dimensão
- Campo sem rótulo
- Botão de ícone sem `aria-label`
- Data ou número com formato fixo no código
- `autofocus` sem justificativa
- GIF animado onde cabia vídeo comprimido
- Ação só por gesto, sem alternativa de clique e teclado
- Hierarquia de títulos pulando nível
- Header fixo cobrindo o elemento com foco

---

## Verificação manual mínima

O `scripts/qa.mjs` cobre transbordo, erro de console, link de WhatsApp, dimensão de imagem e peso. Estes quatro precisam de mão:

1. **Só teclado**: Tab do topo até o rodapé. Todo alvo é alcançável, o anel de foco é sempre visível, nada fica escondido atrás do header ou do botão do WhatsApp.
2. **Contraste**: cada par de texto e fundo, incluindo texto sobre foto e o rótulo dentro do CTA.
3. **`prefers-reduced-motion: reduce`** ligado no DevTools: a página continua completa e legível, sem pin, scrub nem marquee.
4. **Com JavaScript desligado**: o conteúdo está visível e os links do WhatsApp funcionam. Se algo sumir, o estado inicial está no CSS em vez de no JS.
