/**
 * KARL CRM v2 — Frontend JavaScript
 * Aucune dépendance, vanilla JS moderne.
 */

(function () {
  'use strict';

  // ============================================================
  // Auth helpers
  // ============================================================
  const TOKEN_KEY = 'karl_v2_token';
  const USER_KEY = 'karl_v2_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
  function logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); window.location.href = '/v2/login'; }

  async function api(path, options = {}) {
    const token = getToken();
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      logout();
      return null;
    }
    return res.json();
  }

  // ============================================================
  // Redirect login if no token
  // ============================================================
  const path = window.location.pathname;
  if (path !== '/v2/login' && !getToken()) {
    window.location.href = '/v2/login';
    return;
  }

  // ============================================================
  // Dashboard logic
  // ============================================================
  async function loadDashboard() {
    const dash = await api('/v2/api/dashboard');
    if (!dash || dash.error) return;

    // Stats
    setStat('hot_deals', dash.stats.hot_deals);
    setStat('stuck_deals', dash.stats.stuck_deals);
    setStat('draft_quotes', dash.stats.draft_quotes);
    setStat('sent_quotes', dash.stats.sent_quotes);
    setStat('pending_amount_short', formatShortAmount(dash.stats.pending_amount));

    // Hot deals
    renderDealsList('hot-deals-list', dash.hot_deals, 'orange');
    renderDealsList('stuck-deals-list', dash.stuck_deals, 'amber');
  }

  function setStat(name, value) {
    document.querySelectorAll(`[data-stat="${name}"]`).forEach(el => {
      el.textContent = value;
    });
  }

  function formatShortAmount(n) {
    if (!n) return '0€';
    if (n >= 1000) return Math.round(n / 100) / 10 + 'k€';
    return Math.round(n) + '€';
  }

  function renderDealsList(containerId, deals, color) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!deals || deals.length === 0) {
      el.innerHTML = `<div class="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-400">
        <i class="fas fa-check-circle text-emerald-500 mr-2"></i>Rien à signaler ici.
      </div>`;
      return;
    }
    el.innerHTML = deals.map(d => `
      <div class="bg-white rounded-xl p-4 border border-slate-200 hover:border-${color}-300 transition cursor-pointer" data-deal-id="${d.id}">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h4 class="font-medium text-slate-900 truncate">${escapeHtml(d.title || 'Sans titre')}</h4>
            <p class="text-sm text-slate-500 truncate">${escapeHtml(d.client_name || 'Client inconnu')}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-slate-900">${formatShortAmount(d.amount || 0)}</p>
            <p class="text-xs text-slate-400">${d.stage || '—'}</p>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="text-xs px-2.5 py-1 rounded-lg bg-karl-50 text-karl-700 hover:bg-karl-100" onclick="event.stopPropagation(); karlSummarize(${d.id})">
            <i class="fas fa-wand-magic-sparkles mr-1"></i>Résumer
          </button>
          ${d.client_phone ? `<a href="tel:${d.client_phone}" onclick="event.stopPropagation()" class="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            <i class="fas fa-phone mr-1"></i>Appeler
          </a>` : ''}
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ============================================================
  // Briefing IA
  // ============================================================
  async function loadBriefing() {
    const el = document.getElementById('briefing-content');
    if (!el) return;
    const data = await api('/v2/api/briefing');
    if (!data) return;
    el.textContent = data.briefing || 'Aucun briefing disponible.';
  }

  // ============================================================
  // Barre IA globale
  // ============================================================
  function setupAIBar() {
    const trigger = document.getElementById('ai-bar-trigger');
    const modal = document.getElementById('ai-bar-modal');
    const input = document.getElementById('ai-bar-input');
    const resultBox = document.getElementById('ai-bar-result');
    const resultText = document.getElementById('ai-bar-result-text');

    if (!trigger || !modal) return;

    const open = () => {
      modal.classList.remove('hidden');
      setTimeout(() => input?.focus(), 50);
    };
    const close = () => {
      modal.classList.add('hidden');
      input.value = '';
      resultBox.classList.add('hidden');
    };

    trigger.addEventListener('click', open);

    // ⌘K / Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
      if (e.key === 'Escape') close();
    });

    // Suggestions
    document.querySelectorAll('.ai-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.prompt;
        runCommand(input.value);
      });
    });

    // Submit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        runCommand(input.value.trim());
      }
    });

    async function runCommand(text) {
      resultBox.classList.remove('hidden');
      resultText.innerHTML = `<i class="fas fa-circle-notch fa-spin text-karl-600"></i> KARL réfléchit...`;
      try {
        const r = await fetch('/v2/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ input: text }),
        });
        const data = await r.json();
        if (!r.ok) {
          resultText.innerHTML = `<span class="text-red-600">${escapeHtml(data.error || 'Erreur IA')}</span>`;
          return;
        }
        const result = data.result || {};
        resultText.innerHTML = `
          <div class="space-y-2">
            <p class="font-medium">${escapeHtml(result.human_response || 'OK')}</p>
            <div class="text-xs text-slate-500">
              <strong>Action:</strong> ${escapeHtml(result.action || '')}
              ${result.matched_client_id ? ` · Client #${result.matched_client_id}` : ''}
              ${result.matched_deal_id ? ` · Dossier #${result.matched_deal_id}` : ''}
            </div>
          </div>
        `;
      } catch (err) {
        resultText.innerHTML = `<span class="text-red-600">${err.message}</span>`;
      }
    }
  }

  // ============================================================
  // Résumer un dossier (bouton IA)
  // ============================================================
  window.karlSummarize = async function (dealId) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 pt-20';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <i class="fas fa-wand-magic-sparkles text-karl-600"></i>
            <h3 class="font-semibold">Résumé IA du dossier</h3>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <div class="p-4 text-sm whitespace-pre-wrap text-slate-700 min-h-[120px]" id="summary-content">
          <i class="fas fa-circle-notch fa-spin text-karl-600"></i> Génération du résumé...
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    try {
      const data = await api(`/v2/api/deal/${dealId}/summary`);
      const el = overlay.querySelector('#summary-content');
      if (data?.summary) {
        el.textContent = data.summary;
      } else {
        el.innerHTML = `<span class="text-red-600">${escapeHtml(data?.error || 'Erreur')}</span>`;
      }
    } catch (e) {
      overlay.querySelector('#summary-content').textContent = e.message;
    }
  };

  // ============================================================
  // Init
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    setupAIBar();

    // User menu
    const userMenuBtn = document.getElementById('user-menu-btn');
    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', () => {
        if (confirm('Déconnexion ?')) logout();
      });
    }

    // Page-specific
    if (document.getElementById('dash')) {
      loadDashboard();
      loadBriefing();
      document.getElementById('briefing-refresh')?.addEventListener('click', loadBriefing);
    }
  });
})();
