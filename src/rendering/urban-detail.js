// v4.3: real, attached 3D depth for playable street facades.
// Every trim/window mesh is parented to a destructible facade panel; no orphan windows.
// v4.5 — architectural trim GPU instancing.
// Details are drawn in shared batches yet remain bound to the survival state of
// their actual facade section, so destroyed windows cannot float in the air.
export function enhanceStreetArchitecture(THREE,buildings,root){
 const mats={
  glass:new THREE.MeshStandardMaterial({color:0x436c82,metalness:.12,roughness:.17,transparent:true,opacity:.84,depthWrite:false,side:THREE.DoubleSide}),
  lit:new THREE.MeshStandardMaterial({color:0xb1a080,emissive:0x4e3320,emissiveIntensity:.50,roughness:.64}),
  frame:new THREE.MeshStandardMaterial({color:0x333c43,metalness:.48,roughness:.39}),
  stone:new THREE.MeshStandardMaterial({color:0xb7a99b,roughness:.85}),
  dark:new THREE.MeshStandardMaterial({color:0x232a31,roughness:.92})
 };
 const box=new THREE.BoxGeometry(1,1,1),batches=Object.fromEntries(Object.keys(mats).map(k=>[k,[]]));
 let assemblies=0;
 const add=(panel,x,y,z,w,h,d,kind)=>batches[kind].push({panel,x,y,z,w,h,d,visible:true});
 for(const building of buildings){
  if(building.background)continue;
  const {x,w,h,front,sections}=building;
  const modern=building.name.includes('modern');
  const stories=Math.max(2,Math.round(building.stories|| (modern?4:3)));
  const bays=Math.max(2,Math.round(building.bays|| (modern?4:2)));
  const rows=stories*2,cols=9;
  const sectionAt=(wx,wy)=>{
   const col=Math.max(0,Math.min(cols-1,Math.floor((wx-(x-w/2))/w*cols)));
   const row=Math.max(0,Math.min(rows-1,Math.floor(wy/h*rows)));
   return sections.find(s=>s.row===row&&s.col===col);
  };
  for(let floor=0;floor<stories;floor++)for(let bay=0;bay<bays;bay++){
   const colW=w/bays,windowW=colW*(modern?.76:.54);
   const floorH=h/stories,windowH=floorH*(modern?.60:.48);
   const wx=x-w/2+(bay+.5)*colW;
   const wy=h-(floor+.28)*floorH-windowH*.5;
   const panel=sectionAt(wx,wy);if(!panel)continue;
   const z=front+.14;
   add(panel,wx,wy,z,windowW*.98,windowH*.98,.10,'dark');
   add(panel,wx,wy,z+.10,windowW*.91,windowH*.88,.035,'glass');
   add(panel,wx,wy,z+.15,windowW*.045,windowH,.095,'frame');
   add(panel,wx,wy,z+.155,windowW,windowH*.050,.09,'frame');
   for(const side of [-1,1]){
    add(panel,wx+side*windowW*.49,wy,z+.13,windowW*.058,windowH+.07,.15,modern?'frame':'stone');
    add(panel,wx,wy+side*windowH*.5,z+.13,windowW+windowW*.09,windowH*.061,.15,modern?'frame':'stone');
   }
   add(panel,wx,wy-windowH*.56,z+.24,windowW*1.19,.075,.29,modern?'frame':'stone');
   if((bay+floor)%4===0)add(panel,wx-windowW*.28,wy-.13,z+.185,windowW*.14,windowH*.25,.025,'lit');
   assemblies++;
  }
  // Cornices and roof copings belong to whole building, not loose window parts.
  const cornice=new THREE.Mesh(box,modern?mats.frame:mats.stone);
  cornice.position.set(x,h-.055,front+.21);cornice.scale.set(w+.18,.16,.38);building.group.add(cornice);
  const coping=new THREE.Mesh(box,new THREE.MeshStandardMaterial({color:0x615749,metalness:.53,roughness:.5}));
  coping.position.set(x,h+.22,front-.07);coping.scale.set(w+.10,.09,.44);building.group.add(coping);
 }
 const host=new THREE.Group();host.name='GPU-batched-facade-details';root.add(host);
 const positioner=new THREE.Object3D();const hidden=new THREE.Matrix4().makeScale(0,0,0);
 const uploads=[];
 for(const [kind,items] of Object.entries(batches)){
  if(items.length===0)continue;
  const mesh=new THREE.InstancedMesh(box,mats[kind],items.length);mesh.name='facade-details-'+kind;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;host.add(mesh);
  for(let i=0;i<items.length;i++){
   const v=items[i];positioner.position.set(v.x,v.y,v.z);positioner.scale.set(v.w,v.h,v.d);
   positioner.rotation.set(0,0,0);positioner.updateMatrix();mesh.setMatrixAt(i,positioner.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;uploads.push({mesh,items});
 }
 function sync(){
  for(const {mesh,items} of uploads){let changed=false;
   for(let i=0;i<items.length;i++){
    const item=items[i],newVisibility=item.panel.alive&&item.panel.mesh.visible&&item.panel.mesh.parent?.visible;
    if(item.visible===newVisibility)continue;
    item.visible=newVisibility;
    if(newVisibility){positioner.position.set(item.x,item.y,item.z);positioner.scale.set(item.w,item.h,item.d);positioner.rotation.set(0,0,0);positioner.updateMatrix();mesh.setMatrixAt(i,positioner.matrix);}
    else mesh.setMatrixAt(i,hidden);
    changed=true;
   }
   if(changed)mesh.instanceMatrix.needsUpdate=true;
  }
 }
 return {assemblies,detailMeshes:Object.values(batches).reduce((n,x)=>n+x.length,0),batchDraws:uploads.length,sync};
}

export function addStreetSetDressing(THREE,root){
 const box=new THREE.BoxGeometry(1,1,1);
 const rubber=new THREE.MeshStandardMaterial({color:0x24282b,roughness:.96});
 const steel=new THREE.MeshStandardMaterial({color:0x55616a,roughness:.62,metalness:.58});
 const orange=new THREE.MeshStandardMaterial({color:0xb25d3c,roughness:.8});
 const accent=new THREE.MeshStandardMaterial({color:0xa8a79c,roughness:.88});
 const set=new THREE.Group();set.name='urban-set-dressing';root.add(set);
 const add=(x,y,z,w,h,d,mat)=>{const m=new THREE.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);set.add(m);return m;};
 for(let i=0;i<18;i++){
  const x=-84+i*10.1;
  if(Math.abs(x)<15)continue;
  const z=9.7+(i%3)*.24;
  // Trash bins, bollards and weathered planter boxes.
  add(x,.42,z,.56,.82,.49,i%3===0?steel:rubber);
  add(x,.87,z,.62,.08,.55,steel);
  add(x+1.5,.46,z,.18,.86,.18,steel);
  if(i%3===1){add(x-1.4,.24,z,.78,.44,.62,orange);add(x-1.4,.51,z,.86,.10,.70,accent);}
 }
 // Two crosswalk approaches: broad, restrained pavement markings.
 const paint=new THREE.MeshBasicMaterial({color:0xd5d3c8,transparent:true,opacity:.82,depthWrite:false});
 for(const cx of [-53,53])for(let i=0;i<8;i++)add(cx+(i-3.5)*1.42,-.237,12.1,1.02,.012,3.6,paint);
 return set;
}

// Low planting at the camera-side edge. Keep it subordinate to the street,
// not a band of oversized near-black silhouettes across the screen.
// The cinematic upgrade installs an olive cutout-leaf material here, so the
// existing instance colors should be pale tints, not second darkening coats.
export function addForegroundPlanting(THREE,root){
 const geometry=new THREE.IcosahedronGeometry(1,1);
 const material=new THREE.MeshLambertMaterial({color:0xffffff});
 const bed=new THREE.InstancedMesh(geometry,material,108);
 bed.name='West sidewalk foreground planting';
 const leaf=new THREE.Object3D();
 const colors=[0xa4b5a3,0xb6bfaa,0xc5cdb7,0xadb9a3];
 for(let i=0;i<bed.count;i++){
  const x=-122+i*2.3;
  // Keep both crosswalk approaches open.
  if(Math.abs(Math.abs(x)-53)<9){
   leaf.scale.setScalar(0);
  }else{
   const spread=(i*7%11)/11;
   // Lower, narrower clumps sit rooted just behind the West sidewalk curb.
   // Preserve gaps at both intersections and the single instanced draw batch.
   leaf.position.set(x,-.16+spread*.05,47.1+(i*17%9)*.18);
   leaf.scale.set(.98+spread*.43,.23+spread*.12,.42+spread*.15);
   leaf.rotation.set(spread*.14,i*1.22,spread*.08);
  }
  leaf.updateMatrix();
  bed.setMatrixAt(i,leaf.matrix);
  bed.setColorAt(i,new THREE.Color(colors[i%colors.length]));
 }
 root.add(bed);
 return bed;
}
