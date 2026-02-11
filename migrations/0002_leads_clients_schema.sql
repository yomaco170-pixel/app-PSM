-- Migration: Nouveau schéma leads + clients
-- Date: 2026-02-11

-- Table leads = pipeline (source unique: email)
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,                 -- 'email'
  source_ref TEXT NOT NULL UNIQUE,      -- gmailMessageId (anti-doublon)
  from_name TEXT,
  from_email TEXT,
  subject TEXT,
  snippet TEXT,
  body TEXT,
  stage TEXT NOT NULL DEFAULT 'new',    -- new, qualified, quote_sent, won, lost, converted
  priority TEXT DEFAULT 'normal',
  confidence INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_from_email ON leads(from_email);

-- Table clients = uniquement après conversion
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  company TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients(lead_id);
