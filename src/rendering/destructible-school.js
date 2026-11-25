import {meteorImpactEnergy,componentImpact} from '../simulation/school-impact-response.js';
// Dragon Defense v5.2: game-optimized Tech Freire factory-school.
// Based on the source FBX's calibrated exterior dimensions. The double-height
// front lobby is a deliberately prominent interpretation of the user's real
// factory interior; classroom partitions beyond it are illustrative, not BIM.
// Pieces share instanced draw batches and detach into permanent rubble.
export function createDestructibleSchool(THREE,scene,bounds){
 const min=bounds.min,max=bounds.max,centerX=(min.x+max.x)/2;
 const depth=max.z-min.z,height=max.y-min.y,width=max.x-min.x;
 const front=max.z-.12,back=min.z+.25;
 const levels=Array.from({length:6},(_,i)=>min.y+height*i/5);
 const atriumBack=front-Math.min(17,depth*.31);
 const materials=[
  new THREE.MeshStandardMaterial({color:0x8f4b3d,roughness:.95,metalness:0,envMapIntensity:0.02}), // brick
  new THREE.MeshStandardMaterial({color:0xb2afa5,roughness:.95,metalness:0,envMapIntensity:0.02}), // concrete
  new THREE.MeshPhysicalMaterial({color:0x3e5b68,roughness:.08,metalness:.32,clearcoat:1.0,clearcoatRoughness:.06,envMapIntensity:2.4,transparent:true,opacity:.82,depthWrite:false}), // glass
  new THREE.MeshStandardMaterial({color:0x353a3b,roughness:.53,metalness:.38}), // steel
  new THREE.MeshStandardMaterial({color:0xebd5a8,roughness:.72,metalness:0,emissive:0xd4a055,emissiveIntensity:.65}), // interior
  new THREE.MeshStandardMaterial({color:0x725c4b,roughness:.95,metalness:0,envMapIntensity:0.02}), // masonry backer
  new THREE.MeshStandardMaterial({color:0x373b3d,roughness:.96,metalness:0,envMapIntensity:0}) // industrial dark roof
 ];
 const MAX=2200;
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

 const schoolCracksGroup = new THREE.Group();
 schoolCracksGroup.name = 'TECH-FREIRE-FACADE-CRACKS';
 const schoolCrackPoints = [];
 for (let c = 0; c < 14; c++) {
  let curX = min.x + 1.2 + (c / 14) * (width - 2.4) + Math.sin(c * 3.7) * 1.2;
  let curY = levels[1] + (c % 4) * 3.2;
  for (let s = 0; s < 6; s++) {
   const nextX = curX + Math.sin(c * 5.1 + s * 2.3) * 1.5;
   const nextY = curY - (0.6 + Math.abs(Math.cos(c * 2.9 + s * 3.1)) * 1.1);
   schoolCrackPoints.push(curX, Math.max(min.y + 0.3, curY), front + 0.06);
   schoolCrackPoints.push(nextX, Math.max(min.y + 0.3, nextY), front + 0.06);
   if (s % 2 === 1) {
    const branchX = curX + (s % 4 === 1 ? 1.3 : -1.3);
    const branchY = curY - 0.4;
    schoolCrackPoints.push(curX, Math.max(min.y + 0.3, curY), front + 0.06);
    schoolCrackPoints.push(branchX, Math.max(min.y + 0.3, branchY), front + 0.06);
   }
   curX = nextX;
   curY = nextY;
  }
 }
 const schoolCrackGeo = new THREE.BufferGeometry();
 schoolCrackGeo.setAttribute('position', new THREE.Float32BufferAttribute(schoolCrackPoints, 3));
 const schoolCrackMat = new THREE.LineBasicMaterial({ color: 0x221a16, transparent: true, opacity: 0.0, depthWrite: false });
 const schoolCrackLines = new THREE.LineSegments(schoolCrackGeo, schoolCrackMat);
 schoolCrackLines.frustumCulled = false;
 schoolCracksGroup.add(schoolCrackLines);
 schoolCracksGroup.visible = false;
 scene.add(schoolCracksGroup);
 const pieces=[],matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();
 const rotation=new THREE.Euler();
 let collapsing=false,supportClock=0,impactSerial=0,currentRatio=0,effectsHooks=null;let lastImpact={x:centerX,y:min.y+height*.5,z:front};
 function piece(kind,x,y,z,w,h,d,{zone='structure',strength=1,protectedZone=false,mass=1,rigidity=1,isFurniture=false}={}){
  // Pieces have a simple physically-inspired falling state, not hidden floors.
  pieces.push({kind,x,y,z,w,h,d,homeX:x,homeY:y,homeZ:z,zone,strength,
   protectedZone,mass,rigidity,isFurniture,integrity:1,falling:false,resting:false,delay:0,vx:0,vy:0,vz:0,rot:0,vr:0,removed:false});
 }
 const wall=(x,y,z,w,h,d,kind=0,zone='facade',strength=1,mass=2.2,rigidity=1.8)=>piece(kind,x,y,z,w,h,d,{zone,strength,mass,rigidity});
 const slab=(x,y,z,w,d,kind=1,zone='floor',mass=5.2,rigidity=3.2)=>piece(kind,x,y,z,w,.23,d,{zone,strength:1.1,mass,rigidity});
 const pier=(x,y,z,w,h,d)=>piece(0,x,y,z,w,h,d,{zone:'pier',strength:2.15,mass:3.8,rigidity:2.2});
 const beam=(x,y,z,w,h,d)=>piece(3,x,y,z,w,h,d,{zone:'beam',strength:2.3,mass:3.5,rigidity:4.5});
 const basementY=min.y-2.2;
 const bSect=9, bRows=Math.max(2,Math.ceil((front-back)/6));
 for(let col=0;col<bSect;col++)for(let row=0;row<bRows;row++){
  const x=min.x+(col+.5)*width/bSect;
  const z=back+(row+.5)*(front-back)/bRows;
  slab(x,basementY+.12,z,width/bSect-.07,(front-back)/bRows-.07,1,'basement-floor',6.0,4.0);
 }
 wall(centerX,basementY+1.1,front-.15,width-.3,2.2,.6,1,'basement-wall',6.0,8.0,6.0);
 wall(centerX,basementY+1.1,back+.15,width-.3,2.2,.6,1,'basement-wall',6.0,8.0,6.0);
 for(const side of [-1,1]){
  wall(centerX+side*(width/2-.25),basementY+1.1,(front+back)/2,.5,2.2,front-back-.4,1,'basement-wall',6.0,8.0,6.0);
 }
 for(let cCol=1;cCol<=3;cCol++){
  for(let cRow=1;cRow<=2;cRow++){
   const cx=min.x+cCol*width/4;
   const cz=back+cRow*(front-back)/3;
   piece(3,cx,basementY+1.1,cz,0.55,2.2,0.55,{zone:'basement-column',strength:4.5,mass:6.5,rigidity:6.0});
  }
 }
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
  // RC151: Populated classroom, office, and computer lab furniture across building depth bays
  const depthBays = [front - 3.2, front - 14.0, front - 26.0, back + 10.0];
  for (const bZ of depthBays) {
   for (const fx of [-width * 0.32, -width * 0.12, width * 0.12, width * 0.32]) {
    // Teacher workstation & PC monitor
    piece(3, centerX + fx, y0 + 0.42, bZ + 0.4, width * 0.11, 0.48, 0.72, { zone: 'classroom-desk', strength: 0.4, mass: 1.1, rigidity: 1.5, isFurniture: true });
    piece(4, centerX + fx, y0 + 0.88, bZ + 0.4, 0.55, 0.36, 0.22, { zone: 'lab-monitor', strength: 0.2, mass: 0.35, rigidity: 0.8, isFurniture: true });
    // Student dual desks & molded chairs
    piece(5, centerX + fx, y0 + 0.32, bZ - 0.75, width * 0.08, 0.62, 0.45, { zone: 'classroom-chair', strength: 0.35, mass: 0.45, rigidity: 1.1, isFurniture: true });
    piece(3, centerX + fx, y0 + 0.42, bZ - 1.85, width * 0.11, 0.48, 0.72, { zone: 'student-desk', strength: 0.4, mass: 0.95, rigidity: 1.4, isFurniture: true });
    piece(5, centerX + fx, y0 + 0.32, bZ - 2.65, width * 0.08, 0.62, 0.45, { zone: 'classroom-chair', strength: 0.35, mass: 0.45, rigidity: 1.1, isFurniture: true });
    // Wall whiteboard & metal filing cabinet
    piece(4, centerX + fx, y0 + h * 0.48, bZ - 3.5, width * 0.12, 1.05, 0.08, { zone: 'classroom-whiteboard', strength: 0.4, mass: 0.65, rigidity: 1.8, isFurniture: true });
    piece(5, centerX + fx + width * 0.07, y0 + 0.72, bZ - 3.2, 0.65, 1.42, 0.38, { zone: 'classroom-bookshelf', strength: 0.5, mass: 1.4, rigidity: 2.2, isFurniture: true });
    piece(3, centerX + fx - width * 0.07, y0 + 0.65, bZ - 3.2, 0.52, 1.25, 0.45, { zone: 'filing-cabinet', strength: 0.6, mass: 1.8, rigidity: 3.2, isFurniture: true });
   }
  }
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

  const centerZ=(front+back)*0.5;
  const toCenterX=centerX-p.x;
  const toCenterZ=centerZ-p.z;
  const distCenter=Math.hypot(toCenterX,toCenterZ)||1.0;
  const implodeDirX=toCenterX/distCenter;
  const implodeDirZ=toCenterZ/distCenter;

  const isInterior=['floor','column','beam','atrium-column','atrium-rail','partition','classroom-light','classroom-desk','basement-column','basement-floor','basement-wall'].includes(p.zone);
  const isGlass=p.kind===2||p.zone==='glass';
  const rigidity=p.rigidity||(isGlass?0.1:isInterior?4.0:1.8);
  const mass=p.mass||(isGlass?0.25:p.zone==='floor'?5.2:isInterior?4.0:2.2);

  if(isInterior){
   const implodeSpeed=(violent?4.8:2.4)/Math.sqrt(mass);
   p.vx=implodeDirX*implodeSpeed+a*1.2;
   p.vz=implodeDirZ*implodeSpeed+b*1.2;
   p.vy=(violent?-1.8:-0.6)-Math.abs(b)*(violent?2.8:1.2)/Math.sqrt(mass);
   p.vr=(a+b)*(1.8/rigidity);
  }else{
   const explodeSpeed=(violent?(isGlass?8.5:6.2):(isGlass?4.8:3.2))/Math.sqrt(mass);
   p.vx=-implodeDirX*explodeSpeed+a*2.2;
   p.vz=-implodeDirZ*explodeSpeed+b*2.2;
   p.vy=1.2+Math.abs(b)*(violent?5.5:2.8)/Math.sqrt(mass);
   p.vr=(a+b)*(isGlass?6.0:3.2);
  }

  const frame=structural.has(p)||p.zone==='floor'||p.zone==='basement-floor';
  p.profile=isGlass?'glass':frame?'structure':'facade';
  if(effectsHooks){
   if(p.profile==='glass')effectsHooks.onGlassShatter?.(p.x,p.y,p.z);
   else if(['column','pier','atrium-column'].includes(p.zone))effectsHooks.onColumnBuckle?.(p.x,p.y,p.z);
   else if(['floor','basement-floor'].includes(p.zone))effectsHooks.onFloorPancake?.(p.x,p.y,p.z);
  }
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
    if(p.homeY>min.y+height*0.75&&!collapsing)continue; // roof & top level remain standing overhead
   if(!['floor','beam','pier','column','atrium-column','partition','spandrel','glass','facade','rear','side','side-spandrel'].includes(p.zone))continue;
   // Localize progressive failure to the impacted structural sector unless overall damage is catastrophic
   if(currentRatio<0.82){
    const distToImpact=Math.hypot(p.homeX-lastImpact.x,p.homeZ-lastImpact.z);
    if(distToImpact>4.2)continue;
   }
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
 function punchBorehole({x,y,z,radius=2.8,isHeavyIron=false,isMassive=false}){
  if(collapsing)return 0;
  let severed=0;
  const punchRadiusSq=radius*radius;
  const bottomY=isMassive?(min.y-2.2):(isHeavyIron?(min.y+0.4):(y-3.4));
  for(const p of pieces){
   if(p.falling||p.resting||p.removed)continue;
   const hDistSq=(p.x-x)*(p.x-x)+(p.z-z)*(p.z-z);
   if(hDistSq>punchRadiusSq)continue;
   if(p.y>y+1.2||p.y<bottomY)continue;

   p.falling=true;
   p.delay=0;
   const mass=p.mass||2.0;
   const a=Math.sin(p.x*7.1+p.y*3.3+p.z);
   const b=Math.cos(p.z*5.5-p.x*2.2);
   const hDist = Math.sqrt(hDistSq);
   const isCoreImplosion = hDist < (radius * 0.55);

   if (isCoreImplosion) {
    // RC151: Internal Implosion Core — pieces sucked inward toward penetration axis
    p.isImploded = true;
    p.vx = (x - p.x) * 1.8 + a * 0.4;
    p.vz = (z - p.z) * 1.8 + b * 0.4;
    p.vy = -(isHeavyIron ? 17.5 : (isMassive ? 21.0 : 12.5)) / Math.sqrt(mass);
   } else {
    // RC151: Outer Spall Explosion — facade bricks, stone and glass blasted outward
    p.isExploded = true;
    p.vx = (p.x - x) * 2.2 + a * 1.1;
    p.vz = (p.z - z) * 2.2 + b * 1.1;
    p.vy = (3.5 + Math.random() * 5.0) / Math.sqrt(mass);
   }
   p.rot=0;
   p.vr=(a+b)*3.2;
   p.integrity=0;
   severed++;
  }
  if(severed>0)flush();
  return severed;
 }
 function collapse(){
  if(schoolCracksGroup)schoolCracksGroup.visible=false;
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
  else if(p.resting){
   // Vary fracture size using the original location so the debris is stable.
   const variation=.5+.5*Math.sin(p.homeX*7.3+p.homeY*4.1+p.homeZ*2.9);
   const structural=p.profile==='structure';
   const cap=structural?.42+.49*variation:.18+.41*variation;
   const span=(structural?1.0:.65)+1.2*variation;
   scale.set(Math.min(p.w,span),Math.min(p.h,cap),Math.min(p.d,span*.9));
  }
  else scale.set(p.w,p.h,p.d);
 }
 function update(dt){
  if(dt<=0)return;
  supportClock+=dt;
  if(!collapsing&&supportClock>=.18){propagateSupportFailure(supportClock);if(Math.random()<0.25&&effectsHooks)effectsHooks.onStructuralCreak?.(centerX,min.y+height*0.5,front);supportClock=0;}
  let changed=false;
  for(const p of pieces){
   if(!p.falling||p.resting||p.removed)continue;
   p.delay=Math.max(0,p.delay-dt);
   if(p.delay>0)continue;
   changed=true;
   const isFloor=p.zone==='floor'||p.zone==='basement-floor';
   const isSteel=p.kind===3||p.zone==='beam'||p.zone==='column'||p.zone==='atrium-column';
   const isGlass=p.kind===2||p.zone==='glass';
   const isDrywall=p.kind===4||p.zone==='partition'||p.zone==='classroom-whiteboard'||p.zone==='classroom-light';
   const isFurniture=p.kind===5||p.zone==='classroom-desk'||p.zone==='classroom-chair'||p.zone==='classroom-bookshelf';
   const isFacade=p.kind===0||p.zone==='facade'||p.zone==='pier';

   const grav=isFloor?21.0:isSteel?18.5:isFacade?16.5:isFurniture?13.5:isDrywall?10.8:isGlass?9.6:15.0;
   const dragRate=isGlass?2.4:isDrywall?1.8:isFurniture?0.95:isFacade?0.65:isSteel?0.32:0.40;

   p.vy-=grav*dt;
   p.vx*=Math.exp(-dragRate*dt);
   p.vz*=Math.exp(-dragRate*dt);
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;
   if(isSteel)p.vr+=Math.sin(p.y*2.0)*0.35*dt;

   dimensions(p);
   const insideFootprint=p.x>=min.x+0.6&&p.x<=max.x-0.6&&p.z>=back+0.6&&p.z<=front-0.6;
   const floor=insideFootprint?(min.y-2.2+scale.y*.5):(min.y+scale.y*.5);
   if(p.y<=floor){
    p.y=floor;
    const impactVy=Math.abs(p.vy);
    const restitution=isFloor?-0.06:isSteel?-0.22:isFacade?-0.16:isFurniture?-0.12:isGlass?-0.02:-0.14;
    p.vy*=restitution;
    p.vx*=(isFloor?0.15:isSteel?0.45:0.32);
    p.vz*=(isFloor?0.15:isSteel?0.45:0.32);
    p.vr*=0.35;

    if(impactVy>3.0&&effectsHooks){
     if(isGlass){
      p.resting=true;
      if(Math.random()<0.65)p.removed=true;
      effectsHooks.onGlassShatter?.(p.x,p.y,p.z);
     }else if(isFloor&&impactVy>4.0){
      effectsHooks.onFloorPancake?.(p.x,p.y,p.z);
     }else if(isSteel&&impactVy>3.2){
      effectsHooks.onColumnBuckle?.(p.x,p.y,p.z);
     }
    }

    if(Math.abs(p.vy)<1.4){
     p.resting=true;
     dimensions(p);
     p.y=floor;
    }
   }
  }
  if(changed)flush();
 }
 let detachedOnly=false;
 let overlayMode=false;
 function flush(){
  const counts=new Array(materials.length).fill(0);
  for(const p of pieces){
   if(p.removed)continue;
   if(detachedOnly&&!p.falling)continue;
   if(overlayMode&&!p.falling){
    // In overlay mode, keep internal structural elements (floor slabs, columns, beams, atrium trusses,
    // interior classroom partitions, ceiling lights, desks, roof HVAC equipment) visible inside the building!
    // Omit duplicate exterior facade brick that would conflict with the intact FBX exterior.
    const isInternal=['floor','beam','column','atrium-column','atrium-rail','partition','classroom-light','classroom-desk','classroom-chair','classroom-whiteboard','classroom-bookshelf','roof-hvac','basement-column','basement-floor','basement-wall'].includes(p.zone);
    if(!isInternal)continue;
   }
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
 function syncDestruction(ratio){
  currentRatio=ratio;
  if(schoolCracksGroup){
   if(ratio>=0.15&&ratio<0.96){
    schoolCracksGroup.visible=true;
    const prog=THREE.MathUtils.clamp((ratio-0.15)/0.55,0.0,1.0);
    schoolCrackMat.opacity=0.28+prog*0.68;
   }else{
    schoolCracksGroup.visible=false;
   }
  }
  if(ratio<=0)return;
  if(ratio>=0.97){collapse();return;}
  const attachedPieces=pieces.filter(p=>!p.falling&&!p.resting&&!p.removed);
  const targetDetached=Math.floor(pieces.length*Math.min(1.0,ratio*0.92));
  const currentDetached=pieces.filter(p=>p.falling||p.resting).length;
  const needed=targetDetached-currentDetached;
  if(needed>0){
   // Physically-calibrated failure: damage concentrates near meteor impacts,
   // interior lightweight partitions/desks fail first, followed by pancake slabs
   const candidates=[...attachedPieces].map(p=>{
    const distToImpact=Math.hypot(p.homeX-lastImpact.x,p.homeY-lastImpact.y,p.homeZ-lastImpact.z);
    const isInterior=['classroom-light','classroom-desk','partition'].includes(p.zone);
    const isGlass=p.zone==='glass'||p.kind===2;
    const isSlab=p.zone==='floor'||p.zone==='basement-floor';
    const isColumn=['column','pier','atrium-column'].includes(p.zone);
    const fragilityScore=isGlass?-5.0:(isInterior?-3.0:(isSlab?0.5:(isColumn?4.5:1.5)));
    const topBias=(p.homeY-(min.y+height))*0.25; // slight upper gravity bias
    const noise=Math.sin(p.homeX*3.1+p.homeY*2.7+p.homeZ*4.3)*1.2;
    return {piece:p,score:distToImpact+fragilityScore+topBias+noise};
   }).sort((a,b)=>a.score-b.score);
   for(let i=0;i<Math.min(needed,candidates.length);i++){
    detach(candidates[i].piece,i*7.31+ratio*19.1,0.03+Math.random()*0.18,ratio>0.35);
   }
   flush();
  }
 }
 function reset(){
  if(schoolCracksGroup){schoolCracksGroup.visible=false;schoolCrackMat.opacity=0;}
  collapsing=false;supportClock=0;impactSerial=0;lastImpact={x:centerX,y:min.y+height*.5,z:front};
  for(const p of pieces){
   Object.assign(p,{x:p.homeX,y:p.homeY,z:p.homeZ,
     integrity:1,falling:false,resting:false,delay:0,vx:0,vy:0,vz:0,rot:0,vr:0,removed:false,profile:null,isFlaming:false,hitGround:false});
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
 return {group:batches,impact,punchBorehole,collapse,update,reset,restore:reset,syncDestruction,stats,
  getPieces:()=>pieces.map(p=>({zone:p.zone,integrity:p.integrity,falling:p.falling,resting:p.resting,x:p.x,y:p.y,z:p.z,vy:p.vy,mass:p.mass,isFurniture:!!p.isFurniture,isImploded:!!p.isImploded,isExploded:!!p.isExploded})),
  setEffectsHooks:hooks=>{effectsHooks=hooks;},
  getFlamingDebris:()=>pieces.filter(p=>p.resting&&p.isFlaming).map(p=>({x:p.x,y:p.y,z:p.z,scale:Math.max(p.w,p.h)})),
  setDetachedOnly:on=>{if(detachedOnly!==on){detachedOnly=on;flush();}},
  setOverlayMode:on=>{if(overlayMode!==on){overlayMode=on;detachedOnly=false;flush();}},
  setVisible:(visible)=>batches.forEach(m=>m.visible=visible),
  setNight:(darkness)=>{materials[4].emissiveIntensity=.18+.8*darkness}};
}
