/**
 * Page Inbox v2 — emails avec résumé IA + classement automatique
 */

export function renderInbox(): string {
  return `
  <div id="inbox-page" class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Inbox</h1>
      <button id="inbox-refresh" class="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-karl-300">
        <i class="fas fa-arrows-rotate mr-1"></i>Actualiser
      </button>
    </div>

    <!-- Filtres catégorie -->
    <div class="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
      <button class="inbox-cat-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-karl-600 text-white" data-cat="all">Tous</button>
      <button class="inbox-cat-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-white border border-slate-200" data-cat="prospect">🔥 Prospects</button>
      <button class="inbox-cat-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-white border border-slate-200" data-cat="client">👤 Clients</button>
      <button class="inbox-cat-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-white border border-slate-200" data-cat="fournisseur">📦 Fournisseurs</button>
      <button class="inbox-cat-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-white border border-slate-200" data-cat="autre">📁 Autres</button>
    </div>

    <!-- Connexion Gmail si pas connecté -->
    <div id="gmail-connect" class="hidden bg-white rounded-2xl p-6 border border-slate-200 text-center">
      <i class="fab fa-google text-4xl text-slate-300 mb-3"></i>
      <h3 class="font-semibold text-slate-900 mb-1">Gmail non connecté</h3>
      <p class="text-sm text-slate-500 mb-4">Connecte ton compte Gmail dans la v1 pour voir tes emails ici.</p>
      <a href="/" class="inline-block px-4 py-2 rounded-lg bg-karl-600 text-white text-sm font-medium">Aller à la v1</a>
    </div>

    <!-- Liste emails -->
    <div id="emails-list" class="space-y-2">
      <div class="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-400">
        Chargement des emails...
      </div>
    </div>
  </div>`
}
