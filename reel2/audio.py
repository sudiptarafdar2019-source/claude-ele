"""SFX + original music bed, ducked under the cleaned voice -> bed.wav"""
import os, wave
import numpy as np
from sfxlib import *  # SR, whoosh, impact, pop, tick, ping, thud, tap, key, riser, shimmer, glitch, chime, lp, hp, reverb, norm, tt, env_exp, sweep_sine, rng

ROOT = os.path.dirname(os.path.abspath(__file__))
DUR = 43.3; N = int(SR * DUR)
sfx = np.zeros(N + SR * 3)
def put(x, t, g_db):
    k = int(t * SR); sfx[k:k + len(x)] += x[:len(sfx) - k] * 10 ** (g_db / 20)

def clock_tick(hi=True):
    d = 0.05; c = hp(rng.normal(0, 1, int(SR * d)), 3500) * env_exp(d, 0.003)
    b = np.sin(2 * np.pi * (2900 if hi else 2300) * tt(d)) * env_exp(d, 0.008)
    return norm(c * 0.7 + b * 0.5, 0.7)
def scribble(d=0.9):
    n = rng.normal(0, 1, int(SR * d)); x = np.arange(len(n)) / SR
    am = (0.5 + 0.5 * np.sin(2 * np.pi * 7.5 * x + 3 * np.sin(2 * np.pi * 1.3 * x))) ** 2
    y = hp(lp(n, 5200), 1400) * am * np.minimum(1, x / 0.05) * np.minimum(1, (d - x) / 0.1)
    return norm(y, 0.5)
def soft_whoosh(d=0.5): return whoosh(d, 0.55, 0.6)

CUTS = [3.20, 5.45, 8.42, 8.98, 9.94, 10.72, 11.74, 14.10, 15.24, 17.20, 19.72, 23.26, 27.12, 28.40, 32.72, 35.72, 40.48]
KIND = ['zoom', 'whip', 'flash', 'zoom', 'whip', 'zoom', 'whip', 'flash', 'zoom', 'fade', 'whip', 'zoom', 'flash', 'whip', 'zoom', 'whip', 'fade']

# hook
put(impact(), 0.0, -10); put(whoosh(0.45, 0.25, 1.0), 0.0, -17)
put(pop(), 0.30, -17)
put(glitch(), 1.60, -19); put(thud(), 1.64, -14)
# cut whooshes (peak on the cut)
for c, k in zip(CUTS, KIND):
    if k == 'fade': put(soft_whoosh(0.8), c - 0.45, -21)
    elif k == 'flash': d = 0.5; put(whoosh(d, 0.7, 1.2), c - d * 0.7, -15); put(impact()[:int(SR * .5)] * np.linspace(1, 0, int(SR * .5)), c, -22)
    else: d = 0.45; put(whoosh(d, 0.6, 1.1 if k == 'whip' else 0.8), c - d * 0.6, -15)
# questions marks
for t0 in (3.30, 3.50, 3.66): put(pop(), t0, -20)
# common reasons
put(pop(), 5.55, -19); put(pop(), 6.85, -17); put(shimmer(0.4), 6.9, -24)
for t0 in (8.50, 9.02, 9.98, 10.76, 12.30, 13.04): put(pop(), t0, -16); put(tick(2000), t0 + 0.05, -24)
# medical causes
put(pop(), 14.15, -19); put(pop(), 14.22, -17); put(thud(), 15.30, -15); put(pop(), 15.32, -16)
# clock
put(pop(), 17.3, -18)
for i, t0 in enumerate(np.arange(17.4, 19.6, 0.5)): put(clock_tick(i % 2 == 0), t0, -18)
put(pop(), 17.62, -17)
# note it down
put(pop(), 19.85, -18); put(ping(), 21.0, -19); put(scribble(0.8), 22.25, -17); put(pop(), 22.3, -18)
# 3 months counter
put(pop(), 23.4, -18)
for i, t0 in enumerate((24.78, 24.95, 25.12)): put(tick(1500 + i * 450), t0, -14)
put(thud(), 25.15, -15); put(pop(), 25.8, -17)
# doctor
put(ping(), 27.2, -15)
# pregnancy / retest
put(pop(), 28.5, -18); put(pop(), 30.5, -17); put(whoosh(0.35, 0.5, 0.8), 31.45, -21); put(thud(), 31.62, -15)
# follow
put(pop(), 32.78, -17); put(tap(), 33.12, -12); put(shimmer(0.6), 33.25, -19); put(pop(), 33.4, -20); put(pop(), 34.5, -16)
# comment READ
put(pop(), 35.78, -18)
for i in range(4): put(key(), 36.02 + i * 0.105, -13)
put(tap(), 36.75, -14); put(whoosh(0.3, 0.4, 0.9), 36.78, -22); put(pop(), 36.9, -18); put(pop(), 38.78, -16)
# share
put(pop(), 40.55, -16); put(pop(), 40.7, -18); put(pop(), 41.7, -20)
put(whoosh(0.6, 0.5, 1.0), 42.72, -15); put(chime(), 42.85, -17)

# ---------- music: warm, hopeful bed, 92 BPM in F major ----------
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
BEAT = 60 / 92; BAR = BEAT * 4
CHORDS = [[41, 57, 60, 64, 69], [45, 55, 60, 64, 67], [38, 57, 60, 62, 65], [46, 57, 62, 65, 69]]  # Fmaj7 Am7 Dm7 Bbmaj7
mus = np.zeros(N + SR * 3)
def add(x, t, g=1.0):
    k = int(t * SR); mus[k:k + len(x)] += x[:len(mus) - k] * g
def pad_note(f, d):
    t = tt(d); x = np.zeros(len(t))
    for det in (-0.004, 0, 0.0045):
        for h in range(1, 6): x += np.sin(2 * np.pi * f * (1 + det) * h * t + h) / h ** 1.8
    a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8); return x * np.clip(a, 0, 1)
def keys(f, d=0.9):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.15) + 0.1 * np.sin(6 * np.pi * f * t)) * np.exp(-t / 0.45) * np.minimum(1, t / 0.006)
def kick():
    d = 0.35; return sweep_sine(110, 45, d, 0.3) * env_exp(d, 0.10)
def snap():
    d = 0.2; return (hp(rng.normal(0, 1, int(SR * d)), 1800) * env_exp(d, 0.035) + np.sin(2 * np.pi * 220 * tt(d)) * env_exp(d, 0.03) * .4)
def hat():
    d = 0.06; return hp(rng.normal(0, 1, int(SR * d)), 7500) * env_exp(d, 0.014)
b = 0
while b * BAR < DUR:
    t0 = b * BAR; ch = CHORDS[b % 4]
    for m in ch[1:]: add(pad_note(mtof(m), BAR + 0.8), t0, 0.045)
    add(np.sin(2 * np.pi * mtof(ch[0]) * tt(BAR)) * np.minimum(1, tt(BAR) / 0.04) * np.minimum(1, (BAR - tt(BAR)) / 0.12), t0, 0.20)
    arp = [ch[1] + 12, ch[3] + 12, ch[2] + 12, ch[4] + 12, ch[3] + 12, ch[2] + 24, ch[4] + 12, ch[3] + 12]
    for i, m in enumerate(arp):
        ts = t0 + i * BEAT / 2
        if ts < DUR - 0.6: add(keys(mtof(m)), ts, 0.085 if ts < 5.45 else 0.10)
    for i in range(4):
        ts = t0 + i * BEAT
        if 5.45 <= ts < 42.6:
            if i in (0, 2): add(kick(), ts, 0.5)
            if i in (1, 3): add(snap(), ts, 0.12)
            add(hat(), ts + BEAT / 2, 0.08)
    b += 1
for m in CHORDS[0]: add(pad_note(mtof(m + 12 if m < 50 else m), 2.0), 42.6, 0.05)
mus = reverb(mus, 1.6, 0.25, 5000)[:len(mus)]

# ---------- duck under voice ----------
v = np.frombuffer(wave.open(os.path.join(ROOT, 'voice_clean.wav')).readframes(10 ** 9), np.int16).astype(np.float64) / 32768
venv = np.sqrt(np.convolve(v ** 2, np.ones(2400) / 2400, 'same'))
venv = np.minimum(1, venv / (np.percentile(venv, 90) + 1e-9))
venv = np.concatenate([venv, np.zeros(len(mus) - len(venv))])
venv = np.convolve(venv, np.ones(9600) / 9600, 'same')  # smooth ~0.2s
duck = 1 - 0.55 * np.clip(venv * 1.5, 0, 1)
mus = mus * duck
fade = np.ones(len(mus)); fe = int(DUR * SR); fade[fe - int(0.6 * SR):fe] = np.linspace(1, 0, int(0.6 * SR)); fade[fe:] = 0
fade[:int(0.4 * SR)] = np.linspace(0.3, 1, int(0.4 * SR))
bed = (norm(mus, 1.0) * 10 ** (-18 / 20) + sfx) * fade
bed = bed[:N]
st = np.clip(np.stack([bed, bed], 1), -1, 1)
with wave.open(os.path.join(ROOT, 'bed.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('bed ok')
