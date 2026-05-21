/**
 * Patch _routes.json après build vite pour exclure /v2/static/*
 * (sinon Cloudflare Pages route les statiques v2 vers le Worker → 500)
 *
 * Règle Cloudflare Pages: pas de chevauchement entre patterns avec splat (*).
 * On supprime donc les doublons précis (v2.js, v2.css) si /v2/static/* est présent.
 */
import fs from 'node:fs';
import path from 'node:path';

const routesPath = path.resolve('dist/_routes.json');
if (!fs.existsSync(routesPath)) {
  console.warn('⚠️  dist/_routes.json introuvable, skip');
  process.exit(0);
}

const routes = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
routes.exclude = routes.exclude || [];

// Ajouter /v2/static/* si absent
if (!routes.exclude.includes('/v2/static/*')) {
  routes.exclude.push('/v2/static/*');
}

// Nettoyer les chevauchements éventuels
routes.exclude = routes.exclude.filter((p) => {
  if (p === '/v2/static/v2.js' || p === '/v2/static/v2.css') return false;
  return true;
});

// Dédupliquer
routes.exclude = [...new Set(routes.exclude)];

fs.writeFileSync(routesPath, JSON.stringify(routes));
console.log('✅ _routes.json patché:', JSON.stringify(routes));
