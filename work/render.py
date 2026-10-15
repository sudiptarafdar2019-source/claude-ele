import numpy as np, cv2, json, math, sys, os, subprocess
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
DUR = 33.0
NF = int(round(DUR * FPS))
FD = '/usr/share/fonts/opentype/inter/'
ROOT = os.path.dirname(os.path.abspath(__file__))
_fc = {}
def F(name, size):
    k = (name, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(FD + name, size)
    return _fc[k]

NAVY = (5, 11, 31); DEEP = (10, 30, 80); ROYAL = (30, 91, 255); SKY = (79, 163, 255)
ICE = (150, 205, 255); CORAL = (255, 92, 112); WHITE = (255, 255, 255)

# ---------- easing ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eoc(x): x = clamp(x); return 1 - (1 - x) ** 3
def eic(x): x = clamp(x); return x ** 3
def eioc(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def eob(x, s=1.70158): x = clamp(x); return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2
def eios(x): x = clamp(x); return -(math.cos(math.pi * x) - 1) / 2
def prog(t, a, d): return clamp((t - a) / d)
def lerp(a, b, p): return a + (b - a) * p

# ---------- words / captions ----------
SIL = [(3.94, 4.64), (6.72, 7.28), (10.04, 10.63), (11.53, 11.72), (12.31, 12.53), (15.45, 15.75), (16.84, 17.20),
       (19.82, 20.35), (22.96, 23.54), (24.10, 24.39), (26.18, 26.38), (27.67, 28.09)]
def load_words():
    raw = json.load(open(os.path.join(ROOT, 'words.json')))
    out = []
    for w in raw:
        t = w['w']
        if t.startswith('-') and out:
            out[-1]['w'] += t.rstrip('.') + '!'; out[-1]['e'] = w['e']; continue
        s, e = w['s'], w['e']
        for a, b in SIL:
            if a < s < b - 0.02: s = b - 0.04
            if s < a < e and e > a + 0.08: e = a + 0.06
        t = t.replace('inquiries', 'enquiries')
        if t == 'Comment': s, e = 28.07, 28.36
        out.append({'w': t, 's': s, 'e': e})
    return out
WORDS = load_words()
KEY = {'customers', 'every', 'single', 'day', 'problem', 'design', 'ignore', 'beautiful', 'fail', 'offer', 'next', 'step',
       'trust', 'follow-up', 'guide', 'action', 'honest', 'enquiries', 'good', 'audit', 'free', 'completely'}
def clean(t): return t.rstrip('.,')
GROUPS = [2,3,2,3, 3,3,2, 3,2,1,2, 3,2,3,2,2,2,2,3,2,2,3,2, 3,3,3, 2,3,3,3,3, 2,3,2,3]
def build_chunks():
    assert sum(GROUPS) == len(WORDS), (sum(GROUPS), len(WORDS))
    chunks, i = [], 0
    for g in GROUPS: chunks.append(WORDS[i:i + g]); i += g
    res = []
    for i, c in enumerate(chunks):
        st = c[0]['s'] - 0.08
        res.append({'words': c, 's': st})
    for i, c in enumerate(res):
        last = c['words'][-1]['e']
        nxt = res[i + 1]['s'] if i + 1 < len(res) else last + 0.6
        c['e'] = min(nxt, last + 0.6); c['fade'] = (c['e'] - last) > 0.3
    return res
CHUNKS = build_chunks()

# ---------- drawing helpers ----------
def grad(w, h, c1, c2, horizontal=False, a1=255, a2=255):
    t = np.linspace(0, 1, w if horizontal else h)[None, :, None] if horizontal else np.linspace(0, 1, h)[:, None, None]
    c1 = np.array(list(c1) + [a1], np.float32); c2 = np.array(list(c2) + [a2], np.float32)
    g = c1 + (c2 - c1) * t
    g = np.broadcast_to(g, (h, w, 4)).copy()
    return Image.fromarray(g.astype(np.uint8), 'RGBA')

def rr_mask(w, h, r, ss=3):
    m = Image.new('L', (w * ss, h * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], r * ss, fill=255)
    return m.resize((w, h), Image.LANCZOS)

def circle_img(d, c1, c2):
    g = grad(d, d, c1, c2)
    m = Image.new('L', (d * 3, d * 3), 0); ImageDraw.Draw(m).ellipse([0, 0, d * 3 - 1, d * 3 - 1], fill=255)
    g.putalpha(m.resize((d, d), Image.LANCZOS)); return g

def icon(img, cx, cy, s, kind, col=(255, 255, 255, 255)):
    ss = 4; L = Image.new('RGBA', (s * ss, s * ss), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    S = s * ss; lw = max(2, int(S * 0.085))
    def P(x, y): return (x * S, y * S)
    if kind == 'check':
        d.line([P(.22, .52), P(.42, .72), P(.78, .30)], fill=col, width=lw, joint='curve')
    elif kind == 'x':
        d.line([P(.28, .28), P(.72, .72)], fill=col, width=lw); d.line([P(.72, .28), P(.28, .72)], fill=col, width=lw)
    elif kind == 'q':
        f = F('InterDisplay-Black.otf', int(S * .8)); d.text(P(.5, .52), '?', font=f, fill=col, anchor='mm')
    elif kind == 'route':
        d.line([P(.18, .78), P(.18, .45), P(.62, .45), P(.62, .22)], fill=col, width=lw, joint='curve')
        d.polygon([P(.48, .30), P(.62, .12), P(.76, .30)], fill=col)
        d.ellipse([P(.10, .72), P(.26, .88)], fill=col)
    elif kind == 'shield':
        d.polygon([P(.5, .12), P(.82, .25), P(.78, .58), P(.5, .88), P(.22, .58), P(.18, .25)], outline=col, width=lw)
        d.line([P(.36, .50), P(.47, .62), P(.66, .38)], fill=col, width=lw)
    elif kind == 'mail':
        d.rounded_rectangle([P(.14, .26), P(.86, .74)], radius=S * .06, outline=col, width=lw)
        d.line([P(.16, .30), P(.5, .54), P(.84, .30)], fill=col, width=lw, joint='curve')
    elif kind == 'bell':
        d.pieslice([P(.22, .18), P(.78, .80)], 180, 360, fill=col)
        d.rectangle([P(.22, .48), P(.78, .68)], fill=col); d.ellipse([P(.42, .70), P(.58, .86)], fill=col)
    elif kind == 'user':
        d.ellipse([P(.34, .16), P(.66, .48)], fill=col); d.pieslice([P(.16, .54), P(.84, 1.2)], 180, 360, fill=col)
    elif kind == 'send':
        d.polygon([P(.2, .2), P(.84, .5), P(.2, .8), P(.32, .5)], fill=col)
    elif kind == 'chart':
        d.line([P(.15, .3), P(.4, .55), P(.6, .45), P(.85, .75)], fill=col, width=lw, joint='curve')
    L = L.resize((s, s), Image.LANCZOS)
    img.alpha_composite(L, (int(cx - s / 2), int(cy - s / 2)))

PADS = 44
def card(w, h, title, sub=None, ic=None, badge=None, r=30, tsize=40, icon_cols=(ROYAL, SKY), border=(255, 255, 255, 60),
         tint=(14, 30, 72, 150), tcol=WHITE, scol=(185, 205, 240), ty=None):
    p = PADS
    im = Image.new('RGBA', (w + 2 * p, h + 2 * p), (0, 0, 0, 0))
    sh = Image.new('L', im.size, 0); ImageDraw.Draw(sh).rounded_rectangle([p, p + 12, p + w, p + h + 12], r, fill=150)
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    shadow = Image.new('RGBA', im.size, (0, 4, 18, 255)); shadow.putalpha(sh); im.alpha_composite(shadow)
    body = Image.new('RGBA', (w, h), tint)
    hl = grad(w, h, (255, 255, 255), (255, 255, 255), a1=38, a2=0); body.alpha_composite(hl)
    m = rr_mask(w, h, r); body.putalpha(Image.fromarray((np.array(body.getchannel('A')) * (np.array(m) / 255)).astype(np.uint8)))
    im.alpha_composite(body, (p, p))
    bd = Image.new('RGBA', ((w) * 3, (h) * 3), (0, 0, 0, 0))
    ImageDraw.Draw(bd).rounded_rectangle([1, 1, w * 3 - 2, h * 3 - 2], r * 3, outline=border, width=5)
    im.alpha_composite(bd.resize((w, h), Image.LANCZOS), (p, p))
    x = p + 26
    if ic:
        d = h - 34 if h < 140 else (58 if ty else 86)
        cyy = p + (ty if ty else h / 2)
        im.alpha_composite(circle_img(d, *icon_cols), (x, int(cyy - d / 2)))
        icon(im, x + d / 2, cyy, int(d * .62), ic); x += d + 24
    dr = ImageDraw.Draw(im)
    if sub:
        dr.text((x, p + h / 2 - 4), title, font=F('InterDisplay-Bold.otf', tsize), fill=tcol, anchor='ls')
        dr.text((x, p + h / 2 + 10), sub, font=F('Inter-Medium.otf', 27), fill=scol, anchor='lt')
    else:
        dr.text((x, p + (ty if ty else h / 2)), title, font=F('InterDisplay-Bold.otf', tsize), fill=tcol, anchor='lm')
    if badge:
        bdm = 50 if h > 90 else 40
        bc = (CORAL, (255, 140, 120)) if badge == 'x' else (ROYAL, SKY)
        im.alpha_composite(circle_img(bdm, *bc), (p + w - 26 - bdm, p + (h - bdm) // 2))
        icon(im, p + w - 26 - bdm / 2, p + h / 2, int(bdm * .7), badge)
    mask = Image.new('L', im.size, 0); mask.paste(m, (p, p))
    return im, mask

def text_sprite(txt, font, fill, shadow=170, blur=9, oy=6, pad=34):
    bb = font.getbbox(txt)
    w, h = bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if shadow:
        s = Image.new('L', (w, h), 0); ImageDraw.Draw(s).text((pad - bb[0], pad - bb[1] + oy), txt, font=font, fill=shadow)
        s = s.filter(ImageFilter.GaussianBlur(blur))
        sl = Image.new('RGBA', (w, h), (0, 6, 24, 255)); sl.putalpha(s); im.alpha_composite(sl)
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), txt, font=font, fill=fill)
    return im, (pad, pad, w - pad, h - pad)

def with_alpha(spr, a):
    if a >= 0.999: return spr
    arr = np.array(spr); arr[..., 3] = (arr[..., 3].astype(np.float32) * a).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')

def paste(ov, spr, x, y):
    x, y = int(round(x)), int(round(y)); w, h = spr.size
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    ov.alpha_composite(spr.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))

# ---------- scenes / images ----------
BIG = 1.25
def grade(a, k):
    lum = (a @ np.array([.299, .587, .114], np.float32))[..., None]
    b = a * np.array([0.93, 1.0, 1.09], np.float32)
    sh = (1 - lum) ** 2.2
    b = b * (1 - 0.28 * sh) + sh * 0.28 * np.array([0.02, 0.07, 0.20], np.float32)
    b = np.clip(b, 0, 1); b = b * b * (3 - 2 * b) * 0.3 + b * 0.7
    return a * (1 - k) + b * k

def make_cover(path, fx=None, fy=None, k=0.6):
    im = Image.open(os.path.join(ROOT, 'img', path)).convert('RGB'); iw, ih = im.size
    s0 = max(W / iw, H / ih); cw, ch = iw * s0, ih * s0
    fx = iw / 2 if fx is None else fx; fy = ih / 2 if fy is None else fy
    ox = clamp(fx * s0 - W / 2, 0, cw - W); oy = clamp(fy * s0 - H / 2, 0, ch - H)
    big = im.resize((round(cw * BIG), round(ch * BIG)), Image.LANCZOS)
    big = big.crop((round(ox * BIG), round(oy * BIG), round(ox * BIG) + round(W * BIG), round(oy * BIG) + round(H * BIG)))
    a = np.asarray(big).astype(np.float32) / 255
    a = grade(a, k)
    bl = cv2.GaussianBlur(a, (0, 0), 1.6); a = np.clip(a + (a - bl) * 0.55, 0, 1)
    return (a * 255).astype(np.uint8), s0, ox, oy

class Scene:
    def __init__(s, img, t0, t1, kf, fx=None, fy=None, k=0.6):
        s.big, s.s0, s.ox, s.oy = make_cover(img, fx, fy, k)
        s.t0, s.t1, s.kf = t0, t1, kf
    def view(s, t):
        kf = s.kf
        if t <= kf[0][0]: z, cx, cy = kf[0][1:4]
        elif t >= kf[-1][0]: z, cx, cy = kf[-1][1:4]
        else:
            for a, b in zip(kf, kf[1:]):
                if a[0] <= t <= b[0]:
                    e = a[4] if len(a) > 4 else eios
                    p = e((t - a[0]) / (b[0] - a[0]))
                    z, cx, cy = lerp(a[1], b[1], p), lerp(a[2], b[2], p), lerp(a[3], b[3], p); break
        return z, cx, cy
    def frame(s, t, ez=1.0):
        z, cx, cy = s.view(t); z *= ez
        cx = clamp(cx, W / 2 / z, W - W / 2 / z); cy = clamp(cy, H / 2 / z, H - H / 2 / z)
        a = z / BIG
        M = np.float32([[a, 0, W / 2 - cx * z], [0, a, H / 2 - cy * z]])
        return cv2.warpAffine(s.big, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    def i2o(s, x, y, t):
        z, cx, cy = s.view(t)
        z2 = z; cx = clamp(cx, W / 2 / z2, W - W / 2 / z2); cy = clamp(cy, H / 2 / z2, H - H / 2 / z2)
        qx, qy = x * s.s0 - s.ox, y * s.s0 - s.oy
        return (qx - cx) * z + W / 2, (qy - cy) * z + H / 2, z

B = [4.30, 7.00, 10.33, 20.08, 23.25, 27.88]
TK = ['zoom', 'whip', 'flash', 'whipv', 'zoom', 'glitch']
TD = 0.2
fast = lambda x: eoc(x)
SC = [
    Scene('me_front.jpg', 0, 4.30, [(0, 1.16, 540, 820, fast), (0.7, 1.0, 540, 900), (4.6, 1.07, 540, 820)], fx=600, k=0.35),
    Scene('laptop.png', 4.30, 7.00, [(4.0, 1.04, 520, 960), (7.3, 1.17, 480, 900)], k=0.55),
    Scene('analytics.png', 7.00, 10.33, [(6.7, 1.04, 540, 960), (10.6, 1.22, 700, 1000)], k=0.55),
    Scene('phone_scroll.png', 10.33, 20.08, [(10.0, 1.12, 560, 1000), (12.85, 1.15, 580, 1010), (13.05, 1.22, 600, 1040, fast),
                                             (20.4, 1.12, 600, 1000)], k=0.55),
    Scene('tap.png', 20.08, 23.25, [(19.8, 1.14, 540, 980), (22.5, 1.02, 540, 960), (22.75, 1.08, 450, 1100, fast), (23.6, 1.1, 450, 1100)], k=0.5),
    Scene('me_side.jpg', 23.25, 27.88, [(23.0, 1.0, 540, 960), (23.5, 1.0, 540, 960), (23.8, 1.12, 520, 820, fast), (27.0, 1.16, 520, 800),
                                         (27.67, 1.16, 520, 800), (28.2, 1.3, 520, 760)], fx=700, k=0.35),
    Scene('me_front.jpg', 27.88, DUR, [(27.6, 1.28, 540, 760), (28.4, 1.17, 540, 780, fast), (DUR, 1.24, 540, 760)], fx=600, k=0.35),
]

def scene_idx(t):
    for i, b in enumerate(B):
        if t < b: return i
    return len(SC) - 1

def zoom_blur(img, s):
    if s < 0.02: return img
    acc = img.astype(np.float32); n = 1
    for j in range(1, 5):
        f = 1 + 0.022 * s * j
        M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, f)
        acc += cv2.warpAffine(img, M, (W, H), borderMode=cv2.BORDER_REFLECT); n += 1
    return (acc / n).astype(np.uint8)

def bg_at(t, fi):
    for i, b in enumerate(B):
        if abs(t - b) < TD:
            A, Bs = SC[i], SC[i + 1]; p = (t - (b - TD)) / (2 * TD); k = TK[i]
            if k == 'zoom':
                if p < 0.5:
                    q = p / 0.5; return zoom_blur(A.frame(t, 1 + 0.45 * eic(q)), eic(q))
                q = (p - 0.5) / 0.5; return zoom_blur(Bs.frame(t, 1.45 - 0.45 * eoc(q)), 1 - eoc(q))
            if k in ('whip', 'whipv'):
                fa, fb = A.frame(t), Bs.frame(t); e = eioc(p); sp = math.sin(math.pi * p)
                if k == 'whip':
                    off = int(W * e); cat = np.concatenate([fa, fb], 1); out = cat[:, off:off + W]
                    kk = int(1 + 160 * sp); out = cv2.blur(out, (kk, 1)) if kk > 1 else out
                else:
                    off = int(H * e); cat = np.concatenate([fa, fb], 0); out = cat[off:off + H]
                    kk = int(1 + 220 * sp); out = cv2.blur(out, (1, kk)) if kk > 1 else out
                return np.ascontiguousarray(out)
            if k == 'flash':
                fa, fb = A.frame(t).astype(np.float32), Bs.frame(t).astype(np.float32)
                c = eioc((p - 0.3) / 0.4); out = fa * (1 - c) + fb * c
                f = math.sin(math.pi * p) ** 2 * 0.85
                glow = np.array([200, 228, 255], np.float32)
                out = out + (glow - out) * f
                return np.clip(out, 0, 255).astype(np.uint8)
            if k == 'glitch':
                base = (A if p < 0.5 else Bs).frame(t)
                s = math.sin(math.pi * p); rng = np.random.default_rng(fi)
                out = base.copy(); sh = int(34 * s)
                out[..., 0] = np.roll(base[..., 0], sh, 1); out[..., 2] = np.roll(base[..., 2], -sh, 1)
                for _ in range(int(9 * s)):
                    y0 = rng.integers(0, H - 60); hh = rng.integers(12, 90); dx = int(rng.integers(-90, 90) * s)
                    out[y0:y0 + hh] = np.roll(out[y0:y0 + hh], dx, 1)
                f = s ** 3 * 0.45; out = out.astype(np.float32); out = out + (np.array([180, 215, 255]) - out) * f
                return np.clip(out, 0, 255).astype(np.uint8)
    return SC[scene_idx(t)].frame(t)

# ---------- elements ----------
class El:
    def __init__(s, spr, mask, x, y, t0, t1, anim='up', dur=0.4, exitdir=(0, -30), dyn=None, shake=None, blur=True):
        s.spr, s.mask, s.x, s.y, s.t0, s.t1, s.anim, s.dur, s.exitdir, s.dyn, s.shake, s.blur = \
            spr, mask, x, y, t0, t1, anim, dur, exitdir, dyn, shake, blur
    def state(s, t):
        if t < s.t0 or t > s.t1 + 0.32: return None
        p = prog(t, s.t0, s.dur); a = eoc(p * 1.6); sc = 1.0; dx = dy = 0
        if s.anim == 'up': dy = (1 - eoc(p)) * 70
        elif s.anim == 'right': dx = (1 - eoc(p)) * 260
        elif s.anim == 'left': dx = -(1 - eoc(p)) * 260
        elif s.anim == 'pop': sc = 0.55 + 0.45 * eob(p, 2.2)
        if t > s.t1:
            q = eic(prog(t, s.t1, 0.3)); a *= 1 - q; dx += s.exitdir[0] * q * 8; dy += s.exitdir[1] * q * 2
        if s.shake and s.shake[0] <= t <= s.shake[0] + 0.45:
            dx += math.sin((t - s.shake[0]) * 70) * 16 * (1 - (t - s.shake[0]) / 0.45)
        return a, sc, dx, dy

def backdrop(bg, mask, x, y, a):
    w, h = mask.size; x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    crop = bg[y0:y1, x0:x1]
    sm = cv2.resize(crop, (max(1, (x1 - x0) // 4), max(1, (y1 - y0) // 4)), interpolation=cv2.INTER_AREA)
    sm = cv2.GaussianBlur(sm, (0, 0), 5)
    bl = cv2.resize(sm, (x1 - x0, y1 - y0), interpolation=cv2.INTER_LINEAR).astype(np.float32)
    bl = bl * 0.8 + np.array([8, 20, 55], np.float32) * 0.2
    m = (np.asarray(mask)[y0 - y:y1 - y, x0 - x:x1 - x].astype(np.float32) / 255 * a)[..., None]
    bg[y0:y1, x0:x1] = (crop * (1 - m) + bl * m).astype(np.uint8)

ELS = []
def add(*a, **k): e = El(*a, **k); ELS.append(e); return e

# S1 enquiries chart card
c1, m1 = card(660, 236, 'Enquiries', None, ic='chart', tsize=36, ty=52)
rng = np.random.default_rng(3)
CH = [(i / 39, 0.18 + 0.66 * (i / 39) ** 1.35 + (rng.random() - .5) * 0.07) for i in range(40)]
def dyn_chart(spr, t):
    p = eoc(prog(t, 1.75, 1.7)); d = ImageDraw.Draw(spr); X0, Y0, Wc, Hc = PADS + 30, PADS + 96, 600, 118
    n = max(2, int(p * 39) + 1); pts = [(X0 + x * Wc, Y0 + y * Hc) for x, y in CH[:n]]
    fr = p * 39 - int(p * 39)
    if n < 40: a, b = CH[n - 1], CH[n]; pts[-1] = (X0 + lerp(a[0], b[0], fr) * Wc, Y0 + lerp(a[1], b[1], fr) * Hc)
    fill = Image.new('RGBA', spr.size, (0, 0, 0, 0)); fd = ImageDraw.Draw(fill)
    fd.polygon(pts + [(pts[-1][0], Y0 + Hc), (pts[0][0], Y0 + Hc)], fill=(79, 163, 255, 60)); spr.alpha_composite(fill)
    d.line(pts, fill=(120, 190, 255, 255), width=6, joint='curve')
    tx, ty = pts[-1]; pr = 9 + 4 * math.sin(t * 9)
    d.ellipse([tx - pr - 6, ty - pr - 6, tx + pr + 6, ty + pr + 6], fill=(255, 92, 112, 70))
    d.ellipse([tx - 9, ty - 9, tx + 9, ty + 9], fill=CORAL)
    q = eoc(prog(t, 3.2, 0.3))
    if q > 0:
        x, y = PADS + 660 - 40, PADS + 48
        d.polygon([(x - 34, y - 12), (x - 6, y - 12), (x - 20, y + 10)], fill=(255, 92, 112, int(255 * q)))
        d.text((x - 46, y), 'Falling', font=F('InterDisplay-Bold.otf', 30), fill=(255, 120, 135, int(255 * q)), anchor='rm')
add(c1, m1, 540 - 330 - PADS, 1110 - PADS, 1.60, 4.05, anim='right', dyn=dyn_chart, exitdir=(-20, 0))

# S2 design chip
c2, m2 = card(470, 92, 'Design looks great', ic='check', r=46, tsize=36)
add(c2, m2, 540 - 235 - PADS, 470 - PADS, 5.80, 6.95, anim='pop')

# S3 ring + chip
c3, m3 = card(500, 92, 'Enquiries flatlined', ic='chart', badge=None, r=46, tsize=36, icon_cols=(CORAL, (255, 150, 120)))
add(c3, m3, 540 - 250 - PADS, 560 - PADS, 9.05, 10.25, anim='pop')

# S4 chips + failure cards
c4a, m4a = card(440, 92, 'Looks beautiful', ic='check', r=46, tsize=36)
c4b, m4b = card(440, 92, '…but still fails', ic='x', r=46, tsize=36, icon_cols=(CORAL, (255, 150, 120)), border=(255, 92, 112, 160))
add(c4a, m4a, 540 - 220 - PADS, 430 - PADS, 11.50, 12.86, anim='pop', exitdir=(0, 0))
add(c4b, m4b, 540 - 220 - PADS, 430 - PADS, 12.90, 13.40, anim='pop', shake=(12.95,))
FAILS = [(13.64, 'Offer isn\'t clear', 'Visitors don\'t get what you sell', 'q'),
         (15.74, 'No clear next step', 'No obvious button or path', 'route'),
         (17.18, 'No trust signals', 'No reviews, proof or credibility', 'shield'),
         (18.52, 'No follow-up', 'Leads go cold and disappear', 'mail')]
for i, (t0, ti, su, ic) in enumerate(FAILS):
    c, m = card(900, 118, ti, su, ic=ic, badge='x', r=30, tsize=38)
    add(c, m, 90 - PADS, 250 + i * 134 - PADS, t0, 19.80 + i * 0.05, anim='right', exitdir=(-30, 0))

# S5 journey panel
c5, m5 = card(960, 220, '', None, r=36)
NODES = [(20.44, 'VISIT'), (21.10, 'UNDERSTAND'), (21.70, 'TRUST'), (22.45, 'ACTION')]
def dyn_path(spr, t):
    d = ImageDraw.Draw(spr); xs = [PADS + 130 + i * 233 for i in range(4)]; y = PADS + 82
    d.line([(xs[0], y), (xs[-1], y)], fill=(255, 255, 255, 50), width=5)
    p = prog(t, NODES[0][0], NODES[-1][0] - NODES[0][0])
    xe = lerp(xs[0], xs[-1], eioc(p))
    if p > 0: d.line([(xs[0], y), (xe, y)], fill=(110, 185, 255, 255), width=7)
    for i, (tn, lab) in enumerate(NODES):
        on = prog(t, tn, 0.25); last = i == 3; r = 38 if last else 30
        rr = r * (1 + 0.25 * math.sin(math.pi * on)) if on < 1 else r
        if on > 0:
            if last:
                g = 14 + 10 * (0.5 + 0.5 * math.sin(t * 8))
                d.ellipse([xs[i] - rr - g, y - rr - g, xs[i] + rr + g, y + rr + g], fill=(79, 163, 255, int(70 * on)))
            spr.alpha_composite(with_alpha(circle_img(int(rr * 2), ROYAL, SKY), on), (int(xs[i] - rr), int(y - rr)))
            if last: icon(spr, xs[i], y, int(rr * 1.2), 'check')
            else: d.text((xs[i], y), str(i + 1), font=F('InterDisplay-Black.otf', 30), fill=(255, 255, 255, int(255 * on)), anchor='mm')
        if on < 1:
            d.ellipse([xs[i] - r, y - r, xs[i] + r, y + r], outline=(255, 255, 255, int(110 * (1 - on))), width=4)
            if not last or on == 0:
                d.text((xs[i], y), str(i + 1), font=F('InterDisplay-Bold.otf', 28), fill=(255, 255, 255, int(120 * (1 - on))), anchor='mm')
        col = (255, 255, 255, 255) if on > 0 else (200, 215, 240, 130)
        d.text((xs[i], y + 66), lab, font=F('InterDisplay-Bold.otf', 26 if not last else 28), fill=col, anchor='mm')
add(c5, m5, 60 - PADS, 200 - PADS, 20.30, 23.10, anim='up', dyn=dyn_path)

# S6 notifications + empty state
n1, nm1 = card(900, 112, 'New enquiry', 'Website contact form · just now', ic='mail', r=30, tsize=36)
n2, nm2 = card(900, 112, 'Booking request', 'Services page · 2 min ago', ic='bell', r=30, tsize=36)
n3, nm3 = card(900, 112, '0 new enquiries', 'Looks good… but stays quiet', ic='mail', r=30, tsize=36,
               icon_cols=((70, 82, 110), (110, 122, 150)), tcol=(205, 214, 232), scol=(150, 165, 195), tint=(20, 26, 44, 170))
add(n1, nm1, 90 - PADS, 1112 - PADS, 25.00, 26.50, anim='right', exitdir=(40, 0))
add(n2, nm2, 90 - PADS, 1240 - PADS, 25.42, 26.55, anim='right', exitdir=(40, 0))
add(n3, nm3, 90 - PADS, 1176 - PADS, 26.80, 27.70, anim='pop')

# S7 comment box + offer badge
cb, cbm = card(920, 124, '', None, r=62)
def dyn_comment(spr, t):
    d = ImageDraw.Draw(spr); x0, y0 = PADS, PADS
    spr.alpha_composite(circle_img(80, ROYAL, SKY), (x0 + 24, y0 + 22)); icon(spr, x0 + 64, y0 + 62, 50, 'user')
    n = sum(1 for i in range(5) if t >= 28.40 + i * 0.1)
    tx = x0 + 128
    if n == 0:
        d.text((tx, y0 + 62), 'Add a comment…', font=F('Inter-Medium.otf', 36), fill=(190, 205, 235, 170), anchor='lm')
        cx = tx
    else:
        s = 'AUDIT'[:n]; f = F('InterDisplay-Black.otf', 52)
        d.text((tx, y0 + 64), s, font=f, fill=WHITE, anchor='lm'); cx = tx + f.getlength(s) + 6
    if (t * 2.2) % 1 < 0.6 and t < 29.2: d.rectangle([cx, y0 + 38, cx + 4, y0 + 88], fill=(120, 190, 255, 255))
    on = prog(t, 28.95, 0.25); bx = x0 + 920 - 24 - 76
    rr = 1 + 0.18 * math.sin(math.pi * on) if on < 1 else 1
    if on > 0:
        g = 10 + 6 * math.sin(t * 7); d.ellipse([bx - g, y0 + 24 - g, bx + 76 + g, y0 + 100 + g], fill=(79, 163, 255, int(60 * on)))
    sz = int(76 * rr); spr.alpha_composite(circle_img(sz, ROYAL if on > 0 else (40, 55, 95), SKY if on > 0 else (60, 75, 115)),
                                           (int(bx + 38 - sz / 2), int(y0 + 62 - sz / 2)))
    icon(spr, bx + 38, y0 + 62, 40, 'send')
add(cb, cbm, 80 - PADS, 1090 - PADS, 28.05, 31.60, anim='up', dyn=dyn_comment, exitdir=(0, 0))

ob, obm = card(920, 120, '', None, r=30, border=(120, 190, 255, 130))
def dyn_offer(spr, t):
    d = ImageDraw.Draw(spr); x0, y0 = PADS + 26, PADS
    d.rounded_rectangle([x0, y0 + 30, x0 + 132, y0 + 90], 30, fill=WHITE)
    d.text((x0 + 66, y0 + 60), 'FREE', font=F('InterDisplay-Black.otf', 32), fill=NAVY, anchor='mm')
    d.text((x0 + 160, y0 + 60), 'Business System & Website Audit', font=F('InterDisplay-Bold.otf', 34), fill=WHITE, anchor='lm')
    p = prog(t, 30.0, 0.9)
    if 0 < p < 1:
        sh = Image.new('L', spr.size, 0); sd = ImageDraw.Draw(sh); cx = lerp(-150, spr.size[0] + 150, eioc(p))
        sd.polygon([(cx - 40, 0), (cx + 40, 0), (cx - 20, spr.size[1]), (cx - 100, spr.size[1])], fill=110)
        sh = sh.filter(ImageFilter.GaussianBlur(14))
        sh = Image.fromarray(np.minimum(np.asarray(sh), np.asarray(spr.getchannel('A'))))
        wl = Image.new('RGBA', spr.size, (255, 255, 255, 255)); wl.putalpha(sh); spr.alpha_composite(wl)
add(ob, obm, 80 - PADS, 1238 - PADS, 29.45, 31.60, anim='up', dyn=dyn_offer, exitdir=(0, 0))

# ---------- dynamic full-frame draws ----------
def draw_ring(ov, t):
    if not 8.70 <= t <= 10.35: return
    S = SC[2]; cx, cy, z = S.i2o(795, 838, t); rx, ry = 250 * S.s0 * z / 1.0 * 0.95, 62 * S.s0 * z
    p = eioc(prog(t, 8.74, 0.6)); a = 1 - eic(prog(t, 10.0, 0.3))
    pad = 40; w, h = int(2 * rx + 2 * pad), int(2 * ry + 2 * pad)
    L = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    d.arc([pad * 2, pad * 2, w * 2 - pad * 2, h * 2 - pad * 2], -200, -200 + 360 * p, fill=(255, 110, 130, int(255 * a)), width=14)
    L = L.resize((w, h), Image.LANCZOS)
    glow = L.filter(ImageFilter.GaussianBlur(10)); paste(ov, glow, cx - w / 2, cy - h / 2); paste(ov, L, cx - w / 2, cy - h / 2)

def draw_ripple(ov, t):
    S = SC[4]
    for t0 in (22.56, 22.78):
        p = prog(t, t0, 0.8)
        if 0 < p < 1:
            cx, cy, z = S.i2o(390, 1000, t); r = 40 + 330 * eoc(p); a = (1 - p) ** 1.5
            w = int(2 * r + 40); L = Image.new('RGBA', (w, w), (0, 0, 0, 0))
            ImageDraw.Draw(L).ellipse([20, 20, w - 20, w - 20], outline=(140, 200, 255, int(230 * a)), width=7)
            paste(ov, L.filter(ImageFilter.GaussianBlur(1.5)), cx - w / 2, cy - w / 2)
    p = prog(t, 22.50, 0.7)
    if 0 < p < 1:
        cx, cy, z = S.i2o(390, 1000, t); a = math.sin(math.pi * p)
        w = 760; L = Image.new('RGBA', (w, 300), (0, 0, 0, 0)); ImageDraw.Draw(L).ellipse([60, 60, w - 60, 240], fill=(120, 190, 255, int(150 * a)))
        paste(ov, L.filter(ImageFilter.GaussianBlur(40)), cx - w / 2, cy - 150)

# ---------- global overlays ----------
def build_static():
    y = np.arange(H, dtype=np.float32)[:, None]
    bot = np.clip((y - 1100) / 820, 0, 1) ** 1.4 * 190
    top = np.clip((300 - y) / 300, 0, 1) ** 1.6 * 120
    a = np.broadcast_to(np.maximum(bot, top), (H, W))
    g = np.zeros((H, W, 4), np.uint8); g[..., 0], g[..., 1], g[..., 2] = 3, 8, 26; g[..., 3] = a.astype(np.uint8)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = ((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.72)) ** 2
    vig = np.clip(1 - 0.38 * v ** 1.3, 0.5, 1).astype(np.float32)[..., None]
    return Image.fromarray(g, 'RGBA'), vig
GRAD, VIG = build_static()
GRAIN = [np.random.default_rng(i).normal(0, 4.2, (H // 2, W // 2, 1)).astype(np.float32) for i in range(8)]
GRAIN = [cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)[..., None] for g in GRAIN]

def soft_dot(d, col):
    yy, xx = np.mgrid[0:d, 0:d].astype(np.float32); r = np.sqrt((xx - d / 2) ** 2 + (yy - d / 2) ** 2) / (d / 2)
    a = np.clip(1 - r, 0, 1) ** 1.8
    im = np.zeros((d, d, 4), np.uint8); im[..., :3] = col; im[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(im, 'RGBA')
prng = np.random.default_rng(7)
PART = [dict(x=prng.uniform(0, W), y=prng.uniform(0, H), v=prng.uniform(15, 55), d=int(prng.uniform(10, 46)),
             a=prng.uniform(0.10, 0.32), ph=prng.uniform(0, 6.28), sw=prng.uniform(10, 40)) for _ in range(26)]
for p in PART: p['spr'] = soft_dot(p['d'], (150, 200, 255))

def logo(size):
    S = size * 4; L = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    core = circle_img(int(S * .42), ROYAL, SKY); L.alpha_composite(core, (int(S * .29), int(S * .29)))
    ring = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([int(S * .04), int(S * .34), int(S * .96), int(S * .66)], outline=(200, 228, 255, 255), width=max(3, S // 22))
    ring = ring.rotate(28, resample=Image.BICUBIC)
    L.alpha_composite(ring)
    d = ImageDraw.Draw(L); d.ellipse([int(S * .80), int(S * .20), int(S * .92), int(S * .32)], fill=WHITE)
    return L.resize((size, size), Image.LANCZOS)
BRAND = Image.new('RGBA', (420, 80), (0, 0, 0, 0))
BRAND.alpha_composite(logo(62), (0, 9))
ImageDraw.Draw(BRAND).text((76, 40), 'O R B I R I S E', font=F('InterDisplay-Bold.otf', 30), fill=(235, 243, 255, 235), anchor='lm')
BIGLOGO = logo(260)

# ---------- captions ----------
CAPF = F('InterDisplay-Black.otf', 84)
CAP_Y = 1478
_wc = {}
def wsprite(txt, kw):
    k = (txt, kw)
    if k not in _wc: _wc[k] = text_sprite(txt, CAPF, (165, 212, 255) if kw else WHITE)
    return _wc[k]
_pc = {}
def pill(w, h):
    k = (w, h)
    if k not in _pc:
        g = grad(w, h, (66, 140, 255), (24, 78, 230)); g.putalpha(rr_mask(w, h, 24)); pad = 30
        im = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
        glow = Image.new('L', im.size, 0); ImageDraw.Draw(glow).rounded_rectangle([pad, pad, pad + w, pad + h], 24, fill=150)
        gl = Image.new('RGBA', im.size, (40, 110, 255, 255)); gl.putalpha(glow.filter(ImageFilter.GaussianBlur(16)))
        im.alpha_composite(gl); im.alpha_composite(g, (pad, pad)); _pc[k] = im
    return _pc[k]

def draw_captions(ov, t):
    for c in CHUNKS:
        if not (c['s'] <= t < c['e']): continue
        ws = c['words']; items = []
        for w in ws:
            txt = clean(w['w']).upper(); kw = clean(w['w']).lower().strip('?!') in KEY
            items.append((w, txt, kw))
        gap = 24; sprs = [wsprite(txt, kw) for _, txt, kw in items]
        widths = [s[1][2] - s[1][0] for s in sprs]
        total = sum(widths) + gap * (len(widths) - 1); x = W / 2 - total / 2
        ex = eic(prog(t, c['e'] - 0.16, 0.16)) if c['fade'] else 0; ca = 1 - ex; cdy = -26 * ex
        rects = []
        for (w, txt, kw), (spr, bb), ww in zip(items, sprs, widths):
            rects.append((x, ww)); x += ww + gap
        # active word pill
        act = None
        for i, (w, _, _) in enumerate(items):
            if t >= w['s'] - 0.02: act = i
        if act is not None:
            ph = 104; pt = prog(t, items[act][0]['s'] - 0.02, 0.13); e = eoc(pt)
            x1, w1 = rects[act]
            if act > 0: x0, w0 = rects[act - 1]; px, pw = lerp(x0, x1, e), lerp(w0, w1, e)
            else: px, pw = x1, w1;
            sc = eob(prog(t, items[0][0]['s'] - 0.02, 0.22)) if act == 0 else 1
            pw2, ph2 = int((pw + 36) * (0.7 + 0.3 * sc)), int(ph * (0.7 + 0.3 * sc))
            pl = with_alpha(pill(max(20, pw2), max(20, ph2)), ca * clamp(sc * 2))
            paste(ov, pl, px + pw / 2 - pw2 / 2 - 30, CAP_Y - ph2 / 2 - 30 + cdy + 2)
        for i, ((w, txt, kw), (spr, bb)) in enumerate(zip(items, sprs)):
            p = prog(t, w['s'] - 0.07, 0.24)
            if p <= 0: continue
            s = 0.6 + 0.4 * eob(p, 2.0); a = eoc(p * 1.5) * ca; dy = (1 - eoc(p)) * 34
            if i == act and kw: spr = wsprite(txt, False)[0]
            if abs(s - 1) > 0.005:
                spr = spr.resize((max(1, int(spr.size[0] * s)), max(1, int(spr.size[1] * s))), Image.BILINEAR)
            cx = rects[i][0] + rects[i][1] / 2
            paste(ov, with_alpha(spr, a), cx - spr.size[0] / 2, CAP_Y - spr.size[1] / 2 + dy + cdy)

# ---------- frame ----------
END0 = 31.80
def render(fi):
    t = fi / FPS
    bg = bg_at(t, fi)
    if t > END0: pass
    states = []
    for e in ELS:
        st = e.state(t)
        if st is None: continue
        a, sc, dx, dy = st
        spr = e.spr.copy() if e.dyn else e.spr
        if e.dyn: e.dyn(spr, t)
        mask = e.mask
        if abs(sc - 1) > 0.005:
            nw, nh = max(1, int(spr.size[0] * sc)), max(1, int(spr.size[1] * sc))
            spr = spr.resize((nw, nh), Image.BILINEAR); mask = mask.resize((nw, nh), Image.BILINEAR)
        x = e.x + (e.spr.size[0] - spr.size[0]) / 2 + dx; y = e.y + (e.spr.size[1] - spr.size[1]) / 2 + dy
        if e.blur: backdrop(bg, mask, x, y, a)
        states.append((spr, x, y, a))
    img = (bg.astype(np.float32) * VIG)
    ov = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')
    ov.alpha_composite(GRAD)
    for p in PART:
        y = (p['y'] - p['v'] * t) % (H + 60) - 30; x = p['x'] + math.sin(t * 0.6 + p['ph']) * p['sw']
        a = p['a'] * (0.6 + 0.4 * math.sin(t * 1.3 + p['ph']))
        paste(ov, with_alpha(p['spr'], a), x, y)
    draw_ring(ov, t); draw_ripple(ov, t)
    for spr, x, y, a in states: paste(ov, with_alpha(spr, a), x, y)
    draw_captions(ov, t)
    ba = 0.92 * (1 - prog(t, END0 - 0.1, 0.3)) * eoc(prog(t, 0.3, 0.6))
    if ba > 0: paste(ov, with_alpha(BRAND, ba), 56, 128)
    if t >= END0:  # end card
        q = eioc(prog(t, END0, 0.35))
        end = grad(W, H, (6, 16, 48), (2, 6, 20)); yy = np.asarray(end).copy()
        end = with_alpha(end, q); ov.alpha_composite(end)
        gl = soft_dot(900, (40, 110, 255)); ov.alpha_composite(with_alpha(gl, 0.55 * q), (90, 300))
        lp = prog(t, END0 + 0.15, 0.5); s = 0.5 + 0.5 * eob(lp, 2.0)
        if lp > 0:
            lg = BIGLOGO.rotate(-25 * eoc(lp) - (t - END0) * 6, resample=Image.BICUBIC)
            lg = lg.resize((int(260 * s), int(260 * s)), Image.BILINEAR)
            paste(ov, with_alpha(lg, eoc(lp * 1.5)), W / 2 - lg.size[0] / 2, 760 - lg.size[1] / 2)
        tp = prog(t, END0 + 0.35, 0.5)
        if tp > 0:
            ts, _ = text_sprite('O R B I R I S E', F('InterDisplay-Black.otf', 76), WHITE, shadow=0)
            paste(ov, with_alpha(ts, eoc(tp)), W / 2 - ts.size[0] / 2, 990 - ts.size[1] / 2 + (1 - eoc(tp)) * 40)
        tp2 = prog(t, END0 + 0.55, 0.5)
        if tp2 > 0:
            ts, _ = text_sprite('Comment “AUDIT” for your free audit', F('Inter-SemiBold.otf', 40), (165, 212, 255), shadow=0)
            paste(ov, with_alpha(ts, eoc(tp2)), W / 2 - ts.size[0] / 2, 1090 - ts.size[1] / 2 + (1 - eoc(tp2)) * 30)
    out = np.asarray(ov.convert('RGB')).astype(np.float32) + GRAIN[fi % 8]
    return np.clip(out, 0, 255).astype(np.uint8)

def worker(args):
    k, a, b = args
    path = os.path.join(ROOT, f'seg_{k}.mp4')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
                          '-x264-params', 'keyint=60', path], stdin=subprocess.PIPE)
    for fi in range(a, b): p.stdin.write(render(fi).tobytes())
    p.stdin.close(); p.wait(); return path

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        os.makedirs(os.path.join(ROOT, 'test'), exist_ok=True)
        for t in map(float, sys.argv[2:]):
            Image.fromarray(render(int(t * FPS))).save(os.path.join(ROOT, 'test', f't{t:05.2f}.jpg'), quality=88)
        sys.exit()
    json.dump(CHUNKS, open(os.path.join(ROOT, 'chunks.json'), 'w'), indent=0)
    n = 4; step = math.ceil(NF / n)
    with Pool(n) as pool: segs = pool.map(worker, [(k, k * step, min(NF, (k + 1) * step)) for k in range(n)])
    with open(os.path.join(ROOT, 'segs.txt'), 'w') as f:
        for s in segs: f.write(f"file '{s}'\n")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', os.path.join(ROOT, 'segs.txt'), '-c', 'copy',
                    os.path.join(ROOT, 'video_noaudio.mp4')], check=True)
    print('done')
