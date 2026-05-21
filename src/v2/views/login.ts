/**
 * Page Login v2 — réutilise les utilisateurs de la table v1
 */

export function renderLogin(): string {
  return `
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-karl-50 to-slate-100">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-karl-500 to-karl-700 items-center justify-center text-white shadow-lg mb-4">
          <i class="fas fa-bolt text-2xl"></i>
        </div>
        <h1 class="text-3xl font-bold text-slate-900">KARL <span class="text-karl-600">v2</span></h1>
        <p class="text-slate-500 mt-1">Assistant IA pour artisans</p>
      </div>

      <form id="login-form" class="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Nom utilisateur</label>
          <input type="text" id="login-name" required autocomplete="name"
                 class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-karl-500 focus:ring-2 focus:ring-karl-100 outline-none transition"
                 placeholder="Guillaume PINOIT">
          <p class="text-xs text-slate-400 mt-1.5">Utilise le même nom que dans la v1</p>
        </div>

        <button type="submit" class="w-full bg-karl-600 hover:bg-karl-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
          <span>Se connecter</span>
          <i class="fas fa-arrow-right"></i>
        </button>

        <div id="login-error" class="hidden text-sm text-red-600 bg-red-50 rounded-lg p-3"></div>
      </form>

      <p class="text-center text-xs text-slate-400 mt-6">
        KARL v2 — Réécriture IA-first<br>
        <a href="/" class="text-karl-600 hover:underline">← Retour à la v1</a>
      </p>
    </div>
  </div>

  <script>
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('login-name').value.trim();
      const errEl = document.getElementById('login-error');
      errEl.classList.add('hidden');

      try {
        const r = await fetch('/v2/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await r.json();
        if (!r.ok) {
          errEl.textContent = data.error || 'Erreur de connexion';
          errEl.classList.remove('hidden');
          return;
        }
        localStorage.setItem('karl_v2_token', data.token);
        localStorage.setItem('karl_v2_user', JSON.stringify(data.user));
        window.location.href = '/v2';
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      }
    });
  </script>`
}
