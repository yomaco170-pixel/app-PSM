// Cloudflare Pages Function: /api/auth/gmail
interface Env {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url)
  const redirectUri = `${url.origin}/api/auth/gmail/callback`
  
  const clientId = context.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ')
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `access_type=offline&` +
    `prompt=consent`
  
  return Response.redirect(authUrl, 302)
}
