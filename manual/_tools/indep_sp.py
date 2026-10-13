#!/usr/bin/env python3
"""위생배관 v5.0.10~ 독립 구현 — usage: python3 indep_sp.py <raw폴더>(cases.json · app_out.json)
    — 근거표(IPC 2021 부록 E · KDS 31 30 25 · KDS 31 30 15)에서 직접 다시 짠 계산.
앱 코드는 참조하지 않는다. 앱 결과(app_out.json)와 항목별 대조."""
import json, math, sys
from bisect import bisect_left

def jround(x, d=0):            # JS Math.round(x*10^d)/10^d
    k = 10 ** d
    return math.floor(x * k + 0.5) / k

# IPC 2021 Table E103.3(2): (private total, private hot, public total, public hot)
WSFU = {
 'wc_tank': (2.2, 0, 5.0, 0), 'wc_valve': (6.0, 0, 10.0, 0), 'urinal': (5.0, 0, 5.0, 0),
 'lav': (0.7, 0.5, 2.0, 1.5), 'sink_kit': (1.4, 1.0, 4.0, 3.0), 'sink_svc': (3.0, 2.25, 3.0, 2.25),
 'bathtub': (1.4, 1.0, 4.0, 3.0), 'shower': (1.4, 1.0, 4.0, 3.0), 'bid': (2.0, 1.5, 2.0, 1.5),
 'washer': (1.4, 1.0, 3.0, 2.25), 'dishwash': (1.4, 1.4, 1.4, 1.4), 'fountain': (0.25, 0, 0.25, 0),
 'floordr': (0, 0, 0, 0), 'mop_sink': (3.0, 2.25, 3.0, 2.25)}
FLUSHOMETER = {'wc_valve', 'urinal'}
# KDS 31 30 15 표 4.3-1 최저 필요수압
PMIN = {'wc_valve': 100, 'urinal': 100, 'shower': 70, 'floordr': 0}
# KDS 31 30 25 표 4.1-2  (일반, 다중, 공동, 단독), None = 빈 칸 ; 트랩 DN
DFU = {
 'wc_tank': ((4, 6, 3, 3), 80), 'wc_valve': ((4, 6, 3, 3), 80), 'urinal': ((4, 5, None, None), 40),
 'lav': ((1, 1, 1, 1), 32), 'sink_kit': ((2, None, None, 2), 40), 'sink_svc': ((3, None, None, None), 80),
 'bathtub': ((None, None, 2, 2), 40), 'shower': ((2, None, 2, 2), 50), 'bid': ((None,) * 4, 32),
 'washer': ((3, None, 3, 3), 50), 'dishwash': ((2, None, 2, 2), 40), 'fountain': ((0.5, None, None, None), 32),
 'floordr': ((None,) * 4, 50), 'mop_sink': ((3, None, None, None), 80)}
T413 = {32: 1, 40: 2, 50: 3, 65: 4, 80: 5, 100: 6}
COL = {'office': 0, 'store': 0, 'factory': 0, 'restaurant': 0, 'parking': 0,
       'hotel': 1, 'hospital': 1, 'school': 1, 'church': 1, 'gym': 1, 'apt': 2, 'house': 3}
OSU = {'wc_tank', 'wc_valve', 'urinal'}

# IPC Table E103.3(3)
E3 = """1 3.0 - 2 5.0 - 3 6.5 - 4 8.0 - 5 9.4 15.0 6 10.7 17.4 7 11.8 19.8 8 12.8 22.2 9 13.7 24.6 10 14.6 27.0
11 15.4 27.8 12 16.0 28.6 13 16.5 29.4 14 17.0 30.2 15 17.5 31.0 16 18.0 31.8 17 18.4 32.6 18 18.8 33.4
19 19.2 34.2 20 19.6 35.0 25 21.5 38.0 30 23.3 42.0 35 24.9 44.0 40 26.3 46.0 45 27.7 48.0 50 29.1 50.0
60 32.0 54.0 70 35.0 58.0 80 38.0 61.2 90 41.0 64.3 100 43.5 67.5 120 48.0 73.0 140 52.5 77.0 160 57.0 81.0
180 61.0 85.5 200 65.0 90.0 225 70.0 95.5 250 75.0 101.0 275 80.0 104.5 300 85.0 108.0 400 105.0 127.0
500 124.0 143.0 750 170.0 177.0 1000 208 208 1250 239 239 1500 269 269 1750 297 297 2000 325 325
2500 380 380 3000 433 433 4000 525 525 5000 593 593""".split()
E3 = [(float(E3[i]), float(E3[i + 1]), None if E3[i + 2] == '-' else float(E3[i + 2])) for i in range(0, len(E3), 3)]

def demand_lpm(load, valve):
    if load <= 0: return 0.0
    pts = [(a, (c if valve else b)) for a, b, c in E3 if (c if valve else b) is not None]
    xs = [a for a, _ in pts]
    if load <= xs[0]: g = pts[0][1]
    elif load > xs[-1]:
        (x0, y0), (x1, y1) = pts[-2], pts[-1]; g = y1 + (load - x1) * (y1 - y0) / (x1 - x0)
    else:
        i = bisect_left(xs, load)
        if xs[i] == load: g = pts[i][1]
        else:
            (x0, y0), (x1, y1) = pts[i - 1], pts[i]; g = y0 + (load - x0) * (y1 - y0) / (x1 - x0)
    g = jround(g, 2)
    return jround(g * 3.785, 1)

SUP_DN = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300]
def dn_vel(q, v):
    if q <= 0 or v <= 0: return 15
    need = math.sqrt(4 * q / 60000 / v / math.pi) * 1000
    return next((d for d in SUP_DN if d >= need), 300)

# KDS 31 30 25 표 4.1-5 / 4.1-4
DN = [32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 375]
HB  = dict(zip(DN, [1, 3, 6, 12, 20, 160, 360, 620, 1400, 2500, 3900, 7000]))
S1  = dict(zip(DN, [1, 2, 6, 9, 20, 90, 200, 350, 600, 1000, 1500, None]))
S3  = dict(zip(DN, [1, 4, 10, 20, 48, 240, 540, 960, 2200, 3800, 6000, None]))
S4  = dict(zip(DN, [1, 8, 24, 42, 72, 500, 1100, 1900, 3600, 5600, 8400, None]))
BD = {32: (None, None, 1), 40: (None, None, 3), 50: (None, None, 21), 65: (None, None, 24), 80: (None, 36, 42),
      100: (None, 180, 216), 125: (None, 390, 480), 150: (None, 700, 840), 200: (1400, 1600, 1920),
      250: (2500, 2900, 3500), 300: (3900, 4600, 5600), 375: (7000, 8300, 10000)}
def bd_cap(dn):   # 표 4.1-1 최소 기울기 열
    slope = 2 if dn <= 65 else (1 if dn <= 150 else 0)
    return BD[dn][slope]

def first(lo, cond):
    for d in DN:
        if d >= lo and cond(d): return d
    return None

def drain(load, floors, wc, trap):
    if load <= 0: return None
    n = max(1, floors); per = jround(load / n, 2)
    br = first(max(32, trap or 32), lambda d: HB[d] >= per)
    def st_ok(d):
        if n <= 3: return S3[d] is not None and S3[d] >= load
        return S4[d] is not None and S4[d] >= load and S1[d] is not None and S1[d] >= per
    st = first(max(br or 32, 80 if wc else 32), st_ok)
    bd = first(max(st or 32, 80 if wc else 32), lambda d: bd_cap(d) is not None and bd_cap(d) >= load)
    vs = None if st is None else first(32, lambda d: d > st / 2)
    vl = None if br is None else first(32, lambda d: d >= br / 2)
    vi = first(32, lambda d: d >= (trap or 32) / 2)
    return dict(load=jround(load, 2), perFloor=per, branch=br, stack=st, bldg=bd, ventStack=vs, ventLoop=vl, ventIndiv=vi)

C = {'sgp': 100, 'stp': 130, 'cu': 130, 'ppc': 150, 'xlpe': 150}

def calc(c):
    priv = c['usage'] == 'private'; col = COL[c['b']]
    fs = fh = 0.0; valve = False; req = 0
    loads = {'all': 0.0, 'osu': 0.0, 'jab': 0.0}; traps = {'all': 0, 'osu': 0, 'jab': 0}; wc = {'all': False, 'osu': False}
    for fid, q in c['q'].items():
        s, h = q['supply'], q['hot']; w = WSFU[fid]
        fs += (w[0] if priv else w[2]) * s; fh += (w[1] if priv else w[3]) * h
        if s > 0 and fid in FLUSHOMETER: valve = True
        n = max(s, h)
        if n > 0:
            req = max(req, PMIN.get(fid, 55))
            vals, trap = DFU[fid]
            v = vals[col] if vals[col] is not None else (vals[0] if vals[0] is not None else T413[trap])
            g = 'osu' if fid in OSU else 'jab'
            for k in ('all', g):
                loads[k] += v * n; traps[k] = max(traps[k], trap)
            if fid in ('wc_tank', 'wc_valve'): wc['all'] = wc['osu'] = True
    fs, fh = jround(fs, 2), jround(fh, 2)
    fd = jround(loads['all'], 2)
    if fs == 0 and fh == 0 and fd == 0: return None
    qs = demand_lpm(fs, valve); qh = demand_lpm(fh, False)
    sup = dn_vel(qs, c['vel']); hot = dn_vel(qh, c['vel'])  # v5.0.11 점도계수 삭제
    L = c['floors'] * c['ht'] * 1.5
    frl = 0 if qs <= 0 else jround((10.67 * L * (qs / 60000) ** 1.852) / (C[c['mat']] ** 1.852 * (sup / 1000) ** 4.87) * 9.81, 1)
    sh = jround(c['floors'] * c['ht'] * 9.81)
    top = jround(c['p'] - sh - frl)
    fl = c['floors']
    bot = sh if c['method'] == 'gravity' else jround(c['p'])
    return dict(fuS=fs, fuH=fh, fuD=fd, curve='valve' if valve else 'tank', qwS=qs, qwH=qh, sup=sup, hot=hot, reqP=req,
                topP=top, frl=frl, botP=bot, prv=bot >= 550,
                circ=(c['circ']=='yes') or (c['circ']=='auto' and c['floors']*c['ht']*1.3 > 15),
                all=drain(loads['all'], fl, wc['all'], traps['all']),
                osu=drain(loads['osu'], fl, wc['osu'], traps['osu']),
                jab=drain(loads['jab'], fl, False, traps['jab']))

D_ = sys.argv[1] if len(sys.argv) > 1 else '.'
cases = json.load(open(D_ + '/cases.json')); app = json.load(open(D_ + '/app_out.json'))
bad = {}; total = 0; cnt = {}
for i, (c, a) in enumerate(zip(cases, app)):
    e = calc(c)
    if e is None or a is None:
        if (e is None) != (a is None): bad.setdefault('null', []).append(i)
        continue
    for k, v in e.items():
        total += 1
        av = a[k]
        if isinstance(v, dict) or v is None or isinstance(av, dict) or av is None:
            ok = (v is None and av is None) or (v is not None and av is not None and all(
                (abs(v[x] - av[x]) < 1e-9 if isinstance(v[x], (int, float)) and av[x] is not None else v[x] == av[x]) for x in v))
        elif isinstance(v, float) or isinstance(av, float):
            ok = abs(v - av) < 1e-9
        else:
            ok = v == av
        if not ok: bad.setdefault(k, []).append(i)
# 범위 통계
st = {'valve': sum(1 for a in app if a and a['curve'] == 'valve'), 'none': sum(1 for a in app if a is None),
      'over': sum(1 for a in app if a and a['all'] and a['all']['bldg'] is None),
      'fuS_max': max(a['fuS'] for a in app if a), 'fuD_max': max(a['fuD'] for a in app if a)}
print('cases', len(cases), 'checks', total, 'mismatch', {k: len(v) for k, v in bad.items()}, st)
for k, v in bad.items():
    i = v[0]; print(k, i, 'exp', calc(cases[i])[k] if k != 'null' else '', 'app', app[i][k] if k != 'null' and app[i] else app[i])
sys.exit(1 if bad else 0)
