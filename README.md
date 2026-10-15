# Orbirise – "Is your website costing you customers?" reel

Final video: `output/orbirise_website_audit_reel.mp4` (1080×1920, 30 fps, 33 s, −14 LUFS)

Rebuild:
```
cd work
python3 transcribe.py   # word timestamps -> words.json (faster-whisper)
python3 audio.py        # synth SFX + music bed -> bed.wav
python3 render.py       # frames -> video_noaudio.mp4
```
Then mix and mux with ffmpeg (see the commit message for the exact commands).
