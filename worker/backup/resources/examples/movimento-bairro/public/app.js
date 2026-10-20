document.documentElement.classList.add('js-enabled');

const objective = document.querySelector('[data-testid="avaliacao-objetivo"]');
const rhythm = document.querySelector('[data-testid="avaliacao-ritmo"]');
const result = document.querySelector('[data-testid="avaliacao-recomendacao"]');
const explanation = document.querySelector('[data-result-explanation]');
const contact = document.querySelector('[data-testid="avaliacao-whatsapp"]');
const progress = document.querySelector('[data-progress]');
const suggestions = {
  mobilidade: { name: 'Yoga suave', description: 'Uma sequência acessível em ritmo calmo pode ser um primeiro assunto para conversar.' },
  expressao: { name: 'Dança livre', description: 'Movimento guiado ao som de música combina com a vontade de explorar expressão.' },
  comecar: { name: 'Alongamento', description: 'Movimentos simples podem ser um ponto de partida para explorar uma aula.' },
};
const rhythmLabels = { uma: 'uma vez por semana', duas: 'duas vezes por semana', tres: 'três vezes por semana' };

function updateRecommendation() {
  const filled = Number(Boolean(objective.value)) + Number(Boolean(rhythm.value));
  progress.style.width = `${filled * 50}%`;
  if (filled < 2) {
    result.textContent = 'Seu ritmo começa com uma escolha.';
    explanation.textContent = 'Selecione uma intenção e uma frequência para ver uma sugestão exploratória.';
    contact.removeAttribute('href');
    contact.classList.add('is-disabled');
    contact.setAttribute('aria-disabled', 'true');
    contact.tabIndex = -1;
    return;
  }
  const suggestion = suggestions[objective.value];
  result.textContent = suggestion.name;
  explanation.textContent = `${suggestion.description} A frequência de ${rhythmLabels[rhythm.value]} é apenas sua preferência inicial.`;
  const message = `Olá! Vi a demonstração Movimento do Bairro. Meu interesse é ${objective.value} e penso em ir ${rhythmLabels[rhythm.value]}. Gostaria de conversar sobre a possibilidade de uma aula experimental de ${suggestion.name}. Quais detalhes devo conhecer?`;
  contact.href = `https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;
  contact.classList.remove('is-disabled');
  contact.removeAttribute('aria-disabled');
  contact.tabIndex = 0;
}

objective.addEventListener('change', updateRecommendation);
rhythm.addEventListener('change', updateRecommendation);
document.querySelectorAll('[data-suggest]').forEach(link => {
  link.addEventListener('click', () => {
    objective.value = link.dataset.suggest;
    updateRecommendation();
  });
});

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
}
