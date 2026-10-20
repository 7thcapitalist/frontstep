document.documentElement.classList.add('js');
const products = {
  'caderno-pontilhado': { category: 'cadernos', name: 'Caderno pontilhado', price: 24 },
  'bloco-de-notas': { category: 'cadernos', name: 'Bloco de notas', price: 12 },
  'caneta-preta': { category: 'escrita', name: 'Caneta preta', price: 6 },
  'marcador-de-pagina': { category: 'acessorios', name: 'Marcador de página', price: 8 }
};
const category = document.querySelector('[data-testid="catalogo-categoria"]');
const product = document.querySelector('[data-testid="catalogo-produto"]');
const quantity = document.querySelector('[data-testid="catalogo-quantidade"]');
const summary = document.querySelector('[data-testid="catalogo-resumo"]');
const contact = document.querySelector('[data-testid="catalogo-whatsapp"]');
const format = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
function updateOptions() {
  const previous = product.value;
  [...product.options].forEach(option => { if (option.value) option.hidden = option.disabled = products[option.value].category !== category.value; });
  if (!previous || products[previous]?.category !== category.value) product.value = '';
  updateSummary();
}
function updateSummary() {
  const item = products[product.value];
  const count = Number(quantity.value);
  if (!item || item.category !== category.value || !Number.isInteger(count) || count < 1 || count > 99) {
    summary.textContent = 'Escolha uma categoria, produto e quantidade inteira positiva para ver o resumo.';
    contact.removeAttribute('href'); contact.classList.add('disabled'); contact.setAttribute('aria-disabled','true'); contact.tabIndex = -1;
    return;
  }
  const total = count * item.price;
  summary.textContent = `${count} × ${item.name} = ${format(total)} (valor fictício).`;
  const message = `Olá! Vi a demonstração Casa do Papel. Gostaria de consultar disponibilidade de ${count} ${item.name}, total de referência ${format(total)}. Vocês podem confirmar valores e disponibilidade?`;
  contact.href = `https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;
  contact.classList.remove('disabled'); contact.removeAttribute('aria-disabled'); contact.tabIndex = 0;
}
category.addEventListener('change', updateOptions);
product.addEventListener('change', updateSummary);
quantity.addEventListener('input', updateSummary);
document.querySelectorAll('[data-product]').forEach(link => link.addEventListener('click', () => {
  const key = link.dataset.product;
  category.value = products[key].category;
  updateOptions(); product.value = key; updateSummary();
}));
updateOptions();
