# -*- coding: utf-8 -*-
"""매뉴얼 검사 — usage: python verify_manual_sp.py <repoDir>
   ① 그림 파일·표시점 ② 범례 수 = 표시점 수 ③ 예제 결과·산식이 본문에 있음 ④ 내부 링크 ⑤ 앱 근거 표기(v5.0.12)"""
import sys, os, re, json, math
repo = sys.argv[1]; M = os.path.join(repo, 'manual'); ok = True
def chk(name, cond, info=''):
    global ok; ok &= bool(cond); print(('✓' if cond else '✗'), name, info)
h = open(os.path.join(M, 'index.html'), encoding='utf-8').read()
marks = json.load(open(os.path.join(M, 'images', '_marks.json'), encoding='utf-8'))
ex = json.load(open(os.path.join(M, '_tools', '_example.json'), encoding='utf-8'))
figs = re.findall(r'<figure class="shot[^"]*" id="fig-([^"]+)">(.*?)</figure>', h, re.S)
chk('그림 수 = 캡처 수', len(figs) == len(marks), f'{len(figs)}/{len(marks)}')
chk('그림 파일 존재', all(os.path.exists(os.path.join(M, 'images', k + '.webp')) for k in marks))
out = [f'{k}:{m["label"]}' for k, v in marks.items() for m in v['marks'] if 'x' not in m or m['x'] < 0 or m['y'] < 0 or m['x'] + m['w'] > 100.5 or m['y'] + m['h'] > 100.5]
chk('표시점이 이미지 안', not out, str(out[:5]))
bad = [sid for sid, body in figs if len(re.findall(r'<li><b>', body)) != len(marks[sid]['marks'])]
chk('범례 수 = 표시점 수', not bad, str(bad))
A, B = ex['A'], ex['B']
n = lambda x: f'{x:,.2f}'.rstrip('0').rstrip('.')
need = []
for e in (A, B):
    need += [f"DN {e['sup']}", f"DN {e['hot']}", f"{n(e['qwS'])} L/min", f"{n(e['fuS'])}", f"{n(e['fuD'])}", f"{e['topP']} kPa", f"DN {e['all']['stack']}", f"DN {e['all']['bldg']}"]
miss = [x for x in need if x not in h]
chk('예제 결과가 본문에 있음', not miss, f'{len(need)}개 ' + str(miss))
# 손계산 재확인(앱과 독립): 기구 행 합 · 유량 · 유속 관경
for nm, e in (('A', A), ('B', B)):
    s = round(sum(r['s'] * r['wt'] for r in e['rows']), 2); hh = round(sum(r['h'] * r['wh'] for r in e['rows']), 2); d = round(sum(max(r['s'], r['h']) * r['dfu'] for r in e['rows']), 2)
    chk(f'예제 {nm} 부하 합(행 합 = 결과)', (s, hh, d) == (e['fuS'], e['fuH'], e['fuD']), f'{s} {hh} {d}')
    D = math.sqrt(4 * e['qwS'] / 60000 / e['vel'] / math.pi) * 1000
    chk(f'예제 {nm} 유속 관경', e['sup'] == next(x for x in [15,20,25,32,40,50,65,80,100,125,150,200,250,300] if x >= D), f'D={D:.1f}')
chk('예제 A 77.7 mm 문구', f"{math.sqrt(4 * A['qwS'] / 60000 / A['vel'] / math.pi) * 1000:.1f}" == '77.7')
chk('예제 A 수압 적합 · B 부족', A['ok'] and not B['ok'])
ids = set(re.findall(r'id="([^"]+)"', h)); links = set(re.findall(r'href="#([^"]+)"', h))
chk('내부 링크', links <= ids, str(sorted(links - ids)[:5]))
h_ = re.sub(r'<h3 id="s4-12">.*?</section>', '', h, flags=re.S)   # 정정 내역 표(기존 열)는 제외
chk('매뉴얼 — 옛 표기 없음(정정 내역 표 밖)', not re.search(r'일부개정|0\.6 ?× ?FU|별표 4\]|30A|75A', h_))
app = open(os.path.join(repo, 'index.html'), encoding='utf-8').read()
chk('앱 — 매뉴얼 버튼', 'class="tb tb-manual"' in app and 'Sanitary-Piping-System/manual/' in app)
chk('앱 — 근거 표(IPC · KDS)', '[300,85.0,108.0]' in app and '100:[160,90,240,500]' in app and '100:[null,180,216,250]' in app)
sw = open(os.path.join(repo, 'sw.js'), encoding='utf-8').read()
chk("sw — sanpipe-v5.0.12", "'sanpipe-v5.0.12'" in sw)
sys.exit(0 if ok else 1)
