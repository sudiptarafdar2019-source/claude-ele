import json, wave, numpy as np
from faster_whisper import WhisperModel
m=WhisperModel("small.en",device="cpu",compute_type="int8")
aud=np.frombuffer(wave.open("voice16.wav").readframes(10**9),np.int16).astype(np.float32)/32768
segs,_=m.transcribe(aud,word_timestamps=True,initial_prompt="Comment AUDIT for a free business system & website audit!")
words=[]
for s in segs:
    for w in s.words: words.append({"w":w.word.strip(),"s":round(w.start,3),"e":round(w.end,3)})
json.dump(words,open("words.json","w"),indent=0)
for w in words: print(f'{w["s"]:6.2f} {w["e"]:6.2f} {w["w"]}')
