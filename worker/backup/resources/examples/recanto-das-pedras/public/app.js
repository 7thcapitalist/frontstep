document.documentElement.classList.add('js');
const entry = document.querySelector('[data-testid="disponibilidade-entrada"]');
const exit = document.querySelector('[data-testid="disponibilidade-saida"]');
const guests = document.querySelector('[data-testid="disponibilidade-hospedes"]');
const summary = document.querySelector('[data-testid="disponibilidade-resumo"]');
const explain = document.querySelector('[data-explain]');
const contact = document.querySelector('[data-testid="disponibilidade-whatsapp"]');
const resultPanel = document.querySelector('.consult-result');
function dateLabel(value) { const [year, month, day] = value.split('-'); return `${day}/${month}/${year}`; }
function update() {
  const count = Number(guests.value);
  const validDates = entry.value && exit.value && exit.value > entry.value;
  const validGuests = Number.isInteger(count) && count >= 1 && count <= 20;
  if (!validDates || !validGuests) {
    resultPanel.classList.remove('is-ready');
    summary.textContent = entry.value && exit.value && exit.value <= entry.value ? 'A saída precisa ser depois da entrada.' : 'Sua pausa começa com uma data.';
    explain.textContent = validGuests ? 'Escolha entrada e saída em ordem para preparar uma consulta sem reserva.' : 'Informe pelo menos um hóspede adulto.';
    contact.removeAttribute('href'); contact.classList.add('disabled'); contact.setAttribute('aria-disabled','true'); contact.tabIndex=-1;
    return;
  }
  summary.textContent = `${dateLabel(entry.value)} a ${dateLabel(exit.value)} · ${count} ${count === 1 ? 'adulto' : 'adultos'}`;
  resultPanel.classList.add('is-ready');
  explain.textContent = 'Estas datas representam apenas interesse. A possibilidade de estadia depende de confirmação direta.';
  const message = `Olá! Vi a demonstração Recanto das Pedras. Gostaria de consultar a possibilidade de estadia de ${dateLabel(entry.value)} a ${dateLabel(exit.value)} para ${count} ${count === 1 ? 'adulto' : 'adultos'}. Poderiam informar se há opção, estrutura e tarifa? Entendo que nada está reservado.`;
  contact.href=`https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;
  contact.classList.remove('disabled'); contact.removeAttribute('aria-disabled'); contact.tabIndex=0;
}
[entry,exit,guests].forEach(input=>input.addEventListener('input',update));
