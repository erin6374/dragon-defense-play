import * as THREE from 'three';
import {prepareFlipbookMaterial,flipbookStatus} from './flipbook-bridge.js';

// Fixed-capacity, texture-free combustion. Only source transforms are uploaded;
// advection, lifetime, curl, expansion and extinction run on the GPU.
const noise = `
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .57*noise3(p)+.28*noise3(p*2.07)+.15*noise3(p*4.13);}
`;
const vertex = `
attribute vec3 source;
attribute vec4 settings;
attribute float particle;
attribute float surface;
uniform float clock;
varying vec2 vUv;
varying float vSeed,vAge,vPower;
void main(){
 vUv=uv;vSeed=settings.z+particle*7.13;vPower=settings.w;
 if(vPower<=0.){vAge=0.;gl_Position=vec4(2.,2.,2.,1.);return;}
 float w=settings.x,h=settings.y;
 vec3 p=position;
 vec3 center=source;
 vAge=fract(clock*(.16+fract(vSeed*.13)*.055)+particle*.1618+fract(vSeed));
 #if KIND == 0
 // Crossed sheets remain rooted in the opening, not camera-facing sprites.
 float angle=particle*1.0472;
 // Source stays fixed while individual sheets flex and rise differently.
 float axial=clamp(p.y+.5,0.,1.);
 float phase=clock*(1.12+.45*fract(vSeed*.61))+vSeed*1.27;
 float bend=pow(axial,1.45)*(.22*sin(phase+axial*3.3)+
  .11*sin(phase*.73+axial*6.4+vSeed));
 float breadth=(1.24+.35*fract(vSeed*.23))*(1.-axial*.12);
 float height=.84+.34*fract(vSeed*.39);
 p=vec3((p.x*breadth+bend)*w*cos(angle),axial*h*height,
  (p.x*breadth+bend)*w*sin(angle));
 center.z+=w*.17;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(center+p,1.);
 #elif KIND == 1
 // Six overlapping anchored smoke sheets form a continuous rising column.
 // Upward-moving density and independently swaying sheets replace resetting puffs.
 float layer=fract(particle*.6180339+fract(vSeed*.271));
 float sway=.16*sin(clock*.21+vSeed+layer*2.3)+.09*sin(clock*.13+vSeed*1.7);
 center+=vec3((sway+layer*.10)*w,h*(.90+.12*layer),w*(.22+.11*layer));
 vec4 eye=modelViewMatrix*vec4(center,1.);
 float scale=w*(1.02+.16*layer);
 float stretch=2.65+.42*layer;
 eye.xy+=vec2(p.x+p.y*.12*sin(clock*.27+vSeed),p.y*stretch)*scale*length(modelMatrix[0].xyz);
 gl_Position=projectionMatrix*eye;
 #elif KIND == 2
 // Embers retain their original buoyant particle trajectories.
 float life=vAge;
 float rise=life*(1.+life*.16);
 center+=vec3((sin(clock*.38+vSeed)*.13+sin(life*6.+vSeed)*.12+
  rise*.38)*w,h*.25+rise*h*2.25,w*(.24+sin(life*4.+vSeed)*.14));
 center.y+=life*h*1.8;
 vec4 eye=modelViewMatrix*vec4(center,1.);
 eye.xy+=p.xy*w*.045*length(modelMatrix[0].xyz);
 gl_Position=projectionMatrix*eye;
 #else
 p.xy*=vec2(w*2.6,h*1.9);p.z=0.;
 if(surface>.5){p=vec3(p.x,0.,p.y);center.y+=.025;}else{center.y+=h*.25;}
 gl_Position=projectionMatrix*modelViewMatrix*vec4(center+p,1.);
 #endif
 if(vPower<=0.)gl_Position=vec4(2.,2.,2.,1.);
}`;
const fragment = `
uniform float clock;
varying vec2 vUv;
varying float vSeed,vAge,vPower;
${noise}
void main(){
 vec2 q=vUv;vec3 color;float alpha;
 #if KIND == 0
 float t=clock*(1.24+fract(vSeed*.71)*.57);
 float n=fbm(vec3(q*vec2(4.1,6.2)+vec2(vSeed*.43,-t*1.7),t*.31));
 float fine=fbm(vec3(q*vec2(9.3,11.7)+vec2(-t*.37,vSeed),t*.53));
 float y=clamp(q.y,0.,1.);
 float x=(q.x-.5)*2.+y*(.15*sin(y*7.+t+vSeed)+
  .13*sin(y*13.-t*.7+vSeed*1.4));
 // Hot broad shoulders and independently breaking asymmetric flame tips.
 float edge=(1.00-.47*pow(y,1.14))*(.80+.48*n)+
  .13*sin(y*14.+t*1.1+vSeed)+.09*sin(y*23.-t*.63+vSeed*1.7);
 float body=1.-smoothstep(max(.03,edge*.66),max(.14,edge+.14),abs(x));
 float breakup=smoothstep(.17,.63,fine+.27*(1.-y)+.10*n);
 float tip=1.-smoothstep(.70,.99,y+.12*(.5-fine)+.08*fract(vSeed*.29));
 alpha=body*breakup*tip*smoothstep(0.,.065,y)*(.74+.16*sin(t*2.1+vSeed))*vPower;
 float heat=clamp((1.-y)*.88+(n-.5)*.48-abs(x)*.38,0.,1.);
 color=mix(vec3(.67,.042,.006),vec3(1.,.32,.018),smoothstep(.09,.52,heat));
 color=mix(color,vec3(1.,.89,.48),smoothstep(.56,.94,heat));
 #elif KIND == 1
 vec2 xy=(q-.5)*2.;
 float height=clamp((xy.y+1.)*.5,0.,1.);
 float curl=fbm(vec3(xy*vec2(3.2,3.5)+vec2(vSeed,-clock*.21),clock*.13));
 // Continuously advect density upward; avoid spherical masks and age-wrap pops.
 float displaced=xy.x+.19*sin(xy.y*3.3+clock*.24+vSeed)+.18*(curl-.5);
 float width=.72+.25*height+.13*(curl-.5);
 float lateral=1.-smoothstep(.46,1.14,abs(displaced)/max(.25,width));
 float envelope=lateral*smoothstep(-1.05,-.72,xy.y)*
  (1.-smoothstep(.56,1.08,xy.y));
 float density=0.,shade=0.;
 for(int j=0;j<6;j++){
  float z=(float(j)-2.5)/2.5;
  vec3 p=vec3(displaced*2.6,xy.y*2.8,z*2.1)+
   vec3(vSeed*.32,-clock*.29,clock*.10);
  float n=fbm(p),detail=fbm(p*1.83+vec3(0.,clock*.07,vSeed));
  float d=smoothstep(.22,.69,n+.22*detail)*envelope*(.62+.38*(1.-abs(z)));
  density+=d;shade+=d*(.52+.34*z);
 }
 alpha=(1.-exp(-density*.66))*.24*vPower*envelope;
 color=mix(vec3(.28,.30,.32),vec3(.70,.72,.73),
  clamp(.40+shade*.17+height*.14,0.,1.));
 color+=vec3(.13,.048,.012)*exp(-height*8.)*(1.-min(1.,abs(displaced)));
 #elif KIND == 2
 float d=length((q-.5)*2.);alpha=(1.-smoothstep(.2,1.,d))*sin(vAge*3.14159)*vPower;
 color=mix(vec3(1.,.63,.13),vec3(.8,.12,.005),vAge);
 #else
 vec2 p=(q-.5)*2.;
 float soot=exp(-dot(p*vec2(1.4,.9),p*vec2(1.4,.9))*3.);
 float opening=(1.-smoothstep(.32,.39,abs(p.x)))*(1.-smoothstep(.34,.41,abs(p.y+.25)));
 float glow=exp(-dot(p,p)*4.)*(.76+.16*sin(clock*7.+vSeed)+.08*sin(clock*13.+vSeed));
 color=mix(vec3(.045,.033,.025),vec3(.92,.21,.025),glow*.68);
 color=mix(color,vec3(.025,.013,.008),opening*.85);
 alpha=max(soot*.62,opening*.96)*min(1.,vPower);
 #endif
 if(alpha<.005)discard;
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function createBuildingCombustion(parent,capacity,name='building-combustion'){
 const group=new THREE.Group();group.name=name;parent.add(group);
 const uniforms={clock:{value:0}};
 let activeCount=0,lastActive=-1;group.visible=false;
 // Source GPU attributes only need new data when a contact actually changes.
 // Shader time still advects stationary smoke and flame every render frame.
 let sourceBufferWrites=0,unchangedSetSkips=0,unchangedActiveSkips=0;
 const counts=[3,6,5,1];
 const sources=Array.from({length:capacity},()=>({active:false,x:0,y:0,z:0,w:0,h:0,seed:0,power:0,lod:0,surface:0}));
 const batches=counts.map((count,kind)=>{
  const plane=new THREE.PlaneGeometry(1,1);
  const geometry=new THREE.InstancedBufferGeometry();geometry.index=plane.index;
  geometry.attributes.position=plane.attributes.position;geometry.attributes.uv=plane.attributes.uv;
  geometry.instanceCount=0;
  geometry.setAttribute('source',new THREE.InstancedBufferAttribute(new Float32Array(capacity*count*3),3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('settings',new THREE.InstancedBufferAttribute(new Float32Array(capacity*count*4),4).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('surface',new THREE.InstancedBufferAttribute(new Float32Array(capacity*count),1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('particle',new THREE.InstancedBufferAttribute(Float32Array.from({length:capacity*count},(_,i)=>i%count),1));
  const material=new THREE.ShaderMaterial({uniforms,defines:{KIND:kind},vertexShader:vertex,fragmentShader:fragment,
   transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
   blending:kind===2?THREE.AdditiveBlending:THREE.NormalBlending});
   prepareFlipbookMaterial(material,kind);
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
  mesh.name=name+'-'+['flames','smoke','embers','openings'][kind];mesh.renderOrder=kind===3?0:kind===0?2:1;
  group.add(mesh);return {mesh,count,geometry};
 });
 function set(index,x,y,z,w,h,seed,power=1,lod=0,surface=0){
  if(index<0||index>=capacity)throw new RangeError('Combustion pool index');
  const s=sources[index];const wasActive=s.active;
  const nextActive=power>0;
  // Exact comparisons retain all moving rubble, fire spread and LOD changes.
  // Skip redundant CPU writes and WebGL attribute dirty-version bumps.
  if(wasActive===nextActive&&s.x===x&&s.y===y&&s.z===z&&
   s.w===w&&s.h===h&&s.seed===seed&&s.power===power&&
   s.lod===lod&&s.surface===surface){
   unchangedSetSkips++;
   if(nextActive)unchangedActiveSkips++;
   return;
  }
  sourceBufferWrites++;
  if(wasActive!==nextActive)activeCount+=nextActive?1:-1;
  s.active=power>0;s.x=x;s.y=y;s.z=z;s.w=w;s.h=h;s.seed=seed;s.power=power;s.lod=lod;s.surface=surface;
  if(s.active)lastActive=Math.max(lastActive,index);
  else if(index===lastActive)while(lastActive>=0&&!sources[lastActive].active)lastActive--;
  group.visible=activeCount>0;
  batches.forEach(({geometry,count},kind)=>{
   geometry.instanceCount=(lastActive+1)*count;
   const a=geometry.attributes.source,b=geometry.attributes.settings;
   const budget=kind===1?Math.max(2,6-lod):kind===2?Math.max(1,5-lod):kind===0?(lod>=4?2:3):1;
   for(let k=0;k<count;k++){const i=index*count+k;a.setXYZ(i,x,y,z);b.setXYZW(i,w,h,seed,k<budget?power:0);geometry.attributes.surface.setX(i,surface);}
   a.needsUpdate=b.needsUpdate=geometry.attributes.surface.needsUpdate=true;
  });
 }
 function clear(index){set(index,0,0,0,0,0,0,0);}
 return {group,sources,set,clear,update(time){uniforms.clock.value=time;},
  reset(){for(let i=0;i<capacity;i++)clear(i);uniforms.clock.value=0;
   sourceBufferWrites=unchangedSetSkips=unchangedActiveSkips=0;},
  stats(){return {capacity,active:sources.filter(s=>s.active).length,drawCalls:4,
   flameCapacity:capacity*3,smokeCapacity:capacity*6,emberCapacity:capacity*5,
    textures:flipbookStatus().textures,renderer:flipbookStatus().mode,clock:uniforms.clock.value,
    sourceBufferWrites,unchangedSetSkips,unchangedActiveSkips};}};
}
