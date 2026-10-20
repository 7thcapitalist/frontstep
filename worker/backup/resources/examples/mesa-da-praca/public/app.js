(() => {
  document.documentElement.classList.add('js-enabled');
  const products = [
    { id: 'prato-da-casa', name: 'Prato da casa', price: 38 },
    { id: 'prato-vegetariano', name: 'Prato vegetariano', price: 36 },
    { id: 'suco-de-laranja', name: 'Suco de laranja', price: 9 },
    { id: 'agua-sem-gas', name: 'Água sem gás', price: 5 },
  ];
  const byId = new Map(products.map(product => [product.id, product]));
  const quantities = new Map();
  const format = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const lines = document.querySelector('[data-cart-lines]');
  const totalEl = document.querySelector('[data-testid="pedido-total"]');
  const action = document.querySelector('[data-testid="pedido-whatsapp"]');
  const countEl = document.querySelector('[data-cart-count]');
  const dockCount = document.querySelector('[data-dock-count]');
  const cart = document.querySelector('.cart');
  const create = (tag, className, text) => {
    const el = document.createElement(tag);
    el.className = className;
    if (text != null) el.textContent = text;
    return el;
  };
  function adjust(id, delta) {
    const current = quantities.get(id) || 0;
    const next = Math.max(0, current + delta);
    if (next) quantities.set(id, next);
    else quantities.delete(id);
    render();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cart.classList.remove('is-updated');
      void cart.offsetWidth;
      cart.classList.add('is-updated');
    }
  }
  function render() {
    lines.replaceChildren();
    let count = 0;
    let total = 0;
    const summary = [];
    for (const product of products) {
      const quantity = quantities.get(product.id) || 0;
      if (!quantity) continue;
      count += quantity;
      const subtotal = quantity * product.price;
      total += subtotal;
      summary.push(`${quantity} x ${product.name} (${format(product.price)} cada) = ${format(subtotal)}`);
      const row = create('div', 'cart-row');
      const left = create('div', 'cart-row-left');
      left.append(create('div', 'cart-row-name', product.name), create('div', 'cart-row-sub', `${format(product.price)} por unidade`));
      const controls = create('div', 'cart-controls');
      const minus = create('button', '', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', `Remover um ${product.name} do pedido`);
      minus.addEventListener('click', () => adjust(product.id, -1));
      const plus = create('button', '', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', `Adicionar mais um ${product.name} ao pedido`);
      plus.addEventListener('click', () => adjust(product.id, 1));
      controls.append(minus, create('span', '', String(quantity)), plus);
      left.append(controls);
      row.append(left, create('div', 'cart-row-total', format(subtotal)));
      lines.append(row);
    }
    if (!count) lines.append(create('p', 'cart-empty', 'Sua mesa está esperando a primeira escolha.'));
    totalEl.textContent = format(total);
    countEl.textContent = String(count);
    dockCount.textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;
    if (count) {
      const message = `Mesa da Praça — demonstração fictícia\n${summary.join('\n')}\nTotal: ${format(total)}\nEste é apenas um exemplo; nenhum pedido será recebido.`;
      action.href = `https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;
      action.classList.remove('is-disabled');
      action.removeAttribute('aria-disabled');
      action.removeAttribute('tabindex');
    } else {
      action.removeAttribute('href');
      action.classList.add('is-disabled');
      action.setAttribute('aria-disabled', 'true');
      action.setAttribute('tabindex', '-1');
    }
  }
  document.querySelectorAll('[data-add]').forEach(button => {
    const id = button.getAttribute('data-add');
    if (!byId.has(id)) return;
    button.disabled = false;
    button.addEventListener('click', () => adjust(id, 1));
  });
  action.addEventListener('click', event => {
    if (!quantities.size) event.preventDefault();
  });
  render();
  const reveals = document.querySelectorAll('.reveal, .reveal-image');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: .08, rootMargin: '0px 0px 40px 0px' });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('is-visible'));
})();
