document.documentElement.classList.add('js');
const shift=document.querySelector('[data-testid="agendamento-turno"]');
const type=document.querySelector('[data-testid="agendamento-tipo"]');
const summary=document.querySelector('[data-testid="agendamento-resumo"]');
const explain=document.querySelector('[data-explain]');
const contact=document.querySelector('[data-testid="agendamento-whatsapp"]');
const shifts={manha:'manhã',tarde:'tarde',noite:'noite'};
const types={primeira_conversa:'primeira conversa',informacoes_gerais:'informações gerais'};
let message='';
function update(){
 if(!shift.value||!type.value){summary.textContent='Duas escolhas para visualizar o resumo.';explain.textContent='O resumo não será enviado nem irá reservar horário.';contact.removeAttribute('href');contact.classList.add('disabled');contact.setAttribute('aria-disabled','true');contact.tabIndex=-1;return;}
 summary.textContent=`Interesse em ${types[type.value]} · turno preferido: ${shifts[shift.value]}.`;
 explain.textContent='Simulação apenas. Não há horário disponível, clínica ou profissional registrado.';
 message=`Olá! Vi o protótipo Espaço Cuidado. Teria interesse em ${types[type.value]}, com preferência pelo turno da ${shifts[shift.value]}. Entendo que este é um protótipo sem atendimento ou agendamento real.`;
 contact.href=`https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;
 contact.classList.remove('disabled');contact.removeAttribute('aria-disabled');contact.tabIndex=0;
}
[shift,type].forEach(input=>input.addEventListener('change',update));
contact.addEventListener('click',event=>{
 event.preventDefault();
 if(!message)return;
 const dialog=document.createElement('dialog');dialog.className='demo-dialog';
 const heading=document.createElement('h2');heading.textContent='Mensagem de exemplo';
 const copy=document.createElement('p');copy.textContent=message;
 const notice=document.createElement('p');notice.textContent='Esta mensagem não será enviada. O contato demonstrativo não é um canal de atendimento.';
 const close=document.createElement('button');close.type='button';close.textContent='Fechar';close.addEventListener('click',()=>dialog.close());
 dialog.append(heading,copy,notice,close);document.body.append(dialog);
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
});
