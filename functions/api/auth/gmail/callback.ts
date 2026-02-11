// Cloudflare Pages Function: /api/auth/gmail/callback
interface Env {
  DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url)
    const code = url.searchParams.get('code')
    
    if (!code) {
      return new Response('Code manquant', { status: 400 })
    }
    
    const clientId = context.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'
    const clientSecret = context.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET'
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
    
    const tokens = await tokenResponse.json() as any
    
    if (!tokens.access_token) {
      return new Response('Erreur d\'authentification', { status: 401 })
    }
    
    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    const userInfo = await userInfoResponse.json() as any
    
    // Store tokens in localStorage via redirect
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
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Gmail callback error:', error)
    return new Response('Erreur serveur', { status: 500 })
  }
}
