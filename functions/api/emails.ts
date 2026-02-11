// Cloudflare Pages Function: /api/emails
export async function onRequestGet(context: { request: Request }) {
  try {
    const url = new URL(context.request.url)
    const accessToken = url.searchParams.get('access_token')
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Token manquant' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get list of messages
    const messagesResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )
    
    const messagesData = await messagesResponse.json() as any
    
    if (!messagesData.messages) {
      return new Response(JSON.stringify({ emails: [] }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get details for each message
    const emails = await Promise.all(
      messagesData.messages.slice(0, 20).map(async (msg: any) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        )
        const detail = await detailResponse.json() as any
        
        const headers = detail.payload.headers
        const getHeader = (name: string) => 
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
        
        return {
          id: msg.id,
          threadId: msg.threadId,
          from: getHeader('From'),
          to: getHeader('To'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          snippet: detail.snippet,
          labelIds: detail.labelIds || []
        }
      })
    )
    
    return new Response(JSON.stringify({ emails }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Gmail list error:', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
