# Orbirise Reel Studio

Code-based 9:16 reel maker (Remotion + React) with 5 Orbirise-branded templates and covers.
Read **TUTORIAL.md** for the easy guide.

Quick commands:
```
npm install && pip install faster-whisper numpy
python scripts/transcribe.py reels/day04.json   # word timings
node scripts/render.mjs day04                    # out/day04.mp4 + out/day04-cover.png
npm run studio                                   # live preview
node scripts/stills.mjs day04 30,300,600         # quick still frames to out/previews
```
