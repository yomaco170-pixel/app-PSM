-- Migration: Ajouter colonne name à la table clients
-- Date: 2026-02-11

-- Ajouter la colonne name si elle n'existe pas
ALTER TABLE clients ADD COLUMN name TEXT;

-- Mettre à jour les enregistrements existants (si besoin)
-- UPDATE clients SET name = email WHERE name IS NULL;
