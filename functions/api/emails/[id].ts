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
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`)
    }
    
    const message = await response.json() as any
    
    // Fonction pour décoder le contenu base64url
    const decodeBase64 = (str: string): string => {
      try {
        // Remplacer les caractères base64url par base64 standard
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
        // Décoder en UTF-8
        return decodeURIComponent(escape(atob(base64)))
      } catch (e) {
        return str
      }
    }
    
    // Fonction récursive pour extraire le texte de la structure MIME
    const extractText = (payload: any): string => {
      if (!payload) return ''
      
      // Si c'est un texte brut directement
      if (payload.body && payload.body.data) {
        return decodeBase64(payload.body.data)
      }
      
      // Si c'est multipart, chercher la partie text/plain ou text/html
      if (payload.parts && Array.isArray(payload.parts)) {
        let textContent = ''
        let htmlContent = ''
        
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            textContent = decodeBase64(part.body.data)
          } else if (part.mimeType === 'text/html' && part.body?.data) {
            htmlContent = decodeBase64(part.body.data)
          } else if (part.parts) {
            // Récursif pour les structures imbriquées
            const nested = extractText(part)
            if (nested) textContent += '\n' + nested
          }
        }
        
        // Préférer le texte brut, sinon HTML
        return textContent || htmlContent
      }
      
      return ''
    }
    
    const body = extractText(message.payload)
    const snippet = message.snippet || ''
    
    return new Response(JSON.stringify({ 
      id: emailId,
      body: body || snippet,
      snippet: snippet
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
