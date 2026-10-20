# Aceite dos dois briefs sintéticos

Estes arquivos são fixtures locais, não leads. Os nomes, contatos e preços são inventados. `5500000000000` é um número de teste deliberadamente inválido. Nenhum teste deve clicar em um link externo, enviar WhatsApp, registrar dados pessoais, publicar site ou chamar produção.

## Contabilidade: `contabilidade-vila-clara.json`

- Site em português, identifica Vila Clara Contabilidade e Campinas. Aviso visível de demonstração fictícia no formulário e no rodapé.
- Seção de triagem com `data-feature="triagem"`, rótulos associados aos controles, navegação por teclado e estado claro de seleção.
- Para automação local, expor seletores estáveis: `[data-testid="triagem-assunto"]` e `[data-testid="triagem-estagio"]` como `select` com valores `trocar_contador` e `empresa_ativa`, `[data-testid="triagem-cidade"]` como campo de texto, `[data-testid="triagem-resumo"]` para o resumo e `[data-testid="triagem-whatsapp"]` para o link final.
- Selecionar **Trocar contador**, **Empresa ativa** e **Campinas** e acionar **Revisar pauta**. O resumo antes da ação mostra as três escolhas sem os controles das etapas anteriores. Inspecionar o `href` da ação final: deve apontar para `wa.me/5500000000000`, com texto URL-encoded que inclui o nome do negócio e as três escolhas. Interceptar a navegação; não abrir WhatsApp.
- Trocar a primeira escolha para **Abrir empresa** e conferir que o resumo e o `href` mudam. Campo obrigatório vazio deve bloquear a continuação com erro claro, sem link pronto.
- A triagem não pede CPF, CNPJ, nome, telefone, e-mail, valores, documentos nem outras informações sensíveis.
- Com JavaScript desativado, o conteúdo principal, os serviços, o contato de demonstração e uma instrução alternativa legível permanecem visíveis. Não pode aparecer um formulário que parece enviar dados e fica inerte.

## Restaurante: `restaurante-praca-do-sol.json`

- Site em português, identifica Mesa da Praça e Taquaral, Campinas. Aviso visível de demonstração fictícia junto ao cardápio e no rodapé. Os quatro preços são rotulados como fictícios.
- Seção de pedido com `data-feature="pedido"`. Valores do cardápio vêm do brief e aparecem em BRL.
- Para automação local, expor `[data-testid="adicionar-prato-da-casa"]`, `[data-testid="adicionar-suco-de-laranja"]`, `[data-testid="pedido-total"]` e `[data-testid="pedido-whatsapp"]`.
- Adicionar **2 Pratos da casa** (2 × R$ 38,00 = R$ 76,00) e **1 Suco de laranja** (R$ 9,00): total **R$ 85,00**. Inspecionar o `href` da ação final: `wa.me/5500000000000` e texto URL-encoded com itens, quantidades, subtotais e total. Interceptar a navegação; não abrir WhatsApp.
- Remover um prato: total **R$ 47,00**. Remover todos os itens: total **R$ 0,00** e ação de pedido indisponível. Quantidades não podem ficar negativas nem produzir `NaN`.
- Não há afirmação de pedido confirmado, frete, entrega, taxa, desconto, pagamento ou disponibilidade.
- Com JavaScript desativado, cardápio, preços, contato de demonstração e instrução alternativa legível permanecem visíveis.

## QA comum

1. Servir `public/` em `127.0.0.1`. Testar em 390 px e viewport desktop; inspecionar screenshots completos e a seção da feature.
2. Rodar o gate com `--brief` apontando para o JSON correspondente. Guardar JSON e screenshots com o job.
3. Verificar ausência de overflow horizontal, erro de console, arquivo 404, link interno quebrado e controle sem nome acessível. Percorrer com teclado e confirmar foco visível.
4. Não aprovar com gate ausente, ilegível ou reprovado. O marcador `data-feature` sozinho não prova o comportamento: executar os cenários acima.
5. O gate exige texto visível com **demonstração** ou **fictícia/fictício** e conteúdo visível marcado `[data-feature-fallback]` quando JavaScript está desligado. Esse bloco deve oferecer instrução e contato alternativos, sem sugerir que o fluxo interativo continua ativo.

## Outras famílias: seletores e fluxos

- **Beleza, `atelie-aurora`**: agendamento de preferência, sem prometer vaga. Seletores `[data-testid="agendamento-servico"]`, `[data-testid="agendamento-turno"]`, `[data-testid="agendamento-resumo"]`, `[data-testid="agendamento-whatsapp"]`. Escolher Corte e manhã; resumo e mensagem refletem ambos. Nenhuma data ou horário é apresentado como disponível.
- **Fitness, `movimento-bairro`**: avaliação leve de objetivo e modalidade, sem perguntas de saúde, corpo ou medidas. Seletores `[data-testid="avaliacao-objetivo"]`, `[data-testid="avaliacao-ritmo"]`, `[data-testid="avaliacao-recomendacao"]`, `[data-testid="avaliacao-whatsapp"]`. Escolher mobilidade e duas vezes por semana; recomendar yoga suave como hipótese de conversa, sem promessa de resultado.
- **Loja, `casa-do-papel`**: filtro de categoria e seleção de produto com quantidade. Seletores `[data-testid="catalogo-categoria"]`, `[data-testid="catalogo-produto"]`, `[data-testid="catalogo-quantidade"]`, `[data-testid="catalogo-resumo"]`, `[data-testid="catalogo-whatsapp"]`. Escolher cadernos, Caderno pontilhado e quantidade 2; mensagem deve listar produto, quantidade e valor fictício total de R$ 48,00. Nunca afirmar estoque ou entrega disponível.
- **Hospedagem, `recanto-das-pedras`**: consulta de datas e hóspedes, sem disponibilidade inventada. Seletores `disponibilidade-entrada`, `disponibilidade-saida`, `disponibilidade-hospedes`, `disponibilidade-resumo`, `disponibilidade-whatsapp`. Testar 12 a 15/03/2027 para dois adultos; saída anterior ou igual à entrada deve bloquear. As fotos são paisagens de referência de outras cidades, nunca vista da pousada.
- **Indústria B2B, `metal-linha`**: triagem de cotação para peça de alumínio, quantidade 120 e prazo desejado. Seletores `triagem-servico`, `triagem-material`, `triagem-quantidade`, `triagem-prazo`, `triagem-resumo`, `triagem-whatsapp`. Quantidade zero deve bloquear. Imagens de máquinas são referências e não comprovam capacidade, parque de máquinas ou certificação.
- **Serviço local, `conserta-bairro`**: pedido de visita para geladeira no Taquaral, turno da tarde, com resumo e link de consulta; nenhuma visita confirmada. Seletores `agendamento-aparelho`, `agendamento-bairro`, `agendamento-turno`, `agendamento-resumo`, `agendamento-whatsapp`.
- **Saúde, `espaco-cuidado`**: protótipo de interface de fisioterapia. Seletores `agendamento-turno`, `agendamento-tipo`, `agendamento-resumo`, `agendamento-whatsapp`. Não pedir sintomas, diagnóstico, histórico nem dados sensíveis. **Este preview não pode ser publicado como anúncio de clínica:** não há profissional, retrato ou registro CREFITO verificável; a ausência deve permanecer explícita na página e no plano. A foto é apenas referência de sala.

Todos os novos cenários inspecionam `href` sem navegar. Cada página deve explicar que as fotografias são referências visuais licenciadas, com proveniência em `MEDIA-SOURCES.md`.
