# WEB-253 — LCP e peso da vitrine

Chromium real (Playwright), viewport desktop 1280 × 720, servidor HTTP local e espera de 5 s após `load`. LCP e CLS foram coletados com `PerformanceObserver`; o peso soma os corpos das respostas, seguindo a metodologia de WEB-249.

## Resultado

| Critério | Antes (`hq/web-252`) | Depois (`hq/web-253`) | Meta |
|---|---:|---:|---:|
| LCP desktop | 628 ms | **168 ms** | < 2.500 ms |
| Transferência inicial | 1.923.410 bytes | **438.804 bytes** | < 2.000.000 bytes |
| CLS | 0,0062 | **0,0039** | < 0,05 |
| Requisições | 11 | **10** | — |

O ambiente local é mais rápido que a rede pública; a comparação controlada comprova que o caminho crítico deixou de baixar 1.484.726 bytes de vídeo. A margem de 1,56 MB protege a meta pública contra latência e variações de cabeçalhos.

## Mudança

O poster WebP de 45.280 bytes continua com preload e `fetchpriority="high"`. O MP4 desktop mantém `preload="none"` e agora só é baixado na primeira intenção do usuário (`wheel`, toque, teclado, clique ou rolagem), em vez de sempre depois de `load`.

## Verificação funcional

Antes da interação, o vídeo estava sem `currentSrc` e com `readyState = 0`. Após a primeira rolagem, os 1.484.726 bytes foram carregados, `readyState = 1` e a cena recebeu `film-on`.

```text
node --test site/tests/*.test.mjs
6 testes; 6 passaram; 0 falharam
```

Provas: [medidas](./medidas.json) e [hero desktop após interação](./desktop-apos-interacao.png).
