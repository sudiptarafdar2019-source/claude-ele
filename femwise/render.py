import numpy as np, cv2, json, math, sys, os, subprocess
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
DUR = 64.5
NF = int(round(DUR * FPS))
ROOT = os.path.dirname(os.path.abspath(__file__))
FD = os.path.join(ROOT, 'fonts') + '/'
_fc = {}
def F(name, size):
    k = (name, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(FD + name, size)
    return _fc[k]
SANS, SANSB, SANSX, SANSM = 'Poppins-700.ttf', 'Poppins-800.ttf', 'Poppins-900.ttf', 'Poppins-600.ttf'
SERIF, SERIFI = 'PlayfairDisplay-800.ttf', 'PlayfairDisplay-700i.ttf'

PLUM = (62, 18, 52); WINE = (128, 34, 86); ROSE = (234, 88, 138); PINK = (255, 146, 182); BLUSH = (255, 212, 226)
CREAM = (255, 248, 244); SAGE = (118, 168, 132); CORAL = (240, 84, 96); GOLD = (244, 196, 128); WHITE = (255, 255, 255)

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
WORDS = json.load(open(os.path.join(ROOT, 'words.json')))
KEY = {'pcos', 'roti', 'chawal', 'bilkul', 'nahi', 'favourite', 'carbs', 'rice', 'sach', 'combination', 'protein', 'dal',
       'paneer', 'eggs', 'curd', 'seasonal', 'vegetables', 'balanced', 'fibre-rich', 'crash', 'extreme', 'restrictions',
       'pcos-friendly', 'diet', 'femwise', 'health', 'breakfast', 'mistakes', 'matter', 'portion'}
def clean(t): return t.strip('.,!?‘’\'"')

# scene cuts sit inside speech pauses only
B = [3.85, 5.85, 11.55, 15.62, 17.90, 22.70, 26.56, 31.59, 36.60, 40.27, 43.50, 45.66, 51.43, 54.75, 59.62, 62.35]
END0 = B[-1]

PHRASES = """PCOS hai?|Toh kya roti|aur chawal khana|chhodna padega?|Bilkul nahi!|PCOS diagnose|hote hi|kitni girls|apni favourite|
Indian foods se|door ho jaati hain.|Koi bolta hai|carbs band karo,|koi bolta hai|rice mat khao.|But aakhir|sach kya hai?|
Sach toh yeh hai ki|PCOS mein|sirf kya|kha rahe ho nahi,|balki kya|combination mein|kha rahe ho|woh bhi|matter karta hai!|
Apni plate mein|protein add karo,|jaise dal,|paneer,|eggs ya curd!|Saath mein|seasonal vegetables|aur roti ya rice|ko balanced|
portion mein|include karo.|Aur haan,|fibre-rich foods|ko bhi apni|diet ka part banao.|Crash dieting nahi,|extreme restrictions|
bhi nahi,|focus karo|balanced eating par.|Ab chahiye aapko|PCOS-friendly|Indian diet ideas,|jo ghar ke|normal khane se|ban sakein?|
Comment karo|‘DIET’|Aur follow|Femwise Health,|because next reel|mein baat karenge|PCOS mein|breakfast ke liye|kya khana chahiye|
aur kaunsi|common mistakes|avoid karni hain!"""
def build_chunks():
    groups = [len(p.split()) for p in PHRASES.replace('\n', '').split('|')]
    assert sum(groups) == len(WORDS), (sum(groups), len(WORDS))
    res, i = [], 0
    for g in groups: res.append({'words': WORDS[i:i + g], 's': WORDS[i]['s'] - 0.10}); i += g
    for i, c in enumerate(res):
        last = c['words'][-1]['e']
        nxt = res[i + 1]['s'] if i + 1 < len(res) else last + 0.7
        c['e'] = min(nxt, last + 0.55)
        c['fade'] = (c['e'] - last) > 0.25
    return res
CHUNKS = build_chunks()

# ---------- drawing helpers ----------
def grad(w, h, c1, c2, horizontal=False, a1=255, a2=255):
    t = np.linspace(0, 1, w)[None, :, None] if horizontal else np.linspace(0, 1, h)[:, None, None]
    c1 = np.array(list(c1) + [a1], np.float32); c2 = np.array(list(c2) + [a2], np.float32)
    g = np.broadcast_to(c1 + (c2 - c1) * t, (h, w, 4)).copy()
    return Image.fromarray(g.astype(np.uint8), 'RGBA')

def rr_mask(w, h, r, ss=3):
    m = Image.new('L', (w * ss, h * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], r * ss, fill=255)
    return m.resize((w, h), Image.LANCZOS)

def circle_img(d, c1, c2):
    d = max(2, int(d)); g = grad(d, d, c1, c2)
    m = Image.new('L', (d * 3, d * 3), 0); ImageDraw.Draw(m).ellipse([0, 0, d * 3 - 1, d * 3 - 1], fill=255)
    g.putalpha(m.resize((d, d), Image.LANCZOS)); return g

def with_alpha(spr, a):
    if a >= 0.999: return spr
    arr = np.array(spr); arr[..., 3] = (arr[..., 3].astype(np.float32) * max(0, a)).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')

def paste(ov, spr, x, y):
    x, y = int(round(x)), int(round(y)); w, h = spr.size
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    ov.alpha_composite(spr.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))

def icon(img, cx, cy, s, kind, col=(255, 255, 255, 255)):
    ss = 4; S = int(s * ss); L = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    lw = max(2, int(S * 0.10))
    def P(x, y): return (x * S, y * S)
    if kind == 'check':
        d.line([P(.22, .52), P(.42, .72), P(.80, .30)], fill=col, width=lw, joint='curve')
    elif kind == 'x':
        d.line([P(.28, .28), P(.72, .72)], fill=col, width=lw); d.line([P(.72, .28), P(.28, .72)], fill=col, width=lw)
    elif kind == 'q':
        d.text(P(.5, .54), '?', font=F(SANSX, int(S * .8)), fill=col, anchor='mm')
    elif kind == 'plus':
        d.line([P(.5, .2), P(.5, .8)], fill=col, width=lw); d.line([P(.2, .5), P(.8, .5)], fill=col, width=lw)
    elif kind == 'heart':
        d.ellipse([P(.14, .2), P(.52, .58)], fill=col); d.ellipse([P(.48, .2), P(.86, .58)], fill=col)
        d.polygon([P(.155, .45), P(.845, .45), P(.5, .86)], fill=col)
    elif kind == 'doc':
        d.rounded_rectangle([P(.24, .14), P(.76, .86)], radius=S * .06, outline=col, width=lw)
        for yy in (.36, .50, .64): d.line([P(.34, yy), P(.66, yy)], fill=col, width=max(2, lw // 2))
    elif kind == 'leaf':
        d.chord([P(.18, .18), P(.98, .98)], 180, 270, fill=col); d.chord([P(.02, .02), P(.82, .82)], 0, 90, fill=col)
        d.line([P(.22, .78), P(.70, .30)], fill=(0, 0, 0, 0), width=max(2, lw // 2))
    elif kind == 'home':
        d.polygon([P(.5, .14), P(.88, .48), P(.12, .48)], fill=col); d.rectangle([P(.22, .46), P(.78, .84)], fill=col)
        d.rectangle([P(.42, .60), P(.58, .84)], fill=(0, 0, 0, 0))
    elif kind == 'sun':
        d.ellipse([P(.32, .32), P(.68, .68)], fill=col)
        for k in range(8):
            a = k * math.pi / 4; d.line([P(.5 + .26 * math.cos(a), .5 + .26 * math.sin(a)), P(.5 + .40 * math.cos(a), .5 + .40 * math.sin(a))], fill=col, width=max(2, lw // 1.4).__int__())
    elif kind == 'warn':
        d.polygon([P(.5, .12), P(.90, .84), P(.10, .84)], outline=col, width=lw)
        d.line([P(.5, .38), P(.5, .62)], fill=col, width=lw); d.ellipse([P(.45, .68), P(.55, .78)], fill=col)
    elif kind == 'user':
        d.ellipse([P(.34, .16), P(.66, .48)], fill=col); d.pieslice([P(.16, .54), P(.84, 1.2)], 180, 360, fill=col)
    elif kind == 'send':
        d.polygon([P(.2, .2), P(.84, .5), P(.2, .8), P(.32, .5)], fill=col)
    elif kind == 'play':
        d.polygon([P(.34, .22), P(.80, .5), P(.34, .78)], fill=col)
    L = L.resize((max(1, int(s)), max(1, int(s))), Image.LANCZOS)
    img.alpha_composite(L, (int(cx - s / 2), int(cy - s / 2)))

PADS = 44
def shadowed(body, mask, r, sh_a=120, blur=18, oy=12):
    w, h = body.size; p = PADS
    im = Image.new('RGBA', (w + 2 * p, h + 2 * p), (0, 0, 0, 0))
    sh = Image.new('L', im.size, 0); sh.paste(Image.fromarray((np.asarray(mask) * (sh_a / 255)).astype(np.uint8)), (p, p + oy))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    shadow = Image.new('RGBA', im.size, (40, 6, 30, 255)); shadow.putalpha(sh); im.alpha_composite(shadow)
    im.alpha_composite(body, (p, p))
    m2 = Image.new('L', im.size, 0); m2.paste(mask, (p, p))
    return im, m2

def chip(text, ic=None, style='cream', size=40, h=96, r=None, font=SANS, icol=None, pad_x=34, minw=0):
    f = F(font, size); tw = int(f.getlength(text))
    d = h - 26 if ic else 0
    w = max(minw, pad_x + (d + 18 if ic else 0) + tw + pad_x)
    r = h // 2 if r is None else r
    if style == 'cream':
        body = grad(w, h, (255, 250, 247), (255, 238, 243), a1=242, a2=242); tcol = PLUM
        icol = icol or (ROSE, PINK)
    elif style == 'rose':
        body = grad(w, h, (246, 104, 152), (214, 62, 118), horizontal=True); tcol = WHITE
        icol = icol or ((255, 255, 255), (255, 225, 235))
    elif style == 'plum':
        body = grad(w, h, (92, 28, 76), (60, 16, 50), a1=235, a2=235); tcol = WHITE
        icol = icol or (ROSE, PINK)
    elif style == 'sage':
        body = grad(w, h, (134, 186, 148), (98, 152, 116), horizontal=True); tcol = WHITE
        icol = icol or ((255, 255, 255), (235, 255, 240))
    m = rr_mask(w, h, r)
    a = np.asarray(body.getchannel('A')).astype(np.float32) * (np.asarray(m) / 255)
    body.putalpha(Image.fromarray(a.astype(np.uint8)))
    hl = grad(w, h // 2, (255, 255, 255), (255, 255, 255), a1=60, a2=0)
    hm = Image.fromarray((np.asarray(m)[:h // 2].astype(np.float32) * (np.asarray(hl.getchannel('A')) / 255)).astype(np.uint8))
    hl.putalpha(hm); body.alpha_composite(hl)
    bd = Image.new('RGBA', (w * 3, h * 3), (0, 0, 0, 0))
    ImageDraw.Draw(bd).rounded_rectangle([1, 1, w * 3 - 2, h * 3 - 2], r * 3, outline=(255, 255, 255, 150), width=4)
    body.alpha_composite(bd.resize((w, h), Image.LANCZOS))
    x = pad_x
    if ic:
        ccol = icol
        cimg = circle_img(d, *ccol); body.alpha_composite(cimg, (x - 12, (h - d) // 2))
        icon(body, x - 12 + d / 2, h / 2, d * .6, ic, col=(255, 255, 255, 255) if style != 'rose' and style != 'sage' else (*ROSE, 255) if style == 'rose' else (*SAGE, 255))
        x += d + 6
    ImageDraw.Draw(body).text((x, h / 2 + 2), text, font=f, fill=tcol, anchor='lm')
    return shadowed(body, m, r)

def text_sprite(txt, font, fill, shadow=150, blur=10, oy=5, pad=40, stroke=0, stroke_fill=None):
    bb = font.getbbox(txt, stroke_width=stroke)
    w, h = bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if shadow:
        s = Image.new('L', (w, h), 0); ImageDraw.Draw(s).text((pad - bb[0], pad - bb[1] + oy), txt, font=font, fill=shadow, stroke_width=stroke)
        s = s.filter(ImageFilter.GaussianBlur(blur))
        sl = Image.new('RGBA', (w, h), (36, 4, 26, 255)); sl.putalpha(s); im.alpha_composite(sl)
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), txt, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    return im, (pad, pad, w - pad, h - pad)

def grad_text(txt, font, c1, c2, shadow=160, pad=50, stroke=0):
    bb = font.getbbox(txt, stroke_width=stroke)
    w, h = bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).text((pad - bb[0], pad - bb[1]), txt, font=font, fill=255, stroke_width=stroke)
    g = grad(w, h, c1, c2); g.putalpha(m)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if shadow:
        s = m.filter(ImageFilter.GaussianBlur(12)); s = Image.fromarray((np.asarray(s) * shadow / 255).astype(np.uint8))
        sl = Image.new('RGBA', (w, h), (40, 4, 28, 255)); sl.putalpha(s); im.alpha_composite(sl, (0, 6))
    im.alpha_composite(g); return im

# ---------- scenes / images ----------
BIG = 1.25
def grade(a, k):
    lum = (a @ np.array([.299, .587, .114], np.float32))[..., None]
    b = a * np.array([1.04, 0.995, 0.965], np.float32)            # warm
    sh = (1 - lum) ** 2.4
    b = b * (1 - 0.22 * sh) + sh * 0.22 * np.array([0.20, 0.07, 0.15], np.float32)  # plum shadows
    hi = lum ** 3
    b = b + hi * 0.05 * np.array([1.0, 0.86, 0.84], np.float32)  # rosy highlights
    b = np.clip(b, 0, 1); b = b * b * (3 - 2 * b) * 0.22 + b * 0.78  # gentle contrast
    sat = lum + (b - lum) * 1.04
    return np.clip(a * (1 - k) + sat * k, 0, 1)

def make_cover(path, k=0.7):
    im = Image.open(os.path.join(ROOT, 'img', path)).convert('RGB'); iw, ih = im.size
    s0 = max(W / iw, H / ih); cw, ch = iw * s0, ih * s0
    ox = (cw - W) / 2; oy = (ch - H) / 2
    big = im.resize((round(cw * BIG), round(ch * BIG)), Image.LANCZOS)
    big = big.crop((round(ox * BIG), round(oy * BIG), round(ox * BIG) + round(W * BIG), round(oy * BIG) + round(H * BIG)))
    a = np.asarray(big).astype(np.float32) / 255
    a = grade(a, k)
    bl = cv2.GaussianBlur(a, (0, 0), 1.4); a = np.clip(a + (a - bl) * 0.35, 0, 1)
    # soft bloom
    glow = cv2.GaussianBlur(np.clip(a - 0.72, 0, 1), (0, 0), 22); a = np.clip(a + glow * 0.45, 0, 1)
    return (a * 255).astype(np.uint8), s0, ox, oy

class Scene:
    def __init__(s, img, t0, t1, kf, k=0.7):
        s.img = img; s.t0, s.t1, s.kf, s.k = t0, t1, kf, k; s.big = None
    def load(s):
        if s.big is None: s.big, s.s0, s.ox, s.oy = make_cover(s.img, s.k)
    def view(s, t):
        kf = s.kf
        if t <= kf[0][0]: return kf[0][1:4]
        if t >= kf[-1][0]: return kf[-1][1:4]
        for a, b in zip(kf, kf[1:]):
            if a[0] <= t <= b[0]:
                e = a[4] if len(a) > 4 else eios
                p = e((t - a[0]) / (b[0] - a[0]))
                return lerp(a[1], b[1], p), lerp(a[2], b[2], p), lerp(a[3], b[3], p)
    def frame(s, t, ez=1.0, dx=0, dy=0):
        s.load(); z, cx, cy = s.view(t); z *= ez
        cx = clamp(cx, W / 2 / z, W - W / 2 / z); cy = clamp(cy, H / 2 / z, H - H / 2 / z)
        a = z / BIG
        M = np.float32([[a, 0, W / 2 - cx * z + dx], [0, a, H / 2 - cy * z + dy]])
        return cv2.warpAffine(s.big, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    def i2o(s, x, y, t):  # source-image px -> output px
        s.load(); z, cx, cy = s.view(t)
        cx = clamp(cx, W / 2 / z, W - W / 2 / z); cy = clamp(cy, H / 2 / z, H - H / 2 / z)
        qx, qy = x * s.s0 - s.ox, y * s.s0 - s.oy
        return (qx - cx) * z + W / 2, (qy - cy) * z + H / 2

fast = eoc
def push(t0, t1, z0, z1, x0=540, y0=960, x1=None, y1=None):
    return [(t0 - 0.3, z0, x0, y0), (t1 + 0.3, z1, x0 if x1 is None else x1, y0 if y1 is None else y1)]
SC = [
    Scene('s01_worried.png', 0, B[0], [(0, 1.20, 540, 720, fast), (0.6, 1.06, 540, 800), (2.9, 1.10, 540, 790), (3.15, 1.18, 540, 760, fast), (4.2, 1.20, 540, 760)]),
    Scene('s02_smile.png', B[0], B[1], [(3.6, 1.02, 540, 900), (4.42, 1.04, 540, 880), (4.62, 1.14, 520, 760, fast), (6.1, 1.18, 520, 740)]),
    Scene('s03_report.png', B[1], B[2], push(B[1], B[2], 1.04, 1.18, 540, 900, 520, 820)),
    Scene('s04_advice.png', B[2], B[3], [(11.3, 1.02, 540, 940), (12.4, 1.06, 520, 920), (12.6, 1.12, 500, 880, fast), (14.4, 1.14, 520, 880), (14.6, 1.20, 560, 860, fast), (15.9, 1.22, 560, 860)]),
    Scene('s05_think.png', B[3], B[4], push(B[3], B[4], 1.06, 1.20, 540, 900, 560, 860)),
    Scene('s06_nutri.png', B[4], B[5], push(B[4], B[5], 1.03, 1.16, 520, 980, 560, 940)),
    Scene('s07_combo.png', B[5], B[6], push(B[5], B[6], 1.18, 1.04, 600, 1100, 540, 980)),
    Scene('s08_protein.png', B[6], B[7], push(B[6], B[7], 1.02, 1.10, 540, 960, 540, 940)),
    Scene('s09_thali.png', B[7], B[8], [(31.3, 1.16, 540, 980), (36.9, 1.02, 540, 960)]),
    Scene('s10_fibre.png', B[8], B[9], push(B[8], B[9], 1.02, 1.12, 540, 960, 520, 900)),
    Scene('s11_nocrash.png', B[9], B[10], [(40.0, 1.04, 540, 960), (41.8, 1.08, 540, 960), (42.0, 1.14, 560, 980, fast), (43.8, 1.16, 560, 980)]),
    Scene('s12_eating.png', B[10], B[11], push(B[10], B[11], 1.16, 1.06, 560, 900, 540, 920)),
    Scene('s13_kitchen.png', B[11], B[12], push(B[11], B[12], 1.04, 1.16, 540, 940, 600, 900)),
    Scene('s14_phone.png', B[12], B[13], push(B[12], B[13], 1.04, 1.14, 540, 960, 600, 1000)),
    Scene('s15_breakfast.png', B[13], B[14], push(B[13], B[14], 1.14, 1.02, 540, 1000, 540, 960)),
    Scene('s16_mistake.png', B[14], B[15], push(B[14], B[15], 1.04, 1.16, 540, 900, 520, 820)),
]
TK = ['flash', 'zoom', 'whip', 'zoom', 'leak', 'slide', 'whip', 'flash', 'zoom', 'whipv', 'flash', 'slide', 'zoom', 'leak', 'whip', 'end']
TD = 0.22

def scene_idx(t):
    for i, b in enumerate(B):
        if t < b: return i
    return len(SC) - 1

def zoom_blur(img, s):
    if s < 0.02: return img
    acc = img.astype(np.float32); n = 1
    for j in range(1, 5):
        M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, 1 + 0.02 * s * j)
        acc += cv2.warpAffine(img, M, (W, H), borderMode=cv2.BORDER_REFLECT); n += 1
    return (acc / n).astype(np.uint8)

LEAK = None
def leak_layer(t, strength):
    yy, xx = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32)
    out = np.zeros((H // 4, W // 4, 3), np.float32)
    for cx, cy, r, col in ((0.15 + 0.5 * math.sin(t * 1.7), 0.3, 0.55, (255, 170, 120)),
                           (0.9 - 0.3 * math.cos(t * 1.3), 0.65, 0.5, (255, 120, 170)),
                           (0.5, 0.1 + 0.2 * math.sin(t), 0.4, (255, 220, 170))):
        d = ((xx / (W / 4) - cx) ** 2 + (yy / (H / 4) - cy) ** 2) / r ** 2
        out += np.exp(-d * 2.2)[..., None] * np.array(col, np.float32)
    out = cv2.resize(out, (W, H), interpolation=cv2.INTER_LINEAR)
    return out * strength

def bg_at(t, fi):
    for i, b in enumerate(B[:-1]):
        if abs(t - b) < TD:
            A, Bs = SC[i], SC[i + 1]; p = (t - (b - TD)) / (2 * TD); k = TK[i]
            if k == 'zoom':
                if p < 0.5:
                    q = p / 0.5; return zoom_blur(A.frame(t, 1 + 0.4 * eic(q)), eic(q))
                q = (p - 0.5) / 0.5; return zoom_blur(Bs.frame(t, 1.4 - 0.4 * eoc(q)), 1 - eoc(q))
            if k in ('whip', 'whipv'):
                fa, fb = A.frame(t), Bs.frame(t); e = eioc(p); sp = math.sin(math.pi * p)
                if k == 'whip':
                    off = int(W * e); cat = np.concatenate([fa, fb], 1); out = cat[:, off:off + W]
                    kk = int(1 + 150 * sp); out = cv2.blur(out, (kk, 1)) if kk > 1 else out
                else:
                    off = int(H * e); cat = np.concatenate([fa, fb], 0); out = cat[off:off + H]
                    kk = int(1 + 200 * sp); out = cv2.blur(out, (1, kk)) if kk > 1 else out
                return np.ascontiguousarray(out)
            if k == 'slide':
                e = eioc(p); fa = A.frame(t, 1 + 0.08 * e); fb = Bs.frame(t, 1.08 - 0.08 * e)
                out = fa.copy(); yb = int(H * (1 - e))
                out[yb:] = fb[:H - yb]
                if 0 < yb < H:
                    out[max(0, yb - 40):yb] = (out[max(0, yb - 40):yb].astype(np.float32) * 0.7).astype(np.uint8)
                kk = int(1 + 90 * math.sin(math.pi * p)); out = cv2.blur(out, (1, kk)) if kk > 1 else out
                return out
            if k in ('flash', 'leak'):
                fa, fb = A.frame(t).astype(np.float32), Bs.frame(t).astype(np.float32)
                c = eioc((p - 0.3) / 0.4); out = fa * (1 - c) + fb * c
                f = math.sin(math.pi * p) ** 2
                if k == 'flash':
                    glow = np.array([255, 236, 236], np.float32); out = out + (glow - out) * f * 0.8
                else:
                    out = 255 - (255 - out) * (1 - np.clip(leak_layer(t, f * 1.1) / 255, 0, 1))
                return np.clip(out, 0, 255).astype(np.uint8)
    return SC[scene_idx(t)].frame(t)

# ---------- elements ----------
class El:
    def __init__(s, spr, mask, x, y, t0, t1, anim='up', dur=0.45, exitdir=(0, -30), dyn=None, shake=None, blur=True, rot=0):
        s.spr, s.mask, s.x, s.y, s.t0, s.t1, s.anim, s.dur, s.exitdir, s.dyn, s.shake, s.blur, s.rot = \
            spr, mask, x, y, t0, t1, anim, dur, exitdir, dyn, shake, blur, rot
    def state(s, t):
        if t < s.t0 or t > s.t1 + 0.3: return None
        p = prog(t, s.t0, s.dur); a = eoc(p * 1.7); sc = 1.0; dx = dy = 0
        if s.anim == 'up': dy = (1 - eoc(p)) * 60; sc = 0.94 + 0.06 * eoc(p)
        elif s.anim == 'right': dx = (1 - eoc(p)) * 240
        elif s.anim == 'left': dx = -(1 - eoc(p)) * 240
        elif s.anim == 'pop': sc = 0.5 + 0.5 * eob(p, 2.4)
        elif s.anim == 'stamp': sc = 1.8 - 0.8 * eoc(p); a = eoc(p * 3)
        elif s.anim == 'none': a = 1
        if t > s.t1:
            q = eic(prog(t, s.t1, 0.28)); a *= 1 - q; dx += s.exitdir[0] * q * 8; dy += s.exitdir[1] * q * 2; sc *= 1 - 0.06 * q
        if s.shake and s.shake <= t <= s.shake + 0.45:
            dx += math.sin((t - s.shake) * 70) * 14 * (1 - (t - s.shake) / 0.45)
        return a, sc, dx, dy

def backdrop(bg, mask, x, y, a):
    w, h = mask.size; x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return
    crop = bg[y0:y1, x0:x1]
    sm = cv2.resize(crop, (max(1, (x1 - x0) // 4), max(1, (y1 - y0) // 4)), interpolation=cv2.INTER_AREA)
    sm = cv2.GaussianBlur(sm, (0, 0), 5)
    bl = cv2.resize(sm, (x1 - x0, y1 - y0), interpolation=cv2.INTER_LINEAR).astype(np.float32)
    m = (np.asarray(mask)[y0 - y:y1 - y, x0 - x:x1 - x].astype(np.float32) / 255 * a)[..., None]
    bg[y0:y1, x0:x1] = (crop * (1 - m) + bl * m).astype(np.uint8)

ELS = []
def add(*a, **k): e = El(*a, **k); ELS.append(e); return e
def addc(c, cx, cy, t0, t1, **k):  # centre-anchored chip
    spr, m = c; return add(spr, m, cx - spr.size[0] / 2, cy - spr.size[1] / 2, t0, t1, **k)
def plain(spr):
    return spr, Image.new('L', spr.size, 0)

def strike(t0, w_frac=1.0, col=CORAL, lw=8):
    def f(spr, t):
        p = eioc(prog(t, t0, 0.28))
        if p <= 0: return
        d = ImageDraw.Draw(spr); w, h = spr.size
        x0, x1 = PADS + 20, w - PADS - 20; y = h / 2 + 2
        d.line([(x0, y), (lerp(x0, x1, p * w_frac), y)], fill=(*col, 255), width=lw)
    return f

# S0 hook: "PCOS hai?" + roti/chawal question chips that get struck
hook = grad_text('PCOS hai?', F(SERIFI, 132), (255, 255, 255), (255, 214, 228))
add(*plain(hook), W / 2 - hook.size[0] / 2, 1060, 0.05, 3.70, anim='pop', dur=0.5, blur=False)
for i, (lab, t0) in enumerate((('Roti', 1.70), ('Chawal', 2.32))):
    c = chip(lab + '?', ic='q', style='cream', size=44, h=100)
    e = addc(c, 330 + i * 420, 1290, t0, 3.70, anim='pop')
    e.dyn = strike(2.94 + i * 0.14)

# S1 "BILKUL NAHI!" stamp
st_txt = grad_text('BILKUL NAHI!', F(SANSX, 112), (255, 134, 172), (220, 52, 112), stroke=0)
stamp = Image.new('RGBA', (st_txt.size[0] + 60, st_txt.size[1] + 60), (0, 0, 0, 0))
stamp.alpha_composite(st_txt, (30, 30)); stamp = stamp.rotate(-5, resample=Image.BICUBIC, expand=False)
add(*plain(stamp), W / 2 - stamp.size[0] / 2, 930, 4.40, 5.70, anim='stamp', dur=0.22, blur=False)
for i, lab in enumerate(('Roti', 'Chawal')):
    addc(chip(lab, ic='check', style='sage', size=40, h=92), 360 + i * 380, 1240, 4.95 + i * 0.12, 5.70, anim='pop')

# S2 diagnosis + favourite foods drifting away
addc(chip('PCOS diagnosed', ic='doc', style='plum', size=40, h=96), 690, 1060, 6.25, 11.30, anim='right', exitdir=(30, 0))
fav = chip('Favourite Indian food', ic='heart', style='cream', size=40, h=96)
fe = addc(fav, 470, 1210, 9.10, 10.70, anim='left', exitdir=(60, 0))
def drift(spr, t): pass

# S3 advice bubbles
def bubble(text, tail='left', style='cream'):
    spr, m = chip(text, style=style, size=42, h=104, font=SANSB)
    d = ImageDraw.Draw(spr); w, h = spr.size; col = (255, 244, 246, 242) if style == 'cream' else (210, 60, 115, 255)
    if tail == 'left': d.polygon([(PADS + 50, h - PADS - 6), (PADS + 30, h - PADS + 30), (PADS + 100, h - PADS - 6)], fill=col)
    else: d.polygon([(w - PADS - 50, h - PADS - 6), (w - PADS - 30, h - PADS + 30), (w - PADS - 100, h - PADS - 6)], fill=col)
    return spr, m
addc(bubble('“Carbs band karo!”', 'left', 'rose'), 300, 250, 12.38, 15.40, anim='pop', exitdir=(-20, 0))
addc(bubble('“Rice mat khao!”', 'right', 'rose'), 770, 400, 14.40, 15.40, anim='pop', exitdir=(20, 0))

# S4 the question
q1 = grad_text('Aakhir', F(SERIFI, 92), (255, 255, 255), (255, 226, 236))
q2 = grad_text('sach kya hai?', F(SERIF, 112), (255, 170, 198), (236, 84, 140))
add(*plain(q1), W / 2 - q1.size[0] / 2, 1020, 16.04, 17.75, anim='up', blur=False)
add(*plain(q2), W / 2 - q2.size[0] / 2, 1130, 16.62, 17.75, anim='pop', blur=False)

# S5 nutritionist: not only WHAT
n1 = chip('Sirf “kya” khaate ho', ic='q', style='cream', size=42, h=100)
e = addc(n1, W / 2, 300, 20.86, 22.55, anim='up'); e.dyn = strike(22.18, col=CORAL, lw=9)
addc(chip('Truth', ic='check', style='rose', size=34, h=80), W / 2, 180, 18.34, 22.55, anim='pop')

# S6 combination
c6 = grad_text('Combination', F(SERIFI, 112), (255, 255, 255), (255, 206, 222))
add(*plain(c6), W / 2 - c6.size[0] / 2, 190, 23.48, 26.40, anim='pop', blur=False)
for i, (lab, sty, t0) in enumerate((('Carbs', 'cream', 24.38), ('Protein', 'rose', 24.88), ('Fibre', 'sage', 25.40))):
    addc(chip(lab, style=sty, size=38, h=88, font=SANSB), 200 + i * 340, 440, t0, 26.40, anim='pop')
PLUSES = [(370, 440, 24.80), (710, 440, 25.30)]
def draw_plus(ov, t):
    for x, y, t0 in PLUSES:
        if t0 <= t <= 26.7:
            a = eoc(prog(t, t0, 0.25)) * (1 - eic(prog(t, 26.40, 0.28)))
            L = Image.new('RGBA', (60, 60), (0, 0, 0, 0)); icon(L, 30, 30, 48, 'plus')
            paste(ov, with_alpha(L, a), x - 30, y - 30)

# S7 protein labels on bowls
hdr = chip('+ PROTEIN', style='rose', size=48, h=110, font=SANSX)
addc(hdr, W / 2, 905, 27.52, 31.40, anim='pop')
PROT = [('Dal', 29.06, 262, 430), ('Paneer', 29.76, 760, 470), ('Eggs', 30.46, 300, 950), ('Curd', 30.90, 720, 960)]
PCH = {lab: chip(lab, style='cream', size=40, h=90, font=SANSB) for lab, *_ in PROT}

# S8 thali labels + portion bar
THL = [('Seasonal sabzi', 32.12, 210, 720, 'leaf', 'sage'), ('Roti / Rice', 33.58, 600, 1120, None, 'cream'), ('Dal · Paneer', 34.10, 840, 520, None, 'rose')]
TCH = {lab: chip(lab, ic=ic, style=sty, size=36, h=84, font=SANSB) for lab, _, _, _, ic, sty in THL}
pb, pbm = chip('', style='cream', size=10, h=150, r=36, minw=920)
def dyn_portion(spr, t):
    d = ImageDraw.Draw(spr); x0, y0 = PADS + 36, PADS + 22
    d.text((x0, y0 + 14), 'BALANCED PLATE', font=F(SANSX, 30), fill=PLUM, anchor='lm')
    segs = [(0.5, SAGE, '½ Sabzi'), (0.25, ROSE, '¼ Protein'), (0.25, GOLD, '¼ Roti/Rice')]
    wbar = 848; x = x0; p = eoc(prog(t, 34.70, 0.9))
    for i, (fr, col, lab) in enumerate(segs):
        q = clamp(p * 3 - i); ww = wbar * fr * q
        if ww > 4: d.rounded_rectangle([x, y0 + 46, x + ww - 6, y0 + 80], 12, fill=(*col, 255))
        if q > 0.6: d.text((x + 8, y0 + 100), lab, font=F(SANS, 26), fill=(*PLUM, int(255 * clamp((q - .6) / .4))), anchor='lm')
        x += wbar * fr
add(pb, pbm, W / 2 - pb.size[0] / 2, 120 - PADS, 34.62, 36.40, anim='up', dyn=dyn_portion)

# S9 fibre
fh = chip('FIBRE-RICH FOODS', ic='leaf', style='sage', size=42, h=104, font=SANSX)
addc(fh, W / 2, 760, 37.44, 40.10, anim='pop')
FIB = [('Sprouts', 37.95, 200, 250), ('Rajma · Chana', 38.25, 560, 520), ('Oats', 38.55, 880, 500), ('Fruits', 38.85, 230, 790), ('Millets', 39.15, 400, 1040)]
FCH = {lab: chip(lab, style='cream', size=36, h=82, font=SANSB) for lab, *_ in FIB}

# S10 no crash / extreme
addc(chip('Crash dieting', ic='x', style='cream', size=44, h=104, icol=(CORAL, (255, 140, 140))), W / 2, 200, 40.38, 43.30, anim='right', exitdir=(-30, 0), shake=40.9)
addc(chip('Extreme restrictions', ic='x', style='cream', size=44, h=104, icol=(CORAL, (255, 140, 140))), W / 2, 340, 41.78, 43.30, anim='left', exitdir=(-30, 0), shake=42.3)
EXL = [(40.38, 200, 40.9), (41.78, 340, 42.3)]

# S11 balanced eating
be = chip('Balanced eating', ic='check', style='rose', size=50, h=118, font=SANSX)
addc(be, W / 2, 230, 44.36, 45.55, anim='pop')

# S12 kitchen ideas
addc(chip('PCOS-friendly Indian diet ideas', style='plum', size=38, h=96, font=SANSB), W / 2, 200, 46.86, 51.20, anim='up')
addc(chip('Ghar ka normal khana', ic='home', style='cream', size=40, h=96), W / 2, 330, 49.68, 51.20, anim='pop')

# S13 comment + follow
cb, cbm = chip('', style='cream', size=10, h=124, r=62, minw=920)
def dyn_comment(spr, t):
    d = ImageDraw.Draw(spr); x0, y0 = PADS, PADS
    spr.alpha_composite(circle_img(80, ROSE, PINK), (x0 + 24, y0 + 22)); icon(spr, x0 + 64, y0 + 62, 50, 'user')
    tx = x0 + 128; n = sum(1 for i in range(4) if t >= 52.30 + i * 0.09)
    if n == 0:
        d.text((tx, y0 + 62), 'Add a comment…', font=F(SANSM, 34), fill=(140, 96, 124, 200), anchor='lm'); cx = tx
    else:
        s = 'DIET'[:n]; f = F(SANSX, 52); d.text((tx, y0 + 64), s, font=f, fill=PLUM, anchor='lm'); cx = tx + f.getlength(s) + 6
    if (t * 2.2) % 1 < 0.6 and t < 52.9: d.rectangle([cx, y0 + 38, cx + 4, y0 + 88], fill=(*ROSE, 255))
    on = prog(t, 52.75, 0.25); bx = x0 + 920 - 24 - 76
    rr = 1 + 0.18 * math.sin(math.pi * on) if on < 1 else 1
    sz = int(76 * rr)
    spr.alpha_composite(circle_img(sz, ROSE if on > 0 else (210, 190, 200), PINK if on > 0 else (225, 210, 218)), (int(bx + 38 - sz / 2), int(y0 + 62 - sz / 2)))
    icon(spr, bx + 38, y0 + 62, 40, 'send')
add(cb, cbm, 80 - PADS, 1120 - PADS, 51.58, 54.60, anim='up', dyn=dyn_comment, exitdir=(0, 0))
fb, fbm = chip('', style='rose', size=10, h=112, r=56, minw=920)
def dyn_follow(spr, t):
    d = ImageDraw.Draw(spr); x0, y0 = PADS, PADS
    spr.alpha_composite(logo(84, white=True), (x0 + 20, y0 + 14))
    d.text((x0 + 124, y0 + 56), 'Femwise Health', font=F(SANSX, 40), fill=WHITE, anchor='lm')
    on = prog(t, 53.95, 0.3); bw = 220; bx = x0 + 920 - 24 - bw
    col = (255, 255, 255, 255)
    d.rounded_rectangle([bx, y0 + 22, bx + bw, y0 + 90], 34, fill=col)
    lab = 'Following' if on >= 0.5 else 'Follow'
    d.text((bx + bw / 2, y0 + 56), lab, font=F(SANSX, 32), fill=ROSE if on < 0.5 else SAGE, anchor='mm')
add(fb, fbm, 80 - PADS, 1270 - PADS, 53.26, 54.60, anim='up', dyn=dyn_follow, exitdir=(0, 0))

# S14 next reel
addc(chip('NEXT REEL', ic='play', style='rose', size=40, h=96, font=SANSX), W / 2, 170, 55.08, 59.40, anim='pop')
br1 = grad_text('PCOS Breakfast', F(SERIF, 100), (255, 255, 255), (255, 220, 232))
add(*plain(br1), W / 2 - br1.size[0] / 2, 230, 57.54, 59.40, anim='up', blur=False)
addc(chip('Kya khana chahiye?', ic='sun', style='cream', size=40, h=96, icol=(GOLD, (255, 220, 160))), W / 2, 450, 58.52, 59.40, anim='pop')

# S15 mistakes
addc(chip('Common mistakes', ic='warn', style='cream', size=46, h=110, icol=(CORAL, (255, 150, 140)), font=SANSX), W / 2, 1060, 60.44, 62.20, anim='pop', shake=61.15)
addc(chip('Avoid karo!', ic='x', style='rose', size=40, h=96), W / 2, 1200, 61.12, 62.20, anim='pop')

# ---------- logo ----------
def logo(size, white=False):
    S = size * 4; L = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    for k in range(5):
        pet = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        g = grad(int(S * .30), int(S * .52), (255, 255, 255) if white else (255, 160, 192), (255, 220, 232) if white else (214, 58, 116))
        m = Image.new('L', g.size, 0); ImageDraw.Draw(m).ellipse([0, 0, g.size[0] - 1, g.size[1] - 1], fill=235 if white else 225)
        g.putalpha(m); pet.alpha_composite(g, (int(S / 2 - g.size[0] / 2), int(S * .06)))
        L.alpha_composite(pet.rotate(k * 72 - 0, resample=Image.BICUBIC, center=(S / 2, S / 2 + S * .02)))
    d = ImageDraw.Draw(L); r = S * .09
    d.ellipse([S / 2 - r, S / 2 - r, S / 2 + r, S / 2 + r], fill=(*ROSE, 255) if white else (255, 246, 240, 255))
    return L.resize((size, size), Image.LANCZOS)

BRAND = Image.new('RGBA', (460, 80), (0, 0, 0, 0))
BRAND.alpha_composite(logo(60), (0, 10))
ImageDraw.Draw(BRAND).text((72, 40), 'Femwise Health', font=F(SANSB, 30), fill=(255, 245, 248, 235), anchor='lm')
BRAND_SH = BRAND.getchannel('A').filter(ImageFilter.GaussianBlur(8))
_b = Image.new('RGBA', BRAND.size, (40, 4, 28, 255)); _b.putalpha(Image.fromarray((np.asarray(BRAND_SH) * 0.6).astype(np.uint8)))
_b.alpha_composite(BRAND); BRAND = _b
BIGLOGO = logo(250)

# ---------- dynamic full-frame draws ----------
def label_on(ov, sc, lab_spr, ix, iy, t0, t1, t):
    if not (t0 <= t <= t1 + 0.3): return
    x, y = sc.i2o(ix, iy, t)
    p = prog(t, t0, 0.4); a = eoc(p * 1.6) * (1 - eic(prog(t, t1, 0.28)))
    # pulsing dot
    r = 11 + 3 * math.sin((t - t0) * 6); d0 = Image.new('RGBA', (80, 80), (0, 0, 0, 0)); dd = ImageDraw.Draw(d0)
    rr = 14 + 22 * ((t - t0) * 1.2 % 1); dd.ellipse([40 - rr, 40 - rr, 40 + rr, 40 + rr], outline=(255, 255, 255, int(200 * (1 - (t - t0) * 1.2 % 1))), width=3)
    dd.ellipse([40 - r, 40 - r, 40 + r, 40 + r], fill=(*ROSE, 255), outline=(255, 255, 255, 255), width=4)
    paste(ov, with_alpha(d0, a), x - 40, y - 40)
    s = 0.5 + 0.5 * eob(p, 2.2); spr = lab_spr
    if abs(s - 1) > 0.01: spr = spr.resize((max(1, int(spr.size[0] * s)), max(1, int(spr.size[1] * s))), Image.BILINEAR)
    lx = clamp(x - spr.size[0] / 2, -PADS + 20, W - spr.size[0] + PADS - 20)
    paste(ov, with_alpha(spr, a), lx, y - 40 - spr.size[1] + PADS * 0.6)

def draw_labels(ov, t):
    S = SC[7]
    for lab, t0, ix, iy in PROT: label_on(ov, S, PCH[lab][0], ix, iy, t0, 31.40, t)
    S = SC[8]
    for lab, t0, ix, iy, _, _ in THL: label_on(ov, S, TCH[lab][0], ix, iy, t0, 36.40, t)
    S = SC[9]
    for lab, t0, ix, iy in FIB: label_on(ov, S, FCH[lab][0], ix, iy, t0, 40.10, t)

def draw_question_mark(ov, t):  # floating soft question marks in S4
    if not 15.9 <= t <= 17.9: return
    a = eoc(prog(t, 16.0, 0.5)) * (1 - eic(prog(t, 17.6, 0.3)))
    for i, (x, y, s) in enumerate(((180, 420, 120), (900, 330, 90), (820, 760, 70))):
        yy = y - (t - 16) * 22 + math.sin(t * 2 + i) * 8
        sp, _ = text_sprite('?', F(SERIFI, s), (255, 214, 228, 255), shadow=0, pad=10)
        paste(ov, with_alpha(sp, a * 0.6), x, yy)

def draw_glow_ring(ov, t):  # ring burst behind stamp + balanced eating
    for t0, cx, cy, col in ((4.40, W / 2, 1030, (255, 150, 185)), (44.36, W / 2, 230, (255, 190, 210)), (37.44, W / 2, 760, (190, 235, 200))):
        p = prog(t, t0, 0.7)
        if 0 < p < 1:
            r = 60 + 420 * eoc(p); a = (1 - p) ** 1.6; w = int(2 * r + 40)
            L = Image.new('RGBA', (w, w), (0, 0, 0, 0))
            ImageDraw.Draw(L).ellipse([20, 20, w - 20, w - 20], outline=(*col, int(220 * a)), width=8)
            paste(ov, L.filter(ImageFilter.GaussianBlur(2)), cx - w / 2, cy - w / 2)

def draw_tap(ov, t):
    t0 = 53.95; p = prog(t, t0 - 0.25, 0.9)
    if not 0 < p < 1: return
    cx, cy = 80 + 920 - 24 - 110, 1270 + 56
    fx = cx + 60 * (1 - eoc(prog(t, t0 - 0.25, 0.25))); fy = cy + 80 * (1 - eoc(prog(t, t0 - 0.25, 0.25)))
    a = 1 - eic(prog(t, t0 + 0.45, 0.2))
    rp = prog(t, t0, 0.5)
    if rp > 0:
        r = 20 + 90 * eoc(rp); w = int(2 * r + 20); L = Image.new('RGBA', (w, w), (0, 0, 0, 0))
        ImageDraw.Draw(L).ellipse([10, 10, w - 10, w - 10], outline=(255, 255, 255, int(220 * (1 - rp))), width=6)
        paste(ov, L, cx - w / 2, cy - w / 2)
    fdot = Image.new('RGBA', (90, 90), (0, 0, 0, 0)); dd = ImageDraw.Draw(fdot)
    s = 1 - 0.15 * math.sin(math.pi * prog(t, t0 - 0.05, 0.2))
    dd.ellipse([45 - 30 * s, 45 - 30 * s, 45 + 30 * s, 45 + 30 * s], fill=(255, 255, 255, 170), outline=(255, 255, 255, 240), width=3)
    paste(ov, with_alpha(fdot, a), fx - 45, fy - 45)

# ---------- global overlays ----------
def build_static():
    y = np.arange(H, dtype=np.float32)[:, None]
    bot = np.clip((y - 1150) / 770, 0, 1) ** 1.5 * 175
    top = np.clip((260 - y) / 260, 0, 1) ** 1.6 * 90
    a = np.broadcast_to(np.maximum(bot, top), (H, W))
    g = np.zeros((H, W, 4), np.uint8); g[..., 0], g[..., 1], g[..., 2] = 34, 6, 26; g[..., 3] = a.astype(np.uint8)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = ((xx - W / 2) / (W * 0.78)) ** 2 + ((yy - H / 2) / (H * 0.74)) ** 2
    vig = np.clip(1 - 0.30 * v ** 1.3, 0.55, 1).astype(np.float32)[..., None]
    return Image.fromarray(g, 'RGBA'), vig
GRAD, VIG = build_static()
GRAIN = [np.random.default_rng(i).normal(0, 3.4, (H // 2, W // 2, 1)).astype(np.float32) for i in range(8)]
GRAIN = [cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)[..., None] for g in GRAIN]

def soft_dot(d, col):
    yy, xx = np.mgrid[0:d, 0:d].astype(np.float32); r = np.sqrt((xx - d / 2) ** 2 + (yy - d / 2) ** 2) / (d / 2)
    a = np.clip(1 - r, 0, 1) ** 1.8
    im = np.zeros((d, d, 4), np.uint8); im[..., :3] = col; im[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(im, 'RGBA')
prng = np.random.default_rng(7)
PART = [dict(x=prng.uniform(0, W), y=prng.uniform(0, H), v=prng.uniform(12, 40), d=int(prng.uniform(10, 40)),
             a=prng.uniform(0.08, 0.24), ph=prng.uniform(0, 6.28), sw=prng.uniform(10, 40)) for _ in range(22)]
for p in PART: p['spr'] = soft_dot(p['d'], (255, 205, 220))

# ---------- captions ----------
CAPF = F(SANSX, 80)
CAP_Y = 1470
_wc = {}
def wsprite(txt, kw):
    k = (txt, kw)
    if k not in _wc: _wc[k] = text_sprite(txt, CAPF, (255, 196, 216) if kw else WHITE, shadow=200, blur=11)
    return _wc[k]
_pc = {}
def pill(w, h):
    k = (w, h)
    if k not in _pc:
        g = grad(w, h, (246, 106, 154), (206, 52, 112)); g.putalpha(rr_mask(w, h, 26)); pad = 30
        im = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
        glow = Image.new('L', im.size, 0); ImageDraw.Draw(glow).rounded_rectangle([pad, pad, pad + w, pad + h], 26, fill=140)
        gl = Image.new('RGBA', im.size, (236, 70, 130, 255)); gl.putalpha(glow.filter(ImageFilter.GaussianBlur(16)))
        im.alpha_composite(gl); im.alpha_composite(g, (pad, pad))
        hl = grad(w, h // 2, (255, 255, 255), (255, 255, 255), a1=70, a2=0)
        hm = Image.fromarray((np.asarray(rr_mask(w, h, 26))[:h // 2].astype(np.float32) * (np.asarray(hl.getchannel('A')) / 255)).astype(np.uint8))
        hl.putalpha(hm); im.alpha_composite(hl, (pad, pad)); _pc[k] = im
    return _pc[k]

def draw_captions(ov, t):
    for c in CHUNKS:
        if not (c['s'] <= t < c['e']): continue
        ws = c['words']; items = []
        for w in ws:
            txt = clean(w['w']).upper(); kw = clean(w['w']).lower() in KEY
            items.append((w, txt, kw))
        gap = 22; sprs = [wsprite(txt, kw) for _, txt, kw in items]
        widths = [s[1][2] - s[1][0] for s in sprs]
        total = sum(widths) + gap * (len(widths) - 1)
        scale = min(1.0, 980 / total)
        x = W / 2 - total * scale / 2
        ex = eic(prog(t, c['e'] - 0.16, 0.16)) if c['fade'] else 0; ca = 1 - ex; cdy = -22 * ex
        rects = []
        for ww in widths: rects.append((x, ww * scale)); x += (ww + gap) * scale
        act = None
        for i, (w, _, _) in enumerate(items):
            if t >= w['s'] - 0.03: act = i
        if act is not None:
            ph = int(100 * scale); pt = prog(t, items[act][0]['s'] - 0.03, 0.12); e = eoc(pt)
            x1, w1 = rects[act]
            if act > 0: x0, w0 = rects[act - 1]; px, pw = lerp(x0, x1, e), lerp(w0, w1, e)
            else: px, pw = x1, w1
            sc = eob(prog(t, items[0][0]['s'] - 0.03, 0.22)) if act == 0 else 1
            pw2, ph2 = int((pw + 34) * (0.7 + 0.3 * sc)), int(ph * (0.7 + 0.3 * sc))
            pl = with_alpha(pill(max(20, pw2), max(20, ph2)), ca * clamp(sc * 2))
            paste(ov, pl, px + pw / 2 - pw2 / 2 - 30, CAP_Y - ph2 / 2 - 30 + cdy + 2)
        for i, ((w, txt, kw), (spr, bb)) in enumerate(zip(items, sprs)):
            p = prog(t, w['s'] - 0.08, 0.24)
            if p <= 0: continue
            s = (0.62 + 0.38 * eob(p, 2.0)) * scale; a = eoc(p * 1.5) * ca; dy = (1 - eoc(p)) * 30
            if i == act: spr = wsprite(txt, False)[0]
            if abs(s - 1) > 0.005:
                spr = spr.resize((max(1, int(spr.size[0] * s)), max(1, int(spr.size[1] * s))), Image.BILINEAR)
            cx = rects[i][0] + rects[i][1] / 2
            paste(ov, with_alpha(spr, a), cx - spr.size[0] / 2, CAP_Y - spr.size[1] / 2 + dy + cdy)

# ---------- frame ----------
def render(fi):
    t = fi / FPS
    bg = bg_at(t, fi)
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
    img = bg.astype(np.float32) * VIG
    ov = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')
    ov.alpha_composite(GRAD)
    for p in PART:
        y = (p['y'] - p['v'] * t) % (H + 60) - 30; x = p['x'] + math.sin(t * 0.6 + p['ph']) * p['sw']
        a = p['a'] * (0.6 + 0.4 * math.sin(t * 1.3 + p['ph']))
        paste(ov, with_alpha(p['spr'], a), x, y)
    draw_glow_ring(ov, t); draw_question_mark(ov, t); draw_labels(ov, t); draw_plus(ov, t)
    for spr, x, y, a in states: paste(ov, with_alpha(spr, a), x, y)
    draw_tap(ov, t)
    if t < END0 + 0.3: draw_captions(ov, t)
    ba = 0.95 * (1 - prog(t, 5.5, 0.3)) * eoc(prog(t, 0.4, 0.6))
    if ba > 0: paste(ov, with_alpha(BRAND, ba), 50, 74)
    # progress bar
    pw = int(W * clamp(t / END0)); bar = ImageDraw.Draw(ov)
    if t < END0: bar.rectangle([0, 0, W, 7], fill=(255, 255, 255, 50)); bar.rectangle([0, 0, pw, 7], fill=(*PINK, 230))
    if t >= END0 - 0.05:
        q = eioc(prog(t, END0 - 0.05, 0.4))
        end = grad(W, H, (88, 26, 72), (34, 8, 30)); ov.alpha_composite(with_alpha(end, q))
        gl = soft_dot(1000, (236, 90, 140)); ov.alpha_composite(with_alpha(gl, 0.45 * q), (40, 230))
        lp = prog(t, END0 + 0.15, 0.55); s = 0.5 + 0.5 * eob(lp, 2.0)
        if lp > 0:
            lg = BIGLOGO.rotate(-30 * (1 - eoc(lp)) - (t - END0) * 5, resample=Image.BICUBIC)
            lg = lg.resize((int(250 * s), int(250 * s)), Image.BILINEAR)
            paste(ov, with_alpha(lg, eoc(lp * 1.5)), W / 2 - lg.size[0] / 2, 700 - lg.size[1] / 2)
        tp = prog(t, END0 + 0.35, 0.5)
        if tp > 0:
            ts = grad_text('Femwise Health', F(SERIF, 104), (255, 255, 255), (255, 210, 226), shadow=0)
            paste(ov, with_alpha(ts, eoc(tp)), W / 2 - ts.size[0] / 2, 930 - ts.size[1] / 2 + (1 - eoc(tp)) * 40)
        tp2 = prog(t, END0 + 0.6, 0.5)
        if tp2 > 0:
            ts, _ = text_sprite('Your hormones. Your plate. Your power.', F(SANSM, 36), (255, 205, 222), shadow=0)
            paste(ov, with_alpha(ts, eoc(tp2)), W / 2 - ts.size[0] / 2, 1040 - ts.size[1] / 2 + (1 - eoc(tp2)) * 30)
        tp3 = prog(t, END0 + 0.85, 0.45)
        if tp3 > 0:
            c, _ = chip('Comment “DIET”', ic='send', style='rose', size=40, h=100, font=SANSX)
            s3 = 0.5 + 0.5 * eob(tp3, 2.2); c = c.resize((int(c.size[0] * s3), int(c.size[1] * s3)), Image.BILINEAR)
            paste(ov, with_alpha(c, eoc(tp3 * 1.5)), W / 2 - c.size[0] / 2, 1210 - c.size[1] / 2)
    out = np.asarray(ov.convert('RGB')).astype(np.float32) + GRAIN[fi % 8]
    return np.clip(out, 0, 255).astype(np.uint8)

def worker(args):
    k, a, b = args
    path = os.path.join(ROOT, f'seg_{k}.mp4')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                          '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
                          '-x264-params', 'keyint=60', path], stdin=subprocess.PIPE)
    for fi in range(a, b):
        p.stdin.write(render(fi).tobytes())
        if fi % 60 == 0: print(k, fi, flush=True)
    p.stdin.close(); p.wait(); return path

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        os.makedirs(os.path.join(ROOT, 'test'), exist_ok=True)
        for t in map(float, sys.argv[2:]):
            Image.fromarray(render(int(round(t * FPS)))).save(os.path.join(ROOT, 'test', f't{t:05.2f}.jpg'), quality=85)
        sys.exit()
    if len(sys.argv) > 1 and sys.argv[1] == 'chunks':
        for c in CHUNKS: print(f"{c['s']:6.2f} {c['e']:6.2f} {' '.join(w['w'] for w in c['words'])}")
        sys.exit()
    n = 4; step = math.ceil(NF / n)
    with Pool(n) as pool: segs = pool.map(worker, [(k, k * step, min(NF, (k + 1) * step)) for k in range(n)])
    with open(os.path.join(ROOT, 'segs.txt'), 'w') as f:
        for s in segs: f.write(f"file '{s}'\n")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', os.path.join(ROOT, 'segs.txt'), '-c', 'copy',
                    os.path.join(ROOT, 'video_noaudio.mp4')], check=True)
    print('done')
