import * as THREE from 'three';
// World-space surface voxelization of imported FBX triangles. Original asset is untouched.
// Surface-only, not a watertight structural conversion. Floors are separately inferred.
export class ArchitecturalVoxels {
 constructor(scene,cell=.16){this.scene=scene;this.cell=cell;this.group=new THREE.Group();scene.add(this.group);this.items=[];this.meshes=[];this.grid=new Map();this.ready=false;this.box=new THREE.Box3();this.hidden=new THREE.Matrix4().makeScale(0,0,0);this.dummy=new THREE.Object3D();}
 async build(source,onProgress=()=>{}){
  this.clear();source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source);this.box.copy(bounds);
  const step=this.cell, origin=bounds.min.clone();
  const cells=new Map(), maxCells=105000, maxSamples=320000;
  const meshes=[];source.traverse(o=>{if(o.isMesh&&o.geometry?.attributes?.position)meshes.push(o)});
  let samples=0;
  const put=(p,mat)=>{
   if(!bounds.containsPoint(p))return;
   const ix=Math.floor((p.x-origin.x)/step),iy=Math.floor((p.y-origin.y)/step),iz=Math.floor((p.z-origin.z)/step);
   const key=ix+','+iy+','+iz;
   if(!cells.has(key)&&cells.size<maxCells)cells.set(key,{ix,iy,iz,mat});
  };
  const v0=new THREE.Vector3(),v1=new THREE.Vector3(),v2=new THREE.Vector3(),p=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3();
  for(let m=0;m<meshes.length;m++){
   const o=meshes[m],g=o.geometry,attr=g.attributes.position,idx=g.index,triCount=idx?idx.count/3:attr.count/3;
   const colors=Array.isArray(o.material)?o.material:[o.material];
   let col=colors[0]?.color||new THREE.Color(0x9b867c);const hex=col.getHex();
   const mat=col.r+col.g+col.b<.45?3:(col.b>col.r*1.15?2:(col.r>col.g*1.2?0:1));
   // Limit sampling to keep the browser responsive on large Revit exports.
   const stride=Math.max(1,Math.ceil(triCount/85000));
   for(let t=0;t<triCount;t+=stride){
    const ia=idx?idx.getX(t*3):t*3,ib=idx?idx.getX(t*3+1):t*3+1,ic=idx?idx.getX(t*3+2):t*3+2;
    v0.fromBufferAttribute(attr,ia).applyMatrix4(o.matrixWorld);v1.fromBufferAttribute(attr,ib).applyMatrix4(o.matrixWorld);v2.fromBufferAttribute(attr,ic).applyMatrix4(o.matrixWorld);
    a.subVectors(v1,v0);b.subVectors(v2,v0);
    const area=a.clone().cross(b).length()*.5;
    const n=Math.min(16,Math.max(1,Math.ceil(area/(step*step*.8))));
    for(let k=0;k<n;k++){
     // Low-discrepancy deterministic barycentric sampling.
     const r1=Math.sqrt((k+.5)/n),r2=((k*0.61803398875+t*.41421356)%1);
     p.copy(v0).multiplyScalar(1-r1).addScaledVector(v1,r1*(1-r2)).addScaledVector(v2,r1*r2);
     put(p,mat);samples++;if(samples>maxSamples)break;
    }
    if(samples>maxSamples||cells.size>=maxCells)break;
   }
   if(m%12===0){onProgress(Math.round(m/meshes.length*85));await new Promise(resolve=>setTimeout(resolve,0));}
   if(samples>maxSamples||cells.size>=maxCells)break;
  }
  // No synthetic floor plates. They previously extended outside the building
  // because a bounding box is NOT an actual floor footprint. Only FBX surfaces
  // are represented; a future BIM semantic extraction can supply exact slabs.
  onProgress(90);
  const palette=[0xb8735b,0xc7b7a3,0x548ca9,0x50565f,0xa49c91];
  const byMat=palette.map(()=>[]);
  for(const c of cells.values()){
   const item={x:origin.x+(c.ix+.5)*step,y:origin.y+(c.iy+.5)*step,z:origin.z+(c.iz+.5)*step,ix:c.ix,iy:c.iy,iz:c.iz,type:c.mat,alive:true};
   item.index=byMat[c.mat].length;byMat[c.mat].push(item);this.items.push(item);
   const key=c.ix+','+c.iy+','+c.iz;this.grid.set(key,item);
  }
  const geom=new THREE.BoxGeometry(step*.97,step*.97,step*.97);
  this.meshes=byMat.map((items,type)=>{
   const mesh=new THREE.InstancedMesh(geom,new THREE.MeshLambertMaterial({color:palette[type]}),Math.max(1,items.length));
   mesh.count=items.length;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   for(const item of items){this.dummy.position.set(item.x,item.y,item.z);this.dummy.scale.setScalar(1);this.dummy.rotation.set(0,0,0);this.dummy.updateMatrix();mesh.setMatrixAt(item.index,this.dummy.matrix)}
   mesh.instanceMatrix.needsUpdate=true;this.group.add(mesh);return mesh;
  });
  this.ready=true;onProgress(100);return {count:this.items.length,meshes:meshes.length,samples,cell:step,floorMode:'source surfaces only; no invented decks'};
 }
 impact(center,radius,emit){
  if(!this.ready)return 0;
  const step=this.cell,origin=this.box.min;const ix=Math.floor((center.x-origin.x)/step),iy=Math.floor((center.y-origin.y)/step),iz=Math.floor((center.z-origin.z)/step),r=Math.ceil(radius/step),rr=radius*radius;
  let count=0;const dirty=new Set();
  for(let x=ix-r;x<=ix+r;x++)for(let y=iy-r;y<=iy+r;y++)for(let z=iz-r;z<=iz+r;z++){
   const item=this.grid.get(x+','+y+','+z);if(!item||!item.alive)continue;
   const dx=item.x-center.x,dy=item.y-center.y,dz=item.z-center.z;
   if(dx*dx+dy*dy+dz*dz>rr)continue;
   item.alive=false;count++;const mesh=this.meshes[item.type];mesh.setMatrixAt(item.index,this.hidden);dirty.add(mesh);
   if(Math.random()<.055)emit(new THREE.Vector3(item.x,item.y,item.z),item.type);
  }
  for(const mesh of dirty)mesh.instanceMatrix.needsUpdate=true;
  return count;
 }
 restore(){for(const item of this.items){if(item.alive)continue;item.alive=true;this.dummy.position.set(item.x,item.y,item.z);this.dummy.rotation.set(0,0,0);this.dummy.scale.setScalar(1);this.dummy.updateMatrix();this.meshes[item.type].setMatrixAt(item.index,this.dummy.matrix)}for(const m of this.meshes)m.instanceMatrix.needsUpdate=true}
 clear(){for(const m of this.meshes){this.group.remove(m);m.material.dispose();}if(this.meshes.length)this.meshes[0].geometry.dispose();this.meshes=[];this.items=[];this.grid.clear();this.ready=false}
}
