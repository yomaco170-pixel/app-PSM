# Migrations D1

## Appliquer les migrations en production

### 1. Migration initiale (schéma complet)
```bash
npx wrangler d1 execute karl-crm-production --remote --file=migrations/0000_initial_schema.sql
```

### 2. Ajouter colonne name à clients
```bash
npx wrangler d1 execute karl-crm-production --remote --file=migrations/0001_add_name_to_clients.sql
```

## Vérifier les tables

```bash
npx wrangler d1 execute karl-crm-production --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Vérifier la structure d'une table

```bash
npx wrangler d1 execute karl-crm-production --remote --command="PRAGMA table_info(deals);"
```

## Important

⚠️ Les migrations sont appliquées directement sur la base de production Cloudflare D1.
⚠️ Assurez-vous que `CLOUDFLARE_API_TOKEN` est configuré.
