// 28 casos da WEB-16 (R = resposta real, S = sintética) + 11 textos automáticos da HOL-37.
// Os 11 textos reais sumiram quando os leads foram corrigidos (data/n8n-leads-joao.json ficou vazio);
// aqui estão RECONSTRUÍDOS a partir da descrição da HOL-37 (ids gm-… na referência).
const O = 'oferta';
export const casos = [
  ['Ok', O, 'sim', '#1 R'], ['pode ser sim', O, 'sim', '#2 R'], ['sem interesse', O, 'nao', '#3 R'], ['sem interesse', O, 'nao', '#4 R'],
  ['Olá! Nosso horário de atendimento é de seg a sex das 9h às 18h.', O, 'automatica', '#5 R'],
  ['pode ser', O, 'sim', '#6'], ['blz', O, 'sim', '#7'], ['beleza, manda', O, 'sim', '#8'], ['👍', O, 'sim', '#9'], ['Okay!', O, 'sim', '#10'],
  ['tá bom, pode mandar', O, 'sim', '#11'], ['quero ver sim', O, 'sim', '#12'], ['bora', O, 'sim', '#13'],
  ['Ok, mas quanto custa?', O, 'duvida', '#14'], ['pode ser, qual o valor?', O, 'duvida', '#15'], ['como funciona isso?', O, 'duvida', '#16'],
  ['é de graça?', O, 'duvida', '#17'], ['quem é você?', O, 'duvida', '#18'], ['[áudio]', O, 'duvida', '#19'],
  ['agora não, talvez mês que vem', O, 'nao', '#20'], ['já tenho site', O, 'nao', '#21'], ['não preciso, obrigado', O, 'nao', '#22'], ['não', O, 'nao', '#23'],
  ['para de me mandar mensagem', O, 'opt_out', '#24'], ['ok, pode parar de mandar', O, 'opt_out', '#25'], ['isso é spam, vou denunciar', O, 'opt_out', '#26'],
  ['Ok', 'previa', 'ack', '#27 (bot acabou de mandar a prévia)'], ['ok', 'outro', 'ack', '#28 (bot agradeceu, sem oferta)'],
  // HOL-37 (reconstruídos)
  ['Olá! Faça seu pedido pelo nosso cardápio digital: https://goomer.app/lojax', O, 'automatica', 'HOL-37 Goomer gm-RNchdWa7dBig'],
  ['Oi, tudo bem? Peça direto no app: goomer.app/pizzaria', O, 'automatica', 'HOL-37 Goomer gm-RL_lqOzW4P4I'],
  ['Para fazer seu pedido acesse https://pedido.saipos.com/loja', O, 'automatica', 'HOL-37 Saipos gm-Ro0FjYkAo5Ac'],
  ['Nosso horário de funcionamento é das 18h às 23h. Cardápio: https://dmfweb.com/x', O, 'automatica', 'HOL-37 dmfweb gm-RBEEoImNP4GY'],
  ['Agradece seu contato. Como podemos ajudar?', O, 'automatica', 'HOL-37 gm-RJEpF04hiaT4'],
  ['Agradece seu contato. Como podemos ajudar?\n1 - Cardápio\n2 - Falar com atendente', O, 'automatica', 'HOL-37 menu gm-RJ1scHw_fMow'],
  ['A loja agradece seu contato! Como podemos ajudar?', O, 'automatica', 'HOL-37 gm-R8XbpTdEBiGY'],
  ['No momento não estamos atendendo. Nosso horário de atendimento é de seg a sex, das 9h às 18h.', O, 'automatica', 'HOL-37 horário gm-RvOCgpvDSwNg'],
  ['Estou ausente no momento, retorno assim que possível.', O, 'automatica', 'HOL-37 ausência gm-R5Imw9fZ7MSQ'],
  ['Aviso: hoje estamos fora do horário de atendimento. Responderemos amanhã.', O, 'automatica', 'HOL-37 aviso gm-RFsTi5pw-C9o'],
  ['Comunicado: loja fechada para o feriado. Voltamos amanhã!', O, 'automatica', 'HOL-37 comunicado gm-RQjpGBMDQlTo'],
];
