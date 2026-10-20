import numpy as np, wave, subprocess, os
from scipy.signal import lfilter
SR = 48000; DUR = 64.5; N = int(SR * DUR)
ROOT = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(21)

def tt(d): return np.arange(int(SR * d)) / SR
def env_exp(d, tau): return np.exp(-tt(d) / tau)
def lp(x, fc):  # one-pole lowpass; fc scalar or array
    if np.isscalar(fc):
        a = 1 - np.exp(-2 * np.pi * fc / SR); return lfilter([a], [1, a - 1], x)
    a = 1 - np.exp(-2 * np.pi * np.asarray(fc, np.float64) / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a[i] * (x[i] - s); y[i] = s
    return y
def hp(x, fc): return x - lp(x, fc)
def sweep_sine(f0, f1, d, curve=1.0):
    f = f0 + (f1 - f0) * (np.linspace(0, 1, int(SR * d)) ** curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(x, peak=1.0): return x / (np.max(np.abs(x)) + 1e-9) * peak
def reverb(x, dur=1.2, mix=0.25, damp=3000):
    ir = rng.normal(0, 1, int(SR * dur)) * np.exp(-tt(dur) / (dur / 5)); ir = lp(ir, damp); ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir); y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)
    out = np.zeros(n); out[:len(x)] += x * (1 - mix); out += y * mix * 0.7; return out

# ---------- SFX (soft, airy palette) ----------
def whoosh(d=0.55, peak=0.62, bright=1.0):
    n = rng.normal(0, 1, int(SR * d)); x = np.linspace(0, 1, len(n))
    shape = np.where(x < peak, (x / peak) ** 2.2, ((1 - x) / (1 - peak)) ** 1.6)
    fc = 300 + 4200 * bright * shape
    y = lp(lp(n, fc), fc * 1.3) - lp(n, 160) * 0.5 * shape
    return norm(reverb(y * shape, 0.7, 0.25), 0.9)
def soft_impact():
    d = 1.4; s = sweep_sine(85, 40, d, 0.35) * env_exp(d, 0.38)
    nz = lp(rng.normal(0, 1, int(SR * d)), 700) * env_exp(d, 0.05)
    return norm(reverb(s + nz * 0.6, 1.4, 0.3, 2000), 1.0)
def pop(f0=900, f1=420):
    d = 0.16; s = sweep_sine(f0, f1, d, 0.4) * env_exp(d, 0.035)
    c = hp(rng.normal(0, 1, int(SR * d)), 3000) * env_exp(d, 0.003) * 0.3
    return norm(reverb(s + c, 0.4, 0.18), 0.8)
def bubble(f=600):
    d = 0.12; s = sweep_sine(f, f * 1.9, d, 0.6) * env_exp(d, 0.03)
    return norm(reverb(s, 0.3, 0.2), 0.7)
def tick(f=2400):
    d = 0.06; return norm(np.sin(2 * np.pi * f * tt(d)) * env_exp(d, 0.012), 0.6)
def ding(f=1318.5):
    d = 1.2; t = tt(d); out = np.zeros(len(t))
    for ff, dl, a in ((f, 0, 1), (f * 1.5, 0.07, .8)):
        k = int(dl * SR); e = np.exp(-t[:len(t) - k] / 0.32)
        out[k:] += a * (np.sin(2 * np.pi * ff * t[:len(t) - k]) + 0.2 * np.sin(2 * np.pi * ff * 2.0 * t[:len(t) - k])) * e
    return norm(reverb(out, 0.9, 0.3, 7000), 0.7)
def thud():
    d = 0.4; s = sweep_sine(160, 70, d, 0.5) * env_exp(d, 0.08)
    nz = lp(rng.normal(0, 1, int(SR * d)), 500) * env_exp(d, 0.02)
    return norm(s + nz * 0.5, 0.8)
def swish():  # strike-through
    d = 0.3; n = rng.normal(0, 1, int(SR * d)); x = np.linspace(0, 1, len(n))
    sh = np.sin(np.pi * x) ** 2; y = hp(lp(n, 2500 + 6000 * x), 1500) * sh
    return norm(reverb(y, 0.3, 0.15), 0.7)
def tap():
    d = 0.12; c = hp(rng.normal(0, 1, int(SR * d)), 2500) * env_exp(d, 0.006)
    b = np.sin(2 * np.pi * 1700 * tt(d)) * env_exp(d, 0.02)
    return norm(c + b * 0.6, 0.8)
def key():
    d = 0.07; f = rng.uniform(2200, 3600)
    c = hp(lp(rng.normal(0, 1, int(SR * d)), f * 1.5), f * 0.5) * env_exp(d, 0.008)
    return norm(c + np.sin(2 * np.pi * rng.uniform(300, 420) * tt(d)) * env_exp(d, 0.01) * 0.4, 0.55)
def riser(d=1.0):
    n = rng.normal(0, 1, int(SR * d)); x = np.linspace(0, 1, len(n))
    y = lp(n, 200 + 6000 * x ** 2) * x ** 2.2 + sweep_sine(220, 880, d, 2.0) * x ** 3 * 0.3
    return norm(y, 0.8)
def shimmer(d=1.0):
    out = np.zeros(int(SR * (d + 0.6)))
    for i in range(14):
        st = int(rng.uniform(0, d) * SR); f = rng.uniform(2600, 7000); dd = 0.5
        out[st:st + int(dd * SR)] += np.sin(2 * np.pi * f * tt(dd)) * env_exp(dd, 0.09) * rng.uniform(.3, 1)
    return norm(reverb(out, 1.0, 0.35, 9000), 0.5)
def buzz():  # gentle 'wrong' tone
    d = 0.32; t = tt(d); s = (np.sin(2 * np.pi * 180 * t) + 0.6 * np.sin(2 * np.pi * 190 * t)) * np.minimum(1, t / 0.01) * env_exp(d, 0.12)
    return norm(lp(s, 1800), 0.6)
def chime():
    d = 2.4; t = tt(d); out = np.zeros(len(t))
    for f, dl in ((698.5, 0), (880, .07), (1046.5, .14), (1396.9, .21)):
        k = int(dl * SR); e = np.exp(-t[:len(t) - k] / 0.8)
        out[k:] += (np.sin(2 * np.pi * f * t[:len(t) - k]) + .2 * np.sin(2 * np.pi * f * 2.01 * t[:len(t) - k])) * e
    return norm(reverb(out, 1.8, 0.35, 7000), 0.6)

sfx = np.zeros(N + SR * 4)
def put(x, t, g_db):
    k = int(t * SR); sfx[k:k + len(x)] += x[:len(sfx) - k] * 10 ** (g_db / 20)

B = [3.85, 5.85, 11.55, 15.62, 17.90, 22.70, 26.56, 31.59, 36.60, 40.27, 43.50, 45.66, 51.43, 54.75, 59.62, 62.35]
TK = ['flash', 'zoom', 'whip', 'zoom', 'leak', 'slide', 'whip', 'flash', 'zoom', 'whipv', 'flash', 'slide', 'zoom', 'leak', 'whip', 'end']
put(soft_impact(), 0.0, -16); put(whoosh(0.5, 0.2, 0.8), 0.0, -18); put(shimmer(0.4), 0.05, -22)
for b, k in zip(B[:-1], TK):
    d = 0.6; put(whoosh(d, 0.6, 1.0 if k != 'zoom' else 1.2), b - d * 0.6, -15)
    if k in ('flash', 'leak'): put(shimmer(0.5), b - 0.1, -24)
put(pop(), 1.70, -19); put(pop(1000, 480), 2.32, -19)
put(swish(), 2.94, -20); put(swish(), 3.08, -21)
put(thud(), 4.40, -15); put(soft_impact()[:int(SR * 0.9)] * np.linspace(1, 0, int(SR * 0.9)), 4.40, -15)
put(ding(1568), 4.95, -22); put(ding(1760), 5.07, -23)
put(whoosh(0.4, 0.5, 0.6), 6.10, -22); put(pop(), 6.30, -21)
put(whoosh(0.45, 0.5, 0.6), 9.00, -22); put(whoosh(0.5, 0.4, 0.5), 10.70, -24)
put(bubble(560), 12.38, -17); put(bubble(640), 14.40, -17)
put(whoosh(0.4, 0.5, 0.6), 15.95, -22); put(pop(760, 380), 16.62, -18)
put(pop(), 18.34, -21); put(pop(), 20.86, -20); put(swish(), 22.18, -19)
put(pop(700, 350), 23.48, -17); put(shimmer(0.4), 23.5, -24)
for i, t0 in enumerate((24.38, 24.88, 25.40)): put(pop(900 + i * 180, 450 + i * 90), t0, -19)
put(pop(), 27.52, -18)
for i, t0 in enumerate((29.06, 29.76, 30.46, 30.90)): put(bubble(620 + i * 90), t0, -19); put(tick(2000 + i * 300), t0 + 0.12, -27)
for i, t0 in enumerate((32.12, 33.58, 34.10)): put(bubble(600 + i * 100), t0, -20)
put(whoosh(0.4, 0.5, 0.6), 34.50, -22)
for i in range(3): put(tick(1600 + i * 400), 34.75 + i * 0.3, -21)
put(ding(1318.5), 37.44, -19)
for i, t0 in enumerate((37.95, 38.25, 38.55, 38.85, 39.15)): put(bubble(600 + i * 70), t0, -21)
put(whoosh(0.4, 0.5, 0.7), 40.25, -21); put(buzz(), 40.90, -22)
put(whoosh(0.4, 0.5, 0.7), 41.65, -21); put(buzz(), 42.30, -22)
put(ding(1568), 44.36, -18); put(shimmer(0.6), 44.4, -22)
put(whoosh(0.4, 0.5, 0.6), 46.75, -22); put(pop(), 49.68, -20)
put(whoosh(0.45, 0.6, 0.6), 51.45, -21)
for i in range(4): put(key(), 52.30 + i * 0.09, -15)
put(pop(1100, 600), 52.75, -18)
put(whoosh(0.4, 0.5, 0.6), 53.15, -22); put(tap(), 53.95, -15); put(ding(1760), 54.02, -22); put(shimmer(0.5), 54.0, -23)
put(pop(), 55.08, -18); put(whoosh(0.45, 0.5, 0.6), 57.45, -21); put(pop(), 58.52, -20)
put(pop(700, 350), 60.44, -18); put(thud(), 61.15, -19); put(pop(), 61.12, -20)
put(riser(1.3), 61.05, -18); put(soft_impact(), 62.35, -13); put(chime(), 62.55, -17); put(shimmer(1.0), 62.6, -21)
put(pop(), 63.20, -20)

# ---------- music: warm, uplifting bed (96 BPM, F major) ----------
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
BEAT = 60 / 96; BAR = BEAT * 4
CHORDS = [[41, 57, 60, 64, 69], [45, 57, 60, 64, 67], [38, 57, 60, 62, 65], [46, 58, 62, 65, 69]]  # Fmaj7 Am7 Dm7 Bbmaj7
mus = np.zeros(N + SR * 4); t_all = np.arange(len(mus)) / SR
def add(x, t, g=1.0):
    k = int(t * SR); mus[k:k + len(x)] += x[:len(mus) - k] * g
def pad_note(f, d):
    t = tt(d); x = np.zeros(len(t))
    for det in (-0.004, 0, 0.004):
        for h in range(1, 6): x += np.sin(2 * np.pi * f * (1 + det) * h * t + h) / h ** 1.8
    a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8); return x * np.clip(a, 0, 1)
def keys(f, d=0.9):  # e-piano-ish
    t = tt(d); return (np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.3))) * np.exp(-t / 0.45) * np.minimum(1, t / 0.004)
def pluck(f, d=0.5):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.18) * np.minimum(1, t / 0.003)
def kick():
    d = 0.4; return sweep_sine(110, 45, d, 0.3) * env_exp(d, 0.11)
def clap():
    d = 0.25; n = hp(rng.normal(0, 1, int(SR * d)), 1200); e = np.zeros(len(n))
    for o in (0, 0.012, 0.024): k = int(o * SR); e[k:] += np.exp(-tt(d)[:len(e) - k] / (0.02 if o < 0.02 else 0.08))
    return lp(n * e, 6000)
def shaker():
    d = 0.07; return hp(rng.normal(0, 1, int(SR * d)), 6000) * np.sin(np.pi * np.linspace(0, 1, int(SR * d))) ** 2

QUIET = (15.62, 17.90)
nb = int(np.ceil(DUR / BAR)) + 1
for b in range(nb):
    t0 = b * BAR; ch = CHORDS[b % 4]
    if t0 > 62.4: break
    for m in ch[1:]: add(pad_note(mtof(m), BAR + 0.8), t0, 0.035)
    full = 3.85 <= t0 + 0.01
    add(np.sin(2 * np.pi * mtof(ch[0] - 12 + 12) * tt(BAR)) * np.minimum(1, tt(BAR) / 0.05) * np.minimum(1, (BAR - tt(BAR)) / 0.1), t0, 0.16 if full else 0.08)
    for i, off in enumerate((0, 1.5, 2.5)):  # keys comping
        ts = t0 + off * BEAT
        if not (QUIET[0] <= ts < QUIET[1]):
            for m in ch[1:4]: add(keys(mtof(m + 12)), ts, 0.035)
    arp = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 24, ch[2] + 12, ch[4] + 12, ch[3] + 12]
    for i, m in enumerate(arp):
        ts = t0 + i * BEAT / 2
        if ts < 62.3 and not (QUIET[0] <= ts < QUIET[1]): add(pluck(mtof(m + 12)), ts, 0.045)
    for i in range(4):
        ts = t0 + i * BEAT
        if 3.85 <= ts < 62.3 and not (QUIET[0] <= ts < QUIET[1]):
            add(kick(), ts, 0.42 if i % 2 == 0 else 0.0)
            if i % 2 == 1: add(clap(), ts, 0.10)
            add(shaker(), ts + BEAT / 2, 0.05); add(shaker(), ts + BEAT * 0.25, 0.025)
for m in CHORDS[0]: add(pad_note(mtof(m + 12 if m < 50 else m), 2.4), 62.35, 0.05)
for m in CHORDS[0][1:]: add(keys(mtof(m + 12), 2.0), 62.35, 0.05)
mus = reverb(mus, 1.8, 0.2, 5000)[:len(mus)]

# ---------- voice + ducking ----------
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(ROOT, 'voice.mp3'), '-ac', '1', '-ar', str(SR), os.path.join(ROOT, 'voice48.wav')], check=True)
v = np.frombuffer(wave.open(os.path.join(ROOT, 'voice48.wav')).readframes(10 ** 9), np.int16).astype(np.float64) / 32768
venv = np.sqrt(np.convolve(v ** 2, np.ones(2400) / 2400, 'same'))
venv = np.minimum(1, venv / (np.percentile(venv, 90) + 1e-9))
venv = lp(np.concatenate([venv, np.zeros(len(mus) - len(venv))]), 4.0)
duck = 1 - 0.45 * np.clip(venv * 1.4, 0, 1)
mus = mus * duck
fade = np.ones(len(mus)); fe = int(DUR * SR); fade[fe - int(0.8 * SR):fe] = np.linspace(1, 0, int(0.8 * SR)); fade[fe:] = 0
bed = (norm(mus, 1.0) * 10 ** (-18 / 20) + sfx[:len(mus)]) * fade
bed = bed[:N]
st = np.clip(np.stack([bed, bed], 1), -1, 1)
with wave.open(os.path.join(ROOT, 'bed.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('bed ok')
