// Bounded, instanced school-collapse debris. Keeps the original source FBX intact:
// local impact masks open facade holes while physical fragments detach, fall,
// rotate and persist as rubble. No per-impact mesh/material allocations.
export function createSchoolCollapseFX(THREE,scene,{capacity=216}={}){
 const geo=new THREE.BoxGeometry(1,1,1);
 const palettes=[
  new THREE.MeshStandardMaterial({color:0x97543d,roughness:.95}),
  new THREE.MeshStandardMaterial({color:0xb7b2a6,roughness:.98}),
  new THREE.MeshStandardMaterial({color:0x607888,roughness:.42,metalness:.08})
 ];
 const meshes=palettes.map((material,i)=>{
  const mesh=new THREE.InstancedMesh(geo,material,capacity);
  mesh.name='school-detached-fragments-'+i;
  mesh.frustumCulled=false;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);return mesh;
 });
 const pieces=[];let serial=0;
 const dummy=new THREE.Object3D();
 const seed=(n)=>{const v=Math.sin(n*127.13+serial*23.17)*43758.5453;return v-Math.floor(v)};
 function emit(x,y,z,material,size,vx,vy,vz,delay=0){
  if(pieces.length>=capacity*palettes.length)pieces.shift();
  pieces.push({x,y,z,material,size,vx,vy,vz,delay,angle:seed(serial++)*6.28,
    angular:(seed(serial+31)-.5)*7,resting:false});
 }
 function impact({x,y,z,radius=3.8,count=22}){
  const n=Math.min(42,Math.max(8,Math.round(count)));
  for(let i=0;i<n;i++){
   const angle=seed(serial+i*11)*Math.PI*2;
   const span=radius*(.15+seed(serial+i*23)*.8);
   const kind=i%7===0?2:i%4===0?1:0;
   const small=.15+seed(serial+i*3)*.31;
   // Slab and masonry fragments visibly leave individual window/floor bays.
   const w=kind===1?small*3.5:small*1.5;
   const h=kind===1?small*.32:small*.8;
   const d=kind===2?small*.15:small*.65;
   emit(x+Math.cos(angle)*span*.5,
    y+(seed(serial+i*13)-.5)*radius*.72,
    z+.24+seed(serial+i*19)*.8,kind,
    [w,h,d],
    Math.cos(angle)*(1+seed(serial+i*7)*4),
    1.7+seed(serial+i*5)*4.8,
    1+seed(serial+i*17)*3,
    i*.014);
  }
 }
 function collapse({min,max}){
  // Distributed floor-by-floor loss of cladding/slabs, not a single object toggle.
  const spanX=max.x-min.x,spanY=max.y-min.y;
  for(let level=4;level>=0;level--){
   const y=min.y+(level+.5)*spanY/5;
   for(let i=0;i<32;i++){
    const x=min.x+seed(serial+i*29)*spanX;
    const z=max.z-.25+seed(serial+i*41)*.8;
    const kind=i%5===0?1:i%8===0?2:0;
    const k=.22+seed(serial+i*31)*.38;
    emit(x,y+(seed(serial+i*37)-.5)*spanY/7,z,kind,
      kind===1?[k*4,k*.36,k*1.8]:[k*1.8,k,k*.95],
      (seed(serial+i*11)-.5)*7,2+seed(serial+i*3)*5,1+seed(serial+i*13)*4,
      (4-level)*.43+i*.016);
   }
  }
 }
 function update(dt){
  if(dt<=0)return;
  for(const p of pieces){
   if(p.delay>0){p.delay-=dt;continue;}
   if(p.resting)continue;
   p.vy-=18*dt;p.vx*=Math.exp(-.55*dt);p.vz*=Math.exp(-.55*dt);
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
   p.angle+=p.angular*dt;
   const floor=p.size[1]*.5-.26;
   if(p.y<floor){
    p.y=floor;
    if(Math.abs(p.vy)<1.8){p.vy=0;p.vx=0;p.vz=0;p.resting=true}
    else {p.vy*=-.25;p.vx*=.35;p.vz*=.35}
   }
  }
  const counts=[0,0,0];
  for(const p of pieces){
   if(p.delay>0)continue;
   const mesh=meshes[p.material],slot=counts[p.material]++;
   dummy.position.set(p.x,p.y,p.z);
   dummy.rotation.set(p.angle*.13,p.angle*.37,p.angle);
   dummy.scale.set(...p.size);dummy.updateMatrix();
   mesh.setMatrixAt(slot,dummy.matrix);
  }
  meshes.forEach((m,i)=>{m.count=counts[i];m.instanceMatrix.needsUpdate=true});
 }
 function reset(){pieces.length=0;serial=0;meshes.forEach(m=>{m.count=0;m.instanceMatrix.needsUpdate=true})}
 function stats(){return {pieces:pieces.length,moving:pieces.filter(p=>!p.resting&&p.delay<=0).length,
  resting:pieces.filter(p=>p.resting).length,pending:pieces.filter(p=>p.delay>0).length}}
 return {impact,collapse,update,reset,stats,meshes};
}
