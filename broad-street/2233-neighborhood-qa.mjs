/** Actual contiguous municipal GIS frontage viewer, not an artist's surrogate.
 * Renders 2231 + 2233 + 2235-37 using the SAME renderOpeningSurveyFrontage
 * as mapped-geometry.js. Source photos from April 2025 are not redistributed.
 */
import * as T from 'three';
import {openingLayout,renderOpeningSurveyFrontage} from './opening-survey-15.mjs';
import {FACADE_2233_ID,FACADE_2233_CANDIDATE} from './2233-facade.mjs';
import {assertModelVisible} from './model-visibility-qa.mjs';
const $=id=>document.getElementById(id), canvas=$('view'), status=$('status');
const IDS=['1003388','1525758','1547386'];
const SOURCES=['mapped-data.json','opening-survey-15.mjs','2233-facade.mjs','2239-facade.mjs','2231-facade.mjs','frontage-review-14.mjs','mapped-geometry.js','mapped.js','mapped.html','model-visibility-qa.mjs','2233-qa.html','2233-qa.mjs','vendor/three.module.js','2235-37-facade.mjs','2233-neighborhood-qa.html','2233-neighborhood-qa.mjs'];
const errText=$('error');function fail(e){errText.hidden=false;errText.textContent=String(e?.stack||e);status.textContent='UNAPPROVED — browser QA failed';console.error(e)}
function asBytes(data){return Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));}
async function sha(bytes){const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')}
function download(filename,data){const a=document.createElement('a');a.href=data;a.download=filename;document.body.append(a);a.click();a.remove()}
try{
 const response=await fetch('./mapped-data.json',{cache:'no-store'});if(!response.ok)throw Error('Missing original GIS source');
 const all=(await response.json()).rows;
 const rows=IDS.map(id=>all.find(row=>String(row.id)===id));
 if(rows.some(r=>!r))throw Error('One or more dated GIS parcel records missing');
 const central=rows[1],edge=openingLayout(central).edges[0];
 if(!edge||edge.width<5)throw Error('2233 source front edge missing');
 const scene=new T.Scene();scene.background=new T.Color(0xc2d4dc);
 scene.add(new T.HemisphereLight(0xffffff,0x69828e,2.3));const sunlight=new T.DirectionalLight(0xffeed5,2.4);sunlight.position.set(-255,55,12);scene.add(sunlight);
 const renderer=new T.WebGLRenderer({canvas,preserveDrawingBuffer:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=T.SRGBColorSpace;
 const camera=new T.PerspectiveCamera(42,1,.1,320),cube=new T.BoxGeometry(),materials=new Map();
 function material(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.88,side:T.DoubleSide}));return materials.get(c)}
 function add(geo,c,x=0,y=0,z=0){const m=new T.Mesh(geo,material(c));m.position.set(x,y,z);scene.add(m);return m}
 function box(x,y,z,w,h,d,c,angle=0){const m=add(cube,c,x,y,z);m.scale.set(w,h,d);m.rotation.y=angle;return m}
 function block(poly,h,c,base=0){const path=(ring,cls)=>{const p=new cls();ring.forEach(([x,z],i)=>i?p.lineTo(x,-z):p.moveTo(x,-z));p.closePath();return p};const s=path(poly[0],T.Shape);s.holes=poly.slice(1).map(r=>path(r,T.Path));const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);return add(g,c,0,base,0)}
 // Same ground and Broad Street road elevations as mapped-geometry.js, but
 // bounded to the three-parcel visual proof region for reproducible QA.
 box(-287,-.45,-36,45,.5,70,0xa6a394);box(-287,-.15,0,45,.20,28,0x535759);
 box(-287,-.055,-18,45,.085,7,0xd2cebb);
 const partsById=new Map();
 for(const row of rows){const start=scene.children.length;
  if(!renderOpeningSurveyFrontage(row,{T,block,box,mesh:add}))throw Error(`GIS renderer rejected ${row.id}`);
  const items=scene.children.slice(start);if(items.length<20)throw Error(`Missing facade features: ${row.id}`);partsById.set(String(row.id),items);
 }
 const allParts=[...partsById.values()].flat(),subjectParts=partsById.get(FACADE_2233_ID);
 if(!subjectParts||subjectParts.length<200)throw Error('2233 source-detail objects missing');
 const target=new T.Vector3(edge.x,9,-22);
 const views={front:{position:[-289,5.3,14.5],target:[-289,9,-22]},oblique:{position:[-277,10.5,14],target:[-289,10,-22]},top:{position:[-284,40,4],target:[-289,5.5,-27]}};
 let view='front',edited=false;
 function draw(){const w=canvas.clientWidth||900,h=canvas.clientHeight||600;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);status.textContent=`${FACADE_2233_CANDIDATE} · contiguous GIS trio · ${view}${edited?' (edited)':' (canonical)'} · WebGL · UNAPPROVED`}
 function setView(k){view=k;edited=false;camera.position.fromArray(views[k].position);target.fromArray(views[k].target);camera.lookAt(target);draw()}
 for(const e of document.querySelectorAll('[data-view]'))e.onclick=()=>setView(e.dataset.view);
 function screen(){const probe=document.createElement('canvas');probe.width=144;probe.height=96;const c=probe.getContext('2d',{willReadFrequently:true});c.drawImage(canvas,0,0,144,96);return c.getImageData(0,0,144,96).data.slice()}
 function captureFrame(){if(renderer.getContext().isContextLost())throw Error('WebGL context lost');draw();const rendered=screen(),png=canvas.toDataURL('image/png');
  try{subjectParts.forEach(m=>m.visible=false);renderer.render(scene,camera);const subjectHidden=screen();const subj=assertModelVisible(rendered,subjectHidden,144,96,{minFraction:.010});
   allParts.forEach(m=>m.visible=false);renderer.render(scene,camera);const allHidden=screen();const allVisible=assertModelVisible(rendered,allHidden,144,96,{minFraction:.07});
   return {png,visible:allVisible,subject:subj};
  }finally{allParts.forEach(m=>m.visible=true);draw()}
 }
 async function captureCanonical(k){if(!Object.hasOwn(views,k))throw Error('Unknown GIS context camera preset');setView(k);const frame=captureFrame();const sourceSha256={};
  for(const filename of SOURCES){const r=await fetch('./'+filename,{cache:'no-store'});if(!r.ok)throw Error('Missing context source '+filename);sourceSha256[filename]=await sha(await r.arrayBuffer())}
  const evidence={schema:'BSV-2233-neighborhood-evidence-v1',candidateId:FACADE_2233_CANDIDATE,sourceBuildingId:FACADE_2233_ID,
   contextBuildingIds:IDS,subjectVisibleFraction:frame.subject.fraction,subjectVisiblePixels:frame.subject.count,
   releaseApproved:false,recordedAt:new Date().toISOString(),cameraPreset:k,canonicalCamera:true,camera:{position:camera.position.toArray(),target:target.toArray(),fov:camera.fov,aspect:camera.aspect},
   measuredArchitecturalAccuracy:false,referenceImageConfirmedAtLibrary:true,modelVisibleFraction:frame.visible.fraction,modelVisiblePixels:frame.visible.count,
   screenshotSha256:await sha(asBytes(frame.png).buffer),sourceSha256,sourceMetrics:{frontageWidthMeters:edge.width,modelHeightMeters:central.h},
   reference:{name:'Screenshot 2026-11-21 030932.png',captureDate:'2025-04 per saved audit',attached:false},
   notes:'Three real adjacent GIS buildings from the shared renderer; not an entire street or full game render; photo similarity and 2026 survey unverified.'};
  return {pngDataUri:frame.png,evidence};
 }
 window.__architectureQA=Object.freeze({ready:true,candidate:FACADE_2233_CANDIDATE,captureCanonical});
 $('capture-pair').onclick=async()=>{try{const {pngDataUri,evidence}=await captureCanonical(view),name=`2233-neighbors-${view}-${FACADE_2233_CANDIDATE}-EVIDENCE`;download(name+'.png',pngDataUri);
  const u=URL.createObjectURL(new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}));download(name+'.json',u);setTimeout(()=>URL.revokeObjectURL(u),7000);
 }catch(e){fail(e)}};
 let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};const off=camera.position.clone().sub(target),sp=new T.Spherical().setFromVector3(off);sp.theta-=dx*.007;sp.phi=Math.max(.18,Math.min(Math.PI-.18,sp.phi+dy*.007));off.setFromSpherical(sp);camera.position.copy(target).add(off);camera.lookAt(target);edited=true;draw()});
 for(const k of ['pointerup','pointercancel'])canvas.addEventListener(k,()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const off=camera.position.clone().sub(target);off.multiplyScalar(e.deltaY>0?1.09:.91).clampLength(15,100);camera.position.copy(target).add(off);camera.lookAt(target);edited=true;draw()},{passive:false});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(Error('WebGL context lost'))});new ResizeObserver(draw).observe(canvas);setView('front');
}catch(e){fail(e)}
