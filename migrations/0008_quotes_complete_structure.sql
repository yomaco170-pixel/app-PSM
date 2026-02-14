-- Migration 0008: Structure complète pour les devis
-- Date: 2026-02-14

-- Supprimer l'ancienne table quotes simple
DROP TABLE IF EXISTS quotes;

-- Créer la table quotes avec structure complète
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE NOT NULL,
  deal_id INTEGER NOT NULL,
  client_id INTEGER,
  total_ht REAL DEFAULT 0,
  total_tva REAL DEFAULT 0,
  total_ttc REAL DEFAULT 0,
  deposit_rate REAL DEFAULT 30,
  deposit_amount REAL DEFAULT 0,
  validity_days INTEGER DEFAULT 30,
  valid_until TEXT,
  status TEXT DEFAULT 'brouillon',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deal_id) REFERENCES deals(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Créer la table quote_items pour les lignes de devis
CREATE TABLE IF NOT EXISTS quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  position INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  qty REAL DEFAULT 1,
  unit TEXT DEFAULT 'pce',
  unit_price_ht REAL DEFAULT 0,
  vat_rate REAL DEFAULT 10,
  discount_percent REAL DEFAULT 0,
  item_type TEXT DEFAULT 'product',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_quotes_deal_id ON quotes(deal_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(number);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_position ON quote_items(position);
