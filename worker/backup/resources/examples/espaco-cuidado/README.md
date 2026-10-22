# Espaço Cuidado — protótipo de interface de saúde

**Não publicável e não utilizável com pacientes.** Clínica, profissional, registro, endereço e canal real de atendimento não foram fornecidos nem verificados. Esta é uma fixture sintética local para avaliar clareza de interface.

## Direção e conteúdo

Tipografia limpa, composição de arcos abstratos e cores clínicas calmas. Não há retrato fictício, paciente, depoimento, diagnóstico, promessa terapêutica ou especialidade inventada. A fotografia Pexels é rotulada no contexto e no rodapé como referência de ambiente, não instalação do Espaço Cuidado.

## Simulação de contato

O formulário recebe somente turno preferido e tipo geral de contato. Não solicita sintomas, queixas, histórico, CPF ou convênio. Mostra resumo de interesse; o link de número demonstrativo **não navega**: clique abre um diálogo local com a mensagem de exemplo e aviso de que nada é enviado. Sem JS, mostra aviso de contato inválido. Não há horário disponível nem agendamento.

## Bloqueio de publicação

Antes de qualquer uso real: verificar nome e atuação profissional, registro no conselho competente, identificação e localização da clínica, contato verdadeiro, fotos próprias e conteúdo revisto por responsável habilitado. O banner e uma seção dedicada deixam essas lacunas visíveis.

## QA visual

Inspecionei capturas completas desktop e celular. A única foto carrega e mantém legenda; texto e formulário seguem legíveis sem overflow. QA passou em ambos viewports com `manhã` + `primeira_conversa`, fallback sem JS, imagens e nenhum erro de console/rede. `prefers-reduced-motion` desliga a animação abstrata e a rolagem suave.

**Autoavaliação: 8,5/10 como estudo de interface; 0/10 para publicação.** A peça comunica bem a simulação, mas não existe base verificada para serviço de saúde.

Executar: `node frontstep/local-qa/qa.mjs frontstep/local-factory/examples/espaco-cuidado/public --brief frontstep/local-briefs/espaco-cuidado.json --scenario frontstep/local-briefs/espaco-cuidado.scenario.json --out frontstep/local-factory/examples/espaco-cuidado/qa --json`
