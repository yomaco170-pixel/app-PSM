/**
 * KARL CRM v2 - Sous-application Hono
 *
 * Toutes les routes v2 sont montées sur /v2/* et /v2/api/*
 * Indépendantes de l'app v1 — pas d'interférence avec l'existant.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getAI } from './ai'
import { renderShell } from './views/shell'
import { renderDashboard } from './views/dashboard'
import { renderLogin } from './views/login'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

const v2 = new Hono<{ Bindings: Bindings }>()

v2.use('/api/*', cors())

// ============================================================
// PAGES (HTML)
// ============================================================

v2.get('/', (c) => {
  return c.html(renderShell({
    title: 'KARL CRM v2 — Assistant IA Artisans',
    body: renderDashboard(),
    page: 'dashboard',
  }))
})

v2.get('/login', (c) => {
  return c.html(renderShell({
    title: 'KARL CRM v2 — Connexion',
    body: renderLogin(),
    page: 'login',
    minimal: true,
  }))
})

// ============================================================
// API — HEALTH & CONFIG
// ============================================================

v2.get('/api/health', (c) => {
  const ai = getAI(c.env)
  return c.json({
    status: 'ok',
    version: '2.0.0',
    ai_configured: ai.isConfigured,
    timestamp: new Date().toISOString(),
  })
})

// ============================================================
// API — AUTH (réutilise login-simple v1 + tables users existantes)
// ============================================================

v2.post('/api/auth/login', async (c) => {
  try {
    const { name } = await c.req.json()
    if (!name) return c.json({ error: 'Nom requis' }, 400)

    // Lookup user existant
    const user: any = await c.env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1'
    ).bind(name.trim()).first()

    if (!user) {
      return c.json({ error: 'Utilisateur introuvable. Crée-le d\'abord dans v1.' }, 404)
    }

    // Token base64 simple (compatible v1)
    const tokenData = {
      id: user.id,
      email: user.email,
      name: user.name,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 jours
    }
    const token = btoa(JSON.stringify(tokenData))

    return c.json({ token, user })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Helper auth — extrait user du token
function getUser(c: any): { id: number; name: string; email: string } | null {
  const header = c.req.header('Authorization')
  if (!header) return null
  try {
    const token = header.replace('Bearer ', '')
    const decoded = JSON.parse(atob(token))
    if (decoded.exp && decoded.exp < Date.now()) return null
    return { id: decoded.id, name: decoded.name, email: decoded.email }
  } catch {
    return null
  }
}

// ============================================================
// API — DASHBOARD (briefing matinal + actions du jour)
// ============================================================

v2.get('/api/dashboard', async (c) => {
  const user = getUser(c)
  if (!user) return c.json({ error: 'Non autorisé' }, 401)

  try {
    // Récupère les données brutes du CRM (réutilise tables v1)
    const [deals, quotes, clients] = await Promise.all([
      c.env.DB.prepare(`
        SELECT d.*, c.name as client_name, c.phone as client_phone
        FROM deals d
        LEFT JOIN clients c ON c.id = d.client_id
        WHERE COALESCE(d.archived, 0) = 0
        ORDER BY d.updated_at DESC
        LIMIT 50
      `).all(),
      c.env.DB.prepare(`
        SELECT id, number, quote_number, total_ttc, status, created_at, deal_id
        FROM quotes
        ORDER BY created_at DESC
        LIMIT 50
      `).all(),
      c.env.DB.prepare(`
        SELECT id, name, phone, email, status
        FROM clients
        WHERE COALESCE(archived, 0) = 0
        ORDER BY updated_at DESC
        LIMIT 100
      `).all(),
    ])

    const dealsList = deals.results || []
    const quotesList = quotes.results || []
    const clientsList = clients.results || []

    // Calculs côté serveur — règles métier déterministes
    const now = Date.now()
    const DAY = 1000 * 60 * 60 * 24

    const hotDeals = dealsList.filter((d: any) =>
      d.stage === 'devis_envoye' || d.stage === 'relance'
    )

    const stuckDeals = dealsList.filter((d: any) => {
      const updated = new Date(d.updated_at || d.created_at).getTime()
      const daysSince = (now - updated) / DAY
      return daysSince > 10 && d.stage !== 'signe' && d.stage !== 'perdu'
    })

    const draftQuotes = quotesList.filter((q: any) => q.status === 'brouillon')
    const sentQuotes = quotesList.filter((q: any) => q.status === 'envoye' || q.status === 'envoyé')

    const pendingAmount = sentQuotes.reduce((s: number, q: any) => s + (q.total_ttc || 0), 0)

    return c.json({
      user: { name: user.name },
      stats: {
        active_deals: dealsList.length,
        hot_deals: hotDeals.length,
        stuck_deals: stuckDeals.length,
        draft_quotes: draftQuotes.length,
        sent_quotes: sentQuotes.length,
        pending_amount: pendingAmount,
        clients_count: clientsList.length,
      },
      hot_deals: hotDeals.slice(0, 5),
      stuck_deals: stuckDeals.slice(0, 5),
      recent_quotes: quotesList.slice(0, 5),
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — BRIEFING IA QUOTIDIEN
// ============================================================

v2.get('/api/briefing', async (c) => {
  const user = getUser(c)
  if (!user) return c.json({ error: 'Non autorisé' }, 401)

  const ai = getAI(c.env)
  if (!ai.isConfigured) {
    return c.json({
      briefing: `Bonjour ${user.name}.\n\nLa clé IA n'est pas encore configurée. Le briefing intelligent sera disponible dès que l'admin aura activé l'IA.`,
      ai_enabled: false,
    })
  }

  try {
    // Récupère les données via la même requête que dashboard
    const dashRes = await fetch(new URL('/v2/api/dashboard', c.req.url).toString(), {
      headers: { Authorization: c.req.header('Authorization') || '' },
    })
    const dash: any = await dashRes.json()

    const prompt = `Tu es l'assistant IA de KARL, un CRM pour artisans (portails, clôtures, motorisation).
Génère un briefing matinal CONCIS (max 8 lignes) en français, ton direct et actionnable.

DONNÉES DU JOUR pour ${dash.user?.name || 'l\'artisan'} :
- ${dash.stats.active_deals} dossiers actifs
- ${dash.stats.hot_deals} dossiers chauds (devis envoyé ou relance en cours)
- ${dash.stats.stuck_deals} dossiers bloqués (>10 jours sans activité)
- ${dash.stats.draft_quotes} devis en brouillon
- ${dash.stats.sent_quotes} devis envoyés en attente (${Math.round(dash.stats.pending_amount).toLocaleString('fr-FR')} € TTC)

DOSSIERS BLOQUÉS:
${(dash.stuck_deals || []).map((d: any) => `- ${d.title} (${d.client_name || 'client'})`).join('\n') || '- Aucun'}

DOSSIERS CHAUDS:
${(dash.hot_deals || []).map((d: any) => `- ${d.title} (${d.client_name || 'client'}) — ${d.amount || 0}€`).join('\n') || '- Aucun'}

Format attendu:
- Salutation rapide (1 ligne)
- 3 à 5 puces "À FAIRE AUJOURD'HUI" priorisées (utilise emojis 🔥⚠️📞💰)
- Pas de blabla, pas de conclusion`

    const briefing = await ai.chat([
      { role: 'system', content: 'Tu es un assistant CRM ultra-concis pour artisans. Pas de formules de politesse longues.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.7, max_tokens: 400 })

    return c.json({ briefing, ai_enabled: true })
  } catch (e: any) {
    return c.json({
      briefing: `Bonjour ${user.name}.\n\nErreur de génération IA: ${e.message}`,
      ai_enabled: false,
      error: e.message,
    })
  }
})

// ============================================================
// API — BARRE IA GLOBALE (commande naturelle)
// ============================================================

v2.post('/api/command', async (c) => {
  const user = getUser(c)
  if (!user) return c.json({ error: 'Non autorisé' }, 401)

  const ai = getAI(c.env)
  if (!ai.isConfigured) {
    return c.json({ error: 'IA non configurée' }, 503)
  }

  try {
    const { input } = await c.req.json()
    if (!input || typeof input !== 'string') {
      return c.json({ error: 'Input manquant' }, 400)
    }

    // Récupère contexte clients/deals pour permettre la résolution de noms
    const [clientsR, dealsR] = await Promise.all([
      c.env.DB.prepare('SELECT id, name, phone FROM clients WHERE COALESCE(archived,0)=0 LIMIT 200').all(),
      c.env.DB.prepare('SELECT id, title, client_id, stage FROM deals WHERE COALESCE(archived,0)=0 LIMIT 200').all(),
    ])
    const clients = clientsR.results || []
    const deals = dealsR.results || []

    const systemPrompt = `Tu es l'IA d'un CRM pour artisans. Tu interprètes une commande en langage naturel et retournes UNIQUEMENT du JSON valide décrivant l'action à exécuter.

Actions disponibles:
- "create_client" : { client_name }
- "create_deal" : { client_name, title, amount? }
- "create_quote" : { client_name|deal_id, items?, notes? }
- "search" : { query, type: "client"|"deal"|"quote" }
- "show_hot_deals" : {}
- "show_stuck_deals" : {}
- "prepare_email" : { client_name, subject?, intent }
- "schedule_followup" : { client_name|deal_id, when? }
- "unknown" : { reason }

CLIENTS EXISTANTS (id, nom):
${clients.slice(0, 50).map((c: any) => `${c.id}: ${c.name}`).join('\n')}

DOSSIERS EXISTANTS:
${deals.slice(0, 50).map((d: any) => `${d.id}: ${d.title}`).join('\n')}

Format de sortie OBLIGATOIRE:
{
  "action": "...",
  "params": { ... },
  "matched_client_id": null|<id>,
  "matched_deal_id": null|<id>,
  "human_response": "Phrase courte expliquant ce que tu vas faire",
  "needs_confirmation": true|false
}`

    const result = await ai.chatJSON<any>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ], { temperature: 0.2 })

    return c.json({ ok: true, input, result })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — RÉSUMER UN DOSSIER
// ============================================================

v2.get('/api/deal/:id/summary', async (c) => {
  const user = getUser(c)
  if (!user) return c.json({ error: 'Non autorisé' }, 401)

  const ai = getAI(c.env)
  if (!ai.isConfigured) return c.json({ error: 'IA non configurée' }, 503)

  try {
    const id = c.req.param('id')
    const deal: any = await c.env.DB.prepare(`
      SELECT d.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.address as client_address
      FROM deals d LEFT JOIN clients c ON c.id = d.client_id
      WHERE d.id = ?
    `).bind(id).first()

    if (!deal) return c.json({ error: 'Dossier introuvable' }, 404)

    const quotes = await c.env.DB.prepare(
      'SELECT number, quote_number, total_ttc, status, created_at FROM quotes WHERE deal_id = ? ORDER BY created_at DESC'
    ).bind(id).all()

    const prompt = `Tu es l'assistant CRM. Résume ce dossier en français, ton direct, 4-6 lignes max.

DOSSIER:
- Client: ${deal.client_name || 'inconnu'} (${deal.client_phone || 'pas de tel'})
- Titre: ${deal.title}
- Montant prévu: ${deal.amount || 0} €
- Stage: ${deal.stage}
- Probabilité: ${deal.probability || 0}%
- Notes: ${deal.notes || 'aucune'}
- Créé: ${deal.created_at}
- Maj: ${deal.updated_at}

DEVIS (${(quotes.results || []).length}):
${(quotes.results || []).map((q: any) => `- ${q.number || q.quote_number} — ${q.total_ttc}€ TTC — ${q.status}`).join('\n') || 'Aucun devis'}

Format:
- 1 ligne d'état actuel
- 1 ligne sur les devis
- 1-2 lignes "PROCHAINE ACTION RECOMMANDÉE"`

    const summary = await ai.chat([
      { role: 'system', content: 'Tu es un assistant CRM ultra-concis.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.5, max_tokens: 300 })

    return c.json({ summary, deal_id: id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default v2
