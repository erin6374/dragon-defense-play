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
  // Position realistic construction crane vehicles right at the front street curb of damaged buildings
  // 1. Tech Freire School center-front (x = -3, z = 13.5, working on main school facade)
  const truckSchool=constructionCraneTruck(-3,13.5,1,'tech-freire-school');
  // 2. Grands As Parents / Maximus Cares North frontage (x = -22, z = 13.5)
  const truckNorth=constructionCraneTruck(-22,13.5,1,'grandsAsParents');
  // 3. Brownstone / 2210 South frontage (x = 21, z = 13.5)
  const truckSouth=constructionCraneTruck(21,13.5,-1,'brownstone');

  // Traffic safety perimeter along Broad Street curb
  for(const x of [-48,-36,-24,-12,0,12,24,36,48]) barrier(x,16.5), coneProp(x-1.5,16.2), coneProp(x+1.5,16.2);
  // Construction personnel in safety gear
  for(let i=0;i<14;i++)person(-38+i*6,12.5+(i%2)*1.2,false,i%3===0,true);
  // Rubble cleanup piles on sidewalk
  for(let i=0;i<5;i++){const pile=box(group,-26+i*13,.55,8.8,2.4,.75,2.4,black);cleanupPiles.push(pile);}
  let convoyIndex=0;
  for(const item of movers){
   if(item.kind==='constructionCrane'){
    item.targetX=item.g.position.x;
    item.targetZ=item.g.position.z;
    item.arrivalDelay=convoyIndex*1.5;
    // Drive in along the road lane (z = 21) from off-screen
    item.g.position.x+=item.facing*(38+convoyIndex*14);
    item.g.position.z=20.5;
    convoyIndex++;
   }
  }
 }
 function beginNextChapter(next){
  if(mode==='settlement'&&group.children.length){ leaveTarget=next; leaveTimer=5.8; mode='leaving'; }
  else buildChapterLayout(next);
 }
 function update(dt,elapsed){
  if(mode==='settlement'){
   settlementClock+=dt;
   // Work trucks drive in along road lanes, pull up to curb, deploy outriggers, raise cranes, and actively work
   for(const item of movers){
    if(item.kind==='constructionCrane'){
     // Beacon rotation/flashing
     if(item.beacon)item.beacon.material.color.setHex((Math.sin(elapsed*14)>0)?0xffaa00:0x553300);
     if(settlementClock>=(item.arrivalDelay||0)){
      // Smoothly steer to curb spot
      item.g.position.x=THREE.MathUtils.damp(item.g.position.x,item.targetX,.85,dt);
      item.g.position.z=THREE.MathUtils.damp(item.g.position.z,item.targetZ,.75,dt);
      const arrived=Math.abs(item.g.position.x-item.targetX)<.8&&Math.abs(item.g.position.z-item.targetZ)<.5;
      if(arrived){
       item.working=true;
       item.workPhase+=dt;
       // Deploy outrigger pads
       for(const out of item.outriggers){
        out.pad.position.y=THREE.MathUtils.damp(out.pad.position.y,0,1.8,dt);
        out.leg.scale.y=THREE.MathUtils.damp(out.leg.scale.y,1.2,1.8,dt);
       }
       // Rotate turret toward building facade (z < 0)
       const targetTurretAngle=item.facing>0?Math.PI*.62:-Math.PI*.62;
       item.turret.rotation.y=THREE.MathUtils.damp(item.turret.rotation.y,targetTurretAngle,1.2,dt);
       // Elevate boom arm up to upper facade level
       const targetPitch=0.75+Math.sin(elapsed*.8)*.15;
       item.boomPivot.rotation.z=THREE.MathUtils.damp(item.boomPivot.rotation.z,targetPitch,1.4,dt);
       // Telescoping extension arm movement
       item.extPivot.position.x=THREE.MathUtils.damp(item.extPivot.position.x,4.2+Math.sin(elapsed*1.2)*.6,1.2,dt);
       // Welding repair spark flash
       const sparking=Math.sin(elapsed*28+item.targetX)>.25;
       if(item.sparkGlint){
        item.sparkGlint.material.opacity=sparking?.95:0;
        item.sparkGlint.scale.setScalar(sparking?.3+Math.random()*.25:.01);
       }
      }
     }
    }
   }
   const cleared=THREE.MathUtils.smoothstep(settlementClock,3.8,11.5);
   for(const pile of cleanupPiles){pile.scale.y=Math.max(.05,.75*(1-cleared));pile.position.y=.05+pile.scale.y*.5;}
  }
  for(const item of movers){const g=item.g;if(!g.parent)continue;
   if(item.kind==='person'){
    g.rotation.y=Math.sin(elapsed*.9+g.position.x*.08)*.025;
    g.position.y=Math.sin(elapsed*2+g.position.x*.13)*.03;
    if(mode==='settlement'){
     const workFactor=THREE.MathUtils.smoothstep(settlementClock,.8,10.5);
     g.position.x+=Math.sin(elapsed*1.7+g.position.z)*dt*.15*workFactor;
     if(g.children[0])g.children[0].rotation.z=Math.sin(elapsed*4+g.position.x)*.1*workFactor;
    }
   }
  }
  if(mode==='leaving'){
   leaveTimer-=dt;
   for(const item of movers){
    if(!item.g.parent)continue;
    if(item.kind==='constructionCrane'){
     // Retract crane boom and outriggers before driving off
     item.sparkGlint.material.opacity=0;
     item.boomPivot.rotation.z=THREE.MathUtils.damp(item.boomPivot.rotation.z,0,3.5,dt);
     item.turret.rotation.y=THREE.MathUtils.damp(item.turret.rotation.y,0,3.5,dt);
     for(const out of item.outriggers)out.pad.position.y=THREE.MathUtils.damp(out.pad.position.y,out.baseY,3.5,dt);
     // Drive off along the road
     item.g.position.x+=item.facing*dt*14.5;
     item.g.position.z=THREE.MathUtils.damp(item.g.position.z,21.0,2.0,dt);
    }else if(item.kind==='vehicle'){
     item.g.position.x+=dt*12.0;
    }else if(item.kind==='person'){
     item.g.position.x+=dt*5.5;
    }
   }
   if(leaveTimer<=0){buildChapterLayout(leaveTarget||chapter||1);} 
  }
 }
 return {setChapter,setSettlement,beginNextChapter,update,group,get mode(){return mode;}};
}
