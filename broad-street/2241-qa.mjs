import * as T from 'three';
import {renderOpeningSurveyFrontage,openingLayout} from './opening-survey-15.mjs';
import {assertModelVisible} from './model-visibility-qa.mjs';
import {ROWHOUSE_2241_GIS_ID,ROWHOUSE_2241_CANDIDATE} from './2241-facade.mjs';
const $=id=>document.getElementById(id),canvas=$('view'),status=$('status');
let renderer;
function fail(e){$('error').hidden=false;$('error').textContent=String(e?.stack||e);status.textContent='UNAPPROVED — QA capture failed';console.error(e)}
function download(name,data){const a=document.createElement('a');a.href=data;a.download=name;document.body.append(a);a.click();a.remove()}
function bytesFromDataUri(uri){return Uint8Array.from(atob(uri.split(',')[1]),c=>c.charCodeAt(0))}
async function sha(bytes){const b=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const sources=['mapped-data.json','opening-survey-15.mjs','2241-facade.mjs','2239-facade.mjs','frontage-review-14.mjs','mapped-geometry.js','mapped.js','mapped.html','model-visibility-qa.mjs','2241-qa.html','2241-qa.mjs','vendor/three.module.js'];
try{
 const req=await fetch('./mapped-data.json',{cache:'no-store'});if(!req.ok)throw Error('Municipal GIS source missing');
 const row=(await req.json()).rows.find(r=>String(r.id)===ROWHOUSE_2241_GIS_ID);
 if(!row)throw Error('Municipal 2241 building 1508518 missing');
 const layout=openingLayout(row);if(layout.openings.length!==4||layout.groundOpenings.length!==2||layout.doors.length!==1)throw Error('2241 front opening audit changed');
 const edge=layout.edges[0];if(!edge)throw Error('No GIS front edge for 2241');
 const scene=new T.Scene();scene.background=new T.Color(0xc2d4dc);
 scene.add(new T.HemisphereLight(0xffffff,0x71828a,2.15));const sun=new T.DirectionalLight(0xfff4e1,2.1);sun.position.set(row.x+24,40,row.front+20);scene.add(sun);
 renderer=new T.WebGLRenderer({canvas,preserveDrawingBuffer:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=T.SRGBColorSpace;
 const camera=new T.PerspectiveCamera(42,1,.1,500),materials=new Map(),cube=new T.BoxGeometry();
 function material(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.87,side:T.DoubleSide}));return materials.get(c)}
 function add(geo,c,x=0,y=0,z=0){const m=new T.Mesh(geo,material(c));m.position.set(x,y,z);scene.add(m);return m}
 function box(x,y,z,w,h,d,c,angle=0){const m=add(cube,c,x,y,z);m.scale.set(w,h,d);m.rotation.y=angle;return m}
 function block(poly,h,c,base=0){const make=(ring,ctor)=>{const s=new ctor();ring.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();return s};const s=make(poly[0],T.Shape);s.holes=poly.slice(1).map(r=>make(r,T.Path));const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);return add(g,c,0,base,0)}
 const coreStart=scene.children.length;
 if(!renderOpeningSurveyFrontage(row,{box,block,mesh:add,T}))throw Error('2241 source renderer not applied');
 const buildingParts=scene.children.slice(coreStart);if(buildingParts.length<20)throw Error('Incomplete facade scene graph');
 // Simple independent context to judge height, ground and sidewalk; NOT
 // a substitute for city-wide placement QA against the neighboring parcels.
 box(edge.x,-.10,row.front+1.6,edge.width+4,.18,3,0xc7c8bd);
 box(edge.x,-.19,row.front+7.5,edge.width+10,.17,9,0x606970);
 const target=new T.Vector3(edge.x,6.2,edge.z);
 const views={front:{position:[edge.x,2.65,edge.z+19.5],target:[edge.x,6.05,edge.z]},oblique:{position:[edge.x+9,5.2,edge.z+18],target:[edge.x,6,edge.z-3]},top:{position:[edge.x+10,29,edge.z+7],target:[edge.x,4.5,edge.z-4]}};
 let view='front',cameraEdited=false;
 function draw(){const w=canvas.clientWidth||780,h=canvas.clientHeight||480;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);status.textContent=`${ROWHOUSE_2241_CANDIDATE} · WebGL · ${view}${cameraEdited?' (orbited)':' (canonical)'} · GIS ${row.id} · UNAPPROVED`}
 function setView(k){view=k;cameraEdited=false;camera.position.fromArray(views[k].position);target.fromArray(views[k].target);camera.lookAt(target);draw()}
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
 function screenshot(canonical){
  if(renderer.getContext().isContextLost())throw Error('Lost WebGL context');draw();
  const probe=document.createElement('canvas');probe.width=144;probe.height=96;const ctx=probe.getContext('2d',{willReadFrequently:true});
  const sample=()=>{ctx.drawImage(canvas,0,0,144,96);return ctx.getImageData(0,0,144,96).data.slice()};
  const shown=sample(),png=canvas.toDataURL('image/png');
  try{buildingParts.forEach(m=>m.visible=false);renderer.render(scene,camera);const hidden=sample();const visible=assertModelVisible(shown,hidden,144,96,{minFraction:canonical&&view==='front'?.07:.03});
   return {png,modelVisibleFraction:visible.fraction,modelVisiblePixels:visible.count};
  }finally{buildingParts.forEach(m=>m.visible=true);draw()}
 }
 async function fingerprint(){const out={};for(const file of sources){const r=await fetch('./'+file,{cache:'no-store'});if(!r.ok)throw Error('Required source missing: '+file);out[file]=await sha(await r.arrayBuffer())}return out}
 async function savePair(canonical){try{
  // Mandatory evidence presets are deterministic: an earlier orbit cannot be
  // silently labeled 'Street-level front' when the camera is over the roof.
  if(canonical)setView(view);
  const frame=screenshot(canonical),pngBytes=bytesFromDataUri(frame.png),sourceSha256=await fingerprint();
  const file=$('photo').files?.[0];const reference=file?{name:file.name,sha256:await sha(await file.arrayBuffer()),captureDate:'unknown (audit lists underlying 2025-04; confirm in Street View)'}:{name:'Screenshot 2026-11-21 030946.png',captureDate:'2025-04 per saved audit; image not bundled',attached:false};
  const evidence={schema:'BSV-2241-architecture-evidence-v1',candidateId:ROWHOUSE_2241_CANDIDATE,sourceBuildingId:ROWHOUSE_2241_GIS_ID,releaseApproved:false,
   recordedAt:new Date().toISOString(),cameraPreset:canonical?view:'free-orbit-from-'+view,canonicalCamera:canonical,camera:{position:camera.position.toArray(),target:target.toArray(),fov:camera.fov,aspect:camera.aspect},
   measuredArchitecturalAccuracy:false,referenceImageConfirmedAtLibrary:true,modelVisibleFraction:frame.modelVisibleFraction,modelVisiblePixels:frame.modelVisiblePixels,
   screenshotSha256:await sha(pngBytes.buffer),sourceSha256,reference,sourceMetrics:{footprintWidthMeters:row.w,frontageWidthMeters:edge.width,depthMeters:row.d,modelHeightMeters:row.h},
   openingInventory:{upperWindows:4,groundWindows:2,entrances:1,doorSide:'left',archedHood:true},notes:'Captured from the actual shared source renderer. The facade must still be compared by eye with dated photo and adjacent streetscape.'};
  const filename=`2241-${canonical?view:'orbit'}-${ROWHOUSE_2241_CANDIDATE}-EVIDENCE`;
  download(filename+'.png',frame.png);const blob=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);download(filename+'.json',url);setTimeout(()=>URL.revokeObjectURL(url),12000);
  status.textContent='Matching PNG and JSON saved. NOT architecturally approved.';
 }catch(e){fail(e)}}
 $('capture-pair').onclick=()=>savePair(true);
 $('capture-orbit').onclick=()=>savePair(false);
 $('photo').onchange=()=>{const file=$('photo').files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{$('photo-preview').src=r.result;$('photo-preview').hidden=false};r.readAsDataURL(file)};
 let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};const off=camera.position.clone().sub(target),sp=new T.Spherical().setFromVector3(off);sp.theta-=dx*.007;sp.phi=Math.max(.18,Math.min(Math.PI-.18,sp.phi+dy*.007));off.setFromSpherical(sp);camera.position.copy(target).add(off);camera.lookAt(target);cameraEdited=true;draw()});
 for(const e of ['pointerup','pointercancel'])canvas.addEventListener(e,()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const offset=camera.position.clone().sub(target);offset.multiplyScalar(e.deltaY>0?1.09:.91).clampLength(9,90);camera.position.copy(target).add(offset);camera.lookAt(target);cameraEdited=true;draw()},{passive:false});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(Error('WebGL context lost'))});new ResizeObserver(draw).observe(canvas);
 setView('front');
}catch(e){fail(e)}
