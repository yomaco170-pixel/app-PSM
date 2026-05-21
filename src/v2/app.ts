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
import { renderPipeline } from './views/pipeline'
import { renderClients } from './views/clients'
import { renderDealDetail } from './views/deal'
import { renderInbox } from './views/inbox'
import { renderQuotes } from './views/quotes'
import { renderMore } from './views/more'

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

v2.get('/', (c) =>
  c.html(renderShell({
    title: 'KARL CRM v2 — Assistant IA Artisans',
    body: renderDashboard(),
    page: 'dashboard',
  }))
)

v2.get('/login', (c) =>
  c.html(renderShell({
    title: 'KARL CRM v2 — Connexion',
    body: renderLogin(),
    page: 'login',
    minimal: true,
  }))
)

v2.get('/pipeline', (c) =>
  c.html(renderShell({
    title: 'Pipeline — KARL v2',
    body: renderPipeline(),
    page: 'pipeline',
  }))
)

v2.get('/clients', (c) =>
  c.html(renderShell({
    title: 'Clients — KARL v2',
    body: renderClients(),
    page: 'clients',
  }))
)

v2.get('/inbox', (c) =>
  c.html(renderShell({
    title: 'Inbox — KARL v2',
    body: renderInbox(),
    page: 'inbox',
  }))
)

v2.get('/quotes', (c) =>
  c.html(renderShell({
    title: 'Devis — KARL v2',
    body: renderQuotes(),
    page: 'quotes',
  }))
)

v2.get('/more', (c) =>
  c.html(renderShell({
    title: 'Plus — KARL v2',
    body: renderMore(),
    page: 'more',
  }))
)

v2.get('/deal/:id', (c) => {
  const id = c.req.param('id')
  return c.html(renderShell({
    title: `Dossier #${id} — KARL v2`,
    body: renderDealDetail(id),
    page: 'pipeline',
  }))
})

// ============================================================
// API — HEALTH & CONFIG
// ============================================================

v2.get('/api/health', (c) => {
  const ai = getAI(c.env)
  return c.json({
    status: 'ok',
    version: '2.2.0',
    ai_configured: ai.isConfigured,
    timestamp: new Date().toISOString(),
  })
})

// ============================================================
// AUTH HELPERS
// ============================================================

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

function requireAuth(c: any): { user: any; error?: any } {
  const user = getUser(c)
  if (!user) return { user: null, error: c.json({ error: 'Non autorisé' }, 401) }
  return { user }
}

// ============================================================
// LEAD SCORING — déterministe (0-100)
// Règles métier simples, pas d'IA, rapide et explicable.
// ============================================================
function computeDealScore(deal: any): { score: number; label: string; color: string; reasons: string[] } {
  let score = 30 // base
  const reasons: string[] = []

  const now = Date.now()
  const DAY = 1000 * 60 * 60 * 24
  const updated = deal.updated_at ? new Date(deal.updated_at).getTime() : (deal.created_at ? new Date(deal.created_at).getTime() : now)
  const daysSinceUpdate = (now - updated) / DAY

  // 1. Stage (poids majeur)
  const stage = (deal.stage || '').toLowerCase()
  if (stage === 'signe' || stage === 'signé') { score += 50; reasons.push('signé') }
  else if (stage === 'devis_envoye' || stage === 'devis_envoyé') { score += 35; reasons.push('devis envoyé') }
  else if (stage === 'relance') { score += 25; reasons.push('en relance') }
  else if (stage === 'rdv_planifie') { score += 20; reasons.push('RDV planifié') }
  else if (stage === 'devis_a_faire') { score += 15; reasons.push('devis à faire') }
  else if (stage === 'perdu') { score = 0; reasons.push('perdu') }

  // 2. Montant (plus c'est gros, plus c'est chaud)
  const amount = Number(deal.amount) || 0
  if (amount >= 10000) { score += 20; reasons.push(`gros montant (${Math.round(amount/1000)}k€)`) }
  else if (amount >= 5000) { score += 12; reasons.push(`montant moyen+ (${Math.round(amount/1000)}k€)`) }
  else if (amount >= 2000) { score += 6 }

  // 3. Probabilité (si renseignée)
  const proba = Number(deal.probability) || 0
  if (proba >= 70) { score += 15; reasons.push(`proba haute ${proba}%`) }
  else if (proba >= 40) { score += 8 }
  else if (proba >= 20) { score += 3 }

  // 4. Fraîcheur (pénalité si vieux)
  if (stage !== 'signe' && stage !== 'signé' && stage !== 'perdu') {
    if (daysSinceUpdate > 30) { score -= 25; reasons.push(`abandonné (${Math.round(daysSinceUpdate)}j)`) }
    else if (daysSinceUpdate > 15) { score -= 15; reasons.push(`stagne (${Math.round(daysSinceUpdate)}j)`) }
    else if (daysSinceUpdate > 7) { score -= 5; reasons.push(`silencieux (${Math.round(daysSinceUpdate)}j)`) }
    else if (daysSinceUpdate < 2) { score += 5; reasons.push('actif récent') }
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  let label = 'froid'
  let color = 'slate'
  if (score >= 75) { label = 'chaud'; color = 'red' }
  else if (score >= 55) { label = 'tiède'; color = 'orange' }
  else if (score >= 35) { label = 'à suivre'; color = 'amber' }
  else if (score > 0) { label = 'froid'; color = 'slate' }
  else { label = 'mort'; color = 'slate' }

  return { score, label, color, reasons }
}

// ============================================================
// PIPELINE TRIGGERS — flags automatiques sur les deals
// (calculé à la volée, pas stocké en DB pour V2.2)
// ============================================================
function computeDealFlags(deal: any): Array<{ icon: string; label: string; color: string }> {
  const flags: Array<{ icon: string; label: string; color: string }> = []
  const now = Date.now()
  const DAY = 1000 * 60 * 60 * 24
  const updated = deal.updated_at ? new Date(deal.updated_at).getTime() : (deal.created_at ? new Date(deal.created_at).getTime() : now)
  const days = (now - updated) / DAY
  const stage = (deal.stage || '').toLowerCase()

  if (stage === 'devis_envoye' || stage === 'devis_envoyé' || stage === 'relance') {
    if (days > 7) flags.push({ icon: 'fa-bell', label: 'à relancer', color: 'red' })
  }
  if (stage === 'devis_a_faire' && days > 3) {
    flags.push({ icon: 'fa-hourglass-half', label: 'devis en retard', color: 'amber' })
  }
  if (stage === 'rdv_planifie' && deal.rdv_date) {
    const rdvTime = new Date(deal.rdv_date).getTime()
    const daysToRdv = (rdvTime - now) / DAY
    if (daysToRdv > 0 && daysToRdv < 2) {
      flags.push({ icon: 'fa-calendar-day', label: 'RDV imminent', color: 'blue' })
    } else if (daysToRdv < 0) {
      flags.push({ icon: 'fa-calendar-xmark', label: 'RDV passé', color: 'amber' })
    }
  }
  if (stage === 'lead' && days > 14) {
    flags.push({ icon: 'fa-snowflake', label: 'lead froid', color: 'slate' })
  }
  return flags
}

// ============================================================
// API — AUTH
// ============================================================

v2.post('/api/auth/login', async (c) => {
  try {
    const { name } = await c.req.json()
    if (!name) return c.json({ error: 'Nom requis' }, 400)

    const user: any = await c.env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1'
    ).bind(name.trim()).first()

    if (!user) {
      return c.json({ error: 'Utilisateur introuvable. Crée-le d\'abord dans v1.' }, 404)
    }

    const tokenData = {
      id: user.id,
      email: user.email,
      name: user.name,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    }
    const token = btoa(JSON.stringify(tokenData))
    return c.json({ token, user })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

v2.get('/api/auth/me', async (c) => {
  const user = getUser(c)
  if (!user) return c.json({ error: 'Non autorisé' }, 401)
  return c.json({ user })
})

// ============================================================
// API — DASHBOARD
// ============================================================

v2.get('/api/dashboard', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const [deals, quotes, clients] = await Promise.all([
      c.env.DB.prepare(`
        SELECT d.*, c.name as client_name, c.phone as client_phone
        FROM deals d LEFT JOIN clients c ON c.id = d.client_id
        WHERE COALESCE(d.archived, 0) = 0
        ORDER BY d.updated_at DESC LIMIT 50
      `).all(),
      c.env.DB.prepare(`
        SELECT id, COALESCE(number, quote_number) as number, total_ttc, status, created_at, deal_id
        FROM quotes ORDER BY created_at DESC LIMIT 50
      `).all(),
      c.env.DB.prepare(`
        SELECT id, name, phone, email, status FROM clients
        WHERE COALESCE(archived, 0) = 0 ORDER BY updated_at DESC LIMIT 100
      `).all(),
    ])

    const dealsList = (deals.results || []) as any[]
    const quotesList = (quotes.results || []) as any[]
    const clientsList = (clients.results || []) as any[]

    const now = Date.now()
    const DAY = 1000 * 60 * 60 * 24

    // Enrichir avec score + flags
    const enrichedDeals = dealsList.map((d) => {
      const scoring = computeDealScore(d)
      const flags = computeDealFlags(d)
      return { ...d, score: scoring.score, score_label: scoring.label, score_color: scoring.color, flags }
    })

    const hotDeals = enrichedDeals
      .filter((d) =>
        d.stage === 'devis_envoye' || d.stage === 'relance' || d.stage === 'devis_envoyé'
      )
      .sort((a, b) => b.score - a.score)
    const stuckDeals = enrichedDeals.filter((d) => {
      const updated = new Date(d.updated_at || d.created_at).getTime()
      const daysSince = (now - updated) / DAY
      return daysSince > 10 && d.stage !== 'signe' && d.stage !== 'signé' && d.stage !== 'perdu'
    })
    const draftQuotes = quotesList.filter((q) => q.status === 'brouillon')
    const sentQuotes = quotesList.filter((q) => q.status === 'envoye' || q.status === 'envoyé')
    const pendingAmount = sentQuotes.reduce((s, q) => s + (q.total_ttc || 0), 0)

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
// API — BRIEFING IA
// ============================================================

v2.get('/api/briefing', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  const ai = getAI(c.env)
  if (!ai.isConfigured) {
    return c.json({
      briefing: `Bonjour ${user.name}.\n\nLa clé IA n'est pas encore configurée. Le briefing intelligent sera disponible dès que l'admin aura activé l'IA.`,
      ai_enabled: false,
    })
  }

  try {
    // Données directement depuis la DB (au lieu d'un fetch interne)
    const [deals, quotes] = await Promise.all([
      c.env.DB.prepare(`
        SELECT d.*, c.name as client_name
        FROM deals d LEFT JOIN clients c ON c.id = d.client_id
        WHERE COALESCE(d.archived, 0) = 0
        ORDER BY d.updated_at DESC LIMIT 30
      `).all(),
      c.env.DB.prepare(`
        SELECT id, status, total_ttc FROM quotes ORDER BY created_at DESC LIMIT 30
      `).all(),
    ])

    const dealsList = (deals.results || []) as any[]
    const quotesList = (quotes.results || []) as any[]
    const now = Date.now()
    const DAY = 1000 * 60 * 60 * 24

    const hotDeals = dealsList.filter((d) =>
      d.stage === 'devis_envoye' || d.stage === 'relance'
    )
    const stuckDeals = dealsList.filter((d) => {
      const updated = new Date(d.updated_at || d.created_at).getTime()
      return (now - updated) / DAY > 10 && d.stage !== 'signe' && d.stage !== 'perdu'
    })
    const draftQuotes = quotesList.filter((q) => q.status === 'brouillon').length
    const sentQuotes = quotesList.filter((q) => q.status === 'envoye' || q.status === 'envoyé')
    const pendingAmount = sentQuotes.reduce((s, q) => s + (q.total_ttc || 0), 0)

    const prompt = `Tu es l'assistant IA de KARL, un CRM pour artisans (portails, clôtures, motorisation).
Génère un briefing matinal CONCIS (max 8 lignes) en français, ton direct et actionnable.

DONNÉES DU JOUR pour ${user.name} :
- ${dealsList.length} dossiers actifs
- ${hotDeals.length} dossiers chauds (devis envoyé ou relance en cours)
- ${stuckDeals.length} dossiers bloqués (>10 jours sans activité)
- ${draftQuotes} devis en brouillon
- ${sentQuotes.length} devis envoyés en attente (${Math.round(pendingAmount).toLocaleString('fr-FR')} € TTC)

DOSSIERS BLOQUÉS:
${stuckDeals.slice(0, 5).map((d) => `- ${d.title} (${d.client_name || 'client'})`).join('\n') || '- Aucun'}

DOSSIERS CHAUDS:
${hotDeals.slice(0, 5).map((d) => `- ${d.title} (${d.client_name || 'client'}) — ${d.amount || 0}€`).join('\n') || '- Aucun'}

Format attendu:
- Salutation rapide (1 ligne)
- 3 à 5 puces "À FAIRE AUJOURD'HUI" priorisées (utilise emojis 🔥⚠️📞💰)
- Pas de blabla, pas de conclusion`

    const briefing = await ai.chat([
      { role: 'system', content: 'Tu es un assistant CRM ultra-concis pour artisans. Pas de formules de politesse longues.' },
      { role: 'user', content: prompt },
    ], { max_tokens: 2000 })

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
// API — COMMANDE IA GLOBALE (avec exécution)
// ============================================================

v2.post('/api/command', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  const ai = getAI(c.env)
  if (!ai.isConfigured) return c.json({ error: 'IA non configurée' }, 503)

  try {
    const { input } = await c.req.json()
    if (!input || typeof input !== 'string') {
      return c.json({ error: 'Input manquant' }, 400)
    }

    const [clientsR, dealsR] = await Promise.all([
      c.env.DB.prepare('SELECT id, name, phone FROM clients WHERE COALESCE(archived,0)=0 LIMIT 200').all(),
      c.env.DB.prepare('SELECT id, title, client_id, stage FROM deals WHERE COALESCE(archived,0)=0 LIMIT 200').all(),
    ])
    const clients = (clientsR.results || []) as any[]
    const deals = (dealsR.results || []) as any[]

    const systemPrompt = `Tu es l'IA d'un CRM pour artisans. Tu interprètes une commande en langage naturel et retournes UNIQUEMENT du JSON valide décrivant l'action à exécuter.

Actions disponibles:
- "create_client" : { client_name, phone?, email? }
- "create_deal" : { client_name|client_id, title, amount? }
- "create_quote" : { client_name|deal_id, items?, notes? }
- "search" : { query, type: "client"|"deal"|"quote" }
- "show_hot_deals" : {}
- "show_stuck_deals" : {}
- "show_dashboard" : {}
- "open_deal" : { deal_id }
- "open_client" : { client_id }
- "prepare_email" : { client_name, subject?, intent }
- "schedule_followup" : { client_name|deal_id, when? }
- "unknown" : { reason }

CLIENTS EXISTANTS (id, nom):
${clients.slice(0, 50).map((c) => `${c.id}: ${c.name}`).join('\n')}

DOSSIERS EXISTANTS:
${deals.slice(0, 50).map((d) => `${d.id}: ${d.title}`).join('\n')}

Format de sortie OBLIGATOIRE:
{
  "action": "...",
  "params": { ... },
  "matched_client_id": null|<id>,
  "matched_deal_id": null|<id>,
  "human_response": "Phrase courte expliquant ce que tu vas faire",
  "needs_confirmation": true|false,
  "navigate_to": null|"/v2/pipeline?filter=hot"|"/v2/deal/<id>"
}`

    const result: any = await ai.chatJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ], { max_tokens: 2000 })

    // Tentative d'exécution simple sans confirmation pour certaines actions safe
    let executed: any = null
    if (result.action === 'create_client' && result.params?.client_name && !result.needs_confirmation) {
      const cname = String(result.params.client_name).trim()
      const existing: any = await c.env.DB.prepare(
        'SELECT id FROM clients WHERE LOWER(name) = LOWER(?) LIMIT 1'
      ).bind(cname).first()
      if (!existing) {
        const ins = await c.env.DB.prepare(
          `INSERT INTO clients (name, phone, email, status, created_at, updated_at)
           VALUES (?, ?, ?, 'lead', datetime('now'), datetime('now'))`
        ).bind(
          cname,
          result.params.phone || null,
          result.params.email || null,
        ).run()
        executed = { type: 'created_client', id: ins.meta.last_row_id, name: cname }
      } else {
        executed = { type: 'client_already_exists', id: existing.id, name: cname }
      }
    }

    return c.json({ ok: true, input, result, executed })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — DEAL DETAIL + TIMELINE
// ============================================================

v2.get('/api/deal/:id', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const id = c.req.param('id')
    const deal: any = await c.env.DB.prepare(`
      SELECT d.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.address as client_address
      FROM deals d LEFT JOIN clients c ON c.id = d.client_id
      WHERE d.id = ?
    `).bind(id).first()

    if (!deal) return c.json({ error: 'Dossier introuvable' }, 404)

    const quotes = await c.env.DB.prepare(
      `SELECT id, COALESCE(number, quote_number) as number, total_ttc, status, created_at, notes
       FROM quotes WHERE deal_id = ? ORDER BY created_at DESC`
    ).bind(id).all()

    const scoring = computeDealScore(deal)
    const flags = computeDealFlags(deal)

    return c.json({
      deal: { ...deal, score: scoring.score, score_label: scoring.label, score_color: scoring.color, score_reasons: scoring.reasons, flags },
      quotes: quotes.results || [],
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

v2.get('/api/deal/:id/timeline', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const id = c.req.param('id')

    // Récupère deal + quotes + events liés
    const deal: any = await c.env.DB.prepare(
      'SELECT id, title, client_id, created_at, updated_at, stage, rdv_date, rdv_notes, notes FROM deals WHERE id = ?'
    ).bind(id).first()

    if (!deal) return c.json({ timeline: [] })

    const quotes = await c.env.DB.prepare(
      `SELECT id, COALESCE(number, quote_number) as number, total_ttc, status, created_at, notes
       FROM quotes WHERE deal_id = ? ORDER BY created_at DESC`
    ).bind(id).all()

    // Construire timeline universelle
    const events: any[] = []

    events.push({
      type: 'deal_created',
      icon: 'fa-flag',
      color: 'slate',
      title: 'Dossier créé',
      description: deal.title,
      at: deal.created_at,
    })

    if (deal.rdv_date) {
      events.push({
        type: 'rdv',
        icon: 'fa-calendar-check',
        color: 'blue',
        title: 'RDV planifié',
        description: deal.rdv_notes || '',
        at: deal.rdv_date,
      })
    }

    for (const q of (quotes.results || []) as any[]) {
      events.push({
        type: 'quote_created',
        icon: 'fa-file-invoice',
        color: 'karl',
        title: `Devis ${q.number} créé`,
        description: `${Math.round(q.total_ttc || 0)} € TTC · ${q.status}`,
        at: q.created_at,
        link: `/v2/quotes#${q.id}`,
      })
      if (q.status === 'envoye' || q.status === 'envoyé') {
        events.push({
          type: 'quote_sent',
          icon: 'fa-paper-plane',
          color: 'amber',
          title: `Devis ${q.number} envoyé`,
          description: 'En attente signature',
          at: q.created_at,
        })
      }
    }

    if (deal.stage === 'signe' || deal.stage === 'signé') {
      events.push({
        type: 'deal_signed',
        icon: 'fa-check-circle',
        color: 'emerald',
        title: 'Dossier signé',
        description: '',
        at: deal.updated_at,
      })
    }

    // Tri du plus récent au plus ancien
    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

    return c.json({ timeline: events })
  } catch (e: any) {
    return c.json({ error: e.message, timeline: [] }, 500)
  }
})

// ============================================================
// API — RÉSUMER DOSSIER
// ============================================================

v2.get('/api/deal/:id/summary', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  const ai = getAI(c.env)
  if (!ai.isConfigured) return c.json({ error: 'IA non configurée' }, 503)

  try {
    const id = c.req.param('id')
    const deal: any = await c.env.DB.prepare(`
      SELECT d.*, c.name as client_name, c.phone as client_phone, c.email as client_email
      FROM deals d LEFT JOIN clients c ON c.id = d.client_id WHERE d.id = ?
    `).bind(id).first()

    if (!deal) return c.json({ error: 'Dossier introuvable' }, 404)

    const quotes = await c.env.DB.prepare(
      `SELECT COALESCE(number, quote_number) as number, total_ttc, status, created_at
       FROM quotes WHERE deal_id = ? ORDER BY created_at DESC`
    ).bind(id).all()

    const prompt = `Résume ce dossier en français, ton direct, 4-6 lignes max.

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
${(quotes.results || []).map((q: any) => `- ${q.number} — ${q.total_ttc}€ TTC — ${q.status}`).join('\n') || 'Aucun devis'}

Format:
- 1 ligne d'état actuel
- 1 ligne sur les devis
- 1-2 lignes "PROCHAINE ACTION RECOMMANDÉE"`

    const summary = await ai.chat([
      { role: 'system', content: 'Tu es un assistant CRM ultra-concis.' },
      { role: 'user', content: prompt },
    ], { max_tokens: 1500 })

    return c.json({ summary, deal_id: id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — PRÉPARER RELANCE IA
// ============================================================

v2.get('/api/deal/:id/followup', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  const ai = getAI(c.env)
  if (!ai.isConfigured) return c.json({ error: 'IA non configurée' }, 503)

  try {
    const id = c.req.param('id')
    const deal: any = await c.env.DB.prepare(`
      SELECT d.*, c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM deals d LEFT JOIN clients c ON c.id = d.client_id WHERE d.id = ?
    `).bind(id).first()
    if (!deal) return c.json({ error: 'Dossier introuvable' }, 404)

    const quotes = await c.env.DB.prepare(
      `SELECT COALESCE(number, quote_number) as number, total_ttc, status, created_at
       FROM quotes WHERE deal_id = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(id).first()

    const prompt = `Rédige un email de relance commercial pour un artisan (portails/clôtures).
Ton: courtois, direct, jamais insistant. Signé "${user.name}".

CONTEXTE:
- Client: ${deal.client_name || 'le client'}
- Dossier: ${deal.title}
${quotes ? `- Devis envoyé: ${(quotes as any).number} de ${(quotes as any).total_ttc}€ le ${(quotes as any).created_at}` : '- Pas encore de devis'}
- Notes: ${deal.notes || 'aucune'}

Format JSON:
{
  "subject": "...",
  "body": "...",
  "tone": "courtois|direct|amical",
  "send_via": "email|sms"
}`

    const result: any = await ai.chatJSON([
      { role: 'system', content: 'Tu rédiges des emails commerciaux courts et efficaces pour des artisans. JSON only.' },
      { role: 'user', content: prompt },
    ], { max_tokens: 2000 })

    return c.json({ ...result, client_email: deal.client_email, client_phone: deal.client_phone })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — VÉRIFICATION ANTI-ERREURS DOSSIER
// ============================================================

v2.get('/api/deal/:id/check', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const id = c.req.param('id')
    const deal: any = await c.env.DB.prepare(`
      SELECT d.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.address as client_address
      FROM deals d LEFT JOIN clients c ON c.id = d.client_id WHERE d.id = ?
    `).bind(id).first()
    if (!deal) return c.json({ error: 'Dossier introuvable' }, 404)

    const quotes = await c.env.DB.prepare(
      `SELECT id, COALESCE(number, quote_number) as number, total_ht, total_tva, total_ttc, status
       FROM quotes WHERE deal_id = ? ORDER BY created_at DESC`
    ).bind(id).all()

    const issues: any[] = []

    if (!deal.client_phone) issues.push({ level: 'warning', message: 'Client sans téléphone' })
    if (!deal.client_email) issues.push({ level: 'warning', message: 'Client sans email' })
    if (!deal.client_address) issues.push({ level: 'info', message: 'Adresse client manquante' })
    if (!deal.amount || deal.amount === 0) issues.push({ level: 'warning', message: 'Montant prévu non renseigné' })

    const qList = (quotes.results || []) as any[]
    if (deal.stage === 'devis_a_faire' && qList.length === 0) {
      issues.push({ level: 'error', message: 'Stage = devis à faire mais aucun devis créé' })
    }

    for (const q of qList) {
      const ht = q.total_ht || 0
      const ttc = q.total_ttc || 0
      const tva = q.total_tva || 0
      if (ht > 0 && Math.abs((ht + tva) - ttc) > 0.5) {
        issues.push({ level: 'error', message: `Devis ${q.number}: incohérence TTC ≠ HT + TVA` })
      }
      if (ht > 0 && tva === 0) {
        issues.push({ level: 'warning', message: `Devis ${q.number}: TVA à 0€ (suspect)` })
      }
    }

    return c.json({ issues, count: issues.length, ok: issues.length === 0 })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — PIPELINE
// ============================================================

v2.get('/api/pipeline', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const deals = await c.env.DB.prepare(`
      SELECT d.id, d.title, d.amount, d.stage, d.probability, d.created_at, d.updated_at,
             d.client_id, c.name as client_name, c.phone as client_phone
      FROM deals d LEFT JOIN clients c ON c.id = d.client_id
      WHERE COALESCE(d.archived, 0) = 0
      ORDER BY d.updated_at DESC
    `).all()

    const list = (deals.results || []) as any[]

    // Regroupement par stage
    const stages = [
      { id: 'lead', label: 'Leads', color: 'slate' },
      { id: 'rdv_planifie', label: 'RDV planifié', color: 'blue' },
      { id: 'devis_a_faire', label: 'Devis à faire', color: 'amber' },
      { id: 'devis_envoye', label: 'Devis envoyé', color: 'orange' },
      { id: 'relance', label: 'Relance', color: 'red' },
      { id: 'signe', label: 'Signé', color: 'emerald' },
    ]

    // Enrichir chaque deal avec score + flags
    const enriched = list.map((d) => {
      const scoring = computeDealScore(d)
      const flags = computeDealFlags(d)
      return { ...d, score: scoring.score, score_label: scoring.label, score_color: scoring.color, flags }
    })

    const grouped = stages.map((s) => ({
      ...s,
      deals: enriched.filter((d) =>
        d.stage === s.id ||
        (s.id === 'devis_envoye' && d.stage === 'devis_envoyé') ||
        (s.id === 'signe' && d.stage === 'signé')
      ).sort((a, b) => (b.score || 0) - (a.score || 0)),
      total_amount: enriched
        .filter((d) => d.stage === s.id)
        .reduce((sum, d) => sum + (d.amount || 0), 0),
    }))

    return c.json({ stages: grouped, total: list.length })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — CRÉATION DOSSIER
// ============================================================

v2.post('/api/deals', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const body = await c.req.json()
    const { title, client_id, client_name, amount, stage, notes, probability } = body
    if (!title) return c.json({ error: 'Titre requis' }, 400)

    // Résoudre/créer le client si fourni par nom
    let resolvedClientId = client_id || null
    let resolvedClientName: string | null = null
    if (!resolvedClientId && client_name) {
      const existing: any = await c.env.DB.prepare(
        'SELECT id, name FROM clients WHERE LOWER(name) = LOWER(?) LIMIT 1'
      ).bind(String(client_name).trim()).first()
      if (existing) {
        resolvedClientId = existing.id
        resolvedClientName = existing.name
      } else {
        const ins = await c.env.DB.prepare(
          `INSERT INTO clients (name, status, created_at, updated_at)
           VALUES (?, 'lead', datetime('now'), datetime('now'))`
        ).bind(String(client_name).trim()).run()
        resolvedClientId = ins.meta.last_row_id
        resolvedClientName = String(client_name).trim()
      }
    } else if (resolvedClientId) {
      const c1: any = await c.env.DB.prepare('SELECT name FROM clients WHERE id = ?').bind(resolvedClientId).first()
      resolvedClientName = c1?.name || null
    }

    const ins = await c.env.DB.prepare(
      `INSERT INTO deals (user_id, client_id, title, amount, stage, probability, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      user.id,
      resolvedClientId,
      String(title).trim(),
      Number(amount) || 0,
      stage || 'lead',
      Number(probability) || 0,
      notes || null,
    ).run()

    return c.json({
      ok: true,
      deal: {
        id: ins.meta.last_row_id,
        title,
        client_id: resolvedClientId,
        client_name: resolvedClientName,
        amount: Number(amount) || 0,
        stage: stage || 'lead',
      },
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — CRÉATION DEVIS (avec lignes)
// ============================================================

v2.post('/api/quotes', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const body = await c.req.json()
    const { deal_id, client_id, items, notes, status, validity_days, deposit_rate, tva_rate } = body
    if (!deal_id && !client_id) return c.json({ error: 'deal_id ou client_id requis' }, 400)

    // Récupérer le client_id depuis le deal si nécessaire
    let resolvedClientId = client_id || null
    if (!resolvedClientId && deal_id) {
      const d: any = await c.env.DB.prepare('SELECT client_id FROM deals WHERE id = ?').bind(deal_id).first()
      if (d) resolvedClientId = d.client_id
    }

    // Calcul totaux à partir des lignes
    const lines = Array.isArray(items) ? items : []
    const ht = lines.reduce((s, l) => s + (Number(l.quantity || 1) * Number(l.unit_price || 0)), 0)
    const tvaRate = Number(tva_rate) ?? 20
    const tva = Math.round(ht * (tvaRate / 100) * 100) / 100
    const ttc = Math.round((ht + tva) * 100) / 100
    const depositRate = Number(deposit_rate) || 30
    const depositAmount = Math.round(ttc * (depositRate / 100) * 100) / 100

    // Numéro de devis : prefix users.initials + YYYYMMDD + seq
    const userRow: any = await c.env.DB.prepare('SELECT name, email FROM users WHERE id = ?').bind(user.id).first()
    const initials = (userRow?.name || 'USR').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3) || 'USR'
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const countRow: any = await c.env.DB.prepare(
      `SELECT COUNT(*) as n FROM quotes WHERE date(created_at) = date('now')`
    ).first()
    const seq = String((Number(countRow?.n) || 0) + 1).padStart(3, '0')
    const quoteNumber = `${initials}-${dateStr}-${seq}`

    const content = JSON.stringify({ items: lines, tva_rate: tvaRate })

    const ins = await c.env.DB.prepare(
      `INSERT INTO quotes (
        user_id, deal_id, client_id, quote_number, number, status,
        total_ht, total_tva, total_ttc, deposit_rate, deposit_amount,
        validity_days, content, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      user.id,
      deal_id || null,
      resolvedClientId,
      quoteNumber,
      quoteNumber,
      status || 'brouillon',
      ht, tva, ttc, depositRate, depositAmount,
      Number(validity_days) || 30,
      content,
      notes || null,
    ).run()

    return c.json({
      ok: true,
      quote: {
        id: ins.meta.last_row_id,
        number: quoteNumber,
        total_ht: ht,
        total_tva: tva,
        total_ttc: ttc,
        deposit_amount: depositAmount,
        status: status || 'brouillon',
        deal_id: deal_id || null,
      },
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — IA SUGGÈRE DEVIS (lignes pré-remplies pour un dossier)
// ============================================================

v2.get('/api/deal/:id/suggest-quote', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  const ai = getAI(c.env)
  if (!ai.isConfigured) return c.json({ error: 'IA non configurée' }, 503)

  try {
    const id = c.req.param('id')
    const deal: any = await c.env.DB.prepare(`
      SELECT d.*, c.name as client_name FROM deals d
      LEFT JOIN clients c ON c.id = d.client_id WHERE d.id = ?
    `).bind(id).first()
    if (!deal) return c.json({ error: 'Dossier introuvable' }, 404)

    const prompt = `Tu es l'assistant IA d'un artisan portails/clôtures/motorisation.
À partir du titre et des notes du dossier ci-dessous, suggère une LISTE de lignes de devis réalistes (pose comprise).

DOSSIER:
- Titre: ${deal.title}
- Client: ${deal.client_name || 'inconnu'}
- Montant estimé: ${deal.amount || 0} €
- Notes: ${deal.notes || 'aucune'}

Règles:
- Génère entre 2 et 6 lignes maximum
- Prix unitaires réalistes France 2025 (portail alu 3m ≈ 1800€, motorisation ≈ 700€, pose ≈ 400€)
- Si le total estimé est connu, calibre les prix pour t'en rapprocher (±20%)
- Inclus systématiquement une ligne "Pose et installation"
- Unités: u (unité), ml (mètre linéaire), m² (mètre carré), h (heure)

Format JSON OBLIGATOIRE:
{
  "items": [
    { "description": "...", "quantity": 1, "unit": "u", "unit_price": 1800 },
    ...
  ],
  "rationale": "phrase courte expliquant ton choix",
  "estimated_total_ht": ...
}`

    const result: any = await ai.chatJSON([
      { role: 'system', content: 'Tu es un expert chiffrage devis artisanat portails/clôtures. JSON only.' },
      { role: 'user', content: prompt },
    ], { max_tokens: 2000 })

    return c.json({ ...result, deal_id: id, client_id: deal.client_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — CLIENTS
// ============================================================

v2.get('/api/clients', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const search = c.req.query('q')
    let query = `SELECT id, name, phone, email, status, address, created_at, updated_at
                 FROM clients WHERE COALESCE(archived, 0) = 0`
    const binds: any[] = []
    if (search) {
      query += ` AND (LOWER(name) LIKE ? OR phone LIKE ? OR LOWER(email) LIKE ?)`
      const s = `%${search.toLowerCase()}%`
      binds.push(s, `%${search}%`, s)
    }
    query += ` ORDER BY updated_at DESC LIMIT 200`

    const stmt = c.env.DB.prepare(query)
    const r = binds.length ? await stmt.bind(...binds).all() : await stmt.all()
    const list = (r.results || []) as any[]

    const stats = {
      total: list.length,
      leads: list.filter((c) => c.status === 'lead').length,
      clients: list.filter((c) => c.status === 'client' || c.status === 'signe' || !c.status).length,
    }

    return c.json({ clients: list, stats })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

v2.post('/api/clients', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const { name, phone, email, address, status } = await c.req.json()
    if (!name) return c.json({ error: 'Nom requis' }, 400)
    const trimmed = String(name).trim()

    const existing: any = await c.env.DB.prepare(
      'SELECT id, name FROM clients WHERE LOWER(name) = LOWER(?) LIMIT 1'
    ).bind(trimmed).first()
    if (existing) return c.json({ ok: true, client: existing, duplicate: true })

    const ins = await c.env.DB.prepare(
      `INSERT INTO clients (name, phone, email, address, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      trimmed,
      phone || null,
      email || null,
      address || null,
      status || 'lead',
    ).run()
    return c.json({ ok: true, client: { id: ins.meta.last_row_id, name: trimmed, phone, email, status: status || 'lead' } })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================
// API — DEVIS (liste pour page Quotes v2)
// ============================================================

v2.get('/api/quotes', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const status = c.req.query('status')
    let query = `SELECT q.id, COALESCE(q.number, q.quote_number) as number, q.deal_id, q.client_id,
                        q.total_ht, q.total_tva, q.total_ttc, q.status, q.created_at,
                        d.title as deal_title, c.name as client_name
                 FROM quotes q
                 LEFT JOIN deals d ON d.id = q.deal_id
                 LEFT JOIN clients c ON c.id = q.client_id`
    const binds: any[] = []
    if (status && status !== 'all') {
      query += ` WHERE q.status = ?`
      binds.push(status)
    }
    query += ` ORDER BY q.created_at DESC LIMIT 100`

    const stmt = c.env.DB.prepare(query)
    const r = binds.length ? await stmt.bind(...binds).all() : await stmt.all()
    const list = (r.results || []) as any[]

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const stats = {
      pending: list.filter((q) => q.status === 'envoye' || q.status === 'envoyé').reduce((s, q) => s + (q.total_ttc || 0), 0),
      signed_month: list.filter((q) =>
        (q.status === 'signe' || q.status === 'signé') && q.created_at >= monthStart
      ).reduce((s, q) => s + (q.total_ttc || 0), 0),
    }

    return c.json({ quotes: list, stats })
  } catch (e: any) {
    return c.json({ error: e.message, quotes: [] })
  }
})

// ============================================================
// API — EMAILS INBOX (proxy vers API v1 + analyse IA)
// ============================================================

v2.get('/api/inbox', async (c) => {
  const { user, error } = requireAuth(c)
  if (error) return error

  try {
    const gmailToken = c.req.query('gmail_token')
    if (!gmailToken) {
      return c.json({ emails: [], gmail_connected: false })
    }

    // Délègue à l'API v1 existante
    const url = new URL(c.req.url)
    url.pathname = '/api/emails'
    url.search = `?access_token=${encodeURIComponent(gmailToken)}`

    const r = await fetch(url.toString())
    if (!r.ok) return c.json({ emails: [], gmail_connected: false })
    const data: any = await r.json()

    return c.json({ emails: data.emails || data || [], gmail_connected: true })
  } catch (e: any) {
    return c.json({ error: e.message, emails: [] })
  }
})

export default v2
