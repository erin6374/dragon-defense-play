// Bounded, shared structural-fragment pool. Local coordinates relative to
// the Park13 layer root; fixed-step simulation, no per-piece scene objects.
export function createPark13Fragments(T,capacity=256){
 const geometry=new T.BoxGeometry(1,1,1);
 const material=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
 const mesh=new T.InstancedMesh(geometry,material,capacity);
 mesh.name='Park13 pooled structural fragments';mesh.count=0;mesh.visible=false;
 // Pooled moving instances cannot safely use a stale static bound.
 mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
 const slots=Array.from({length:capacity},()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,rx:0,ry:0,rz:0,spin:0,s:0,age:0,life:0,color:0}));
 const dummy=new T.Object3D(),tint=new T.Color();
 let count=0,serial=0,spawned=0,evicted=0;
 function hash(n){n=Math.imul(n^n>>>16,0x45d9f3b);n=Math.imul(n^n>>>16,0x45d9f3b);return ((n^n>>>16)>>>0)/4294967296;}
 function sync(){
  for(let i=0;i<count;i++){
   const p=slots[i];dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx,p.ry,p.rz);
   dummy.scale.set(p.s,p.s*.58,p.s*.78);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   tint.setHex(p.color);mesh.setColorAt(i,tint);
  }
  mesh.count=count;mesh.visible=count>0;
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 }
 function spawn(x,y,z,budget,color=0x95745c){
  if(![x,y,z,budget].every(Number.isFinite)||budget<=0)return 0;
  const n=Math.min(24,Math.max(4,Math.ceil(budget*110)));
  for(let i=0;i<n;i++){
   const key=++serial,rand=j=>hash(key*19+j),angle=rand(1)*Math.PI*2,speed=1.2+rand(2)*3.4;
   let p;if(count<capacity)p=slots[count++];else{
    // Replace the oldest normalized lifetime, retaining a hard memory bound.
    let oldest=0;for(let j=1;j<count;j++)if(slots[j].age/slots[j].life>slots[oldest].age/slots[oldest].life)oldest=j;
    p=slots[oldest];evicted++;
   }
   Object.assign(p,{x:x+(rand(3)-.5)*.7,y:Math.max(.3,y)+(rand(4)-.5)*.3,z:z+(rand(5)-.5)*.7,
    vx:Math.cos(angle)*speed,vy:1.0+rand(6)*3.0,vz:Math.sin(angle)*speed,
    rx:rand(7)*6,ry:rand(8)*6,rz:rand(9)*6,spin:2+rand(10)*4,
    s:.18+rand(11)*.55,age:0,life:3.2+rand(12)*2.0,color});
   spawned++;
  }
  sync();return n;
 }
 function update(dt){
  if(!count||!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(.1,dt);
  for(let i=count-1;i>=0;i--){
   const p=slots[i];p.age+=dt;
   if(p.age>=p.life){const last=--count;slots[i]=slots[last];slots[last]=p;continue;}
   p.vy-=9.81*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
   p.rx+=p.spin*dt;p.rz+=p.spin*.7*dt;
   const ground=p.s*.38;
   if(p.y<=ground){p.y=ground;p.vy=Math.abs(p.vy)*.22;p.vx*=.66;p.vz*=.66;p.spin*=.5;
    if(p.vy<.5)p.vy=0;}
  }
  sync();
 }
 function clear(){count=0;mesh.count=0;mesh.visible=false;serial=0;spawned=0;evicted=0;}
 return {mesh,spawn,update,clear,stats:()=>({active:count,capacity,spawned,evicted,drawObjects:count?1:0})};
}
