document.querySelector('#enviar').addEventListener('click', () => {
  document.querySelector('#resumo').textContent = `Resumo para ${document.querySelector('#nome').value}`;
});
