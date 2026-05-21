/**
 * Page Pipeline v2 — vue Kanban mobile-first
 * Colonnes: lead, rdv_planifie, devis_a_faire, devis_envoye, relance, signe, perdu
 */

export function renderPipeline(): string {
  return `
  <div id="pipeline-page" class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Pipeline</h1>
      <div class="flex gap-2">
        <button id="pipeline-filter-btn" class="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-karl-300">
          <i class="fas fa-filter mr-1"></i>Filtres
        </button>
        <button id="new-deal-btn" class="text-sm px-3 py-1.5 rounded-lg bg-karl-600 text-white hover:bg-karl-700">
          <i class="fas fa-plus mr-1"></i>Nouveau
        </button>
      </div>
    </div>

    <!-- Recherche -->
    <div class="relative">
      <input id="pipeline-search" type="search" placeholder="Rechercher un dossier, un client..."
             class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-karl-500 focus:ring-2 focus:ring-karl-100 outline-none">
      <i class="fas fa-search absolute left-3 top-3 text-slate-400"></i>
    </div>

    <!-- Kanban mobile : scroll horizontal, desktop : grid -->
    <div id="kanban-board" class="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:grid md:grid-cols-4 md:gap-3 md:overflow-x-visible md:mx-0 md:px-0">
      <div class="flex items-center justify-center w-full py-12 text-slate-400">
        <i class="fas fa-circle-notch fa-spin mr-2"></i>Chargement du pipeline...
      </div>
    </div>
  </div>`
}
