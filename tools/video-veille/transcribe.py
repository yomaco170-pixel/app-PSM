#!/usr/bin/env python3
"""Passerelle vidéo -> transcription texte (YouTube, Instagram, TikTok, fichier local...).

Usage :
    python tools/video-veille/transcribe.py <lien ou fichier> [--out DOSSIER] [--model small]

Ordre des méthodes :
  1. YouTube : sous-titres existants (youtube-transcript-api), instantané.
  2. Sinon : téléchargement audio (yt-dlp) puis transcription locale Whisper (faster-whisper).
  3. Fichier local (.mp4, .mov, .m4a, .mp3...) : Whisper directement.

Dépendances : pip install youtube-transcript-api yt-dlp faster-whisper  (+ ffmpeg installé)
Fonctionne dans le conteneur Claude ET sur ton PC. Si YouTube/Instagram bloque le
serveur cloud, lance-le sur ton PC (connexion perso) et commit le .txt produit.
"""
import argparse
import os
import re
import subprocess
import sys
import tempfile

YT_RE = re.compile(r"(?:youtube\.com/(?:watch\?v=|shorts/|embed/|live/)|youtu\.be/)([\w-]{11})")


def fmt(t: float) -> str:
    t = int(t)
    return f"{t // 60:02d}:{t % 60:02d}"


def slugify(s: str) -> str:
    s = re.sub(r"[^\w-]+", "-", s.lower()).strip("-")
    return s[:60] or "video"


def youtube_captions(vid: str, langs):
    from youtube_transcript_api import YouTubeTranscriptApi
    t = YouTubeTranscriptApi().fetch(vid, languages=langs)
    return [(s.start, s.text.replace("\n", " ").strip()) for s in t]


def download_audio(url: str, workdir: str) -> str:
    out = os.path.join(workdir, "audio.%(ext)s")
    subprocess.run(
        ["yt-dlp", "-f", "bestaudio/best", "-x", "--audio-format", "m4a", "-o", out, url],
        check=True,
    )
    for f in os.listdir(workdir):
        if f.startswith("audio."):
            return os.path.join(workdir, f)
    raise RuntimeError("Audio introuvable après téléchargement")


def load_audio(path: str):
    """Décode n'importe quel fichier audio/vidéo en mono 16 kHz via ffmpeg."""
    import numpy as np
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def whisper(path: str, model_name: str, lang: str | None):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, info = model.transcribe(load_audio(path), language=lang, vad_filter=True)
    print(f"Langue détectée : {info.language} ({info.duration:.0f}s)", file=sys.stderr)
    return [(s.start, s.text.strip()) for s in segments]


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("source", help="Lien vidéo ou chemin de fichier")
    p.add_argument("--out", default="docs/veille/transcripts")
    p.add_argument("--name", help="Nom du fichier de sortie (sans extension)")
    p.add_argument("--model", default="small", help="tiny/base/small/medium (plus gros = plus précis, plus lent)")
    p.add_argument("--lang", default=None, help="Forcer la langue Whisper, ex: fr")
    a = p.parse_args()

    segs, name = None, a.name
    m = YT_RE.search(a.source)
    if m:
        name = name or f"youtube-{m.group(1)}"
        try:
            segs = youtube_captions(m.group(1), ["fr", "en"])
            print("Méthode : sous-titres YouTube", file=sys.stderr)
        except Exception as e:  # bloqué ou pas de sous-titres -> Whisper
            print(f"Sous-titres indisponibles ({type(e).__name__}), passage à Whisper", file=sys.stderr)

    if segs is None:
        if os.path.exists(a.source):
            name = name or slugify(os.path.splitext(os.path.basename(a.source))[0])
            segs = whisper(a.source, a.model, a.lang)
        else:
            name = name or slugify(re.sub(r"^https?://(www\.)?", "", a.source))
            with tempfile.TemporaryDirectory() as d:
                segs = whisper(download_audio(a.source, d), a.model, a.lang)
        print("Méthode : Whisper", file=sys.stderr)

    os.makedirs(a.out, exist_ok=True)
    path = os.path.join(a.out, f"{name}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"Source : {a.source}\n\n")
        f.writelines(f"[{fmt(st)}] {tx}\n" for st, tx in segs)
    print(f"OK : {len(segs)} segments -> {path}")


if __name__ == "__main__":
    main()
