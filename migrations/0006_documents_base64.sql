-- Migration: Ajout stockage base64 pour documents
-- Alternative à R2 : stockage direct dans D1

-- Ajouter colonne pour stockage base64
ALTER TABLE client_documents ADD COLUMN file_data TEXT; -- base64 du fichier

-- Commentaire: 
-- file_url = URL externe (R2 ou autre) si disponible
-- file_data = Données base64 si stockage local
-- On utilise l'un ou l'autre selon la configuration
