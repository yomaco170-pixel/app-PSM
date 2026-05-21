/**
 * Page Clients v2 — liste + recherche
 */

export function renderClients(): string {
  return `
  <div id="clients-page" class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Clients</h1>
      <button id="new-client-btn" class="text-sm px-3 py-1.5 rounded-lg bg-karl-600 text-white hover:bg-karl-700">
        <i class="fas fa-plus mr-1"></i>Nouveau
      </button>
    </div>

    <div class="relative">
      <input id="clients-search" type="search" placeholder="Rechercher par nom, téléphone, email..."
             class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-karl-500 focus:ring-2 focus:ring-karl-100 outline-none">
      <i class="fas fa-search absolute left-3 top-3 text-slate-400"></i>
    </div>

    <div id="clients-stats" class="grid grid-cols-3 gap-2 text-center">
      <div class="bg-white rounded-xl p-3 border border-slate-200">
        <p class="text-2xl font-bold text-slate-900" data-cstat="total">—</p>
        <p class="text-xs text-slate-500">Total</p>
      </div>
      <div class="bg-white rounded-xl p-3 border border-slate-200">
        <p class="text-2xl font-bold text-orange-600" data-cstat="leads">—</p>
        <p class="text-xs text-slate-500">Leads</p>
      </div>
      <div class="bg-white rounded-xl p-3 border border-slate-200">
        <p class="text-2xl font-bold text-emerald-600" data-cstat="clients">—</p>
        <p class="text-xs text-slate-500">Clients</p>
      </div>
    </div>

    <div id="clients-list" class="space-y-2">
      <div class="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-400">
        Chargement...
      </div>
    </div>
  </div>`
}
