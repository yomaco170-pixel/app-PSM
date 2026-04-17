/**
 * Tests d'intégration : appelle l'API /api/parse-email locale
 * et vérifie que le endpoint répond correctement avec toutes les fixtures.
 *
 * Usage :
 *   1. Démarrer le serveur local : npm run dev:sandbox
 *   2. Dans un autre terminal : node tests/integration.test.js
 */

import { EMAIL_FIXTURES } from './fixtures/emails.js'

const API_URL = process.env.API_URL || 'http://localhost:3000'

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
}

async function callApi(fixture) {
  const res = await fetch(`${API_URL}/api/parse-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fixture.from,
      subject: fixture.subject,
      body: fixture.body
    })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function run() {
  console.log(C.bold + C.blue + '\n🌐 Tests d\'intégration API /api/parse-email\n' + C.reset)
  console.log(`   URL : ${API_URL}\n`)

  let pass = 0, fail = 0
  const errors = []

  for (const fx of EMAIL_FIXTURES) {
    try {
      const res = await callApi(fx)
      if (!res.success) {
        console.log(`${C.red}✗${C.reset} ${fx.id} — API a renvoyé success=false`)
        fail++
        continue
      }
      const d = res.data

      // Spam case
      if (fx.expected.isLikelyNotALead) {
        if (d.isLikelyNotALead === true) {
          console.log(`${C.green}✓${C.reset} ${fx.id} ${C.gray}(spam détecté, source: ${res.source})${C.reset}`)
          pass++
        } else {
          console.log(`${C.red}✗${C.reset} ${fx.id} — spam non détecté`)
          fail++
        }
        continue
      }

      // Vérifier les champs critiques : email + phone + type
      const problems = []
      if (fx.expected.email && d.email?.toLowerCase() !== fx.expected.email.toLowerCase()) {
        problems.push(`email: "${d.email}" ≠ "${fx.expected.email}"`)
      }
      if (fx.expected.phone && d.phone !== fx.expected.phone) {
        problems.push(`phone: "${d.phone}" ≠ "${fx.expected.phone}"`)
      }
      if (fx.expected.type && d.type !== fx.expected.type && d.project_type !== fx.expected.type) {
        problems.push(`type: "${d.type || d.project_type}" ≠ "${fx.expected.type}"`)
      }
      if (fx.expected.last_name && d.last_name?.toLowerCase() !== fx.expected.last_name.toLowerCase()) {
        problems.push(`last_name: "${d.last_name}" ≠ "${fx.expected.last_name}"`)
      }

      if (problems.length === 0) {
        console.log(`${C.green}✓${C.reset} ${fx.id} ${C.gray}(source: ${res.source}, conf: ${Math.round((res.confidence || 0) * 100)}%)${C.reset}`)
        pass++
      } else {
        console.log(`${C.red}✗${C.reset} ${fx.id}`)
        problems.forEach(p => console.log(`   ${C.red}${p}${C.reset}`))
        fail++
        errors.push({ id: fx.id, problems })
      }
    } catch (e) {
      console.log(`${C.red}✗${C.reset} ${fx.id} — erreur : ${e.message}`)
      fail++
    }
  }

  const total = pass + fail
  console.log('\n' + '='.repeat(60))
  console.log(`${C.bold}📊 Résultats : ${pass}/${total} (${Math.round(pass/total*100)}%)${C.reset}`)
  console.log('='.repeat(60))

  if (fail === 0) {
    console.log(C.green + C.bold + '\n✅ TOUS LES TESTS D\'INTÉGRATION PASSENT\n' + C.reset)
    process.exit(0)
  } else {
    console.log(C.red + C.bold + `\n❌ ${fail} test(s) en échec\n` + C.reset)
    process.exit(1)
  }
}

run().catch(e => {
  console.error(C.red + '\n💥 Erreur fatale :' + C.reset, e)
  process.exit(1)
})
