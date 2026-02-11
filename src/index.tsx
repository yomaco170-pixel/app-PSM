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

// GET /api/emails - Fetch Gmail emails
app.get('/api/emails', async (c) => {
  try {
    const accessToken = c.req.query('access_token')
    
    if (!accessToken) {
      return c.json({ error: 'Access token manquant' }, 401)
    }
    
    // Appel Gmail API pour récupérer les emails
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20', {
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
      
      return {
        id: email.id,
        subject,
        from,
        date,
        snippet: email.snippet || ''
      }
    })
    
    return c.json({ emails: formattedEmails })
  } catch (error) {
    console.error('Emails fetch error:', error)
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
1. devis - Emails liés aux devis, estimations, propositions commerciales
2. factures - Factures, paiements, règlements
3. commandes - Commandes, achats, livraisons
4. clients - Communications avec les clients
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

    const query = archived 
      ? 'SELECT * FROM clients WHERE archived = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM clients WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC'

    const clients = await c.env.DB.prepare(query).all()

    return c.json({ clients: clients.results || [] })
  } catch (error) {
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

    const result = await c.env.DB.prepare(
      'INSERT INTO clients (name, email, phone, company, status) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      data.name,
      data.email,
      data.phone || null,
      data.company || null,
      data.status || 'lead'
    ).run()

    return c.json({ id: result.meta.last_row_id, ...data }, 201)
  } catch (error) {
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

    const query = archived 
      ? 'SELECT * FROM deals WHERE archived = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM deals WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC'

    const deals = await c.env.DB.prepare(query).all()

    return c.json({ deals: deals.results || [] })
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

    const data = await c.req.json()

    const result = await c.env.DB.prepare(
      'INSERT INTO deals (first_name, last_name, email, phone, company, type, status, estimated_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.company || null,
      data.type || 'Résidentiel',
      data.status || 'lead',
      data.estimated_amount || 0
    ).run()

    return c.json({ id: result.meta.last_row_id, ...data }, 201)
  } catch (error) {
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

    const quotes = await c.env.DB.prepare(
      'SELECT * FROM quotes ORDER BY created_at DESC'
    ).all()

    return c.json(quotes.results || [])
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return c.json([])
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
        
        <!-- Service Worker Registration -->
        <script>
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ Service Worker enregistré'))
                .catch(err => console.log('❌ Erreur Service Worker:', err));
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
        
        <!-- Service Worker Registration -->
        <script>
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ Service Worker enregistré'))
                .catch(err => console.log('❌ Erreur Service Worker:', err));
            });
          }
        </script>
    </body>
    </html>
  `)
})

export default app
