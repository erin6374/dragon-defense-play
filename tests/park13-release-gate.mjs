import assert from 'node:assert/strict';
import {evaluatePark13Release} from '../qa/park13-release-gate.mjs';
const sha='a'.repeat(40),other='b'.repeat(40);
const complete=()=>({
 source:{source:sha,passed:true,records:165,originalParcels:122,footprintChecks:33825,surfaceChecks:322560,conflicts:0,lifecycleTargets:165},
 browser:{source:sha,passed:true,errors:[],runs:[{enabled:false,school:true,parcels:122,expansion:null},{enabled:true,school:true,parcels:122,expansion:{buildings:165},liveMeteor:{after:{damage:.15},repaired:{damage:0}},afterRepairDelay:{meteors:0,fragments:0}}]},
 native:{source:sha,passed:true,renderer:'NVIDIA GeForce RTX 3060 / ANGLE D3D11',preset:'Balanced',fpsCap:45,viewport:{width:1280,height:720},cases:['traverse','bombardment'].flatMap(name=>[false,true].map(expansion=>({name,expansion,averageFPS:44,p95FrameMs:34,samples:600,contextLost:0,focused:true,completed:true})))},
 visual:{source:sha,approved:true,reviewer:'synthetic fixture only',views:['north','central','south','campus','street-seams','damage-repair'].map(name=>({name,approved:true,evidence:'fixture/'+name}))},
 package:{source:sha,passed:true,archive:'fixture.zip',sha256:'c'.repeat(64),launcherSmoke:true,version:'5.5.0-integration.11',rollbackVerified:true}
});
assert.equal(evaluatePark13Release(sha,complete()).ready,true);
assert.equal(evaluatePark13Release(sha,{}).ready,false);
assert.equal(evaluatePark13Release(sha,null).ready,false);
assert.equal(evaluatePark13Release('invalid',complete()).ready,false);
for(const name of ['source','browser','native','visual','package']){
 const e=complete();e[name].source=other;const result=evaluatePark13Release(sha,e);
 assert.equal(result.ready,false);assert.equal(result.gates.find(g=>g.name===name).passed,false);
}
const reject=(edit,name)=>{const e=complete();edit(e);const r=evaluatePark13Release(sha,e);assert.equal(r.ready,false);assert.equal(r.gates.find(g=>g.name===name).passed,false);};
reject(e=>e.source.conflicts=1,'source');
reject(e=>e.browser.runs[1].liveMeteor.after.damage=0,'browser');
reject(e=>e.browser.errors=['WebGL error'],'browser');
reject(e=>e.browser.runs={},'browser');
reject(e=>e.native.renderer='SwiftShader RTX 3060','native');
reject(e=>e.native.cases[1].averageFPS=39,'native');
reject(e=>e.native.cases[1].p95FrameMs=41,'native');
reject(e=>e.native.cases[1].contextLost=1,'native');
reject(e=>e.native.cases[1].focused=false,'native');
reject(e=>e.native.cases.pop(),'native');
reject(e=>e.visual.views.pop(),'visual');
reject(e=>e.package.sha256='bad','package');
reject(e=>e.package.launcherSmoke=false,'package');
console.log('PARK13_RELEASE_POLICY '+JSON.stringify({passFixture:true,staleEvidenceRejected:5,negativeCases:13,syntheticOnly:true}));
