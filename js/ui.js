/* ═══════════════════════════════════════════════════
   위생배관 관경 산정 — UI 렌더 함수 (ui.js)
   MANMIN-Ver2.0
═══════════════════════════════════════════════════ */

/* ── 건물 유형 그리드 렌더 ── */
function renderBuildingGrid(containerId){
  const g = getEl(containerId);
  if(!g) return;
  g.innerHTML = BUILDING_TYPES.map(b => `
    <button class="bld-btn${STATE.buildingId===b.id?' active':''}"
      onclick="selectBuilding('${b.id}','${containerId}')">
      <div class="bld-ico">${b.ico}</div>
      <div class="bld-nm">${b.nm}</div>
    </button>`).join('');
}
function selectBuilding(id, gridId){
  STATE.buildingId = id;
  const b = BUILDING_TYPES.find(x=>x.id===id);
  if(b){
    STATE.usage = b.usage;
    const sel = getEl('sel-usage');
    if(sel) sel.value = b.usage;
  }
  // update grid visuals
  const g = getEl(gridId || 'bldGrid');
  if(g) g.querySelectorAll('.bld-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.textContent.includes(b.nm));
  });
  // re-render grid properly
  if(g) g.innerHTML = BUILDING_TYPES.map(bx=>`
    <button class="bld-btn${STATE.buildingId===bx.id?' active':''}"
      onclick="selectBuilding('${bx.id}','${gridId||'bldGrid'}')">
      <div class="bld-ico">${bx.ico}</div>
      <div class="bld-nm">${bx.nm}</div>
    </button>`).join('');
  // badge
  const badge = getEl('bld-badge');
  if(badge && b){ badge.textContent = b.nm; badge.className='badge badge-grn'; }
  liveCalc();
}

/* ── 기구 입력 그리드 렌더 ── */
function renderFixtureGrid(containerId, cat){
  const g = getEl(containerId || 'fixtureGrid');
  if(!g) return;
  const list = cat&&cat!=='all' ? FIXTURES.filter(f=>f.cat===cat) : FIXTURES;
  g.innerHTML = list.map(f=>{
    const qty = STATE.fixtureQty[f.id] || {supply:0, hot:0};
    const fuVal = STATE.usage==='private' ? f.fpu : f.fpu; // always show public FU label
    const hasActive = qty.supply > 0 || qty.hot > 0;
    return `<div class="fixture-row${hasActive?' active':''}">
      <div class="fx-name">
        <span class="fx-ico">${f.ico}</span>
        <span>${f.nm}</span>
        <span class="fx-fu-badge">FU:${fuVal}</span>
      </div>
      <input type="number" class="fx-input" value="${qty.supply}" min="0"
        placeholder="급수" oninput="updateFixture('${f.id}','supply',this.value,'${containerId||'fixtureGrid'}')">
      <input type="number" class="fx-input${f.fhu===0?' ':''}" value="${qty.hot}" min="0"
        placeholder="급탕" ${f.fhu===0?'disabled':''} 
        oninput="updateFixture('${f.id}','hot',this.value,'${containerId||'fixtureGrid'}')">
    </div>`;
  }).join('');
}
function updateFixture(id, type, val, gridId){
  if(!STATE.fixtureQty[id]) STATE.fixtureQty[id] = {supply:0, hot:0};
  STATE.fixtureQty[id][type] = Math.max(0, parseInt(val)||0);
  liveCalc();
}
function filterFixtures(cat, btn, containerId){
  document.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderFixtureGrid(containerId, cat);
}

/* ── FU 뱃지 업데이트 ── */
function updateFuBadge(fuS, fuH, fuD){
  setEl('fu-badge-total', `FU급:${fuS} / 탕:${fuH} / 배:${fuD}`);
  const b = getEl('fu-badge-total');
  if(b) b.className = (fuS>0||fuH>0||fuD>0) ? 'badge badge-org' : 'badge badge-teal';
}

/* ── 결과 렌더 ── */
function renderResult(r){
  const ph = getEl('result-placeholder');
  const rc = getEl('result-content');
  const rb = getEl('result-badge');
  if(!r){
    if(ph) ph.style.display='';
    if(rc) rc.style.display='none';
    if(rb){ rb.textContent='대기'; rb.className='badge badge-teal'; }
    return;
  }
  if(ph) ph.style.display='none';
  if(rc) rc.style.display='';
  if(rb){ rb.textContent='✅ 완료'; rb.className='badge badge-grn'; }

  // Stat grid
  setEl('r-fuS', r.fuS); setEl('r-fuH', r.fuH); setEl('r-fuD', r.fuD);
  setEl('r-qwS', r.qwS+'L/m'); setEl('r-topP', r.topP+'kPa'); setEl('r-frlS', r.frlS+'kPa');

  // Hero results
  setEl('r-supply-main', r.supplyMain+'A');
  setEl('r-hot-main', r.hotMain+'A');
  setEl('r-drain-horiz', r.drainHoriz+'A');
  setEl('r-drain-vert', r.drainVert+'A');
  setEl('r-vent-indiv', r.ventIndiv+'A');
  setEl('r-vent-loop', r.ventLoop+'A');

  // Supply table
  buildSupplyTableHTML('supply-table-body', r, 'supply');
  buildSupplyTableHTML('hot-table-body', r, 'hot');
  buildDrainTableHTML('drain-table-body', r);
  buildVentTableHTML('vent-table-body', r);

  // Conditions
  setEl('r-circ', r.isCirc ? '⚠️ 환탕 필요' : '✅ 환탕 불필요');
  setEl('r-prv',  r.isPRV  ? '🔴 감압밸브 필요' : '✅ 감압밸브 불필요');
  setEl('r-topPressure', `${r.topP} kPa ${r.topP<50?'🔴 부족':r.topP<100?'⚠️ 주의':'✅'}`);
  setEl('r-botPressure', `${r.botP} kPa ${r.botP>550?'🔴 초과':'✅'}`);

  markStep(4, true, false);
  markStep(3, true, false);
  markStep(2, true, false);
  markStep(1, true, false);
}

function buildSupplyTableHTML(tbodyId, r, type){
  const tb = getEl(tbodyId); if(!tb) return;
  const fu       = type==='supply' ? r.fuS : r.fuH;
  const qw       = type==='supply' ? r.qwS : r.qwH;
  const fuPipe   = type==='supply' ? r.fuPipeSupply : r.fuPipeHot;
  const velPipe  = type==='supply' ? r.velPipeSupply : r.velPipeHot;
  const main     = type==='supply' ? r.supplyMain : r.hotMain;
  const rows = SUPPLY_PIPE_TABLE.filter(row => fu >= row[0] && fu <= row[1] || row[2]===main);
  tb.innerHTML = rows.map(row=>{
    const isHL = row[2] === main;
    return `<tr class="${isHL?'highlight':''}">
      <td>${row[0]}~${row[1]}</td>
      <td>${row[2]}A</td>
      <td>${row[3]}</td>
      <td>${row[4]}</td>
      <td>${isHL?'<span class="badge badge-grn">✅ 채택</span>':''}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center;color:#94a3b8">FU 없음</td></tr>`;
}
function buildDrainTableHTML(tbodyId, r){
  const tb = getEl(tbodyId); if(!tb) return;
  const fu = r.fuD;
  const rows = DRAIN_PIPE_TABLE.filter(row => fu >= row[0] && fu <= row[1] || row[2]===r.drainHoriz);
  tb.innerHTML = rows.map(row=>{
    const isHL = row[2]===r.drainHoriz || row[3]===r.drainVert;
    return `<tr class="${isHL?'highlight':''}">
      <td>${row[0]}~${row[1]}</td>
      <td>${row[2]}A</td>
      <td>${row[3]}A</td>
      <td>${row[4]}A</td>
      <td>${row[5]}A</td>
      <td>${isHL?'<span class="badge badge-grn">✅ 채택</span>':''}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" style="text-align:center;color:#94a3b8">FU 없음</td></tr>`;
}
function buildVentTableHTML(tbodyId, r){
  const tb = getEl(tbodyId); if(!tb) return;
  tb.innerHTML = `
    <tr class="highlight">
      <td>개별통기</td>
      <td class="mono" style="font-weight:900;color:#7e22ce">${r.ventIndiv}A</td>
      <td>각 기구 위생기구마다 적용</td>
    </tr>
    <tr>
      <td>루프통기</td>
      <td class="mono" style="font-weight:900;color:#7e22ce">${r.ventLoop}A</td>
      <td>배수계통 루프통기 계열</td>
    </tr>
    <tr>
      <td>신정통기</td>
      <td class="mono" style="font-weight:900;color:#7e22ce">${Math.max(r.ventLoop, 50)}A</td>
      <td>배수수직관 최상부 연장</td>
    </tr>`;
}

/* ── tab switching ── */
function switchTab(id, btn){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tb').forEach(b=>b.classList.remove('active'));
  const panel = getEl('panel-'+id);
  if(panel) panel.classList.add('active');
  if(btn)   btn.classList.add('active');
  if(id==='a4')     { scaleA4(); renderA4Page(); }
}

/* ── A4 scale ── */
function scaleA4(){
  const wrap = getEl('a4-scale-wrap');
  const cont = getEl('a4-wrap');
  if(!wrap || !cont) return;
  const cw = cont.clientWidth - 40;
  const scale = Math.min(1, cw / 794);
  wrap.style.transform = `scale(${scale})`;
  wrap.style.marginBottom = `${(794*1.414*scale - 794*1.414) + 40}px`;
}

/* ── A4 미리보기 렌더 ── */
function renderA4Page(){
  const r = STATE.result;
  const a4 = getEl('a4-content');
  if(!a4) return;
  if(!r){ a4.innerHTML='<div style="text-align:center;padding:40px 0;color:#94a3b8">산정 결과가 없습니다.<br>관경 산정 탭에서 계산 후 확인하세요.</div>'; return; }
  const bld = BUILDING_TYPES.find(b=>b.id===STATE.buildingId)||BUILDING_TYPES[0];
  const now = new Date();
  const dateStr = STATE.projDate || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  a4.innerHTML = `
    <div class="a4-page" id="a4-page">
      <div class="a4-tit">위생배관 관경 산정서</div>
      <table class="a4-tbl" style="margin-bottom:10px">
        <tr><th>공사명</th><td colspan="3">${STATE.projName}</td></tr>
        <tr><th>건물용도</th><td>${bld.nm}</td><th>작성일</th><td>${dateStr}</td></tr>
        <tr><th>층수</th><td>${STATE.floors}층 (층고 ${STATE.floorHeight}m)</td><th>급수방식</th><td>${{pressure:'가압급수(펌프)',gravity:'중력급수(고가탱크)',direct:'직결급수'}[getEl('sel-supply')?.value||'pressure']}</td></tr>
        <tr><th>관재질(급수)</th><td>${matName(STATE.matSupply)}</td><th>관재질(배수)</th><td>${drainMatName(STATE.matDrain)}</td></tr>
      </table>

      <div class="a4-sub">1. 기구부하단위(FU) 집계</div>
      <table class="a4-tbl">
        <tr><th>항목</th><th>급수 FU</th><th>급탕 FU</th><th>배수 FU</th><th>비고</th></tr>
        <tr><td>합계</td><td><b>${r.fuS}</b></td><td><b>${r.fuH}</b></td><td><b>${r.fuD}</b></td><td>FU 기구부하단위법</td></tr>
        <tr><td>설계유량(L/min)</td><td>${r.qwS}</td><td>${r.qwH}</td><td>-</td><td>Hunter 곡선 근사</td></tr>
      </table>

      <div class="a4-sub">2. 급수·급탕 관경 산정</div>
      <table class="a4-tbl">
        <tr><th>구분</th><th>FU</th><th>FU기준관경</th><th>유속기준관경</th><th>채택관경</th><th>비고</th></tr>
        <tr class="hl"><td>급수주관</td><td>${r.fuS}</td><td>${r.fuPipeSupply}A</td><td>${r.velPipeSupply}A</td><td><b>${r.supplyMain}A</b></td><td>안전측 채택</td></tr>
        <tr class="hl"><td>급탕주관</td><td>${r.fuH}</td><td>${r.fuPipeHot}A</td><td>${r.velPipeHot}A</td><td><b>${r.hotMain}A</b></td><td>온도보정 포함</td></tr>
      </table>

      <div class="a4-sub">3. 오배수·통기 관경 산정</div>
      <table class="a4-tbl">
        <tr><th>구분</th><th>FU</th><th>채택관경</th><th>비고</th></tr>
        <tr class="hl"><td>배수수평관</td><td>${r.fuD}</td><td><b>${r.drainHoriz}A</b></td><td>수평기울기 1/100</td></tr>
        <tr class="hl"><td>배수수직관</td><td>${r.fuD}</td><td><b>${r.drainVert}A</b></td><td>층수 보정 적용</td></tr>
        <tr><td>개별통기관</td><td>-</td><td><b>${r.ventIndiv}A</b></td><td>각 기구별</td></tr>
        <tr><td>루프통기관</td><td>-</td><td><b>${r.ventLoop}A</b></td><td>계통별</td></tr>
        <tr><td>신정통기관</td><td>-</td><td><b>${Math.max(r.ventLoop,50)}A</b></td><td>수직관 연장</td></tr>
      </table>

      <div class="a4-sub">4. 압력 및 기타 검토</div>
      <table class="a4-tbl">
        <tr><th>항목</th><th>계산값</th><th>판정</th></tr>
        <tr><td>정수두</td><td>${r.sh} kPa</td><td>-</td></tr>
        <tr><td>마찰손실</td><td>${r.frlS} kPa</td><td>-</td></tr>
        <tr><td>최상층 잔류압</td><td>${r.topP} kPa</td><td>${r.topP<50?'🔴 부족':r.topP<100?'⚠️ 주의':'✅ 적정'}</td></tr>
        <tr><td>환탕 배관</td><td>${r.estHWLen} m</td><td>${r.isCirc?'⚠️ 필요':'✅ 불필요'}</td></tr>
        <tr><td>감압밸브</td><td>${r.botP} kPa</td><td>${r.isPRV?'🔴 설치 필요':'✅ 불필요'}</td></tr>
      </table>

      <div class="a4-footer">
        <span>기계설비 기술기준 국토교통부 고시 제2021-851호 · FU 기구부하단위법 · Hunter 곡선 적용</span>
        <span>ENGINEER KIM MANMIN — 위생배관 관경 산정 시스템 Ver 2.0</span>
      </div>
    </div>`;
}

/* ── 공통 liveCalc: 각 페이지에서 오버라이드 가능 ── */
function liveCalcBase(){
  // 입력값 수집 (존재하는 경우만)
  const v = id => { const e=getEl(id); return e ? e.value : null; };
  if(v('inp-floors'))   STATE.floors      = parseInt(v('inp-floors'))||5;
  if(v('inp-floorht'))  STATE.floorHeight = parseFloat(v('inp-floorht'))||3.0;
  if(v('sel-mat-supply')) STATE.matSupply = v('sel-mat-supply');
  if(v('sel-mat-drain'))  STATE.matDrain  = v('sel-mat-drain');
  if(v('inp-vel-supply')) STATE.velSupply = parseFloat(v('inp-vel-supply'))||1.5;
  if(v('inp-pressure'))   STATE.pressure  = parseInt(v('inp-pressure'))||300;
  if(v('inp-hwtemp'))     STATE.hwTemp    = parseInt(v('inp-hwtemp'))||60;
  if(v('sel-circ'))       STATE.circ      = v('sel-circ');
  if(v('sel-usage'))      STATE.usage     = v('sel-usage');
  if(v('inp-projname'))   STATE.projName  = v('inp-projname');
  if(v('inp-projdate'))   STATE.projDate  = v('inp-projdate');

  const {fuS,fuH,fuD} = calcTotalFU();
  updateFuBadge(fuS,fuH,fuD);

  const r = runCalc();
  renderResult(r);
  if(r) renderA4Page();
}
