import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { sha256 } from 'hono/utils/crypto'

type Bindings = {
  DB: D1Database
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Helper: Hash password with SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// GET /api/init-db - Initialiser les tables leads et clients
app.get('/api/init-db', async (c) => {
  try {
    const db = c.env.DB
    
    console.log('🔄 Initialisation des tables leads et clients...')
    
    // Créer la table leads
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        source_ref TEXT NOT NULL UNIQUE,
        from_name TEXT,
        from_email TEXT,
        subject TEXT,
        snippet TEXT,
        body TEXT,
        stage TEXT NOT NULL DEFAULT 'new',
        priority TEXT DEFAULT 'normal',
        confidence INTEGER DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run()
    
    // Créer les index pour leads
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)
    `).run()
    
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_leads_from_email ON leads(from_email)
    `).run()
    
    // Créer la table clients avec lead_id
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        company TEXT,
        created_at DATETIME DEFAULT (datetime('now')),
        FOREIGN KEY (lead_id) REFERENCES leads(id)
      )
    `).run()
    
    // Créer l'index pour clients
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients(lead_id)
    `).run()
    
    console.log('✅ Tables leads et clients initialisées')
    
    return c.json({ 
      success: true, 
      message: 'Tables leads et clients initialisées avec succès' 
    })
  } catch (error) {
    console.error('❌ Erreur init-db:', error)
    return c.json({ 
      error: 'Erreur lors de l\'initialisation de la base de données',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// ============================================
// AUTH ROUTES
// ============================================

// POST /api/auth/login - Connexion
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'Email et mot de passe requis' }, 400)
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Query user from D1
    const result = await c.env.DB.prepare(
      'SELECT id, email, name, role, company_name FROM users WHERE email = ? AND password = ?'
    ).bind(email, hashedPassword).first()

    if (!result) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401)
    }

    // Generate simple JWT token (for demo, in production use proper JWT)
    const token = btoa(JSON.stringify({ 
      id: result.id, 
      email: result.email, 
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24h
    }))

    return c.json({
      token,
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        company_name: result.company_name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// POST /api/auth/signup - Inscription
app.post('/api/auth/signup', async (c) => {
  try {
    const { email, name, password, company_name } = await c.req.json()

    if (!email || !name || !password) {
      return c.json({ error: 'Tous les champs sont requis' }, 400)
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return c.json({ error: 'Un compte existe déjà avec cet email' }, 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Insert new user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, name, password, role, company_name) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      email,
      name,
      hashedPassword,
      'user', // Default role
      company_name || 'Ma Société'
    ).run()

    // Generate token
    const token = btoa(JSON.stringify({ 
      id: result.meta.last_row_id, 
      email, 
      exp: Date.now() + 24 * 60 * 60 * 1000 
    }))

    return c.json({
      token,
      user: {
        id: result.meta.last_row_id,
        email,
        name,
        role: 'user',
        company_name: company_name || 'Ma Société'
      }
    }, 201)
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// GMAIL OAUTH ROUTES
// ============================================

// GET /api/auth/gmail - Redirect to Google OAuth
app.get('/api/auth/gmail', async (c) => {
  const url = new URL(c.req.url)
  const redirectUri = `${url.origin}/api/auth/gmail/callback`
  
  // Nouveau Client OAuth KARL CRM PRODUCTION
  const clientId = c.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'
  
  // Scopes Gmail pour lire ET envoyer des emails
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid',
    'profile'
  ].join(' ')
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `access_type=offline&` +
    `prompt=consent`
  
  return c.redirect(authUrl, 302)
})

// GET /api/auth/gmail/callback - OAuth callback
app.get('/api/auth/gmail/callback', async (c) => {
  try {
    const url = new URL(c.req.url)
    const code = url.searchParams.get('code')
    
    if (!code) {
      return c.text('Code manquant', 400)
    }
    
    const clientId = c.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET'
    const redirectUri = `${url.origin}/api/auth/gmail/callback`
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })
    
    const tokens: any = await tokenResponse.json()
    
    if (!tokens.access_token) {
      return c.text('Erreur d\'authentification', 401)
    }
    
    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    const userInfo: any = await userInfoResponse.json()
    
    // Store tokens in localStorage via redirect HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connexion Gmail réussie</title>
      </head>
      <body>
        <script>
          localStorage.setItem('gmail_access_token', '${tokens.access_token}');
          localStorage.setItem('gmail_refresh_token', '${tokens.refresh_token || ''}');
          localStorage.setItem('gmail_email', '${userInfo.email}');
          localStorage.setItem('gmail_expires_at', '${Date.now() + (tokens.expires_in * 1000)}');
          
          alert('✅ Gmail connecté avec succès !');
          window.location.href = '/';
        </script>
      </body>
      </html>
    `
    
    return c.html(html)
  } catch (error) {
    console.error('Gmail callback error:', error)
    return c.text('Erreur serveur', 500)
  }
})

// ============================================
// DATABASE INITIALIZATION ENDPOINT
// ============================================

app.post('/api/init-db', async (c) => {
  try {
    console.log('🔧 Initializing database tables...')
    
    // Créer table users si elle n'existe pas
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        company_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Créer table clients si elle n'existe pas
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        company TEXT,
        status TEXT DEFAULT 'lead',
        archived INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()
    
    // Créer table deals si elle n'existe pas
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        client_id INTEGER,
        title TEXT NOT NULL DEFAULT 'Nouveau dossier',
        amount REAL DEFAULT 0,
        stage TEXT DEFAULT 'lead',
        probability INTEGER DEFAULT 30,
        expected_close_date TEXT,
        notes TEXT,
        archived INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `).run()

    // Créer table leads si elle n'existe pas
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL DEFAULT 'email',
        source_ref TEXT NOT NULL UNIQUE,
        from_name TEXT,
        from_email TEXT,
        subject TEXT,
        snippet TEXT,
        body TEXT,
        stage TEXT NOT NULL DEFAULT 'new',
        priority TEXT DEFAULT 'normal',
        confidence INTEGER DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run()

    // Créer table quotes si elle n'existe pas
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        title TEXT,
        amount REAL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `).run()

    // Créer table tasks si elle n'existe pas
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Créer table calendar_events si elle n'existe pas
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        deal_id INTEGER,
        type TEXT DEFAULT 'event',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Créer table email_categories si elle n'existe pas
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_categories (
        email_id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run()

    // ============================================
    // MIGRATION: Ajouter colonnes manquantes si tables existaient déjà
    // ============================================
    const safeAddColumn = async (table: string, column: string, definition: string) => {
      try {
        await c.env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run()
        console.log(`✅ Colonne ${column} ajoutée à ${table}`)
      } catch (e) {
        // Colonne existe déjà - c'est OK
      }
    }

    // Clients: ajouter colonnes potentiellement manquantes
    await safeAddColumn('clients', 'status', "TEXT DEFAULT 'lead'")
    await safeAddColumn('clients', 'archived', 'INTEGER DEFAULT 0')
    await safeAddColumn('clients', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    await safeAddColumn('clients', 'lead_id', 'INTEGER')
    await safeAddColumn('clients', 'name', 'TEXT')
    await safeAddColumn('clients', 'address', 'TEXT')

    // Deals: ajouter colonnes potentiellement manquantes  
    await safeAddColumn('deals', 'archived', 'INTEGER DEFAULT 0')
    await safeAddColumn('deals', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    await safeAddColumn('deals', 'probability', 'INTEGER DEFAULT 30')
    await safeAddColumn('deals', 'notes', 'TEXT')
    await safeAddColumn('deals', 'rdv_date', 'TEXT')
    await safeAddColumn('deals', 'rdv_notes', 'TEXT')
    
    console.log('✅ Database tables initialized + migrations applied')
    
    return c.json({ 
      success: true, 
      message: 'Database initialized successfully',
      tables: ['users', 'clients', 'deals', 'leads', 'quotes', 'tasks', 'calendar_events', 'email_categories']
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    return c.json({ 
      error: 'Erreur initialisation base de données', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500)
  }
})

// ============================================
// EMAIL ROUTES
// ============================================

// GET /api/emails - Fetch Gmail emails (INBOX only - emails reçus uniquement)
app.get('/api/emails', async (c) => {
  try {
    const accessToken = c.req.query('access_token')
    
    if (!accessToken) {
      return c.json({ error: 'Access token manquant' }, 401)
    }
    
    // Appel Gmail API pour récupérer UNIQUEMENT les emails REÇUS (in:inbox)
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      return c.json({ error: 'Erreur Gmail API' }, response.status)
    }
    
    const data: any = await response.json()
    const messages = data.messages || []
    
    // Récupérer les détails de chaque email
    const emailPromises = messages.slice(0, 10).map(async (msg: any) => {
      const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      return detailResponse.json()
    })
    
    const emails = await Promise.all(emailPromises)
    
    // Formatter les emails
    const formattedEmails = emails.map((email: any) => {
      const headers = email.payload?.headers || []
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(Sans objet)'
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu'
      const date = headers.find((h: any) => h.name === 'Date')?.value || ''
      const to = headers.find((h: any) => h.name === 'To')?.value || ''
      
      return {
        id: email.id,
        threadId: email.threadId,
        subject,
        from,
        to,
        date,
        snippet: email.snippet || '',
        labelIds: email.labelIds || []
      }
    })
    
    return c.json({ emails: formattedEmails })
  } catch (error) {
    console.error('Emails fetch error:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// GET /api/emails/thread/:threadId - Récupérer le fil complet d'une conversation
app.get('/api/emails/thread/:threadId', async (c) => {
  try {
    const accessToken = c.req.query('access_token')
    const threadId = c.req.param('threadId')
    
    if (!accessToken) {
      return c.json({ error: 'Access token manquant' }, 401)
    }
    
    // Récupérer tous les messages du thread
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      return c.json({ error: 'Erreur Gmail API' }, response.status)
    }
    
    const thread: any = await response.json()
    const messages = thread.messages || []
    
    // Formatter tous les messages du fil
    const formattedMessages = messages.map((message: any) => {
      const headers = message.payload?.headers || []
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(Sans objet)'
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu'
      const to = headers.find((h: any) => h.name === 'To')?.value || ''
      const date = headers.find((h: any) => h.name === 'Date')?.value || ''
      
      // Récupérer le contenu du message
      let body = ''
      if (message.payload.parts) {
        const textPart = message.payload.parts.find((p: any) => p.mimeType === 'text/plain')
        if (textPart && textPart.body?.data) {
          body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
        }
      } else if (message.payload.body?.data) {
        body = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      }
      
      return {
        id: message.id,
        subject,
        from,
        to,
        date,
        snippet: message.snippet || '',
        body: body || message.snippet || '',
        labelIds: message.labelIds || []
      }
    })
    
    return c.json({ 
      threadId: thread.id,
      messages: formattedMessages
    })
  } catch (error) {
    console.error('Thread fetch error:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// POST /api/emails/classify - Classifier les emails avec IA
app.post('/api/emails/classify', async (c) => {
  try {
    const { emails } = await c.req.json()
    
    if (!emails || !Array.isArray(emails)) {
      return c.json({ error: 'Emails requis' }, 400)
    }
    
    // Vérifier si OpenAI est configuré
    const apiKey = c.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = c.env.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
    
    if (!apiKey) {
      return c.json({ error: 'OpenAI API key non configurée' }, 500)
    }
    
    // Classifier chaque email avec GPT
    const classifiedEmails = await Promise.all(
      emails.map(async (email: any) => {
        try {
          const prompt = `Tu es un assistant intelligent qui classe les emails professionnels.

Email à classifier :
- Sujet : ${email.subject}
- Expéditeur : ${email.from}
- Aperçu : ${email.snippet}

Catégories disponibles :
1. prospect - Demandes de devis, projets, nouveaux clients potentiels
2. factures - Factures, paiements, règlements
3. commandes - Commandes, achats, livraisons
4. clients - Communications avec les clients existants
5. fournisseurs - Communications avec les fournisseurs
6. urgent - Messages urgents ou importants
7. autres - Tout le reste

Réponds UNIQUEMENT avec un JSON au format :
{
  "category": "nom_categorie",
  "confidence": 0.95,
  "reason": "Raison courte",
  "priority": "high|medium|low",
  "suggested_action": "Action suggérée"
}

Ne rajoute AUCUN texte avant ou après le JSON.`

          const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Tu es un assistant de classification d\'emails. Réponds UNIQUEMENT en JSON valide.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 200
            })
          })
          
          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`)
          }
          
          const data: any = await response.json()
          const content = data.choices[0]?.message?.content || '{}'
          
          // Parser la réponse JSON
          let classification
          try {
            // Extraire le JSON s'il y a du texte avant/après
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            classification = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
          } catch (e) {
            classification = { category: 'autres', confidence: 0.5, reason: 'Erreur parsing', priority: 'low' }
          }
          
          return {
            ...email,
            ai_category: classification.category || 'autres',
            ai_confidence: classification.confidence || 0.5,
            ai_reason: classification.reason || '',
            ai_priority: classification.priority || 'medium',
            ai_suggested_action: classification.suggested_action || ''
          }
        } catch (error) {
          console.error('Classification error:', error)
          return {
            ...email,
            ai_category: 'autres',
            ai_confidence: 0,
            ai_reason: 'Erreur classification',
            ai_priority: 'medium'
          }
        }
      })
    )
    
    return c.json({ emails: classifiedEmails })
  } catch (error) {
    console.error('Classify error:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// POST /api/emails/send - Envoyer un email via Gmail
app.post('/api/emails/send', async (c) => {
  try {
    const { to, subject, message, accessToken, inReplyTo, threadId } = await c.req.json()
    
    if (!to || !subject || !message || !accessToken) {
      return c.json({ error: 'Paramètres manquants' }, 400)
    }
    
    // Construire l'email au format RFC 2822
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
    ]
    
    // Ajouter les en-têtes pour les réponses
    if (inReplyTo) {
      emailLines.push(`In-Reply-To: ${inReplyTo}`)
      emailLines.push(`References: ${inReplyTo}`)
    }
    
    emailLines.push('') // Ligne vide entre en-têtes et corps
    emailLines.push(message)
    
    const emailContent = emailLines.join('\r\n')
    
    // Encoder en base64url
    const base64Email = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    // Envoyer via Gmail API
    const url = threadId 
      ? `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
      : `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
    
    const body: any = { raw: base64Email }
    if (threadId) {
      body.threadId = threadId
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Gmail send error:', error)
      return c.json({ error: 'Erreur envoi email' }, response.status)
    }
    
    const result = await response.json()
    return c.json({ success: true, messageId: result.id })
  } catch (error) {
    console.error('Send email error:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// POST /api/emails/generate-reply - Générer une réponse avec IA
app.post('/api/emails/generate-reply', async (c) => {
  try {
    const { email, tone, instruction, userContext } = await c.req.json()
    
    const apiKey = c.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = c.env.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    
    if (!apiKey) {
      return c.json({ error: 'OpenAI non configuré' }, 500)
    }
    
    // Construction du contexte utilisateur si fourni
    const contextSection = userContext ? `

CONTEXTE DE L'UTILISATEUR :
${userContext}

Utilise ce contexte pour personnaliser ta réponse. N'invente JAMAIS d'informations qui ne sont pas dans ce contexte.` : ''
    
    const prompt = `Tu es un assistant qui aide à rédiger des emails professionnels.

Email reçu :
De : ${email.from}
Objet : ${email.subject}
Contenu : ${email.body || email.snippet}${contextSection}

${instruction}

RÈGLES STRICTES ET OBLIGATOIRES :
1. COMMENCE TOUJOURS PAR UNE FORMULE DE POLITESSE :
   - "Bonjour [Prénom]," si tu connais le prénom
   - "Bonjour," si tu ne connais pas le prénom
   - JAMAIS sans salutation initiale

2. STYLE PROFESSIONNEL :
   - Utilise le vouvoiement systématiquement
   - Utilise un vocabulaire soutenu et courtois
   - Évite les tournures familières ("caler", "afin de", etc.)
   - Préfère : "convenir d'un rendez-vous", "dans les plus brefs délais", "je vous remercie"

3. STRUCTURE DE L'EMAIL :
   - Salutation (Bonjour)
   - Corps du message (professionnel et courtois)
   - Formule de politesse finale
   - Signature

4. INTERDICTIONS :
   - N'invente JAMAIS de pièces jointes, documents ou informations non mentionnées
   - Si le contexte utilisateur mentionne quelque chose, utilise-le. Sinon, ne mentionne RIEN
   - Reste factuel et basé uniquement sur les informations fournies

Termine TOUJOURS par :

Cordialement,
Guillaume PINOIT
PSM Portails Sur Mesure
06 60 60 45 11`

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un assistant qui rédige des emails professionnels B2B de haut niveau. Tu DOIS toujours commencer par "Bonjour," ou "Bonjour [Prénom],". Utilise un français soutenu, courtois et professionnel. Vouvoie TOUJOURS. N\'invente RIEN.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      throw new Error('OpenAI API error')
    }
    
    const data: any = await response.json()
    const reply = data.choices[0]?.message?.content || ''
    
    return c.json({ reply: reply.trim() })
  } catch (error) {
    console.error('Generate reply error:', error)
    return c.json({ error: 'Erreur génération IA' }, 500)
  }
})

// POST /api/emails/improve-text - Améliorer un texte avec IA
app.post('/api/emails/improve-text', async (c) => {
  try {
    const { text } = await c.req.json()
    
    const apiKey = c.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = c.env.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    
    if (!apiKey) {
      return c.json({ error: 'OpenAI non configuré' }, 500)
    }
    
    const prompt = `Améliore ce texte d'email en le rendant plus professionnel, clair et courtois. Corrige les fautes si besoin. Garde le même ton général.

Texte original :
${text}

Texte amélioré :`

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un assistant qui améliore des emails. Réponds uniquement avec le texte amélioré.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      throw new Error('OpenAI API error')
    }
    
    const data: any = await response.json()
    const improved = data.choices[0]?.message?.content || ''
    
    return c.json({ improved: improved.trim() })
  } catch (error) {
    console.error('Improve text error:', error)
    return c.json({ error: 'Erreur amélioration IA' }, 500)
  }
})

// ============================================
// PROFILE ROUTES
// ============================================

// GET /api/profile - Get user profile
app.get('/api/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = JSON.parse(atob(token))

    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role, company_name FROM users WHERE id = ?'
    ).bind(decoded.id).first()

    if (!user) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404)
    }

    return c.json(user)
  } catch (error) {
    return c.json({ error: 'Token invalide' }, 401)
  }
})

// PUT /api/profile - Update user profile
app.put('/api/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = JSON.parse(atob(token))

    const { name, company_name } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE users SET name = ?, company_name = ? WHERE id = ?'
    ).bind(name, company_name, decoded.id).run()

    const updatedUser = await c.env.DB.prepare(
      'SELECT id, email, name, role, company_name FROM users WHERE id = ?'
    ).bind(decoded.id).first()

    return c.json(updatedUser)
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// CLIENT ROUTES (Stub - can be expanded)
// ============================================

app.get('/api/clients', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const archived = c.req.query('archived') === 'true'

    let clients
    try {
      const query = archived 
        ? 'SELECT * FROM clients WHERE archived = 1 ORDER BY created_at DESC'
        : 'SELECT * FROM clients WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC'
      clients = await c.env.DB.prepare(query).all()
    } catch (queryError) {
      // Fallback si la colonne archived n'existe pas
      console.log('⚠️ Colonne archived manquante, fallback sans filtre')
      clients = await c.env.DB.prepare('SELECT * FROM clients ORDER BY created_at DESC').all()
    }

    return c.json({ clients: clients.results || [] })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return c.json({ clients: [] })
  }
})

app.post('/api/clients', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const data = await c.req.json()

    // Vérifier si un client existe déjà avec cet email
    if (data.email) {
      const existing = await c.env.DB.prepare(
        'SELECT * FROM clients WHERE email = ? LIMIT 1'
      ).bind(data.email).first()

      if (existing) {
        console.log('Client existant trouvé pour', data.email)
        return c.json({ id: existing.id, ...existing, _existing: true }, 200)
      }
    }

    // Créer le nouveau client
    console.log('📝 Création client:', { name: data.name, email: data.email, phone: data.phone, address: data.address })
    
    // S'assurer que la colonne address existe
    try { await c.env.DB.prepare('ALTER TABLE clients ADD COLUMN address TEXT').run() } catch(e) {}
    
    try {
      const result = await c.env.DB.prepare(
        'INSERT INTO clients (name, email, phone, company, status, address) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        data.name || null,
        data.email || null,
        data.phone || null,
        data.company || null,
        data.status || 'lead',
        data.address || null
      ).run()

      console.log('✅ Client créé, id:', result.meta.last_row_id)
      return c.json({ id: result.meta.last_row_id, ...data }, 201)
    } catch (insertError) {
      const errMsg = insertError instanceof Error ? insertError.message : String(insertError)
      console.error('❌ Erreur INSERT client:', errMsg)
      
      // Si UNIQUE constraint failed, retourner le client existant
      if (errMsg.includes('UNIQUE constraint failed')) {
        console.log('🔄 UNIQUE constraint - recherche client existant pour', data.email)
        const existing = await c.env.DB.prepare(
          'SELECT * FROM clients WHERE email = ? LIMIT 1'
        ).bind(data.email).first()
        
        if (existing) {
          return c.json({ id: existing.id, ...existing, _existing: true }, 200)
        }
      }
      
      // Si colonne manquante, essayer sans 'status'
      if (errMsg.includes('no column named')) {
        console.log('🔄 Colonne manquante, retry sans status...')
        const result = await c.env.DB.prepare(
          'INSERT INTO clients (name, email, phone, company) VALUES (?, ?, ?, ?)'
        ).bind(
          data.name || null,
          data.email || null,
          data.phone || null,
          data.company || null
        ).run()
        return c.json({ id: result.meta.last_row_id, ...data }, 201)
      }
      
      throw insertError
    }
  } catch (error) {
    console.error('❌ Error creating client:', error)
    return c.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) }, 500)
  }
})

// GET /api/clients/:id - Récupérer un client spécifique
app.get('/api/clients/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const clientId = c.req.param('id')
    const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first()
    
    if (!client) {
      return c.json({ error: 'Client non trouvé' }, 404)
    }

    return c.json({ client })
  } catch (error) {
    console.error('Error fetching client:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// PUT /api/clients/:id - Mettre à jour un client
app.put('/api/clients/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const clientId = c.req.param('id')
    const data = await c.req.json()
    
    const updates: string[] = []
    const values: any[] = []
    
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
    if (data.first_name !== undefined) { updates.push('first_name = ?'); values.push(data.first_name) }
    if (data.last_name !== undefined) { updates.push('last_name = ?'); values.push(data.last_name) }
    if (data.civility !== undefined) { updates.push('civility = ?'); values.push(data.civility) }
    if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email) }
    if (data.phone !== undefined) { updates.push('phone = ?'); values.push(data.phone) }
    if (data.company !== undefined) { updates.push('company = ?'); values.push(data.company) }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status) }
    if (data.source !== undefined) { updates.push('source = ?'); values.push(data.source) }
    if (data.notes !== undefined) { updates.push('notes = ?'); values.push(data.notes) }
    if (data.address !== undefined) {
      try { await c.env.DB.prepare('ALTER TABLE clients ADD COLUMN address TEXT').run() } catch(e) {}
      updates.push('address = ?'); values.push(data.address)
    }
    if (data.archived !== undefined) { 
      try { updates.push('archived = ?'); values.push(data.archived ? 1 : 0) } catch(e) {} 
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(clientId)
    
    if (updates.length > 1) {
      await c.env.DB.prepare(
        `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run()
    }

    const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first()
    return c.json({ client, success: true })
  } catch (error) {
    console.error('Error updating client:', error)
    return c.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) }, 500)
  }
})

// DELETE /api/clients/:id - Supprimer un client
app.delete('/api/clients/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const clientId = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(clientId).run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// DEALS ROUTES
// ============================================

app.get('/api/deals', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const archived = c.req.query('archived') === 'true'

    let deals
    try {
      const query = archived 
        ? 'SELECT * FROM deals WHERE archived = 1 ORDER BY created_at DESC'
        : 'SELECT * FROM deals WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC'
      deals = await c.env.DB.prepare(query).all()
    } catch (queryError) {
      // Fallback si la colonne archived n'existe pas
      console.log('⚠️ Colonne archived manquante pour deals, fallback sans filtre')
      deals = await c.env.DB.prepare('SELECT * FROM deals ORDER BY created_at DESC').all()
    }

    // Enrichir les deals avec les infos client + compatibilité ancien format
    const enrichedDeals = await Promise.all(
      (deals.results || []).map(async (deal: any) => {
        let client = null
        if (deal.client_id) {
          try {
            client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(deal.client_id).first()
          } catch (e) {
            // ignore
          }
        }
        
        // Ajouter les propriétés de compatibilité avec l'ancien format du frontend
        return {
          ...deal,
          // Compatibilité: le frontend utilise 'status' mais la DB utilise 'stage'
          status: deal.stage || deal.status || 'lead',
          // Compatibilité: ancien format avec first_name/last_name
          first_name: client?.name?.split(' ')[0] || deal.title?.split(' ')[0] || '',
          last_name: client?.name?.split(' ').slice(1).join(' ') || '',
          // Compatibilité: infos client
          email: client?.email || '',
          phone: client?.phone || '',
          company: client?.company || '',
          address: client?.address || '',
          client_name: client?.name || '',
          client_email: client?.email || '',
          client_phone: client?.phone || '',
          client_address: client?.address || '',
          // Compatibilité: montant
          estimated_amount: deal.amount || 0,
          type: deal.title || 'Dossier',
        }
      })
    )

    return c.json({ deals: enrichedDeals })
  } catch (error) {
    console.error('Error fetching deals:', error)
    return c.json({ deals: [] })
  }
})

app.post('/api/deals', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    // Décoder le token pour récupérer user_id
    const token = authHeader.replace('Bearer ', '')
    
    let decoded
    try {
      decoded = JSON.parse(atob(token))
    } catch (tokenError) {
      console.error('❌ Erreur décodage token:', tokenError)
      return c.json({ 
        error: 'Token invalide', 
        details: 'Le token d\'authentification est mal formé ou corrompu' 
      }, 401)
    }

    const data = await c.req.json()
    console.log('📝 Création deal:', { title: data.title, client_id: data.client_id, user_id: decoded.id })

    // Format unifié : INSERT dans deals avec les colonnes du schéma actuel
    try {
      const result = await c.env.DB.prepare(
        'INSERT INTO deals (user_id, client_id, title, amount, stage, probability, expected_close_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        decoded.id,
        data.client_id || null,
        data.title || 'Nouveau dossier',
        data.amount || 0,
        data.stage || 'lead',
        data.probability || 30,
        data.expected_close_date || null,
        data.notes || null
      ).run()

      console.log('✅ Deal créé, id:', result.meta.last_row_id)
      return c.json({ id: result.meta.last_row_id, ...data }, 201)
    } catch (insertError) {
      const errMsg = insertError instanceof Error ? insertError.message : String(insertError)
      console.error('❌ Erreur INSERT deal:', errMsg)
      
      // Si colonne manquante, essayer avec les colonnes de base uniquement
      if (errMsg.includes('no column named')) {
        console.log('🔄 Colonne manquante, retry avec colonnes de base...')
        const result = await c.env.DB.prepare(
          'INSERT INTO deals (user_id, client_id, title, amount, stage) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          decoded.id,
          data.client_id || null,
          data.title || 'Nouveau dossier',
          data.amount || 0,
          data.stage || 'lead'
        ).run()
        console.log('✅ Deal créé (colonnes de base), id:', result.meta.last_row_id)
        return c.json({ id: result.meta.last_row_id, ...data }, 201)
      }
      
      throw insertError
    }
  } catch (error) {
    console.error('❌ Error creating deal:', error)
    return c.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) }, 500)
  }
})

// GET /api/deals/priority - Deals prioritaires
app.get('/api/deals/priority', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    let deals
    try {
      deals = await c.env.DB.prepare(
        'SELECT * FROM deals WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC LIMIT 20'
      ).all()
    } catch (e) {
      deals = await c.env.DB.prepare('SELECT * FROM deals ORDER BY created_at DESC LIMIT 20').all()
    }

    return c.json({ deals: deals.results || [], priorities: [] })
  } catch (error) {
    console.error('Error fetching priority deals:', error)
    return c.json({ deals: [], priorities: [] })
  }
})

// GET /api/deals/:id - Récupérer un deal spécifique
app.get('/api/deals/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const dealId = c.req.param('id')
    const deal: any = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(dealId).first()
    
    if (!deal) {
      return c.json({ error: 'Deal non trouvé' }, 404)
    }

    // Enrichir avec les infos client
    let client = null
    if (deal.client_id) {
      try {
        client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(deal.client_id).first() as any
      } catch (e) {
        // ignore
      }
    }

    const enrichedDeal = {
      ...deal,
      status: deal.stage || deal.status || 'lead',
      first_name: client?.name?.split(' ')[0] || deal.title?.split(' ')[0] || '',
      last_name: client?.name?.split(' ').slice(1).join(' ') || '',
      email: client?.email || '',
      phone: client?.phone || '',
      company: client?.company || '',
      address: client?.address || '',
      client_name: client?.name || '',
      client_email: client?.email || '',
      client_phone: client?.phone || '',
      client_address: client?.address || '',
      estimated_amount: deal.amount || 0,
      type: deal.title || 'Dossier',
    }

    return c.json({ deal: enrichedDeal })
  } catch (error) {
    console.error('Error fetching deal:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// PUT /api/deals/:id - Mettre à jour un deal
app.put('/api/deals/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const dealId = c.req.param('id')
    const data = await c.req.json()
    console.log(`📝 PUT /api/deals/${dealId}:`, JSON.stringify(data))
    
    // Construire dynamiquement la requête UPDATE
    const updates: string[] = []
    const values: any[] = []
    
    // Champs de base (colonnes toujours présentes)
    const stageValue = data.stage || data.status // Accepter les deux noms
    if (stageValue !== undefined) { updates.push('stage = ?'); values.push(stageValue) }
    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title) }
    if (data.amount !== undefined) { updates.push('amount = ?'); values.push(data.amount) }
    if (data.probability !== undefined) { updates.push('probability = ?'); values.push(data.probability) }
    if (data.expected_close_date !== undefined) { updates.push('expected_close_date = ?'); values.push(data.expected_close_date) }
    if (data.notes !== undefined) { updates.push('notes = ?'); values.push(data.notes) }
    if (data.client_id !== undefined) { updates.push('client_id = ?'); values.push(data.client_id) }
    if (data.archived !== undefined) { updates.push('archived = ?'); values.push(data.archived ? 1 : 0) }
    
    // Champs RDV (colonnes qui peuvent ne pas exister)
    const hasRdvFields = data.rdv_date !== undefined || data.rdv_notes !== undefined
    if (hasRdvFields) {
      // D'abord essayer d'ajouter les colonnes si elles n'existent pas
      try { await c.env.DB.prepare('ALTER TABLE deals ADD COLUMN rdv_date TEXT').run() } catch(e) {}
      try { await c.env.DB.prepare('ALTER TABLE deals ADD COLUMN rdv_notes TEXT').run() } catch(e) {}
      
      if (data.rdv_date !== undefined) { updates.push('rdv_date = ?'); values.push(data.rdv_date) }
      if (data.rdv_notes !== undefined) { updates.push('rdv_notes = ?'); values.push(data.rdv_notes) }
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(dealId)
    
    console.log(`📝 SQL: UPDATE deals SET ${updates.join(', ')} WHERE id = ?`, values)
    
    await c.env.DB.prepare(
      `UPDATE deals SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    // Retourner le deal enrichi
    const deal: any = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(dealId).first()
    
    // Enrichir avec infos client
    let client = null
    if (deal?.client_id) {
      try { client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(deal.client_id).first() as any } catch(e) {}
    }
    
    const enrichedDeal = {
      ...deal,
      status: deal?.stage || 'lead',
      first_name: client?.name?.split(' ')[0] || deal?.title?.split(' ')[0] || '',
      last_name: client?.name?.split(' ').slice(1).join(' ') || '',
      client_name: client?.name || '',
      client_email: client?.email || '',
      client_phone: client?.phone || '',
      client_address: client?.address || '',
      email: client?.email || '',
      phone: client?.phone || '',
      company: client?.company || '',
      address: client?.address || '',
      estimated_amount: deal?.amount || 0,
      type: deal?.title || 'Dossier',
    }
    
    console.log(`✅ Deal ${dealId} mis à jour:`, JSON.stringify(enrichedDeal))
    return c.json({ deal: enrichedDeal, success: true })
  } catch (error) {
    console.error('❌ Error updating deal:', error)
    return c.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) }, 500)
  }
})

// DELETE /api/deals/:id - Supprimer un deal
app.delete('/api/deals/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const dealId = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(dealId).run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting deal:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// QUOTES ROUTES
// ============================================

app.get('/api/quotes', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const dealId = c.req.query('deal_id')
    let quotes
    
    if (dealId) {
      // Filtrer par deal_id si fourni
      try {
        quotes = await c.env.DB.prepare(
          'SELECT * FROM quotes WHERE deal_id = ? ORDER BY created_at DESC'
        ).bind(dealId).all()
      } catch (e) {
        // Si colonne deal_id n'existe pas, retourner vide
        quotes = { results: [] }
      }
    } else {
      quotes = await c.env.DB.prepare(
        'SELECT * FROM quotes ORDER BY created_at DESC'
      ).all()
    }

    return c.json({ quotes: quotes.results || [] })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return c.json({ quotes: [] })
  }
})

app.post('/api/quotes', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const data = await c.req.json()

    const result = await c.env.DB.prepare(
      'INSERT INTO quotes (quote_number, client_id, amount, status, notes) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      data.quote_number,
      data.client_id,
      data.amount || 0,
      data.status || 'brouillon',
      data.notes || null
    ).run()

    return c.json({ id: result.meta.last_row_id, ...data }, 201)
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// TASKS ROUTES
// ============================================

// GET /api/photos - Récupérer les photos (mock pour l'instant)
app.get('/api/photos', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }
    return c.json({ photos: [] })
  } catch (error) {
    return c.json({ photos: [] })
  }
})

// POST /api/photos - Upload photo (mock)
app.post('/api/photos', async (c) => {
  return c.json({ error: 'Fonctionnalité en cours de développement' }, 501)
})

// DELETE /api/photos/:id - Delete photo (mock)
app.delete('/api/photos/:id', async (c) => {
  return c.json({ success: true })
})

app.get('/api/tasks', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const tasks = await c.env.DB.prepare(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    ).all()

    return c.json(tasks.results || [])
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json([])
  }
})

app.post('/api/tasks', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const data = await c.req.json()

    const result = await c.env.DB.prepare(
      'INSERT INTO tasks (title, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      data.title,
      data.description || null,
      data.due_date || null,
      data.priority || 'medium',
      data.status || 'todo'
    ).run()

    return c.json({ id: result.meta.last_row_id, ...data }, 201)
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// CALENDAR EVENTS ROUTES
// ============================================

app.get('/api/calendar-events', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const events = await c.env.DB.prepare(
      'SELECT * FROM calendar_events ORDER BY start_date ASC'
    ).all()

    return c.json(events.results || [])
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return c.json([])
  }
})

app.post('/api/calendar-events', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const data = await c.req.json()

    const result = await c.env.DB.prepare(
      'INSERT INTO calendar_events (title, description, start_date, end_date, deal_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      data.title,
      data.description || null,
      data.start_date,
      data.end_date || null,
      data.deal_id || null
    ).run()

    return c.json({ id: result.meta.last_row_id, ...data }, 201)
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// NOTIFICATIONS ROUTES
// ============================================

app.get('/api/notifications', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    // Mock data - in real app, fetch from DB
    return c.json({
      notifications: [],
      unread_count: 0
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return c.json({ notifications: [], unread_count: 0 })
  }
})

app.post('/api/notifications/:id/read', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.post('/api/notifications/read-all', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.delete('/api/notifications/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.post('/api/notifications/generate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    return c.json({
      success: true,
      notifications: []
    })
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// REPORTS ROUTES
// ============================================

app.get('/api/reports/weekly/history', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    // Mock data - in real app, fetch from DB
    return c.json({
      reports: []
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return c.json({ reports: [] })
  }
})

app.post('/api/reports/weekly/generate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    // Mock data - in real app, generate from DB
    const now = new Date()
    const weekNumber = Math.ceil((now.getDate()) / 7)
    
    return c.json({
      report: {
        id: Date.now(),
        week: weekNumber,
        year: now.getFullYear(),
        stats: {
          new_leads: 0,
          quotes_sent: 0,
          quotes_accepted: 0,
          revenue: 0,
          time_saved: '0h0m'
        }
      }
    })
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// STATS ROUTES (Mock data for now)
// ============================================

app.get('/api/stats/advanced', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    // Mock data - in real app, calculate from DB
    return c.json({
      totalTimeManual: 285,
      totalTimeKarl: 65,
      timeSaved: 220,
      percentageSaved: 77,
      tasksAutomated: 15,
      avgTimePerTask: 14.7
    })
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ============================================
// DEFAULT ROUTE - Serve HTML
// ============================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="KARL CRM - Votre assistant commercial intelligent pour gérer clients, devis et tâches">
        <meta name="theme-color" content="#2563eb">
        <title>KARL CRM - Votre Assistant Commercial Intelligent</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <link rel="icon" type="image/svg+xml" href="/icons/icon-512.svg">
        <link rel="apple-touch-icon" href="/icons/icon-192.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="KARL CRM">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="/static/karl-app.js"></script>
        <script src="/static/dossier-client.js"></script>
        
        <!-- Service Worker Registration - DÉSACTIVÉ pour debug -->
        <script>
          // Service Worker temporairement désactivé
          console.log('⚠️ Service Worker désactivé pour éviter les erreurs de cache');
          
          // Désenregistrer tous les SW existants
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              for (let registration of registrations) {
                registration.unregister().then(() => {
                  console.log('🗑️ Service Worker désenregistré');
                });
              }
            });
          }
        </script>
    </body>
    </html>
  `)
})

// Catch-all for SPA routing
app.get('/*', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="KARL CRM - Votre assistant commercial intelligent pour gérer clients, devis et tâches">
        <meta name="theme-color" content="#2563eb">
        <title>KARL CRM - Votre Assistant Commercial Intelligent</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <link rel="icon" type="image/svg+xml" href="/icons/icon-512.svg">
        <link rel="apple-touch-icon" href="/icons/icon-192.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="KARL CRM">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="/static/karl-app.js"></script>
        <script src="/static/dossier-client.js"></script>
        
        <!-- Service Worker Registration - DÉSACTIVÉ pour debug -->
        <script>
          // Service Worker temporairement désactivé
          console.log('⚠️ Service Worker désactivé pour éviter les erreurs de cache');
          
          // Désenregistrer tous les SW existants
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              for (let registration of registrations) {
                registration.unregister().then(() => {
                  console.log('🗑️ Service Worker désenregistré');
                });
              }
            });
          }
        </script>
    </body>
    </html>
  `)
})

// ===== GESTION DOCUMENTAIRE CLIENT =====

// POST /api/documents/upload - Upload un document (devis/photo)
app.post('/api/documents/upload', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const formData = await c.req.formData()
    const clientId = formData.get('client_id') as string
    const type = formData.get('type') as string // 'devis' ou 'photo'
    const title = formData.get('title') as string
    const file = formData.get('file') as File

    if (!clientId || !type || !file) {
      return c.json({ error: 'Paramètres manquants' }, 400)
    }

    // Lire le fichier en base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Stocker dans D1
    const db = c.env.DB
    
    // Créer la table si elle n'existe pas
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT,
        file_size INTEGER,
        file_type TEXT,
        file_data TEXT,
        content TEXT,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run()

    const result = await db.prepare(`
      INSERT INTO client_documents (client_id, type, title, file_name, file_size, file_type, file_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      clientId,
      type,
      title || file.name,
      file.name,
      file.size,
      file.type,
      base64
    ).run()

    return c.json({
      id: result.meta.last_row_id,
      client_id: clientId,
      type,
      title: title || file.name,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      message: 'Document uploadé avec succès'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Erreur upload document' }, 500)
  }
})

// GET /api/documents/:clientId - Lister documents d'un client
app.get('/api/documents/:clientId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const clientId = c.req.param('clientId')
    const type = c.req.query('type') // Filtrer par type (optionnel)

    const db = c.env.DB

    let query = `
      SELECT id, client_id, type, title, description, file_name, 
             file_size, file_type, created_at, updated_at
      FROM client_documents 
      WHERE client_id = ?
    `
    const params: any[] = [clientId]

    if (type) {
      query += ` AND type = ?`
      params.push(type)
    }

    query += ` ORDER BY created_at DESC`

    const result = await db.prepare(query).bind(...params).all()

    return c.json({
      documents: result.results || [],
      total: result.results?.length || 0
    })
  } catch (error) {
    console.error('List documents error:', error)
    return c.json({ error: 'Erreur récupération documents' }, 500)
  }
})

// GET /api/documents/file/:id - Télécharger un document
app.get('/api/documents/file/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const id = c.req.param('id')
    const db = c.env.DB

    const result = await db.prepare(`
      SELECT file_data, file_name, file_type 
      FROM client_documents 
      WHERE id = ?
    `).bind(id).first()

    if (!result || !result.file_data) {
      return c.json({ error: 'Document introuvable' }, 404)
    }

    // Décoder le base64
    const binaryString = atob(result.file_data as string)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return new Response(bytes, {
      headers: {
        'Content-Type': result.file_type as string || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${result.file_name}"`
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return c.json({ error: 'Erreur téléchargement document' }, 500)
  }
})

// DELETE /api/documents/:id - Supprimer un document
app.delete('/api/documents/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const id = c.req.param('id')
    const db = c.env.DB

    await db.prepare(`
      DELETE FROM client_documents WHERE id = ?
    `).bind(id).run()

    return c.json({ message: 'Document supprimé' })
  } catch (error) {
    console.error('Delete error:', error)
    return c.json({ error: 'Erreur suppression document' }, 500)
  }
})

// POST /api/documents/note - Créer/Modifier une note
app.post('/api/documents/note', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Non autorisé' }, 401)
    }

    const { client_id, title, content, id } = await c.req.json()

    if (!client_id || !title || !content) {
      return c.json({ error: 'Paramètres manquants' }, 400)
    }

    const db = c.env.DB

    // Créer la table si elle n'existe pas
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT,
        file_size INTEGER,
        file_type TEXT,
        file_data TEXT,
        content TEXT,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run()

    if (id) {
      // Mise à jour
      await db.prepare(`
        UPDATE client_documents 
        SET title = ?, content = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(title, content, id).run()

      return c.json({ id, message: 'Note mise à jour' })
    } else {
      // Création
      const result = await db.prepare(`
        INSERT INTO client_documents (client_id, type, title, content)
        VALUES (?, 'note', ?, ?)
      `).bind(client_id, title, content).run()

      return c.json({
        id: result.meta.last_row_id,
        message: 'Note créée'
      })
    }
  } catch (error) {
    console.error('Note error:', error)
    return c.json({ error: 'Erreur note' }, 500)
  }
})

export default app
