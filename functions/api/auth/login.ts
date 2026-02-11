// Cloudflare Pages Function: /api/auth/login
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
    const { email, password } = await context.request.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email et mot de passe requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Query user from D1
    const result = await context.env.DB.prepare(
      'SELECT id, email, name, role, company_name FROM users WHERE email = ? AND password = ?'
    ).bind(email, hashedPassword).first()

    if (!result) {
      return new Response(JSON.stringify({ error: 'Email ou mot de passe incorrect' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate token
    const token = btoa(JSON.stringify({ 
      id: result.id, 
      email: result.email, 
      exp: Date.now() + 24 * 60 * 60 * 1000 
    }))

    return new Response(JSON.stringify({
      token,
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        company_name: result.company_name
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
