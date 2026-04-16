// Cloudflare Pages Function: /api/emails/[id]
// Récupère le contenu COMPLET d'un email Gmail

export async function onRequestGet(context: { request: Request; params: { id: string } }) {
  try {
    const url = new URL(context.request.url)
    const accessToken = url.searchParams.get('access_token')
    const emailId = context.params.id

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Token manquant' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Récupérer le message COMPLET depuis Gmail API
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`)
    }

    const message = await response.json() as any

    // Décoder base64url → texte UTF-8 (compatible Cloudflare Workers)
    const decodeBase64url = (str: string): string => {
      try {
        // base64url → base64 standard
        const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
        // Padding si nécessaire
        const padded = b64 + '=='.slice(0, (4 - b64.length % 4) % 4)
        // Décoder en bytes puis convertir en UTF-8
        const binary = atob(padded)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        return new TextDecoder('utf-8').decode(bytes)
      } catch (e) {
        return ''
      }
    }

    // Extraire récursivement le texte plain/html depuis la structure MIME
    const extractParts = (payload: any): { plain: string; html: string } => {
      let plain = ''
      let html = ''

      if (!payload) return { plain, html }

      const mime = payload.mimeType || ''

      // Cas simple : text/plain ou text/html directement dans body
      if (mime === 'text/plain' && payload.body?.data) {
        plain = decodeBase64url(payload.body.data)
        return { plain, html }
      }
      if (mime === 'text/html' && payload.body?.data) {
        html = decodeBase64url(payload.body.data)
        return { plain, html }
      }

      // Cas multipart : parcourir toutes les parties
      if (payload.parts && Array.isArray(payload.parts)) {
        for (const part of payload.parts) {
          const sub = extractParts(part)
          if (sub.plain) plain += (plain ? '\n' : '') + sub.plain
          if (sub.html) html += (html ? '\n' : '') + sub.html
        }
      }

      return { plain, html }
    }

    const { plain, html } = extractParts(message.payload)

    // Convertir HTML en texte brut si nécessaire
    const htmlToText = (htmlStr: string): string => {
      return htmlStr
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/td>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    // Priorité : texte brut > HTML converti > snippet
    let body = ''
    if (plain && plain.length > 50) {
      body = plain
    } else if (html && html.length > 50) {
      body = htmlToText(html)
    } else {
      body = message.snippet || ''
    }

    return new Response(JSON.stringify({
      id: emailId,
      body,
      snippet: message.snippet || ''
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Gmail get email error:', error)
    return new Response(JSON.stringify({
      error: 'Erreur serveur',
      details: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
