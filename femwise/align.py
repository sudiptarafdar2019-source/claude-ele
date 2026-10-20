import json, re, difflib
SCRIPT = ("PCOS hai? Toh kya roti aur chawal khana chhodna padega? Bilkul nahi! PCOS diagnose hote hi kitni girls apni favourite "
 "Indian foods se door ho jaati hain. Koi bolta hai carbs band karo, koi bolta hai rice mat khao. But aakhir sach kya hai? "
 "Sach toh yeh hai ki PCOS mein sirf kya kha rahe ho nahi, balki kya combination mein kha rahe ho woh bhi matter karta hai! "
 "Apni plate mein protein add karo, jaise dal, paneer, eggs ya curd! Saath mein seasonal vegetables aur roti ya rice ko balanced "
 "portion mein include karo. Aur haan, fibre-rich foods ko bhi apni diet ka part banao. Crash dieting nahi, extreme restrictions "
 "bhi nahi, focus karo balanced eating par. Ab chahiye aapko PCOS-friendly Indian diet ideas, jo ghar ke normal khane se ban sakein? "
 "Comment karo ‘DIET’ Aur follow Femwise Health, because next reel mein baat karenge PCOS mein breakfast ke liye kya khana chahiye "
 "aur kaunsi common mistakes avoid karni hain!")
toks = SCRIPT.split()
a3 = [w for w in json.load(open('asr3.json')) if w['s'] < 11.3]
a1 = [w for w in json.load(open('asr.json')) if w['s'] >= 15.9 and not (29.9 < w['s'] < 29.99)]
asr = a3 + a1
# manual: 11.3-15.5 (prompted ASR merged this line)
MAN = {i: v for i, v in zip(range(26, 40), [(11.16, 11.30), (11.80, 12.00), (12.00, 12.22), (12.22, 12.40), (12.40, 12.62), (12.75, 13.00), (13.05, 13.62),
        (13.88, 14.02), (14.02, 14.22), (14.22, 14.42), (14.42, 14.62), (14.68, 14.86), (14.92, 15.38), (15.86, 16.06)])}
def n(t): return re.sub(r'[^a-z]', '', t.lower())
SUB = {'thu': 'toh', 'chorna': 'chhodna', 'diagnosis': 'diagnose', 'kithni': 'kitni', 'favorite': 'favourite', 'food': 'foods',
       'ye': 'yeh', 'me': 'mein', 'kombination': 'combination', 'wo': 'woh', 'krta': 'karta', 'jyase': 'jaise', 'kurd': 'curd',
       'fiber': 'fibrerich', 'rich': '', 'focuss': 'focus', 'ap': 'ab', 'khaane': 'khane', 'sake': 'sakein', 'fem': 'femwise',
       'wise': '', 'konsi': 'kaunsi', 'karne': 'karni', 'khaana': 'khana', 'friendly': ''}
# merge hyphen pieces in asr
A = []
for w in asr:
    if w['w'].startswith('-') and A: A[-1]['e'] = w['e']; continue
    A.append(dict(w))
an = [SUB.get(n(w['w']), n(w['w'])) for w in A]
sn = [n(t) for t in toks]
sn = [x if x != 'pcosfriendly' else 'pcos' for x in sn]
sm = difflib.SequenceMatcher(None, sn, an, autojunk=False)
T = [None] * len(toks)
for blk in sm.get_matching_blocks():
    for k in range(blk.size): T[blk.a + k] = (A[blk.b + k]['s'], A[blk.b + k]['e'])
for i, v in MAN.items(): T[i] = v
T[77] = (29.78, 30.24)
# fuzzy fill for replace ops
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == 'replace' and i2 - i1 == j2 - j1:
        for k in range(i2 - i1):
            if T[i1 + k] is None: T[i1 + k] = (A[j1 + k]['s'], A[j1 + k]['e'])
# interpolate missing
for i in range(len(T)):
    if T[i] is None:
        j = i
        while T[j] is None: j += 1
        s0 = T[i - 1][1]; e1 = T[j][0]; k = j - i; d = (e1 - s0) / k
        for q in range(k): T[i + q] = (s0 + q * d, s0 + (q + 1) * d)
out = [{'w': t, 's': round(T[i][0], 3), 'e': round(T[i][1], 3)} for i, t in enumerate(toks)]
for i in range(1, len(out)):
    if out[i]['s'] < out[i - 1]['s']: print('ORDER', i, out[i])
json.dump(out, open('words.json', 'w'), indent=0)
for i, w in enumerate(out): print(i, f"{w['s']:6.2f} {w['e']:6.2f} {w['w']}")
