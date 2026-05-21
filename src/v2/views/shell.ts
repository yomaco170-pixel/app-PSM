/**
 * Shell HTML — wrapper commun à toutes les pages v2
 * Tailwind via CDN + design moderne, mobile-first.
 */

export type ShellOptions = {
  title: string
  body: string
  page?: string
  minimal?: boolean // si true: pas de header/nav (login)
}

export function renderShell({ title, body, page = '', minimal = false }: ShellOptions): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#0f172a">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="/v2/static/v2.css" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            karl: {
              50: '#f0f9ff',
              500: '#0ea5e9',
              600: '#0284c7',
              700: '#0369a1',
              900: '#0f172a',
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen">
  ${minimal ? '' : renderHeader(page)}
  <main class="${minimal ? '' : 'pt-16 pb-24 md:pb-8'} max-w-6xl mx-auto px-4">
    ${body}
  </main>
  ${minimal ? '' : renderBottomNav(page)}
  ${minimal ? '' : renderAIBar()}
  <script src="/v2/static/v2.js" defer></script>
</body>
</html>`
}

function renderHeader(page: string): string {
  return `
  <header class="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
      <a href="/v2" class="flex items-center gap-2 font-bold text-slate-900">
        <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-karl-500 to-karl-700 flex items-center justify-center text-white">
          <i class="fas fa-bolt text-sm"></i>
        </span>
        <span class="hidden sm:inline">KARL <span class="text-karl-600">v2</span></span>
      </a>
      <button id="ai-bar-trigger" class="flex-1 max-w-md flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-left text-sm text-slate-500">
        <i class="fas fa-wand-magic-sparkles text-karl-600"></i>
        <span>Demande à KARL...</span>
        <kbd class="hidden md:inline ml-auto text-xs px-1.5 py-0.5 rounded bg-white border border-slate-300">⌘K</kbd>
      </button>
      <div class="flex items-center gap-2">
        <button class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center" id="user-menu-btn">
          <i class="fas fa-user text-slate-600"></i>
        </button>
      </div>
    </div>
  </header>`
}

function renderBottomNav(page: string): string {
  const items = [
    { id: 'dashboard', icon: 'fa-house', label: 'Accueil', href: '/v2' },
    { id: 'pipeline', icon: 'fa-diagram-project', label: 'Pipeline', href: '/v2/pipeline' },
    { id: 'clients', icon: 'fa-users', label: 'Clients', href: '/v2/clients' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Inbox', href: '/v2/inbox' },
    { id: 'more', icon: 'fa-ellipsis', label: 'Plus', href: '/v2/more' },
  ]
  return `
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 pb-safe">
    <div class="grid grid-cols-5 h-16">
      ${items.map(it => `
        <a href="${it.href}" class="flex flex-col items-center justify-center gap-0.5 ${page === it.id ? 'text-karl-600' : 'text-slate-500'}">
          <i class="fas ${it.icon} text-lg"></i>
          <span class="text-[10px] font-medium">${it.label}</span>
        </a>
      `).join('')}
    </div>
  </nav>`
}

function renderAIBar(): string {
  return `
  <div id="ai-bar-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" onclick="if(event.target===this) this.classList.add('hidden')">
    <div class="max-w-2xl mx-auto mt-20 mx-4">
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <i class="fas fa-wand-magic-sparkles text-karl-600 text-lg"></i>
          <input id="ai-bar-input" type="text" placeholder="Créer devis Dupont, relancer Roy, dossiers chauds..."
                 class="flex-1 outline-none text-lg placeholder-slate-400" autocomplete="off">
          <button onclick="document.getElementById('ai-bar-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <div id="ai-bar-suggestions" class="max-h-96 overflow-y-auto p-2">
          <div class="text-xs uppercase tracking-wide text-slate-400 px-3 py-2">Suggestions</div>
          <button class="ai-suggestion w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-3" data-prompt="Affiche mes dossiers chauds">
            <i class="fas fa-fire text-orange-500 w-5"></i>
            <span>Affiche mes dossiers chauds</span>
          </button>
          <button class="ai-suggestion w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-3" data-prompt="Quels devis dois-je relancer ?">
            <i class="fas fa-bell text-amber-500 w-5"></i>
            <span>Quels devis dois-je relancer ?</span>
          </button>
          <button class="ai-suggestion w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-3" data-prompt="Créer devis portail coulissant 4m alu gris">
            <i class="fas fa-file-invoice text-karl-600 w-5"></i>
            <span>Créer devis portail coulissant 4m alu gris</span>
          </button>
          <button class="ai-suggestion w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-3" data-prompt="Prépare un mail de relance pour mes 3 devis en attente">
            <i class="fas fa-envelope text-blue-500 w-5"></i>
            <span>Prépare un mail de relance</span>
          </button>
        </div>
        <div id="ai-bar-result" class="hidden border-t border-slate-100 p-4 bg-slate-50">
          <div class="text-sm text-slate-700 whitespace-pre-wrap" id="ai-bar-result-text"></div>
        </div>
      </div>
    </div>
  </div>`
}
