import {meteorImpactEnergy,componentImpact} from '../simulation/school-impact-response.js';
// Dragon Defense v5.2: game-optimized Tech Freire factory-school.
// Based on the source FBX's calibrated exterior dimensions. The double-height
// front lobby is a deliberately prominent interpretation of the user's real
// factory interior; classroom partitions beyond it are illustrative, not BIM.
// Pieces share five instanced draw batches and detach into permanent rubble.
export function createDestructibleSchool(THREE,scene,bounds){
 const min=bounds.min,max=bounds.max,centerX=(min.x+max.x)/2;
 const depth=max.z-min.z,height=max.y-min.y,width=max.x-min.x;
 const front=max.z-.12,back=min.z+.25;
 const levels=Array.from({length:6},(_,i)=>min.y+height*i/5);
 const atriumBack=front-Math.min(17,depth*.31);
 const materials=[
  new THREE.MeshStandardMaterial({color:0x8f4b3d,roughness:.94}), // brick
  new THREE.MeshStandardMaterial({color:0xb2afa5,roughness:.88}), // concrete
  new THREE.MeshStandardMaterial({color:0x536b74,roughness:.35,metalness:.12,transparent:true,opacity:.73,depthWrite:false}), // glass
  new THREE.MeshStandardMaterial({color:0x353a3b,roughness:.53,metalness:.38}), // steel
  new THREE.MeshStandardMaterial({color:0xc4a66d,roughness:.72,emissive:0x60411c,emissiveIntensity:.18}), // interior
  new THREE.MeshStandardMaterial({color:0x725c4b,roughness:.95}), // masonry backer
  new THREE.MeshStandardMaterial({color:0x373b3d,roughness:.96}) // industrial dark roof
 ];
 const MAX=1200;
 const unitBox=new THREE.BoxGeometry(1,1,1);
 // A broken pane becomes thin, irregular shards with its own motion.
 const shards=new THREE.BufferGeometry();
 shards.setAttribute('position',new THREE.Float32BufferAttribute([
  -.48,-.36,0, -.12,-.48,0, -.28,.38,0,
  -.06,-.16,.08, .34,-.32,.08, .09,.47,.08,
  .22,.05,-.05, .48,.15,-.05, .35,.39,-.05,
 ],3));
 shards.computeVertexNormals();
 const shardMaterial=materials[2].clone();
 shardMaterial.side=THREE.DoubleSide;
 const shardBatch=materials.push(shardMaterial)-1;
 const batches=materials.map((material,i)=>{
  const mesh=new THREE.InstancedMesh(i===shardBatch?shards:unitBox,material,MAX);
  mesh.name='TECH-FREIRE-REBUILT-'+['BRICK','CONCRETE','GLAZING','STEEL','INTERIOR','BACKER','ROOF','SHARDS'][i];
  mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);return mesh;
 });
 const pieces=[],matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();
 const rotation=new THREE.Euler();
 let collapsing=false,supportClock=0,impactSerial=0;let lastImpact={x:centerX,y:min.y+height*.5,z:front};
 function piece(kind,x,y,z,w,h,d,{zone='structure',strength=1,protectedZone=false}={}){
  // Pieces have a simple physically-inspired falling state, not hidden floors.
  pieces.push({kind,x,y,z,w,h,d,homeX:x,homeY:y,homeZ:z,zone,strength,
   protectedZone,integrity:1,falling:false,resting:false,delay:0,vx:0,vy:0,vz:0,rot:0,vr:0,removed:false});
 }
 const wall=(x,y,z,w,h,d,kind=0,zone='facade',strength=1)=>piece(kind,x,y,z,w,h,d,{zone,strength});
 const slab=(x,y,z,w,d,kind=1)=>piece(kind,x,y,z,w,.23,d,{zone:'floor',strength:1.1});
 const pier=(x,y,z,w,h,d)=>piece(0,x,y,z,w,h,d,{zone:'pier',strength:2.15});
 const beam=(x,y,z,w,h,d)=>piece(3,x,y,z,w,h,d,{zone:'beam',strength:2.3});
 // Full five-story exterior proportions, but NO floor across the front atrium
 // between levels 1 and 2. The tall void is the project's recognition anchor.
 for(let story=0;story<5;story++){
  const base=levels[story],top=levels[story+1],cy=(base+top)/2,sh=top-base;
  // Major vertical brick piers (independently damageable in each story).
  for(let bay=0;bay<=7;bay++){
   const x=min.x+bay*width/7;
   pier(x,cy,front-.14,.44,sh,.75);
   // Rear shell and its smaller clerestory openings.
   pier(x,cy,back+.15,.39,sh,.75);
  }
  for(let bay=0;bay<7;bay++){
   const x=min.x+(bay+.5)*width/7,bayW=width/7-.6;
   const h=sh*.62;
   // Glass arranged as full-height pairs beneath narrow brick spandrels.
   // Low two stories read as broad industrial curtain glazing.
   wall(x,base+sh*.92,front-.12,bayW,sh*.16,.7,0,'spandrel');
   piece(2,x,base+sh*.51,front-.06,bayW,sh*.65,.14,{zone:'glass',strength:.2});
   beam(x,base+sh*.50,front-.015,bayW,.075,.15);
   beam(x,base+sh*.19,front-.015,bayW,.08,.16);
   beam(x,base+sh*.83,front-.015,bayW,.08,.16);
   // Vertical mullions divide each window into two recognizable panes.
   beam(x,base+sh*.52,front+.04,.085,h,.16);
   wall(x,base+sh*.88,back+.14,bayW,sh*.20,.68,0,'rear');
   wall(x,base+sh*.23,back+.15,bayW,sh*.36,.68,0,'rear');
   piece(2,x,base+sh*.56,back+.05,bayW,sh*.32,.14,{zone:'glass',strength:.23});
  }
  // Side masonry is subdivided into separately breakable structural bays,
  // not enormous whole-floor side panels.
  const segments=12,sideStep=(front-back)/segments;
  for(const side of [-1,1])for(let segment=0;segment<segments;segment++){
   const z=front-(segment+.5)*sideStep;
   const wallX=centerX+side*(width/2-.20);
   const opening=(segment%3)!==0;
   if(opening){
    wall(wallX,base+sh*.91,z,.55,sh*.19,sideStep-.09,0,'side-spandrel');
    wall(wallX,base+sh*.20,z,.55,sh*.35,sideStep-.09,0,'side');
    piece(2,wallX+side*.10,base+sh*.58,z,.12,sh*.48,sideStep-.13,{zone:'glass',strength:.25});
   }else wall(wallX,cy,z,.6,sh-.06,sideStep-.08,0,'side');
  }
 }
 // Segmented floor slabs throughout the original factory footprint.
 // The second-story floor is RETAINED behind the front double-height lobby;
 // it does not cross the front atrium, leaving two unobstructed storeys.
 for(let level=0;level<=5;level++){
  const y=levels[level]-(level===0?0:.13);
  const start=level===1?atriumBack:front;
  const sections=9,rows=Math.max(2,Math.ceil((start-back)/6));
  for(let col=0;col<sections;col++)for(let row=0;row<rows;row++){
   const x=min.x+(col+.5)*width/sections;
   const z=back+(row+.5)*(start-back)/rows;
   slab(x,y,z,width/sections-.07,(start-back)/rows-.07,level===5?6:1);
  }
 }
 // High industrial steel columns and deep beams frame the front double-height
 // entry. This steel frame survives initial glazing/masonry damage.
 for(const x of [min.x+2,centerX,min.x+width-2]){
  beam(x,levels[1],(atriumBack+front)/2,.34,.37,front-atriumBack-.6);
  beam(x,levels[1],front-.9,.42,.48,2);
  piece(3,x,(levels[0]+levels[2])/2,atriumBack+.7,.52,levels[2]-levels[0],.5,
    {zone:'atrium-column',strength:5,protectedZone:true});
 }
 for(const z of [atriumBack+.3,front-1]){
  beam(centerX,levels[2]-.22,z,width-1.4,.55,.5);
 }
 // Mezzanine guardrail is behind the atrium void. It displays the two-story
 // relationship even after the facade glazing breaks.
 beam(centerX,levels[1]+.55,atriumBack+.23,width-2,0.13,.12);
 for(let bay=0;bay<14;bay++){
  piece(3,min.x+.9+(bay+.5)*(width-1.8)/14,levels[1]+.31,
   atriumBack+.23,.07,.65,.10,{zone:'atrium-rail',strength:.8});
 }
 // Interpreted factory-style load-bearing grid BEHIND the double-height hall.
 // Individual rear columns support slabs without blocking the recognizable
 // two-storey front void; losing a column can propagate a local slab failure.
 const rearSpans=atriumBack-back;
 const columnRows=[atriumBack-rearSpans*.16,atriumBack-rearSpans*.52,back+rearSpans*.10];
 for(let level=0;level<5;level++){
  const y=(levels[level]+levels[level+1])/2,sh=levels[level+1]-levels[level];
  for(const z of columnRows){
   for(const frac of [.18,.50,.82]){
    const x=min.x+width*frac;
    piece(3,x,y,z,.43,sh,.43,{zone:'column',strength:3.1});
   }
   beam(centerX,levels[level+1]-.23,z,width*.82,.26,.38);
  }
 }
 // Interior construction: shallow back classrooms, corridor walls, floor
 // furniture silhouettes. No invented detailed real-world floor plan.
 for(let level=1;level<5;level++){
  const y0=levels[level],h=levels[level+1]-y0;
  for(const x of [min.x+width*.28,min.x+width*.7]){
   for(let n=0;n<7;n++){
    const z=atriumBack-1-n*((atriumBack-back-2)/7);
    wall(x,y0+h*.48,z,.18,h*.79,(atriumBack-back-2)/7-.12,5,'partition',.65);
   }
  }
  // Repeating corridor soffits and classroom sightlines visible after impact.
  beam(centerX,y0+h*.85,back+depth*.42,width-3,.21,.31);
 }
 // Distinct industrial roof equipment; avoid a flat white slab silhouette.
 // Each vent/housing is independently detachable at high damage.
 for(const x of [min.x+4,centerX,min.x+width-4]){
  for(const z of [front-7,front-21,back+12]){
   piece(3,x,levels[5]+.51,z,1.7,.86,1.8,{zone:'roof-hvac',strength:1.1});
   piece(6,x,levels[5]+1.02,z,1.95,.18,2.1,{zone:'roof-hvac',strength:.7});
  }
 }
 // Double-height front factory hall: tall clerestory window mullions, exposed
 // trusses, hanging lamps and raised door frame, with the void left EMPTY.
 for(const x of [min.x+width*.24,centerX,min.x+width*.76]){
  const lampY=levels[2]-1.8;
  beam(x,(levels[1]+levels[2])/2,front-3,.09,levels[2]-levels[1],.10);
  piece(4,x,lampY,front-3,1.15,.16,1.15,{zone:'atrium-light',strength:.3});
  for(let k=0;k<4;k++){
   const z=atriumBack+1+k*(front-atriumBack-2)/4;
   beam(x,levels[2]-.6,z,.35,.42,.24);
  }
 }
 // Front entrance biased to the left, as established in the architecture review.
 const entranceX=min.x+width*.27;
 for(const offset of [-1.65,1.65])beam(entranceX+offset,levels[0]+2.1,front+.08,.20,4.3,.18);
 beam(entranceX,levels[0]+4.24,front+.08,3.6,.18,.22);
 // Corner brackets and roof profile remain even when the central windows shatter.
 for(let i=0;i<9;i++){
  const x=min.x+(i+.5)*width/9;
  wall(x,levels[5]+.23,front-.25,width/9-.14,.48,.62,1,'parapet',1.4);
 }
 function detach(p,seed=0,delay=0,violent=false){
  if(p.falling||p.resting||p.removed)return false;
  p.falling=true;p.delay=delay;
  const a=Math.sin(seed*11.37+p.x*1.41+p.y*7.3+p.z*.27);
  const b=Math.cos(seed*13.21+p.z*.83-p.x*2.17);
  p.vx=a*(violent?7:3);p.vy=1.3+Math.abs(b)*(violent?7:3.5);
  p.vz=1.5+Math.abs(a)*(violent?5:2.7);
  const glass=p.kind===2,frame=structural.has(p)||p.zone==='floor';
  p.profile=glass?'glass':frame?'structure':'facade';
  const impulse=glass?1.35:frame?.45:1;
  p.vx*=impulse;p.vz*=impulse;
  p.vy*=glass?1.15:frame?.25:.65;
  p.vr=(a+b)*(glass?5:frame?1.3:3);
  return true;
 }
 function impact({x,y,z,radius=3.8,strength=1,type='stone',speed=0}){
  if(collapsing)return 0;
  const rawZ=z,frontHit=rawZ>=front-1.5;
  const strike=meteorImpactEnergy({type,radius,strength,speed});
  // Preserve 3D location, except for an actual strike beyond the front face:
  // game projectile collisions arrive at Broad Street z, so clamp to the facade.
  z=Math.max(back,Math.min(front,rawZ));
  lastImpact={x,y,z};impactSerial++;
  let detached=0;
  for(const p of pieces){
   if(p.falling||p.resting||p.removed)continue;
   const dx=Math.max(0,Math.abs(x-p.x)-p.w*.5);
   const dy=Math.max(0,Math.abs(y-p.y)-p.h*.5);
   const dz=Math.max(0,Math.abs(z-p.z)-p.d*.5);
   const distance=Math.hypot(dx,dy,dz);
   const lateralDistance=Math.hypot(dx,dy);
   const frontDepth=frontHit?Math.max(0,front-p.z-p.d*.5):0;
   // No global floor visibility cutoff. Local energy weakens only parts near
   // the actual impact, with metal piercing farther into internal structure.
   const impulse=componentImpact({distance,radius:strike.radius,energy:strike.energy,
     penetration:strike.penetration,shock:strike.shock,fracture:strike.fracture,
     zone:p.zone,structuralStrength:p.strength,frontDepth,lateralDistance});
   if(impulse<=0)continue;
   const jitter=.88+.24*(.5+.5*Math.sin(p.x*5.37+p.y*3.31+p.z*1.21+impactSerial*13.1));
   p.integrity=Math.max(0,p.integrity-impulse*jitter*.64);
   if(p.integrity<=0){
    const delay=Math.min(.27,.04+distance*.016);
    if(detach(p,x+y+z+impactSerial,delay,strike.energy>1.1))detached++;
   }
  }
  return detached;
 }
 // Support is computed locally from nearby surviving beams and columns. A
 // localized support failure can make an adjacent slab sag/fall, but a single
 // impact cannot delete an arbitrary complete floor.
 const structural=new Set(pieces.filter(p=>['pier','beam','column','atrium-column'].includes(p.zone)));
 // This connectivity is determined by the immutable initial structure, so
 // cache it instead of allocating thousands of arrays every simulation tick.
 const supportLinks=new Map();
 for(const p of pieces){
  if(p.homeY<=min.y+1.05)continue;
  supportLinks.set(p,[...structural].filter(q=>q!==p&&
   Math.abs(q.homeX-p.homeX)<Math.max(2.7,p.w*.55+1.4)&&
   Math.abs(q.homeZ-p.homeZ)<Math.max(3.2,p.d*.55+1.6)&&
   q.homeY<=p.homeY+1&&q.homeY>=p.homeY-height/5-1.7));
 }
 function propagateSupportFailure(dt){
  for(const p of pieces){
   if(p.falling||p.resting||p.removed)continue;
   if(p.homeY<=min.y+1.05)continue; // foundation remains grounded
   if(!['floor','beam','pier','column','atrium-column','partition','spandrel','glass','facade','rear','side','side-spandrel'].includes(p.zone))continue;
   const nearby=supportLinks.get(p)||[];
   if(!nearby.length)continue;
   let healthy=0,failed=0;
   for(const q of nearby){
    if(q.falling||q.resting||q.integrity<.16)failed++;
    else healthy+=q.integrity;
   }
   const fraction=healthy/(healthy+failed+1e-4);
   const vulnerable=p.zone==='floor'?.43:p.zone==='atrium-column'?.18:.31;
   if(fraction>=vulnerable)continue;
   const load=(vulnerable-fraction)/Math.max(.1,vulnerable);
   p.integrity-=dt*(.3+load*1.5)*(p.protectedZone?.25:1);
   if(p.integrity<=0)detach(p,p.x*2.7+p.z+impactSerial,.05+Math.random()*.13,true);
  }
 }
 function collapse(){
  if(collapsing)return;
  collapsing=true;
  // Stagger the loss of all remaining support, including trim and rooftop units.
  for(const p of pieces){
   p.integrity=0;
   const delay=.08+.48*Math.min(1,Math.abs(p.homeX-lastImpact.x)/width)+
    .20*THREE.MathUtils.clamp((p.homeY-min.y)/height,0,1);
   detach(p,p.homeX+p.homeY+impactSerial,delay,false);
  }
  flush();
 }
 function dimensions(p){
  const glass=p.profile==='glass';
  if(glass)scale.set(Math.min(p.w,.48),Math.min(p.h,.38),Math.min(p.d,.30));
  else if(p.resting)scale.set(Math.min(p.w,2.2),Math.min(p.h,.64),Math.min(p.d,2.1));
  else scale.set(p.w,p.h,p.d);
 }
 function update(dt){
  if(dt<=0)return;
  supportClock+=dt;
  if(!collapsing&&supportClock>=.18){propagateSupportFailure(supportClock);supportClock=0;}
  let changed=false;
  for(const p of pieces){
   if(!p.falling||p.resting||p.removed)continue;
   p.delay=Math.max(0,p.delay-dt);
   if(p.delay>0)continue;
   changed=true;
   p.vy-=17*dt;p.vx*=Math.exp(-.6*dt);p.vz*=Math.exp(-.6*dt);
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;
   dimensions(p);
   const floor=min.y+scale.y*.5;
   if(p.y<=floor){
    p.y=floor;p.vy*= -.18;p.vx*=.35;p.vz*=.35;p.vr*=.4;
    if(Math.abs(p.vy)<1.5){
     p.resting=true;
     dimensions(p);
     p.y=min.y+scale.y*.5;
    }
   }
  }
  if(changed)flush();
 }
 let detachedOnly=false;
 function flush(){
  const counts=new Array(materials.length).fill(0);
  for(const p of pieces){
   if(p.removed||(detachedOnly&&!p.falling))continue;
   const kind=p.profile==='glass'?shardBatch:p.kind;
   const index=counts[kind]++;
   if(index>=MAX)throw new Error('School piece batch overflow '+p.kind);
   position.set(p.x,p.y,p.z);
   const tumble=p.resting?0:p.rot;
   rotation.set(tumble,p.rot,tumble*.63);
   quat.setFromEuler(rotation);
   dimensions(p);
   matrix.compose(position,quat,scale);
   batches[kind].setMatrixAt(index,matrix);
  }
  batches.forEach((mesh,i)=>{mesh.count=counts[i];mesh.instanceMatrix.needsUpdate=true;
   // Frustum culling is disabled; recomputing a bounds sphere here is wasteful.
   });
 }
 function reset(){
  collapsing=false;supportClock=0;impactSerial=0;lastImpact={x:centerX,y:min.y+height*.5,z:front};
  for(const p of pieces){
   Object.assign(p,{x:p.homeX,y:p.homeY,z:p.homeZ,
     integrity:1,falling:false,resting:false,delay:0,vx:0,vy:0,vz:0,rot:0,vr:0,removed:false,profile:null});
  }
  flush();
 }
 function stats(){return {parts:pieces.length,drawBatches:materials.length,
   detached:pieces.filter(p=>p.falling).length,falling:pieces.filter(p=>p.falling&&!p.resting).length,
   rubble:pieces.filter(p=>p.resting).length,damaged:pieces.filter(p=>p.integrity<.999).length,
   lastImpact,structuralMembers:structural.size,doubleHeightAtrium:true,
   atriumY:[levels[0],levels[2]],atriumFrontZ:front,atriumBackZ:atriumBack,
   attached:pieces.filter(p=>!p.falling).length,
   byMaterial:Object.fromEntries(['glass','structure','facade'].map(profile=>[profile,pieces.filter(p=>p.profile===profile).length])),
   fullFiveStoryShell:!collapsing,collapsing}}
 reset();
 return {group:batches,impact,collapse,update,reset,stats,
  setDetachedOnly:on=>{if(detachedOnly!==on){detachedOnly=on;flush();}},
  setVisible:(visible)=>batches.forEach(m=>m.visible=visible),
  setNight:(darkness)=>{materials[4].emissiveIntensity=.18+.8*darkness}};
}
