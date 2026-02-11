// Cloudflare Pages Function: /api/notifications/generate
export async function onRequestPost(context: any) {
  try {
    // Route mock - retourne des notifications vides
    return new Response(JSON.stringify({ 
      success: true,
      notifications: []
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json'
      }
    });
  }
}
