(() => {
  document.documentElement.classList.add('js-enabled');
  const service = document.getElementById('servico');
  const turn = document.getElementById('turno');
  const summary = document.querySelector('[data-testid="agendamento-resumo"]');
  const action = document.querySelector('[data-testid="agendamento-whatsapp"]');
  const progress = document.querySelector('[data-progress]');
  const selectedText = control => control.selectedOptions[0]?.textContent?.trim() || '';
  function update() {
    const count = Number(Boolean(service.value)) + Number(Boolean(turn.value));
    progress.style.width = `${count * 50}%`;
    if (!count) summary.textContent = 'Escolha um serviço e um turno para ver sua mensagem de exemplo.';
    else if (count === 1) summary.textContent = service.value
      ? `${selectedText(service)} escolhido. Indique um turno de preferência para completar a intenção.`
      : `Turno de preferência: ${selectedText(turn).toLocaleLowerCase('pt-BR')}. Escolha um serviço para completar a intenção.`;
    else {
      const period = selectedText(turn).toLocaleLowerCase('pt-BR');
      summary.replaceChildren();
      const text = document.createElement('p');
      text.append('Gostaria de conversar sobre ');
      const name = document.createElement('strong');
      name.textContent = selectedText(service);
      text.append(name, `, com preferência pelo turno da ${period}.`);
      summary.append(text);
    }
    if (count === 2) {
      const message = `Ateliê Aurora — demonstração fictícia\nServiço: ${selectedText(service)}\nTurno preferido: ${selectedText(turn).toLocaleLowerCase('pt-BR')}\nGostaria de conversar sobre agendamento. Sei que esta preferência não confirma horário nem reserva.`;
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
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      summary.classList.remove('is-updated');
      void summary.offsetWidth;
      summary.classList.add('is-updated');
    }
  }
  for (const control of [service, turn]) control.addEventListener('change', update);
  document.getElementById('booking-form').addEventListener('submit', event => event.preventDefault());
  action.addEventListener('click', event => { if (!service.value || !turn.value) event.preventDefault(); });
  document.querySelectorAll('[data-service-link]').forEach(link => {
    link.addEventListener('click', () => {
      service.value = link.getAttribute('data-service-link');
      update();
    });
  });
  update();
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
