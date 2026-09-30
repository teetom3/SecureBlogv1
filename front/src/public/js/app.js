// Envoie chaque formulaire [data-endpoint] en JSON à l'API, puis redirige vers [data-redirect].
// Le cookie de session est envoyé automatiquement (même origine grâce au proxy /api).

const showError = (form, message) => {
  const el = form.querySelector('.form-error');
  if (!el) return;
  el.textContent = message; // textContent (pas innerHTML) → aucun HTML interprété
  el.hidden = !message;
};

document.querySelectorAll('form[data-endpoint]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError(form, '');

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    try {
      const response = await fetch(form.dataset.endpoint, {
        method: form.dataset.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showError(form, data.error || 'Une erreur est survenue');
        return;
      }

      window.location.assign(form.dataset.redirect);
    } catch {
      showError(form, 'Serveur injoignable');
    } finally {
      button.disabled = false;
    }
  });
});
