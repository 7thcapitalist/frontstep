# Imagem gerada: quando sim, quando não

Consolidado de `imagegen-frontend-web`.

> **A seção "Generated images" do `SKILL.md` manda.** Este arquivo não abre exceção, não amplia permissão e não cria caso novo. Onde parecer contradizer o `SKILL.md`, o `SKILL.md` ganha. Leia aquela seção primeiro; esta aqui só acrescenta o critério de direção de arte para os casos que ela já permite.

---

## O que sobreviveu da skill de origem, e o que não

`imagegen-frontend-web` foi escrita para outro trabalho: gerar **imagens de referência de design**, uma por seção, para um desenvolvedor recriar depois. A regra de saída dela é literalmente "gere uma imagem horizontal separada para cada seção; 8 seções, 8 imagens". Isso não é o que esta fábrica faz. Aqui as imagens que entram na página são as fotos reais do cliente, e a arte gerada é decoração ocasional.

**Descartado**: a regra de uma imagem por seção, os packs de 4/8/12 seções, os oito dials de direção de arte, a variação de escala de hero, o "spine narrativo", o "segundo momento de leitura" e toda a parte de comps de landing page. Nada disso tem endereço num build daqui.

**Sobreviveu**: o que fazer e não fazer quando uma imagem é de fato gerada.

---

## O portão

Antes de gerar qualquer coisa, responda as três, nesta ordem. Um "não" em qualquer uma encerra o assunto.

1. **Existe foto real que serve?** Se sim, use a foto. Arte gerada nunca substitui foto real, nunca preenche um slot destinado a uma.
2. **O nicho é regulado?** Saúde, jurídico e afins: **nenhuma cena gerada**. Nem consultório, nem atendimento, nem paciente, nem antes e depois. É a regra do CFM para publicidade médica, não questão de gosto.
3. **O visitante poderia ler isto como uma foto deste negócio?** Se poderia, não gere. O espaço dele, a equipe dele, os produtos dele, a comida dele, os resultados dele: tudo proibido.

**Nunca, em nenhuma circunstância**: pessoa (nenhuma, e muito menos o cliente), logo ou wordmark.

---

## O que é permitido

Fundo abstrato · textura · padrão · gradiente · divisor de seção · ilustração conceitual de uma ideia (uma área de atuação, uma etapa de um processo).

Sempre **visivelmente uma ilustração**, nunca fotográfica. Se o resultado sair parecendo foto, ele falhou no portão 3 e não entra.

---

## Direção de arte, quando gerar

O que a skill de origem tem de aproveitável é a lista de defaults a evitar. Geração de imagem colapsa sozinha nestes:

- gradiente roxo e azul de IA
- esfera, blob ou forma flutuante sem função
- brilho e borda neon
- glassmorphism empilhado sem motivo
- detalhe futurista aleatório sem estrutura
- ruído sobre-renderizado que esconde a composição
- arte de mood genérica no lugar de uma forma com propósito

Contra isso:

- **A arte usa a paleta da página**, os tokens já definidos no `plan.md`. Uma ilustração com cores próprias quebra a trava de acento de `direction.md`.
- **Estrutura antes de textura.** A forma tem que ter uma razão de composição: separar duas seções, ancorar um bloco de texto, dar peso a um lado vazio.
- **Discrição.** É fundo. Se competir com o conteúdo, está errada.
- Nada de texto dentro da imagem gerada. Texto na imagem não é selecionável, não é traduzível, não é lido por leitor de tela e fica borrado no retina.

---

## Alt text

Descreve **a arte**, nunca o negócio.

- Certo: `Ilustração abstrata em tons de lilás e dourado`
- Errado: `Recepção do consultório`

Alt que descreve o negócio transforma decoração em afirmação falsa sobre o cliente. É o mesmo erro de fabricar dado.

---

## Registro obrigatório

Toda imagem gerada entra no `plan.md` com três linhas: **o que é**, **onde vai**, e **por que uma foto real não era a resposta**.

Se a geração de imagem exigir credencial ou rede que o sandbox não dá: **não pare e não pergunte.** Escreva a página sem aquela imagem, redesenhe a seção para funcionar sem ela, e diga isso na saída final. O build é headless, ninguém vai responder.

---

## O caso mais comum

Na maior parte dos builds a resposta certa é **não gerar nada**. Um negócio local tem fotos reais, ou não tem, e quando não tem a solução é tipografia, cor e layout, não arte sintética preenchendo o vazio. Uma página que precisa de imagem gerada para não parecer vazia em geral tem um problema de layout, não de imagem.
