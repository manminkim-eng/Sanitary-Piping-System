# 유량 곡선 · 배수 함수 전 구간 대조 — usage: python3 sweep_cmp.py <raw폴더>(sweep.json)
import json, sys, os
H = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(H, 'indep_sp.py'), encoding='utf-8').read().split('D_ = sys.argv')[0]
exec(src)
S = json.load(open(sys.argv[1] + '/sweep.json'))
bq = sum(1 for L, t, v in S['Q'] if demand_lpm(L, False) != t or demand_lpm(L, True) != v)
bd = 0
for L, f, w, t, *r in S['D']:
    e = drain(L, f, w, t); bd += [e['branch'], e['stack'], e['bldg'], e['ventStack'], e['ventLoop'], e['ventIndiv']] != r
print('유량', len(S['Q']), '불일치', bq, '| 배수·통기', len(S['D']), '불일치', bd); sys.exit(1 if bq or bd else 0)
