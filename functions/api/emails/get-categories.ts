// API endpoint pour récupérer les catégories sauvegardées
// GET /api/emails/get-categories

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Créer la table si elle n'existe pas
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_categories (
        email_id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run();

    // Récupérer toutes les catégories
    const result = await env.DB.prepare(`
      SELECT email_id, category
      FROM email_categories
    `).all();

    // Transformer en objet { emailId: category }
    const categories: Record<string, string> = {};
    result.results.forEach((row: any) => {
      categories[row.email_id] = row.category;
    });

    return new Response(JSON.stringify({ 
      success: true,
      categories,
      count: Object.keys(categories).length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur get-categories:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur serveur',
      details: error.message,
      categories: {} // Fallback
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
