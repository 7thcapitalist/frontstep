# Padrões de interface e layout

Consolidado de `ui-ux-pro-max` (`SKILL.md`, `references/quick-reference.md`, `references/pro-rules.md`). As regras de acessibilidade daquela skill foram para `accessibility.md`; as de animação, para `motion.md`. Aqui ficam estrutura, layout, formulário, navegação, tipografia e cor aplicada.

**Escopo.** `pro-rules.md` da origem é escopo nativo/mobile: safe areas de notch, ripple do Material, Dynamic Type, 48dp do Android. Nada disso se aplica a um site estático. Sobreviveu só o que tem tradução real para web: alvo de toque, paridade de contraste entre temas e disciplina de ícone.

---

## A ferramenta: `search.py`

Esta é a única das skills absorvidas que trazia código fazendo trabalho de verdade. Foi copiada inteira para cá, com os dados.

```bash
python3 references/scripts/ui-ux-pro-max/scripts/search.py "<consulta>" --design-system -p "<Nome do Negócio>" --variance 7 --motion 6 --density 3
```

Rode a partir da raiz da skill (`~/.claude/skills/frontstep-coder`). Requer Python 3, sem dependência externa. Se `python3` não existir, tente `python`.

Busca focada em vez de sistema inteiro:

```bash
python3 references/scripts/ui-ux-pro-max/scripts/search.py "<palavras>" --domain <dominio> -n 5
```

Domínios: `ux`, `style`, `color`, `typography`, `google-fonts`, `landing`, `product`, `icons`, `chart`, `gsap`, `react`, `web`.

**Consulte em inglês.** O dataset é todo em inglês e a busca é lexical, não semântica. `"padaria bairro artesanal"` devolve **0 resultados**; `"bakery warm artisan food"` devolve a linha certa. Traduza os termos antes de consultar, senão você vai concluir que não há dado quando há.

**Como consultar bem**
- Uma intenção dominante por consulta, 2 a 5 termos com significado, em inglês. `"geriatric clinic calm trust"`, não uma auditoria inteira.
- Passe `--domain` explicitamente. A autodetecção erra em termos ambíguos ("font" cai em `typography` e em `google-fonts`).
- Resultado vazio ou fora do assunto: **tente uma vez** com consulta mais estreita. Falhou de novo, diga que não houve correspondência e siga com os defaults deste arquivo, rotulando como fallback. Nunca apresente busca de 0 resultados como se tivesse retornado dado.

**O que os dials fazem**: `--variance` vai de centrado/minimal a ousado/assimétrico; `--motion` anexa um snippet GSAP do nível; `--density` sobrescreve a escala de espaçamento. Use os mesmos valores que você declarou em `direction.md` seção 2.

**Cuidado, e este é o ponto principal.** O resultado é **ponto de partida, nunca lei**. Se ele propõe uma paleta e o cliente nomeou as cores dele, ou a logo tem valores reais, o cliente ganha.

Duas armadilhas medidas, não supostas:

- Muitas consultas devolvem `#2563EB` como primária. É o azul genérico de SaaS, e usá-lo sem pensar é o tell que `direction.md` bane.
- `--domain color` para padaria devolve fundo `#FEF3C7` com primária `#92400E`: creme quente com marrom, ou seja, **exatamente a família de paleta banida** na seção 4 de `direction.md`. O dataset otimiza para o que é comum, e o que é comum é o default. Quando a sugestão cair numa família banida, descarte-a e gire para outra. Não é sinal de que o ban está errado, é o ban funcionando.

Os domínios `react`, `web` e os stacks de framework não servem aqui: o build é estático, sem framework.

Não use `--persist`: ele escreve uma pasta `design-system/` no diretório de saída, e o plano deste projeto mora no `plan.md`.

---

## 1. Layout e responsivo

- **Mobile-first a 390px.** Desktop é a adaptação, não o contrário.
- Breakpoints sistemáticos: 390 / 768 / 1024 / 1440. Não invente um quinto no meio do build.
- `<meta name="viewport" content="width=device-width, initial-scale=1">`. **Nunca** `user-scalable=no` nem `maximum-scale=1`.
- **Sem rolagem horizontal em nenhuma largura.** É o defeito número um que a QA pega. Causa comum: um elemento com largura fixa maior que a viewport, ou uma grade sem `min-width: 0` nos filhos.
- Escala de espaçamento em incrementos de 4 ou 8px. Sem valores aleatórios.
- Largura máxima consistente no desktop, com o container centralizado.
- Corpo com no mínimo 16px no celular. Abaixo disso o iOS dá zoom automático no foco de campo.
- Comprimento de linha: 35-60 caracteres no celular, 60-75 no desktop.
- Elemento fixo (header, botão do WhatsApp) reserva padding equivalente no conteúdo, senão ele esconde a última seção.
- Evite região de rolagem aninhada: atrapalha a rolagem principal.
- Conteúdo essencial primeiro no celular. O secundário desce ou vira acordeão.
- Hierarquia por tamanho, espaço e contraste, **não por cor sozinha**.

**Texto que transborda**
- Container de texto lida com conteúdo longo: `overflow-wrap: anywhere` em URL, e-mail e conteúdo do cliente. Não aplique `word-break: break-all` em prosa normal.
- Filho de flex precisa de `min-width: 0` para poder truncar.
- Prefira quebrar a truncar. Se truncar, deixe o texto completo acessível.
- Título curto ganha `text-wrap: balance` para não deixar palavra órfã.

---

## 2. Toque e interação

- **Alvo mínimo.** O piso absoluto da WCAG 2.2 AA para ponteiro na web é 24×24px. Num site que é primeiro de celular isso é baixo demais para o que importa: **use 44×44px em CTAs, itens de nav e no botão do WhatsApp.** As duas regras não brigam, 44 satisfaz 24.
- Espaço mínimo de 8px entre alvos de toque.
- **Nunca dependa de hover** para uma interação principal. No celular hover não existe, e no tap ele fica grudado.
- `touch-action: manipulation` nos interativos, para tirar o atraso de 300ms do duplo-tap.
- `-webkit-tap-highlight-color` definido de propósito, não herdado.
- `cursor: pointer` em tudo que é clicável.
- Sem swipe horizontal no conteúdo principal: conflita com o gesto de voltar do sistema.
- Retorno visual em até 100ms do toque. Ver `motion.md` seção 8.

---

## 3. Tipografia aplicada

A direção tipográfica está em `direction.md`. Aqui os valores mecânicos:

- `line-height` 1.5 a 1.75 no corpo.
- Escala de tipo consistente e declarada (por exemplo 12 / 14 / 16 / 18 / 24 / 32 / 48).
- Peso reforça hierarquia: título 600-700, corpo 400, rótulo 500.
- Texto escuro sobre fundo claro para o corpo. Cinza sobre cinza não passa.
- **Números tabulares** (`font-variant-numeric: tabular-nums`) em preço, horário, contador e coluna de dados. Sem isso os dígitos dançam quando mudam.
- `…` de verdade, não `...`.
- Aspas tipográficas, não retas.
- Espaço inquebrável em unidades e nomes: `10&nbsp;km`, `R$&nbsp;120`.

---

## 4. Cor aplicada

- **Tokens semânticos**, não hex cru espalhado nos componentes. Defina em `:root` e referencie.
- Par frente/fundo com no mínimo 4.5:1 no corpo, 3:1 em texto grande (18px+) e em limite de componente.
- Cor funcional (erro vermelho, sucesso verde) sempre acompanhada de ícone ou texto. Cor sozinha não carrega significado.
- Se a página tiver tema escuro, ele é **variante tonal dessaturada**, não a paleta invertida, e o contraste se verifica separadamente. `color-scheme: dark` no `<html>` para a barra de rolagem e os campos nativos acompanharem.
- `<meta name="theme-color">` batendo com o fundo da página.

Tema escuro **não é obrigatório** aqui. A origem exige modo duplo em toda página de consumidor; para um one-pager de negócio local com paleta de marca fixa isso dobra a superfície de QA sem o brief pedir. Se escolher escuro, trave: nenhuma seção inverte no meio da rolagem.

---

## 5. Navegação

- Estado ativo visível no item de nav correspondente à seção atual.
- Posição da navegação igual em todas as páginas do site.
- Em site de várias páginas, navegação principal alcançável de qualquer página interna.
- Âncora de seção com `scroll-margin-top` igual à altura do header fixo, senão o título fica escondido atrás dele.
- Menu mobile: foco vai para dentro ao abrir, `Esc` fecha, foco volta para o botão que abriu.
- Ação destrutiva ou secundária separada visualmente dos itens normais de nav.
- Acima de 3 níveis de hierarquia, breadcrumb.

**Bug real já visto nesta fábrica**: `backdrop-filter` no `<header>` transforma o header em containing block de um `nav` com `position: fixed`, e o menu mobile renderiza com altura zero mesmo com o ARIA correto. Se o nav é fixo, tire-o de dentro do `<header>`.

---

## 6. Formulários

A maioria dos sites daqui não tem formulário: a ação é o WhatsApp, e em nicho de saúde formulário que coleta dado de saúde é problema de LGPD. Quando houver um:

- **Rótulo visível por campo.** Placeholder não é rótulo, nunca.
- Rótulo clicável, associado por `for`/`id`.
- `type` correto (`email`, `tel`, `url`) e `inputmode`, para o teclado certo aparecer no celular.
- `autocomplete` e `name` com significado, para o preenchimento automático funcionar.
- **Nunca bloqueie colar.**
- `spellcheck="false"` em e-mail, código e usuário.
- Checkbox e radio: rótulo e controle no mesmo alvo de clique, sem zona morta.
- Campo obrigatório marcado.
- Texto de ajuda persistente abaixo do campo complexo, não só no placeholder.
- **Validação no blur**, não a cada tecla.
- Erro inline abaixo do campo, ligado por `aria-describedby`, dizendo a causa e como resolver. Não só "Inválido".
- Falha com vários erros: foco no resumo no topo, com link para cada campo, e os erros inline permanecem.
- Botão de envio segue habilitado até a requisição começar, depois mostra spinner.
- Estado de sucesso confirmado visivelmente.
- Altura mínima de 44px nos campos.
- Erro e sucesso também passam 4.5:1.

---

## 7. Estados

- **Vazio**: mensagem útil e o próximo passo, nunca uma tela em branco.
- **Carregando** acima de 1s: esqueleto com a forma do conteúdo, não spinner indefinido.
- **Desabilitado**: opacidade reduzida, cursor diferente e o atributo semântico. Não basta parecer desabilitado.
- **Erro**: caminho de recuperação explícito.
- Toast, se houver: dispensa automática em 3 a 5s, `aria-live="polite"`, sem roubar o foco.

---

## 8. Performance

Complementa o orçamento do `SKILL.md` (1.5 MB, LCP abaixo de 2.5s):

- Imagem em AVIF/WebP, com `srcset` e `sizes`.
- **`width` e `height` explícitos em toda `<img>`**, ou `aspect-ratio`. É a causa mais comum de CLS.
- `loading="lazy"` abaixo da dobra; `fetchpriority="high"` na imagem do hero.
- `font-display: swap` e espaço reservado, para não ter texto invisível nem salto.
- Pré-carregue só as fontes críticas. `preload` em toda variante é contraproducente.
- `<link rel="preconnect">` para domínio de asset externo, se houver.
- Script de terceiro com `async`/`defer`. Auditar e remover o que não presta serviço.
- Reserve espaço para qualquer conteúdo que chega depois.
- Não intercale leitura e escrita de DOM no mesmo frame.
- Orçamento de 16ms por frame para 60fps.
- Prefira `<video autoplay muted loop playsinline>` a GIF animado, com um still como alternativa.

---

## 9. Gráficos e dados

Raro aqui. Se aparecer: legenda visível perto do gráfico · rótulo de eixo com unidade · alternativa em texto ou tabela, porque gráfico sozinho não é legível por leitor de tela · nunca só cor para distinguir séries, acrescente padrão ou forma · dado legível de imediato, animação de entrada respeita reduced motion · linha ou barra com 3:1 contra o fundo, rótulo com 4.5:1 · nada de pizza acima de 5 categorias.

---

## 10. Antes de entregar

- [ ] Sem rolagem horizontal a 390, 768, 1024 e 1440
- [ ] Todo alvo de toque principal com 44×44px, piso de 24×24
- [ ] Corpo com 16px ou mais no celular
- [ ] Toda `<img>` com `width` e `height`, formato moderno, lazy abaixo da dobra
- [ ] Tokens de cor semânticos em `:root`, sem hex cru espalhado
- [ ] Número tabular em preço, horário e contador
- [ ] Conteúdo não fica escondido atrás de header ou botão fixo
- [ ] Âncora de seção com `scroll-margin-top`
- [ ] Menu mobile abre, fecha no `Esc` e devolve o foco
- [ ] Formulário, se houver, com rótulo visível, `type` certo, erro inline e colar liberado
- [ ] Estado vazio, de carregamento e de erro existem onde fazem sentido
- [ ] Escala de espaçamento em múltiplos de 4 ou 8
- [ ] Nenhuma interação essencial dependente de hover
