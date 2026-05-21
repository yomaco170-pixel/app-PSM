/**
 * Page Détail dossier v2 — vue dossier + Timeline universelle + actions IA
 */

export function renderDealDetail(dealId: string): string {
  return `
  <div id="deal-detail-page" data-deal-id="${dealId}" class="space-y-4">
    <div class="flex items-center gap-3">
      <a href="/v2/pipeline" class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
        <i class="fas fa-arrow-left"></i>
      </a>
      <div class="flex-1 min-w-0">
        <h1 id="deal-title" class="text-xl font-bold text-slate-900 truncate">Chargement…</h1>
        <p id="deal-client" class="text-sm text-slate-500 truncate">—</p>
      </div>
    </div>

    <!-- Score + flags -->
    <div id="deal-score-zone"></div>

    <!-- Actions IA -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <button class="ai-action-btn flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-br from-karl-500 to-karl-700 text-white text-sm font-medium hover:opacity-90" data-action="summary">
        <i class="fas fa-wand-magic-sparkles"></i>Résumer
      </button>
      <button class="ai-action-btn flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:border-karl-300" data-action="followup">
        <i class="fas fa-paper-plane text-blue-600"></i>Préparer relance
      </button>
      <button class="ai-action-btn flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:border-karl-300" data-action="quote">
        <i class="fas fa-file-invoice text-emerald-600"></i>Préparer devis
      </button>
      <button class="ai-action-btn flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:border-karl-300" data-action="check">
        <i class="fas fa-shield-halved text-amber-600"></i>Vérifier
      </button>
    </div>

    <!-- Carte info -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-xs text-slate-500">Stage</p>
          <p id="deal-stage" class="font-medium">—</p>
        </div>
        <div>
          <p class="text-xs text-slate-500">Montant</p>
          <p id="deal-amount" class="font-medium">—</p>
        </div>
        <div>
          <p class="text-xs text-slate-500">Probabilité</p>
          <p id="deal-proba" class="font-medium">—</p>
        </div>
        <div>
          <p class="text-xs text-slate-500">Maj</p>
          <p id="deal-updated" class="font-medium text-sm">—</p>
        </div>
      </div>
      <div id="deal-contact" class="flex gap-2 pt-2 border-t border-slate-100"></div>
    </div>

    <!-- Zone résultat IA -->
    <div id="ai-result-zone" class="hidden bg-gradient-to-br from-karl-50 to-blue-50 rounded-2xl p-4 border border-karl-200">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-karl-900 flex items-center gap-2">
          <i class="fas fa-wand-magic-sparkles text-karl-600"></i>
          <span id="ai-result-title">Résultat IA</span>
        </h3>
        <button onclick="document.getElementById('ai-result-zone').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div id="ai-result-content" class="text-sm whitespace-pre-wrap text-slate-700"></div>
      <div id="ai-result-actions" class="hidden mt-3 flex gap-2"></div>
    </div>

    <!-- Timeline universelle -->
    <div>
      <h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <i class="fas fa-stream text-slate-600"></i>Historique
      </h3>
      <div id="timeline" class="space-y-3">
        <div class="text-sm text-slate-400">Chargement…</div>
      </div>
    </div>
  </div>`
}
