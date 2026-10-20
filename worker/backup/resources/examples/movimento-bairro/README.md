# Movimento do Bairro — exemplar de fitness

Prévia local fictícia para o estúdio de yoga e dança no Taquaral, Campinas. Sistema visual baseado em órbitas e formas de movimento, com azul profundo, coral, creme e verde. Tipografia grande, seções assimétricas e movimento contínuo suave. A experiência reduzida desativa animação; a página é útil sem JavaScript.

## Interação

Em **Seu próximo movimento**, intenção e frequência produzem uma sugestão exploratória. Mobilidade sugere **Yoga suave**; expressão sugere **Dança livre**; começar sugere **Alongamento**. O link prepara uma conversa de exemplo sobre aula experimental, sem indicar vaga, horário ou matrícula. Sem JavaScript, as três modalidades e a explicação permanecem acessíveis.

## Imagens e verdade

As duas fotografias são imagens de referência sob Pexels License, com crédito e ligação no rodapé e aviso junto às imagens. Elas não representam o espaço nem os equipamentos do negócio fictício. Nenhuma foto ou dado de cliente foi fabricado. Não há preço, horário, endereço completo, depoimentos ou promessas de saúde inventados.

## Revisão visual e QA

Inspecionei capturas completas de desktop e celular. As fotos carregam, o contraste dos textos principais está adequado, a hierarquia permanece legível e não há corte horizontal. O screenshot de 390 px mantém foto de abertura e avaliação em fluxo vertical. O QA local passou nos dois tamanhos, incluindo cenário `mobilidade` + `duas`, imagens, créditos, fallback sem JavaScript e ausência de erros de rede ou console. A regra `prefers-reduced-motion` retira animações e revelações.

**Autoavaliação: 8,8/10 como prévia fictícia.** A direção é distinta dos exemplares anteriores e a interação é coerente. O limite principal é a falta de fotos e informações reais do estúdio, que impedem uma página publicável sem validação.

Executar: `node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/movimento-bairro/public --brief frontstep/local-briefs/movimento-bairro.json --scenario frontstep/local-briefs/movimento-bairro.scenario.json --out frontstep/local-factory/examples/movimento-bairro/qa --json`
