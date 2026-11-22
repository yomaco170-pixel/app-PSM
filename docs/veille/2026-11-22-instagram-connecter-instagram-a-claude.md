# Connecter Instagram à Claude pour produire une semaine de Reels

- **Source** : https://www.instagram.com/reel/Dfo4FuoDhfN/ — Damien (@damien.mapt, « Astuces IA & Claude »), Instagram, 46 s
- **Transcription** : [transcripts/instagram-Dfo4FuoDhfN.txt](transcripts/instagram-Dfo4FuoDhfN.txt) (Whisper + lecture des textes à l'écran)
- **Analysée le** : 2026-11-22

## En bref
Le reel montre qu'en branchant son compte Instagram à Claude via un **connecteur personnalisé (serveur MCP)**,
Claude peut analyser ce qui marche sur le profil, écrire hooks et scripts, monter les rushs
(sous-titres, animations) et programmer un Reel par jour. L'idée forte : passer d'une création
de contenu au coup par coup à une **production hebdomadaire guidée par les données du compte**.

## Points clés
1. [00:04] Claude → *Personnaliser* → *Connecteurs* → *Ajouter un connecteur personnalisé*.
2. [00:10] Nom « Instagram » + URL d'un serveur MCP distant (`https://…/mcp`, masquée dans la vidéo,
   envoyée en DM contre le commentaire « OUTIL » : c'est un outil tiers).
3. [00:13] Connexion (Google ou e-mail) puis autorisation d'accès au compte Instagram.
4. [00:19] Le prompt affiché à l'écran (recopié intégralement) :
   > Rôle : tu gères mon compte Instagram.
   > 1. Lis tout mon profil via le connecteur.
   > 2. Trouve ce qui marche sur mon compte.
   > 3. Écris 7 hooks et 7 scripts.
   > 4. Monte mes rushs : sous-titres, animations.
   > 5. Une semaine de Reels à mon image.
   > 6. Programme un Reel par jour.
5. [00:24] Claude parcourt le profil, repère les contenus « TOP », produit 7 Reels.
6. [00:37] Programmation automatique : un Reel par jour, à heure fixe (18:00 dans la démo).

## Ce que ça peut nous apporter
| Idée | Application chez nous | Gain | Effort |
|---|---|---|---|
| Prompt « semaine de Reels » | Selection'O : 7 hooks + 7 scripts produits par semaine à partir des fiches produits et des best-sellers | Élevé | Faible |
| Analyser ce qui marche avant de créer | Exporter les statistiques Instagram (Insights) ou faire des captures, les donner à Claude → angles gagnants | Élevé | Faible |
| Rythme 1 Reel/jour programmé | Planning éditorial hebdo fixe (ex. 18:00), Reels préparés en lot le lundi | Moyen | Moyen |
| Veille concurrents | Notre passerelle `tools/video-veille` transcrit déjà n'importe quel reel : analyser les reels des concurrents/fournisseurs pour en tirer des hooks | Élevé | Faible |
| Contenu « avant/après », « TOP » | Formats repris de la démo pour présenter les produits importés | Moyen | Faible |

## Plan d'action
- [ ] Tester dès maintenant le prompt ci-dessus **sans connecteur** : coller 10 dernières publications + leurs stats → 7 hooks/scripts Selection'O.
- [ ] Récupérer le nom de l'outil (commenter « OUTIL ») et vérifier avant de connecter : éditeur, droits demandés, avis, prix.
- [ ] Préférer un outil officiel de planification (Meta Business Suite) pour la programmation si l'outil tiers n'est pas clair.
- [ ] Envoyer 3 reels de concurrents dans la conversation → analyse des hooks qui marchent.

## Outils, prompts et ressources cités
- **Connecteurs personnalisés Claude** (MCP distant) — brancher un service externe à Claude.
- **Outil tiers Instagram** (nom donné en DM) — lecture du profil, montage, programmation.
- **Prompt « Mes Reels »** — recopié ci-dessus, réutilisable tel quel.
