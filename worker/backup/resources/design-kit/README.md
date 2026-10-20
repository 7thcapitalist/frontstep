# Fontes de design usadas pelo agente local

As sete skills adicionais de movimento estão integradas às fases do builder, com cópias completas e hashes por job. A pesquisa original, commits e conflitos estão em [MOTION-SKILLS-RESEARCH.md](MOTION-SKILLS-RESEARCH.md).

O contrato operacional das dez skills pedidas pelo usuário está em [BUILDER-AGENT.md](BUILDER-AGENT.md), com o [padrão visual](QUALITY-BAR.md) adotado após inspecionar exemplares reais da fábrica. Os dez `SKILL.md` estão fixados em `skills/`; cada job recebe cópias locais e instruções de fase explícitas. As duas skills de React são condicionais, pois o builder local padrão gera HTML/CSS/JS sem React. O job não instala pacotes nem busca skills na rede.

Consulta em 16/10/2026 via API do GitHub. Estrelas são sinal de adoção, não prova de qualidade. O builder usa arquivos fixados localmente para que o resultado não mude quando o upstream mudar.

| Fonte | Estrelas observadas | Versão fixada | Uso no job |
|---|---:|---|---|
| [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | 181.469 | repo `dbd4588f9e1033efb41dad4bef2f7947c8993d44`, arquivo `a5333457c414d20d625f307df945842c0952ecc3` | Direção visual específica do negócio, composição, tipografia e texto |
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 136.379 | repo consultado `56ea9cf174ed86786187daa9de0e6247cb0747e4`; motor de busca recuperado no snapshot `builder/` | Pesquisa local de padrões e paleta; recomendações são candidatas, não decisões |
| [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | 32.506 | repo `063bee94c3f4df8453406c830b0a7df0f2860278`, skill `ceae92ab319216a68274168fba9b63b998b65997` | Origem da skill de revisão; o texto de regras vem do projeto abaixo |
| [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) | 994 | repo `434b7f91364665f2f733b310ec54809bf8f37937`, arquivo `3eb3a212b7b89493922ea418489d4c6f67ae8bd5` | Checklist local de semântica, estados, formulários, foco e responsividade |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | sem usar estrelas como critério de aprovação | `f624f37a8c650b9cc550253104925efe4c8de246` | `design-taste-frontend`, `high-end-visual-design` e `redesign-existing-projects`; direções sorteadas localmente, texto, imagem e crítica |

`anthropic-frontend-design.md` é cópia da skill Apache 2.0; termos em `ANTHROPIC-LICENSE.txt`. `vercel-web-interface-guidelines.md` é cópia do guia MIT; termos em `VERCEL-LICENSE.txt`. O motor e os dados UI/UX Pro Max já integram o snapshot do builder recuperado, sob MIT; ele roda sem instalar executáveis de terceiros.

As skills de Leonxlnx estão em `skills/`, com licença MIT em `skills/LICENSE.txt` e SHA em `skills/TASTE-SOURCE-SHA.txt`. O script local `draw.mjs` não instala pacotes nem faz chamadas de rede. O worker produz três direções, exige que o plano escolha uma delas e passa a ficha completa ao agente de build. As instruções de cada skill são referências: não substituem o brief, as cores do cliente ou a regra de não fabricar prova visual.

O carrossel de [Sebastian Hardy](https://www.instagram.com/p/DeZa_8yjGbp/) enviado pelo usuário menciona design, redesign e movimento, mais conectores de Figma e navegador, mas não dá os nomes exatos dos três repositórios. A descrição de redesign com 23 comandos é compatível com [Impeccable](https://github.com/pbakaus/impeccable), que reúne comandos de redesign e movimento. Esta skill adicional foi copiada para `skills/impeccable/` em 16/10/2026; commit observado `6af45ac9a5eb8792f033d3242f52e99812fd91fa`, 81,9 mil estrelas observadas e licença Apache 2.0 em `IMPECCABLE-LICENSE.txt`. A [adaptação local](IMPECCABLE-ADAPTATION.md) usa quatro playbooks de texto sem executar o binário, instalar extensão ou acionar os conectores do post. Isso complementa as dez skills da lista, sem substituir as decisões de design e o QA no navegador.

O agente recebe em cada job cópias da skill `frontstep-coder` recuperada do Claude, as dez skills da lista, referências de texto/imagem/movimento/crítica da taste-skill, `vercel-web-interface-guidelines.md` e `DESIGN-WORKFLOW.md`, além de `design-research.md` da UI/UX Pro Max. Também recebe um exemplar aprovado da família do nicho (capturas desktop/mobile, código e estudo de caso) como referência de qualidade e, quando disponíveis, até seis fotos do brief anexadas para inspeção visual. As fotos do exemplar não entram no site novo. Não se executa `npx skills add`, instalador, plugin remoto ou fetch em tempo de build. O prompt local define o escopo: fixture sintética, sem envio, deploy, coleta real ou recursos externos.

O QA verifica imagem local visível no primeiro viewport de sites de comida e os serviços do brief. O endpoint `/jobs` exige `media.photos` para comida, incluindo pelo menos uma fotografia real do negócio ou de banco licenciado; arte gerada sozinha não basta. Os arquivos precisam estar sob `frontstep/local-briefs/assets/` e cada entrada deve informar `local_path` e `provenance`. `licensed_stock` exige fonte, licença e crédito. O worker copia os arquivos para o job e registra a origem no manifesto. Stock e ilustração gerada são conceitos para demo sintética, nunca prova de produto, pessoa ou espaço do negócio. A auditoria de movimento observa eventos reais no navegador e garante que o conteúdo principal continue visível sob movimento reduzido. A revisão visual usa sete critérios e exige nota ponderada estritamente acima de 9,0/10, com cada critério em pelo menos 8,5. O runtime local GSAP/ScrollTrigger está em `runtime/`, junto do contrato de uso e testes. O auditor mede propriedades renderizadas, inclusive SVG e clip-path, e entrega storyboard da cena; contagem de eventos não basta. Esses gates impedem que uma página apenas funcional seja rotulada como prévia pronta.

## Integração de 16/10/2026

`design-resources.mjs` copia as dez skills fornecidas e as sete de movimento com suas referências completas. O plano registra decisões por skill, receita e três estados de movimento. A implementação entrega `skill-usage.json` com princípio, aplicação e arquivos reais. A crítica verifica o resultado e aplica [VISUAL-RUBRIC.md](VISUAL-RUBRIC.md). O worker guarda capturas por tentativa, histórico de critérios e hash do conteúdo aprovado.

Os benchmarks foram observados nos sites publicados do usuário: [VERCEL-BENCHMARKS.md](VERCEL-BENCHMARKS.md). A biblioteca de seis famílias tipográficas é local e licenciada. O código dos exemplares serve como scaffold adaptável; seus fatos e fotos não viram evidência do novo negócio.

A integração técnica não é uma declaração de que todas as gerações atingiram a meta. Consulte os resultados reais dos jobs e a seção de geração automática da galeria.

## Spatial revision, 16 October 2026

`SPATIAL-STORYTELLING.md` describes the optional local 3D runtime, custom pose API and required design evidence. `spatial-source/` preserves the current manual flagship implementation. The builder validates concrete three-state plans and reads actual canvas pixels, excluding moving HTML. The previous photo-frame opening was rejected; old screenshots do not certify quality.
