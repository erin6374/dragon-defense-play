import {distanceToBox,supportedFloors,integrateFragment,verticalExtent} from '../simulation/structural-dynamics.js';
// Physical components, not an opaque backing volume. All static and broken pieces
// share instanced draw batches. This is a bounded game simulation, not an engineering solver.
export function createStructuralCity(THREE,scene,bank){
 const groups={front:new THREE.Group(),backNear:new THREE.Group(),backMid:new THREE.Group(),backFar:new THREE.Group(),school:new THREE.Group()};
 for(const [name,g] of Object.entries(groups)){g.name='structural-'+name;scene.add(g)}
 const buildings=[],parts=[],buckets=new Map(),moving=new Set(),dirty=new Set();let finalized=false,time=0,particlesEnabled=true;
 const brokenGeometry=new THREE.BoxGeometry(1,1,1,2,2,2);const bp=brokenGeometry.attributes.position;for(let i=0;i<bp.count;i++){const x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),r=Math.sin(x*71+y*93+z*39)*.045;bp.setXYZ(i,x+r,y+r*.7,z-r*.8)}brokenGeometry.computeVertexNormals();
 const cube=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D(),zero=new THREE.Matrix4().makeScale(0,0,0);
 const materials={
  brick:bank.getBuilding('brick',0x965f4c),brickBrown:bank.getBuilding('brick',0x7a4a3d),brickRed:bank.getBuilding('brick',0x96533f),brickTan:bank.getBuilding('brick',0xa2715c),stone:bank.getBuilding('limestone',0xc9bcaa),stoneGray:bank.getBuilding('limestone',0xb8b2a9),cream:bank.getBuilding('limestone',0xd3c4a8),creamWarm:bank.getBuilding('limestone',0xcbb79b),
  concrete:bank.concrete,roof:bank.roof,frame:bank.blackMetal,
  plaster:new THREE.MeshStandardMaterial({color:0xc2b7a3,roughness:.94}),wood:new THREE.MeshStandardMaterial({color:0x67503e,roughness:.8}),
  furniture:new THREE.MeshStandardMaterial({color:0x53606b,roughness:.62}),
  glass:new THREE.MeshStandardMaterial({color:0x7d9ea9,roughness:.17,metalness:.18,transparent:true,opacity:.37,depthWrite:false,side:THREE.DoubleSide}),
  room:new THREE.MeshStandardMaterial({color:0xe1d3b1,roughness:.88,emissive:0xf3bd77,emissiveIntensity:.05}),
  red:new THREE.MeshStandardMaterial({color:0x874232,roughness:.8})};
 // World-sized texture projection keeps brick courses coherent across many wall pieces.
 for(const key of ['brick','brickBrown','brickRed','brickTan','stone','stoneGray','cream','creamWarm']){
  const material=materials[key];material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 structuralPosition;varying vec3 structuralNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vec4 structuralLocal=vec4(transformed,1.0);vec3 structuralN=objectNormal;
   #ifdef USE_INSTANCING
   structuralLocal=instanceMatrix*structuralLocal;structuralN=mat3(instanceMatrix)*structuralN;
   #endif
   structuralPosition=(modelMatrix*structuralLocal).xyz;structuralNormal=normalize(mat3(modelMatrix)*structuralN);`);
   shader.fragmentShader='varying vec3 structuralPosition;varying vec3 structuralNormal;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   #ifdef USE_MAP
   vec3 n=abs(structuralNormal);vec2 masonryUv=n.x>n.z&&n.x>n.y?structuralPosition.zy:n.y>n.z?structuralPosition.xz:structuralPosition.xy;
   diffuseColor*=texture2D(map,masonryUv*.28);
   #endif`);
  };material.customProgramCacheKey=()=>'structural-world-masonry-v1';
 }
 const densities={column:4,slab:4,roof:3,wall:2,facade:2,window:.18,frame:.4,furniture:.7,stair:1.8,partition:.65,foundation:8};
 function addPart(b,type,mat,x,y,z,w,h,d,floor=0,rotation=0){
  const p={id:parts.length,building:b,type,mat,floor,position:new THREE.Vector3(x,y,z),size:new THREE.Vector3(w,h,d),rotation:new THREE.Euler(0,rotation,0),state:'attached',health:type==='column'?1.65:type==='window'?.18:1,velocity:new THREE.Vector3(),spin:new THREE.Vector3(),age:0};
  p.original={position:p.position.clone(),rotation:p.rotation.clone(),size:p.size.clone()};p.mass=Math.max(.05,w*h*d*(densities[type]||1));
  parts.push(p);b.parts.push(p);return p;
 }
 function addBuilding(o){
  if(finalized)throw Error('Buildings must be registered before finalize');
  const b={...o,damage:0,pressure:0,parts:[],sections:[],windows:[],collapseClock:0,stories:o.stories||3};b.front=o.z+o.d*.5;
  if(o.school)b.layer='school';
  else if(o.background)b.layer=(o.z<-95?'backFar':o.z<-63?'backMid':'backNear');
  else b.layer='front';
  b.floorHeight=b.h/b.stories;b.fallenFloors=new Set();buildings.push(b);
  const bayCount=o.bays||Math.max(2,Math.round(b.w/2.7)),bw=b.w/bayCount,x0=b.x-b.w*.5,z0=b.z-b.d*.5,sh=b.floorHeight;
  const wall=o.kind||'brick';const tileX=Math.ceil(b.w/3),tileZ=Math.ceil(b.d/3.5);
  addPart(b,'foundation','concrete',b.x,.07,b.z,b.w,.14,b.d,0);
  for(let f=0;f<b.stories;f++){
   const base=f*sh;
   // Segmented floor slabs: perforations are actual missing pieces, not a decal.
   for(let ix=0;ix<tileX;ix++)for(let iz=0;iz<tileZ;iz++){if(f>0&&ix===0&&iz<2)continue;addPart(b,'slab',f===0?'concrete':'wood',x0+(ix+.5)*b.w/tileX,base+.15,z0+(iz+.5)*b.d/tileZ,b.w/tileX-.025,.25,b.d/tileZ-.025,f);}
   // Structural columns on front, middle and rear bearing lines.
   for(let ix=0;ix<=bayCount;ix++)for(const z of [b.front-.25,b.z,z0+.25])addPart(b,'column','concrete',x0+ix*bw,base+sh*.5,z,.24,sh,.27,f);
   // Front elevation assembled around separate window openings.
   for(let ix=0;ix<bayCount;ix++){
    // Historic projecting bays and the campus's low strip glazing are part of
    // the damageable shell, so trim cannot survive as a floating overlay.
    const bayProjection=o.projectingBays&&ix!==1?.48:0,front=b.front+bayProjection;
    const historicSash=o.historicSash&&f>0,glazingDepth=historicSash?-.12:.04;
    const entry=f===0&&ix===Math.floor(bayCount/2),x=x0+(ix+.5)*bw,glassW=historicSash?Math.min(1.45,bw*.48):bw-(o.school?.38:.68),glassH=o.institutional?(entry?3.1:1.65):sh-(entry?.62:o.school?1.05:1.6),wy=base+(o.institutional?(entry?.12:1.35):(entry?.12:o.school?.62:.95))+glassH*.5;
    // Historic windows are openings in a continuous masonry elevation. Resize
    // the existing four wall pieces rather than covering broad glass with trim.
    const bottom=wy-glassH*.5-base,top=base+sh-wy-glassH*.5;
    if(!entry)b.sections.push(addPart(b,'facade',wall,x,base+(historicSash?bottom*.5:.48),front,bw,historicSash?bottom:.90,.28,f));
    b.sections.push(addPart(b,'facade',wall,x,historicSash?base+sh-top*.5:base+sh-.27,front,bw,historicSash?top:.52,.32,f));
    const pier=historicSash?(bw-glassW)*.5:.2;
    for(const edge of [-1,1])b.sections.push(addPart(b,'facade',wall,x+edge*(bw*.5-pier*.5),historicSash?wy:base+sh*.5,front,pier,historicSash?glassH:sh-.6,.32,f));
    const pane=addPart(b,'window','glass',x,wy,front+glazingDepth,glassW,glassH,.035,f);b.windows.push(pane);
    for(const side of [-1,1])addPart(b,'frame','frame',x+side*glassW*.5,wy,front+glazingDepth+.04,.065,glassH+.10,.10,f);
    for(const yy of [wy-glassH*.5,wy,wy+glassH*.5])addPart(b,'frame','frame',x,yy,front+glazingDepth+.04,glassW,.065,.11,f);
    addPart(b,'frame',o.school?'concrete':'stone',x,wy-glassH*.5-.07,front+.12,glassW+.22,.13,.33,f);
    // Broad Street masonry relief uses the same breakable material batches.
    // Lintels shade recessed glazing; a stepped cornice reads at game distance.
    if(!o.school&&!o.background&&!o.institutional){
     addPart(b,'facade','stone',x,wy+glassH*.5+.10,front+.13,glassW+.32,.20,.38,f);
     if(f===b.stories-1){
      addPart(b,'facade',wall,x,b.h+.24,front+.16,bw-.025,.20,.48,f);
      addPart(b,'facade','stone',x,b.h+.49,front+.23,bw-.025,.12,.62,f);
     }
    }
    if(bayProjection){for(const side of [-1,1])addPart(b,'facade',wall,x+side*(bw*.5-.10),base+sh*.5,b.front+bayProjection*.5,.20,sh-.6,bayProjection,f);}
    if(o.institutional){
     // Broad pale fascia and mullioned horizontal windows visible in Street View.
     addPart(b,'facade','stoneGray',x,base+sh-.9,front,bw,1.25,.34,f);
     if(!entry)addPart(b,'facade','stoneGray',x,base+.66,front,bw,1.25,.28,f);
     addPart(b,'frame','frame',x,wy,front+glazingDepth+.04,.065,glassH,.10,f);
    }
    // Rear walls are segmented too; there is no full-height solid shell.
    addPart(b,'wall',wall,x,base+sh*.5,z0,bw-.03,sh-.16,.22,f);
   }
   for(const x of [x0,x0+b.w])for(let iz=0;iz<tileZ;iz++)addPart(b,'wall',wall,x,base+sh*.5,z0+(iz+.5)*b.d/tileZ,.25,sh-.15,b.d/tileZ-.03,f);
   // Rooms, corridor openings and stairs on every floor, including rear buildings.
   const rooms=o.exteriorOnly?0:b.background?2:Math.max(2,Math.floor(b.w/4));
   for(let room=0;room<rooms;room++){
    const cx=x0+(room+.5)*b.w/rooms;
    if(room<rooms-1){const px=x0+(room+1)*b.w/rooms;addPart(b,'partition','plaster',px,base+sh*.48,b.z+2,.10,sh-.35,b.d*.42,f);addPart(b,'partition','plaster',px,base+sh*.82,b.z-1,.10,sh*.25,2,f)}
    const roomWidth=b.w/rooms-.12,doorWidth=Math.min(.95,roomWidth*.35),jamb=(roomWidth-doorWidth)/2;
    for(const side of [-1,1])addPart(b,'partition','room',cx+side*(doorWidth+jamb)/2,base+sh*.5,b.z-2,jamb,sh-.32,.10,f);
    addPart(b,'partition','room',cx,base+sh-.45,b.z-2,doorWidth,.6,.10,f);
    // Table/desk, legs, cabinet and upholstered chair/sofa. Shared instances.
    const tx=cx+(room%2?-.35:.35),tz=b.front-2.1;
    addPart(b,'furniture','wood',tx,base+.92,tz,Math.min(1.5,b.w/rooms*.60),.12,.8,f);
    for(const dx of [-.48,.48])addPart(b,'furniture','frame',tx+dx,base+.52,tz,.07,.75,.55,f);
    addPart(b,'furniture','furniture',tx,base+.55,tz-.7,.60,.12,.55,f);addPart(b,'furniture','furniture',tx,base+.9,tz-.95,.6,.68,.10,f);
    addPart(b,'furniture','wood',cx,base+.65,b.z-1.6,.8,1.15,.45,f);
   }
   const stairX=x0+Math.min(1.5,b.w*.18),stairZ=z0+1.0;
   if(!o.exteriorOnly&&f<b.stories-1){for(let step=0;step<12;step++)addPart(b,'stair','concrete',stairX,base+.22+step*sh/12,stairZ+step*.24,1.0,.14,.27,f);
   for(const side of [-1,1]){for(const step of [0,4,8,11])addPart(b,'frame','frame',stairX+side*.56,base+.70+step*sh/12,stairZ+step*.24,.045,1,.045,f);
    const rail=addPart(b,'frame','frame',stairX+side*.56,base+sh*11/24+1,stairZ+1.32,.055,.055,Math.hypot(sh,2.88),f);rail.rotation.x=-Math.atan2(sh*11/12,2.64);rail.original.rotation.copy(rail.rotation)}
   }
   // Roof is fractured into slabs, with a parapet fixed to each surviving bay.
   if(f===b.stories-1){for(let ix=0;ix<tileX;ix++)for(let iz=0;iz<tileZ;iz++)addPart(b,'roof','roof',x0+(ix+.5)*b.w/tileX,b.h+.1,z0+(iz+.5)*b.d/tileZ,b.w/tileX-.025,.24,b.d/tileZ-.025,f);
    for(let ix=0;ix<bayCount;ix++)addPart(b,'facade',wall,x0+(ix+.5)*bw,b.h+.38,b.front,bw-.02,.48,.29,f);
    addPart(b,'furniture','frame',b.x,b.h+.6,b.z,1.8,.75,1.1,f);
   }
  }
  if(o.canopy){for(const x of [-75.5,-64.5])for(const z of [-8.2,-3.2])addPart(b,'column','frame',x,2.1,z,.23,4.1,.23,0);
   for(let ix=0;ix<5;ix++)for(let iz=0;iz<3;iz++)addPart(b,'roof','cream',-76.75+(ix+.5)*2.78,4.55,-10+(iz+.5)*2.83,2.75,.4,2.8,0);}
  b.slabs=b.parts.filter(p=>p.type==='slab');b.structuralParts=b.parts.filter(p=>['column','slab','wall','facade','roof'].includes(p.type));return b;
 }
 // Thousands of small fragments share three draws and stay as bounded rubble.
 const chipMaterials=[materials.brick,materials.concrete,materials.glass],chips=[];let chipCursor=0;
 const chipMeshes=chipMaterials.map((m,i)=>{const shard=new THREE.BufferGeometry();shard.setAttribute('position',new THREE.Float32BufferAttribute([-.9,-.4,0,.8,-.25,0,-.25,1,0],3));shard.computeVertexNormals();const geo=i===2?shard:new THREE.IcosahedronGeometry(1,0);const mesh=new THREE.InstancedMesh(geo,m,1600);mesh.count=1600;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);for(let n=0;n<1600;n++)mesh.setMatrixAt(n,zero);scene.add(mesh);return mesh});
 function fragmentBurst(pos,count=50,glass=false,power=1,chunkScale=1){if(!particlesEnabled)return;for(let i=0;i<count;i++){
  const kind=glass?2:i%2,slot=chipCursor++%1600,key=kind*1600+slot;
  const size=(glass?.05+Math.random()*.16:.06+Math.random()*.19)*chunkScale;
  const p={position:pos.clone(),size:new THREE.Vector3(size*(glass?2:1.3),glass?size*1.5:size,glass?.008:size),rotation:new THREE.Euler(Math.random()*3,Math.random()*3,0),velocity:new THREE.Vector3((Math.random()-.5)*12*power,(2+Math.random()*7)*power,(Math.random()-.15)*9*power),spin:new THREE.Vector3(Math.random()*7,Math.random()*8,Math.random()*6),age:0,kind,slot,sleep:false};chips[key]=p;
 }}
 // Bounded dust pool: one draw, shared texture, no per-impact lights.
 const dustMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:bank.images?.dust||null,color:0x8b8174,transparent:true,opacity:.20,depthWrite:false}),96);dustMesh.count=96;dustMesh.frustumCulled=false;scene.add(dustMesh);const dustAlpha=new THREE.InstancedBufferAttribute(new Float32Array(96),1);dustMesh.geometry.setAttribute('dustAlpha',dustAlpha);dustMesh.material.onBeforeCompile=shader=>{shader.vertexShader='attribute float dustAlpha;varying float vDustAlpha;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDustAlpha=dustAlpha;');shader.fragmentShader='varying float vDustAlpha;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vDustAlpha;')};const dust=[];let dustCursor=0;const pile=new Map();
 for(let i=0;i<96;i++)dustMesh.setMatrixAt(i,zero);
 function dustBurst(pos,power=1){if(!particlesEnabled)return;for(let i=0;i<8;i++){const slot=dustCursor++%96;dust[slot]={position:pos.clone(),age:0,life:3+Math.random()*3,size:(.8+Math.random())*power,v:new THREE.Vector3((Math.random()-.5)*power*3,.3+Math.random(),(Math.random()-.5)*power)};}}
 const contact=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:bank.images?.dust||null,color:0x17130f,transparent:true,opacity:.26,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),512);contact.count=512;contact.frustumCulled=false;scene.add(contact);for(let i=0;i<512;i++)contact.setMatrixAt(i,zero);let contactCursor=0;
 const pileKey=p=>Math.floor(p.x/1.5)+':'+Math.floor(p.z/1.5);
 function settle(p){dummy.position.set(p.position.x,.17,p.position.z);dummy.rotation.set(-Math.PI/2,0,p.rotation.y);dummy.scale.set(Math.max(.5,p.size.x)*1.3,Math.max(.5,p.size.z,p.size.y)*1.2,1);dummy.updateMatrix();contact.setMatrixAt(contactCursor++%512,dummy.matrix);contact.instanceMatrix.needsUpdate=true;p.state='settled';moving.delete(p);const key=pileKey(p.position);pile.set(key,Math.min(1.8,(pile.get(key)||0)+Math.min(.12,p.size.x*p.size.y*p.size.z*.025)));}
 function finalize(){
  for(const p of parts){const key=p.building.layer+':'+p.mat;if(!buckets.has(key))buckets.set(key,{parts:[],material:materials[p.mat],group:groups[p.building.layer]});const bucket=buckets.get(key);p.bucket=bucket;p.index=bucket.parts.length;bucket.parts.push(p)}
  for(const bucket of buckets.values()){const mesh=new THREE.InstancedMesh(cube,bucket.material,bucket.parts.length);mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.name='physical-components';bucket.mesh=mesh;const bm=bucket.material.clone();bm.color?.multiplyScalar(.75);if(bm.emissive)bm.emissiveIntensity=0;const broken=new THREE.InstancedMesh(brokenGeometry,bm,bucket.parts.length);broken.frustumCulled=false;broken.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bucket.broken=broken;broken.visible=false;bucket.group.add(mesh,broken);for(let i=0;i<bucket.parts.length;i++){broken.setMatrixAt(i,zero);broken.setColorAt(i,new THREE.Color(0xffffff))}for(const p of bucket.parts){mesh.setColorAt(p.index,new THREE.Color(0xffffff));write(p)}mesh.instanceColor.needsUpdate=true;mesh.instanceMatrix.needsUpdate=true}
  for(const b of buildings){b.columns=b.parts.filter(p=>p.type==='column');for(const p of b.parts)p.supports=b.columns.filter(c=>c.floor===(p.type==='column'&&p.floor>0?p.floor-1:p.floor)).sort((a,b)=>a.position.distanceToSquared(p.position)-b.position.distanceToSquared(p.position)).slice(0,2);}
  finalized=true;
 }
 function write(p){
  if(!p.bucket?.mesh)return;
  dummy.position.copy(p.position);dummy.rotation.copy(p.rotation);dummy.scale.copy(p.size);dummy.updateMatrix();
  const {mesh,broken}=p.bucket;
  mesh.setMatrixAt(p.index,p.state==='attached'&&!p.building.hideIntactGeometry?dummy.matrix:zero);
  const detached=p.state==='falling'||p.state==='settled';
  if(detached||broken.visible){
   broken.setMatrixAt(p.index,detached?dummy.matrix:zero);
   broken.instanceMatrix.needsUpdate=true;
  }
  if(detached)broken.visible=true;
  dirty.add(p.bucket);
 }
 function detach(p,origin,power=1,blast=false){
  if(p.state!=='attached'||p.type==='foundation')return 0;
  if(p.type==='window'){p.state='removed';write(p);fragmentBurst(p.position,14,true,power);return 1}
  p.state='falling';p.age=0;const dx=p.position.x-origin.x,dz=p.position.z-origin.z;
  const weight=Math.sqrt(Math.max(1,p.mass));
  p.velocity.set(blast?dx*.9*power/weight:(Math.random()-.5)*.25,blast?Math.min(.7,2*power/weight):-.25,blast?(dz*.6+2)*power/weight:(Math.random()-.5)*.25);
  const turn=blast?.65:.18;p.spin.set((Math.random()-.5)*turn,(Math.random()-.5)*turn,(Math.random()-.5)*turn);
  if(p.size.y>p.size.z*2)p.spin.x=(Math.random()<.5?-1:1)*.28;
  moving.add(p);
  if(['wall','facade','column'].includes(p.type))fragmentBurst(p.position,5,false,power);return 1;
 }
 function impact(b,point,radius=5,strength=1){
  if(!b||b.damage>=1)return 0;let removed=0;
  const resistance=b.school?1.7:1;
  for(const p of b.parts){if(p.state!=='attached'||p.type==='foundation')continue;const distance=distanceToBox(point,p);if(distance>radius)continue;p.bucket.mesh.setColorAt(p.index,new THREE.Color().setScalar(.38+.38*Math.min(1,distance/radius)));p.bucket.mesh.instanceColor.needsUpdate=true;
   p.health-=strength*(1-distance/(radius*1.2))*2.2/resistance;
   if(p.health<=0||p.type==='window')removed+=detach(p,point,strength,true);
  }
  b.pressure=Math.min(1,b.pressure+strength*(b.school?.10:.38));b.damage=Math.max(b.damage,b.structuralParts.filter(p=>p.state!=='attached').length/b.structuralParts.length);b.collapseClock=0;
  dustBurst(point,Math.min(3,radius*.3));
  fragmentBurst(point,Math.min(120,Math.round(35+radius*9)),false,strength);return removed;
 }
 function forceDamage(b,value){
  const target=Math.max(0,Math.min(1,value));b.pressure=Math.max(b.pressure,target);b.damage=Math.max(b.damage,target);
  const count=Math.floor(b.structuralParts.length*target);const ordered=[...b.structuralParts].sort((a,b)=>b.original.position.y-a.original.position.y);for(let i=0;i<count;i++)detach(ordered[i],ordered[i].position,.5);
  if(target>=1)for(const p of b.parts)detach(p,p.position,.6);
 }
 function update(dt){time+=dt;
  for(const b of buildings){if(b.pressure===0&&b.damage===0)continue;b.collapseClock-=dt;if(b.collapseClock>0)continue;b.collapseClock=.16;
   const support=supportedFloors(b.parts,b.stories);
   const catastrophic=b.pressure>=1&&b.structuralParts.filter(p=>p.state!=='attached').length/b.structuralParts.length>.78;
   let shed=0;
   for(const p of b.parts){if(p.state!=='attached'||p.type==='foundation')continue;
    if(catastrophic||!support[p.floor]||p.supports?.length&&p.supports.every(c=>c.state!=='attached')){p.failureAt??=time+.12+p.floor*.10+Math.random()*.15;if(time>=p.failureAt){detach(p,p.position,.65);if(++shed>65)break}}
    else if(p.type==='frame'&&p.original.position.z>b.front-.1){const attached=b.sections.some(w=>w.state==='attached'&&w.floor===p.floor&&Math.abs(w.position.x-p.position.x)<b.w/(b.bays||2));if(!attached)detach(p,p.position,.5)}
    else if(p.type==='furniture'||p.type==='partition'||p.type==='stair'){
     // Interior contents lose their floor when the local floor tile is removed.
     const floor=b.slabs.some(s=>s.floor===p.floor&&s.state==='attached'&&Math.abs(s.position.x-p.position.x)<s.size.x*.6&&Math.abs(s.position.z-p.position.z)<s.size.z*.6);
     if(!floor)detach(p,p.position,.5);
    }
   }
   const lost=b.structuralParts.filter(p=>p.state!=='attached').length/b.structuralParts.length;
   b.damage=Math.max(b.damage,lost);if(lost>.97)b.damage=1;
  }
  for(const p of moving){p.age+=dt;const oldBottom=p.position.y-p.size.y*.5;const ground=.08+(pile.get(pileKey(p.position))||0),incoming=-p.velocity.y;const asleep=integrateFragment(p,dt,ground);if(incoming>4&&p.position.y-verticalExtent(p)<ground+.03){dustBurst(p.position,Math.min(2,p.mass*.1));if(!p.fractured&&(p.mass>2.5||p.type==='partition')){p.fractured=true;fragmentBurst(p.position,18,false,.4,2.8);p.size.multiplyScalar(p.type==='partition'?.45:.65);p.position.y=ground+verticalExtent(p);p.bucket.mesh.setColorAt(p.index,new THREE.Color(0x807367));p.bucket.mesh.instanceColor.needsUpdate=true;}}
   // Floor collisions: falling heavy slabs break supports below them; furniture lands.
   if(p.velocity.y<0&&p.age>.15){const b=p.building;for(let f=b.stories-1;f>=0;f--){const y=f*b.floorHeight+.28;if(oldBottom>=y&&p.position.y-p.size.y*.5<y){const slab=b.slabs.find(s=>s.floor===f&&s.state==='attached'&&Math.abs(s.position.x-p.position.x)<s.size.x*.5&&Math.abs(s.position.z-p.position.z)<s.size.z*.5);if(slab){if(p.mass>2.5&&Math.abs(p.velocity.y)>3){detach(slab,p.position,.8);fragmentBurst(p.position,8)}else{p.position.y=y+p.size.y*.5;p.velocity.y*=-.12;p.velocity.x*=.5;p.velocity.z*=.5;if(Math.abs(p.velocity.y)<.3){p.state='settled';moving.delete(p)}}break}}}}
   if(asleep)settle(p);write(p);
  }
  for(const p of chips){if(!p||p.sleep)continue;p.age+=dt;p.sleep=integrateFragment(p,dt)||p.age>6;dummy.position.copy(p.position);dummy.rotation.copy(p.rotation);dummy.scale.copy(p.size);dummy.updateMatrix();chipMeshes[p.kind].setMatrixAt(p.slot,dummy.matrix);chipMeshes[p.kind].instanceMatrix.needsUpdate=true}
  for(let i=0;i<dust.length;i++){const d=dust[i];if(!d)continue;d.age+=dt;if(d.age>=d.life){dustMesh.setMatrixAt(i,zero);dust[i]=null;continue}d.position.addScaledVector(d.v,dt);d.v.multiplyScalar(Math.max(0,1-dt*.25));dummy.position.copy(d.position);dummy.rotation.set(-.15,.26,0);dummy.scale.setScalar(d.size*(1+d.age*.6));dummy.updateMatrix();dustMesh.setMatrixAt(i,dummy.matrix);dustAlpha.setX(i,Math.min(1,d.age*8)*(1-d.age/d.life))}dustAlpha.needsUpdate=true;dustMesh.instanceMatrix.needsUpdate=true;
  for(const bucket of dirty)bucket.mesh.instanceMatrix.needsUpdate=true;dirty.clear();
 }
 function restore(){moving.clear();pile.clear();for(let i=0;i<512;i++)contact.setMatrixAt(i,zero);contact.instanceMatrix.needsUpdate=true;contactCursor=0;dust.length=0;for(let i=0;i<96;i++)dustMesh.setMatrixAt(i,zero);dustMesh.instanceMatrix.needsUpdate=true;for(const b of buildings){b.damage=0;b.pressure=0;b.collapseClock=0}for(const p of parts){p.failureAt=undefined;p.fractured=false;p.size.copy(p.original.size);p.bucket.mesh.setColorAt(p.index,new THREE.Color(0xffffff));p.bucket.mesh.instanceColor.needsUpdate=true;p.state='attached';p.health=p.type==='column'?1.65:p.type==='window'?.18:1;p.position.copy(p.original.position);p.rotation.copy(p.original.rotation);p.velocity.set(0,0,0);write(p)}for(const bucket of buckets.values())bucket.broken.visible=false;chips.length=0;chipCursor=0;for(const m of chipMeshes){for(let i=0;i<1600;i++)m.setMatrixAt(i,zero);m.instanceMatrix.needsUpdate=true}for(const b of dirty)b.mesh.instanceMatrix.needsUpdate=true;dirty.clear()}
 function fireAnchorHeight(point){const b=buildings.find(b=>Math.abs(point.x-b.x)<b.w*.5&&Math.abs(point.z-b.z)<b.d*.5+1);if(!b)return point.y;let y=.35;for(const p of b.slabs)if(p.state==='attached'&&p.position.y<point.y+.3&&Math.abs(p.position.x-point.x)<p.size.x*.6&&Math.abs(p.position.z-point.z)<p.size.z*.6+1)y=Math.max(y,p.position.y+.4);return Math.min(point.y,y);}
 function setIntactBuildingVisible(buildingName,visible){
  const b=buildings.find(x=>x.name===buildingName);if(!b)return false;
  b.hideIntactGeometry=!visible;for(const p of b.parts)write(p);
  for(const bucket of dirty){bucket.mesh.instanceMatrix.needsUpdate=true;}dirty.clear();return true;
 }
 return {fireAnchorHeight,buildings,groups,addBuilding,finalize,impact,forceDamage,update,restore,fragmentBurst,setIntactBuildingVisible,
  setAtmosphere(darkness){materials.room.emissiveIntensity=.05+darkness*.55;materials.glass.color.setHex(0x7d9ea9).lerp(new THREE.Color(0xd4b184),darkness*.35)},
  setParticlesEnabled(on){particlesEnabled=!!on;dustMesh.visible=!!on},
  setRubbleVisible(on){contact.visible=on;for(const m of chipMeshes)m.visible=on},
  stats:()=>({buildings:buildings.length,components:parts.length,drawBatches:buckets.size*2+5,activeFragments:moving.size,smallDebris:chips.filter(Boolean).length,collapsed:buildings.filter(b=>b.damage>=.97).length,attached:parts.filter(p=>p.state==='attached').length,types:Object.fromEntries(['slab','partition','stair','furniture','window'].map(t=>[t,parts.filter(p=>p.type===t).length]))})};
}
