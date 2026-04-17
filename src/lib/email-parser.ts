/**
 * PARSER EMAIL KARL - Version unifiée et robuste.
 *
 * Ce fichier est la SOURCE DE VÉRITÉ du parser regex.
 * Il est utilisé :
 *  - par les tests (node tests/parser.test.js)
 *  - par le frontend (copié dans public/static/karl-app.js)
 *  - par le backend en fallback si l'IA échoue
 *
 * Objectif : extraire un maximum d'infos (nom, prénom, email, téléphone,
 * société, adresse, type de projet) à partir d'un email quelconque.
 *
 * Stratégie :
 *  1. Nettoyer encodage UTF-8 cassé
 *  2. Essayer d'abord les formulaires structurés (Nom : ..., E-mail : ...)
 *  3. Puis fallback sur un parsing "intelligent" du texte libre
 *  4. Toujours extraire email/téléphone avec regex robustes
 */

// =============================================================================
// UTILS
// =============================================================================

export function fixEncoding(text) {
  if (!text) return ''
  return text
    // Mojibake UTF-8 courant (double-encodage Latin1 -> UTF-8)
    .replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è').replace(/Ãª/g, 'ê').replace(/Ã«/g, 'ë')
    .replace(/Ã /g, 'à').replace(/Ã¢/g, 'â').replace(/Ã¤/g, 'ä')
    .replace(/Ã®/g, 'î').replace(/Ã¯/g, 'ï')
    .replace(/Ã´/g, 'ô').replace(/Ã¶/g, 'ö')
    .replace(/Ã¹/g, 'ù').replace(/Ã»/g, 'û').replace(/Ã¼/g, 'ü')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã‰/g, 'É').replace(/Ãˆ/g, 'È').replace(/ÃŠ/g, 'Ê')
    .replace(/Ã€/g, 'À').replace(/Ã‚/g, 'Â')
    .replace(/Ã”/g, 'Ô').replace(/Ã›/g, 'Û')
    .replace(/Ã‡/g, 'Ç')
    // Espaces insécables
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
}

export function stripHtml(text) {
  if (!text) return ''
  // Détection robuste : vraie balise HTML (ex: <p>, <div>, <a href=...>) PAS <email@x.fr>
  const looksLikeHtml = /<(?:p|div|br|span|table|tr|td|a|ul|li|html|body|style|script|h[1-6])[\s>\/]/i.test(text)
  if (!looksLikeHtml) return text

  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    // ⚠️ NE PAS retirer <email@x.fr> — c'est pas une balise HTML
    .replace(/<(?!\/?[a-zA-Z]+[\s>])[^>]*>/g, (match) => match)  // garde les <email@...>
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// =============================================================================
// EXTRACTEURS INDIVIDUELS
// =============================================================================

const PSM_INTERNAL_EMAILS = [
  'psm-portails.fr',
  'multiscreensite.com',
  'mailer@',
  'noreply@',
  'no-reply@',
  'donotreply@',
  'contact@psm-portails.fr'
]

function isInternalEmail(email) {
  const e = email.toLowerCase()
  return PSM_INTERNAL_EMAILS.some(bad => e.includes(bad))
}

/** Extrait TOUS les emails valides du texte */
export function extractAllEmails(text) {
  if (!text) return []
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(re) || []
  return [...new Set(matches.map(e => e.trim()))]
}

// Emails qu'on considère comme "nous" (PSM / Guillaume) — ne JAMAIS prendre comme lead
const PSM_OWN_EMAILS = [
  'commercial.pinoit.psm@gmail.com',
  'pinoit',
  '@psm-portails'
]

function isOwnEmail(email) {
  const e = email.toLowerCase()
  return PSM_OWN_EMAILS.some(bad => e.includes(bad))
}

/** Choisit le MEILLEUR email (pas les internes, pas les mailer automatiques, pas NOUS) */
export function pickBestEmail(text, fromHeader = '') {
  // 1. Priorité à un email labellisé "E-mail :", "Mail :", "Courriel :"
  const labeled = text.match(/(?:E-?mail|Mail|Courriel)\s*\*?\s*[:：]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (labeled && !isInternalEmail(labeled[1]) && !isOwnEmail(labeled[1])) {
    return labeled[1].toLowerCase()
  }

  // 2. Email dans un bloc forwardé "From: xxx <yyy@zz.fr>"
  const fwdEmail = text.match(/From:\s*[^<\n]*<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/i)
  if (fwdEmail && !isInternalEmail(fwdEmail[1]) && !isOwnEmail(fwdEmail[1])) {
    return fwdEmail[1].toLowerCase()
  }

  // 3. Premier email externe trouvé dans le CORPS (pas dans From, pas nous)
  const bodyEmails = extractAllEmails(text)
    .filter(e => !isInternalEmail(e) && !isOwnEmail(e))
  if (bodyEmails.length) return bodyEmails[0].toLowerCase()

  // 4. En dernier recours, l'email du From (si c'est pas nous)
  const fromMatch = fromHeader.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (fromMatch && !isInternalEmail(fromMatch[0]) && !isOwnEmail(fromMatch[0])) {
    return fromMatch[0].toLowerCase()
  }

  return ''
}

/** Extrait et normalise tous les numéros de téléphone FR trouvés */
export function extractAllPhones(text) {
  if (!text) return []
  // Regex large qui attrape : 06 12 34 56 78, 06.12.34.56.78, +33 6 12 34 56 78, 0612345678, etc.
  const re = /(?:\+33\s*|0033\s*|0)\s*[1-9](?:[\s.\-]*\d){8}/g
  const raw = text.match(re) || []
  const phones = raw
    .map(p => p.replace(/[\s.\-]/g, '').replace(/^\+33/, '0').replace(/^0033/, '0'))
    .filter(p => /^0[1-9]\d{8}$/.test(p))
  return [...new Set(phones)]
}

/** Choisit le meilleur téléphone : priorité mobile (06/07) quel que soit le label */
export function pickBestPhone(text) {
  // 1. Chercher un libellé "Portable/Mobile" en priorité → mobile certain
  const mobileLabeled = text.match(/(?:Portable|Mobile|Port\.?)\s*\*?\s*[:：]\s*([+\d][\d\s.\-+]+)/i)
  if (mobileLabeled) {
    const cleaned = mobileLabeled[1].replace(/[\s.\-]/g, '').replace(/^\+33/, '0').replace(/^0033/, '0')
    if (/^0[1-9]\d{8}$/.test(cleaned)) return cleaned
  }

  // 2. Tous les téléphones + priorité mobile (06/07) sur le reste
  const all = extractAllPhones(text)
  if (!all.length) return ''
  const mobile = all.find(p => p.startsWith('06') || p.startsWith('07'))
  if (mobile) return mobile

  // 3. Sinon prendre celui labellisé "Téléphone/Tél"
  const labeled = text.match(/(?:T[éeÃ][lÃ©l]?[eé]?phone|Tel|Tél)\s*\*?\s*[:：]\s*([+\d][\d\s.\-+]+)/i)
  if (labeled) {
    const cleaned = labeled[1].replace(/[\s.\-]/g, '').replace(/^\+33/, '0').replace(/^0033/, '0')
    if (/^0[1-9]\d{8}$/.test(cleaned)) return cleaned
  }

  return all[0]
}

// Prénoms féminins courants → civilité Mme si détecté
const FEMALE_FIRSTNAMES = new Set([
  'marie','sophie','claire','julie','anne','laure','camille','lucie','emma',
  'patricia','isabelle','sylvie','catherine','nathalie','nicole','christine',
  'sandrine','valérie','valerie','caroline','céline','celine','stéphanie','stephanie',
  'virginie','karine','corinne','florence','véronique','veronique','christiane',
  'monique','françoise','francoise','brigitte','martine','jeanne','hélène','helene',
  'agnès','agnes','béatrice','beatrice','chantal','michelle','mireille','odile',
  'danielle','annie','pascale','élise','elise','eva','léa','lea','alice','sarah',
  'manon','chloé','chloe','laura','clara','amélie','amelie','elodie','élodie',
  'jennifer','aurélie','aurelie','séverine','severine','delphine','laetitia'
])

function guessCivilityFromFirstName(firstName) {
  if (!firstName) return ''
  const first = firstName.toLowerCase().split(/\s+/)[0].replace(/[^a-zà-ÿ]/g, '')
  if (FEMALE_FIRSTNAMES.has(first)) return 'Mme'
  return ''
}

/** Extrait nom/prénom depuis divers patterns */
export function extractName(text, fromHeader = '') {
  const result = { civility: '', first_name: '', last_name: '' }

  // Détection civilité explicite
  if (/Monsieur\s+et\s+Madame|M\.\s+et\s+Mme/i.test(text)) {
    result.civility = 'M. et Mme'
  } else if (/\b(Mme\b|Madame\b)/i.test(text)) {
    result.civility = 'Mme'
  } else if (/\b(M\.|Monsieur|Mr\.?)\b/.test(text)) {
    result.civility = 'M.'
  }

  // 1. Formulaire structuré "Nom : XXX" (+ éventuel "Prénom : XXX")
  const prenomLabel = text.match(/(?:Pr[ée]nom)\s*\*?\s*[:：]\s*([^\n\r]+)/i)
  const nomLabel = text.match(/(?:^|\n)\s*Nom\s*\*?\s*[:：]\s*([^\n\r]+)/i)

  if (nomLabel) {
    const raw = nomLabel[1].trim()
    if (!isBogusName(raw)) {
      const parts = raw.split(/\s+/).filter(p => p.length > 1)
      const prenomValue = prenomLabel && !isBogusName(prenomLabel[1].trim()) ? prenomLabel[1].trim() : ''

      if (prenomValue) {
        result.first_name = prenomValue
        // Si le "Nom" contient aussi le prénom, on le retire
        const firstLow = prenomValue.toLowerCase()
        const cleanedParts = parts.filter(p => p.toLowerCase() !== firstLow)
        result.last_name = cleanedParts.length ? cleanedParts.join(' ') : parts.join(' ')
      } else if (parts.length >= 2) {
        // Le NOM de famille est souvent EN MAJUSCULES
        const upperIdx = parts.findIndex(p => p === p.toUpperCase() && p.length > 2)
        if (upperIdx > 0) {
          result.first_name = parts.slice(0, upperIdx).join(' ')
          result.last_name = parts.slice(upperIdx).join(' ')
        } else {
          result.first_name = parts.slice(0, -1).join(' ')
          result.last_name = parts[parts.length - 1]
        }
      } else {
        result.last_name = parts[0] || raw
      }
      if (!result.civility) result.civility = guessCivilityFromFirstName(result.first_name) || 'M.'
      return result
    }
  }

  // 2. Chercher une signature : "Cordialement,\nJean DUPONT"
  //    PRIORITÉ AU CORPS de l'email car il peut s'agir d'un forward
  const sig = text.match(/(?:Cordialement|Bien cordialement|Bien à vous|Salutations|Merci beaucoup|Merci)[\s,!.]*\n+([^\n]+?)(?:\n|$)/i)
  if (sig) {
    const line = sig[1].trim()
    if (!isBogusName(line) && !/^[-=_]+$/.test(line)) {
      const parts = line.split(/\s+/).filter(p => p.length > 1)
      const upperIdx = parts.findIndex(p => p === p.toUpperCase() && p.length > 2 && /^[A-ZÀ-Ý]+$/.test(p))
      if (upperIdx >= 0 && upperIdx < parts.length) {
        result.first_name = parts.slice(0, upperIdx).join(' ')
        result.last_name = parts.slice(upperIdx).join(' ')
        if (!result.civility) result.civility = guessCivilityFromFirstName(result.first_name) || 'M.'
        return result
      } else if (parts.length >= 2) {
        result.first_name = parts[0]
        result.last_name = parts.slice(1).join(' ').toUpperCase()
        if (!result.civility) result.civility = guessCivilityFromFirstName(result.first_name) || 'M.'
        return result
      }
    }
  }

  // 3. Chercher "Monsieur et Madame XXX" ou "M. et Mme XXX"
  const mmeMr = text.match(/(?:Monsieur\s+et\s+Madame|M\.\s+et\s+Mme)\s+([A-ZÀ-Ý][A-Za-zÀ-ÿ\-]+)/)
  if (mmeMr) {
    result.civility = 'M. et Mme'
    result.last_name = mmeMr[1].trim()
    return result
  }

  // 4. Chercher dans un bloc forward : "From: Bernard DUBOIS <bdubois@...>"
  const fwdFrom = text.match(/(?:^|\n)From:\s*([^<\n]+?)\s*<([^>]+)>/i)
  if (fwdFrom) {
    const fwdName = fwdFrom[1].replace(/"/g, '').trim()
    if (!isBogusName(fwdName)) {
      const parts = fwdName.split(/\s+/).filter(p => p.length > 1)
      const upperIdx = parts.findIndex(p => p === p.toUpperCase() && p.length > 2)
      if (upperIdx > 0) {
        result.first_name = parts.slice(0, upperIdx).join(' ')
        result.last_name = parts.slice(upperIdx).join(' ')
      } else if (parts.length >= 2) {
        result.first_name = parts[0]
        result.last_name = parts.slice(1).join(' ')
      } else {
        result.last_name = parts[0] || fwdName
      }
      if (!result.civility) result.civility = guessCivilityFromFirstName(result.first_name) || 'M.'
      return result
    }
  }

  // 5. Extraire depuis le header From : "Jean Dupont <jean@x.fr>"
  if (fromHeader) {
    const fromName = fromHeader.replace(/<[^>]+>/g, '').replace(/"/g, '').trim()
    if (fromName && !fromName.includes('@') && !isBogusName(fromName)) {
      const parts = fromName.split(/\s+/).filter(p => p.length > 1)
      if (parts.length >= 2) {
        const upperIdx = parts.findIndex(p => p === p.toUpperCase() && p.length > 2)
        if (upperIdx > 0) {
          result.first_name = parts.slice(0, upperIdx).join(' ')
          result.last_name = parts.slice(upperIdx).join(' ')
        } else {
          result.first_name = parts[0]
          result.last_name = parts.slice(1).join(' ')
        }
      } else {
        result.last_name = parts[0]
      }
      if (!result.civility) result.civility = guessCivilityFromFirstName(result.first_name) || 'M.'
      return result
    }
  }

  return result
}

function isBogusName(s) {
  if (!s) return true
  const low = s.toLowerCase().trim()
  const bogusStarts = ['contact psm', 'contact ', 'prospect', 'client', 'psm', 'solocal', 'page', 'votre site', 'mailer', 'noreply', 'no-reply']
  return s.length < 2 || s.length > 80 || bogusStarts.some(b => low.startsWith(b))
}

/** Détecte le type de projet depuis le contenu */
export function extractProjectType(text) {
  const t = text.toLowerCase()

  // RÈGLE 1 : Si on parle de panne / cassé / réparer → PRIORITÉ ABSOLUE à Réparation
  const repairKw = [
    'réparation', 'reparation', 'réparer', 'reparer',
    'ne fonctionne plus', 'ne fonctionne pas', 'plus de moteur',
    'cassé', 'casse', 'cassée', 'en panne', 'panne',
    "ne s'ouvre plus", 'ne ferme plus', "ne s'ouvre pas", "problème portail",
    'urgent', 'dépanner', 'depanner', 'sav'
  ]
  if (repairKw.some(k => t.includes(k))) return 'Réparation'

  // RÈGLE 2 : Types spécifiques (l'ordre compte, du plus précis au plus générique)
  const rules = [
    { type: 'Portail coulissant', kw: ['portail coulissant', 'coulissant'] },
    { type: 'Portail battant',    kw: ['portail battant', 'battant', 'battans', '2 vantaux', 'deux vantaux'] },
    { type: 'Portillon',          kw: ['portillon'] },
    { type: 'Clôture',            kw: ['clôture', 'cloture', 'clôturer', 'cloturer', 'grillage'] },
    { type: 'Motorisation',       kw: ['motorisation', 'motoriser', 'motoris', 'moteur portail', 'automatisme'] },
    { type: 'Portail',            kw: ['portail'] }  // fallback générique
  ]
  for (const r of rules) {
    if (r.kw.some(k => t.includes(k))) return r.type
  }
  return ''
}

/** Extrait une adresse (souvent ville + CP) */
export function extractAddress(text) {
  // Pattern : "44000 Nantes" ou "12 rue de la paix, 44000 Nantes"
  const fullAddr = text.match(/(\d{1,4}[\s,]+(?:rue|avenue|av\.|bd|boulevard|impasse|chemin|route|allée|place|cours|quai)[^,\n]{2,60}[,\s]+\d{5}\s+[A-Za-zÀ-ÿ\-\s]{2,40})/i)
  if (fullAddr) return fullAddr[1].replace(/\s+/g, ' ').trim()

  // Juste code postal + ville
  const cityZip = text.match(/(\d{5}\s+[A-Za-zÀ-ÿ\-\s]{2,30}(?=[\n,]|$))/)
  if (cityZip) return cityZip[1].trim()

  // Juste un nom de ville courante
  const city = text.match(/\b(Nantes|Rezé|Saint-Nazaire|Vertou|Orvault|Saint-Herblain|Bouguenais|Carquefou|La Chapelle-sur-Erdre|Basse-Goulaine)\b/i)
  if (city) return city[1]

  return ''
}

/** Extrait un nom de société potentiel */
export function extractCompany(text) {
  // "Entreprise Martin SARL" / "SARL / EURL / SAS / SA / SASU" en signature
  const patterns = [
    /(?:^|\n)\s*([A-ZÀ-Ý][A-Za-zÀ-ÿ\-&\s]{2,40}\s+(?:SARL|SAS|SASU|EURL|SA|SCI))(?:\s|$)/,
    /(?:Soci[ée]t[ée]|Entreprise|Ets|Société)\s*[:]\s*([^\n]{2,60})/i,
    /(?:^|\n)\s*(Entreprise\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ\-\s]{2,40})(?:\n|$)/
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].replace(/\s+(SARL|SAS|SASU|EURL|SA|SCI)$/i, '').trim()
  }
  return ''
}

// =============================================================================
// DÉTECTEUR DE SPAM / NON-LEAD
// =============================================================================

export function looksLikeSpam(subject, body) {
  const content = (subject + ' ' + body).toLowerCase()
  const spamIndicators = [
    'newsletter', 'désabonn', 'desabonn', 'unsubscribe',
    '-20%', '-30%', '-50%', 'promo', 'profitez de',
    'cliquez ici pour', 'offre spéciale'
  ]
  const leadIndicators = [
    'devis', 'portail', 'clôture', 'cloture', 'portillon',
    'téléphone', 'telephone', 'contact', 'bonjour'
  ]
  const spamCount = spamIndicators.filter(s => content.includes(s)).length
  const leadCount = leadIndicators.filter(s => content.includes(s)).length
  return spamCount >= 2 && leadCount < 2
}

// =============================================================================
// NETTOYAGE DES NOTES / MESSAGE
// =============================================================================

export function extractMessage(text) {
  // Pattern formulaire "Message : ..."
  const m = text.match(/Message\s*\*?\s*[:：]\s*([\s\S]+?)(?=\n\s*(?:R[ée]pondre|Cordialement|Bien cordialement|Salutations|Cet e-mail|-{2,}|www\.|https?:\/\/|$))/i)
  if (m && m[1].trim().length > 10) return cleanMessage(m[1])

  // Sinon, prendre le corps de l'email minus les headers
  return cleanMessage(text)
}

function cleanMessage(text) {
  return text
    .split('\n')
    .filter(line => {
      const l = line.trim().toLowerCase()
      if (l.length < 2) return true
      return !l.includes('répondre au client')
          && !l.includes('cet e-mail a été vérifié')
          && !l.includes('www.avast.com')
          && !l.includes('multiscreensite.com')
          && !l.startsWith('de :')
          && !l.startsWith('from:')
          && !l.startsWith('envoyé :')
          && !l.startsWith('sent:')
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 2000)
}

// =============================================================================
// PARSER PRINCIPAL
// =============================================================================

export function parseEmailRobust({ from = '', subject = '', body = '' }) {
  const rawText = fixEncoding(stripHtml(body))
  const fromClean = fixEncoding(from)

  const result = {
    civility: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    type: '',
    notes: '',
    isLikelyNotALead: false,
    confidence: 0
  }

  // Détection spam / non-lead
  if (looksLikeSpam(subject, rawText)) {
    result.isLikelyNotALead = true
    result.notes = rawText.substring(0, 500)
    return result
  }

  // Extraction champ par champ
  const name = extractName(rawText, fromClean)
  result.civility = name.civility
  result.first_name = name.first_name
  result.last_name = name.last_name

  result.email = pickBestEmail(rawText, fromClean)
  result.phone = pickBestPhone(rawText)
  result.company = extractCompany(rawText)
  result.address = extractAddress(rawText)
  result.type = extractProjectType(rawText + ' ' + subject)
  result.notes = extractMessage(rawText)

  // Score de confiance (combien de champs clés trouvés sur 4)
  let score = 0
  if (result.last_name) score++
  if (result.email) score++
  if (result.phone) score++
  if (result.type) score++
  result.confidence = score / 4

  return result
}
