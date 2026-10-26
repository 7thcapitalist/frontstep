# WEB-252 — hero curto e transição sem vazio

Chromium real em servidor local, com viewport m390 (390 × 844) e d1280 (1280 × 720).

## Resultado

| Critério | m390 | d1280 |
|---|---:|---:|
| Altura do hero | 1266 px = 150vh | 1080 px = 150vh |
| Primeiro conteúdo | começa em 150vh | começa em 150vh |
| Após 1 rolagem | faixa e manifesto visíveis | faixa e manifesto visíveis |
| Cena do manifesto | `clip-path: none`, imagem 390 px de largura | abertura cheia por regra global |

## Provas

- [m390 após 1 rolagem](./m390-apos-1-rolagem.png)
- [d1280 após 1 rolagem](./d1280-apos-1-rolagem.png)
- [m390, manifesto sem tela vazia](./m390-manifesto-sem-vazio.png)
- [medidas do navegador](./medidas.json)

## Verificação

```text
node --test site/tests/*.test.mjs
4 testes; 4 passaram; 0 falharam
```
