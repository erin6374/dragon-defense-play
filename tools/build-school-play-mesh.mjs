// Run with Node 24+ from any directory. The source FBX is kept intact.
import {registerHooks} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

const threeRoot=new URL('../vendor/three/',import.meta.url);
registerHooks({resolve(specifier,context,next){
 if(specifier==='three')return next(new URL('build/three.module.js',threeRoot).href,context);
 if(specifier.startsWith('three/addons/'))return next(new URL('examples/jsm/'+specifier.slice(13),threeRoot).href,context);
 return next(specifier,context);
}});
const THREE=await import('three');
const {FBXLoader}=await import('three/addons/loaders/FBXLoader.js');
const {batchSchoolSource}=await import('../src/rendering/school-source-batch.js');
const {snapshotSchoolMesh}=await import('../src/rendering/school-comparison.js');
const {classifyArchitecturalMesh,fitSchoolFromFacade,schoolSourceCategory}=await import('../src/rendering/tech-freire-source-fit.js');
const {sourceComponentMaterial}=await import('../src/simulation/school-source-impact.js');
const source=await readFile(new URL('../assets/tech-freire-original.fbx',import.meta.url));
globalThis.window={innerWidth:1280,innerHeight:720};
const fbx=new FBXLoader().parse(source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength),'');
fbx.rotation.x=-Math.PI/2;
fbx.updateMatrixWorld(true);
const box=new THREE.Box3(),fit=fitSchoolFromFacade();
const school=new THREE.Group();
school.position.set(fit.translation.x,fit.translation.y,fit.translation.z);
school.scale.setScalar(fit.scale);
const components=[],byCategory={};
const roles={school:0,leftRowhouse:0,rightRowhouse:0,excluded:0};
const toGame=p=>({x:p.x*fit.scale+fit.translation.x,y:p.y*fit.scale+fit.translation.y,z:p.z*fit.scale+fit.translation.z});
fbx.traverse(mesh=>{
 if(!mesh.isMesh)return;
 box.setFromObject(mesh);
 const role=classifyArchitecturalMesh(mesh,box);
 roles[role??'excluded']++;
 if(role!=='school')return;
 const category=schoolSourceCategory(mesh);
 const triangles=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3;
 const report=byCategory[category]??={original:0,kept:0,approximated:0,omitted:0};
 report.original+=triangles;
 components.push({category,material:sourceComponentMaterial(category,mesh.name||''),min:toGame(box.min),max:toGame(box.max)});
 if(['furniture','plumbing','lighting'].includes(category)&&triangles>192){
  // Keep the fixture footprint and height as seen through windows or a breach.
  const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  if(Math.min(size.x,size.y,size.z)<.035){report.omitted++;return;}
  const proxy=new THREE.Mesh(new THREE.BoxGeometry(size.x*.9,size.y*.92,size.z*.9),mesh.material);
  proxy.name=mesh.name;
  proxy.matrixAutoUpdate=false;
  proxy.matrix.makeTranslation(...center.toArray());
  school.add(proxy);
  report.approximated++;
  return;
 }
 // Dense railing sweeps dominate circulation vertices. Keep stair flights,
 // ramps and low-poly rails. Leave very dense decorative railings to inspection.
 if(category==='circulation'&&triangles>360&&/rail|baluster/i.test(mesh.name)){
  report.omitted++;return;
 }
 school.add(snapshotSchoolMesh(mesh));
 report.kept+=triangles;
});
const result=batchSchoolSource(school,()=>{});
const materialIds=new Map(),materials=[],batches=[],buffers=[];
for(const mesh of result.model.children){
 if(Array.isArray(mesh.material)||mesh.material.map)throw Error('Expected untextured single-material school batch');
 if(!materialIds.has(mesh.material)){
  materialIds.set(mesh.material,materials.length);materials.push(mesh.material.toJSON());
 }
 const sourceGeometry=mesh.geometry;
 const geometry=sourceGeometry.index?sourceGeometry.toNonIndexed():sourceGeometry;
 const {position,normal}=geometry.attributes;
 // Source units use 1/128 resolution, about three millimeters after placement.
 const data=new Int16Array(position.count*6);
 for(let i=0;i<position.count;i++){
  for(let axis=0;axis<3;axis++){
   const p=Math.round(position.array[i*3+axis]*128);
   if(Math.abs(p)>32767)throw Error('Position exceeds play mesh range');
   data[i*6+axis]=p;
   data[i*6+axis+3]=Math.round(normal.array[i*3+axis]*32767);
  }
 }
 if(!mesh.matrix.equals(new THREE.Matrix4()))throw Error('Unexpected unbaked transform');
 buffers.push(Buffer.from(data.buffer));batches.push({material:materialIds.get(mesh.material),count:position.count,name:mesh.name});
}
const originalTriangles=Object.values(byCategory).reduce((sum,row)=>sum+row.original,0);
const metadata={format:1,sourceSha256:createHash('sha256').update(source).digest('hex'),roles,fit,components,byCategory,
 originalTriangles,triangles:result.outputTriangles,materials,batches};
if(metadata.triangles>250000)throw Error(`Play mesh exceeds 250k triangle budget: ${metadata.triangles}`);
const header=Buffer.from(JSON.stringify(metadata));
const prefix=Buffer.alloc(4);
prefix.writeUInt32LE(header.length);
let pad=Buffer.alloc(header.length%2);
const bytes=gzipSync(Buffer.concat([prefix,header,pad,...buffers]),{level:9});
await writeFile(new URL('../assets/tech-freire-play-mesh-v1.bin',import.meta.url),bytes);
console.log({originalTriangles,playTriangles:metadata.triangles,batches:batches.length,bytes:bytes.length,byCategory});
