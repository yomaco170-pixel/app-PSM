# 📘 Guide Cloudflare D1 - Voir et créer les tables

## 🎯 Étape 1 : Accéder à D1

1. Va sur : https://dash.cloudflare.com
2. Dans le menu de gauche, clique sur **"Workers & Pages"**
3. Dans le sous-menu, clique sur **"D1"**
4. Tu verras la liste de tes bases de données

---

## 🎯 Étape 2 : Ouvrir karl-crm-production

1. Dans la liste, clique sur **"karl-crm-production"**
2. Tu arrives sur la page de la base de données
3. En haut de la page, tu verras plusieurs onglets :
   - **Overview** (statistiques)
   - **Console** ← Pour exécuter du SQL
   - **Tables** ← Pour voir les tables
   - **Settings** ← Paramètres

---

## 🎯 Étape 3 : Voir les tables existantes

1. Clique sur l'onglet **"Tables"**
2. Tu verras la liste de toutes les tables
3. Si tu ne vois PAS les tables `clients` et `deals`, continue vers l'étape 4

---

## 🎯 Étape 4 : Créer les tables (si elles n'existent pas)

### 4.1 Aller dans la Console

1. Clique sur l'onglet **"Console"**
2. Tu verras une grande zone de texte blanche
3. Il y a un bouton bleu **"Execute"** en bas à droite

### 4.2 Exécuter le SQL pour créer la table clients

Copie-colle ce SQL dans la zone de texte :

```sql
DROP TABLE IF EXISTS clients;

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'lead',
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
```

**Clique sur "Execute"** ✅

Tu verras un message de succès en vert.

### 4.3 Exécuter le SQL pour créer la table deals

**EFFACE le SQL précédent** de la zone de texte, puis copie-colle :

```sql
DROP TABLE IF EXISTS deals;

CREATE TABLE deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  client_id INTEGER,
  title TEXT NOT NULL,
  amount REAL DEFAULT 0,
  stage TEXT DEFAULT 'lead',
  probability INTEGER DEFAULT 30,
  expected_close_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
```

**Clique sur "Execute"** ✅

---

## 🎯 Étape 5 : Vérifier que les tables sont créées

1. Retourne sur l'onglet **"Tables"**
2. Clique sur le bouton **"Refresh"** (icône de rechargement) si nécessaire
3. Tu devrais maintenant voir :
   - ✅ **clients** (8 colonnes)
   - ✅ **deals** (11 colonnes)

---

## 🎯 Étape 6 : Tester l'application

1. Va sur : https://bceb7c19.karl-crm.pages.dev
2. **Connecte-toi** avec ton email et mot de passe
3. Va sur : https://bceb7c19.karl-crm.pages.dev/static/test-leads.html
4. Clique sur **"Test Complet"**
5. Tu devrais voir :
   ```
   1️⃣ Création du client...
   ✅ Client créé: Test Workflow ... (ID: 1)
   
   2️⃣ Création du deal...
   ✅ Deal créé: Demande depuis email (ID: 1)
   
   🎉 WORKFLOW COMPLET RÉUSSI !
   ```

---

## ✅ Résumé des étapes

1. **Cloudflare Dashboard** → Workers & Pages → D1
2. Cliquer sur **"karl-crm-production"**
3. Onglet **"Console"** → Exécuter les 2 SQL (clients puis deals)
4. Onglet **"Tables"** → Vérifier que clients et deals existent
5. **Se connecter** sur https://bceb7c19.karl-crm.pages.dev
6. **Tester** sur https://bceb7c19.karl-crm.pages.dev/static/test-leads.html

---

## 🆘 Si ça ne marche toujours pas

**Problème : "Pas de token"**
→ Tu DOIS te connecter d'abord sur https://bceb7c19.karl-crm.pages.dev

**Problème : "Table 'clients' doesn't exist"**
→ Les tables ne sont pas créées en production, refais l'étape 4

**Problème : "Unauthorized"**
→ Le token a expiré, déconnecte-toi et reconnecte-toi

---

Guillaume PINOIT  
PSM Portails Sur Mesure  
06 60 60 45 11
