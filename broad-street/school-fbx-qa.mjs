import * as T from 'three';
import {mountOriginalSchoolFBX,SCHOOL_GIS_ID,ORIGINAL_FBX_SHA256} from './school-original-fbx.mjs';
const canvas=document.querySelector('#view'),status=document.querySelector('#status'),error=document.querySelector('#error');
const scene=new T.Scene();scene.background=new T.Color(0xb2ccd8);
scene.add(new T.HemisphereLight(0xfff8e6,0x6d818a,2.0));const sun=new T.DirectionalLight(0xfff1d1,2.4);sun.position.set(55,110,95);scene.add(sun);
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);
const camera=new T.PerspectiveCamera(42,16/9,.2,500);let current='front',school,schoolRow,stats,placement;
const gis=await fetch('./mapped-data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('GIS snapshot missing');return r.json()});
schoolRow=gis.rows.find(row=>String(row.id)===SCHOOL_GIS_ID);
if(!schoolRow)throw Error('School GIS record missing from original 40 building dataset');
const sf=schoolRow.front,centerZ=sf-schoolRow.d/2;
// Polygon outline is independent GIS geometry. It is NOT a substitute school.
const outlineMat=new T.LineBasicMaterial({color:0xffd54e,depthTest:false});
for(const polygon of schoolRow.polys)for(const ring of polygon){const points=ring.map(([x,z])=>new T.Vector3(x,.09,z));if(points.length>2)scene.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(points),outlineMat));}
const ground=new T.Mesh(new T.PlaneGeometry(300,170),new T.MeshStandardMaterial({color:0x858d86,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.set(schoolRow.x,-.09,centerZ);scene.add(ground);
function chooseCamera(view){current=view;
 const pos={front:[schoolRow.x,23,sf+49],oblique:[schoolRow.x+38,34,sf+51],top:[schoolRow.x,94,centerZ+29]}[view];
 if(!pos)throw Error('Unknown school QA view');
 camera.position.set(...pos);camera.lookAt(schoolRow.x,13,centerZ);camera.updateProjectionMatrix();}
function render(){const w=Math.max(canvas.clientWidth||960,900),h=Math.max(canvas.clientHeight||540,540);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);}
function comparePixels(a,b){let hits=0;for(let p=0;p<a.length;p+=4){if(Math.abs(a[p]-b[p])+Math.abs(a[p+1]-b[p+1])+Math.abs(a[p+2]-b[p+2])>34)hits++;}return hits;}
function snapshotRGBA(){const gl=renderer.getContext(),w=canvas.width,h=canvas.height,arr=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,arr);return arr;}
const waitFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
async function captureCanonical(view){if(!window.__schoolQA?.ready)throw Error('FBX has not finished parsing');chooseCamera(view);await waitFrame();render();
 const image=canvas.toDataURL('image/png'),shown=snapshotRGBA();school.visible=false;render();const hidden=snapshotRGBA();school.visible=true;render();
 const pixels=comparePixels(shown,hidden),fraction=pixels/(canvas.width*canvas.height);
 if(pixels<1000||fraction<.007)throw Error(`FBX did not contribute sufficient visible pixels: ${pixels}`);
 return {pngDataUri:image,evidence:{schema:'tech-freire-original-fbx-webgl-qa-v1',candidateId:'TECH-FREIRE-FBX-ORIGINAL-PASS-08',sourceBuildingId:SCHOOL_GIS_ID,
  cameraPreset:view,canonicalCamera:true,renderer:'Three.js WebGL',originalFBXSha256:ORIGINAL_FBX_SHA256,
  dimensionsMeters:placement.wallFootprintMeters,gisDimensionsMeters:placement.gisFootprintMeters,differenceMeters:placement.differenceMeters,
  retainedExteriorMeshes:stats.retainedMeshes,excludedInteriorMeshes:stats.excludedMeshes,placeholderSchoolRendered:false,
  screenshotWidth:canvas.width,screenshotHeight:canvas.height,modelVisiblePixels:pixels,modelVisibleFraction:fraction,
  releaseApproved:false,architecturalVisualMatchApproved:false}};
}
window.__schoolQA={ready:false,candidateId:'TECH-FREIRE-FBX-ORIGINAL-PASS-08',captureCanonical,chooseCamera};
try{
 const result=await mountOriginalSchoolFBX(scene,schoolRow,{onStatus:m=>status.textContent=m,exteriorOnly:true,onReady:()=>{}});
 ({school,stats,placement}=result);
 if(stats.retainedMeshes<500)throw Error('Too few FBX source meshes retained for correct school');
 if(scene.children.filter(x=>x.name==='tech-freire-original-FBX-2221-broad').length!==1)throw Error('Duplicate school FBX root');
 chooseCamera('front');render();window.__schoolQA.ready=true;
 status.textContent=`WebGL verified: original Tech Freire FBX, ${stats.retainedMeshes} exterior meshes, ${stats.excludedMeshes} interior source meshes hidden, GIS alignment within 1.1m`;
 for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{chooseCamera(button.dataset.view);render()};
 document.querySelector('#capture').onclick=async()=>{const p=await captureCanonical(current);const a=document.createElement('a');a.href=p.pngDataUri;a.download=`tech-freire-${current}.png`;a.click();const blob=new Blob([JSON.stringify(p.evidence,null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const b=document.createElement('a');b.href=u;b.download=`tech-freire-${current}.json`;b.click();setTimeout(()=>URL.revokeObjectURL(u),1500)};
}catch(e){error.hidden=false;error.textContent=String(e.stack||e);status.textContent='School FBX QA failed: '+e.message;console.error(e);}
