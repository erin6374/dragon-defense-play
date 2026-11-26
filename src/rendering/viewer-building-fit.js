import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFrontages } from '../../broad-street/mapped-geometry.js';
import { renderBereanRose } from '../../broad-street/landmark-fidelity-21.mjs';
import { VIEWER_TO_GAME_X, VIEWER_TO_GAME_Z } from '../simulation/viewer-parcels.js';

const masonry = new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});

// Bake opaque relief into one mesh per damage section. Keep signs, transparent
// glazing, and textured materials as authored. All pieces retain source coordinates.
export function batchOpaqueRelief(group,{preserveNamed=false}={}) {
  group.updateMatrixWorld(true);
  const geometries=[];
  const matrix=new THREE.Matrix4(), transform=new THREE.Matrix4();
  const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert();
  for(const object of [...group.children]){
    const material=object.material;
    if(!object.isMesh || !material?.isMeshStandardMaterial || material.map || material.transparent ||
      (preserveNamed&&(object.name||material.emissive?.getHex())))continue;
    const count=object.isInstancedMesh?object.count:1;
    for(let i=0;i<count;i++){
      transform.multiplyMatrices(inverse,object.matrixWorld);
      if(object.isInstancedMesh){object.getMatrixAt(i,matrix);transform.multiply(matrix);}
      const geo=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
      for(const key of Object.keys(geo.attributes))if(key!=='position'&&key!=='normal')geo.deleteAttribute(key);
      if(!geo.attributes.normal)geo.computeVertexNormals();
      geo.applyMatrix4(transform);
      const color=new Float32Array(geo.attributes.position.count*3);
      for(let j=0;j<color.length;j+=3)material.color.toArray(color,j);
      geo.setAttribute('color',new THREE.BufferAttribute(color,3));
      geometries.push(geo);
    }
    group.remove(object);
  }
  if(!geometries.length)return;
  const merged=mergeGeometries(geometries);
  for(const geometry of geometries)geometry.dispose();
  group.add(new THREE.Mesh(merged,preserveNamed?masonry.clone():masonry));
}

export function makeViewerBuilding(target) {
  const row=target.sourceRow;
  const sections=Array.from({length:4},()=>new THREE.Group());
  const detail=new THREE.Group();
  const section=(min,max)=>sections[min>=target.h*.8?3:Math.min(2,Math.max(0,Math.floor((min+max)*1.5/target.h)))];
  makeFrontages(detail,row?[row]:[],[],{
    hideTrees:true,auditOnly:true,buildingOnly:true,section,districtRecord:target.record??null
  });
  if(target.id==='1005656'){
    const offset=(13.5+1.78)*Math.SQRT1_2;
    renderBereanRose(THREE,detail,{x:row.x+offset,y:9.9,z:row.front-16.1+offset,angle:Math.PI/4});
  }
  detail.updateMatrixWorld(true);
  for(const object of [...detail.children]){
    const bounds=new THREE.Box3().setFromObject(object);
    if(!bounds.isEmpty())section(bounds.min.y,bounds.max.y).add(object);
  }
  const model=new THREE.Group();
  for(const group of sections){batchOpaqueRelief(group);model.add(group);}
  model.position.set(VIEWER_TO_GAME_X,0,VIEWER_TO_GAME_Z);
  model.updateMatrixWorld(true);
  model.matrixAutoUpdate=false;
  const bounds=new THREE.Box3().setFromObject(model);
  if(bounds.isEmpty())throw new Error(`No Viewer geometry for ${target.id} ${target.name}`);
  return {model,sections,bounds};
}
