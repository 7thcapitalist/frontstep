document.documentElement.classList.add('js');
const service = document.querySelector('[data-testid="triagem-servico"]');
const material = document.querySelector('[data-testid="triagem-material"]');
const quantity = document.querySelector('[data-testid="triagem-quantidade"]');
const deadline = document.querySelector('[data-testid="triagem-prazo"]');
const summary = document.querySelector('[data-testid="triagem-resumo"]');
const contact = document.querySelector('[data-testid="triagem-whatsapp"]');
const resultPanel = document.querySelector('.triage-result');
const materialNames = { aluminio:'alumínio', aco:'aço', inox:'aço inoxidável', outro:'material a definir' };
function dateLabel(value) { const [y,m,d]=value.split('-'); return `${d}/${m}/${y}`; }
function update() {
  const amount=Number(quantity.value);
  if (!service.value.trim() || !material.value || !Number.isInteger(amount) || amount<1 || amount>1000000 || !deadline.value) {
    resultPanel.classList.remove('is-ready');
    summary.textContent='Preencha peça ou serviço, material, quantidade inteira positiva e prazo desejado para revisar sua demanda.';
    contact.removeAttribute('href');contact.classList.add('disabled');contact.setAttribute('aria-disabled','true');contact.tabIndex=-1;return;
  }
  const label=materialNames[material.value];
  summary.textContent=`${service.value.trim()} · ${label} · ${amount} ${amount===1?'peça':'peças'} · prazo desejado ${dateLabel(deadline.value)}.`;
  resultPanel.classList.add('is-ready');
  const message=`Olá! Vi a demonstração Metal Linha. Gostaria de consultar possibilidade de orçamento para ${service.value.trim()}, material ${label}, quantidade ${amount} e prazo desejado ${dateLabel(deadline.value)}. Podem avaliar a demanda? Entendo que capacidade, preço e prazo dependem de análise técnica.`;
  contact.href=`https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;
  contact.classList.remove('disabled');contact.removeAttribute('aria-disabled');contact.tabIndex=0;
}
[service,material,quantity,deadline].forEach(input=>input.addEventListener('input',update));
