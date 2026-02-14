-- Migration: Ajouter colonnes manquantes dans clients

-- Ajouter first_name
ALTER TABLE clients ADD COLUMN first_name TEXT;

-- Ajouter last_name
ALTER TABLE clients ADD COLUMN last_name TEXT;

-- Ajouter civility
ALTER TABLE clients ADD COLUMN civility TEXT;

-- Ajouter source
ALTER TABLE clients ADD COLUMN source TEXT;

-- Ajouter notes
ALTER TABLE clients ADD COLUMN notes TEXT;
