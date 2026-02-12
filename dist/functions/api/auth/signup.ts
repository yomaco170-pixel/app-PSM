// Cloudflare Pages Function: /api/auth/signup
interface Env {
  DB: D1Database
}

// Helper: Hash password with SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { email, name, password, company_name } = await context.request.json()

    if (!email || !name || !password) {
      return new Response(JSON.stringify({ error: 'Tous les champs sont requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user already exists
    const existingUser = await context.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Un compte existe déjà avec cet email' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Insert new user
    const result = await context.env.DB.prepare(
      'INSERT INTO users (email, name, password, role, company_name) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      email,
      name,
      hashedPassword,
      'user',
      company_name || 'Ma Société'
    ).run()

    // Generate token
    const token = btoa(JSON.stringify({ 
      id: result.meta.last_row_id, 
      email, 
      exp: Date.now() + 24 * 60 * 60 * 1000 
    }))

    return new Response(JSON.stringify({
      token,
      user: {
        id: result.meta.last_row_id,
        email,
        name,
        role: 'user',
        company_name: company_name || 'Ma Société'
      }
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
