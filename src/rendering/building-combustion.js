import * as THREE from 'three';

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
 float w=settings.x,h=settings.y;
 vec3 p=position;
 vec3 center=source;
 vAge=fract(clock*(.16+fract(vSeed*.13)*.055)+particle*.1618+fract(vSeed));
 #if KIND == 0
 // Crossed sheets remain rooted in the opening, not camera-facing sprites.
 float angle=particle*1.0472;
 float bend=sin(clock*2.3+vSeed+p.y*4.)*.13*p.y*p.y;
 p=vec3((p.x+bend)*w*cos(angle), (p.y+.5)*h, (p.x+bend)*w*sin(angle));
 center.z+=w*.17;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(center+p,1.);
 #elif KIND == 1 || KIND == 2
 float life=vAge;
 float rise=life*life*.4+life;
 center+=vec3((sin(life*7.+vSeed)*.24+rise*.36)*w,h*.55+rise*h*2.8,w*(.3+sin(life*5.+vSeed)*.22));
 vec4 eye=modelViewMatrix*vec4(center,1.);
 float scale=(.75+life*1.8)*w;
 #if KIND == 2
 scale=w*.045; center.y+=life*h*1.8;eye=modelViewMatrix*vec4(center,1.);
 #endif
 // Use world opening width isotropically: the skyline has a nonuniform
 // parent scale, which must not flatten smoke volumes into horizontal discs.
 eye.xy+=p.xy*scale*length(modelMatrix[0].xyz);
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
 float t=clock*(1.7+fract(vSeed)*.6);
 float n=fbm(vec3(q*vec2(5.,7.)+vec2(vSeed,-t*2.),t*.35));
 float x=(q.x-.5)*2.+(n-.5)*.62*q.y+sin(q.y*9.-t+vSeed)*.13*q.y;
 float edge=(1.-q.y)*(.78+.32*n);
 float body=1.-smoothstep(edge*.45,edge+.025,abs(x));
 float breakup=smoothstep(.26,.64,n+(1.-q.y)*.42);
 alpha=body*breakup*(1.-smoothstep(.68,1.,q.y))*smoothstep(0.,.045,q.y)*.72*vPower;
 float heat=clamp((1.-q.y)*.85+(n-.5)*.5-abs(x)*.4,0.,1.);
 color=mix(vec3(.75,.055,.006),vec3(1.,.38,.025),smoothstep(.1,.5,heat));
 color=mix(color,vec3(1.,.87,.46),smoothstep(.55,.93,heat));
 #elif KIND == 1
 vec2 xy=(q-.5)*2.;float r2=dot(xy,xy);if(r2>1.)discard;
 // Integrate a noisy sphere: optical depth gives rounded, self-shadowed puffs.
 float depth=sqrt(max(0.,1.-r2)),density=0.,shade=0.;
 for(int j=0;j<6;j++){
  float z=mix(-depth,depth,(float(j)+.5)/6.);
  vec3 p=vec3(xy,z)*2.7+vec3(vSeed,clock*.11,-clock*.21);
  float d=smoothstep(.30,.72,fbm(p))*(1.-r2-z*z);
  density+=d;shade+=d*(.55+.45*z);
 }
 float life=smoothstep(0.,.12,vAge)*(1.-smoothstep(.55,1.,vAge));
 alpha=(1.-exp(-density*.7))*life*.58*vPower;
 color=mix(vec3(.16,.17,.18),vec3(.57,.59,.60),clamp(.42+shade*.45+xy.y*.18,0.,1.));
 color+=vec3(.27,.09,.018)*exp(-vAge*8.)*(1.-r2);
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
 const counts=[3,6,5,1];
 const sources=Array.from({length:capacity},()=>({active:false,x:0,y:0,z:0,w:0,h:0,seed:0,power:0,lod:0}));
 const batches=counts.map((count,kind)=>{
  const plane=new THREE.PlaneGeometry(1,1);
  const geometry=new THREE.InstancedBufferGeometry();geometry.index=plane.index;
  geometry.attributes.position=plane.attributes.position;geometry.attributes.uv=plane.attributes.uv;
  geometry.instanceCount=capacity*count;
  geometry.setAttribute('source',new THREE.InstancedBufferAttribute(new Float32Array(capacity*count*3),3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('settings',new THREE.InstancedBufferAttribute(new Float32Array(capacity*count*4),4).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('surface',new THREE.InstancedBufferAttribute(new Float32Array(capacity*count),1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('particle',new THREE.InstancedBufferAttribute(Float32Array.from({length:capacity*count},(_,i)=>i%count),1));
  const material=new THREE.ShaderMaterial({uniforms,defines:{KIND:kind},vertexShader:vertex,fragmentShader:fragment,
   transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
   blending:kind===2?THREE.AdditiveBlending:THREE.NormalBlending});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
  mesh.name=name+'-'+['flames','smoke','embers','openings'][kind];mesh.renderOrder=kind===3?0:kind===0?2:1;
  group.add(mesh);return {mesh,count,geometry};
 });
 function set(index,x,y,z,w,h,seed,power=1,lod=0,surface=0){
  if(index<0||index>=capacity)throw new RangeError('Combustion pool index');
  const s=sources[index];s.active=power>0;s.x=x;s.y=y;s.z=z;s.w=w;s.h=h;s.seed=seed;s.power=power;s.lod=lod;s.surface=surface;
  batches.forEach(({geometry,count},kind)=>{
   const a=geometry.attributes.source,b=geometry.attributes.settings;
   const budget=kind===1?Math.max(2,6-lod):kind===2?Math.max(1,5-lod):kind===0?(lod>=4?2:3):1;
   for(let k=0;k<count;k++){const i=index*count+k;a.setXYZ(i,x,y,z);b.setXYZW(i,w,h,seed,k<budget?power:0);geometry.attributes.surface.setX(i,surface);}
   a.needsUpdate=b.needsUpdate=geometry.attributes.surface.needsUpdate=true;
  });
 }
 function clear(index){set(index,0,0,0,0,0,0,0);}
 return {group,sources,set,clear,update(time){uniforms.clock.value=time;},
  reset(){for(let i=0;i<capacity;i++)clear(i);uniforms.clock.value=0;},
  stats(){return {capacity,active:sources.filter(s=>s.active).length,drawCalls:4,
   flameCapacity:capacity*3,smokeCapacity:capacity*6,emberCapacity:capacity*5,textures:0,clock:uniforms.clock.value};}};
}
