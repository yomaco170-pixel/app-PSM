-- Migration: Créer la table deals avec toutes les colonnes nécessaires

-- Supprimer la table si elle existe déjà (pour éviter les conflits)
DROP TABLE IF EXISTS deals;

-- Créer la table deals avec TOUTES les colonnes nécessaires
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

-- Créer des index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
