# 🧪 Tests — Karl PSM

## Quoi ?

Suite de tests automatisés pour valider que le **parser email** et l'**API** fonctionnent correctement sur un large panel de cas réels.

## Comment ça marche ?

### 📂 Structure

```
tests/
├── fixtures/
│   └── emails.js          # 10 exemples d'emails réels + résultats attendus
├── lib/
│   └── parser.js          # Parser JS (source de vérité, copié dans src/lib/)
├── parser.test.js         # Tests unitaires du parser (pas besoin de serveur)
└── integration.test.js    # Tests d'intégration (appelle l'API locale)
```

### 🚀 Lancer les tests

```bash
# Tests unitaires du parser (rapide, toujours en premier)
npm test

# Tests d'intégration (nécessite le serveur en marche)
npm run dev:sandbox &    # terminal 1
npm run test:integration # terminal 2

# Tous les tests
npm run test:all
```

### ➕ Ajouter un cas

Tu as un email qui ne se parse pas bien ? Ajoute-le dans `tests/fixtures/emails.js` :

```javascript
{
  id: 'mon-cas-qui-foire',
  description: 'Description courte',
  from: 'toto@example.com',
  subject: 'Le sujet',
  body: `Le contenu complet de l'email...`,
  expected: {
    first_name: 'Jean',
    last_name: 'DUPONT',
    email: 'jean.dupont@example.com',
    phone: '0612345678',
    type: 'Portail battant'
    // Ne mets que les champs que tu veux vérifier
  }
}
```

Puis lance `npm test` pour voir si ça passe, ou quel champ coince.

### 🎯 Objectif de réussite

- **Parser (`npm test`)** : ≥ 85% de vérifications OK (actuel : **100% / 49/49**)
- **Intégration (`npm run test:integration`)** : **10/10 cas** passent tous les champs critiques (email, tel, type, nom)

### 🛠 Modifier le parser

Le parser est dans **`tests/lib/parser.js`** (source de vérité) et est **recopié** dans `src/lib/email-parser.ts` pour être utilisé par Cloudflare Workers.

Après modification :

```bash
cp tests/lib/parser.js src/lib/email-parser.ts
npm test                   # vérifier que tout passe
npm run build              # recompiler
npm run test:integration   # vérifier l'API
```
