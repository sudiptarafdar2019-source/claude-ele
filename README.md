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

# Femwise Health – "PCOS hai? Roti-chawal chhodna padega?" reel

Final video: `output/femwise_pcos_roti_chawal_reel.mp4` (1080×1920, 30 fps, 64.5 s, −14 LUFS)

Rebuild (in `femwise/`):
```
python3 transcribe.py && python3 transcribe3.py   # faster-whisper word timings
python3 align.py        # align script words to timings -> words.json
python3 audio.py        # synth SFX + music bed -> bed.wav
python3 render.py       # frames -> video_noaudio.mp4
```
Then mix voice48.wav + bed.wav with loudnorm (I=-14) and mux.
Scene images in `femwise/img/` were generated with openai/gpt-image-2 via OpenRouter.
