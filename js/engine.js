/* ═══════════════════════════════════════════════════
   위생배관 관경 산정 — 공통 엔진 (engine.js)
   MANMIN-Ver2.0 · 기계설비 기술기준 국토교통부 고시 제2021-851호
═══════════════════════════════════════════════════ */

/* ── 건물 용도 ── */
const BUILDING_TYPES = [
  {id:'office',    ico:'🏢', nm:'사무소',    cat:'업무',  usage:'public'},
  {id:'apt',       ico:'🏠', nm:'아파트',    cat:'공동주택',usage:'private'},
  {id:'house',     ico:'🏡', nm:'단독주택',  cat:'주거',  usage:'private'},
  {id:'hotel',     ico:'🏨', nm:'호텔/숙박', cat:'숙박',  usage:'public'},
  {id:'hospital',  ico:'🏥', nm:'병원/의원', cat:'의료',  usage:'public'},
  {id:'school',    ico:'🏫', nm:'학교',      cat:'교육',  usage:'public'},
  {id:'store',     ico:'🏬', nm:'판매시설',  cat:'상업',  usage:'public'},
  {id:'restaurant',ico:'🍽️',nm:'음식점',    cat:'식품',  usage:'public'},
  {id:'factory',   ico:'🏭', nm:'공장',      cat:'산업',  usage:'public'},
  {id:'church',    ico:'⛪', nm:'종교시설',  cat:'집회',  usage:'public'},
  {id:'gym',       ico:'🏋️',nm:'스포츠',    cat:'운동',  usage:'public'},
  {id:'parking',   ico:'🅿️',nm:'주차장',    cat:'기타',  usage:'public'},
];

/* ── 위생기구 FU 데이터 ── */
const FIXTURES = [
  {id:'wc_tank',   ico:'🚽', nm:'양변기(세정탱크)',  cat:'wc',      fps:3, fpu:5,  fhs:0, fhu:0, fd:4,  trap:'P75mm',  dtype:'오수'},
  {id:'wc_valve',  ico:'🚽', nm:'양변기(세정밸브)',  cat:'wc',      fps:6, fpu:10, fhs:0, fhu:0, fd:6,  trap:'P75mm',  dtype:'오수'},
  {id:'urinal',    ico:'🚾', nm:'소변기',            cat:'wc',      fps:3, fpu:5,  fhs:0, fhu:0, fd:3,  trap:'P50mm',  dtype:'오수'},
  {id:'lav',       ico:'🚿', nm:'세면기',            cat:'wc',      fps:1, fpu:2,  fhs:1, fhu:2, fd:2,  trap:'P40mm',  dtype:'잡배수'},
  {id:'sink_kit',  ico:'🍽️',nm:'싱크대(주방)',      cat:'kitchen', fps:2, fpu:4,  fhs:1, fhu:2, fd:3,  trap:'P50mm',  dtype:'잡배수'},
  {id:'sink_svc',  ico:'🪣', nm:'청소싱크',          cat:'util',    fps:2, fpu:3,  fhs:0, fhu:0, fd:3,  trap:'P75mm',  dtype:'잡배수'},
  {id:'bathtub',   ico:'🛁', nm:'욕조',              cat:'bath',    fps:2, fpu:4,  fhs:2, fhu:4, fd:3,  trap:'P50mm',  dtype:'잡배수'},
  {id:'shower',    ico:'🚿', nm:'샤워기',            cat:'bath',    fps:2, fpu:4,  fhs:2, fhu:4, fd:2,  trap:'P50mm',  dtype:'잡배수'},
  {id:'bid',       ico:'🚿', nm:'비데/좌욕기',       cat:'bath',    fps:1, fpu:2,  fhs:1, fhu:2, fd:2,  trap:'P40mm',  dtype:'잡배수'},
  {id:'washer',    ico:'🫧', nm:'세탁기',            cat:'util',    fps:2, fpu:4,  fhs:0, fhu:0, fd:3,  trap:'P50mm',  dtype:'잡배수'},
  {id:'dishwash',  ico:'🍽️',nm:'식기세척기',        cat:'kitchen', fps:2, fpu:4,  fhs:1, fhu:2, fd:2,  trap:'P50mm',  dtype:'잡배수'},
  {id:'fountain',  ico:'💧', nm:'음수대',            cat:'util',    fps:1, fpu:2,  fhs:0, fhu:0, fd:2,  trap:'P32mm',  dtype:'잡배수'},
  {id:'floordr',   ico:'⬛', nm:'바닥배수(욕실)',    cat:'bath',    fps:0, fpu:0,  fhs:0, fhu:0, fd:2,  trap:'P50mm',  dtype:'잡배수'},
  {id:'mop_sink',  ico:'🪣', nm:'걸레받이',          cat:'util',    fps:1, fpu:2,  fhs:0, fhu:0, fd:3,  trap:'P75mm',  dtype:'잡배수'},
];

/* ── 관재질 계수 ── */
const HW_C       = { sgp:100, stp:130, cu:130, ppc:150, xlpe:150 };
const MANNING_N  = { cast:0.013, vpvc:0.010, pvc:0.010 };
const STD_PIPES  = [15,20,25,32,40,50,65,80,100,125,150,200];

/* ── FU → 관경 표 ── */
const SUPPLY_PIPE_TABLE = [
  [0,   1,   15, 12,  '단독 기구 공급'],
  [2,   3,   20, 20,  '소규모 화장실'],
  [4,   8,   25, 35,  '소형 주거/사무소'],
  [9,   16,  32, 55,  '중소형 공용 화장실'],
  [17,  30,  40, 80,  '중형 사무소/호텔'],
  [31,  55,  50, 130, '대형 공용 화장실'],
  [56,  100, 65, 200, '대규모 건물'],
  [101, 200, 80, 320, '대형 호텔/병원'],
  [201, 400, 100,500, '초대형 건물'],
  [401, 750, 125,800, '복합 대형건물'],
  [751,1500, 150,1200,'초대형 복합건물'],
];
const DRAIN_PIPE_TABLE = [
  [0,   1,   30,  40,  30, 30,  '단독 기구'],
  [2,   3,   40,  50,  32, 40,  '소규모'],
  [4,   6,   50,  75,  40, 40,  '소형 화장실'],
  [7,   14,  65,  75,  40, 50,  '중소형'],
  [15,  27,  75,  100, 50, 65,  '중형'],
  [28,  55,  100, 100, 65, 75,  '대형 화장실'],
  [56,  110, 100, 125, 65, 75,  '대규모'],
  [111, 220, 125, 150, 75, 100, '초대형'],
  [221, 500, 150, 150, 100,125, '대형건물'],
  [501, 1100,200, 200, 100,150, '초대형건물'],
];

/* ── 공유 상태 ── */
const STATE = {
  buildingId:'office', usage:'public',
  floors:5, floorHeight:3.0,
  fixtureQty:{},
  matSupply:'stp', matDrain:'vpvc',
  velSupply:1.5, pressure:300, hwTemp:60, circ:'auto',
  projName:'만민 건축사 신사옥 신축공사', projDate:'',
  result: null,
};

/* ══════════════════════════════════════
   핵심 계산 함수
══════════════════════════════════════ */
function designFlow(fu){
  if(fu <= 0) return 0;
  return Math.round(0.6 * Math.pow(fu, 0.6) * 10) / 10;
}
function pipeByVelocity(qLpm, velMs){
  if(qLpm <= 0 || velMs <= 0) return STD_PIPES[0];
  const qM3s = qLpm / 60000;
  const aNeed = qM3s / velMs;
  const dNeed = Math.sqrt(4 * aNeed / Math.PI) * 1000;
  for(const d of STD_PIPES){ if(d >= dNeed) return d; }
  return STD_PIPES[STD_PIPES.length-1];
}
function maxPipe(a, b){ return Math.max(a, b); }
function staticHead(floors, floorHt){ return Math.round(floors * floorHt * 9.81); }
function frictionLoss(qLpm, dA, C, floors, floorHt){
  if(qLpm <= 0 || dA <= 0) return 0;
  const qM3s = qLpm / 60000, dM = dA / 1000;
  const L = floors * floorHt * 1.5;
  const hf = (10.67 * L * Math.pow(qM3s, 1.852)) / (Math.pow(C, 1.852) * Math.pow(dM, 4.87));
  return Math.round(hf * 9.81 * 10) / 10;
}
function topFloorPressure(supplyKpa, floors, floorHt, qLpm, dA, C){
  return Math.round(supplyKpa - staticHead(floors, floorHt) - frictionLoss(qLpm, dA, C, floors, floorHt));
}
function circJudge(floors, floorHt, manualCirc){
  if(manualCirc === 'yes') return true;
  if(manualCirc === 'no')  return false;
  return (floors * floorHt * 1.3) > 15;
}
function prvNeeded(supplyKpa, floors, floorHt){
  const extraP = floors > 10 ? floors * floorHt * 9.81 * 0.3 : 0;
  return (supplyKpa + extraP) > 550 || supplyKpa > 550;
}
function hwViscosityFactor(tempC){ return tempC >= 55 ? 1.0 : 1.02; }
function calcTotalFU(){
  let fuS=0, fuH=0, fuD=0, fuOsu=0, fuJabsu=0;
  FIXTURES.forEach(f=>{
    const qty = STATE.fixtureQty[f.id] || {supply:0, hot:0};
    const fps = STATE.usage==='private' ? f.fps : f.fpu;
    const fhs = STATE.usage==='private' ? f.fhs : f.fhu;
    const drainQty = Math.max(qty.supply, qty.hot);
    fuS += fps * qty.supply;
    fuH += fhs * qty.hot;
    const fd = f.fd * drainQty;
    fuD += fd;
    if(f.dtype === '오수') fuOsu += fd; else fuJabsu += fd;
  });
  return {fuS, fuH, fuD, fuOsu, fuJabsu};
}
function getPipeSize(fu, table, col){
  for(const row of table){
    if(fu >= row[0] && fu <= row[1]) return row[col];
  }
  if(fu > table[table.length-1][1]) return table[table.length-1][col];
  return table[0][col];
}

/* ── 메인 계산 ── */
function runCalc(){
  const C = HW_C[STATE.matSupply] || 130;
  const {fuS, fuH, fuD, fuOsu, fuJabsu} = calcTotalFU();
  const totalH   = Math.round(STATE.floors * STATE.floorHeight * 10) / 10;
  const sh       = staticHead(STATE.floors, STATE.floorHeight);
  const isCirc   = circJudge(STATE.floors, STATE.floorHeight, STATE.circ);
  const isPRV    = prvNeeded(STATE.pressure, STATE.floors, STATE.floorHeight);
  const estHWLen = Math.round(STATE.floors * STATE.floorHeight * 1.3 * 10) / 10;

  if(fuS === 0 && fuH === 0 && fuD === 0){
    STATE.result = null;
    return null;
  }

  const fuPipeSupply = getPipeSize(fuS, SUPPLY_PIPE_TABLE, 2);
  const fuPipeHot    = getPipeSize(fuH, SUPPLY_PIPE_TABLE, 2);
  const drainHoriz   = getPipeSize(fuD, DRAIN_PIPE_TABLE, 2);
  const drainVert    = getPipeSize(fuD, DRAIN_PIPE_TABLE, 3);
  const ventIndiv    = getPipeSize(fuD, DRAIN_PIPE_TABLE, 4);
  const ventLoop     = getPipeSize(fuD, DRAIN_PIPE_TABLE, 5);
  const qwS = designFlow(fuS);
  const qwH = designFlow(fuH);
  const velPipeSupply = pipeByVelocity(qwS, STATE.velSupply);
  const velPipeHot    = pipeByVelocity(qwH * hwViscosityFactor(STATE.hwTemp), STATE.velSupply);
  const supplyMain = maxPipe(fuPipeSupply, velPipeSupply);
  const hotMain    = maxPipe(fuPipeHot, velPipeHot);
  const frlS   = frictionLoss(qwS, supplyMain, C, STATE.floors, STATE.floorHeight);
  const topP   = topFloorPressure(STATE.pressure, STATE.floors, STATE.floorHeight, qwS, supplyMain, C);
  const botP   = STATE.pressure;

  let drainVertFinal = drainVert;
  if(STATE.floors > 5 && STATE.floors <= 15){
    const idx = DRAIN_PIPE_TABLE.findIndex(r => fuD >= r[0] && fuD <= r[1]);
    if(idx >= 0 && idx < DRAIN_PIPE_TABLE.length-1) drainVertFinal = DRAIN_PIPE_TABLE[idx+1][3];
  } else if(STATE.floors > 15){
    const idx = DRAIN_PIPE_TABLE.findIndex(r => fuD >= r[0] && fuD <= r[1]);
    if(idx >= 0) drainVertFinal = DRAIN_PIPE_TABLE[Math.min(idx+2, DRAIN_PIPE_TABLE.length-1)][3];
  }

  STATE.result = {
    fuS, fuH, fuD, fuOsu, fuJabsu, qwS, qwH,
    supplyMain, hotMain,
    fuPipeSupply, velPipeSupply, fuPipeHot, velPipeHot,
    drainHoriz, drainVert: drainVertFinal, ventIndiv, ventLoop,
    topP, botP, frlS, sh, totalH, isCirc, isPRV, estHWLen,
    C, velSupply: STATE.velSupply,
  };
  return STATE.result;
}

/* ── 유틸 ── */
function matName(m){
  return {sgp:'아연도강관(SGP)', stp:'배관용강관(STP)', cu:'동관', ppc:'PP-C', xlpe:'PEX관'}[m] || m;
}
function drainMatName(m){
  return {cast:'주철관', vpvc:'경질VP관', pvc:'PVC관'}[m] || m;
}
function showToast(msg){
  const t = document.getElementById('toastMsg');
  if(!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}
function markStep(n, done, active){
  const sc = document.getElementById('sc'+n);
  const sl = document.getElementById('sl'+n);
  const sd = document.getElementById('sd'+n);
  if(!sc) return;
  sc.className = 'sc' + (done?' done':(active?' active':''));
  sl.className = 'sl' + (done?' done':(active?' active':''));
  if(sd) sd.className = 'sdiv' + (done?' done':'');
}
function setEl(id, val){
  const e = document.getElementById(id);
  if(e) e.textContent = val;
}
function getEl(id){ return document.getElementById(id); }

/* ── PWA / SW ── */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}
let _deferredInstall;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); _deferredInstall = e;
  document.querySelectorAll('.btn-install').forEach(b => b.style.display='flex');
});
function triggerInstall(){
  if(!_deferredInstall) return;
  _deferredInstall.prompt();
  _deferredInstall.userChoice.then(r => {
    if(r.outcome==='accepted') showToast('✅ 앱 설치 완료!');
    _deferredInstall = null;
    document.querySelectorAll('.btn-install').forEach(b => b.style.display='none');
  });
}
