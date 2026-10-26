# WEB-254 — contraste, WhatsApp e hover do CTA

## Resultado

- Nav: texto `#EFEAE0` sobre fundo opaco `#0B0C10`, contraste calculado de **16,30:1** (WCAG AA exige 4,5:1).
- Mobile 390 × 844: o flutuante ocupa 52 × 52 px e recebe `wa-obscured` assim que a CTA final entra no viewport. Na captura, o topo do botão fica em 848,8 px para um viewport de 844 px: nenhuma sobreposição com o texto.
- Desktop: o rótulo muda de “Pedir minha prévia” para “Falar no WhatsApp”; a regra existe somente em `@media(hover:hover)`. Na captura, opacidades base/troca são 0/1.

## Evidências

- `m390-nav.png`: primeira dobra a 390 px, com barra opaca e nav legível.
- `m390-cta-sem-sobreposicao.png`: CTA final a 390 px sem o flutuante sobre o texto.
- `d1280-cta-hover.png`: estado de hover do CTA em desktop.
- `node --test site/tests/*.test.mjs`: 9 testes, 9 passaram, 0 falhas.

## Limites

As capturas foram feitas em Chromium headless local, com viewport declarado. Não houve deploy nem alteração de produção.
