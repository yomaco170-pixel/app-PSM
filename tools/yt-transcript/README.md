# Passerelle transcription YouTube

YouTube bloque les serveurs cloud (captcha « google.com/sorry »), donc la récupération
se fait depuis ta propre connexion. Trois façons, de la plus simple à la plus outillée :

1. **Sans rien installer (2 min, marche aussi sur mobile en mode bureau)** :
   sur la page de la vidéo → « …plus » sous la description → **Afficher la transcription**
   → tout sélectionner → copier → coller dans Claude avec le prompt ci-dessous.
2. **Script (PC/Mac)** :
   ```bash
   pip install youtube-transcript-api
   python tools/yt-transcript/yt_transcript.py https://youtu.be/F1qWG0T3aXI
   ```
   Puis colle `F1qWG0T3aXI.txt` dans Claude, ou commit-le dans `tools/yt-transcript/transcripts/`
   et demande à Claude de l'analyser depuis le dépôt.
3. **Extension navigateur** (Glasp, Tactiq, « YouTube Summary with ChatGPT & Claude ») :
   bouton « Transcript » → copier.

## Prompt d'analyse prêt à l'emploi

> Voici la transcription de la vidéo « {titre} ». Fais : 1) un résumé en 10 lignes,
> 2) la liste numérotée de chaque idée/astuce avec l'horodatage, 3) ce qui est
> directement applicable à mon activité (e-commerce / app PSM), classé par gain
> et effort, 4) un plan d'action concret pour cette semaine.
