"""Step 1 of a reel: turn the voiceover into word-level timings.

Usage:  python scripts/transcribe.py reels/day04.json
Reads the reel file, transcribes its "voice" mp3 with Whisper (runs on your
computer, free), lines the words up with the exact script text, and writes
reels/day04.timing.json. Run it again whenever you change the voiceover.
"""
import json, re, sys, os, difflib, subprocess
import numpy as np
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = re.compile(r"\[([a-z ]+)\]")

def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))

def script_tokens(script):
    """Split the ElevenLabs voice block into words, remembering the tone tag
    ([curious], [sighs] ...) and the line each word belongs to."""
    toks = []
    tag = "neutral"
    for li, line in enumerate([l for l in script.split("\n") if l.strip()]):
        pos = 0
        for m in re.finditer(r"\[[a-z ]+\]|[^\s\[\]]+", line):
            t = m.group(0)
            if TAG.fullmatch(t):
                tag = TAG.fullmatch(t).group(1).strip()
                continue
            for part in re.split(r"(?<=\.\.\.)(?=\S)", t):  # "here...and" -> two
                if norm(part):
                    toks.append({"text": part, "tag": tag, "line": li,
                                 "emph": bool(re.fullmatch(r"[A-Z]{2,}[^a-z]*", re.sub(r"[^A-Za-z]", "", part) or "x")) and len(re.sub(r"[^A-Za-z]", "", part)) > 1})
    return toks

def main(reel_path):
    reel = json.load(open(reel_path))
    audio = os.path.join(ROOT, "public", reel["voice"])
    model = WhisperModel(os.environ.get("WHISPER_MODEL", "small.en"), device="cpu", compute_type="int8")
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", audio, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    samples = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    segs, info = model.transcribe(samples, word_timestamps=True, vad_filter=False, beam_size=5)
    heard = []
    for s in segs:
        for w in s.words:
            if norm(w.word):
                heard.append({"w": norm(w.word), "start": w.start, "end": w.end})
    toks = script_tokens(reel["script"])
    a = [norm(t["text"]) for t in toks]
    b = [h["w"] for h in heard]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            toks[blk.a + k]["start"] = heard[blk.b + k]["start"]
            toks[blk.a + k]["end"] = heard[blk.b + k]["end"]
    # fill words whisper heard differently by spreading them between neighbours
    n = len(toks)
    i = 0
    while i < n:
        if "start" in toks[i]:
            i += 1; continue
        j = i
        while j < n and "start" not in toks[j]:
            j += 1
        t0 = toks[i - 1]["end"] if i > 0 else 0.0
        t1 = toks[j]["start"] if j < n else info.duration
        step = (t1 - t0) / (j - i)
        for k in range(i, j):
            toks[k]["start"] = round(t0 + step * (k - i), 3)
            toks[k]["end"] = round(t0 + step * (k - i + 1), 3)
        i = j
    for t in toks:
        t["start"] = round(float(t["start"]), 3); t["end"] = round(float(t["end"]), 3)
    out = {"duration": round(info.duration, 3), "words": toks,
           "matched": round(sm.ratio(), 3)}
    dst = reel_path.replace(".json", ".timing.json")
    json.dump(out, open(dst, "w"), indent=1)
    print(f"{dst}: {len(toks)} words, {info.duration:.1f}s, match {sm.ratio():.0%}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        main(p)
