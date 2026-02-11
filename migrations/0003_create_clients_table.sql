-- Migration: Créer la table clients avec toutes les colonnes nécessaires

-- Supprimer la table si elle existe déjà (pour éviter les conflits)
DROP TABLE IF EXISTS clients;

-- Créer la table clients avec TOUTES les colonnes nécessaires
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

-- Créer un index sur email pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Créer un index sur status pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
