/**
 * KARL CRM v2 — Frontend JavaScript (vanilla)
 * Gère toutes les pages v2 via routing par URL.
 */

(function () {
  'use strict';

  // ============================================================
  // Auth & API helpers
  // ============================================================
  const TOKEN_KEY = 'karl_v2_token';
  const USER_KEY = 'karl_v2_user';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } };
  const logout = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); window.location.href = '/v2/login'; };

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
    if (res.status === 401) { logout(); return null; }
    return res.json();
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function formatShortAmount(n) {
    if (!n) return '0€';
    if (n >= 1000) return Math.round(n / 100) / 10 + 'k€';
    return Math.round(n) + '€';
  }

  function formatAmount(n) {
    if (!n) return '0 €';
    return Math.round(n).toLocaleString('fr-FR') + ' €';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function formatRelative(iso) {
    if (!iso) return '—';
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} j`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`;
    return formatDate(iso);
  }

  // ============================================================
  // Routing
  // ============================================================
  const path = window.location.pathname;

  if (path !== '/v2/login' && !getToken()) {
    window.location.href = '/v2/login';
    return;
  }

  // ============================================================
  // Dashboard
  // ============================================================
  async function loadDashboard() {
    const dash = await api('/v2/api/dashboard');
    if (!dash || dash.error) return;
    setStat('hot_deals', dash.stats.hot_deals);
    setStat('stuck_deals', dash.stats.stuck_deals);
    setStat('draft_quotes', dash.stats.draft_quotes);
    setStat('sent_quotes', dash.stats.sent_quotes);
    setStat('pending_amount_short', formatShortAmount(dash.stats.pending_amount));
    renderDealsList('hot-deals-list', dash.hot_deals, 'orange');
    renderDealsList('stuck-deals-list', dash.stuck_deals, 'amber');
  }

  function setStat(name, value) {
    document.querySelectorAll(`[data-stat="${name}"]`).forEach(el => { el.textContent = value; });
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
      <a href="/v2/deal/${d.id}" class="block bg-white rounded-xl p-4 border border-slate-200 hover:border-${color}-300 transition">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h4 class="font-medium text-slate-900 truncate">${escapeHtml(d.title || 'Sans titre')}</h4>
            <p class="text-sm text-slate-500 truncate">${escapeHtml(d.client_name || 'Client inconnu')}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-slate-900">${formatShortAmount(d.amount || 0)}</p>
            <p class="text-xs text-slate-400">${escapeHtml(d.stage || '—')}</p>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="text-xs px-2.5 py-1 rounded-lg bg-karl-50 text-karl-700 hover:bg-karl-100" onclick="event.stopPropagation(); event.preventDefault(); karlSummarize(${d.id})">
            <i class="fas fa-wand-magic-sparkles mr-1"></i>Résumer
          </button>
          ${d.client_phone ? `<a href="tel:${d.client_phone}" onclick="event.stopPropagation()" class="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            <i class="fas fa-phone mr-1"></i>${escapeHtml(d.client_phone)}
          </a>` : ''}
        </div>
      </a>
    `).join('');
  }

  async function loadBriefing() {
    const el = document.getElementById('briefing-content');
    if (!el) return;
    const data = await api('/v2/api/briefing');
    if (!data) return;
    el.textContent = data.briefing || 'Aucun briefing disponible.';
  }

  // ============================================================
  // Pipeline (Kanban)
  // ============================================================
  async function loadPipeline() {
    const data = await api('/v2/api/pipeline');
    if (!data || data.error) return;
    const board = document.getElementById('kanban-board');
    if (!board) return;

    const search = (document.getElementById('pipeline-search')?.value || '').toLowerCase();
    const urlFilter = new URLSearchParams(window.location.search).get('filter');

    board.innerHTML = (data.stages || []).map(stage => {
      let deals = stage.deals || [];
      if (search) {
        deals = deals.filter(d =>
          (d.title || '').toLowerCase().includes(search) ||
          (d.client_name || '').toLowerCase().includes(search)
        );
      }
      if (urlFilter === 'hot' && !['devis_envoye','relance'].includes(stage.id)) return '';
      if (urlFilter === 'stuck') {
        const now = Date.now();
        deals = deals.filter(d => {
          const updated = new Date(d.updated_at || d.created_at).getTime();
          return (now - updated) / 86400000 > 10;
        });
        if (deals.length === 0) return '';
      }

      const colorMap = {
        slate: 'border-slate-300 bg-slate-50',
        blue: 'border-blue-300 bg-blue-50',
        amber: 'border-amber-300 bg-amber-50',
        orange: 'border-orange-300 bg-orange-50',
        red: 'border-red-300 bg-red-50',
        emerald: 'border-emerald-300 bg-emerald-50',
      };
      return `
        <div class="flex-shrink-0 w-72 md:w-auto">
          <div class="rounded-t-xl px-3 py-2 ${colorMap[stage.color] || 'border-slate-300 bg-slate-50'} border-t border-x">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-slate-900 text-sm">${escapeHtml(stage.label)}</h3>
              <span class="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200">${deals.length}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">${formatAmount(stage.total_amount || 0)}</p>
          </div>
          <div class="rounded-b-xl border border-slate-200 bg-white p-2 space-y-2 min-h-[200px]">
            ${deals.length === 0
              ? `<p class="text-xs text-slate-400 text-center py-6">—</p>`
              : deals.map(d => `
                <a href="/v2/deal/${d.id}" class="block bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg p-2.5 transition">
                  <p class="text-sm font-medium text-slate-900 truncate">${escapeHtml(d.title || 'Sans titre')}</p>
                  <p class="text-xs text-slate-500 truncate">${escapeHtml(d.client_name || '—')}</p>
                  <div class="flex items-center justify-between mt-1.5">
                    <span class="text-xs font-semibold text-slate-700">${formatShortAmount(d.amount || 0)}</span>
                    <span class="text-[10px] text-slate-400">${formatRelative(d.updated_at || d.created_at)}</span>
                  </div>
                </a>
              `).join('')
            }
          </div>
        </div>
      `;
    }).filter(Boolean).join('') || '<p class="text-slate-400 py-8 text-center">Aucun dossier ne correspond.</p>';
  }

  function setupPipeline() {
    document.getElementById('pipeline-search')?.addEventListener('input', () => {
      loadPipeline();
    });
    document.getElementById('new-deal-btn')?.addEventListener('click', () => {
      alert('Création de dossier — à brancher dans la prochaine étape.\nEn attendant, utilise la barre IA (⌘K) ou la v1.');
    });
  }

  // ============================================================
  // Clients
  // ============================================================
  async function loadClients(searchTerm) {
    const url = searchTerm ? `/v2/api/clients?q=${encodeURIComponent(searchTerm)}` : '/v2/api/clients';
    const data = await api(url);
    if (!data || data.error) return;

    document.querySelector('[data-cstat="total"]').textContent = data.stats.total;
    document.querySelector('[data-cstat="leads"]').textContent = data.stats.leads;
    document.querySelector('[data-cstat="clients"]').textContent = data.stats.clients;

    const list = document.getElementById('clients-list');
    if (!data.clients || data.clients.length === 0) {
      list.innerHTML = `<div class="bg-white rounded-xl p-6 border border-slate-200 text-center text-sm text-slate-400">
        <i class="fas fa-user-slash text-3xl mb-2 text-slate-300"></i>
        <p>Aucun client trouvé.</p>
      </div>`;
      return;
    }
    list.innerHTML = data.clients.map(c => `
      <div class="bg-white rounded-xl p-3 border border-slate-200 hover:border-karl-300 transition">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-karl-100 text-karl-700 font-bold flex items-center justify-center flex-shrink-0">
            ${escapeHtml((c.name || '?').charAt(0).toUpperCase())}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-slate-900 truncate">${escapeHtml(c.name || 'Sans nom')}</p>
            <p class="text-xs text-slate-500 truncate">
              ${c.phone ? `<i class="fas fa-phone mr-1"></i>${escapeHtml(c.phone)}` : ''}
              ${c.email ? `<i class="fas fa-envelope ml-2 mr-1"></i>${escapeHtml(c.email)}` : ''}
            </p>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full ${c.status === 'lead' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}">
            ${escapeHtml(c.status || 'client')}
          </span>
        </div>
        <div class="mt-2 flex gap-2">
          ${c.phone ? `<a href="tel:${c.phone}" class="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700"><i class="fas fa-phone mr-1"></i>Appeler</a>` : ''}
          ${c.email ? `<a href="mailto:${c.email}" class="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700"><i class="fas fa-envelope mr-1"></i>Email</a>` : ''}
        </div>
      </div>
    `).join('');
  }

  function setupClients() {
    let timer;
    document.getElementById('clients-search')?.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => loadClients(e.target.value.trim()), 250);
    });
    document.getElementById('new-client-btn')?.addEventListener('click', () => {
      const name = prompt('Nom du nouveau client :');
      if (!name) return;
      api('/v2/api/command', {
        method: 'POST',
        body: JSON.stringify({ input: `Créer client ${name}` }),
      }).then(() => loadClients());
    });
  }

  // ============================================================
  // Deal Detail + Timeline
  // ============================================================
  async function loadDealDetail() {
    const page = document.getElementById('deal-detail-page');
    if (!page) return;
    const dealId = page.dataset.dealId;

    const data = await api(`/v2/api/deal/${dealId}`);
    if (!data || data.error) {
      page.innerHTML = `<div class="text-red-600 p-4 bg-red-50 rounded-xl">${escapeHtml(data?.error || 'Dossier introuvable')}</div>`;
      return;
    }

    const d = data.deal;
    document.getElementById('deal-title').textContent = d.title || 'Sans titre';
    document.getElementById('deal-client').textContent = d.client_name || 'Client inconnu';
    document.getElementById('deal-stage').textContent = d.stage || '—';
    document.getElementById('deal-amount').textContent = formatAmount(d.amount || 0);
    document.getElementById('deal-proba').textContent = (d.probability || 0) + ' %';
    document.getElementById('deal-updated').textContent = formatRelative(d.updated_at || d.created_at);

    const contact = document.getElementById('deal-contact');
    contact.innerHTML = '';
    if (d.client_phone) contact.innerHTML += `<a href="tel:${d.client_phone}" class="flex-1 text-center text-sm px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700"><i class="fas fa-phone mr-1"></i>${escapeHtml(d.client_phone)}</a>`;
    if (d.client_email) contact.innerHTML += `<a href="mailto:${d.client_email}" class="flex-1 text-center text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700"><i class="fas fa-envelope mr-1"></i>Email</a>`;

    // Boutons actions IA
    document.querySelectorAll('.ai-action-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        await runDealAction(dealId, action);
      });
    });

    loadTimeline(dealId);
  }

  async function loadTimeline(dealId) {
    const el = document.getElementById('timeline');
    if (!el) return;
    const data = await api(`/v2/api/deal/${dealId}/timeline`);
    if (!data || !data.timeline) {
      el.innerHTML = '<p class="text-slate-400 text-sm">Pas d\'historique.</p>';
      return;
    }
    const events = data.timeline;
    if (events.length === 0) {
      el.innerHTML = '<p class="text-slate-400 text-sm">Pas encore d\'événement.</p>';
      return;
    }
    const colorBg = { slate: 'bg-slate-100 text-slate-600', blue: 'bg-blue-100 text-blue-600', karl: 'bg-karl-50 text-karl-700', amber: 'bg-amber-100 text-amber-700', emerald: 'bg-emerald-100 text-emerald-700' };
    el.innerHTML = events.map((ev, i) => `
      <div class="flex gap-3">
        <div class="flex flex-col items-center">
          <div class="w-9 h-9 rounded-full ${colorBg[ev.color] || 'bg-slate-100 text-slate-600'} flex items-center justify-center flex-shrink-0">
            <i class="fas ${ev.icon}"></i>
          </div>
          ${i < events.length - 1 ? '<div class="w-0.5 flex-1 bg-slate-200 mt-1"></div>' : ''}
        </div>
        <div class="flex-1 pb-4">
          <p class="font-medium text-sm text-slate-900">${escapeHtml(ev.title)}</p>
          ${ev.description ? `<p class="text-xs text-slate-500 mt-0.5">${escapeHtml(ev.description)}</p>` : ''}
          <p class="text-[10px] text-slate-400 mt-1">${formatRelative(ev.at)}</p>
        </div>
      </div>
    `).join('');
  }

  async function runDealAction(dealId, action) {
    const zone = document.getElementById('ai-result-zone');
    const title = document.getElementById('ai-result-title');
    const content = document.getElementById('ai-result-content');
    const actions = document.getElementById('ai-result-actions');

    zone.classList.remove('hidden');
    actions.classList.add('hidden');
    actions.innerHTML = '';

    const labels = {
      summary: 'Résumé du dossier',
      followup: 'Email de relance',
      quote: 'Devis suggéré',
      check: 'Vérification anti-erreurs',
    };
    title.textContent = labels[action] || 'Résultat IA';
    content.innerHTML = '<i class="fas fa-circle-notch fa-spin text-karl-600"></i> KARL réfléchit…';

    try {
      if (action === 'summary') {
        const r = await api(`/v2/api/deal/${dealId}/summary`);
        content.textContent = r?.summary || r?.error || 'Erreur';
      } else if (action === 'followup') {
        const r = await api(`/v2/api/deal/${dealId}/followup`);
        if (r?.subject) {
          content.innerHTML = `<p class="font-semibold mb-2">Objet : ${escapeHtml(r.subject)}</p><div class="whitespace-pre-wrap">${escapeHtml(r.body)}</div>`;
          actions.innerHTML = `
            ${r.client_email ? `<a href="mailto:${r.client_email}?subject=${encodeURIComponent(r.subject)}&body=${encodeURIComponent(r.body)}" class="px-3 py-1.5 rounded-lg bg-karl-600 text-white text-sm font-medium"><i class="fas fa-paper-plane mr-1"></i>Envoyer par mail</a>` : ''}
            <button onclick="navigator.clipboard.writeText(this.dataset.text); this.innerHTML='<i class=\\'fas fa-check mr-1\\'></i>Copié'" data-text="${escapeHtml(r.body)}" class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm"><i class="fas fa-copy mr-1"></i>Copier</button>
          `;
          actions.classList.remove('hidden');
        } else {
          content.textContent = r?.error || 'Erreur IA';
        }
      } else if (action === 'check') {
        const r = await api(`/v2/api/deal/${dealId}/check`);
        if (r?.ok) {
          content.innerHTML = '<i class="fas fa-check-circle text-emerald-500 text-2xl"></i><p class="mt-2">Tout est bon, aucun problème détecté sur ce dossier.</p>';
        } else {
          content.innerHTML = (r?.issues || []).map(i => `
            <div class="flex items-start gap-2 py-1">
              <i class="fas ${i.level === 'error' ? 'fa-circle-xmark text-red-500' : i.level === 'warning' ? 'fa-triangle-exclamation text-amber-500' : 'fa-circle-info text-blue-500'}"></i>
              <span>${escapeHtml(i.message)}</span>
            </div>
          `).join('');
        }
      } else if (action === 'quote') {
        content.innerHTML = `<p>Création de devis IA — bientôt disponible.</p>
        <p class="text-xs text-slate-500 mt-2">Pour l'instant, va sur la v1 pour créer le devis manuellement, ou utilise la barre IA (⌘K).</p>`;
      }
    } catch (e) {
      content.textContent = e.message;
    }
  }

  // ============================================================
  // Quotes page
  // ============================================================
  async function loadQuotes(status) {
    const url = status && status !== 'all' ? `/v2/api/quotes?status=${status}` : '/v2/api/quotes';
    const data = await api(url);
    if (!data) return;

    document.querySelector('[data-qstat="pending"]').textContent = formatAmount(data.stats?.pending || 0);
    document.querySelector('[data-qstat="signed"]').textContent = formatAmount(data.stats?.signed_month || 0);

    const list = document.getElementById('quotes-list');
    const quotes = data.quotes || [];
    if (quotes.length === 0) {
      list.innerHTML = `<div class="bg-white rounded-xl p-6 border border-slate-200 text-center text-sm text-slate-400">
        <i class="fas fa-file-circle-xmark text-3xl mb-2 text-slate-300"></i>
        <p>Aucun devis dans cette catégorie.</p>
      </div>`;
      return;
    }
    const statusColor = {
      brouillon: 'bg-slate-100 text-slate-700',
      envoye: 'bg-amber-100 text-amber-700',
      envoyé: 'bg-amber-100 text-amber-700',
      signe: 'bg-emerald-100 text-emerald-700',
      signé: 'bg-emerald-100 text-emerald-700',
      refuse: 'bg-red-100 text-red-700',
      refusé: 'bg-red-100 text-red-700',
    };
    list.innerHTML = quotes.map(q => `
      <div class="bg-white rounded-xl p-3 border border-slate-200">
        <div class="flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <p class="font-medium text-slate-900">${escapeHtml(q.number || '—')}</p>
            <p class="text-xs text-slate-500 truncate">${escapeHtml(q.client_name || q.deal_title || 'Sans client')}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-slate-900">${formatAmount(q.total_ttc || 0)}</p>
            <span class="text-[10px] px-2 py-0.5 rounded-full ${statusColor[q.status] || 'bg-slate-100 text-slate-700'}">${escapeHtml(q.status || '?')}</span>
          </div>
        </div>
        ${q.deal_id ? `<a href="/v2/deal/${q.deal_id}" class="text-xs text-karl-600 hover:underline mt-1 inline-block">Voir le dossier →</a>` : ''}
      </div>
    `).join('');
  }

  function setupQuotes() {
    document.querySelectorAll('.qstatus-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.qstatus-btn').forEach(b => {
          b.classList.remove('bg-karl-600', 'text-white');
          b.classList.add('bg-white', 'border', 'border-slate-200');
        });
        btn.classList.add('bg-karl-600', 'text-white');
        btn.classList.remove('bg-white', 'border', 'border-slate-200');
        loadQuotes(btn.dataset.status);
      });
    });
    document.getElementById('new-quote-btn')?.addEventListener('click', () => {
      alert('Création de devis — utilise la v1 pour l\'instant (création complète) ou la barre IA (⌘K).');
    });
  }

  // ============================================================
  // Inbox
  // ============================================================
  async function loadInbox() {
    const list = document.getElementById('emails-list');
    const connect = document.getElementById('gmail-connect');
    if (!list) return;

    // Récupère le token Gmail depuis l'app v1 (localStorage clé partagée)
    const gmailToken =
      localStorage.getItem('gmail_access_token') ||
      localStorage.getItem('google_access_token') ||
      sessionStorage.getItem('gmail_access_token');

    if (!gmailToken) {
      list.innerHTML = '';
      connect?.classList.remove('hidden');
      return;
    }

    connect?.classList.add('hidden');
    list.innerHTML = '<div class="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-400">Chargement des emails…</div>';

    const data = await api(`/v2/api/inbox?gmail_token=${encodeURIComponent(gmailToken)}`);
    if (!data || data.error) {
      list.innerHTML = `<div class="text-red-600 text-sm p-4 bg-red-50 rounded-xl">${escapeHtml(data?.error || 'Erreur')}</div>`;
      return;
    }
    const emails = data.emails || [];
    if (emails.length === 0) {
      list.innerHTML = '<div class="bg-white rounded-xl p-6 border border-slate-200 text-center text-sm text-slate-400"><i class="fas fa-inbox text-3xl mb-2 text-slate-300"></i><p>Boîte vide.</p></div>';
      return;
    }
    list.innerHTML = emails.slice(0, 30).map((e, i) => `
      <div class="bg-white rounded-xl p-3 border border-slate-200 hover:border-karl-300 cursor-pointer" onclick="toggleEmail(${i})">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-envelope"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="font-medium text-sm text-slate-900 truncate">${escapeHtml(e.from || e.sender || 'Inconnu')}</p>
              <span class="text-[10px] text-slate-400 flex-shrink-0">${formatRelative(e.date || e.received_at)}</span>
            </div>
            <p class="text-sm text-slate-700 truncate">${escapeHtml(e.subject || '(sans objet)')}</p>
            <p class="text-xs text-slate-500 truncate mt-0.5">${escapeHtml((e.snippet || e.body || '').slice(0, 100))}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  function setupInbox() {
    document.getElementById('inbox-refresh')?.addEventListener('click', loadInbox);
    document.querySelectorAll('.inbox-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.inbox-cat-btn').forEach(b => {
          b.classList.remove('bg-karl-600', 'text-white');
          b.classList.add('bg-white', 'border', 'border-slate-200');
        });
        btn.classList.add('bg-karl-600', 'text-white');
        btn.classList.remove('bg-white', 'border', 'border-slate-200');
      });
    });
  }

  // ============================================================
  // More / Settings
  // ============================================================
  async function loadMore() {
    const user = getUser();
    if (user) {
      document.getElementById('user-name').textContent = user.name || '—';
      document.getElementById('user-email').textContent = user.email || '—';
      document.getElementById('user-avatar').textContent = (user.name || '?').charAt(0).toUpperCase();
    }
    const health = await api('/v2/api/health');
    const txt = document.getElementById('ai-status-text');
    if (health?.ai_configured) {
      txt.innerHTML = '<span class="text-emerald-600"><i class="fas fa-check-circle mr-1"></i>IA active (gpt-5-mini)</span>';
    } else {
      txt.innerHTML = '<span class="text-amber-600"><i class="fas fa-triangle-exclamation mr-1"></i>IA non configurée</span>';
    }

    const toggle = document.getElementById('chantier-toggle');
    const saved = localStorage.getItem('karl_v2_chantier') === '1';
    if (saved) {
      toggle.checked = true;
      document.body.setAttribute('data-mode', 'chantier');
    }
    toggle?.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.setAttribute('data-mode', 'chantier');
        localStorage.setItem('karl_v2_chantier', '1');
      } else {
        document.body.removeAttribute('data-mode');
        localStorage.removeItem('karl_v2_chantier');
      }
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      if (confirm('Se déconnecter ?')) logout();
    });
  }

  // Mode chantier au load
  if (localStorage.getItem('karl_v2_chantier') === '1') {
    document.body.setAttribute('data-mode', 'chantier');
  }

  // ============================================================
  // AI bar globale
  // ============================================================
  function setupAIBar() {
    const trigger = document.getElementById('ai-bar-trigger');
    const modal = document.getElementById('ai-bar-modal');
    const input = document.getElementById('ai-bar-input');
    const resultBox = document.getElementById('ai-bar-result');
    const resultText = document.getElementById('ai-bar-result-text');

    if (!trigger || !modal) return;

    const open = () => { modal.classList.remove('hidden'); setTimeout(() => input?.focus(), 50); };
    const close = () => { modal.classList.add('hidden'); input.value = ''; resultBox.classList.add('hidden'); };

    trigger.addEventListener('click', open);

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); }
      if (e.key === 'Escape') close();
    });

    document.querySelectorAll('.ai-suggestion').forEach(btn => {
      btn.addEventListener('click', () => { input.value = btn.dataset.prompt; runCommand(input.value); });
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) runCommand(input.value.trim());
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
        const executed = data.executed;
        let nav = '';
        if (result.action === 'show_hot_deals') nav = '/v2/pipeline?filter=hot';
        else if (result.action === 'show_stuck_deals') nav = '/v2/pipeline?filter=stuck';
        else if (result.action === 'show_dashboard') nav = '/v2';
        else if (result.action === 'open_deal' && result.matched_deal_id) nav = `/v2/deal/${result.matched_deal_id}`;
        else if (result.navigate_to) nav = result.navigate_to;

        resultText.innerHTML = `
          <div class="space-y-2">
            <p class="font-medium">${escapeHtml(result.human_response || 'OK')}</p>
            ${executed ? `<p class="text-xs text-emerald-600"><i class="fas fa-check mr-1"></i>${escapeHtml(JSON.stringify(executed))}</p>` : ''}
            <div class="text-xs text-slate-500">
              <strong>Action:</strong> ${escapeHtml(result.action || '')}
              ${result.matched_client_id ? ` · Client #${result.matched_client_id}` : ''}
              ${result.matched_deal_id ? ` · Dossier #${result.matched_deal_id}` : ''}
            </div>
            ${nav ? `<a href="${nav}" class="inline-block px-3 py-1.5 rounded-lg bg-karl-600 text-white text-sm font-medium"><i class="fas fa-arrow-right mr-1"></i>Y aller</a>` : ''}
          </div>
        `;
        if (nav && !result.needs_confirmation) {
          setTimeout(() => { window.location.href = nav; }, 800);
        }
      } catch (err) {
        resultText.innerHTML = `<span class="text-red-600">${err.message}</span>`;
      }
    }
  }

  // ============================================================
  // Résumer un dossier (popup)
  // ============================================================
  window.karlSummarize = async function (dealId) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 pt-20';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div class="flex items-center gap-2"><i class="fas fa-wand-magic-sparkles text-karl-600"></i><h3 class="font-semibold">Résumé IA du dossier</h3></div>
          <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="p-4 text-sm whitespace-pre-wrap text-slate-700 min-h-[120px]" id="summary-content">
          <i class="fas fa-circle-notch fa-spin text-karl-600"></i> Génération…
        </div>
        <div class="px-4 pb-4">
          <a href="/v2/deal/${dealId}" class="block text-center px-3 py-2 rounded-lg bg-karl-600 text-white text-sm font-medium">Ouvrir le dossier complet →</a>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    try {
      const data = await api(`/v2/api/deal/${dealId}/summary`);
      const el = overlay.querySelector('#summary-content');
      if (data?.summary) el.textContent = data.summary;
      else el.innerHTML = `<span class="text-red-600">${escapeHtml(data?.error || 'Erreur')}</span>`;
    } catch (e) {
      overlay.querySelector('#summary-content').textContent = e.message;
    }
  };

  // ============================================================
  // Init
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    setupAIBar();

    document.getElementById('user-menu-btn')?.addEventListener('click', () => {
      window.location.href = '/v2/more';
    });

    if (document.getElementById('dash')) {
      loadDashboard();
      loadBriefing();
      document.getElementById('briefing-refresh')?.addEventListener('click', loadBriefing);
    }
    if (document.getElementById('pipeline-page')) {
      setupPipeline();
      loadPipeline();
    }
    if (document.getElementById('clients-page')) {
      setupClients();
      loadClients();
    }
    if (document.getElementById('deal-detail-page')) {
      loadDealDetail();
    }
    if (document.getElementById('quotes-page')) {
      setupQuotes();
      loadQuotes();
    }
    if (document.getElementById('inbox-page')) {
      setupInbox();
      loadInbox();
    }
    if (document.getElementById('more-page')) {
      loadMore();
    }
  });
})();
