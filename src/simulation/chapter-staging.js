import * as THREE from "three";
// Lightweight chapter-specific occupation tableau and chapter-end settlement props.
export function createChapterStaging(scene){
 const group=new THREE.Group();scene.add(group);
 const mat=(color,metalness=.12,roughness=.78)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const white=mat(0xe2e4e1),dark=mat(0x19222b,.4,.6),armor=mat(0x58654f),skin=mat(0x94725c),gold=mat(0xf6cc78),red=mat(0x9c3244),orange=mat(0xdd6818,.2,.6),yellow=mat(0xe5af22,.15,.55),safety=mat(0xffaa2e,.1,.5),cone=mat(0xff7a2e),black=mat(0x121518,.2,.9),chrome=mat(0xccd4db,.8,.25),glass=mat(0x3a536b,.3,.2),amber=new THREE.MeshBasicMaterial({color:0xffaa00});
 const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(.5,7,5),cyl=new THREE.CylinderGeometry(.5,.5,1,8);
 let chapter=0,mode='chapter',settlementChapter=0,leaveTarget=0,leaveTimer=0;
 const movers=[];let settlementClock=0;const cleanupPiles=[];
 function clear(){group.clear();movers.length=0;cleanupPiles.length=0;settlementClock=0;}
 function box(parent,x,y,z,w,h,d,m){const mesh=new THREE.Mesh(cube,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;}
 function cylinder(parent,x,y,z,r,h,m){const mesh=new THREE.Mesh(cyl,m);mesh.position.set(x,y,z);mesh.scale.set(r*2,h,r*2);parent.add(mesh);return mesh;}
 function person(x,z,uniform=false,sign=false,worker=false){const g=new THREE.Group();g.position.set(x,0,z);group.add(g);movers.push({g,kind:'person'});
  box(g,0,1.12,0,.58,1.1,.36,worker?yellow:(uniform?dark:Math.random()<.5?red:armor));
  box(g,-.16,.32,0,.2,.66,.2,dark);box(g,.16,.32,0,.2,.66,.2,dark);
  const head=new THREE.Mesh(sphere,skin);head.position.y=1.94;head.scale.set(.32,.36,.3);g.add(head);
  if(sign){box(g,.47,2.5,0,.95,.57,.07,worker?safety:gold);box(g,.47,1.75,0,.06,1.4,.06,dark);}return g;}
 function wheels(g,positions,scale=.72){for(const [dx,dz] of positions){const w=new THREE.Mesh(sphere,black);w.scale.set(scale,scale,.38);w.position.set(dx,.4,dz);g.add(w);}}
 function vehicle(x,z,military=false,ice=false){const g=new THREE.Group();g.position.set(x,0,z);group.add(g);movers.push({g,kind:'vehicle'});
  const base=military?armor:(ice?black:white); box(g,0,1,0,military?7:5,1.8,2.8,base); box(g,-.5,2.1,0,2.4,.7,2.1,military?armor:dark);
  wheels(g,[[-2,-1.3],[-2,1.3],[2,-1.3],[2,1.3]]); if(military){box(g,1.6,2.3,0,3,.23,.25,dark);}else{box(g,0,2.55,0,.75,.22,.5,red);box(g,1.2,1.3,1.44,.5,.35,.08,dark);} return g;}

 function constructionCraneTruck(x,z,facing=-1,targetBuilding=null){
  const g=new THREE.Group();g.position.set(x,0,z);group.add(g);
  // Realistic chassis & cab
  box(g,0,.95,0,7.6,1.4,2.9,orange); // Lower chassis
  box(g,facing*2.6,1.85,0,2.3,1.55,2.75,yellow); // Driver cab
  box(g,facing*3.76,1.35,0,.22,.7,2.4,chrome); // Front radiator grille
  box(g,facing*2.7,2.05,0,1.6,.9,2.82,glass); // Windshield & cab glass
  // Flashing amber emergency beacon on cab roof
  const beacon=box(g,facing*2.6,2.75,0,.65,.25,.65,amber);
  // Heavy dual rear axles & front steering axle
  wheels(g,[[-2.6,-1.42],[-2.6,1.42],[-1.1,-1.42],[-1.1,1.42],[2.3,-1.42],[2.3,1.42]],.76);
  // Toolboxes and stabilizer housing
  box(g,-.5,.95,-1.35,3.2,.85,.25,dark);
  box(g,-.5,.95,1.35,3.2,.85,.25,dark);
  // Outriggers: 4 hydraulic stabilizer legs with ground pads
  const outriggers=[];
  for(const [ox,oz] of [[-2.2,-1.5],[-2.2,1.5],[1.4,-1.5],[1.4,1.5]]){
   const leg=box(g,ox,.45,oz,.28,.8,.28,chrome);
   const pad=box(g,ox,.06,oz,.65,.1,.65,dark);
   outriggers.push({leg,pad,baseY:pad.position.y});
  }
  // Crane Turret & Articulated Telescoping Boom
  const turret=new THREE.Group();turret.position.set(-facing*1.1,1.75,0);g.add(turret);
  cylinder(turret,0,.35,0,.85,.7,dark); // Turret base
  box(turret,0,.95,0,1.4,.9,1.3,yellow); // Turret housing
  box(turret,-.5,1.1,0,.8,1.2,.7,dark); // Counterweight
  // Main boom pivot
  const boomPivot=new THREE.Group();boomPivot.position.set(.2,1.25,0);turret.add(boomPivot);
  const mainBoom=box(boomPivot,-2.4,.2,0,5.0,.55,.6,orange);mainBoom.position.x=2.5; // Main boom arm
  // Telescoping extension arm
  const extPivot=new THREE.Group();extPivot.position.set(4.8,.2,0);boomPivot.add(extPivot);
  const extBoom=box(extPivot,-2.0,0,0,4.2,.42,.45,yellow);extBoom.position.x=2.1;
  // Work platform / basket at boom tip
  const basket=new THREE.Group();basket.position.set(4.2,0,0);extPivot.add(basket);
  box(basket,0,.45,0,1.1,.9,1.1,safety);
  box(basket,0,.08,0,1.2,.15,1.2,dark);
  // Work spark / welding glint at tip
  const sparkGlint=new THREE.Mesh(new THREE.SphereGeometry(.22,6,5),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0}));
  sparkGlint.position.set(4.8,.7,0);extPivot.add(sparkGlint);

  const mover={g,kind:'constructionCrane',beacon,outriggers,turret,boomPivot,extPivot,sparkGlint,facing,targetBuilding,working:false,workPhase:0};
  movers.push(mover);
  return mover;
 }

 function dumpTruck(x,z,facing=1){
  const g=new THREE.Group();g.position.set(x,0,z);group.add(g);
  box(g,0,.95,0,7.4,1.3,2.8,orange); // Heavy chassis
  box(g,facing*2.5,1.9,0,2.2,1.6,2.7,yellow); // Cab
  box(g,facing*3.65,1.4,0,.2,.8,2.3,chrome); // Grille
  box(g,facing*2.6,2.1,0,1.5,.9,2.75,glass); // Windshield
  const beacon=box(g,facing*2.5,2.8,0,.6,.25,.6,amber); // Roof beacon
  wheels(g,[[-2.5,-1.42],[-2.5,1.42],[-1.0,-1.42],[-1.0,1.42],[2.2,-1.42],[2.2,1.42]],.76);
  // Steel dump bed with tailgate
  const bedPivot=new THREE.Group();bedPivot.position.set(-facing*1.6,1.6,0);g.add(bedPivot);
  const bedBody=new THREE.Group();bedBody.position.set(facing*1.6,0,0);bedPivot.add(bedBody);
  box(bedBody,0,.1,0,4.4,.2,2.6,dark); // Bed floor
  box(bedBody,0,.9,-1.25,4.4,1.4,.15,yellow); // Left wall
  box(bedBody,0,.9,1.25,4.4,1.4,.15,yellow); // Right wall
  box(bedBody,facing*2.15,.9,0,.15,1.4,2.6,yellow); // Bulkhead
  box(bedBody,-facing*2.15,.9,0,.15,1.4,2.6,dark); // Tailgate
  const rubbleMesh=box(bedBody,0,.55,0,3.8,.5,2.2,black); // Rubble load inside bed
  rubbleMesh.scale.set(1,.25,1);
  const mover={g,kind:'dumpTruck',beacon,bedPivot,bedBody,rubbleMesh,facing,targetX:x,targetZ:z,working:false,load:.25};
  movers.push(mover);
  return mover;
 }

 function debrisClearingCrane(x,z,facing=1,dumpTruck=null){
  const g=new THREE.Group();g.position.set(x,0,z);group.add(g);
  box(g,0,.95,0,6.8,1.2,2.8,orange); // Carrier chassis
  box(g,facing*2.4,1.7,0,1.8,1.3,2.6,dark); // Engine deck
  wheels(g,[[-2.2,-1.42],[-2.2,1.42],[0,-1.42],[0,1.42],[2.2,-1.42],[2.2,1.42]],.74);
  const outriggers=[];
  for(const [ox,oz] of [[-2.0,-1.5],[-2.0,1.5],[1.6,-1.5],[1.6,1.5]]){
   const leg=box(g,ox,.45,oz,.28,.8,.28,chrome);
   const pad=box(g,ox,.06,oz,.65,.1,.65,dark);
   outriggers.push({leg,pad,baseY:pad.position.y});
  }
  // Slewing Turret & Articulated Boom
  const turret=new THREE.Group();turret.position.set(-facing*.7,1.55,0);g.add(turret);
  cylinder(turret,0,.3,0,.85,.6,dark); // Slewing ring
  box(turret,0,.95,0,1.8,1.1,1.6,yellow); // Machinery house
  box(turret,-1.0,1.0,0,.9,1.2,1.5,dark); // Counterweight
  box(turret,.6,1.25,.55,.9,.95,.7,glass); // Operator cab
  const beacon=box(turret,0,1.65,0,.5,.2,.5,amber);
  // Boom Assembly
  const boomPivot=new THREE.Group();boomPivot.position.set(.8,1.0,0);turret.add(boomPivot);
  box(boomPivot,2.2,.2,0,4.4,.55,.6,orange); // Main boom
  const stickPivot=new THREE.Group();stickPivot.position.set(4.3,.2,0);boomPivot.add(stickPivot);
  box(stickPivot,1.7,-.2,0,3.4,.42,.45,yellow); // Stick / dipper arm
  const clawPivot=new THREE.Group();clawPivot.position.set(3.4,-.3,0);stickPivot.add(clawPivot);
  const clawA=box(clawPivot,.4,-.3,-.25,.7,.65,.35,dark);
  const clawB=box(clawPivot,.4,-.3,.25,.7,.65,.35,dark);
  const clawRubble=box(clawPivot,.4,-.3,0,.5,.5,.4,black);
  clawRubble.visible=false;
  const mover={g,kind:'debrisCrane',beacon,turret,boomPivot,stickPivot,clawPivot,clawA,clawB,clawRubble,outriggers,facing,dumpTruck,targetX:x,targetZ:z,working:false,workPhase:0};
  movers.push(mover);
  return mover;
 }

 function extensionLadder(x,z,wallY=9.2,leanAngle=0.20){
  const g=new THREE.Group();g.position.set(x,0,z);group.add(g);
  const ladderGroup=new THREE.Group();g.add(ladderGroup);
  ladderGroup.rotation.x=-leanAngle; // Lean against building facade
  // Aluminum rails
  box(ladderGroup,-.42,wallY*.55,0,.08,wallY*1.1,.08,chrome);
  box(ladderGroup,.42,wallY*.55,0,.08,wallY*1.1,.08,chrome);
  // Rungs
  for(let r=1;r<=10;r++) box(ladderGroup,0,r*(wallY*.095),0,.84,.05,.05,chrome);
  // Climber worker on ladder
  const climber=new THREE.Group();climber.position.set(0,wallY*.68,.15);ladderGroup.add(climber);
  box(climber,0,.8,0,.5,.9,.3,safety);
  box(climber,0,1.45,0,.3,.32,.28,skin);
  box(climber,0,1.62,0,.38,.18,.36,yellow);
  box(climber,-.15,.2,0,.18,.55,.18,dark);
  box(climber,.15,.2,0,.18,.55,.18,dark);
  const trowelArm=box(climber,.35,.9,-.25,.15,.15,.6,dark);
  box(climber,.35,.9,-.55,.22,.18,.05,chrome);
  // Ground safety spotter
  const spotter=new THREE.Group();spotter.position.set(0,0,.55);g.add(spotter);
  box(spotter,0,1.1,0,.55,1.1,.34,yellow);
  box(spotter,0,1.85,0,.3,.32,.28,skin);
  box(spotter,0,2.05,0,.38,.18,.36,white);
  box(spotter,-.16,.32,0,.2,.66,.2,dark);
  box(spotter,.16,.32,0,.2,.66,.2,dark);
  box(spotter,-.32,1.25,-.35,.14,.14,.6,skin);
  box(spotter,.32,1.25,-.35,.14,.14,.6,skin);
  // Protective cones at base
  coneProp(x-.9,z+.8);coneProp(x+.9,z+.8);
  const mover={g,kind:'ladder',ladderGroup,climber,trowelArm,spotter,wallY,working:true};
  movers.push(mover);
  return mover;
 }

 function barrier(x,z){box(group,x,.65,z,2.4,.2,.28,safety); box(group,x,.35,z,2.6,.15,.3,black);}
 function coneProp(x,z){const c=new THREE.Group();c.position.set(x,0,z);group.add(c); box(c,0,.25,0,.3,.5,.3,cone); box(c,0,.05,0,.55,.08,.55,white);}
 function buildChapterLayout(next){clear(); chapter=next; mode='chapter';
  if(chapter===2){
   for(const x of [-72,70]){vehicle(x,-29,false,true);vehicle(x,-24,false,true);box(group,x,1,-27,.3,1.5,12,gold);} 
   for(let i=0;i<22;i++){const x=-58+i*5.5;person(x,-17+(i%2)*2,i%4===0,i%3===0,false);} for(let i=0;i<12;i++)person(-35+i*3.2,-34,true,false,false);
  }else if(chapter===3){
   for(const x of [-72,-38,15,72]){vehicle(x,-29,true,false);vehicle(x,-23,true,false);} for(let i=0;i<28;i++)person(-80+i*6,-18+(i%3)*2,true,false,false); for(const x of [-70,70])box(group,x,1,-26,.5,1.8,14,armor);
  }
 }
 function setChapter(next){settlementChapter=0; leaveTarget=0; leaveTimer=0; buildChapterLayout(next);} 
 function setSettlement(fromChapter){clear(); mode='settlement'; settlementChapter=fromChapter; leaveTarget=0; leaveTimer=0;
  // Diverse Construction Fleet positioned along damaged facades:
  // 1. Tech Freire School center-front (x = -3, z = 13.5): Telescopic crane truck repairing high masonry & cornice
  const truckSchool=constructionCraneTruck(-3,13.5,1,'tech-freire-school');

  // 2. Grands As Parents / Maximus Cares North frontage:
  //    - Debris clearing crane / excavator at x = -26, z = 13.5
  //    - Heavy dump truck receiving sidewalk debris at x = -17, z = 14.5
  const truckDump=dumpTruck(-17,14.5,1);
  const excavator=debrisClearingCrane(-26,13.5,1,truckDump);

  // 3. Extension ladders brought by crews for facade repairs:
  //    - Leaned against Tech Freire main entrance (x = 6.5, z = 11.2, wallY = 8.8)
  extensionLadder(6.5,11.2,8.8,0.20);
  //    - Leaned against Brownstone facade (x = 22, z = 11.2, wallY = 9.5)
  extensionLadder(22,11.2,9.5,0.20);

  // 4. Traffic safety perimeter along Broad Street curb
  for(const x of [-48,-36,-24,-12,0,12,24,36,48]) barrier(x,16.5), coneProp(x-1.5,16.2), coneProp(x+1.5,16.2);
  // 5. Construction personnel in safety gear
  for(let i=0;i<12;i++)person(-38+i*7,12.5+(i%2)*1.2,false,i%3===0,true);
  // 6. Rubble cleanup piles on sidewalk
  for(let i=0;i<5;i++){const pile=box(group,-26+i*13,.55,8.8,2.4,.75,2.4,black);cleanupPiles.push(pile);}

  // Set arrival targets and initial offscreen road positions (normal driving pace ~13-15 units/s)
  let convoyIndex=0;
  for(const item of movers){
   if(item.kind==='constructionCrane'||item.kind==='dumpTruck'||item.kind==='debrisCrane'){
    item.targetX=item.g.position.x;
    item.targetZ=item.g.position.z;
    item.arrivalDelay=convoyIndex*1.4;
    // Drive in along the road lane (z = 20.5) from off-screen
    item.g.position.x+=item.facing*(44+convoyIndex*16);
    item.g.position.z=20.5;
    convoyIndex++;
   }
  }
 }
 function deployRoundCleanup(targetBuildingX=0,targetBuilding='tech-freire-school'){
  clear();
  mode='roundCleanup';
  settlementClock=0;
  leaveTarget=0;
  leaveTimer=0;
  const facing=targetBuildingX>=0?1:-1;
  const truck=constructionCraneTruck(targetBuildingX,13.5,facing,targetBuilding);
  truck.targetX=targetBuildingX;
  truck.targetZ=13.5;
  truck.arrivalDelay=0;
  truck.g.position.x=targetBuildingX+facing*48;
  truck.g.position.z=20.5;
  coneProp(targetBuildingX-4.5,16.2);
  coneProp(targetBuildingX+4.5,16.2);
  barrier(targetBuildingX,16.5);
  person(targetBuildingX-2.5,12.2,false,false,true);
  person(targetBuildingX+2.5,12.2,false,true,true);
 }
 function beginNextRound(next){
  if((mode==='roundCleanup'||mode==='settlement')&&group.children.length){
   leaveTarget=next;
   leaveTimer=4.5;
   mode='leaving';
  }else buildChapterLayout(next);
 }
 function beginNextChapter(next){
  if(mode==='settlement'&&group.children.length){ leaveTarget=next; leaveTimer=9.5; mode='leaving'; }
  else buildChapterLayout(next);
 }
 function update(dt,elapsed){
  if(mode==='settlement'||mode==='roundCleanup'){
   settlementClock+=dt;
   // Vehicles drive in at normal city pace (~13.5 units/s), pull up to curb, and actively work
   for(const item of movers){
    if(item.beacon)item.beacon.material.color.setHex((Math.sin(elapsed*13)>0)?0xffaa00:0x553300);
    if(item.kind==='constructionCrane'||item.kind==='dumpTruck'||item.kind==='debrisCrane'){
     if(settlementClock>=(item.arrivalDelay||0)){
      const dx=item.targetX-item.g.position.x;
      const dist=Math.abs(dx);
      if(dist>0.05){
       const speed=Math.min(13.5,Math.max(2.5,dist*2.0));
       item.g.position.x+=Math.sign(dx)*Math.min(speed*dt,dist);
      }
      item.g.position.z=THREE.MathUtils.damp(item.g.position.z,item.targetZ,1.4,dt);
      const arrived=dist<.7&&Math.abs(item.g.position.z-item.targetZ)<.5;
      if(arrived){
       item.working=true;
       item.workPhase+=dt;
       if(item.outriggers){
        for(const out of item.outriggers){
         out.pad.position.y=THREE.MathUtils.damp(out.pad.position.y,0,1.8,dt);
         out.leg.scale.y=THREE.MathUtils.damp(out.leg.scale.y,1.2,1.8,dt);
        }
       }
       if(item.kind==='constructionCrane'){
        const targetTurretAngle=item.facing>0?Math.PI*.62:-Math.PI*.62;
        item.turret.rotation.y=THREE.MathUtils.damp(item.turret.rotation.y,targetTurretAngle,1.2,dt);
        const targetPitch=0.75+Math.sin(elapsed*.8)*.15;
        item.boomPivot.rotation.z=THREE.MathUtils.damp(item.boomPivot.rotation.z,targetPitch,1.4,dt);
        item.extPivot.position.x=THREE.MathUtils.damp(item.extPivot.position.x,4.2+Math.sin(elapsed*1.2)*.6,1.2,dt);
        const sparking=Math.sin(elapsed*28+item.targetX)>.25;
        if(item.sparkGlint){
         item.sparkGlint.material.opacity=sparking?.95:0;
         item.sparkGlint.scale.setScalar(sparking?.3+Math.random()*.25:.01);
        }
       }else if(item.kind==='debrisCrane'){
        // Articulated excavator animation: slews to sidewalk rubble, scoops, slews to dump truck, deposits debris
        const cycle=(item.workPhase*.35)%1.0;
        let slewAngle,pitchBoom,pitchStick,clawOpen,holdingRubble;
        if(cycle<.30){
         // Slew to sidewalk rubble pile
         slewAngle=item.facing>0?Math.PI*.55:-Math.PI*.55;
         pitchBoom=0.45+Math.sin(cycle*Math.PI/.30)*.25;
         pitchStick=-0.75-Math.sin(cycle*Math.PI/.30)*.20;
         clawOpen=cycle<.18;
         holdingRubble=cycle>=.18;
        }else if(cycle<.70){
         // Slew over to dump truck bed
         const t=(cycle-.30)/.40;
         const truckAngle=item.facing>0?-Math.PI*.42:Math.PI*.42;
         slewAngle=THREE.MathUtils.lerp(item.facing>0?Math.PI*.55:-Math.PI*.55,truckAngle,t);
         pitchBoom=0.82;
         pitchStick=-0.45;
         clawOpen=false;
         holdingRubble=true;
        }else if(cycle<.85){
         // Dump into truck bed
         slewAngle=item.facing>0?-Math.PI*.42:Math.PI*.42;
         pitchBoom=0.75;
         pitchStick=-0.35;
         clawOpen=true;
         holdingRubble=false;
         if(item.dumpTruck){
          item.dumpTruck.load=Math.min(1.0,item.dumpTruck.load+dt*.18);
          item.dumpTruck.rubbleMesh.scale.y=item.dumpTruck.load;
         }
        }else{
         // Return to rubble pile
         const t=(cycle-.85)/.15;
         slewAngle=THREE.MathUtils.lerp(item.facing>0?-Math.PI*.42:Math.PI*.42,item.facing>0?Math.PI*.55:-Math.PI*.55,t);
         pitchBoom=0.55;
         pitchStick=-0.60;
         clawOpen=true;
         holdingRubble=false;
        }
        item.turret.rotation.y=THREE.MathUtils.damp(item.turret.rotation.y,slewAngle,2.4,dt);
        item.boomPivot.rotation.z=THREE.MathUtils.damp(item.boomPivot.rotation.z,pitchBoom,2.0,dt);
        item.stickPivot.rotation.z=THREE.MathUtils.damp(item.stickPivot.rotation.z,pitchStick,2.0,dt);
        item.clawA.rotation.z=clawOpen?.35:-.15;
        item.clawB.rotation.z=clawOpen?-.35:.15;
        item.clawRubble.visible=holdingRubble;
       }else if(item.kind==='dumpTruck'){
        // Keep bed stable and update rubble height
        item.bedPivot.rotation.z=THREE.MathUtils.damp(item.bedPivot.rotation.z,0,1.5,dt);
        item.rubbleMesh.scale.y=THREE.MathUtils.damp(item.rubbleMesh.scale.y,item.load,1.2,dt);
       }
      }
     }
    }else if(item.kind==='ladder'){
     // Worker active troweling motion on ladder
     if(item.trowelArm)item.trowelArm.rotation.x=Math.sin(elapsed*5.2)*.22;
    }
   }
   const cleared=THREE.MathUtils.smoothstep(settlementClock,3.8,11.5);
   for(const pile of cleanupPiles){pile.scale.y=Math.max(.05,.75*(1-cleared));pile.position.y=.05+pile.scale.y*.5;}
  }
  for(const item of movers){const g=item.g;if(!g.parent)continue;
   if(item.kind==='person'){
    g.rotation.y=Math.sin(elapsed*.9+g.position.x*.08)*.025;
    g.position.y=Math.sin(elapsed*2+g.position.x*.13)*.03;
    if(mode==='settlement'||mode==='roundCleanup'){
     const workFactor=THREE.MathUtils.smoothstep(settlementClock,.8,10.5);
     g.position.x+=Math.sin(elapsed*1.7+g.position.z)*dt*.15*workFactor;
     if(g.children[0])g.children[0].rotation.z=Math.sin(elapsed*4+g.position.x)*.1*workFactor;
    }
   }
  }
  if(mode==='leaving'){
   leaveTimer-=dt;
   let anyOnScreen=false;
   // Crews continue active repairs for first 2.8s after cutscene closes, then pack up and leave
   const activeRepair=leaveTimer>6.7;
   const packing=leaveTimer<=6.7&&leaveTimer>5.2;
   const driving=leaveTimer<=5.2;
   for(const item of movers){
    if(!item.g.parent)continue;
    if(item.kind==='constructionCrane'||item.kind==='debrisCrane'||item.kind==='dumpTruck'){
     if(activeRepair){
      // Continue work
      if(item.sparkGlint)item.sparkGlint.material.opacity=(Math.sin(elapsed*28)>.3)?.9:0;
     }else if(packing){
      // Retract booms, outriggers, and stow equipment
      if(item.sparkGlint)item.sparkGlint.material.opacity=0;
      if(item.boomPivot)item.boomPivot.rotation.z=THREE.MathUtils.damp(item.boomPivot.rotation.z,0,3.0,dt);
      if(item.stickPivot)item.stickPivot.rotation.z=THREE.MathUtils.damp(item.stickPivot.rotation.z,0,3.0,dt);
      if(item.turret)item.turret.rotation.y=THREE.MathUtils.damp(item.turret.rotation.y,0,3.0,dt);
      if(item.outriggers){
       for(const out of item.outriggers){
        out.pad.position.y=THREE.MathUtils.damp(out.pad.position.y,out.baseY,3.0,dt);
        out.leg.scale.y=THREE.MathUtils.damp(out.leg.scale.y,1.0,3.0,dt);
       }
      }
     }else if(driving){
      // Drive off at normal city speed (~14.0 units/s) along road lane
      item.g.position.x+=item.facing*dt*14.0;
      item.g.position.z=THREE.MathUtils.damp(item.g.position.z,20.5,1.8,dt);
     }
    }else if(item.kind==='ladder'){
     if(activeRepair){
      if(item.trowelArm)item.trowelArm.rotation.x=Math.sin(elapsed*5.2)*.22;
     }else{
      // Lower climber and fold ladder flat to pack away
      item.climber.position.y=THREE.MathUtils.damp(item.climber.position.y,.5,2.0,dt);
      if(packing)item.ladderGroup.rotation.x=THREE.MathUtils.damp(item.ladderGroup.rotation.x,-Math.PI*.45,2.0,dt);
      if(driving)item.g.position.x+=dt*5.0;
     }
    }else if(item.kind==='vehicle'){
     if(driving)item.g.position.x+=dt*14.0;
    }else if(item.kind==='person'){
     if(driving)item.g.position.x+=dt*4.5;
    }
    if(Math.abs(item.g.position.x)<260)anyOnScreen=true;
   }
   if(!anyOnScreen||leaveTimer<=-10){
    clear();
    buildChapterLayout(leaveTarget||chapter||1);
   }
  }
 }
 return {setChapter,setSettlement,deployRoundCleanup,beginNextRound,beginNextChapter,update,group,get mode(){return mode;}};
}
