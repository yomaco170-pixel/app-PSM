/**
 * Page Dashboard — l'écran principal "à faire aujourd'hui"
 * Affiche briefing IA + 4 cartes d'actions + stats clés.
 */

export function renderDashboard(): string {
  return `
  <div id="dash" class="space-y-6">

    <!-- Briefing IA matinal -->
    <section class="bg-gradient-to-br from-karl-600 to-karl-900 rounded-2xl p-5 text-white shadow-lg">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2">
          <i class="fas fa-wand-magic-sparkles text-yellow-300"></i>
          <h2 class="font-semibold">Briefing du jour</h2>
        </div>
        <button id="briefing-refresh" class="text-white/70 hover:text-white text-sm">
          <i class="fas fa-arrows-rotate"></i>
        </button>
      </div>
      <div id="briefing-content" class="text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
        <div class="flex items-center gap-2 text-white/70">
          <i class="fas fa-circle-notch fa-spin"></i>
          <span>KARL prépare ton briefing...</span>
        </div>
      </div>
    </section>

    <!-- Cartes d'actions -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <a href="/v2/pipeline?filter=hot" class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-orange-300 transition">
        <div class="flex items-center justify-between mb-2">
          <span class="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <i class="fas fa-fire"></i>
          </span>
          <span class="text-2xl font-bold text-slate-900" data-stat="hot_deals">—</span>
        </div>
        <p class="text-sm text-slate-600 font-medium">Dossiers chauds</p>
        <p class="text-xs text-slate-400 mt-0.5">À relancer en priorité</p>
      </a>

      <a href="/v2/pipeline?filter=stuck" class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-amber-300 transition">
        <div class="flex items-center justify-between mb-2">
          <span class="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <i class="fas fa-clock"></i>
          </span>
          <span class="text-2xl font-bold text-slate-900" data-stat="stuck_deals">—</span>
        </div>
        <p class="text-sm text-slate-600 font-medium">Bloqués</p>
        <p class="text-xs text-slate-400 mt-0.5">+10 jours sans activité</p>
      </a>

      <a href="/v2/quotes?status=brouillon" class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-karl-300 transition">
        <div class="flex items-center justify-between mb-2">
          <span class="w-9 h-9 rounded-lg bg-karl-50 text-karl-600 flex items-center justify-center">
            <i class="fas fa-file-pen"></i>
          </span>
          <span class="text-2xl font-bold text-slate-900" data-stat="draft_quotes">—</span>
        </div>
        <p class="text-sm text-slate-600 font-medium">Devis brouillon</p>
        <p class="text-xs text-slate-400 mt-0.5">À finaliser</p>
      </a>

      <a href="/v2/quotes?status=envoye" class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-emerald-300 transition">
        <div class="flex items-center justify-between mb-2">
          <span class="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <i class="fas fa-euro-sign"></i>
          </span>
          <span class="text-2xl font-bold text-slate-900" data-stat="pending_amount_short">—</span>
        </div>
        <p class="text-sm text-slate-600 font-medium">En attente signature</p>
        <p class="text-xs text-slate-400 mt-0.5"><span data-stat="sent_quotes">—</span> devis envoyés</p>
      </a>
    </section>

    <!-- Dossiers chauds détaillés -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-slate-900 flex items-center gap-2">
          <i class="fas fa-fire text-orange-500"></i>
          Dossiers chauds
        </h3>
        <a href="/v2/pipeline" class="text-sm text-karl-600 hover:underline">Voir tout →</a>
      </div>
      <div id="hot-deals-list" class="space-y-2">
        <div class="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-400">
          Chargement...
        </div>
      </div>
    </section>

    <!-- Dossiers bloqués -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-slate-900 flex items-center gap-2">
          <i class="fas fa-triangle-exclamation text-amber-500"></i>
          Dossiers bloqués
        </h3>
      </div>
      <div id="stuck-deals-list" class="space-y-2">
        <div class="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-400">
          Chargement...
        </div>
      </div>
    </section>

  </div>`
}
