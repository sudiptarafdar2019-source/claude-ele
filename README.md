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

# "10 days late, test negative" – late-period explainer reel

Final video: `output/late_period_reel.mp4` (1080×1920, 30 fps, 43.3 s, −14 LUFS)

Rebuild (from `reel2/`):
```
ffmpeg -i voice.mp3 -ac 1 -ar 16000 voice16.wav && python3 transcribe.py   # words.json
ffmpeg -i voice.mp3 -af "highpass=f=75,lowpass=f=15000,afftdn=nr=14:nf=-42:tn=1,deesser=i=0.35,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 48000 -ac 1 voice_clean.wav
python3 audio.py    # SFX + music bed ducked under voice -> bed.wav
python3 render.py   # frames -> video_noaudio.mp4
```
Then mix `voice_clean.wav` + `bed.wav` (amix, loudnorm I=-14) and mux with the video.
