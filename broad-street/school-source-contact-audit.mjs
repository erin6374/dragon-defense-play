import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from './vendor/three.module.js';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const {FBXLoader}=await import('./vendor/FBXLoader.bundle.mjs');
const {keepFBXExteriorOnly,calculateRevitPlacement,ORIGINAL_FBX_SHA256,STREET_VISIBLE_MESH}=await import('./school-original-fbx.mjs');
T.TextureLoader.prototype.load=function(){return new T.Texture()};
globalThis.window={innerWidth:1280,innerHeight:720};
const bytes=readFileSync(new URL('./assets/tech-freire-original.fbx',import.meta.url));
const sha=createHash('sha256').update(bytes).digest('hex');
if(sha!==ORIGINAL_FBX_SHA256)throw Error('Original FBX hash mismatch');
const root=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const data=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8'));
const row=data.rows.find(r=>r.id==='1003073');const p=calculateRevitPlacement(row);
root.rotation.x=p.rotationX;root.scale.setScalar(p.scale);root.position.set(p.x,p.y,p.z);root.updateMatrixWorld(true);
const inventory=[];const v=new T.Vector3();
root.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes?.position)return;const a=o.geometry.attributes.position,b=new T.Box3();for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);b.expandByPoint(v);}const min=b.min.toArray(),max=b.max.toArray();inventory.push({name:o.name,retained:STREET_VISIBLE_MESH.test(o.name),min,max,vertices:a.count});});
const stats=keepFBXExteriorOnly(root);
const mounted=[];root.traverse(o=>{if(o.isMesh)mounted.push(o.name)});
const roofs=inventory.filter(v=>/^Basic_Roof/i.test(v.name));
if(roofs.length!==2||roofs.some(v=>!mounted.includes(v.name)))throw Error('Original roof deck missing after filter');
const skylights=inventory.filter(v=>/^Window-skylight-VELUX_/i.test(v.name));
if(skylights.length!==9||skylights.some(v=>!mounted.includes(v.name)))throw Error('Original skylight mesh missing after filter');
// The highest deck elevation is a conservative reference, not a local roof surface.
const top=Math.max(...roofs.map(v=>v.max[1]));
const skylightReview=skylights.map(v=>({...v,aboveHighestDeckMeters:+(v.max[1]-top).toFixed(6)}));
if(skylightReview.some(v=>v.aboveHighestDeckMeters<=0))throw Error('Skylight entirely below deck height');
if(mounted.length!==stats.retainedMeshes)throw Error('Mesh parent filter mismatch');
const tol=.005;
function screen(a){
 const parent=a.map((_,i)=>i);function find(i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i}
 const gap=(x,y)=>Math.hypot(...x.min.map((v,k)=>Math.max(0,v-y.max[k],y.min[k]-x.max[k])));
 for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(gap(a[i],a[j])<=tol)parent[find(j)]=find(i);
 const groups=new Map();for(let i=0;i<a.length;i++){const k=find(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i)}
 const sorted=[...groups.values()].sort((x,y)=>y.length-x.length);
 return {meshCount:a.length,groupCount:sorted.length,largestGroup:sorted[0].length,unresolved:sorted.slice(1).map(group=>{let distance=Infinity,nearest=null;const inGroup=new Set(group);for(const i of group)for(let j=0;j<a.length;j++)if(!inGroup.has(j)){const d=gap(a[i],a[j]);if(d<distance){distance=d;nearest=a[j].name}}return {meshes:group.map(i=>a[i].name),minimumBoxGapMeters:+distance.toFixed(6),nearestOtherMesh:nearest}})};
}
const visible=inventory.filter(v=>v.retained),before=screen(visible.filter(v=>!/^Basic_Roof|^Window-skylight-VELUX_/i.test(v.name))),previous=screen(visible.filter(v=>!/^Window-skylight-VELUX_/i.test(v.name))),after=screen(visible);
const site=visible.filter(v=>/^Floor_.*(?:Sidewalk|Grass)/i.test(v.name));
console.log(JSON.stringify({pass:true,scope:'Original FBX parsed with actual bundled FBXLoader, real world-space vertex bounds, textures mocked. AABB graph is a necessary-condition screen, not triangle contact or watertightness. Pass means import, roof and skylight retention passed; unresolved groups remain open.',sourceSha256:sha,stats,placement:p,boxGapToleranceMeters:tol,before,previous,after,restoredRoofs:roofs,restoredSkylights:skylightReview,siteGeometry:site,excludedMeshCount:inventory.filter(v=>!v.retained).length},null,2));
