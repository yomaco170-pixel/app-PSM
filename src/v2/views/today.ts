/**
 * Page "Aujourd'hui" v2.5 — détail des actions du jour
 * - 4 KPIs (chauds, bloqués, brouillons, à signer)
 * - Box Aujourd'hui (RDV / à relancer / à devisser)
 * - Dossiers chauds
 * - Dossiers bloqués
 */

export function renderToday(): string {
  return `
  <div id="today-page" class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Aujourd'hui</h1>
        <p class="text-sm text-slate-500" id="today-summary-text">Vue d'ensemble de tes actions du jour</p>
      </div>
      <a href="/v2" class="text-sm text-karl-600 hover:underline">
        <i class="fas fa-arrow-left mr-1"></i>Dashboard
      </a>
    </div>

    <!-- KPIs en 4 mini-cards -->
    <div class="grid grid-cols-4 gap-2">
      <a href="/v2/pipeline?filter=hot" class="bg-white rounded-xl p-3 border border-slate-200 hover:border-orange-300 transition">
        <div class="text-2xl font-bold text-orange-600" data-stat="hot_deals">—</div>
        <div class="text-[10px] text-slate-500 uppercase mt-0.5">Chauds</div>
      </a>
      <a href="/v2/pipeline?filter=stuck" class="bg-white rounded-xl p-3 border border-slate-200 hover:border-amber-300 transition">
        <div class="text-2xl font-bold text-amber-600" data-stat="stuck_deals">—</div>
        <div class="text-[10px] text-slate-500 uppercase mt-0.5">Bloqués</div>
      </a>
      <a href="/v2/quotes?status=brouillon" class="bg-white rounded-xl p-3 border border-slate-200 hover:border-karl-300 transition">
        <div class="text-2xl font-bold text-karl-600" data-stat="draft_quotes">—</div>
        <div class="text-[10px] text-slate-500 uppercase mt-0.5">Brouillons</div>
      </a>
      <a href="/v2/quotes?status=envoye" class="bg-white rounded-xl p-3 border border-slate-200 hover:border-emerald-300 transition">
        <div class="text-2xl font-bold text-emerald-600" data-stat="pending_amount_short">—</div>
        <div class="text-[10px] text-slate-500 uppercase mt-0.5">À signer</div>
      </a>
    </div>

    <!-- Box Aujourd'hui dynamique -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-slate-900 flex items-center gap-2">
          <i class="fas fa-calendar-day text-karl-600"></i>
          À faire aujourd'hui
        </h3>
        <span class="text-xs text-slate-400" id="today-summary">—</span>
      </div>
      <div id="today-content" class="space-y-3">
        <div class="text-sm text-slate-400">Chargement...</div>
      </div>
    </div>

    <!-- Dossiers chauds -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-slate-900 flex items-center gap-2 text-sm">
          <i class="fas fa-fire text-orange-500"></i>
          Dossiers chauds
        </h3>
        <a href="/v2/pipeline" class="text-xs text-karl-600 hover:underline">Voir tout →</a>
      </div>
      <div id="hot-deals-list" class="space-y-2">
        <div class="bg-white rounded-xl p-3 border border-slate-200 text-sm text-slate-400">
          Chargement...
        </div>
      </div>
    </div>

    <!-- Dossiers bloqués -->
    <div>
      <h3 class="font-semibold text-slate-900 flex items-center gap-2 text-sm mb-2">
        <i class="fas fa-triangle-exclamation text-amber-500"></i>
        Dossiers bloqués
      </h3>
      <div id="stuck-deals-list" class="space-y-2">
        <div class="bg-white rounded-xl p-3 border border-slate-200 text-sm text-slate-400">
          Chargement...
        </div>
      </div>
    </div>

  </div>`
}
