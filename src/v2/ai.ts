/**
 * KARL CRM v2 - Wrapper IA (Genspark / OpenAI compatible)
 *
 * Centralise tous les appels LLM pour la v2 :
 * - Modèle par défaut: gpt-5-mini (rapide, économique)
 * - Modèle "raisonnement": gpt-5 (pour synthèses complexes)
 *
 * Variables d'env attendues côté Worker:
 *   OPENAI_API_KEY  = clé Genspark
 *   OPENAI_BASE_URL = https://www.genspark.ai/api/llm_proxy/v1
 */

export type AIMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AIBindings = {
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
}

const DEFAULT_BASE_URL = 'https://www.genspark.ai/api/llm_proxy/v1'
const DEFAULT_MODEL = 'gpt-5-mini'

export class AIClient {
  private apiKey: string
  private baseUrl: string

  constructor(env: AIBindings) {
    this.apiKey = env.OPENAI_API_KEY || ''
    this.baseUrl = env.OPENAI_BASE_URL || DEFAULT_BASE_URL
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0
  }

  /**
   * Appel chat completion standard
   */
  async chat(messages: AIMessage[], options: {
    model?: string
    temperature?: number
    max_tokens?: number
    json?: boolean
  } = {}): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('AI_NOT_CONFIGURED: OPENAI_API_KEY manquante')
    }

    const model = options.model || DEFAULT_MODEL
    const body: any = {
      model,
      messages,
    }
    // gpt-5* exige max_completion_tokens et temperature=1 uniquement
    const isGpt5 = model.startsWith('gpt-5')
    if (options.max_tokens) {
      if (isGpt5) body.max_completion_tokens = options.max_tokens
      else body.max_tokens = options.max_tokens
    }
    if (options.temperature !== undefined && !isGpt5) {
      body.temperature = options.temperature
    }
    if (options.json) body.response_format = { type: 'json_object' }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`AI_API_ERROR ${res.status}: ${text.substring(0, 200)}`)
    }

    const data: any = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  /**
   * Appel chat completion attendant du JSON parsable
   */
  async chatJSON<T = any>(messages: AIMessage[], options: {
    model?: string
    temperature?: number
  } = {}): Promise<T> {
    const raw = await this.chat(messages, { ...options, json: true })
    try {
      return JSON.parse(raw) as T
    } catch (e) {
      // Tentative de récupération : extraire le premier objet JSON
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0]) as T
      throw new Error(`AI_INVALID_JSON: ${raw.substring(0, 200)}`)
    }
  }
}

/**
 * Helper raccourci
 */
export function getAI(env: AIBindings): AIClient {
  return new AIClient(env)
}
