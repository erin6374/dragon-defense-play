import * as THREE from 'three';

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
 let offset=4+headerBytes+headerBytes%2;
 for(const {count,name,material} of info.batches){
  const data=new Int16Array(payload,offset,count*6);
  offset+=data.byteLength;
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3);
  for(let i=0;i<count;i++)for(let axis=0;axis<3;axis++){
   positions[i*3+axis]=data[i*6+axis]/128;
   normals[i*3+axis]=data[i*6+axis+3]/32767;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
  geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,materials[material]);
  mesh.name=name;
  model.add(mesh);
 }
 if(offset!==payload.byteLength)throw Error('Invalid school play mesh payload length');
 return {model,info};
}
