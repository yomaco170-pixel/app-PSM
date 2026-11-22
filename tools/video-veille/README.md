# Passerelle vidéo → transcription → analyse

`transcribe.py` accepte un lien (YouTube, Instagram, TikTok, Facebook…) ou un fichier
vidéo/audio et produit une transcription horodatée dans `docs/veille/transcripts/`.

```bash
pip install youtube-transcript-api yt-dlp faster-whisper   # + ffmpeg
python tools/video-veille/transcribe.py https://youtu.be/F1qWG0T3aXI
python tools/video-veille/transcribe.py https://www.instagram.com/reel/XXXX/
python tools/video-veille/transcribe.py ma_video.mp4 --model medium
```

## Si la plateforme bloque le serveur cloud

YouTube (captcha) et Instagram (connexion, CDN vidéo) refusent souvent les serveurs.
Dans ce cas, une de ces voies suffit, Claude fait le reste (analyse + enregistrement) :

1. **Envoyer le fichier vidéo directement dans la conversation.** Claude le transcrit
   lui-même avec Whisper. Sur Instagram : enregistre le reel (bouton Enregistrer/Télécharger
   si dispo, ou enregistrement d'écran du téléphone) et joins-le.
2. **Coller la transcription.** YouTube : « …plus » sous la description → *Afficher la
   transcription* → tout copier. 
3. **Lancer le script sur ton PC** (ta connexion n'est pas bloquée), puis commit le `.txt`
   dans `docs/veille/transcripts/` ou colle-le dans la conversation.
