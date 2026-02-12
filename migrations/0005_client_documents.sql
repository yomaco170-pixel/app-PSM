-- Migration: Système de gestion documentaire client

-- Table pour les documents (devis, photos, notes)
CREATE TABLE IF NOT EXISTS client_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'devis', 'photo', 'note'
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT, -- URL Cloudflare R2
  file_name TEXT,
  file_size INTEGER, -- en bytes
  file_type TEXT, -- mime type
  content TEXT, -- Pour les notes (texte direct)
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON client_documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created ON client_documents(created_at DESC);

-- Table pour organiser les photos par chantier
CREATE TABLE IF NOT EXISTS chantiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'en_cours', -- 'planifie', 'en_cours', 'termine', 'annule'
  notes TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Lier photos à un chantier
CREATE TABLE IF NOT EXISTS chantier_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chantier_id INTEGER NOT NULL,
  document_id INTEGER NOT NULL,
  category TEXT, -- 'avant', 'pendant', 'apres', 'details'
  position INTEGER DEFAULT 0, -- pour l'ordre d'affichage
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (chantier_id) REFERENCES chantiers(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES client_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chantier_photos ON chantier_photos(chantier_id);
