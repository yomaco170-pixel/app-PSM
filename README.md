# NEXO (démo)

Prototype d'une super-app locale centrée sur le chat, conçue pour Nantes. L'application est développée avec Next.js (App Router), TypeScript et Tailwind CSS.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
src/
  app/             # Pages App Router (/, /chats, /chat/[id], etc.)
  components/      # Composants UI partagés (Header, BottomNav)
  data/            # Données mockées (chats, commerces, offres)
```

## Pages

- `/` : accueil avec cartes rapides.
- `/chats` : liste des conversations.
- `/chat/[id]` : conversation avec envoi local.
- `/autour` : recherche autour de moi avec filtres.
- `/scan` : interface de scan QR + exemples.
- `/commerce/[slug]` : page commerce, posts et CTA.
- `/offres` : fidélité et coupons.
- `/moi` : profil et préférences.

## Données mockées

Les données sont centralisées dans `src/data/mock.ts` et couvrent :

- chats + messages
- commerces + posts
- offres
- profil
