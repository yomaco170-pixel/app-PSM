# KARL CRM

**CRM simplifié pour PSM Portails - Gestion clients, devis et pipeline**

## 🆕 Nouveautés (Version 2.2 — avril 2026)

### 🤖 Parser email ultra-robuste (0 saisie manuelle)
- **Hybride regex + IA** : parse tout type d'email (Solocal, Pages Jaunes, email libre, forwards, signatures pro…)
- **100% de réussite** sur 10 cas types (49/49 champs vérifiés, testés automatiquement)
- **Fallback IA** : si la confiance regex < 75%, GPT complète les champs manquants
- **Anti-spam intégré** : détecte les newsletters et alerte si l'email n'est pas un vrai lead

### 📸 OCR notes manuscrites (GPT-4 Vision)
- Bouton **"Scanner mes notes"** dans la création de lead
- Photo d'une feuille papier → fiche lead pré-remplie (nom, tél, dimensions, couleur, motorisation…)
- Compression image côté client (< 10 Mo, 5–15s d'analyse)

### 🧪 Tests automatisés
```bash
npm test                   # tests unitaires du parser
npm run test:integration   # tests d'intégration API
npm run test:all           # tout
```

### 🎨 Design modernisé + responsive
- Nouveau thème `theme.css` avec palette cohérente, animations douces, focus accessible
- Grille adaptive : mobile (< 768px), tablette, desktop
- Boutons toucher plus grands (44px min), input sans zoom iOS

---

## ✨ Interface simplifiée

**Navigation réduite : 5 onglets essentiels**
- 📊 **Pipeline** - Gestion des leads (6 statuts : Lead → RDV → Devis → Envoyé → Relance → Signé)
- 👥 **Clients** - Gestion complète avec recherche et tri
- 📄 **Devis** - Création et édition avec catalogue PSM
- 📅 **Calendrier** - Vue des rendez-vous
- ⚙️ **Paramètres** - Configuration + accès rapide (Tâches, Priorité, Rapports, Corbeille)

**Workflow ultra-simplifié :**
```
📧 Email reçu → 📝 Créer lead (3 champs, 30s) → 📅 Planifier RDV → 📝 Créer devis → ✅ Marquer signé → 👤 Client
📸 OU : Photo de mes notes papier → Fiche lead pré-remplie par IA → Valider
```

## 🚀 Fonctionnalités principales

- ✅ **Formulaire rapide** - 3 champs essentiels : Nom, Téléphone, Type de projet (≈30 secondes)
- ✅ **Bouton principal intelligent** - Un seul bouton selon le statut du lead
- ✅ **D1 Database** - Base de données SQLite globale (Cloudflare)
- ✅ **PWA** - Application Web Progressive
- ✅ **Pipeline** - 6 statuts avec workflow linéaire
- ✅ **Clients** - Gestion complète avec archivage
- ✅ **Devis** - Édition avec calculs automatiques (HT/TVA/TTC)
- ✅ **Calendrier** - Rendez-vous avec export iCal

---

## 📦 Installation

```bash
# Cloner le repo
git clone https://github.com/yomaco170-pixel/app-PSM.git
cd app-PSM

# Installer les dépendances
npm install

# Configurer les variables d'environnement Cloudflare
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

---

## 🔧 Configuration Gmail OAuth

1. **Créer un projet Google Cloud** : https://console.cloud.google.com/
2. **Activer Gmail API**
3. **Créer un OAuth Client ID** (Web Application)
4. **Ajouter les URI de redirection** :
   - `https://your-domain.pages.dev/api/auth/gmail/callback`
5. **Copier Client ID et Client Secret**
6. **Ajouter les secrets Cloudflare** :
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```

---

## 🏗️ Développement local

```bash
# Build
npm run build

# Démarrer le serveur local
npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000
```

---

## 🚀 Déploiement Cloudflare Pages

```bash
# Build
npm run build

# Copier les Pages Functions
cp -r functions dist/

# Déployer
npx wrangler pages deploy dist --project-name=karl-crm
```

---

## 📊 Base de données D1

### Création de la base

```bash
# Créer la database D1
npx wrangler d1 create webapp-production
```

### Migrations

```bash
# Appliquer les migrations en local
npx wrangler d1 migrations apply webapp-production --local

# Appliquer les migrations en production
npx wrangler d1 migrations apply webapp-production
```

---

## 🔐 Variables d'environnement

### Cloudflare Secrets (Production)

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

### Local (.dev.vars)

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
```

---

## 🌐 URLs

- **Production** : https://karl-crm.pages.dev
- **Dernier déploiement** : https://6cfeca01.karl-crm.pages.dev
- **GitHub** : https://github.com/yomaco170-pixel/app-PSM

---

## 🚀 Nouveautés (v2.1)

### 📧 Parser email amélioré (Solocal, PagesJaunes, formulaires web)
- ✅ **Détection multiformat** - Support de tous les formats de formulaires (Solocal, site web PSM)
- ✅ **Extraction robuste** - Patterns multiples pour `Nom :`, `E-mail :`, `Téléphone :`, `Message :`
- ✅ **Filtres anti-spam** - Ignore les emails système (mailer@, contact@, noreply@)
- ✅ **Message complet** - Extraction automatique du contenu descriptif du projet
- ✅ **Nettoyage automatique** - Suppression des lignes de signature et mentions légales

**Formats reconnus :**
```
Solocal/PagesJaunes:
Nom :
MARQUER
E-mail :
chihuahuadm@yahoo.fr
Téléphone :
0630859280
Message :
[Description du projet]

Site web PSM:
Nom* : Luc BOULÉ
E-mail* : luc.boule@wanadoo.fr
Téléphone : 0689674326
```

---

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend** : Hono (Cloudflare Workers)
- **Database** : Cloudflare D1 (SQLite)
- **Authentication** : Gmail OAuth 2.0
- **Deployment** : Cloudflare Pages
- **Build** : Vite

---

## 📝 Structure du projet

```
karl-crm/
├── src/
│   └── index.tsx              # Worker principal (Hono)
├── functions/
│   └── api/                   # Cloudflare Pages Functions
│       ├── auth/
│       │   ├── gmail.ts       # OAuth Gmail route
│       │   ├── gmail/
│       │   │   └── callback.ts # OAuth callback
│       │   ├── login.ts       # Login
│       │   └── signup.ts      # Signup
│       └── emails.ts          # API emails
├── public/
│   ├── static/
│   │   ├── karl-app.js        # Frontend app
│   │   └── styles.css         # Styles CSS
│   ├── icons/                 # PWA icons
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service Worker
├── dist/                      # Build output
├── wrangler.jsonc             # Config Cloudflare
├── vite.config.ts             # Config Vite
└── package.json
```

---

## 👨‍💻 Auteur

**Guillaume PINOIT** - PSM Portails  
📧 commercial.pinoit.psm@gmail.com

---

## 📄 Licence

Propriétaire - Tous droits réservés © 2026 Guillaume PINOIT
