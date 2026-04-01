#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script d'import automatique : Gestion-Com → KARL CRM
Adapté au schéma simplifié de KARL (name, email, phone, company, status)
"""

import sqlite3
import os
import sys

# Chemins
source_db_path = '/home/user/uploaded_files/extracted.db'
target_db_path = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/5b4b4af2b33f6473e0a8705b7acb1fdfaacb615fc8c150cf5bfc90f6502af07c.sqlite'

print("=" * 80)
print("🚀 IMPORT AUTOMATIQUE : Gestion-Com → KARL CRM")
print("=" * 80)

# Vérifications
if not os.path.exists(source_db_path):
    print(f"❌ ERREUR : Base source introuvable : {source_db_path}")
    sys.exit(1)

if not os.path.exists(target_db_path):
    print(f"❌ ERREUR : Base KARL introuvable : {target_db_path}")
    sys.exit(1)

# Connexion aux bases
source_db = sqlite3.connect(source_db_path)
target_db = sqlite3.connect(target_db_path)

source = source_db.cursor()
target = target_db.cursor()

print("✅ Connexion aux bases établie\n")

# ==================== ÉTAPE 1 : IMPORTER LES CLIENTS ====================
print("👥 ÉTAPE 1/3 : Import des clients (ZTIERS → clients)")

source.execute("""
    SELECT 
        Z_PK as id,
        ZNOM as nom,
        ZPRENOM as prenom,
        ZRAISONSOCIALE as raison_sociale,
        ZEMAIL as email,
        ZTELEPHONE as telephone,
        ZADRESSE1 as adresse1,
        ZADRESSE2 as adresse2,
        ZADRESSECP as cp,
        ZADRESSEVILLE as ville,
        ZSIRET as siret,
        ZNUMEROTVAINTRACOM as tva,
        ZNOTES1 as notes1,
        ZNOTES2 as notes2,
        ZNOTES3 as notes3,
        ZNOTES4 as notes4,
        ZNOTES5 as notes5,
        ZTYPE as type_client,
        ZPERSONNECONTACT as contact
    FROM ZTIERS
    ORDER BY Z_PK
""")

clients_source = source.fetchall()
client_mapping = {}  # Ancien ID → Nouveau ID
clients_imported = 0
clients_skipped = 0

for row in clients_source:
    old_id, nom, prenom, raison_sociale, email, telephone, adresse1, adresse2, cp, ville, siret, tva, notes1, notes2, notes3, notes4, notes5, type_client, contact = row
    
    # Déterminer le nom complet (pour la colonne 'name')
    if raison_sociale:
        full_name = raison_sociale
        company = raison_sociale
    else:
        first_name = prenom or ''
        last_name = nom or ''
        full_name = f"{first_name} {last_name}".strip() or f"Client {old_id}"
        company = None
    
    # Déterminer le statut (client ou prospect)
    status = 'client' if type_client and 'client' in str(type_client).lower() else 'prospect'
    
    # Vérifier si l'email existe déjà
    if email:
        target.execute("SELECT id FROM clients WHERE email = ?", (email,))
        existing = target.fetchone()
        if existing:
            client_mapping[old_id] = existing[0]
            clients_skipped += 1
            continue
    
    # Insérer dans KARL (schéma simplifié)
    try:
        target.execute("""
            INSERT INTO clients (
                name, email, phone, company, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            full_name, email, telephone, company, status
        ))
        
        new_id = target.lastrowid
        client_mapping[old_id] = new_id
        clients_imported += 1
        
        if clients_imported % 50 == 0:
            print(f"  ✅ {clients_imported} clients importés...")
            
    except sqlite3.Error as e:
        print(f"  ⚠️ Erreur client {old_id}: {e}")
        clients_skipped += 1

target_db.commit()
print(f"\n  ✅ {clients_imported} clients importés")
print(f"  ⚠️ {clients_skipped} clients ignorés (doublons email)")

# ==================== ÉTAPE 2 : IMPORTER LES DEVIS/FACTURES ====================
print("\n📊 ÉTAPE 2/3 : Import des devis/factures (ZFACTURECLIENT → quotes)")

source.execute("""
    SELECT 
        Z_PK as id,
        ZNUMERO as numero,
        ZDATE as date_facture,
        ZMONTANTHT as montant_ht,
        ZMONTANTTVA as montant_tva,
        ZMONTANTTTC as montant_ttc,
        ZETATDEVIS as etat_devis,
        ZETATFACTURE as etat_facture,
        ZLIBELLE as notes,
        ZTIERS as client_id_old,
        ZTAUXACOMPTEDEVIS as taux_acompte
    FROM ZFACTURECLIENT
    ORDER BY Z_PK
""")

quotes_source = source.fetchall()
quote_mapping = {}  # Ancien ID → Nouveau ID
quotes_imported = 0
quotes_skipped = 0

for row in quotes_source:
    old_id, numero, date_facture, montant_ht, montant_tva, montant_ttc, etat_devis, etat_facture, notes, client_id_old, taux_acompte = row
    
    # Mapper le client
    if client_id_old not in client_mapping:
        quotes_skipped += 1
        continue
    
    client_id = client_mapping[client_id_old]
    
    # Déterminer le statut (utiliser etat_devis si c'est un devis, sinon etat_facture)
    # 0=Brouillon, 1=En attente, 2=Validé, 3=Refusé
    if etat_devis is not None:
        status_map = {0: 'draft', 1: 'sent', 2: 'accepted', 3: 'rejected'}
        status = status_map.get(etat_devis, 'draft')
    elif etat_facture is not None:
        status_map = {0: 'draft', 1: 'sent', 2: 'invoiced'}
        status = status_map.get(etat_facture, 'draft')
    else:
        status = 'draft'
    
    # Calculer l'acompte (taux_acompte est déjà un pourcentage)
    deposit_rate = int(taux_acompte) if taux_acompte else 0
    deposit_amount = 0
    if deposit_rate and montant_ttc:
        deposit_amount = float(montant_ttc) * (deposit_rate / 100)
    
    try:
        target.execute("""
            INSERT INTO quotes (
                number, client_id, total_ht, total_tva, total_ttc,
                deposit_rate, deposit_amount, status, notes,
                validity_days, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 30, datetime('now'), datetime('now'))
        """, (
            numero or f"IMP-{old_id}",
            client_id,
            montant_ht or 0,
            montant_tva or 0,
            montant_ttc or 0,
            deposit_rate,
            deposit_amount,
            status,
            notes or ''
        ))
        
        new_id = target.lastrowid
        quote_mapping[old_id] = new_id
        quotes_imported += 1
        
        if quotes_imported % 50 == 0:
            print(f"  ✅ {quotes_imported} devis importés...")
            
    except sqlite3.Error as e:
        print(f"  ⚠️ Erreur devis {old_id}: {e}")
        quotes_skipped += 1

target_db.commit()
print(f"\n  ✅ {quotes_imported} devis importés")
print(f"  ⚠️ {quotes_skipped} devis ignorés (client non trouvé)")

# ==================== ÉTAPE 3 : IMPORTER LES LIGNES DE DEVIS ====================
print("\n📝 ÉTAPE 3/3 : Import des lignes de devis (ZLIGNEFACTURECLIENT → quote_items)")

source.execute("""
    SELECT 
        Z_PK as id,
        ZFACTURECLIENT as facture_id_old,
        ZLIBELLE as designation,
        ZQTE as quantite,
        ZPU as prix_ht,
        ZTAUXTVA as taux_tva,
        ZTAUXREMISE as remise,
        ZINDEX as position
    FROM ZLIGNEFACTURECLIENT
    ORDER BY ZFACTURECLIENT, ZINDEX
""")

lines_source = source.fetchall()
lines_imported = 0
lines_skipped = 0

for row in lines_source:
    old_id, facture_id_old, designation, quantite, prix_ht, taux_tva, remise, position = row
    
    # Mapper la facture
    if facture_id_old not in quote_mapping:
        lines_skipped += 1
        continue
    
    quote_id = quote_mapping[facture_id_old]
    
    try:
        target.execute("""
            INSERT INTO quote_items (
                quote_id, position, title, description, qty, unit,
                unit_price_ht, vat_rate, discount_percent, item_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'service')
        """, (
            quote_id,
            position or 0,
            designation or 'Article importé',
            '',
            quantite or 1,
            'u',
            prix_ht or 0,
            taux_tva or 20,
            remise or 0,
        ))
        
        lines_imported += 1
        
        if lines_imported % 100 == 0:
            print(f"  ✅ {lines_imported} lignes importées...")
            
    except sqlite3.Error as e:
        print(f"  ⚠️ Erreur ligne {old_id}: {e}")
        lines_skipped += 1

target_db.commit()
print(f"\n  ✅ {lines_imported} lignes importées")
print(f"  ⚠️ {lines_skipped} lignes ignorées (devis non trouvé)")

# ==================== RÉSUMÉ FINAL ====================
print("\n" + "=" * 80)
print("🎉 IMPORT TERMINÉ !")
print("=" * 80)
print(f"👥 Clients  : {clients_imported} importés, {clients_skipped} ignorés")
print(f"📊 Devis    : {quotes_imported} importés, {quotes_skipped} ignorés")
print(f"📝 Lignes   : {lines_imported} importées, {lines_skipped} ignorées")
print("=" * 80)

# Fermeture propre
source_db.close()
target_db.close()

print("\n✅ Tu peux maintenant tester KARL avec tes données !")
print("🔗 URL de test : https://karl-crm.pages.dev")
