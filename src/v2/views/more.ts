/**
 * Page Plus v2 — paramètres, mode chantier, déconnexion, infos
 */

export function renderMore(): string {
  return `
  <div id="more-page" class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-900">Plus</h1>

    <!-- Profil -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-karl-500 to-karl-700 text-white flex items-center justify-center font-bold text-lg" id="user-avatar">?</div>
        <div class="flex-1">
          <p class="font-semibold text-slate-900" id="user-name">—</p>
          <p class="text-sm text-slate-500" id="user-email">—</p>
        </div>
      </div>
    </div>

    <!-- Mode chantier -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-slate-900">Mode chantier</p>
          <p class="text-xs text-slate-500">Gros boutons, contraste fort, usage une main</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="chantier-toggle" class="sr-only peer">
          <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-karl-600"></div>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
      <a href="/" class="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50">
        <span class="flex items-center gap-3"><i class="fas fa-arrow-left text-slate-500 w-5"></i>Retour à la v1</span>
        <i class="fas fa-chevron-right text-slate-300"></i>
      </a>
      <button id="logout-btn" class="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 text-left">
        <span class="flex items-center gap-3 text-red-600"><i class="fas fa-right-from-bracket w-5"></i>Déconnexion</span>
        <i class="fas fa-chevron-right text-slate-300"></i>
      </button>
    </div>

    <!-- Statut IA -->
    <div id="ai-status" class="bg-white rounded-2xl p-4 border border-slate-200">
      <p class="text-sm font-medium text-slate-900 mb-2">Statut IA</p>
      <p class="text-xs text-slate-500" id="ai-status-text">Vérification...</p>
    </div>

    <p class="text-center text-xs text-slate-400 py-4">KARL CRM v2.0 — Assistant IA Artisans</p>
  </div>`
}
