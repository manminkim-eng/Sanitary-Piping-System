// 위생배관 관경 산정 시스템 매뉴얼 화면 캡처 — usage: node capture_sp.js <repoDir> <outDir>
// 규격: 1440×900 · DSF 1.25 · _marks.json(번호 배지 % 좌표) · _example.json(예제 검증값)
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const VW=1440,VH=900,DSF=1.25,PORT=8899;
/* 예제 A = 사무소 5층 · 층높이 3.6m · 가압 350kPa · 세정밸브 양변기 20 · 소변기 10 · 세면기 20(냉온) · 청소싱크 5(냉온) · 탕비실 싱크 5(냉온)
   예제 B = 아파트(3호 이상 공동주택) 15층 · 2.9m · 가압 500kPa · 세정탱크 양변기 60 · 세면기 60 · 욕조 30 · 샤워 30 · 주방싱크 30(냉온) · 세탁기 30 · 욕실 바닥배수 60 */
const FREEZE=`(()=>{const T=new Date(2026,9,13,10,0,0).getTime();const D=Date;class F extends D{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}window.Date=F;window.alert=()=>{};window.confirm=()=>true;try{localStorage.clear();localStorage.setItem('pwa-banner-dismissed','1')}catch(e){}})()`;
const HELP=`window.__vis=e=>e&&e.getClientRects().length>0;
window.__card=t=>{const h=[...document.querySelectorAll('.card-tit')].find(e=>__vis(e)&&e.textContent.trim().startsWith(t));return h?h.closest('.card'):null;};
window.__find=sel=>{if(sel.startsWith('card:'))return __card(sel.slice(5));
 if(sel.startsWith('a4sub:'))return document.querySelectorAll('#a4Page .a4-sub')[+sel.slice(6)]||null;
 if(sel.startsWith('sec:'))return document.querySelectorAll('#panel-calc .pipe-result-section')[+sel.slice(4)]||null;
 if(sel.startsWith('up:')){const [a,b]=sel.slice(3).split('|');const e=document.querySelector(a);return e?e.closest(b):null;}
 for(const s of sel.split(',')){const e=[...document.querySelectorAll(s)].find(__vis);if(e)return e;}return null;};
window.__tab=t=>switchTab(t,document.getElementById('tab-'+t));
window.__setv=(id,v)=>{document.getElementById(id).value=v;};
window.__run=(b,f,h,p,q)=>{resetAll();__tab('calc');selectBuilding(b);__setv('inp-floors',f);__setv('inp-floorht',h);__setv('inp-pressure',p);__setv('sel-supply','pressure');
  STATE.fixtureQty=JSON.parse(JSON.stringify(q));filterFixtures('wc',document.getElementById('seg-wc'));liveCalc();markStep(3,true);window.scrollTo(0,0);};
window.__A=()=>__run('office',5,3.6,350,{wc_valve:{supply:20,hot:0},urinal:{supply:10,hot:0},lav:{supply:20,hot:20},sink_svc:{supply:5,hot:5},sink_kit:{supply:5,hot:5}});
window.__B=()=>__run('apt',15,2.9,500,{wc_tank:{supply:60,hot:0},lav:{supply:60,hot:60},bathtub:{supply:30,hot:30},shower:{supply:30,hot:30},sink_kit:{supply:30,hot:30},washer:{supply:30,hot:0},floordr:{supply:60,hot:0}});
window.__ex=()=>{const R=STATE.result;const D=x=>x?{load:x.load,per:x.perFloor,n:x.n,branch:x.branch,stack:x.stack,bldg:x.bldg,slope:x.bldgSlope,vs:x.ventStack,vl:x.ventLoop,vi:x.ventIndiv}:null;
  return {b:STATE.buildingId,usage:STATE.usage,floors:STATE.floors,ht:STATE.floorHeight,p:STATE.pressure,vel:STATE.velSupply,qty:STATE.fixtureQty,col:R.colNm,
  fuS:R.fuS,fuH:R.fuH,fuD:R.fuD,fuOsu:R.fuOsu,fuJab:R.fuJabsu,curve:R.curveS,gpmS:R.gpmS,gpmH:R.gpmH,qwS:R.qwS,qwH:R.qwH,sup:R.supplyMain,vS:R.vS,hot:R.hotMain,vH:R.vH,
  reqP:R.reqP,reqFix:R.reqFix,ok:R.pressOk,topP:R.topP,frl:R.frlS,sh:R.sh,botP:R.botP,prv:R.isPRV,circ:R.isCirc,hw:R.estHWLen,all:D(R.Dall),osu:D(R.Dosu),jab:D(R.Djab),
  rows:FIXTURES.filter(f=>{const q=STATE.fixtureQty[f.id];return q&&(q.supply>0||q.hot>0);}).map(f=>{const q=STATE.fixtureQty[f.id],w=fixtureWs(f,STATE.usage),d=fixtureDfu(f,DRAIN_COL[STATE.buildingId]||'gen');return {id:f.id,nm:f.nm,s:q.supply,h:q.hot,wt:w.t,wh:w.h,dfu:d.v,dsrc:d.src,trap:f.trap,pmin:f.pmin,fv:f.fv};}),
  sum:[...document.querySelectorAll('.sum-bar .sum-item')].map(e=>e.textContent.trim())};};
window.__tables=()=>({ipc:IPC_DEMAND,t414:T414,t415:T415,dn:DN_DRAIN,fix:FIXTURES.map(f=>({id:f.id,nm:f.nm,ws:f.ws,fv:f.fv,pmin:f.pmin,trap:f.trap,dsrc:f.dsrc,d:['gen','pub','apt','house'].map(c=>fixtureDfu(f,c))}))});`;
const SHOTS=[
 {id:'s01_overview',pre:"__A()",clip:'viewport',m:[['.tab-bar-inner','작업 탭'],['.sum-bar','요약 스트립'],['#panel-calc .step-bar','진행 단계'],['card:STEP 1','STEP 1 건물 정보'],['#pipeSizeHero','결과 — 주관 관경 4종'],['.fab-wrap','초기화 · 설계기준 안내']]},
 {id:'s02_tabs',clip:'.hdr-shell',m:[['#tab-calc','관경 산정'],['#tab-stdtable','관경 표준표'],['#tab-guide','설계 기준'],['#tab-a4','A4 미리보기 · 출력'],['.tb-manual','매뉴얼'],['.hdr-right','근거 기준']]},
 {id:'s03_building',clip:'card:STEP 1',m:[['#inp-projname','공사명'],['#bldGrid .bld-card.sel','건축물 용도'],['#inp-floors','총 층수'],['#inp-floorht','층 높이'],['#sel-usage','사용 용도 구분(주거 · 공용)'],['#sel-supply','급수 방식']]},
 {id:'s04_fixture',clip:'card:STEP 2',m:[['.seg-ctrl','기구 분류 탭'],['#fixtureGrid .fx-fu-badge','기구별 WSFU · DFU'],['#fixtureGrid .fx-input','급수 수량'],['#fixtureGrid .fx-input[data-type="hot"]:not([disabled])','급탕 수량'],['up:#sumFuSupply|.cbox','부하단위 합계']]},
 {id:'s05_cond',clip:'card:STEP 3',m:[['#sel-mat-supply','급수 관재질(C값)'],['#inp-vel-supply','설계 유속 상한'],['#inp-pressure','급수원 압력'],['#inp-hwtemp','급탕 설정 온도'],['#sel-circ','환탕 배관'],['up:#p-topPressure|.cbox','자동 계산 파라미터']]},
 {id:'s06_hero',clip:'#pipeSizeHero',union:'#flowDiagram',m:[['.psh-box.supply','급수 주관'],['.psh-box.hot','급탕 주관'],['.psh-box.drain','배수 횡주관'],['.psh-box.vent','배수 수직관'],['#pressure-banner','판정 배너'],['#flowDiagram','배관 구성 흐름']]},
 {id:'s07_supply',clip:'sec:0',union:'sec:1',m:[['#tbl-supply tbody tr:nth-child(2)','순간최대유량 곡선'],['#tbl-supply tbody tr:nth-child(3)','순간최대유량'],['#tbl-supply tbody tr:nth-child(4)','관경(유속 기준)'],['#tbl-supply tbody tr:nth-child(7)','최상층 잔류압 · 필요 수압'],['#tbl-hotwater','급탕 산정표']]},
 {id:'s08_drain',clip:'sec:2',m:[['#tbl-drain-osu','오수 계통'],['#tbl-drain-jab','잡배수 계통'],['#tbl-drain tbody tr:nth-child(3)','배수수평지관'],['#tbl-drain tbody tr:nth-child(4)','배수수직관'],['#tbl-drain tbody tr:nth-child(5)','건물배수수평주관']]},
 {id:'s09_vent',clip:'sec:3',m:[['#tbl-vent tbody tr:nth-child(1)','통기수직관'],['#tbl-vent tbody tr:nth-child(2)','루프통기관'],['#tbl-vent tbody tr:nth-child(3)','각개통기관'],['#tbl-vent tbody tr:nth-child(4)','길이 조건']]},
 {id:'s10_summary',clip:'up:#res-fu-supply|.cbox',union:'#panel-calc .ref-box',m:[['up:#res-fu-supply|.crow','부하단위'],['up:#res-qw-supply|.crow','순간최대유량'],['up:#res-adopted-pipe|.crow','최저 필요수압'],['up:#res-top-press|.crow','최상층 잔류압'],['#panel-calc .ref-box','적용 기준']]},
 {id:'s11_std_supply',pre:"__tab('stdtable');scrollTo(0,0)",wait:700,clip:'card:급수 순간최대유량',m:[['#stdTblSupply tr:nth-child(31)','WSFU 100'],['#stdTblSupply tr:nth-child(40)','WSFU 300']]},
 {id:'s12_std_drain',clip:'card:배수관 허용 최대 DFU',m:[['#stdTblDrain tr:nth-child(6)','DN 100'],['#stdTblDrain tr:nth-child(5)','DN 80 — 최소 기울기 1/100']]},
 {id:'s13_std_fix',clip:'card:위생기구별 부하단위',m:[['#fuTable tr:nth-child(2)','세정밸브 양변기'],['#fuTable tr:nth-child(9)','원문 빈 칸 → 표 4.1-3(*)']]},
 {id:'s14_guide',pre:"__tab('guide');scrollTo(0,0)",wait:700,clip:'viewport',m:[['card:급수 설계 기준','급수 — KDS 31 30 15'],['card:급탕 설계 기준','급탕 — 별표 5'],['card:오배수 설계 기준','오배수 — KDS 31 30 25'],['card:통기 설계 기준','통기 — 4.3.4']]},
 {id:'s15_guide_support',clip:'card:배관 지지 간격',m:[]},
 {id:'s16_modal',pre:"__tab('calc');openGuideModal();switchGuideTab(0)",wait:800,fixed:true,clip:'#guideModal .modal-box',m:[]},
 {id:'s17_modal_drain',pre:"switchGuideTab(3)",wait:500,fixed:true,post:"closeGuideModal()",clip:'#guideModal .modal-box',m:[]},
 {id:'s18_a4',pre:"__A();__tab('a4');scrollTo(0,0)",wait:1500,clip:'viewport',m:[['.mm-btn-print','인쇄 / PDF'],['#btn-jpg','JPG 저장'],['#a4Page','A4 산정 결과서']]},
 {id:'s19_a4page',clip:'#a4Page',m:[['a4sub:0','1. 설계 개요'],['a4sub:1','2. 급수·급탕 수리 계산'],['a4sub:2','3. 부하단위 산정표'],['a4sub:3','4. 배수·통기 관경'],['a4sub:4','5. 설계 검토 의견']]},
 {id:'s20_var_apt',pre:"__B()",wait:800,clip:'#pipeSizeHero',union:'#flowDiagram',m:[['.psh-box.supply','급수 주관 — 세정탱크 곡선'],['.psh-box.vent','배수 수직관'],['#pressure-banner','최상층 수압 부족']]},
 {id:'s21_var_apt_drain',clip:'sec:2',post:"__A()",m:[['#tbl-drain-osu','오수 계통'],['#tbl-drain-jab','잡배수 계통'],['#tbl-drain tbody tr:nth-child(5)','건물배수수평주관']]},
];
(async()=>{
 const s=await server(repo,PORT);const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:DSF,serviceWorkers:'block'});await setup(ctx);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(FREEZE);
 await pg.goto(`http://127.0.0.1:${PORT}/index.html`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(2500);
 await pg.addStyleTag({content:'#pwa-banner,#pwa-install-banner,#ios-modal,#toast,.toast,#toastMsg{display:none!important}'});
 await pg.evaluate(HELP);
 const ex={};const meta={};
 for(const S of SHOTS){
  if(S.pre){try{await pg.evaluate(S.pre);}catch(e){errs.push(S.id+' pre '+e.message);}}
  await pg.waitForTimeout(S.wait||600);
  if(S.id==='s01_overview')ex.A=await pg.evaluate('__ex()');
  if(S.id==='s01_overview')ex.tables=await pg.evaluate('__tables()');
  if(S.id==='s20_var_apt')ex.B=await pg.evaluate('__ex()');
  if(S.id==='s19_a4page')ex.A_a4=await pg.evaluate(()=>document.getElementById('a4Page').innerText.replace(/\s+/g,' '));
  const info=await pg.evaluate(({S,VW,VH})=>{
   const abs=e=>{const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};};
   let clip;
   if(S.clip==='viewport'){clip={x:0,y:scrollY,width:VW,height:VH};}
   else{const el=__find(S.clip);if(!el)return {err:'clip '+S.clip};const a=abs(el);clip={x:a.x,y:a.y,width:a.w,height:a.h};
     if(S.union){const e2=__find(S.union);if(e2){const a2=abs(e2);const x0=Math.min(clip.x,a2.x),y0=Math.min(clip.y,a2.y),x1=Math.max(clip.x+clip.width,a2.x+a2.w),y1=Math.max(clip.y+clip.height,a2.y+a2.h);clip={x:x0,y:y0,width:x1-x0,height:y1-y0};}}
     const P=12;clip={x:Math.max(0,clip.x-P),y:Math.max(0,clip.y-P),width:clip.width+2*P,height:clip.height+2*P};}
   const marks=[];(S.m||[]).forEach(([sel,label],i)=>{const e=__find(sel);if(!e){marks.push({n:i+1,label,miss:sel});return;}const a=abs(e);
     marks.push({n:i+1,label,x:+((a.x-clip.x)/clip.width*100).toFixed(2),y:+((a.y-clip.y)/clip.height*100).toFixed(2),w:+(Math.min(a.w,clip.x+clip.width-a.x)/clip.width*100).toFixed(2),h:+(Math.min(a.h,clip.y+clip.height-a.y)/clip.height*100).toFixed(2)});});
   return {clip,marks};},{S,VW,VH});
  if(info.err){errs.push(S.id+' '+info.err);continue;}
  const c=info.clip;const cl={x:Math.max(0,c.x),y:Math.max(0,c.y),width:Math.min(c.width,VW-Math.max(0,c.x)),height:c.height};
  if(S.clip==='viewport'){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:0,y:0,width:VW,height:VH}});}
  else if(S.fixed){const sx=await pg.evaluate(()=>scrollX),sy=await pg.evaluate(()=>scrollY);await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:c.x-sx,y:c.y-sy,width:Math.min(c.width,VW),height:Math.min(c.height,VH)}});}
  else{await pg.screenshot({path:path.join(out,S.id+'.png'),clip:cl,fullPage:true});}
  meta[S.id]={w:Math.round(cl.width),h:Math.round(Math.min(cl.height,S.fixed?VH:1e9)),marks:info.marks};
  if(S.post){try{await pg.evaluate(S.post);}catch(e){errs.push(S.id+' post '+e.message);}await pg.waitForTimeout(400);}
 }
 await pg.evaluate('__A()');await pg.waitForTimeout(500);ex.after=await pg.evaluate('__ex()');
 const mctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true});await setup(mctx);
 const mp=await mctx.newPage();await mp.addInitScript(FREEZE);
 await mp.goto(`http://127.0.0.1:${PORT}/index.html`);await mp.waitForTimeout(2500);
 await mp.addStyleTag({content:'#pwa-banner,#pwa-install-banner,#ios-modal,#toast,.toast,#toastMsg{display:none!important}'});await mp.evaluate(HELP);await mp.evaluate('__A()');await mp.waitForTimeout(600);
 await mp.screenshot({path:path.join(out,'s22_mobile_main.png')});meta['s22_mobile_main']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{document.getElementById('pipeSizeHero').scrollIntoView({block:'start'});});await mp.waitForTimeout(500);
 await mp.screenshot({path:path.join(out,'s23_mobile_result.png')});meta['s23_mobile_result']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{__tab('a4');window.scrollTo(0,0);});await mp.waitForTimeout(1200);
 await mp.screenshot({path:path.join(out,'s24_mobile_a4.png')});meta['s24_mobile_a4']={w:390,h:844,marks:[]};
 ex.mobile=await mp.evaluate(()=>({page:document.documentElement.scrollWidth}));
 fs.writeFileSync(path.join(out,'_marks.json'),JSON.stringify(meta,null,1));fs.writeFileSync(path.join(out,'_example.json'),JSON.stringify(ex,null,1));
 const miss=[];Object.entries(meta).forEach(([k,v])=>v.marks.forEach(m=>{if(m.miss)miss.push(k+':'+m.miss);else if(m.x<0||m.y<0||m.x+m.w>100.5||m.y+m.h>100.5)miss.push(k+':OUT '+m.label+' '+m.x+','+m.y+','+m.w+','+m.h);}));
 const pick=e=>e&&[e.sup,e.hot,e.all&&e.all.branch,e.all&&e.all.stack,e.all&&e.all.bldg,e.topP,e.reqP];
 console.log(JSON.stringify({A:pick(ex.A),B:pick(ex.B),same:JSON.stringify(ex.A)===JSON.stringify(ex.after),mobile:ex.mobile,sizes:Object.fromEntries(Object.entries(meta).map(([k,v])=>[k,v.w+'x'+v.h])),miss,errs:errs.slice(0,15)},null,1));
 await b.close();s.close();
})();
