/**
 * Page Devis v2 — liste devis avec filtres status
 */

export function renderQuotes(): string {
  return `
  <div id="quotes-page" class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Devis</h1>
      <button id="new-quote-btn" class="text-sm px-3 py-1.5 rounded-lg bg-karl-600 text-white hover:bg-karl-700">
        <i class="fas fa-plus mr-1"></i>Nouveau
      </button>
    </div>

    <div class="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
      <button class="qstatus-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-karl-600 text-white" data-status="all">Tous</button>
      <button class="qstatus-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-white border border-slate-200" data-status="brouillon">📝 Brouillon</button>
      <button class="qstatus-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-white border border-slate-200" data-status="envoye">📤 Envoyé</button>
      <button class="qstatus-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-white border border-slate-200" data-status="signe">✅ Signé</button>
      <button class="qstatus-btn whitespace-nowrap px-3 py-1.5 rounded-full text-sm bg-white border border-slate-200" data-status="refuse">❌ Refusé</button>
    </div>

    <div id="quotes-totals" class="grid grid-cols-2 gap-2">
      <div class="bg-white rounded-xl p-3 border border-slate-200">
        <p class="text-xs text-slate-500">En attente signature</p>
        <p class="text-xl font-bold text-amber-600" data-qstat="pending">—</p>
      </div>
      <div class="bg-white rounded-xl p-3 border border-slate-200">
        <p class="text-xs text-slate-500">Signé ce mois</p>
        <p class="text-xl font-bold text-emerald-600" data-qstat="signed">—</p>
      </div>
    </div>

    <div id="quotes-list" class="space-y-2">
      <div class="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-400">Chargement...</div>
    </div>
  </div>`
}
