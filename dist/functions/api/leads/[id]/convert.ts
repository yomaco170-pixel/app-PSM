import { Hono } from 'hono'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

// POST /api/leads/{id}/convert - Convertir un lead en client
app.post('/', async (c) => {
  try {
    const leadId = c.req.param('id')
    
    if (!leadId) {
      return c.json({ error: 'ID du lead requis' }, 400)
    }

    const db = c.env.DB

    // 1. Récupérer le lead
    const lead = await db
      .prepare('SELECT * FROM leads WHERE id = ?')
      .bind(leadId)
      .first()

    if (!lead) {
      return c.json({ error: 'Lead introuvable' }, 404)
    }

    if (lead.stage === 'converted') {
      return c.json({ error: 'Lead déjà converti' }, 400)
    }

    // 2. Vérifier si un client existe déjà avec cet email
    let client = await db
      .prepare('SELECT * FROM clients WHERE email = ?')
      .bind(lead.from_email)
      .first()

    // 3. Si le client n'existe pas, le créer
    if (!client) {
      const insertClient = await db
        .prepare(
          `INSERT INTO clients (lead_id, name, email, phone, company, created_at) 
           VALUES (?, ?, ?, ?, ?, datetime('now'))`
        )
        .bind(
          leadId,
          lead.from_name || 'Inconnu',
          lead.from_email,
          '', // phone vide par défaut
          '' // company vide par défaut
        )
        .run()

      if (!insertClient.success) {
        console.error('❌ Erreur création client:', insertClient)
        return c.json({ error: 'Erreur lors de la création du client' }, 500)
      }

      // Récupérer le client créé
      client = await db
        .prepare('SELECT * FROM clients WHERE id = ?')
        .bind(insertClient.meta.last_row_id)
        .first()
    } else {
      // Si le client existe déjà, mettre à jour le lead_id
      await db
        .prepare('UPDATE clients SET lead_id = ? WHERE id = ?')
        .bind(leadId, client.id)
        .run()
    }

    // 4. Mettre à jour le lead : stage = 'converted'
    await db
      .prepare(
        `UPDATE leads 
         SET stage = 'converted', updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(leadId)
      .run()

    // 5. Récupérer le lead mis à jour
    const updatedLead = await db
      .prepare('SELECT * FROM leads WHERE id = ?')
      .bind(leadId)
      .first()

    console.log('✅ Lead converti en client:', { lead: updatedLead, client })

    return c.json({
      success: true,
      lead: updatedLead,
      client
    })
  } catch (error) {
    console.error('❌ Erreur conversion lead:', error)
    return c.json({ 
      error: 'Erreur serveur', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500)
  }
})

export default app
