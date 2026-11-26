import * as T from 'three';
import {buildInterior} from './interiors.js';
import {renderCommercialFrontage,mcdonaldsParkingElevation} from './commercial-facades-20.mjs';
import {renderMcDonaldsArches} from './landmark-fidelity-21.mjs';
import {redRoofPlan} from './mcdonalds-roof-16.mjs';
import {assertModelVisible} from './model-visibility-qa.mjs';
const $=id=>document.getElementById(id);
const canvas=$('view'),status=$('status');
function fail(e){const msg=String(e?.message||e);$('error').hidden=false;$('error').textContent=msg;status.textContent='QA HOLD: 3D inspection failed to render.';console.error(e)}
let renderer;
try {
 const response=await fetch('./mapped-data.json',{cache:'no-store'});
 if(!response.ok)throw Error('GIS footprint source unavailable: HTTP '+response.status);
 const {rows}=await response.json();const row=rows.find(b=>String(b.id)==='1005655');
 if(!row)throw Error('McDonald GIS building 1005655 missing');
 const long=mcdonaldsParkingElevation(row);if(!long)throw Error('Long parking-side facade not identifiable from GIS polygon');
 const scene=new T.Scene();scene.background=new T.Color(0xc5d6dd);
 scene.add(new T.HemisphereLight(0xfffff2,0x879ba0,2.2));
 const sunlight=new T.DirectionalLight(0xfff9ec,2.0);sunlight.position.set(row.x+42,60,row.front+42);scene.add(sunlight);
 renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=T.SRGBColorSpace;
 const camera=new T.PerspectiveCamera(42,1,.1,1000);
 const cubeGeo=new T.BoxGeometry(),materials=new Map();
 function material(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.78,side:T.DoubleSide}));return materials.get(color)}
 function box(x,y,z,w,h,d,c,angle=0){const m=new T.Mesh(cubeGeo,material(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.y=angle;scene.add(m);return m}
 function mesh(geometry,color){const m=new T.Mesh(geometry,material(color));scene.add(m);return m}
 function polyBlock(poly,base,thickness,color){
  const build=(ring,cls)=>{const shape=new cls();ring.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();return shape};
  const shape=build(poly[0],T.Shape);shape.holes=poly.slice(1).map(r=>build(r,T.Path));
  const geo=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const obj=mesh(geo,color);obj.position.y=base;return obj;
 }
 // Match the core construction call from mapped-geometry.js, without loading
 // the unrelated block, other building assets or generic facades.
 buildInterior(row,scene,[0xe1dfd8,1,4],1,'restaurant');
 renderCommercialFrontage(row,{T,box,mesh,scene});
 const plan=redRoofPlan(row);for(const cap of plan.roofs)polyBlock(cap.poly,cap.base,cap.thickness,cap.color);
 for(const edge of plan.edges)box(edge.x,edge.y,edge.z,edge.w,edge.h,edge.d,edge.color,edge.angle);
 // Record BUILDING parts before adding the freestanding sign. A sign on a
 // blank lot does not prove that the restaurant itself was rendered.
 const buildingParts=scene.children.slice(2);
 if(buildingParts.length<8)throw Error('Incomplete McDonald model scene graph');
 const arches=renderMcDonaldsArches(T,scene,row);
 if(!arches||arches.children.length!==2)throw Error('Freestanding golden-arches sign missing');
 // Neutral illustrative scene context only; does not modify the GIS source.
 box(long.near[0]+13,-.18,(long.near[1]+long.far[1])/2,24,.13,long.length+10,0x858b8d);
 box(long.near[0]+2,-.09,(long.near[1]+long.far[1])/2,3,.14,long.length+9,0xc5c6c1);
 box(row.x,-.22,row.front+8,36,.13,15,0x50585d);
 const center=new T.Vector3(long.near[0],3,(long.near[1]+long.far[1])/2);
 const presets={
  // Photo-level presets are physically plausible starting viewpoints, NOT
  // a survey-calibrated match to either Google Street View camera position.
  parking:{position:[long.near[0]+35,2.55,center.z+2.5],target:[center.x,2.6,center.z]},
  oblique:{position:[long.near[0]+31,18,center.z+12],target:[center.x,3,center.z]},
  broad:{position:[row.x-3.0,2.65,row.front+23],target:[row.x+1.0,2.6,row.front]},
  top:{position:[long.near[0]+20,41,center.z+6],target:[row.x,3,center.z]}
 };
 let selected='parking';const target=new T.Vector3(),angles={theta:0,phi:1.21,radius:40};
 const comparison=$('comparison-image');
 function setView(key){
  selected=key;const p=presets[key];camera.position.fromArray(p.position);target.fromArray(p.target);camera.lookAt(target);
  const broad=key==='broad';
  if(comparison){comparison.src=broad?'../qa-reference/McDonalds_Broad_StreetView_capture_unknown.png':'../qa-reference/McDonalds_StreetView_2020-11.png';
   comparison.alt=broad?'Broad-facing photo, capture date unknown':'Long parking elevation, November 2020';}
  draw();
 }
 function draw(){const w=canvas.clientWidth||700,h=canvas.clientHeight||470;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);status.textContent=`MCD-20261123-FINAL-FACADE-QA · real WebGL frame · ${selected} · GIS ${row.id} · UNAPPROVED`}
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
 // Reject blank WebGL evidence before downloading. A successful API call does
 // not prove model similarity, but a uniform/empty image can never count.
 function screenshotPixels(){
  if(renderer.getContext().isContextLost())throw Error('WebGL context is lost; cannot capture 3D evidence');
  draw();const probe=document.createElement('canvas');probe.width=128;probe.height=96;
  const ctx=probe.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw Error('Screenshot pixel verification unavailable');
  ctx.drawImage(canvas,0,0,probe.width,probe.height);
  const rendered=ctx.getImageData(0,0,probe.width,probe.height).data.slice();
  let sum=0,squared=0,n=0;
  for(let i=0;i<rendered.length;i+=4){const l=(rendered[i]*3+rendered[i+1]*6+rendered[i+2])/10;sum+=l;squared+=l*l;n++}
  const variance=squared/n-(sum/n)**2;
  if(variance<65)throw Error('Screenshot nearly blank/flat (variance '+variance.toFixed(1)+')');
  // Compare the same camera WITH vs WITHOUT the RESTAURANT itself. This rejects a
  // screenshot containing only textured streetscape, sky or the roadside sign.
  let hiddenFrame;
  try{
   for(const part of buildingParts)part.visible=false;
   renderer.render(scene,camera);
   ctx.clearRect(0,0,probe.width,probe.height);
   ctx.drawImage(canvas,0,0,probe.width,probe.height);
   hiddenFrame=ctx.getImageData(0,0,probe.width,probe.height).data;
  }finally{
   for(const part of buildingParts)part.visible=true;
   renderer.render(scene,camera);
  }
  const {count,fraction}=assertModelVisible(rendered,hiddenFrame,probe.width,probe.height);
  return {variance:+variance.toFixed(2),modelVisibleFraction:+fraction.toFixed(4),
   modelVisiblePixels:count,image:canvas.toDataURL('image/png')};
 }

 function downloadData(name,data){
  const a=document.createElement('a');a.href=data;a.download=name;document.body.append(a);a.click();a.remove();
 }
 // Hash every dependency of the QA model AND the corresponding mapped scene,
 // not just six handpicked files. A changed renderer invalidates prior evidence.
 const sources=['mapped-data.json','commercial-facades-20.mjs','mcdonalds-finishes.mjs','landmark-fidelity-21.mjs',
  'mcdonalds-roof-16.mjs','interiors.js','mcdonalds-qa.mjs',
  'mcdonalds-gis-snapshot.mjs','mcdonalds-shared-preview.mjs',
  'mapped-geometry.js','mapped.js','mapped.html','aerial.js','district-geometry.js',
  'frontage-details.js','model-visibility-qa.mjs','vendor/three.module.js','mcdonalds-qa.html'];
 async function sha256(bytes){
  if(!globalThis.crypto?.subtle)throw Error('SHA-256 unavailable; use localhost HTTP and a secure context');
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 }
 async function fingerprint(){
  const out={};
  for(const file of sources){
   const r=await fetch('./'+file,{cache:'no-store'});
   if(!r.ok)throw Error('Required QA source missing: '+file);
   out[file]=await sha256(await r.arrayBuffer());
  }
  const refPath=selected==='broad'?'../qa-reference/McDonalds_Broad_StreetView_capture_unknown.png':'../qa-reference/McDonalds_StreetView_2020-11.png';
  const ref=await fetch(refPath,{cache:'no-store'});
  if(!ref.ok)throw Error('Reference photograph missing: '+refPath);
  return {sources:out,reference:{path:refPath,sha256:await sha256(await ref.arrayBuffer())}};
 }

 async function evidence(sample=screenshotPixels()){
  const hashes=await fingerprint();
  const pngBytes=Uint8Array.from(atob(sample.image.split(',')[1]),c=>c.charCodeAt(0));
  return {schema:'BSV-mcdonalds-3d-evidence-v2',releaseApproved:false,
   recordedAt:new Date().toISOString(),sourceBuildingId:row.id,
   modelArea:'unreleased-source-parity',candidateId:'MCD-20261123-FINAL-FACADE-QA',cameraPreset:selected,
   camera:{position:camera.position.toArray(),target:target.toArray(),fov:camera.fov,aspect:camera.aspect},
   currentPhotoVerified:false,
   reference:{...hashes.reference,captureDate:selected==='broad'?null:'2020-11'},
   threeRevision:T.REVISION,viewerPath:location.pathname,
   screenshotVariance:sample.variance,modelVisibleFraction:sample.modelVisibleFraction,
   modelVisiblePixels:sample.modelVisiblePixels,screenshotSha256:await sha256(pngBytes.buffer),
   sourceSha256:hashes.sources,
   notes:'Actual WebGL screenshot with model-visibility check. Not proof of architectural similarity, current photo date, or release readiness.'};
 }

 $('capture').onclick=()=>{try{const sample=screenshotPixels();downloadData(`McDonalds-BSV21-UNRELEASED-${selected}.png`,sample.image)}catch(e){fail(e)}};
 $('capture-pair').onclick=async()=>{try{
   const sample=screenshotPixels(),record=await evidence(sample);
   const base=`McDonalds-${selected}-${record.candidateId}-EVIDENCE`;
   downloadData(base+'.png',sample.image);
   const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);downloadData(base+'.json',url);
   setTimeout(()=>URL.revokeObjectURL(url),8000);
   status.textContent='Both matching evidence files saved (some browsers request permission for multiple downloads). NOT approved.';
  }catch(e){fail(e)} };
 $('capture-manifest').onclick=async()=>{try{
   const record=await evidence();
   const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   downloadData(`McDonalds-BSV21-${selected}-evidence.json`,url);
   setTimeout(()=>URL.revokeObjectURL(url),5000);
  }catch(e){fail(e)} };
 $('capture-comparison').onclick=async()=>{try{
   const record=await evidence();
   const W=1800,H=830,gap=20,top=90,cell=(W-3*gap)/2;
   const out=document.createElement('canvas');out.width=W;out.height=H;
   const ctx=out.getContext('2d');if(!ctx)throw Error('2D QA export unavailable');
   ctx.fillStyle='#172c36';ctx.fillRect(0,0,W,H);
   ctx.fillStyle='#f4f5f4';ctx.font='bold 29px Segoe UI,Arial';
   ctx.fillText('McDonald’s · UNRELEASED photographic comparison',25,39);
   ctx.font='20px Segoe UI,Arial';ctx.fillStyle='#eed8a4';
   ctx.fillText('Photo: '+(record.reference.captureDate||'capture date UNKNOWN')+'   |   3D: actual WebGL source '+record.cameraPreset,25,72);
   if(!comparison?.complete||!comparison.naturalWidth)throw Error('Reference photograph unavailable for composite capture');
   function fit(img,x,y,w,h){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
    const scale=Math.min(w/iw,h/ih);const rw=iw*scale,rh=ih*scale;
    ctx.drawImage(img,x+(w-rw)/2,y+(h-rh)/2,rw,rh);}
   ctx.fillStyle='#0b171b';ctx.fillRect(gap,top,cell,H-top-gap);
   ctx.fillRect(2*gap+cell,top,cell,H-top-gap);
   fit(comparison,gap,top,cell,H-top-gap);
   fit(canvas,2*gap+cell,top,cell,H-top-gap);
   downloadData(`McDonalds-BSV21-${selected}-SIDE-BY-SIDE-UNAPPROVED.png`,out.toDataURL('image/png'));
   status.textContent='Source-matched 3D evidence captured; comparison saved for review, NOT approved.';
  }catch(e){fail(e)}};
 let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};
   const offset=camera.position.clone().sub(target);const sph=new T.Spherical().setFromVector3(offset);sph.theta-=dx*.007;sph.phi=Math.max(.15,Math.min(Math.PI-.13,sph.phi+dy*.007));offset.setFromSpherical(sph);camera.position.copy(target).add(offset);camera.lookAt(target);draw()});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const delta=camera.position.clone().sub(target);delta.multiplyScalar(e.deltaY>0?1.09:.91).clampLength(11,125);camera.position.copy(target).add(delta);camera.lookAt(target);draw()},{passive:false});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('WebGL context lost; this model cannot be approved from a fallback image')});
 new ResizeObserver(draw).observe(canvas);
 $('metrics').textContent=`GIS footprint ${row.w.toFixed(2)} × ${row.d.toFixed(2)} m; model height ${row.h.toFixed(2)} m. Long parking elevation ${long.length.toFixed(2)} m (2020); short Broad-facing end ${row.w.toFixed(2)} m (new image capture date unknown). Both UNAPPROVED.`;
 setView('broad');
}catch(e){fail(e)}
