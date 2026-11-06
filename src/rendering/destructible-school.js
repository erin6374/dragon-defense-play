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
  new THREE.MeshStandardMaterial({color:0x725c4b,roughness:.95}) // masonry backer
 ];
 const MAX=1200;
 const unitBox=new THREE.BoxGeometry(1,1,1);
 const batches=materials.map((material,i)=>{
  const mesh=new THREE.InstancedMesh(unitBox,material,MAX);
  mesh.name='TECH-FREIRE-REBUILT-'+['BRICK','CONCRETE','GLAZING','STEEL','INTERIOR','BACKER'][i];
  mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);return mesh;
 });
 const pieces=[],matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();
 const blank=new THREE.Matrix4().makeScale(0,0,0);
 let runningTime=0,collapsing=false;
 function piece(kind,x,y,z,w,h,d,{zone='structure',strength=1,protectedZone=false}={}){
  // Pieces have a simple physically-inspired falling state, not hidden floors.
  pieces.push({kind,x,y,z,w,h,d,homeX:x,homeY:y,homeZ:z,zone,strength,
   protectedZone,falling:false,resting:false,delay:0,vx:0,vy:0,vz:0,rot:0,vr:0,removed:false});
 }
 const wall=(x,y,z,w,h,d,kind=0,zone='facade',strength=1)=>piece(kind,x,y,z,w,h,d,{zone,strength});
 const slab=(x,y,z,w,d)=>piece(1,x,y,z,w,.23,d,{zone:'floor',strength:1.1});
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
   slab(x,y,z,width/sections-.07,(start-back)/rows-.07);
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
  p.vr=(a+b)*(violent?3.5:1.7);return true;
 }
 function impact({x,y,z,radius=3.8,strength=1}){
  if(collapsing)return 0;
  // Gameplay projectiles can hit at the street/front interaction plane (z~11),
  // while the FBX facade is at z~0. Project that strike onto the real shell
  // without opening fictitious damage behind the school.
  z=Math.min(front,Math.max(back,z));
  let removed=0;
  for(const p of pieces){
   if(p.falling||p.resting||p.protectedZone)continue;
   // Affected facade/roof/interior modules are localized in 3D.
   const dx=Math.max(0,Math.abs(x-p.x)-p.w*.5),
         dy=Math.max(0,Math.abs(y-p.y)-p.h*.5),
         dz=Math.max(0,Math.abs(z-p.z)-p.d*.5);
   const distance=Math.hypot(dx,dy,dz);
   const threshold=radius*(p.zone==='glass'?1.34:p.zone==='floor'?.69:1);
   if(distance>threshold)continue;
   const resistance=(p.zone==='pier'||p.zone==='beam')?1.22:1;
   const chance=Math.max(.20,Math.min(1.0,(1-distance/Math.max(.1,threshold))*
       strength/resistance+ (p.zone==='glass'?.48:.20)));
   const test=(Math.sin(p.x*13.12+p.y*3.31+p.z*2.31+runningTime*4.1)+1)/2;
   if(test>chance)continue;
   if(detach(p,x+y+z,Math.random()*.22,true))removed++;
  }
  return removed;
 }
 function collapse(){
  if(collapsing)return;
  collapsing=true;
  for(const p of pieces){
   if(p.falling||p.resting)continue;
   // Upper storeys shed first; lower frame remains visible until the end.
   const story=Math.max(0,Math.min(4,Math.floor((p.homeY-min.y)/Math.max(1,height)*5)));
   const seq=(4-story)*.43+Math.random()*.45+(p.protectedZone?.9:0);
   detach(p,p.homeX+p.homeY,seq,true);
  }
 }
 function update(dt){
  if(dt<=0)return;
  runningTime+=dt;
  let changed=false;
  for(const p of pieces){
   if(!p.falling||p.resting||p.removed)continue;
   p.delay=Math.max(0,p.delay-dt);
   if(p.delay>0)continue;
   changed=true;
   p.vy-=17*dt;p.vx*=Math.exp(-.6*dt);p.vz*=Math.exp(-.6*dt);
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;
   const floor=min.y+p.h*.5;
   if(p.y<=floor){
    p.y=floor;p.vy*= -.18;p.vx*=.35;p.vz*=.35;p.vr*=.4;
    if(Math.abs(p.vy)<1.5)p.resting=true;
   }
  }
  if(changed)flush();
 }
 function flush(){
  const counts=new Array(materials.length).fill(0);
  for(const p of pieces){
   if(p.removed)continue;
   const index=counts[p.kind]++;
   if(index>=MAX)throw new Error('School piece batch overflow '+p.kind);
   position.set(p.x,p.y,p.z);quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,p.rot);
   scale.set(p.w,p.h,p.d);
   matrix.compose(position,quat,scale);
   batches[p.kind].setMatrixAt(index,matrix);
  }
  batches.forEach((mesh,i)=>{mesh.count=counts[i];mesh.instanceMatrix.needsUpdate=true;
   mesh.computeBoundingSphere()});
 }
 function reset(){
  collapsing=false;runningTime=0;
  for(const p of pieces){
   Object.assign(p,{x:p.homeX,y:p.homeY,z:p.homeZ,
     falling:false,resting:false,delay:0,vx:0,vy:0,vz:0,rot:0,vr:0,removed:false});
  }
  flush();
 }
 function stats(){return {parts:pieces.length,drawBatches:materials.length,
   detached:pieces.filter(p=>p.falling).length,falling:pieces.filter(p=>p.falling&&!p.resting).length,
   rubble:pieces.filter(p=>p.resting).length,doubleHeightAtrium:true,
   atriumY:[levels[0],levels[2]],atriumFrontZ:front,atriumBackZ:atriumBack,
   fullFiveStoryShell:true,collapsing}}
 reset();
 return {group:batches,impact,collapse,update,reset,stats,
  setVisible:(visible)=>batches.forEach(m=>m.visible=visible),
  setNight:(darkness)=>{materials[4].emissiveIntensity=.18+.8*darkness}};
}
