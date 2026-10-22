# Direção criativa: paleta, tipografia, anti-template

Consolidado de `frontend-design`, `design-taste-frontend`, `high-end-visual-design` e `brandkit`. Traduzido para o stack daqui: HTML estático, CSS escrito à mão, sem React, sem Tailwind, sem biblioteca de componentes. Todo exemplo em classe utilitária das fontes virou CSS.

**Precedência.** O brief manda. Depois o `SKILL.md`. Depois este arquivo. Se uma regra aqui empurrar um look de casa sobre um negócio que não o comporta, a regra perdeu.

**Você roda headless.** Onde as fontes diziam "pergunte ao cliente" ou "confirme a direção", aqui você **decide e registra a decisão no `plan.md`**. Nunca pare para perguntar.

---

## 1. Ler o brief antes de desenhar

A maior parte do design ruim de LLM é o modelo pulando para uma estética default em vez de ler o que tem na frente. Antes de qualquer token, extraia:

1. **Que negócio é**: nicho, o que vende, se vende um produto que se vê ou o tempo de uma pessoa.
2. **Público**: quem vai chegar nesta página e com qual pergunta na cabeça.
3. **Palavras de vibe** que o cliente usou, se usou.
4. **Ativos de marca que já existem**: logo, cores, fotos. Não são opcionais, são matéria-prima. Se a logo tem cores reais, elas mandam na paleta.
5. **Restrições silenciosas**: saúde, jurídico, contabilidade e qualquer setor regulado sobrepõem preferência estética. Confiança primeiro.

Escreva no `plan.md`, em uma linha: **"Leio isto como: \<tipo de página> para \<público>, com linguagem \<vibe>, puxando para \<direção>."**

O setor, os materiais e o vocabulário do negócio são de onde vêm as escolhas visuais distintas. Uma padaria de bairro e um consultório de geriatria não podem sair parecidos.

---

## 2. Os três dials

Depois da leitura, fixe três valores e escreva-os no `plan.md`. Todas as decisões de layout, moção e densidade passam por eles.

- **VARIANCIA** (1 simétrico, 10 assimétrico)
- **MOCAO** (1 estático, 10 coreografado)
- **DENSIDADE** (1 galeria, 10 cockpit)

| Nicho | VARIANCIA | MOCAO | DENSIDADE |
|---|---|---|---|
| Restaurante, padaria, açaí, café, bar | 7-8 | 6-7 | 3-4 |
| Salão, estética, tatuagem, barbearia | 7-8 | 6-7 | 3 |
| Academia, oficina, reparo, obra | 6-7 | 5-6 | 4 |
| Clínica, médico, advogado, contador, psicólogo | **3-4** | **2-3** | 4-5 |
| Loja de produto com fotos boas | 7-8 | 6-7 | 4 |

Setor regulado desce os dials. Não é falta de ambição: é o que gera confiança no público que vai chegar ali.

**Moção declarada é moção entregue.** Se você escreveu MOCAO 6, a página tem que se mexer de verdade. Se não der para entregar movimento que funcione no escopo, baixe o dial para 3 e entregue uma página estática limpa. Nunca deixe moção meio construída: scroll cortado, entrada aos saltos, listener sem limpeza.

---

## 3. Tipografia

**Duas famílias no máximo**, self-hosted em woff2 a partir de `@fontsource-variable/<fonte>`. Isso não é preferência, é o build: o site não linka Google Fonts em produção e o orçamento de peso é 1.5 MB.

> **Armadilha herdada.** As skills de origem recomendam Geist, Clash Display, PP Editorial New, Satoshi, Cabinet Grotesk, ABC Diatype, Söhne. Geist está **banida** pelo `SKILL.md`. As outras em geral **não estão no fontsource** e várias não são licenciadas para uso livre. Antes de escolher, confirme que a família existe como pacote `@fontsource-variable`. Nome bonito que não instala vira fallback de sistema e derruba a página inteira.

**Banidas pelo `SKILL.md`**: Inter, Roboto, Space Grotesk, Geist, Instrument Serif. Acrescente Fraunces, a outra display serif favorita de LLM.

**Disciplina de serifa.** Serifa **não** é o default. "Parece criativo / premium / editorial" não é motivo. Esse reflexo é o tell mais testado em produção. Serifa só quando uma destas for verdade:

- o brief nomeia literalmente uma fonte serifada, ou
- a família estética é genuinamente editorial, patrimonial ou de luxo **e** você consegue articular por que aquela serifa serve àquela marca.

Para todo o resto, incluindo salão, estética, boutique e "premium", o default é **display sem serifa**. Sans display não é sem graça: é o default pelo mesmo motivo que preto é o default na moda.

**Ênfase dentro de um título** usa itálico ou peso da **mesma** família. Injetar uma palavra serifada num título sem serifa (ou o contrário) é amador.

**Escala e medida**
- Escala de tipo explícita, com pesos e espaçamentos intencionais.
- Linha abaixo de 80 caracteres. Serifa aguenta um pouco mais e pede mais entrelinha.
- Título grande: tracking negativo (`-0.02em`), leading apertado (`1.05-1.1`). Corpo: tracking `0`, leading `1.5-1.6`. Tracking único para todos os tamanhos está errado em algum lugar (ver `motion.md` seção 11).
- **Folga de descendente em itálico**: palavra em itálico com `y g j p q` em `line-height: 1` tem o rabo cortado. Mínimo `1.1` e uma reserva de `padding-bottom`.

**Tratamentos que denunciam página gerada** (de `frontend-design`, e o `SKILL.md` concorda):
- Acentuar uma única palavra do título em itálico, negrito ou outra cor.
- Caixa alta em rótulos.
- Rótulo tipográfico desnecessário acima do conteúdo.
- Título quebrado com `<br>` e a última linha em itálico como "jogada de design".
- Texto vertical rotacionado 90 graus.

---

## 4. Cor

- **Um acento, no máximo.** Saturação abaixo de 80% por default.
- **Trave o acento na página inteira.** Um site de cinza quente não ganha um CTA azul na seção 7. Um site com acento rosa não ganha um badge verde no rodapé. Escolha, trave, audite cada componente antes de entregar.
- **Uma paleta por projeto.** Não oscile entre cinzas quentes e frios.
- Sombra, quando usada, é tingida com o tom do fundo. Nunca preto puro sobre fundo claro.
- Sem preto puro (`#000000`) e sem branco puro em superfícies grandes. Off-black e off-white preservam profundidade.

### Paletas banidas como reflexo

Estas não são feias. São o que sai automaticamente, e por isso apagam a marca.

- **Creme + serifa + terracota.** Já está na lista de AI tells do `SKILL.md`. Famílias de hex concretas a evitar como fundo default: `#f5f1ea`, `#f7f5f1`, `#fbf8f1`, `#efeae0`, `#ece6db`, `#faf7f1`, `#e8dfcb`. Como acento: `#b08947`, `#b6553a`, `#9a2436`, `#9c6e2a`, `#bc7c3a`. Como texto: `#1a1714`, `#1a1814`.
- **Roxo de IA**, gradiente azul-para-roxo, brilho neon roxo.
- **Preto com verde-limão ácido.**
- Gradiente decorativo como enfeite sem função.

**Alternativas para girar** quando o brief pede "premium" e não nomeia cor: cinza-prata frio com fumê · verde-floresta com osso e âmbar · off-black com tan quente · azul cobalto com um neutro só · terracota com ardósia fria · oliva com tijolo · monocromático com um pop saturado (azul elétrico, esmeralda).

**Override.** Se o brief ou a logo trazem essas cores de verdade, use-as. O ban é contra o reflexo, não contra a cor. Quando o cliente nomeia as cores da logo, abra a logo com o Read e tire os valores reais dela, em vez de adivinhar pela palavra.

---

## 5. Layout

**Viés anti-centro.** Hero centralizado é evitado quando VARIANCIA > 4. Prefira divisão 50/50, conteúdo à esquerda com ativo à direita, ou assimetria de espaço em branco. Exceção: manifesto ou anúncio, onde a mensagem é o design.

**Regras duras. Falhar em qualquer uma é entregar trabalho quebrado.**

- **O hero cabe na primeira tela.** Título de no máximo 2 linhas no desktop, subtexto de no máximo 20 palavras e 4 linhas, CTA visível sem rolar. Se a cópia não cabe, diminua a escala ou corte a cópia. Título de 4 linhas é sempre erro de tamanho de fonte, nunca de comprimento de texto.
- **Padding superior do hero: no máximo `6rem` no desktop.** Mais que isso e o conteúdo flutua no meio da tela e lê como bug de layout.
- **Máximo 4 elementos de texto no hero**: eyebrow *ou* faixa de marca (zero ou um), título, subtexto, CTAs (1 principal + no máximo 1 secundário). Banidos no hero: tagline miúda abaixo dos CTAs, faixa de prova social, teaser de preço, lista de bullets, fileira de avatares. Tudo isso desce para uma seção própria logo abaixo.
- **Navegação em uma linha no desktop**, altura máxima 80px, default 64-72px. Duas linhas de nav é design quebrado.
- **Teto de zigzag: no máximo 2 seções seguidas** com o padrão imagem+texto alternado. A terceira consecutiva reprova.
- **Sem repetição de família de layout.** Uma vez usada uma família (três cards, citação full-width, divisão texto/imagem), ela aparece no máximo uma vez. Uma página de 8 seções usa pelo menos 4 famílias diferentes.
- **Teto mecânico de eyebrow.** Eyebrow é aquele rótulo pequeno em caixa alta com tracking largo acima do título de seção. O `SKILL.md` já bane "eyebrows em caixa alta sobre todo heading". Aqui o teto é contável: **no máximo `ceil(nº de seções / 3)`**, e o default é **zero**. Se a seção A tem eyebrow, as duas seguintes não têm. Conferência: conte as ocorrências de `text-transform: uppercase` com `letter-spacing` acima de títulos. Passou do teto, reprovou. O que fazer no lugar: nada. O título sozinho basta, e a posição da seção na página já a categoriza.
- **Ban de cabeçalho dividido.** "Título grande à esquerda + parágrafo explicativo pequeno à direita" como cabeçalho de seção é banido por default. Empilhe: título em cima, corpo abaixo com medida de 65ch. Só use a divisão quando a coluna direita carrega um visual real, não texto de enchimento.
- **Sem subtexto flutuando no canto superior direito** de um cabeçalho de seção. É o tell.
- **Grade tem exatamente tantas células quanto conteúdo.** 3 itens, 3 células. 5 itens, 5 células. Célula vazia no meio ou no fim significa que o planejamento estava errado: remodele a grade, não cole um bloco em branco.
- **Colapso mobile explícito por seção.** Para cada layout multi-coluna, declare a queda abaixo de 768px no mesmo lugar. Nada de "o CSS resolve".
- **Trave uma escala de raio de canto** para a página: tudo reto, tudo suave (12-16px), ou tudo pílula nos interativos. Sistema misto só com regra documentada e seguida em todo lugar. Botão redondo num layout quadrado é design quebrado.
- **Cards só quando a elevação comunica hierarquia real.** Caso contrário agrupe com uma linha superior, um divisor ou espaço negativo. Uma sombra igual sob cada bloco é o kit SaaS genérico.
- **`min-height: 100dvh`, nunca `100vh`** em seção de altura cheia. `100vh` salta quando a barra do Safari no iOS entra e sai.
- **Sem `z-index` arbitrário.** Reserve para camadas sistêmicas: header sticky, overlay, botão flutuante do WhatsApp. Documente a escala.

---

## 6. Estados e interação

LLM entrega só o estado de sucesso estático. Entregue o ciclo:

- **Carregando**: esqueleto com a forma do conteúdo final, não spinner circular genérico.
- **Vazio**: composto com cuidado, indicando o que fazer.
- **Erro**: claro, inline junto do campo.
- **Press**: `transform: scale(0.98)` ou `translateY(-1px)` no `:active`. Ver `motion.md`.

**Checagem de contraste de botão, obrigatória.** Antes de entregar, verifique que o texto do CTA é legível sobre o fundo dele. Botão branco com texto branco, botão transparente sobre a página sem borda, botão fantasma sobre foto sem scrim: todos banidos. Mínimo 4.5:1 (3:1 para texto grande, 18px+).

**O rótulo do CTA não quebra linha no desktop.** Se "AGENDAR UMA AVALIAÇÃO COMPLETA" quebra em 2 linhas, o botão está quebrado. Encurte o rótulo (máximo 3 palavras num CTA principal, idealmente 1-2) ou alargue o botão.

**Sem CTA duplicado de mesma intenção.** "Fale conosco" + "Entre em contato" + "Vamos conversar" na mesma página é a mesma intenção com três nomes. Escolha um rótulo e use-o no header, no corpo e no rodapé. Aqui a ação principal é sempre a mesma: WhatsApp.

---

## 7. Imagem e prova

Esta seção é subordinada à seção **Photos** do `SKILL.md`, que manda. O que sobrevive das fontes:

- **Uma página só de texto não é minimalismo, é trabalho incompleto.** Se o brief tem fotos reais utilizáveis, use-as.
- **Banido: screenshot falso feito de `<div>`.** Painel de produto fingido, lista de tarefas fingida, terminal fingido montado com retângulos estilizados é o tell número um de design de LLM.
- **Banido: ilustração SVG decorativa desenhada à mão** como default. Aceitável só como marca geométrica simples (um círculo, um monograma) quando o brief pede.
- **Banido: placeholder de stock.** `picsum.photos`, Unsplash e similares são stock, e o `SKILL.md` proíbe stock quando existe foto real do negócio. As fontes recomendam picsum; aqui não vale.
- **Banido: rótulo ou pill sobreposto na imagem** (`Prato · 02`, `Field notes`). Ou a imagem fala sozinha, ou a legenda vai abaixo dela, fora da foto.
- **Banido: legenda de crédito como decoração** (`Estudo nº 12 · Fulano`). Crédito só quando há fotógrafo real sendo creditado.
- **Parede de logos, quando existir, é só logo.** Sem rótulo de categoria embaixo de cada um. E fica **abaixo** do hero, nunca dentro dele.
- Quando não há foto usável para uma seção, **derrube a seção ou redesenhe-a para funcionar sem imagem**. Não entregue slot com `<!-- TODO -->`: ninguém vai ler, o build é headless.

---

## 8. Densidade de conteúdo

A página vive da primeira impressão. Corte sem dó.

- **Forma default por seção**: título de até 8 palavras + parágrafo de até 25 palavras + um visual **ou** um CTA. Mais que isso precisa de justificativa.
- **Sem seção de despejo de dados.** Tabela de 20 linhas, lista de 30 prêmios: layout errado. Use os 3-5 destaques com um link para o resto.
- **Lista longa pede outro componente, não uma lista mais longa.** Acima de 5 itens: grade de cards, acordeão, grupos de 2-3 com divisor esparso, ou rolagem horizontal com snap. Uma `<ul>` de 10 linhas com uma linha fina sob cada uma é a pior escolha default.
- **Sem `border-top` e `border-bottom` em toda linha** de uma lista longa. Escolha um e use com parcimônia.
- **Sem barra de progresso com trilha preenchida** como comparativo visual. É entulho de dashboard numa landing.
- **Citação com no máximo 3 linhas.** Atribuição com nome + papel, nunca só o primeiro nome. Aspas tipográficas de verdade, não `"` reto.

**Auditoria de cópia, obrigatória antes de entregar.** Releia toda string visível: título, subtítulo, rótulo de botão, corpo, legenda, alt, rodapé, mensagem de erro. Sinalize e reescreva o que for:

- gramaticalmente quebrado;
- com referente pouco claro;
- com cara de alucinação: trocadilho fofo mas errado, metáfora forçada;
- soando como LLM tentando parecer pensativo: humildade performática, rótulo de falso artesão, meta-poesia miúda.

Na dúvida se uma frase faz sentido, troque por uma frase funcional simples. Cópia fofa gerada é pior que cópia sem graça.

**Número falsamente preciso é sinalizado.** `92%`, `4.1x`, `5.8 mm` ou vêm de dado real do brief, ou não entram. Não fabrique precisão de engenharia que a marca não reivindica. Isso é a mesma regra de "dados reais apenas" do `SKILL.md`, dita em números.

**Um registro de voz por página.** Não misture mono técnico, prosa editorial e soco de marketing na mesma composição.

---

## 9. Escrita

Palavras aparecem num design por um motivo: facilitar o entendimento e o uso. São conteúdo, não decoração.

- Escreva da perspectiva de quem chega. Nomeie as coisas pelo que a pessoa entende.
- **Voz ativa.** O CTA diz exatamente o que acontece.
- Uma ação mantém o mesmo nome no fluxo inteiro.
- Erro e vazio são momentos de direção, não de humor. Erro explica o que houve e como resolver, e nunca pede desculpa nem é vago.
- Tom conversacional, verbos simples, frase corrente, sem enchimento.
- **Sem verbo de enchimento**: "elevar", "potencializar", "transformar", "soluções", "excelência", "compromisso", "inovador", "de ponta".
- **Sem nome genérico inventado**: Acme, Nexus, SmartFlow. Nesta fábrica os nomes são reais, vêm do brief.
- Travessão e meia-risca nunca como pontuação. Ponto, vírgula ou dois-pontos. Regra do `SKILL.md`. Em faixas numéricas use hífen.

---

## 10. Estratégia de marca

De `brandkit`. O resto daquela skill é sobre gerar imagens de board de identidade, coisa que esta fábrica não produz, e foi descartado.

Antes de escolher cor e forma, infira: categoria · público · função do produto · promessa emocional · nível de confiança exigido · metáfora central · o que a marca deve evitar.

O sistema visual se apoia em significado, não em gosto. Alguns mapeamentos de metáfora úteis para os nichos daqui:

| Categoria | Ideias centrais | Lógica de símbolo |
|---|---|---|
| Clínica, consultório | cuidado, vigilância, continuidade | caminho, escudo, horizonte, forma acolhedora |
| Jurídico, contábil | ordem, regra, proteção | selo, documento, coluna, marca monograma |
| Alimentação | ritual, material, calor | objeto, recorte de produto, textura |
| Oficina, reparo | controle, precisão, prazo | ferramenta, grade, eixo, marca modular |
| Estética, salão | taste, material, ritual | monograma, pétala, recipiente, marca tipográfica refinada |

**Tagline, quando houver**: curta e específica. Nada de slogan corporativo, sopa de buzzword ou inspiração falsa.

---

## 11. Um recurso ousado por página

Gaste a ousadia num lugar só. Deixe um elemento ser a coisa memorável e mantenha tudo em volta quieto e disciplinado. Corte a decoração que não serve ao brief.

Conselho da Chanel, que resume a seção inteira: antes de sair de casa, olhe no espelho e tire um acessório.

Construa até um piso de qualidade sem anunciá-lo: responsivo até o celular, foco de teclado visível, reduced motion respeitado, paleta harmônica, contraste que passa.

**Recursos disponíveis, nenhum default.** Nenhum destes dispara sozinho. São ferramentas para quando a leitura do brief pedir:

- **Vidro fosco / glassmorphism**: consumidor premium, marca de luxo, sobreposição de mídia. Inadequado em setor público e "B2B sem graça". Se usar, vá além do `backdrop-filter`: borda interna de 1px e sombra interna sutil. Fallback sólido sob `prefers-reduced-transparency`. Só em elemento fixo ou sticky (ver `motion.md` seção 10).
- **Encaixe duplo** (invólucro externo com borda fina e raio grande, núcleo interno com raio menor calculado): um recurso deliberado para um ou dois blocos, **não** o default para todo container. A fonte original manda aplicar em tudo; isso contradiz a disciplina de card acima, e a disciplina ganha.
- **Marquee**: no máximo **um por página**. Dois ou mais lê como enchimento.
- **Textura de grão**: só em pseudo-elemento fixo com `pointer-events: none`. Nunca em container que rola.

---

## 12. Tells que reprovam

A lista do `SKILL.md` vale integralmente. Estes acrescentam:

**Topo da página**
- Selo de versão no hero (`BETA`, `V2.0`, `ACESSO ANTECIPADO`), a menos que o brief seja um lançamento.
- Sub-eyebrow de micro-meta (`Marca · Nº 01 · O modelo`).
- Faixa de texto decorativa no pé do hero (`MARCA. MOVIMENTO. ESPAÇO.`).
- Pista de rolagem: `Scroll`, `↓ role`, ícone de mouse animado. Quem ainda não rolou está olhando o hero e sabe o que é rolar.

**Rótulos e separadores**
- Eyebrow numerada (`00 / ÍNDICE`, `001 · Serviços`, `06 · como funciona`). O eyebrow nomeia, não enumera.
- Paginação `01 / 4` em imagem ou célula de grade. Se dá para contar, não precisa de rótulo.
- Ponto médio (`·`) como separador default de tudo. No máximo um por linha em faixa de metadados.
- Bolinha colorida decorativa antes de cada item de nav, badge ou linha de lista. Só quando indica estado semântico real.
- Rótulo poético em seção de citação ou blog (`Do campo`, `Notas de campo`, `Na bancada`). Lê como artesão performático.
- Micro-frase abaixo do eyebrow explicando a seção. Eyebrow + título + corpo basta.
- Rótulo genérico de etapa: `Etapa 1 / Etapa 2`, `Fase 01`. O conteúdo da etapa é o rótulo.

**Conteúdo**
- Faixa de local, hora ou clima (`Goiânia 14:23 · 28°C`) fora de um negócio genuinamente ligado a lugar ou fuso.
- Rodapé de versão (`v1.4.2`, `Build 0048`) numa página de marketing.
- Contador de estoque ao vivo como decoração.
- `Silenciosamente usado por` / `Discretamente confiado por` como cabeçalho de prova social.
- Nome genérico de pessoa em depoimento. Aqui não se inventa depoimento: ou é real do brief, ou a seção não existe.
- Linhas de grade ou crosshair desenhadas só para "parecer projetado".

**Visual**
- Brilho neon ou glow externo por default.
- Acento supersaturado.
- Texto em gradiente em título grande.
- Cursor customizado. Datado, hostil à acessibilidade e à performance.
- H1 gigante que só grita. Hierarquia se controla com peso e cor, não só com escala bruta.
- Três cards de feature idênticos lado a lado.
- Emoji como ícone.

**Ícones**: uma família só, uma espessura de traço só, SVG inline, `aria-hidden="true"` quando decorativo. As fontes mandam instalar `@phosphor-icons/react` ou similar; aqui não há framework nem orçamento para isso, então o SVG vem inline, copiado de uma família só. O que continua valendo: **não improvise paths à mão** e não misture duas famílias na mesma página.

---

## 13. Pré-voo

Rode antes de declarar a página pronta. Se uma caixa não pode ser marcada honestamente, a página não está pronta.

- [ ] Leitura do brief declarada no `plan.md`, em uma linha
- [ ] Dials explícitos e derivados do brief, não o baseline silencioso
- [ ] **Zero travessão e meia-risca** em qualquer texto visível
- [ ] Um tema para a página inteira: nenhuma seção inverte claro/escuro no meio da rolagem
- [ ] Um acento só, idêntico em todas as seções
- [ ] Uma escala de raio de canto, aplicada consistentemente
- [ ] Texto de todo CTA legível sobre o fundo dele, mínimo 4.5:1
- [ ] Nenhum rótulo de CTA quebrando em 2 linhas no desktop
- [ ] Nenhum CTA duplicado de mesma intenção
- [ ] Se há serifa, ela é justificada e não é Fraunces nem Instrument Serif
- [ ] Toda fonte escolhida existe como pacote `@fontsource-variable` e está self-hosted
- [ ] Nenhuma fonte da lista banida do `SKILL.md`
- [ ] Palavra em itálico com descendente tem folga de leading e reserva de padding
- [ ] Hero cabe na primeira tela: título ≤ 2 linhas, subtexto ≤ 20 palavras, CTA visível sem rolar
- [ ] Padding superior do hero ≤ 6rem no desktop
- [ ] Máximo 4 elementos de texto no hero
- [ ] **Contagem de eyebrow ≤ ceil(seções / 3)**, default zero
- [ ] Nenhum cabeçalho de seção com título à esquerda e parágrafo pequeno à direita
- [ ] No máximo 2 seções consecutivas com imagem+texto dividido
- [ ] Pelo menos 4 famílias de layout diferentes numa página de 8 seções
- [ ] Grade com exatamente tantas células quanto conteúdo, nenhuma vazia
- [ ] Nenhum screenshot falso de `<div>`, nenhuma ilustração SVG decorativa à mão, nenhum placeholder de stock
- [ ] Nenhum rótulo sobreposto em imagem, nenhuma legenda de crédito decorativa
- [ ] Parede de logos, se existir, só com logos e abaixo do hero
- [ ] Nenhum rodapé de versão, faixa de local/clima ou pista de rolagem
- [ ] Nenhuma eyebrow numerada, nenhuma bolinha decorativa
- [ ] Auditoria de cópia feita: nenhuma frase quebrada ou alucinada
- [ ] Nenhum número falsamente preciso sem origem no brief
- [ ] Citações com no máximo 3 linhas e atribuição completa
- [ ] Listas acima de 5 itens usam o componente certo
- [ ] No máximo um marquee
- [ ] Colapso mobile declarado por seção multi-coluna
- [ ] `min-height: 100dvh`, nunca `100vh`
- [ ] Uma família de ícones, uma espessura, SVG inline
- [ ] Estados de carregando, vazio e erro existem onde fazem sentido
- [ ] Nenhum tell da seção 12 nem da lista do `SKILL.md`
