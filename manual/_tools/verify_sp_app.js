const {chromium}=require(process.env.MM_PW||'playwright');
const {setup,server}=require('./serve');
const fs=require('fs');
let seed=20261013; const rnd=()=>{seed=(seed*1103515245+12345)%2147483648; return seed/2147483648;};
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const IDS=['wc_tank','wc_valve','urinal','lav','sink_kit','sink_svc','bathtub','shower','bid','washer','dishwash','fountain','floordr','mop_sink'];
const BLD=['office','apt','house','hotel','hospital','school','store','restaurant','factory','church','gym','parking'];
const MAT=['sgp','stp','cu','ppc','xlpe'];
const N=+process.argv[2]||3000; const cases=[];
for(let i=0;i<N;i++){
  const scale=[3,10,40,200,800][i%5];
  const q={}; const k=ri(1,IDS.length);
  for(let j=0;j<k;j++){const id=IDS[ri(0,IDS.length-1)]; const sup=rnd()<0.85?ri(0,scale):0; const hot=rnd()<0.5?ri(0,scale):0; q[id]={supply:sup,hot:hot};}
  cases.push({b:BLD[ri(0,11)],usage:rnd()<0.5?'private':'public',floors:ri(1,40),ht:[2.8,3.0,3.3,3.6,4.2][ri(0,4)],
    p:ri(100,700),vel:[0.8,1.0,1.2,1.5,2.0,2.5][ri(0,5)],mat:MAT[ri(0,4)],temp:[45,50,55,60,65][ri(0,4)],circ:['auto','yes','no'][ri(0,2)],method:['pressure','gravity','direct'][ri(0,2)],q});
}
(async()=>{
 const srv=await server(require('path').resolve(process.argv[3]||'../..'),8812);
 const b=await chromium.launch();
 const ctx=await b.newContext({serviceWorkers:'block'}); await setup(ctx);
 const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://127.0.0.1:8812/index.html'); await p.waitForTimeout(600);
 const out=await p.evaluate((cases)=>cases.map(c=>{
   selectBuilding(c.b);
   document.getElementById('sel-usage').value=c.usage;
   document.getElementById('inp-floors').value=c.floors; document.getElementById('inp-floorht').value=c.ht;
   document.getElementById('inp-pressure').value=c.p; document.getElementById('inp-vel-supply').value=c.vel;
   document.getElementById('sel-mat-supply').value=c.mat; document.getElementById('inp-hwtemp').value=c.temp;
   document.getElementById('sel-circ').value=c.circ; document.getElementById('sel-supply').value=c.method;
   STATE.fixtureQty=JSON.parse(JSON.stringify(c.q)); liveCalc();
   const r=STATE.result; if(!r) return null;
   const pick=D=>D?{load:D.load,perFloor:D.perFloor,branch:D.branch,stack:D.stack,bldg:D.bldg,ventStack:D.ventStack,ventLoop:D.ventLoop,ventIndiv:D.ventIndiv}:null;
   return {fuS:r.fuS,fuH:r.fuH,fuD:r.fuD,curve:r.curveS,qwS:r.qwS,qwH:r.qwH,sup:r.supplyMain,hot:r.hotMain,reqP:r.reqP,topP:r.topP,frl:r.frlS,
     all:pick(r.Dall),osu:pick(r.Dosu),jab:pick(r.Djab),circ:r.isCirc,prv:r.isPRV,botP:r.botP,
     a4:document.getElementById('a4Page').innerHTML.length};
 }),cases);
 fs.writeFileSync((process.argv[4]||'.')+'/cases.json',JSON.stringify(cases));
 fs.writeFileSync((process.argv[4]||'.')+'/app_out.json',JSON.stringify(out));
 console.log('cases',cases.length,'errs',errs.length,errs.slice(0,3));
 await b.close(); srv.close();
})();
