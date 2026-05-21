/**
 * Page Dashboard V2.5 — style "cards colorées" inspiré V1, SIMPLIFIÉ
 * - Header blanc avec logo KARL + date/heure + cloche
 * - Titre "Tableau de bord" centré sur fond slate
 * - 6 grandes cards en dégradés couleurs (2 colonnes)
 * - Briefing IA dépliable
 * - PAS de section "Aujourd'hui" en dessous : tout passe par les cards
 */

export function renderDashboard(): string {
  return `
  <div id="dash" class="-mx-4">

    <!-- Bandeau date/heure (sous le header sticky) -->
    <div class="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
      <p id="dash-date" class="text-sm font-medium text-slate-700">—</p>
      <p id="dash-time" class="text-sm font-mono text-slate-700">—</p>
    </div>

    <!-- Section principale fond slate -->
    <section class="bg-slate-700 px-4 pt-6 pb-8 min-h-screen">
      <h1 class="text-3xl font-bold text-white text-center">Tableau de bord</h1>
      <p id="dash-welcome" class="text-slate-300 text-center mt-1.5 text-sm">Bienvenue —</p>

      <!-- Bouton briefing IA (dépliable) -->
      <button id="briefing-toggle" class="mt-4 mx-auto px-4 py-2 rounded-xl bg-slate-600/60 hover:bg-slate-600 text-slate-200 text-sm flex items-center gap-2 transition">
        <i class="fas fa-wand-magic-sparkles text-yellow-300"></i>
        <span>Briefing IA du jour</span>
        <i id="briefing-chevron" class="fas fa-chevron-down text-xs transition-transform"></i>
      </button>

      <!-- Briefing replié par défaut -->
      <div id="briefing-panel" class="hidden mt-3 bg-gradient-to-br from-karl-700 to-slate-900 rounded-2xl p-4 text-white shadow-lg">
        <div id="briefing-content" class="text-sm leading-relaxed whitespace-pre-wrap min-h-[60px]">
          <div class="flex items-center gap-2 text-white/70">
            <i class="fas fa-circle-notch fa-spin"></i>
            <span>KARL prépare ton briefing...</span>
          </div>
        </div>
        <button id="briefing-refresh" class="mt-2 text-xs text-white/70 hover:text-white">
          <i class="fas fa-arrows-rotate mr-1"></i>Rafraîchir
        </button>
      </div>

      <!-- Grille 6 cards colorées -->
      <div class="mt-6 grid grid-cols-2 gap-3.5">

        <!-- Pipeline : dégradé violet → bleu -->
        <a href="/v2/pipeline" class="dash-card relative overflow-hidden rounded-2xl p-4 h-32 flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition"
           style="background: linear-gradient(135deg, #7c83fd 0%, #5d68d6 100%);">
          <i class="fas fa-table-columns text-3xl mb-1.5"></i>
          <p class="font-bold text-base">Pipeline</p>
          <p class="text-xs text-white/80">Suivi des dossiers</p>
          <span data-dash-badge="pipeline" class="hidden absolute top-2 right-2 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center justify-center">0</span>
        </a>

        <!-- Clients : rose fuchsia → saumon -->
        <a href="/v2/clients" class="dash-card relative overflow-hidden rounded-2xl p-4 h-32 flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition"
           style="background: linear-gradient(135deg, #f06292 0%, #ff8a80 100%);">
          <i class="fas fa-users text-3xl mb-1.5"></i>
          <p class="font-bold text-base">Clients</p>
          <p class="text-xs text-white/80">Gestion contacts</p>
          <span data-dash-badge="clients" class="hidden absolute top-2 right-2 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center justify-center">0</span>
        </a>

        <!-- Devis : cyan → turquoise -->
        <a href="/v2/quotes" class="dash-card relative overflow-hidden rounded-2xl p-4 h-32 flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition"
           style="background: linear-gradient(135deg, #4dd0e1 0%, #0097a7 100%);">
          <i class="fas fa-file-invoice-dollar text-3xl mb-1.5"></i>
          <p class="font-bold text-base">Devis</p>
          <p class="text-xs text-white/80">Propositions</p>
          <span data-dash-badge="devis" class="hidden absolute top-2 right-2 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center justify-center">0</span>
        </a>

        <!-- Aujourd'hui : vert menthe → vert turquoise → /v2/today -->
        <a href="/v2/today" class="dash-card relative overflow-hidden rounded-2xl p-4 h-32 flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition"
           style="background: linear-gradient(135deg, #80e8b6 0%, #00bfa5 100%);">
          <i class="fas fa-list-check text-3xl mb-1.5"></i>
          <p class="font-bold text-base">Aujourd'hui</p>
          <p class="text-xs text-white/80">Actions du jour</p>
          <span data-dash-badge="today" class="hidden absolute top-2 right-2 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center justify-center">0</span>
        </a>

        <!-- Mails : bleu pâle → bleu -->
        <a href="/v2/inbox" class="dash-card relative overflow-hidden rounded-2xl p-4 h-32 flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition"
           style="background: linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%);">
          <i class="fas fa-envelope text-3xl mb-1.5 text-white drop-shadow"></i>
          <p class="font-bold text-base text-white drop-shadow">Mails</p>
          <p class="text-xs text-white/90">Inbox client</p>
          <span data-dash-badge="mails" class="hidden absolute top-2 right-2 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center justify-center">0</span>
        </a>

        <!-- Paramètres : orange pêche → corail -->
        <a href="/v2/more" class="dash-card relative overflow-hidden rounded-2xl p-4 h-32 flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition"
           style="background: linear-gradient(135deg, #ffb74d 0%, #ff7043 100%);">
          <i class="fas fa-gear text-3xl mb-1.5"></i>
          <p class="font-bold text-base">Paramètres</p>
          <p class="text-xs text-white/80">Profil & mode</p>
        </a>

      </div>
    </section>

    <!-- Bouton flottant IA (FAB) -->
    <button id="ai-fab" aria-label="Assistant IA"
      class="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-30 w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center active:scale-95 transition"
      style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
      <i class="fas fa-robot text-xl"></i>
    </button>

  </div>`
}
