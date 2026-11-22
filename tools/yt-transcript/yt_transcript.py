#!/usr/bin/env python3
"""Passerelle transcription YouTube -> fichier texte prêt à analyser.

A lancer depuis TA machine (connexion perso) : YouTube bloque les IP cloud.

    pip install youtube-transcript-api
    python yt_transcript.py https://youtu.be/F1qWG0T3aXI

Produit <id>.txt (avec horodatage) et <id>_brut.txt (texte continu).
Ensuite : colle le contenu dans Claude, ou commit le fichier dans tools/yt-transcript/transcripts/.
"""
import re
import sys

from youtube_transcript_api import YouTubeTranscriptApi


def video_id(url: str) -> str:
    m = re.search(r"(?:v=|youtu\.be/|shorts/|embed/)([\w-]{11})", url)
    if m:
        return m.group(1)
    if re.fullmatch(r"[\w-]{11}", url):
        return url
    sys.exit(f"Lien YouTube non reconnu : {url}")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Usage : python yt_transcript.py <lien YouTube> [langues, ex: fr,en]")
    vid = video_id(sys.argv[1])
    langs = (sys.argv[2] if len(sys.argv) > 2 else "fr,en").split(",")
    transcript = YouTubeTranscriptApi().fetch(vid, languages=langs)

    lines, plain = [], []
    for s in transcript:
        t = int(s.start)
        text = s.text.replace("\n", " ").strip()
        lines.append(f"[{t // 60:02d}:{t % 60:02d}] {text}")
        plain.append(text)

    with open(f"{vid}.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    with open(f"{vid}_brut.txt", "w", encoding="utf-8") as f:
        f.write(" ".join(plain) + "\n")
    print(f"OK : {len(lines)} segments -> {vid}.txt et {vid}_brut.txt")


if __name__ == "__main__":
    main()
