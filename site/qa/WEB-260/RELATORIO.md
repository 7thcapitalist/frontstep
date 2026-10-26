# WEB-260 — LCP mobile da vitrine

Lighthouse 13.5 mobile (simulado), prévia do Vercel via proxy autenticado, **mediana de 3 rodadas**
(`scripts/vitrine-lighthouse.mjs`, `LIGHTHOUSE_RUNS=3`).

| Prévia mobile | Antes (WEB-259) | Depois (WEB-260) | Meta |
|---|---:|---:|---:|
| Performance | 83 | **97** | — |
| LCP (mediana) | 3,80 s (3,96/3,80/3,38) | **2,06 s** (2,24/2,06/2,05) | < 2,5 s |
| Peso inicial | 1,34 MB | **0,57 MB** | ≤ 1,1 MB |
| CLS | ver JSON | ≤ 0,001 | — |

Produção no ar, medida nas mesmas rodadas: 3,15 s, 1,11 MB. Desktop: 0,98 s → 0,57 s.
Prova: `lighthouse-antes.json`, `lighthouse-depois.json`, `lighthouse-antes-depois.png`.

## O que pesava
1. O elemento do LCP era o `<video>` do hero: o vídeo mobile (876 kB) era baixado no `load`, virava
   blob e pintava depois. (O fix da WEB-253, que só baixava na primeira interação, nunca chegou na main.)
2. Depois disso o LCP virou o `h1`, escondido até o GSAP rodar (`yPercent:105`), ou seja, esperava o bundle.
3. O Lighthouse conta como dependência do LCP tudo o que termina antes do primeiro paint: bundle de
   139 kB, seis imagens abaixo da dobra e fontes vindas do Google (duas conexões extras).

## O que mudou
- Vídeo do hero só baixa na primeira interação (`wheel/touch/teclado/clique/rolagem`), o poster WebP
  continua com preload + `fetchpriority=high`.
- `h1` do hero estático: pinta no primeiro frame. Só os itens menores (`hero-meta`) entram com fade em CSS.
  Perde a subida das letras no h1; o resto da animação segue igual.
- Fontes Archivo e Onest (subset latin, woff2) servidas de `/fonts` com preload e `font-display: swap`;
  some a dependência do Google Fonts.
- `main.js` e as imagens abaixo da dobra (`data-src`) só começam depois do `first-contentful-paint`
  (com fallback em `load` e timer de 6 s). O poster dos vídeos de slot lê `data-src`.
- `vitrine-lighthouse.mjs` agora roda 3 vezes e reporta a mediana; `vitrine-lh-local.mjs` serve a pasta
  local para medir sem deploy (localhost distorce o LCP simulado; use `LATENCY_MS`).

Verificação funcional (Chromium, mobile 390 e desktop 1280, rolando a página): zero erro de console, zero 404,
todas as imagens carregadas, fontes aplicadas. `node --test site/tests/*.test.mjs` passa.
