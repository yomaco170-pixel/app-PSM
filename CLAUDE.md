# Consignes permanentes pour Claude

## Liens vidéo (YouTube, Instagram, TikTok, Facebook, fichier vidéo/audio)

Dès que l'utilisateur envoie un lien ou un fichier vidéo, sans attendre qu'il le redemande :

1. **Récupérer le contenu** avec `python3 tools/video-veille/transcribe.py "<lien ou fichier>"`
   (dépendances : `pip install youtube-transcript-api yt-dlp faster-whisper`, ffmpeg présent).
   - YouTube : sous-titres d'abord, Whisper en secours. Instagram/TikTok/fichier : Whisper.
   - Titre/auteur si besoin : `https://www.youtube.com/oembed?url=<lien>&format=json`, `yt-dlp -J`.
   - Si la plateforme bloque le serveur cloud (captcha, connexion requise) : ne PAS contourner.
     Proposer immédiatement l'une des voies du `tools/video-veille/README.md`
     (copier la transcription, envoyer le fichier vidéo, ou lancer le script sur son PC).
2. **Analyser** selon `docs/veille/_modele.md`, en reliant tout à l'activité de l'utilisateur
   (app PSM : gestion commerciale/devis sur Cloudflare ; e-commerce/import, boutique Selection'O).
   Ton positif et orienté action : ce qu'on peut en tirer, pas ce qui ne va pas.
3. **Enregistrer** : transcription dans `docs/veille/transcripts/`, analyse dans
   `docs/veille/AAAA-MM-JJ-<slug>.md`, une ligne ajoutée à l'index `docs/veille/README.md`,
   et les idées retenues dans `docs/veille/idees-a-appliquer.md`.
4. **Commit + push** sur la branche de travail, puis résumer en quelques lignes dans le chat.
