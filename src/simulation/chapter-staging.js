import * as THREE from "three";
// Lightweight chapter-specific occupation tableau and chapter-end settlement props.
export function createChapterStaging(scene){
 const group=new THREE.Group();scene.add(group);
 const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.12});
 const white=mat(0xe2e4e1),dark=mat(0x19222b),armor=mat(0x58654f),skin=mat(0x94725c),gold=mat(0xf6cc78),red=mat(0x9c3244),orange=mat(0xe58a2e),yellow=mat(0xd9b54d),safety=mat(0xffbb45),cone=mat(0xff7a2e),black=mat(0x121518);
 const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(.5,7,5);
 let chapter=0,mode='chapter',settlementChapter=0,leaveTarget=0,leaveTimer=0;
 const movers=[];let settlementClock=0;const cleanupPiles=[];
 function clear(){group.clear();movers.length=0;cleanupPiles.length=0;settlementClock=0;}
 function box(parent,x,y,z,w,h,d,m){const mesh=new THREE.Mesh(cube,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;}
 function person(x,z,uniform=false,sign=false,worker=false){const g=new THREE.Group();g.position.set(x,0,z);group.add(g);movers.push({g,kind:'person'});
  box(g,0,1.12,0,.58,1.1,.36,worker?yellow:(uniform?dark:Math.random()<.5?red:armor));
  box(g,-.16,.32,0,.2,.66,.2,dark);box(g,.16,.32,0,.2,.66,.2,dark);
  const head=new THREE.Mesh(sphere,skin);head.position.y=1.94;head.scale.set(.32,.36,.3);g.add(head);
  if(sign){box(g,.47,2.5,0,.95,.57,.07,worker?safety:gold);box(g,.47,1.75,0,.06,1.4,.06,dark);}return g;}
 function wheels(g,positions,scale=.7){for(const [dx,dz] of positions){const w=new THREE.Mesh(sphere,black);w.scale.set(scale,scale,.35);w.position.set(dx,.4,dz);g.add(w);}}
 function vehicle(x,z,military=false,ice=false){const g=new THREE.Group();g.position.set(x,0,z);group.add(g);movers.push({g,kind:'vehicle'});
  const base=military?armor:(ice?black:white); box(g,0,1,0,military?7:5,1.8,2.8,base); box(g,-.5,2.1,0,2.4,.7,2.1,military?armor:dark);
  wheels(g,[[-2,-1.3],[-2,1.3],[2,-1.3],[2,1.3]]); if(military){box(g,1.6,2.3,0,3,.23,.25,dark);}else{box(g,0,2.55,0,.75,.22,.5,red);box(g,1.2,1.3,1.44,.5,.35,.08,dark);} return g;}
 function constructionTruck(x,z){const g=new THREE.Group();g.position.set(x,0,z);group.add(g);movers.push({g,kind:'construction'});
  box(g,0,1.05,0,6.2,1.9,2.9,orange); box(g,-1.55,2.02,0,2.2,.82,2.0,yellow); box(g,1.1,1.95,0,2.5,.95,2.2,orange); wheels(g,[[-2.2,-1.35],[-2.2,1.35],[2.05,-1.35],[2.05,1.35]],.74);
  box(g,-2.55,1.55,1.45,.28,.28,.08,safety); box(g,-2.55,1.55,-1.45,.28,.28,.08,red); return g;}
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
  for(const x of [-28,14])constructionTruck(x,-24); constructionTruck(52,-28);
  for(const x of [-58,-44,-30,-16,-2,12,26,40,54]) barrier(x,-18), coneProp(x-1.2,-20.8), coneProp(x+1.1,-20.2);
  for(let i=0;i<12;i++)person(-44+i*8,-15+(i%2)*3,false,i%3===0,true);
  for(let i=0;i<6;i++){const pile=box(group,-30+i*12,.7,-23,2.3,.8,3.3,black);cleanupPiles.push(pile);}
  let convoyIndex=0;
  for(const item of movers){
   if(item.kind==='construction'){
    item.targetX=item.g.position.x;
    item.arrivalDelay=convoyIndex*1.8;
    item.g.position.x-=46+convoyIndex*4;
    convoyIndex++;
   }
  }
 }
 function beginNextChapter(next){
  if(mode==='settlement'&&group.children.length){ leaveTarget=next; leaveTimer=5.2; mode='leaving'; }
  else buildChapterLayout(next);
 }
 function update(dt,elapsed){
  if(mode==='settlement'){
   settlementClock+=dt;
   // Work trucks drive in gradually, then the crew sweeps the rubble piles away.
   for(const item of movers)if(item.kind==='construction'&&settlementClock>=(item.arrivalDelay||0))item.g.position.x=THREE.MathUtils.damp(item.g.position.x,item.targetX,.72,dt);
   const cleared=THREE.MathUtils.smoothstep(settlementClock,4.2,12.3);
   for(const pile of cleanupPiles){pile.scale.y=Math.max(.08,.8*(1-cleared));pile.position.y=.18+pile.scale.y*.5;}
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
   leaveTimer-=dt; for(const item of movers){if(!item.g.parent)continue; if(item.kind==='construction'||item.kind==='vehicle')item.g.position.x+=dt*11.5; else if(item.kind==='person')item.g.position.x+=dt*5.2;}
   if(leaveTimer<=0){buildChapterLayout(leaveTarget||chapter||1);} 
  }
 }
 return {setChapter,setSettlement,beginNextChapter,update,group,get mode(){return mode;}};
}
