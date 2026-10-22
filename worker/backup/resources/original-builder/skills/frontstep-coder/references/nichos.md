# Nichos: o que cada família de negócio pede

Leia no passo 1, antes de decidir as seções. Obrigatório. O nicho do brief (`business.niche`) diz a família; a família diz as seções obrigatórias, a feature premium, o que fazer com as imagens, a restrição legal e o tom.

As seções obrigatórias e as restrições legais daqui não são sugestão. O resto do `references/` é insumo; isto aqui é regra. O que continua valendo: dado que não existe no brief não é inventado. Seção obrigatória sem dado nenhum fica de fora e você diz qual e por quê no `plan.md`.

## Como achar a família

Leia `business.niche` e escolha pela tabela. Se o brief trouxer `premium_feature`, ela ganha da tabela. Na dúvida entre duas famílias, escolha a que tem restrição legal mais dura e escreva a escolha no `plan.md`.

| Família | Nichos que caem nela |
|---|---|
| `comida` | restaurante, hamburgueria, pizzaria, lanchonete, padaria, confeitaria, açaí, bar, café, marmita, food truck |
| `juridico_contabil` | advogado, escritório de advocacia, contador, contabilidade, despachante, consultoria tributária |
| `saude` | médico, clínica, dentista, fisioterapeuta, psicólogo, nutricionista, fonoaudiólogo, qualquer profissão com conselho de saúde |
| `beleza` | salão, barbearia, manicure, estética, sobrancelha, cílios, maquiagem, tatuagem |
| `fitness` | academia, personal, pilates, crossfit, luta, dança, yoga |
| `loja` | loja física, boutique, floricultura, pet shop que vende, mercado, loja só de Instagram |
| `hospedagem_eventos` | pousada, hotel, chalé, espaço de eventos, buffet, salão de festa, sítio |
| `industria_b2b` | indústria, fábrica, usinagem, metalúrgica, distribuidora, gráfica industrial, qualquer um que venda para empresa |
| `servico_local` | o resto: assistência técnica, oficina, chaveiro, dedetizadora, banho e tosa, eletricista, encanador, autônomo |

Estética que faz procedimento médico (toxina, preenchimento, laser feito por médico ou dentista) é `saude`, não `beleza`.

## comida

- **Seções obrigatórias**: cardápio ou destaques com preço, fotos dos pratos, pedido, horário por dia, endereço com mapa, avaliações.
- **Feature**: `pedido`.
- **Imagens**: é o nicho que mais tem foto. Use grande. O prato é o herói da página.
- **Restrição legal**: nenhuma.
- **Tom**: apetite e movimento.

## juridico_contabil

- **Seções obrigatórias**: áreas de atuação em cards; quem é o profissional, com retrato e número de registro (OAB ou CRC, tem que aparecer); como funciona o atendimento, em passos; endereço com mapa; triagem.
- **Feature**: `triagem`. Formulário curto com as perguntas iniciais do caso, que chega organizado no WhatsApp.
- **Imagens**: quase sempre falta. Um retrato e uma foto de sala no máximo. O resto é tipografia e espaço reservado (`data-slot`, ver a seção de fotos do SKILL.md).
- **Tom**: sobriedade e clareza. Nada de urgência.
- **Restrição legal, obrigatória**: publicidade de advogado segue a regra da OAB. Proibido:
  - prometer ou sugerir resultado;
  - linguagem mercantil;
  - sensacionalismo;
  - comparação com outros profissionais;
  - depoimento sobre resultado de causa;
  - honorário como oferta;
  - captação de clientela.

  Escreva no modo informativo: o que a área de atuação é, não o que o cliente ganha. "Direito de família: divórcio, guarda, pensão e inventário", não "Resolva seu divórcio rápido". Avaliação do Google entra só como avaliação de atendimento, nunca como prova de resultado. CTA é "Fale com o escritório", não "Garanta seus direitos agora".

## saude

- **Seções obrigatórias**: especialidade e o que trata; retrato; registro (CRM mais RQE, ou CRO, CREFITO, CRP); convênios ou só particular; endereço com mapa; agendamento.
- **Feature**: `agendamento`.
- **Imagens**: o retrato manda. Sala e fachada ajudam. Nenhuma cena gerada.
- **Tom**: calmo, claro, acolhedor sem ser meloso.
- **Restrição legal, obrigatória**: regra do CFM, já no SKILL.md. Sem antes e depois, sem promessa, sem depoimento de paciente, registro visível, e nenhum dado de saúde em formulário. O agendamento pede nome, horário e convênio, nunca sintoma ou histórico.

## beleza

- **Seções obrigatórias**: serviços com preço ou faixa; galeria de trabalhos; profissionais; agendamento; endereço.
- **Feature**: `agendamento`.
- **Imagens**: muita foto de trabalho. Use em galeria.
- **Restrição legal**: antes e depois é permitido aqui, ao contrário da saúde, mas só com foto que o cliente mandou.
- **Tom**: cuidado, vaidade, detalhe.

## fitness

- **Seções obrigatórias**: modalidades; horário das aulas; estrutura; planos; aula experimental.
- **Feature**: `avaliacao`.
- **Imagens**: estrutura e aula acontecendo. Sem foto de corpo como promessa de resultado.
- **Restrição legal**: nenhuma específica.
- **Tom**: energia. Movimento no scroll.

## loja

- **Seções obrigatórias**: vitrine com preço; categorias; pagamento e entrega; endereço.
- **Feature**: `catalogo`.
- **Imagens**: foto de produto, recortada e consistente. Produto sem foto vira card tipográfico, não banco de imagem.
- **Restrição legal**: nenhuma específica. Preço só se o brief tiver.
- **Tom**: direto, de vitrine.

## hospedagem_eventos

- **Seções obrigatórias**: galeria grande; estrutura e capacidade; o que está incluso; localização; consulta de disponibilidade.
- **Feature**: `disponibilidade`.
- **Imagens**: o mais dependente de foto de todos. Galeria grande, foto larga. Sem foto boa do espaço a prévia fica fraca: diga isso no `plan.md`.
- **Restrição legal**: nenhuma específica.
- **Tom**: convite, lugar, descanso ou celebração, conforme o espaço.

## industria_b2b

- **Seções obrigatórias**: o que fabrica ou faz; capacidades e processos; parque de máquinas ou estrutura; certificações como ISO; setores atendidos; pedido de orçamento.
- **Feature**: `triagem` adaptada, marcada `data-feature="triagem"`. É um pedido de orçamento: peça ou serviço, material, quantidade e prazo. Chega no WhatsApp como uma cotação organizada.
- **Imagens**: foto de galpão e máquina, frequentemente nenhuma boa. Foto ruim de fábrica derruba confiança: prefira espaço reservado e tipografia a uma foto escura de celular.
- **Restrição legal**: nenhuma específica. Certificação só se o brief tiver, nunca "em processo de".
- **Tom**: precisão, sem emoção. Quem lê é comprador de empresa decidindo se confia no fornecedor. Números, tolerâncias, materiais, prazos. Nada de adjetivo.

## servico_local

- **Seções obrigatórias**: o que faz; área atendida; como funciona; contato direto.
- **Feature**: `agendamento`.
- **Imagens**: foto do trabalho feito, do carro, da ferramenta, da fachada. O que tiver.
- **Restrição legal**: nenhuma específica.
- **Tom**: confiança de vizinho. Resolve, explica, cobra justo.

## O que vai no plan.md

Uma linha com a família escolhida e por quê. A lista de seções obrigatórias dela, marcando a que ficou de fora por falta de dado. Os espaços reservados planejados, com o `data-slot` de cada um. Se a família tem restrição legal, uma linha dizendo que o texto foi escrito dentro dela.
