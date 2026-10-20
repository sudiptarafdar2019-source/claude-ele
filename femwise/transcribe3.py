import json, wave, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
aud = np.frombuffer(wave.open("voice16.wav").readframes(10**9), np.int16).astype(np.float32) / 32768
aud = aud[:int(16000 * 11.5)]
P = "Hinglish mein baat: Apni plate mein protein add karo, jaise dal, paneer. Comment karo aur follow karo Femwise Health."
segs, _ = m.transcribe(aud, language="en", word_timestamps=True, beam_size=5, initial_prompt=P, hotwords="PCOS roti chawal")
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open("asr3.json", "w"), indent=0)
for w in words: print(f'{w["s"]:6.2f} {w["e"]:6.2f} {w["w"]}')
