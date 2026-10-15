import numpy as np, wave, subprocess, os
SR = 48000; DUR = 33.0; N = int(SR * DUR)
ROOT = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(11)

def tt(d): return np.arange(int(SR * d)) / SR
def env_exp(d, tau): return np.exp(-tt(d) / tau)
def lp(x, fc):  # one-pole lowpass, fc may be array
    fc = np.broadcast_to(np.asarray(fc, np.float64), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
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

# ---------- SFX ----------
def whoosh(d=0.55, peak=0.62, bright=1.0):
    n = rng.normal(0, 1, int(SR * d)); x = np.linspace(0, 1, len(n))
    shape = np.where(x < peak, (x / peak) ** 2.2, ((1 - x) / (1 - peak)) ** 1.6)
    fc = 300 + 5200 * bright * shape
    y = lp(lp(n, fc), fc * 1.3) - lp(n, 150 + 300 * shape) * 0.6
    return norm(reverb(y * shape, 0.6, 0.2), 0.9)
def impact():
    d = 1.6; s = sweep_sine(95, 38, d, 0.35) * env_exp(d, 0.42)
    nz = lp(rng.normal(0, 1, int(SR * d)), 900) * env_exp(d, 0.05)
    return norm(reverb(s + nz * 0.8, 1.4, 0.3, 2000), 1.0)
def pop():
    d = 0.16; s = sweep_sine(980, 380, d, 0.4) * env_exp(d, 0.035)
    c = hp(rng.normal(0, 1, int(SR * d)), 3000) * env_exp(d, 0.004) * 0.4
    return norm(reverb(s + c, 0.4, 0.15), 0.8)
def tick(f=2400):
    d = 0.06; return norm(np.sin(2 * np.pi * f * tt(d)) * env_exp(d, 0.012), 0.6)
def ping():
    d = 1.0; t = tt(d); out = np.zeros(int(SR * d))
    for f, dl, a in ((1568, 0, 1), (2349, 0.085, .9)):
        k = int(dl * SR); e = np.exp(-t[:len(t) - k] / 0.28)
        out[k:] += a * (np.sin(2 * np.pi * f * t[:len(t) - k]) + 0.25 * np.sin(2 * np.pi * f * 2 * t[:len(t) - k])) * e
    return norm(reverb(out, 0.8, 0.25, 6000), 0.7)
def thud():
    d = 0.35; s = sweep_sine(170, 80, d, 0.5) * env_exp(d, 0.07)
    nz = lp(rng.normal(0, 1, int(SR * d)), 600) * env_exp(d, 0.02)
    return norm(s + nz * 0.5, 0.8)
def tap():
    d = 0.12; c = hp(rng.normal(0, 1, int(SR * d)), 2500) * env_exp(d, 0.006)
    b = np.sin(2 * np.pi * 1800 * tt(d)) * env_exp(d, 0.02)
    return norm(c + b * 0.6, 0.8)
def key():
    d = 0.07; f = rng.uniform(2200, 3600)
    c = hp(lp(rng.normal(0, 1, int(SR * d)), f * 1.5), f * 0.5) * env_exp(d, 0.008)
    return norm(c + np.sin(2 * np.pi * rng.uniform(300, 420) * tt(d)) * env_exp(d, 0.01) * 0.4, 0.55)
def riser(d=1.0):
    n = rng.normal(0, 1, int(SR * d)); x = np.linspace(0, 1, len(n))
    y = lp(n, 200 + 7000 * x ** 2) * x ** 2.2 + sweep_sine(180, 900, d, 2.0) * x ** 3 * 0.35
    return norm(y, 0.8)
def shimmer(d=1.0):
    out = np.zeros(int(SR * (d + 0.6)))
    for i in range(14):
        st = int(rng.uniform(0, d) * SR); f = rng.uniform(3000, 7500); dd = 0.5
        out[st:st + int(dd * SR)] += np.sin(2 * np.pi * f * tt(dd)) * env_exp(dd, 0.09) * rng.uniform(.3, 1)
    return norm(reverb(out, 1.0, 0.35, 9000), 0.5)
def glitch():
    d = 0.45; out = np.zeros(int(SR * d))
    for i in range(7):
        st = int(i * 0.055 * SR); L = int(rng.uniform(0.02, 0.05) * SR)
        seg = np.sign(np.sin(2 * np.pi * rng.uniform(150, 900) * tt(L / SR))) * 0.5 + rng.normal(0, .5, L)
        seg = np.round(seg * 4) / 4
        out[st:st + L] += seg[:len(out[st:st + L])] * (1 - i / 8)
    return norm(lp(out, 6000), 0.6)
def chime():
    d = 2.2; t = tt(d); out = np.zeros(len(t))
    for f, dl in ((1046.5, 0), (1318.5, .06), (1568, .12), (2093, .18)):
        k = int(dl * SR); e = np.exp(-t[:len(t) - k] / 0.7)
        out[k:] += (np.sin(2 * np.pi * f * t[:len(t) - k]) + .2 * np.sin(2 * np.pi * f * 2.01 * t[:len(t) - k])) * e
    return norm(reverb(out, 1.6, 0.35, 7000), 0.6)

sfx = np.zeros(N + SR * 3)
def put(x, t, g_db):
    k = int(t * SR); sfx[k:k + len(x)] += x[:len(sfx) - k] * 10 ** (g_db / 20)

B = [4.30, 7.00, 10.33, 20.08, 23.25, 27.88]
put(impact(), 0.0, -9); put(whoosh(0.5, 0.2), 0.0, -16)
for b in B:  # transition whooshes peaking at cut
    d = 0.6; put(whoosh(d, 0.6, 1.1), b - d * 0.6, -13)
put(whoosh(0.4, 0.5, 0.7), 1.50, -21); put(pop(), 1.62, -19)
put(thud(), 3.25, -18)
put(pop(), 5.80, -17)
put(whoosh(0.5, 0.7, 0.5), 8.60, -22); put(pop(), 9.05, -17)
put(pop(), 11.50, -17); put(thud(), 12.92, -14)
for t0 in (13.64, 15.74, 17.18, 18.52):
    put(whoosh(0.35, 0.45, 0.8), t0 - 0.12, -21); put(pop(), t0 + 0.02, -19); put(tick(1800), t0 + 0.18, -24)
put(whoosh(0.4, 0.4, 0.9), 19.80, -22)
put(whoosh(0.4, 0.5, 0.6), 20.25, -22)
for i, t0 in enumerate((20.44, 21.10, 21.70)): put(tick(1600 + i * 400), t0, -18)
put(pop(), 22.45, -15); put(tap(), 22.56, -13); put(shimmer(0.5), 22.58, -20)
put(impact()[:int(SR * 0.6)] * np.linspace(1, 0, int(SR * 0.6)), 23.50, -20)
put(ping(), 25.00, -15); put(ping(), 25.42, -17)
put(whoosh(0.35, 0.4, 0.8), 26.40, -21); put(thud(), 26.80, -17)
put(riser(0.98), 26.90, -15); put(glitch(), 27.70, -16); put(impact(), 27.88, -12)
put(whoosh(0.45, 0.5, 0.7), 27.95, -21)
for i in range(5): put(key(), 28.40 + i * 0.1, -14)
put(pop(), 28.95, -15); put(tap(), 28.97, -17)
put(whoosh(0.4, 0.5, 0.7), 29.35, -21); put(pop(), 29.47, -17); put(shimmer(0.9), 30.0, -19)
put(whoosh(0.7, 0.6, 1.0), 31.40, -15); put(impact(), 31.80, -14); put(chime(), 31.95, -16)

# ---------- music (original bed, 100 BPM, D minor) ----------
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
BEAT = 0.6; BAR = BEAT * 4
CHORDS = [[50, 57, 60, 64, 65], [46, 53, 57, 62, 65], [41, 53, 57, 60, 64], [48, 55, 60, 62, 67]]  # Dm9 Bbmaj7 Fmaj7 Csus
mus = np.zeros(N + SR * 3); t_all = np.arange(len(mus)) / SR
def add(x, t, g=1.0):
    k = int(t * SR); mus[k:k + len(x)] += x[:len(mus) - k] * g
def pad_note(f, d):
    t = tt(d); x = np.zeros(len(t))
    for det in (-0.12, 0, 0.13):
        for h in range(1, 7): x += np.sin(2 * np.pi * f * (1 + det / 100 * 12 / 12) * h * t + h) / h ** 1.6 * (1 + det)
    a = np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.7); return x * np.clip(a, 0, 1)
def pluck(f, d=0.55):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)) * np.exp(-t / 0.22) * np.minimum(1, t / 0.004)
def kick():
    d = 0.4; return sweep_sine(120, 42, d, 0.3) * env_exp(d, 0.12)
def hat():
    d = 0.08; return hp(rng.normal(0, 1, int(SR * d)), 7000) * env_exp(d, 0.018)
nb = int(np.ceil(DUR / BAR)) + 1
for b in range(nb):
    t0 = b * BAR; ch = CHORDS[b % 4]
    if t0 > 32.4: break
    for m in ch[1:]: add(pad_note(mtof(m), BAR + 0.7), t0, 0.05)
    add(np.sin(2 * np.pi * mtof(ch[0] - 12) * tt(BAR)) * np.minimum(1, tt(BAR) / 0.05) * np.minimum(1, (BAR - tt(BAR)) / 0.1), t0, 0.22)
    arp = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12, ch[2] + 12, ch[4] + 12, ch[3] + 24]
    for i, m in enumerate(arp):
        ts = t0 + i * BEAT / 2
        if ts < 26.9 or ts >= 27.88: add(pluck(mtof(m)), ts, 0.10 if ts < 4.3 else 0.13)
    for i in range(4):
        ts = t0 + i * BEAT
        if 4.3 <= ts < 26.9 or 27.88 <= ts < 31.8:
            add(kick(), ts, 0.55 if i % 2 == 0 else 0.35)
            add(hat(), ts + BEAT / 2, 0.10)
# final ring-out chord
for m in CHORDS[0]: add(pad_note(mtof(m + 12 if m < 55 else m), 2.0), 31.8, 0.06)
mus = reverb(mus, 1.8, 0.22, 5000)[:len(mus)]
# fade the build gap
gap = (t_all > 26.9) & (t_all < 27.88); mus[gap] *= np.linspace(1, 0.35, gap.sum())

# ---------- voice + ducking ----------
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(ROOT, 'voice.mp3'), '-ac', '1', '-ar', str(SR), os.path.join(ROOT, 'voice48.wav')], check=True)
v = np.frombuffer(wave.open(os.path.join(ROOT, 'voice48.wav')).readframes(10 ** 9), np.int16).astype(np.float64) / 32768
venv = np.sqrt(np.convolve(v ** 2, np.ones(2400) / 2400, 'same'))
venv = np.minimum(1, venv / (np.percentile(venv, 90) + 1e-9))
venv = lp(np.concatenate([venv, np.zeros(len(mus) - len(venv))]), 4.0)
duck = 1 - 0.5 * np.clip(venv * 1.4, 0, 1)
mus = mus * duck
fade = np.ones(len(mus)); fe = int(DUR * SR); fade[fe - int(0.5 * SR):fe] = np.linspace(1, 0, int(0.5 * SR)); fade[fe:] = 0
bed = (norm(mus, 1.0) * 10 ** (-17 / 20) + sfx) * fade
bed = bed[:N]
st = np.clip(np.stack([bed, bed], 1), -1, 1)
with wave.open(os.path.join(ROOT, 'bed.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('bed ok')
