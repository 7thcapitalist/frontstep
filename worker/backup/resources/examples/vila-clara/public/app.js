(() => {
  document.documentElement.classList.add('js-enabled');
  const form = document.getElementById('triage-form');
  const assunto = document.getElementById('assunto');
  const estagio = document.getElementById('estagio');
  const cidade = document.getElementById('cidade');
  const error = document.getElementById('form-error');
  const panel = document.getElementById('summary-panel');
  const answers = document.querySelector('[data-testid="triagem-resumo"]');
  const link = document.querySelector('[data-testid="triagem-whatsapp"]');
  const edit = document.getElementById('edit-button');
  answers.setAttribute('aria-live', 'polite');
  let reviewed = false;
  const label = select => select.selectedOptions[0]?.textContent?.trim() || '';
  const cleanCity = () => cidade.value.trim().replace(/\s+/g, ' ');
  const valid = () => Boolean(assunto.value && estagio.value && cleanCity());
  function row(key, value) {
    const line = document.createElement('div');
    line.className = 'summary-line';
    const heading = document.createElement('span');
    heading.textContent = key;
    const content = document.createElement('strong');
    content.textContent = value;
    line.append(heading, content);
    return line;
  }
  function clearLink() {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('tabindex', '-1');
  }
  function updateSummary() {
    if (!valid()) {
      panel.hidden = true;
      clearLink();
      if (reviewed) error.hidden = false;
      for (const field of [assunto, estagio, cidade]) field.setAttribute('aria-invalid', String(!String(field.value).trim()));
      return;
    }
    error.hidden = true;
    for (const field of [assunto, estagio, cidade]) field.removeAttribute('aria-invalid');
    answers.replaceChildren(
      row('Assunto', label(assunto)),
      row('Estágio', label(estagio)),
      row('Cidade', cleanCity())
    );
    const message = `Vila Clara Contabilidade — demonstração fictícia\nAssunto: ${label(assunto)}\nEstágio: ${label(estagio)}\nCidade: ${cleanCity()}\nEsta é uma mensagem de exemplo; não envie dados reais.`;
    link.href = `https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;
    link.removeAttribute('aria-disabled');
    link.removeAttribute('tabindex');
    panel.hidden = false;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    reviewed = true;
    updateSummary();
    if (!valid()) {
      [assunto, estagio, cidade].find(field => !String(field.value).trim())?.focus();
    } else {
      panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    }
  });
  for (const field of [assunto, estagio, cidade]) {
    field.addEventListener(field === cidade ? 'input' : 'change', () => {
      if (reviewed) updateSummary();
    });
  }
  edit.addEventListener('click', () => {
    assunto.focus();
    assunto.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
  const suggestedTopics = new Map([
    ['Abertura de empresa', 'abrir_empresa'],
    ['Rotina fiscal e contábil', 'organizar_rotina'],
    ['Troca de contador', 'trocar_contador'],
  ]);
  document.querySelectorAll('.service-row').forEach(row => {
    const topic = suggestedTopics.get(row.querySelector('h3')?.textContent?.trim());
    if (!topic) return;
    row.querySelector('a')?.addEventListener('click', () => {
      assunto.value = topic;
      if (reviewed) updateSummary();
    });
  });
  link.addEventListener('click', event => {
    if (!valid()) event.preventDefault();
  });
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .06, rootMargin: '0px 0px 35px 0px' });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('is-visible'));
})();
