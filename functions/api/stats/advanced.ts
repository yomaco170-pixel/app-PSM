// Cloudflare Pages Function: /api/stats/advanced
export async function onRequestGet(context: any) {
  try {
    // Route mock - retourne des stats vides
    return new Response(JSON.stringify({ 
      totalTimeManual: 0,
      totalTimeKarl: 0,
      timeSaved: 0,
      percentageSaved: 0,
      tasksAutomated: 0,
      avgTimePerTask: 0
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      totalTimeManual: 0,
      totalTimeKarl: 0,
      timeSaved: 0,
      percentageSaved: 0,
      tasksAutomated: 0,
      avgTimePerTask: 0
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json'
      }
    });
  }
}
