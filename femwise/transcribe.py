import json, wave, numpy as np
from faster_whisper import WhisperModel
PROMPT = ("PCOS hai? Toh kya roti aur chawal khana chhodna padega? Bilkul nahi! PCOS diagnose hote hi kitni girls apni favourite "
          "Indian foods se door ho jaati hain. Koi bolta hai carbs band karo, koi bolta hai rice mat khao.")
m = WhisperModel("small", device="cpu", compute_type="int8")
aud = np.frombuffer(wave.open("voice16.wav").readframes(10**9), np.int16).astype(np.float32) / 32768
segs, _ = m.transcribe(aud, language="en", word_timestamps=True, initial_prompt=PROMPT, beam_size=5)
words = []
for s in segs:
    for w in s.words: words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
json.dump(words, open("asr.json", "w"), indent=0)
for w in words: print(f'{w["s"]:6.2f} {w["e"]:6.2f} {w["w"]}')
