const {chromium}=require(process.env.MM_PW||'playwright');
const {setup,server}=require('./serve');const fs=require('fs');
(async()=>{const srv=await server(require('path').resolve(process.argv[3]||'../..'),8814);
 const b=await chromium.launch();const ctx=await b.newContext({serviceWorkers:'block'});await setup(ctx);
 const p=await ctx.newPage();await p.goto('http://127.0.0.1:8814/index.html');await p.waitForTimeout(500);
 const out=await p.evaluate(()=>{const D=[],Q=[];
  for(let L=0.25;L<=6000;L+=0.25){Q.push([L,demandFlow(L,false).lpm,demandFlow(L,true).lpm]);}
  const fl=[1,2,3,4,5,8,12,20,40], tr=[32,40,50,80];
  for(let L=0.5;L<=9000;L+= (L<200?0.5:(L<2000?5:25))) for(const f of fl) for(const t of tr) for(const w of [false,true]){
    const x=sizeDrain(L,f,w,t); D.push([L,f,w,t,x.branch,x.stack,x.bldg,x.ventStack,x.ventLoop,x.ventIndiv]);}
  return {Q,D};});
 fs.writeFileSync((process.argv[2]||'.')+'/sweep.json',JSON.stringify(out));console.log(out.Q.length,out.D.length);await b.close();srv.close();})();
