document.documentElement.classList.add('js');
const appliance=document.querySelector('[data-testid="agendamento-aparelho"]');
const neighborhood=document.querySelector('[data-testid="agendamento-bairro"]');
const shift=document.querySelector('[data-testid="agendamento-turno"]');
const summary=document.querySelector('[data-testid="agendamento-resumo"]');
const explain=document.querySelector('[data-explain]');
const contact=document.querySelector('[data-testid="agendamento-whatsapp"]');
const names={geladeira:'Geladeira','maquina-de-lavar':'Máquina de lavar','micro-ondas':'Micro-ondas'};
const shifts={manha:'manhã',tarde:'tarde',noite:'noite'};
function update(){
 const area=neighborhood.value.trim();
 if(!appliance.value||!area||!shift.value){summary.textContent='Seu pedido começa com três respostas.';explain.textContent='Escolha o aparelho, informe o bairro e selecione um turno preferido.';contact.removeAttribute('href');contact.classList.add('disabled');contact.setAttribute('aria-disabled','true');contact.tabIndex=-1;return;}
 summary.textContent=`${names[appliance.value]} · ${area} · preferência de ${shifts[shift.value]}.`;
 explain.textContent='Este é um resumo para conversa inicial. O turno depende de confirmação; não é visita marcada.';
 const message=`Olá! Vi a demonstração Conserta Bairro. Gostaria de consultar uma visita de avaliação para ${names[appliance.value]} no bairro ${area}. Meu turno preferido é ${shifts[shift.value]}. Podem informar se atendem a região e como funciona? Entendo que não há visita agendada.`;
 contact.href=`https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;contact.classList.remove('disabled');contact.removeAttribute('aria-disabled');contact.tabIndex=0;
}
[appliance,neighborhood,shift].forEach(input=>input.addEventListener('input',update));
document.querySelectorAll('[data-appliance]').forEach(link=>link.addEventListener('click',()=>{appliance.value=link.dataset.appliance;update()}));
