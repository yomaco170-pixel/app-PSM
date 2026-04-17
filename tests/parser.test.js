/**
 * Suite de tests automatisés du parser email KARL.
 *
 * Usage : node tests/parser.test.js
 *
 * Ce script :
 *  1. Importe le parser "robuste" (tests/lib/parser.js)
 *  2. Lance chaque email de fixtures/emails.js
 *  3. Compare la sortie avec "expected"
 *  4. Affiche un rapport clair avec ✅ / ❌ et un score global
 */

import { EMAIL_FIXTURES, MIN_SUCCESS_RATE } from './fixtures/emails.js'
import { parseEmailRobust } from './lib/parser.js'

// Couleurs terminal
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
}

function normalize(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim().toLowerCase()
}

function checkField(actual, expected, caseSensitive = false) {
  if (expected === undefined) return null // non testé
  if (caseSensitive) {
    return String(actual || '').trim() === String(expected).trim()
  }
  return normalize(actual) === normalize(expected)
}

function checkContains(actual, substrings) {
  if (!substrings || !substrings.length) return null
  const str = normalize(actual)
  return substrings.every(s => str.includes(normalize(s)))
}

function runTest(fixture) {
  const result = parseEmailRobust({
    from: fixture.from,
    subject: fixture.subject,
    body: fixture.body
  })

  const checks = []
  const exp = fixture.expected

  // Cas spécial : email spam / pas un lead
  if (exp.isLikelyNotALead) {
    checks.push({
      field: 'isLikelyNotALead',
      expected: true,
      actual: result.isLikelyNotALead,
      pass: result.isLikelyNotALead === true
    })
    return { fixture, result, checks }
  }

  const fields = ['civility', 'first_name', 'last_name', 'email', 'phone', 'company', 'type']
  for (const f of fields) {
    if (exp[f] !== undefined) {
      checks.push({
        field: f,
        expected: exp[f],
        actual: result[f],
        pass: checkField(result[f], exp[f])
      })
    }
  }

  if (exp.address !== undefined) {
    // Pour l'adresse, on vérifie juste que l'expected est CONTENU dans l'actual
    checks.push({
      field: 'address',
      expected: `contient "${exp.address}"`,
      actual: result.address,
      pass: normalize(result.address).includes(normalize(exp.address))
    })
  }

  if (exp.notesContains) {
    checks.push({
      field: 'notes',
      expected: `contient ${JSON.stringify(exp.notesContains)}`,
      actual: (result.notes || '').substring(0, 80) + '…',
      pass: checkContains(result.notes, exp.notesContains)
    })
  }

  return { fixture, result, checks }
}

function printReport(results) {
  console.log('\n' + '='.repeat(80))
  console.log(C.bold + '🧪 RAPPORT DE TESTS — PARSER EMAIL KARL' + C.reset)
  console.log('='.repeat(80) + '\n')

  let totalChecks = 0
  let totalPass = 0
  let caseFullPass = 0

  for (const { fixture, result, checks } of results) {
    const passCount = checks.filter(c => c.pass).length
    const totalCount = checks.length
    const allPass = passCount === totalCount
    if (allPass) caseFullPass++
    totalChecks += totalCount
    totalPass += passCount

    const icon = allPass ? C.green + '✅' : (passCount > 0 ? C.yellow + '⚠️ ' : C.red + '❌')
    console.log(`${icon} ${C.bold}${fixture.id}${C.reset} ${C.gray}(${passCount}/${totalCount})${C.reset}`)
    console.log(`   ${C.gray}${fixture.description}${C.reset}`)

    for (const check of checks) {
      const mark = check.pass ? C.green + '  ✓' : C.red + '  ✗'
      const expStr = typeof check.expected === 'object' ? JSON.stringify(check.expected) : check.expected
      console.log(`${mark} ${C.bold}${check.field.padEnd(12)}${C.reset} attendu: ${C.blue}"${expStr}"${C.reset}  |  reçu: ${check.pass ? C.green : C.red}"${check.actual || ''}"${C.reset}`)
    }
    console.log('')
  }

  const pct = totalChecks > 0 ? (totalPass / totalChecks) : 0
  const caseFullPct = caseFullPass / results.length

  console.log('='.repeat(80))
  console.log(C.bold + '📊 RÉSUMÉ' + C.reset)
  console.log('='.repeat(80))
  console.log(`   Cas testés      : ${results.length}`)
  console.log(`   Cas 100% OK     : ${caseFullPass} / ${results.length} (${(caseFullPct * 100).toFixed(0)}%)`)
  console.log(`   Vérifications   : ${totalPass} / ${totalChecks} (${(pct * 100).toFixed(0)}%)`)
  console.log(`   Seuil minimum   : ${(MIN_SUCCESS_RATE * 100).toFixed(0)}%`)

  const ok = pct >= MIN_SUCCESS_RATE
  if (ok) {
    console.log('\n' + C.green + C.bold + '✅ OBJECTIF ATTEINT ! Le parser est prêt pour la prod.' + C.reset + '\n')
  } else {
    console.log('\n' + C.red + C.bold + `❌ INSUFFISANT (${(pct * 100).toFixed(0)}% < ${(MIN_SUCCESS_RATE * 100).toFixed(0)}%). Il faut améliorer le parser.` + C.reset + '\n')
  }

  return { pct, caseFullPct, ok, totalChecks, totalPass }
}

// ============================================================
// RUN
// ============================================================
console.log(C.bold + C.blue + '\n🚀 Lancement des tests...\n' + C.reset)

const results = EMAIL_FIXTURES.map(runTest)
const summary = printReport(results)

// Exit code pour CI / intégration
process.exit(summary.ok ? 0 : 1)
