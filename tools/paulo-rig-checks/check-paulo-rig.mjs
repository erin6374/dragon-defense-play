// Regression contract for src/dragon/paulo-rig.js. Run from the repo root:
//   node tools/paulo-rig-checks/check-paulo-rig.mjs            (about 3 s)
//   node tools/paulo-rig-checks/check-paulo-rig.mjs --long     (adds a 10-minute fuzz)
// Uses the vendored real Three.js; needs no browser. Exits non-zero on failure.
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=process.cwd();
const imp=p=>import(pathToFileURL(path.join(root,p)).href);
const THREE=await imp('vendor/three/build/three.module.js');
const {createPauloRig}=await imp('src/dragon/paulo-rig.js');
const {createPauloPoseDriver}=await imp('src/dragon/paulo-pose-driver.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const POSES=['idle','hover','flight','glide','bank','ground-turn','inhale','wind','fire','gas','hit','land','takeoff'];

// 1. structure the lab and browser QA rely on
const rig=createPauloRig(THREE);
for(const k of ['root','rigMarkers','wings','legs','tailProfile','membranePanels','plateIndex','upperTeeth','lowerTeeth','breathPreview','head','jaw','mouthAnchor','neck','chest','applyPose','dispose','membraneDeformation'])ok(k in rig,'API '+k);
ok(rig.rigMarkers.length===30,'30 joint markers');
ok(rig.wings.length===2&&rig.legs.length===4&&rig.tailProfile.length===7,'2 wings, 4 leg pivots, 7 tail segments');
ok(rig.plateIndex===66&&rig.upperTeeth.count===12&&rig.lowerTeeth.count===12,'66 plates, 12+12 fangs');
const regions={};rig.membranePanels.forEach(p=>regions[p.region]=(regions[p.region]||0)+1);
ok(rig.membranePanels.length===12&&regions.proximal===2&&regions.middle===2&&regions.outer===8,'12 membrane panels (2 proximal, 2 middle, 8 outer)');
const verts=rig.membranePanels.reduce((n,p)=>n+p.mesh.geometry.attributes.position.count,0);
ok(verts>=1092,'membrane vertices >= 1092 (have '+verts+')');
let badColor=0,drawCalls=0;rig.root.traverse(o=>{if(o.isMesh){if(o.visible)drawCalls++;if(o.material.vertexColors&&!o.geometry.attributes.color)badColor++;}});
ok(badColor===0,'every vertex-coloured mesh has a colour attribute');
console.log('INFO visible draw calls:',drawCalls);

// 2. every pose, repeated, is finite; fresh left/right banks mirror each other
let nan=0;
for(const s of POSES)for(const t of [0,.37,1.3,7.9]){rig.applyPose(t,s,t>1?-1:1,t*.5);rig.root.traverse(o=>{if(!o.isMesh)return;const a=o.rotation;for(const v of [a.x,a.y,a.z,o.position.y,o.scale.y])if(!Number.isFinite(v))nan++;});}
ok(nan===0,'13 poses x 4 times: no NaN/Infinity');
const bank=d=>{const g=createPauloRig(THREE);g.applyPose(.75,'bank',d,.75);const r=[g.root.rotation.x,g.root.rotation.y,g.head.rotation.y];g.dispose();return r;};
const R=bank(1),L=bank(-1);
ok(Math.abs(R[0]+L[0])<1e-6&&Math.abs(R[1]+L[1])<1e-6&&Math.abs(R[2]+L[2])<1e-6,'left/right bank are exact mirrors');
const d=rig.membraneDeformation();ok(Number.isFinite(d.rest)&&Number.isFinite(d.current)&&d.rest!==d.current,'membrane deformation is live');
const dis=rig.dispose();ok(dis&&dis.geometries>0&&rig.dispose().geometries===0,'dispose is idempotent');
rig.applyPose(1,'hover',1,1);ok(true,'applyPose after dispose is a safe no-op');

// 3. transitions: play every function through the real pose driver, no snapped joints
function run(seq,secs,sigFn){
 const r=createPauloRig(THREE),drv=createPauloPoseDriver(r,{initialState:'idle'});
 const J=[r.root,r.neck,r.head,r.jaw,r.chest,...r.wings.flatMap(w=>[w.shoulder,w.elbow,w.wrist]),...r.legs.flatMap(l=>[l.hip,l.knee,l.foot])];
 const snap=()=>J.flatMap(o=>[o.rotation.x,o.rotation.y,o.rotation.z,o.position.y,o.scale.y]);
 let prev=snap(),max=0,bad=0;
 for(const sig of seq)for(let i=0;i<Math.round(secs*60);i++){drv.update(1/60,sig);const c=snap();for(let k=0;k<c.length;k++){if(!Number.isFinite(c[k]))bad++;max=Math.max(max,Math.abs(c[k]-prev[k]));}prev=c;}
 r.dispose();return {max,bad};
}
const SEQ=[{perched:true},{recovering:true},{},{moving:true},{turning:true,moving:true},{gliding:true},{windCharging:true},{windGust:true},{fireAttack:true},{gasAttack:true},{stunned:true},{},{landing:true},{perched:true},{turning:true,perched:true},{perched:true}];
const tr=run(SEQ,1.4);
ok(tr.bad===0&&tr.max<.35,'full pose sequence: largest single-frame joint change '+tr.max.toFixed(3)+' rad (< .35; original rig was 1.28)');

// 4. stability: random state flips with jittery frame times
const r2=createPauloRig(THREE),drv=createPauloPoseDriver(r2,{initialState:'idle'});
const keys=['perched','recovering','windGust','gasAttack','windCharging','fireAttack','turning','moving','rising','gliding','stunned','landing'];
let seed=7;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
let sig={},bad=0,peak=0;const N=process.argv.includes('--long')?36000:3600;
for(let i=0;i<N;i++){if(rnd()<.02){sig={};for(const k of keys)if(rnd()<.18)sig[k]=true;}drv.update(.008+rnd()*.042,sig);
 r2.root.traverse(o=>{if(!o.isMesh)return;for(const v of [o.rotation.x,o.rotation.y,o.rotation.z,o.position.y,o.scale.y]){if(!Number.isFinite(v))bad++;else peak=Math.max(peak,Math.abs(v));}});}
ok(bad===0&&peak<3,'fuzz '+N+' frames: finite and bounded (peak '+peak.toFixed(2)+')');
r2.dispose();

// 5. cost
const r3=createPauloRig(THREE);for(let i=0;i<300;i++)r3.applyPose(i/60,'hover',1,i/60);
const t0=performance.now();for(let i=0;i<3000;i++)r3.applyPose(5+i/60,i%240<120?'hover':'fire',1,i/60);
const us=(performance.now()-t0)/3000*1000;console.log('INFO applyPose cost: '+us.toFixed(0)+' us/call');
ok(us<1500,'applyPose under 1.5 ms per call (headless)');
console.log(fails?`\n${fails} check(s) FAILED`:'\nAll paulo-rig checks passed');
process.exit(fails?1:0);
