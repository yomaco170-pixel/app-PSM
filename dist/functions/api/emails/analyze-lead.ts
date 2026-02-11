import { Hono } from 'hono'

const app = new Hono<{ Bindings: { OPENAI_API_KEY?: string; OPENAI_BASE_URL?: string } }>()

// POST /api/emails/analyze-lead - Analyser un email avec l'IA pour créer un lead
app.post('/', async (c) => {
  try {
    const { from, subject, body, date } = await c.req.json()
    
    if (!from || !subject) {
      return c.json({ error: 'Email incomplet' }, 400)
    }
    
    // Vérifier si OpenAI est configuré
    const apiKey = c.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = c.env.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
    
    if (!apiKey) {
      console.error('❌ OpenAI API key non configurée')
      // Retourner des données par défaut si pas d'IA
      const emailMatch = from.match(/[\w.-]+@[\w.-]+/)
      const nameMatch = from.replace(/<.*>/, '').trim()
      
      return c.json({
        name: nameMatch || emailMatch?.[0]?.split('@')[0] || 'Prospect',
        email: emailMatch?.[0] || '',
        company: '',
        phone: '',
        title: subject,
        need: body.substring(0, 100),
        urgency: 'medium',
        estimatedAmount: 0,
        expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suggestedAction: 'Appeler pour caler le RDV'
      })
    }
    
    // Créer le prompt pour l'IA
    const prompt = `Analyse cet email commercial et extrait les informations pour créer un lead CRM.

Email:
De: ${from}
Sujet: ${subject}
Date: ${date || new Date().toISOString()}
Contenu: ${body}

Réponds UNIQUEMENT avec un JSON valide contenant:
{
  "name": "Nom complet du prospect",
  "email": "email@example.com",
  "company": "Nom de l'entreprise (ou vide)",
  "phone": "Téléphone si mentionné (ou vide)",
  "title": "Titre court et clair du projet",
  "need": "Résumé du besoin en 1-2 phrases",
  "urgency": "low|medium|high",
  "estimatedAmount": montant_estimé_en_euros,
  "expectedCloseDate": "YYYY-MM-DD (estimation basée sur l'urgence)",
  "suggestedAction": "Action commerciale à faire (appeler, envoyer devis, etc.)"
}

Règles:
- Extraire l'email de l'expéditeur
- Deviner le budget si mentionné (sinon 0)
- Urgence: high si demande rapide/urgent, medium si normal, low si pas urgent
- expectedCloseDate: +2 jours si high, +7 jours si medium, +14 jours si low
- Être précis et professionnel`

    // Appeler l'API OpenAI
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant CRM qui analyse les emails commerciaux et extrait les informations structurées pour créer des leads. Réponds UNIQUEMENT en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      console.error('❌ Erreur API OpenAI:', response.status)
      throw new Error('Erreur API IA')
    }
    
    const aiResponse = await response.json()
    const content = aiResponse.choices?.[0]?.message?.content || '{}'
    
    // Parser le JSON de la réponse IA
    let analysis
    try {
      // Nettoyer le contenu (enlever les ```json si présents)
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON IA:', parseError, content)
      // Fallback avec données brutes
      const emailMatch = from.match(/[\w.-]+@[\w.-]+/)
      const nameMatch = from.replace(/<.*>/, '').trim()
      
      return c.json({
        name: nameMatch || emailMatch?.[0]?.split('@')[0] || 'Prospect',
        email: emailMatch?.[0] || '',
        company: '',
        phone: '',
        title: subject,
        need: body.substring(0, 100),
        urgency: 'medium',
        estimatedAmount: 0,
        expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suggestedAction: 'Appeler pour caler le RDV'
      })
    }
    
    console.log('✅ Analyse IA terminée:', analysis)
    
    return c.json(analysis)
    
  } catch (error) {
    console.error('❌ Erreur analyse lead:', error)
    return c.json({ error: 'Erreur analyse IA' }, 500)
  }
})

export default app
