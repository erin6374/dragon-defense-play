import * as THREE from 'three';

// Index only exactly identical quantized position AND normal tuples. This
// preserves triangle order, winding, flat edges and the original render shape.
export function decodeSchoolBatch(data) {
 if(!(data instanceof Int16Array)||data.length%18!==0)throw Error('Invalid school triangle batch');
 const count=data.length/6;
 const tableSize=2**Math.ceil(Math.log2(Math.max(2,count*1.5)));
 const table=new Uint32Array(tableSize),mask=tableSize-1;
 const remap=new Uint32Array(count),uniqueOffsets=new Uint32Array(count);
 let unique=0;
 for(let i=0;i<count;i++){
  const offset=i*6;let hash=2166136261;
  for(let k=0;k<6;k++)hash=Math.imul(hash^(data[offset+k]&65535),16777619);
  let slot=(hash^(hash>>>16))&mask;
  while(table[slot]){
   const prior=table[slot]-1,base=uniqueOffsets[prior];
   let k=0;while(k<6&&data[base+k]===data[offset+k])k++;
   if(k===6)break;
   slot=(slot+1)&mask;
  }
  if(!table[slot]){uniqueOffsets[unique]=offset;table[slot]=++unique;}
  remap[i]=table[slot]-1;
 }
 const indexBytes=unique<=65536?2:4;
 // Avoid increasing GPU storage on batches that contain few repeated tuples.
 const indexed=unique*24+count*indexBytes<count*24;
 const vertices=indexed?unique:count;
 const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3);
 for(let i=0;i<vertices;i++){
  const offset=indexed?uniqueOffsets[i]:i*6;
  for(let axis=0;axis<3;axis++){
   positions[i*3+axis]=data[offset+axis]/128;
   normals[i*3+axis]=data[offset+axis+3]/32767;
  }
 }
 const index=indexed?(indexBytes===2?new Uint16Array(remap):remap):null;
 return {positions,normals,index,vertices,originalVertices:count,bytes:positions.byteLength+normals.byteLength+(index?.byteLength||0)};
}

export async function loadSchoolPlayMesh(prepareMaterial){
 const response=await fetch(new URL('../../assets/tech-freire-play-mesh-v1.bin',import.meta.url));
 if(!response.ok||!response.body)throw Error(`School play mesh HTTP ${response.status}`);
 const payload=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 const headerBytes=new DataView(payload).getUint32(0,true);
 const info=JSON.parse(new TextDecoder().decode(new Uint8Array(payload,4,headerBytes)));
 if(info.format!==1)throw Error('Unsupported school play mesh');
 const loader=new THREE.MaterialLoader();
 const materials=info.materials.map(record=>{
  const material=loader.parse(record);
  material.userData.photoColor=material.color?.getHex();
  prepareMaterial(material);
  return material;
 });
 const model=new THREE.Group();
 const {scale,translation}=info.fit;
 model.scale.setScalar(scale);
 model.position.set(translation.x,translation.y,translation.z);
 const storage={originalVertices:0,vertices:0,originalBytes:0,bytes:0,indexedBatches:0};
 let offset=4+headerBytes+headerBytes%2;
 for(const {count,name,material} of info.batches){
  const data=new Int16Array(payload,offset,count*6);
  offset+=data.byteLength;
  const {positions,normals,index,vertices,originalVertices,bytes}=decodeSchoolBatch(data);
  storage.originalVertices+=originalVertices;storage.vertices+=vertices;
  storage.originalBytes+=originalVertices*24;storage.bytes+=bytes;
  if(index)storage.indexedBatches++;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
  if(index)geometry.setIndex(new THREE.BufferAttribute(index,1));
  geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,materials[material]);
  mesh.name=name;
  model.add(mesh);
 }
 if(offset!==payload.byteLength)throw Error('Invalid school play mesh payload length');
 return {model,info:{...info,renderStorage:storage}};
}
