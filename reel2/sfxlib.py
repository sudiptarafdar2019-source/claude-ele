import numpy as np, wave, subprocess, os
SR = 48000
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
        seg = np.sign(np.sin(2 * np.pi * rng.uniform(150, 900) * np.arange(L) / SR)) * 0.5 + rng.normal(0, .5, L)
        seg = np.round(seg * 4) / 4
        out[st:st + L] += seg[:len(out[st:st + L])] * (1 - i / 8)
    return norm(lp(out, 6000), 0.6)
def chime():
    d = 2.2; t = tt(d); out = np.zeros(len(t))
    for f, dl in ((1046.5, 0), (1318.5, .06), (1568, .12), (2093, .18)):
        k = int(dl * SR); e = np.exp(-t[:len(t) - k] / 0.7)
        out[k:] += (np.sin(2 * np.pi * f * t[:len(t) - k]) + .2 * np.sin(2 * np.pi * f * 2.01 * t[:len(t) - k])) * e
    return norm(reverb(out, 1.6, 0.35, 7000), 0.6)

