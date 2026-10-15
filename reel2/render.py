"""Late-period explainer reel: Ken Burns scenes, transitions, overlays, word-synced captions.
Writes raw frames to ffmpeg -> video_noaudio.mp4 (1080x1920, 30 fps)."""
import json, math, os, re, subprocess, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ROOT = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
DUR = 43.3
NF = int(DUR * FPS)
FD = '/usr/share/fonts/opentype/inter/'
_fc = {}
def F(name, size):
    k = (name, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(FD + name, size)
    return _fc[k]

PINK = (255, 79, 139); PINK_SOFT = (255, 176, 205); MINT = (110, 231, 190); YEL = (255, 214, 92)
WHITE = (255, 255, 255); PLUM = (38, 14, 44); INK = (20, 10, 24)

def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def ease_io(x): x = clamp(x); return x * x * (3 - 2 * x)
def ease_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def ease_in(x): x = clamp(x); return x ** 3
def back_out(x, s=1.9):
    x = clamp(x); x -= 1; return x * x * ((s + 1) * x + s) + 1
def ramp(t, t0, d): return clamp((t - t0) / d)

# ---------------------------------------------------------------- scenes
# (image, start, end, zoom0, zoom1, (fx0, fy0), (fx1, fy1)) focus = normalized source point at frame centre
SCENES = [
    ('01_test.png',      0.00, 3.20, 1.30, 1.12, (.50, .44), (.50, .40)),
    ('02_confused.png',  3.20, 5.45, 1.10, 1.24, (.50, .45), (.50, .36)),
    ('03_calendar.png',  5.45, 8.42, 1.28, 1.08, (.28, .50), (.45, .52)),
    ('04_stress.png',    8.42, 8.98, 1.18, 1.28, (.52, .40), (.52, .38)),
    ('05_exams.png',     8.98, 9.94, 1.28, 1.16, (.50, .45), (.50, .48)),
    ('06_travel.png',    9.94, 10.72, 1.10, 1.22, (.45, .45), (.52, .45)),
    ('07_unwell.png',   10.72, 11.74, 1.24, 1.12, (.48, .38), (.48, .42)),
    ('08_gym.png',      11.74, 14.10, 1.08, 1.22, (.50, .55), (.50, .40)),
    ('09_thyroid.png',  14.10, 15.24, 1.14, 1.26, (.55, .42), (.62, .40)),
    ('09b_pcos.png',    15.24, 17.20, 1.30, 1.12, (.35, .22), (.40, .35)),
    ('10_waiting.png',  17.20, 19.72, 1.08, 1.20, (.45, .50), (.55, .42)),
    ('11_journal.png',  19.72, 23.26, 1.25, 1.10, (.55, .58), (.50, .50)),
    ('12_months.png',   23.26, 27.12, 1.10, 1.22, (.30, .50), (.60, .50)),
    ('14_doctor.png',   27.12, 28.40, 1.22, 1.10, (.32, .48), (.40, .50)),
    ('15_testbox.png',  28.40, 32.72, 1.08, 1.26, (.50, .55), (.45, .62)),
    ('16_phone.png',    32.72, 35.72, 1.24, 1.10, (.55, .48), (.52, .50)),
    ('17_guide.png',    35.72, 40.48, 1.08, 1.20, (.40, .45), (.40, .42)),
    ('18_friends.png',  40.48, DUR,   1.22, 1.08, (.52, .45), (.50, .48)),
]
# transition style into scene i (i>=1)
TRANS = ['', 'zoom', 'whip', 'flash', 'zoom', 'whip', 'zoom', 'whip', 'flash', 'zoom', 'fade', 'whip',
         'zoom', 'flash', 'whip', 'zoom', 'whip', 'fade']
TD = {'zoom': 0.30, 'whip': 0.28, 'flash': 0.30, 'fade': 0.50}

_img = {}
def src(name):
    if name not in _img:
        im = Image.open(os.path.join(ROOT, 'img', name)).convert('RGB')
        im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
        _img[name] = im
    return _img[name]

def grade(im):
    return im  # grading is applied in numpy in finish()

def cam(idx, t, zoom_mul=1.0, dx=0.0):
    name, t0, t1, z0, z1, f0, f1 = SCENES[idx]
    im = src(name); sw, sh = im.size
    p = ease_io((t - t0) / (t1 - t0))
    z = (z0 + (z1 - z0) * p) * zoom_mul
    fx = f0[0] + (f1[0] - f0[0]) * p; fy = f0[1] + (f1[1] - f0[1]) * p
    s = max(W / sw, H / sh) * z
    vw, vh = W / s, H / s
    cx = min(max(fx * sw, vw / 2), sw - vw / 2) + dx / s
    cy = min(max(fy * sh, vh / 2), sh - vh / 2)
    return im.transform((W, H), Image.AFFINE, (1 / s, 0, cx - vw / 2, 0, 1 / s, cy - vh / 2), Image.BICUBIC)

def hblur(im, k):
    if k < 2: return im
    return im.resize((max(8, int(W / k)), H), Image.BILINEAR).resize((W, H), Image.BILINEAR)
def blur(im, r):
    if r < 0.6: return im
    sm = im.resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(r / 4))
    return sm.resize((W, H), Image.BILINEAR)

def scene_at(t):
    for i, sc in enumerate(SCENES):
        if sc[1] <= t < sc[2]: return i
    return len(SCENES) - 1

def background(t):
    i = scene_at(t)
    # transition window around cut into scene i, and cut into scene i+1
    if i + 1 < len(SCENES):
        cut = SCENES[i + 1][1]; kind = TRANS[i + 1]; d = TD[kind]
        if t >= cut - d / 2: return transition(i, i + 1, cut, kind, d, t)
    if i >= 1:
        cut = SCENES[i][1]; kind = TRANS[i]; d = TD[kind]
        if t < cut + d / 2: return transition(i - 1, i, cut, kind, d, t)
    return cam(i, t)

def transition(a, b, cut, kind, d, t):
    u = clamp((t - (cut - d / 2)) / d)  # 0..1 across window
    if kind == 'fade':
        A = cam(a, t); B = cam(b, t)
        return Image.blend(A, B, ease_io(u))
    if kind == 'zoom':
        if t < cut:
            k = ease_in(u * 2); im = cam(a, t, 1 + 0.35 * k); return blur(im, 22 * k)
        k = 1 - ease_out((u - .5) * 2); im = cam(b, t, 1 + 0.30 * k); return blur(im, 20 * k)
    if kind == 'whip':
        off = int(W * ease_io(u))
        im = Image.new('RGB', (W, H))
        if off < W: im.paste(cam(a, t), (-off, 0))
        if off > 0: im.paste(cam(b, t), (W - off, 0))
        return hblur(im, 1 + 36 * math.sin(math.pi * u) ** 1.5)
    if kind == 'flash':
        im = cam(a, t) if t < cut else cam(b, t, 1 + 0.08 * (1 - ease_out((u - .5) * 2)))
        f = 1 - abs(u - .5) * 2; f = f ** 1.5
        return Image.blend(im, Image.new('RGB', (W, H), (255, 244, 248)), 0.85 * f)
    return cam(b if t >= cut else a, t)

# ---------------------------------------------------------------- grading / finishing
yy = np.linspace(-1, 1, H)[:, None]; xx = np.linspace(-1, 1, W)[None, :]
VIG = (1 - 0.30 * np.clip((xx ** 2 * 0.8 + yy ** 2 * 0.6) - 0.15, 0, 1)).astype(np.float32)[..., None]
TOPG = np.clip(1 - (np.arange(H) / (H * 0.30)), 0, 1)[:, None, None].astype(np.float32) ** 1.6
BOTG = np.clip((np.arange(H) - H * 0.55) / (H * 0.45), 0, 1)[:, None, None].astype(np.float32) ** 1.4
_rng = np.random.default_rng(3)
GRAIN = [(_rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)) for _ in range(6)]
def finish(im, fi):
    a = np.asarray(im, np.float32) / 255
    # warm soft grade: lift blacks, slight warm highlights, gentle contrast
    a = a * 0.94 + 0.03
    a = a + (a - 0.5) * 0.06
    a[..., 0] *= 1.025; a[..., 2] *= 0.975
    a = a * VIG
    a = a * (1 - 0.42 * TOPG) * (1 - 0.62 * BOTG)
    g = GRAIN[fi % 6].repeat(2, 0).repeat(2, 1)[..., None]
    a = a + g * 0.016
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

# ---------------------------------------------------------------- drawing helpers
def shadowed(layer, draw_fn, blur_r=14, off=(0, 8), alpha=150):
    sh = Image.new('RGBA', layer.size, (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(sh), (0, 0, 0, alpha), off)
    sh = sh.filter(ImageFilter.GaussianBlur(blur_r)); layer.alpha_composite(sh)
    draw_fn(ImageDraw.Draw(layer), None, (0, 0))

def sprite(w, h): return Image.new('RGBA', (w, h), (0, 0, 0, 0))

def place(canvas, spr, cx, cy, scale=1.0, alpha=1.0, rot=0.0):
    if alpha <= 0.01 or scale <= 0.01: return
    s = spr
    if abs(scale - 1) > 0.005:
        s = s.resize((max(1, int(s.width * scale)), max(1, int(s.height * scale))), Image.BICUBIC)
    if rot: s = s.rotate(rot, Image.BICUBIC, expand=True)
    if alpha < 0.999:
        a = s.getchannel('A').point(lambda v: int(v * alpha)); s = s.copy(); s.putalpha(a)
    canvas.alpha_composite(s, (int(cx - s.width / 2), int(cy - s.height / 2)))

_sp = {}
def pill(text, font, fg=WHITE, bg=PINK, padx=34, pady=18, r=None, bgalpha=255, icon=None, outline=None):
    key = ('pill', text, font.path, font.size, fg, bg, padx, pady, bgalpha, icon, outline)
    if key in _sp: return _sp[key]
    tb = font.getbbox(text); tw, th = tb[2] - tb[0], font.size
    iw = int(th * 1.15) if icon else 0
    w = tw + 2 * padx + iw; h = int(th * 1.25) + 2 * pady; r = r or h // 2
    M = 30; s = sprite(w + 2 * M, h + 2 * M)
    sh = sprite(*s.size); ImageDraw.Draw(sh).rounded_rectangle((M, M + 8, M + w, M + h + 8), r, fill=(0, 0, 0, 110))
    s.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(s); d.rounded_rectangle((M, M, M + w, M + h), r, fill=bg + (bgalpha,), outline=outline, width=3 if outline else 0)
    x = M + padx
    if icon:
        icon(d, x + th * 0.45, M + h / 2, th * 0.48); x += iw
    d.text((x - tb[0], M + h / 2), text, font=font, fill=fg, anchor='lm')
    _sp[key] = s; return s

def txt(text, font, fill=WHITE, shadow=True, stroke=0, stroke_fill=INK):
    key = ('txt', text, font.path, font.size, fill, shadow, stroke)
    if key in _sp: return _sp[key]
    bb = font.getbbox(text, stroke_width=stroke); M = 40
    w, h = bb[2] - bb[0] + 2 * M, bb[3] - bb[1] + 2 * M
    s = sprite(w, h)
    if shadow:
        sh = sprite(w, h); ImageDraw.Draw(sh).text((M - bb[0], M - bb[1] + 7), text, font=font, fill=(0, 0, 0, 170), stroke_width=stroke, stroke_fill=(0, 0, 0, 170))
        s.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(s).text((M - bb[0], M - bb[1]), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    _sp[key] = s; return s

# icons drawn into a pill: (draw, cx, cy, r)
def ic_minus(d, cx, cy, r):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE); d.rounded_rectangle((cx - r * .55, cy - r * .13, cx + r * .55, cy + r * .13), 4, fill=PINK)
def ic_check(d, cx, cy, r):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=MINT)
    d.line([(cx - r * .45, cy + r * .02), (cx - r * .1, cy + r * .38), (cx + r * .5, cy - r * .35)], fill=PLUM, width=max(3, int(r * .26)), joint='curve')
def ic_plus(d, cx, cy, r):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE)
    d.rounded_rectangle((cx - r * .55, cy - r * .14, cx + r * .55, cy + r * .14), 3, fill=PINK)
    d.rounded_rectangle((cx - r * .14, cy - r * .55, cx + r * .14, cy + r * .55), 3, fill=PINK)
def ic_dot(col):
    def f(d, cx, cy, r): d.ellipse((cx - r * .42, cy - r * .42, cx + r * .42, cy + r * .42), fill=col)
    return f
def ic_num(n, col=PINK):
    def f(d, cx, cy, r):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
        d.text((cx, cy + 1), str(n), font=F('InterDisplay-Black.otf', int(r * 1.25)), fill=WHITE, anchor='mm')
    return f

def pop(t, t0, d=0.38):  # scale & alpha for a pop-in
    u = (t - t0) / d
    if u <= 0: return 0.0, 0.0
    return back_out(u), clamp(u * 2.5)
def out(t, t1, d=0.22):  # multiplier for fade-out at t1
    return 1 - ease_in((t - t1) / d) if t > t1 else 1.0

# ---------------------------------------------------------------- overlays
TOPY = 330
def overlays(c, t):
    # progress bar
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((40, 70, W - 40, 78), 4, fill=(255, 255, 255, 60))
    d.rounded_rectangle((40, 70, 40 + (W - 80) * clamp(t / DUR), 78), 4, fill=PINK + (235,))

    # 1. hook ------------------------------------------------------
    if t < 3.35:
        o = out(t, 3.05)
        s, a = pop(t, 0.02, 0.45)
        place(c, txt('10 DAYS', F('InterDisplay-Black.otf', 150), WHITE), W / 2, TOPY, s, a * o)
        s2, a2 = pop(t, 0.30, 0.45)
        place(c, txt('LATE', F('InterDisplay-Black.otf', 150), PINK), W / 2, TOPY + 160, s2, a2 * o, rot=-3 * (1 - clamp((t - .3) / .4)))
        s3, a3 = pop(t, 1.62, 0.42)
        jit = 6 * math.sin(t * 90) * clamp(1 - (t - 1.62) / 0.35) if t > 1.62 else 0
        place(c, pill('TEST: NEGATIVE', F('InterDisplay-Black.otf', 52), WHITE, (225, 46, 92), icon=ic_minus), W / 2 + jit, TOPY + 345, s3, a3 * o)
    # 2. so what's going on ----------------------------------------
    if 3.2 <= t < 5.5:
        o = out(t, 5.2)
        for k, (x, y, sz, t0, r) in enumerate(((W * .22, 420, 210, 3.30, -14), (W * .80, 330, 150, 3.50, 12), (W * .70, 610, 110, 3.66, -8))):
            s, a = pop(t, t0, 0.45); bob = 10 * math.sin((t - t0) * 4 + k)
            place(c, txt('?', F('InterDisplay-Black.otf', sz), PINK if k != 1 else WHITE), x, y + bob, s, a * o * 0.95, rot=r)
    # 3. common reasons ---------------------------------------------
    if 5.45 <= t < 8.5:
        o = out(t, 8.25)
        s, a = pop(t, 5.55, 0.45)
        place(c, txt('A LATE PERIOD', F('InterDisplay-Bold.otf', 60), WHITE), W / 2, TOPY - 20, s, a * o)
        s2, a2 = pop(t, 6.85, 0.45)
        place(c, pill('has many common reasons', F('InterDisplay-Black.otf', 56), WHITE, PINK), W / 2, TOPY + 80, s2, a2 * o)
    # 4. reasons checklist build ----------------------------------
    if 8.45 <= t < 14.05:
        o = out(t, 13.85)
        items = [('Stress', 8.50), ('Exams', 9.02), ('Travel', 9.98), ('Being unwell', 10.76), ('Weight change', 12.30), ('Exercise', 13.04)]
        place(c, txt('COMMON REASONS', F('InterDisplay-Black.otf', 44), PINK_SOFT), 330, 205, *pop(t, 8.45, .35)[:1], alpha=pop(t, 8.45, .35)[1] * o)
        for k, (lab, t0) in enumerate(items):
            if t < t0: continue
            s, a = pop(t, t0, 0.36); slide = (1 - ease_out((t - t0) / 0.35)) * -120
            sp = pill(lab, F('InterDisplay-Bold.otf', 46), WHITE, PLUM, bgalpha=215, icon=ic_num(k + 1), padx=26, pady=12)
            hl = t0 <= t < (items[k + 1][1] if k + 1 < len(items) else 14.0)
            if hl: sp = pill(lab, F('InterDisplay-Bold.otf', 46), WHITE, PINK, icon=ic_num(k + 1, PLUM), padx=26, pady=12)
            place(c, sp, 70 + sp.width / 2 + slide, 300 + k * 104, s if hl else 0.94, a * o)
    # 5. medical causes ----------------------------------------------
    if 14.1 <= t < 17.25:
        o = out(t, 17.0)
        s, a = pop(t, 14.15, .4)
        place(c, txt('MEDICAL CAUSES', F('InterDisplay-Black.otf', 46), PINK_SOFT), W / 2, TOPY - 60, s, a * o)
        s1, a1 = pop(t, 14.22, .42)
        place(c, pill('Thyroid problems', F('InterDisplay-Black.otf', 60), WHITE, PLUM if t >= 15.3 else PINK, bgalpha=225), W / 2, TOPY + 40, s1, a1 * o)
        s2, a2 = pop(t, 15.30, .42)
        place(c, pill('PCOS', F('InterDisplay-Black.otf', 76), WHITE, PINK), W / 2, TOPY + 175, s2, a2 * o)
    # 6. when to stop waiting - clock ---------------------------------
    if 17.2 <= t < 19.8:
        o = out(t, 19.5)
        s, a = pop(t, 17.3, .45)
        clock(c, W / 2, TOPY + 10, 120 * s, t, a * o)
        s2, a2 = pop(t, 17.62, .45)
        place(c, pill('When to stop waiting?', F('InterDisplay-Black.otf', 56), WHITE, PINK), W / 2, TOPY + 210, s2, a2 * o)
    # 7. happened once -> note it --------------------------------------
    if 19.75 <= t < 23.3:
        o = out(t, 23.05)
        s, a = pop(t, 19.85, .42)
        place(c, pill('Happened once?', F('InterDisplay-Black.otf', 56), WHITE, PLUM, bgalpha=220), W / 2, TOPY - 20, s, a * o)
        s2, a2 = pop(t, 21.0, .42)
        place(c, pill('Period came', F('InterDisplay-Bold.otf', 48), WHITE, PLUM, bgalpha=200, icon=ic_check), W / 2, TOPY + 100, s2, a2 * o)
        s3, a3 = pop(t, 22.3, .42)
        place(c, pill('Just note it down', F('InterDisplay-Black.otf', 56), PLUM, MINT, icon=ic_dot(PLUM)), W / 2, TOPY + 225, s3, a3 * o)
    # 8. 3 months counter ----------------------------------------------
    if 23.3 <= t < 27.2:
        o = out(t, 26.95)
        n = 1 if t < 24.95 else 2 if t < 25.12 else 3
        if t < 24.78: n = 0
        s, a = pop(t, 23.4, .42)
        place(c, pill('No period for', F('InterDisplay-Bold.otf', 48), WHITE, PLUM, bgalpha=215), W / 2, TOPY - 60, s, a * o)
        if n:
            s2, a2 = pop(t, 24.78 if n == 1 else 24.95 if n == 2 else 25.12, .25)
            place(c, txt(str(n), F('InterDisplay-Black.otf', 260), PINK if n == 3 else WHITE), W / 2 - 250, TOPY + 140, s2, a2 * o)
            s3, a3 = pop(t, 25.15, .4)
            place(c, txt('MONTHS', F('InterDisplay-Black.otf', 96), WHITE), W / 2 + 100, TOPY + 150, s3, a3 * o)
        s4, a4 = pop(t, 25.8, .42)
        place(c, pill('or it keeps happening', F('InterDisplay-Bold.otf', 46), WHITE, PINK), W / 2, TOPY + 330, s4, a4 * o)
    # 9. see your doctor -----------------------------------------------
    if 27.12 <= t < 28.45:
        o = out(t, 28.22)
        s, a = pop(t, 27.18, .42)
        place(c, pill('SEE YOUR DOCTOR', F('InterDisplay-Black.otf', 66), WHITE, PINK, icon=ic_plus), W / 2, TOPY, s, a * o)
    # 10. pregnancy chance -> retest -----------------------------------
    if 28.4 <= t < 32.75:
        o = out(t, 32.5)
        s, a = pop(t, 28.5, .42)
        place(c, pill('Any chance of pregnancy?', F('InterDisplay-Black.otf', 54), WHITE, PLUM, bgalpha=220), W / 2, TOPY - 40, s, a * o)
        s2, a2 = pop(t, 30.5, .42)
        place(c, pill('Re-test at home', F('InterDisplay-Bold.otf', 50), WHITE, PINK), W / 2, TOPY + 85, s2, a2 * o)
        s3, a3 = pop(t, 31.6, .42)
        place(c, cal7(), W / 2, TOPY + 300, s3, a3 * o, rot=4 * (1 - clamp((t - 31.6) / .5)))
    # 11. follow ------------------------------------------------------
    if 32.72 <= t < 35.75:
        o = out(t, 35.5)
        s, a = pop(t, 32.78, .42)
        pressed = t >= 33.25
        bt = pill('Following', F('InterDisplay-Black.otf', 62), PLUM, WHITE, icon=ic_check) if pressed else pill('Follow', F('InterDisplay-Black.otf', 62), WHITE, PINK, icon=ic_plus)
        press = 1 - 0.08 * math.sin(math.pi * clamp((t - 33.1) / .2))
        place(c, bt, W / 2, TOPY, s * press, a * o)
        s2, a2 = pop(t, 33.4, .42)
        place(c, txt('We answer your questions', F('InterDisplay-Bold.otf', 52), WHITE), W / 2, TOPY + 140, s2, a2 * o)
        s3, a3 = pop(t, 34.5, .42)
        place(c, pill('EVERY FRIDAY', F('InterDisplay-Black.otf', 60), PLUM, YEL), W / 2, TOPY + 240, s3, a3 * o, rot=-3)
    # 12. comment READ -------------------------------------------------
    if 35.72 <= t < 40.5:
        o = out(t, 40.25)
        s, a = pop(t, 35.78, .42)
        comment_box(c, W / 2, TOPY + 20, t, s, a * o)
        s2, a2 = pop(t, 36.9, .42)
        place(c, pill('Free guide: irregular periods', F('InterDisplay-Bold.otf', 44), WHITE, PLUM, bgalpha=220), W / 2, TOPY + 175, s2, a2 * o)
        s3, a3 = pop(t, 38.78, .42)
        place(c, pill('or drop your question', F('InterDisplay-Black.otf', 50), WHITE, PINK), W / 2, TOPY + 290, s3, a3 * o)
    # 13. share -------------------------------------------------------
    if t >= 40.48:
        s, a = pop(t, 40.55, .45)
        fly = ease_in((t - 42.75) / .5) if t > 42.75 else 0
        place(c, plane(), W / 2 + 260 * fly, TOPY - 10 - 300 * fly, s, a * (1 - fly), rot=10 * math.sin(t * 3))
        s2, a2 = pop(t, 40.7, .42)
        place(c, pill('Send this to a friend', F('InterDisplay-Black.otf', 58), WHITE, PINK), W / 2, TOPY + 170, s2, a2 * (1 - 0.0 * fly))
        s3, a3 = pop(t, 41.7, .42)
        place(c, txt("who's panicking right now", F('InterDisplay-Bold.otf', 46), WHITE), W / 2, TOPY + 275, s3, a3)

def clock(c, cx, cy, r, t, alpha):
    if r < 2 or alpha < .02: return
    M = 20; s = sprite(int(2 * r + 2 * M), int(2 * r + 2 * M)); d = ImageDraw.Draw(s); o = r + M
    sh = sprite(*s.size); ImageDraw.Draw(sh).ellipse((M, M + 8, M + 2 * r, M + 2 * r + 8), fill=(0, 0, 0, 120))
    s.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    d.ellipse((M, M, M + 2 * r, M + 2 * r), fill=WHITE + (245,), outline=PINK, width=max(3, int(r * .09)))
    for k in range(12):
        an = k * math.pi / 6; r1 = r * (.78 if k % 3 else .70)
        d.line([(o + r1 * math.sin(an), o - r1 * math.cos(an)), (o + r * .86 * math.sin(an), o - r * .86 * math.cos(an))], fill=PLUM, width=max(2, int(r * .04)))
    am = (t - 17.3) * 2.6; ah = am / 12 + 1.2
    d.line([(o, o), (o + r * .45 * math.sin(ah), o - r * .45 * math.cos(ah))], fill=PLUM, width=max(3, int(r * .08)))
    d.line([(o, o), (o + r * .70 * math.sin(am), o - r * .70 * math.cos(am))], fill=PINK, width=max(2, int(r * .05)))
    d.ellipse((o - r * .07, o - r * .07, o + r * .07, o + r * .07), fill=PLUM)
    place(c, s, cx, cy, 1.0, alpha)

def cal7():
    if 'cal7' in _sp: return _sp['cal7']
    w, h, M = 300, 300, 30; s = sprite(w + 2 * M, h + 2 * M)
    sh = sprite(*s.size); ImageDraw.Draw(sh).rounded_rectangle((M, M + 10, M + w, M + h + 10), 36, fill=(0, 0, 0, 120))
    s.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(s)
    d.rounded_rectangle((M, M, M + w, M + h), 36, fill=WHITE)
    d.rounded_rectangle((M, M, M + w, M + 90), 36, fill=PINK); d.rectangle((M, M + 50, M + w, M + 90), fill=PINK)
    d.text((M + w / 2, M + 47), 'AFTER', font=F('InterDisplay-Black.otf', 44), fill=WHITE, anchor='mm')
    d.text((M + w / 2, M + 165), '7', font=F('InterDisplay-Black.otf', 130), fill=PLUM, anchor='mm')
    d.text((M + w / 2, M + 255), 'DAYS', font=F('InterDisplay-Black.otf', 46), fill=PINK, anchor='mm')
    for x in (M + 80, M + w - 80): d.rounded_rectangle((x - 9, M - 22, x + 9, M + 22), 8, fill=PLUM)
    _sp['cal7'] = s; return s

def plane():
    if 'plane' in _sp: return _sp['plane']
    S = 230; M = 30; s = sprite(S + 2 * M, S + 2 * M)
    sh = sprite(*s.size); ImageDraw.Draw(sh).ellipse((M, M + 10, M + S, M + S + 10), fill=(0, 0, 0, 120))
    s.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(s); d.ellipse((M, M, M + S, M + S), fill=PINK)
    o = M + S / 2; k = S / 230
    pts = [(o - 62 * k, o - 6 * k), (o + 62 * k, o - 52 * k), (o + 18 * k, o + 62 * k), (o - 4 * k, o + 18 * k)]
    d.polygon(pts, fill=WHITE)
    d.polygon([(o - 4 * k, o + 18 * k), (o + 62 * k, o - 52 * k), (o + 2 * k, o + 46 * k)], fill=(255, 220, 232))
    _sp['plane'] = s; return s

def comment_box(c, cx, cy, t, scale, alpha):
    if alpha < .02: return
    w, h, M = 820, 130, 30; s = sprite(w + 2 * M, h + 2 * M)
    sh = sprite(*s.size); ImageDraw.Draw(sh).rounded_rectangle((M, M + 10, M + w, M + h + 10), 65, fill=(0, 0, 0, 120))
    s.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(s); d.rounded_rectangle((M, M, M + w, M + h), 65, fill=(255, 255, 255, 245))
    d.ellipse((M + 22, M + 22, M + 108, M + 108), fill=PINK_SOFT)
    d.ellipse((M + 50, M + 36, M + 80, M + 66), fill=WHITE); d.pieslice((M + 36, M + 66, M + 94, M + 120), 180, 360, fill=WHITE)
    word = 'READ'; nchar = int(clamp((t - 36.0) / 0.42) * len(word) + 0.001)
    f = F('InterDisplay-Black.otf', 58); x = M + 136
    if nchar == 0:
        d.text((x, M + h / 2), 'Add a comment…', font=F('Inter-Medium.otf', 44), fill=(150, 140, 155), anchor='lm')
    else:
        shown = word[:nchar]; d.text((x, M + h / 2), shown, font=f, fill=PLUM, anchor='lm'); x += f.getlength(shown) + 6
    if (t * 2.2) % 1 < .6 and nchar < len(word): d.rectangle((x, M + 38, x + 4, M + h - 38), fill=PINK)
    sent = t > 36.75
    bx = M + w - 75; d.ellipse((bx - 48, M + 17, bx + 48, M + h - 17), fill=PINK if sent else (230, 225, 232))
    d.polygon([(bx - 20, M + 45), (bx + 24, M + 65), (bx - 20, M + 85), (bx - 10, M + 65)], fill=WHITE)
    place(c, s, cx, cy, scale * (1 + 0.05 * math.sin(math.pi * clamp((t - 36.75) / .2))), alpha)
    s2, a2 = pop(t, 35.85, .35)
    place(c, txt('Comment', F('InterDisplay-Black.otf', 50), PINK_SOFT), cx - 270, cy - 110, s2, a2 * alpha)

# ---------------------------------------------------------------- captions
WORDS = json.load(open(os.path.join(ROOT, 'words.json')))
FIX = {'read': 'READ', 'pcos': 'PCOS'}
EMPH = {'late', 'negative', 'reasons', 'stress', 'exams', 'travel', 'unwell', 'weight', 'exercise', 'thyroid', 'pcos', 'waiting',
        'once', 'note', '3', 'months', 'doctor', 'pregnancy', 'week', 'follow', 'friday', 'read', 'guide', 'question', 'friend', 'panicking', '10', 'days'}
for w in WORDS:
    raw = w['w']; w['p'] = raw[-1] in ',.?!'; clean = re.sub(r'[^\w\'’?]', '', raw)
    w['t'] = FIX.get(clean.lower(), clean); w['k'] = re.sub(r'[^\w]', '', clean.lower()) in EMPH

def build_chunks():
    ch, cur = [], []
    for i, w in enumerate(WORDS):
        cur.append(w)
        nxt = WORDS[i + 1] if i + 1 < len(WORDS) else None
        L = sum(len(x['t']) for x in cur) + len(cur)
        brk = nxt is None or w['p'] or (nxt['s'] - w['e'] > 0.28) or len(cur) >= 3 or L + len(nxt['t']) > 17
        if brk: ch.append(cur); cur = []
    out = []
    for k, c in enumerate(ch):
        s = c[0]['s'] - 0.06
        nxt = ch[k + 1][0]['s'] - 0.06 if k + 1 < len(ch) else DUR
        e = min(nxt, c[-1]['e'] + 0.55)
        out.append((s, e, c))
    return out
CHUNKS = build_chunks()
CAPY = 1395
CF = F('InterDisplay-Black.otf', 84)

def word_sprite(text, col, hl):
    key = ('w', text, col, hl)
    if key in _sp: return _sp[key]
    bb = CF.getbbox(text, stroke_width=6); M = 36
    w, h = bb[2] - bb[0] + 2 * M, 84 + 2 * M + 20
    s = sprite(w, h); oy = M - CF.getbbox('Hg')[1]
    sh = sprite(w, h)
    ImageDraw.Draw(sh).text((M - bb[0], oy + 9), text, font=CF, fill=(0, 0, 0, 200), stroke_width=6, stroke_fill=(0, 0, 0, 200))
    s.alpha_composite(sh.filter(ImageFilter.GaussianBlur(9)))
    if hl:
        d = ImageDraw.Draw(s); d.rounded_rectangle((M - bb[0] - 18, oy - 6, w - M + 18 + bb[0] * 0, oy + 98), 22, fill=PINK)
        ImageDraw.Draw(s).text((M - bb[0], oy), text, font=CF, fill=WHITE)
    else:
        ImageDraw.Draw(s).text((M - bb[0], oy), text, font=CF, fill=col, stroke_width=6, stroke_fill=INK)
    _sp[key] = s; return s

def captions(c, t):
    for s0, e0, ws in CHUNKS:
        if not (s0 <= t < e0): continue
        ain = ease_out((t - s0) / 0.16); aout = 1 - ease_in((t - (e0 - 0.12)) / 0.12) if t > e0 - 0.12 else 1
        lift = (1 - back_out((t - s0) / 0.3, 1.4)) * 40
        GAP = 22
        sprs = []
        for w in ws:
            active = w['s'] - 0.04 <= t < w['e'] + 0.06 or (w is ws[-1] and t >= w['s'])
            spoken = t >= w['s'] - 0.04
            col = YEL if w['k'] else WHITE
            sprs.append((w, word_sprite(w['t'].upper(), col, active and w['k']), active, spoken))
        widths = [sp.width - 72 for _, sp, _, _ in sprs]
        total = sum(widths) + GAP * (len(sprs) - 1)
        x = W / 2 - total / 2
        for (w, sp, active, spoken), ww in zip(sprs, widths):
            u = (t - w['s'] + 0.04) / 0.22
            sc = 1.0 + (0.14 * (1 - ease_out(u)) if 0 <= u < 1 else 0) if active else 1.0
            sc *= 1.0 if spoken else 0.92
            al = (1.0 if spoken else 0.45) * ain * aout
            place(c, sp, x + ww / 2, CAPY + lift - (6 if active else 0), sc, al)
            x += ww + GAP

# ---------------------------------------------------------------- frame
def frame(fi):
    t = fi / FPS
    bg = background(t)
    bg = finish(bg, fi).convert('RGBA')
    overlays(bg, t)
    captions(bg, t)
    return bg.convert('RGB').tobytes()

def render(frames):
    return [frame(f) for f in frames]

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        os.makedirs(os.path.join(ROOT, 'test'), exist_ok=True)
        for tt in map(float, sys.argv[2:]):
            Image.frombytes('RGB', (W, H), frame(int(tt * FPS))).save(os.path.join(ROOT, 'test', f'f_{tt:05.2f}.jpg'), quality=88)
        sys.exit()
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'slow', '-b:v', '10M', '-maxrate', '14M', '-bufsize', '20M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                           os.path.join(ROOT, 'video_noaudio.mp4')], stdin=subprocess.PIPE)
    B = 12
    batches = [list(range(i, min(i + B, NF))) for i in range(0, NF, B)]
    with Pool(4) as p:
        for k, res in enumerate(p.imap(render, batches)):
            for fr in res: ff.stdin.write(fr)
            if k % 10 == 0: print(f'{(k + 1) * B}/{NF}', flush=True)
    ff.stdin.close(); ff.wait(); print('video ok')
