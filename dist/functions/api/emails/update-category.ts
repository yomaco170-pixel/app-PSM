// API endpoint pour mettre à jour la catégorie d'un email
// POST /api/emails/update-category

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
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

    // Extraire les données de la requête
    const body = await request.json();
    const { emailId, category } = body;

    if (!emailId || !category) {
      return new Response(JSON.stringify({ error: 'emailId et category requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Catégories valides
    const validCategories = [
      'prospect', 'devis', 'factures', 'commandes', 
      'clients', 'fournisseurs', 'urgent', 'autres'
    ];

    if (!validCategories.includes(category)) {
      return new Response(JSON.stringify({ error: 'Catégorie invalide' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Créer la table email_categories si elle n'existe pas
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_categories (
        email_id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run();

    // Insérer ou mettre à jour la catégorie
    await env.DB.prepare(`
      INSERT INTO email_categories (email_id, category, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(email_id) DO UPDATE SET
        category = excluded.category,
        updated_at = excluded.updated_at
    `).bind(emailId, category).run();

    return new Response(JSON.stringify({ 
      success: true,
      emailId,
      category,
      message: 'Catégorie mise à jour avec succès'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur update-category:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur serveur',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
