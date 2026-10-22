# Onde o movimento se justifica

Consolidado de `find-animation-opportunities`. Para ler no passo 2 do processo, quando se decide a moção da página.

**Premissa.** Às vezes a melhor animação é nenhuma. Um buscador de oportunidades que sugere movimento em todo canto é pior que inútil: produz exatamente a página lenta e sobre-animada que este arquivo existe para evitar. Isto é tanto um filtro quanto um buscador. **Espere rejeitar a maioria dos candidatos.**

Uma lista curta de alta convicção vale mais que um desejo longo.

**Teto.** No máximo 3 a 5 sugestões para um site inteiro. Ordenadas por alavancagem, não por quão divertidas seriam de construir.

---

## O portão: quatro perguntas, na ordem

Todo candidato tem que sobreviver às quatro. Registre a resposta, ela vai para o `plan.md`.

### 1. Frequência

| Quantas vezes o visitante vê | Veredito |
|---|---|
| Centenas por dia | **Rejeitado. Nunca anima.** |
| Dezenas por dia (hover de card, item de lista) | Rejeitado, ou só o quase imperceptível |
| Ocasional (menu mobile, acordeão do FAQ, modal) | Elegível, animação padrão |
| Raro / primeira vez (primeira dobra, confirmação de envio) | Elegível, é onde mora o encanto |

Num site de negócio local o visitante entra uma vez, rola, e clica no WhatsApp. Isso significa duas coisas em tensão: a **entrada** é barata porque ele a vê uma vez, e o **hover de card** é caro porque ele o encontra dezenas de vezes na mesma visita.

### 2. Propósito

Tem que ser uma destas palavras, nomeada explicitamente: **feedback**, **consistência espacial**, **indicação de estado**, **evitar salto brusco**, **explicação**, **encanto** (só no nível raro).

"Fica legal" não está na lista. Não conseguiu nomear, rejeite.

### 3. Velocidade

Cabe no orçamento? UI abaixo de 300 ms (`motion.md` seção 5). Se o momento só "funciona" como animação lenta e ostensiva, ele falhou no portão.

Exceção: a camada de assinatura tem o orçamento de `motion-rules.md`. Mas assinatura não é uma oportunidade avulsa, é a decisão única da página (ver abaixo).

### 4. Função

Decoração em cima de informação atrapalha. **Dado que a pessoa está lendo ou vai agir sobre não se mexe por estilo**: preço, horário, endereço, telefone, registro profissional, avaliação do Google. Um número que ainda está animando quando a pessoa tenta copiá-lo é defeito.

---

## O portão anterior a todos: a assinatura

Antes de procurar oportunidades pequenas, resolva a grande, e ela não é decidida por este arquivo e sim por `fx-library.md`:

- **Tem algo real para mostrar?** Comida, produto, buquê, um espaço que valha revelar, construído com as fotos reais do cliente. Então cabe um efeito de assinatura.
- **O negócio vende tempo e julgamento?** Clínica, médico, advogado, contador, terapeuta, consultor. **Não leva efeito nenhum.** A primeira tela é o retrato, a tipografia e o espaço.

Escrever "sem efeito de assinatura" no `plan.md` é resultado normal, frequente e correto.

Um objeto decorativo sem relação com o negócio é o erro que esta regra existe para impedir.

---

## Onde caçar

Cada item abaixo é uma classe conhecida de oportunidade legítima num site estático de negócio local.

**Buracos de feedback**
- Elemento clicável sem `:active` → `transform: scale(0.97)`, `transition: transform 160ms var(--ease-out)`
- Botão de WhatsApp, o principal alvo da página, sem retorno nenhum ao toque

**Estado que teleporta**
- Menu mobile que aparece de uma vez → escala do gatilho, `opacity: 0` + `scale(0.95)`, 200 ms
- Acordeão do FAQ que salta aberto → transição de altura e opacidade, 200 ms
- Conteúdo que troca instantaneamente (aba, filtro de serviços)

**História espacial ausente**
- Painel ou menu que aparece sem conexão com o que o abriu → `transform-origin` no gatilho
- Superfície que fecha por um caminho diferente do que entrou

**Entrada de grupo**
- Grade ou lista que aparece toda de uma vez numa seção que a pessoa vê uma vez → stagger de 30-80 ms

**O orçamento de encanto**
- Momentos raros e de emoção: a primeira dobra, a confirmação depois de enviar. É o único lugar onde bounce e um tempo mais generoso são bem-vindos.

Varreduras úteis:

```bash
grep -rn "onclick\|addEventListener" public/*.html entry.js | head -40
grep -rn "hidden\|aria-expanded\|<details" public/index.html
grep -rn ":active\|:hover\|:focus-visible" public/styles.css
```

---

## Formato de saída

### Parte 1: tabela de oportunidades

| # | Local | Hoje | Propósito | Frequência | Movimento sugerido |
|---|---|---|---|---|---|
| 1 | `index.html:118` menu mobile | Aparece instantâneo | Consistência espacial | Ocasional | `transform-origin: top right`, `opacity 0 → 1` + `scale(.95 → 1)`, 200 ms `var(--ease-out)` |
| 2 | `styles.css:240` `.btn-wa` | Sem estado de press | Feedback | Ocasional | `:active { transform: scale(0.97) }`, 160 ms `var(--ease-out)` |

Toda célula de "movimento sugerido" carrega valores exatos, tirados de `motion.md`, nunca aproximados. Só `transform` e `opacity`. Inclua o tratamento de reduced motion e, se envolver hover, o gate de ponteiro.

### Parte 2: rejeitados (obrigatório)

Liste 2 a 5 lugares que você considerou e deliberadamente **não** sugeriu, cada um com a pergunta do portão que o matou:

- Hover-scale nos cards de serviço. **Rejeitado: dezenas de vistas por rolagem; e `hover-scale em todo card` está na lista de AI tells do SKILL.md.**
- Contador animado na avaliação do Google. **Rejeitado: dado que a pessoa está lendo para decidir. Se usar, número tabular e dispara uma vez só.**
- Objeto 3D flutuante no hero da clínica. **Rejeitado: negócio sem produto não leva assinatura (`fx-library.md`).**

**Esta parte é o que separa este arquivo de uma lista de desejos.** Se estiver vazia, você não filtrou.

### Parte 3: veredito

Um parágrafo curto: quanto movimento esta página realmente precisa, se já está perto do certo, e qual única sugestão tem a maior alavancagem.

Se nada sobreviveu ao portão, diga isso claramente. É bom resultado, não falha.
