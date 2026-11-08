// Distant catastrophe atmosphere is a screen-space shader treatment, not a
// new light, draw call or collision effect. Damage remains a separate system.
export function disasterSkyIntensity(wave=1,skylineDamage=0){
 const chapter=Number.isFinite(wave)?Math.max(0,Math.min(1,(wave-1)/14)):0;
 const damage=Number.isFinite(skylineDamage)?Math.max(0,Math.min(1,skylineDamage)):0;
 return .12+chapter*.35+damage*.5;
}

// v4.2 cinematic sky and street surface treatment.
export function createCinematicSky(THREE,scene){
 const uniforms={phase:{value:0},darkness:{value:0},aspect:{value:1.78},time:{value:0},disaster:{value:.12}};
 const material=new THREE.ShaderMaterial({depthWrite:false,depthTest:false,uniforms,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.9999,1.0);}`,
 fragmentShader:`uniform float phase,darkness,aspect,time,disaster;varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){float night=darkness;float dusk=exp(-pow((phase-.34)*12.,2.))+exp(-pow((phase-.84)*12.,2.));
 vec3 horizon=mix(vec3(.81,.86,.90),vec3(.14,.17,.26),night),zenith=mix(vec3(.26,.49,.73),vec3(.012,.022,.065),night);
 horizon=mix(horizon,vec3(.93,.52,.33),dusk*.72);zenith=mix(zenith,vec3(.20,.19,.33),dusk*.58);
 vec3 col=mix(horizon,zenith,pow(vUv.y,.72));
 vec2 uv=vUv*vec2(aspect,1.);
 vec2 cloudUV=uv*vec2(3.2,6.5)+vec2(time*.0015,0.);
 float cloud=0.,weight=.5;
 for(int octave=0;octave<5;octave++){cloud+=noise(cloudUV)*weight;cloudUV=cloudUV*2.03+vec2(17.1,9.2);weight*=.5;}
 float sheet=smoothstep(.43,.71,cloud)*smoothstep(.12,.52,vUv.y);
 float rim=smoothstep(.48,.58,cloud)*(1.-smoothstep(.58,.72,cloud));
 vec3 cloudColor=mix(vec3(.82,.85,.88),vec3(.09,.12,.19),night);
 cloudColor=mix(cloudColor,vec3(.98,.65,.43),dusk*rim*.42);
 col=mix(col,cloudColor,sheet*(.38+.25*dusk));
 vec2 moonUV=(vUv-vec2(.82,.86))*vec2(aspect,1.);float md=length(moonUV);float disc=1.-smoothstep(.025,.026,md);
 float craters=noise(moonUV*580.)*.14+noise(moonUV*230.)*.12;
 col+=vec3(.42,.49,.68)*exp(-md*55.)*night*.3;
 col=mix(col,vec3(.89,.90,.83)-craters,disc*night);
 vec2 grid=uv*340.,cell=floor(grid),st=fract(grid)-.5;float chance=hash(cell);
 float star=(1.-smoothstep(.025,.20,length(st)))*step(.991,chance)*( .5+.5*hash(cell+5.));
 col+=mix(vec3(.7,.80,1.),vec3(1.,.85,.64),hash(cell+17.))*star*night*smoothstep(.25,.65,vUv.y)*(1.-sheet*.8);
 float sun=exp(-length((vUv-vec2(.25,.66))*vec2(aspect,1.))*32.);col+=vec3(.9,.55,.22)*sun*(1.-night)*(.3+dusk);
 // Two distant skyline impact glows, softened by haze and low enough to
 // remain behind architecture; no extra lights, sprites or draw calls.
 float impactWest=exp(-pow((vUv.x-.31)*9.5,2.)-pow((vUv.y-.16)*15.,2.));
 float impactEast=exp(-pow((vUv.x-.68)*6.8,2.)-pow((vUv.y-.23)*11.,2.));
 float emberPulse=.80+.12*sin(time*.95)+.08*sin(time*1.73+2.);
 float distantFire=disaster*(impactWest*.30+impactEast*.48)*emberPulse*(.62+.38*night);
 col+=vec3(.90,.24,.08)*distantFire;
 gl_FragColor=vec4(col,1.);}`});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);plane.frustumCulled=false;plane.renderOrder=-1000;scene.add(plane);
 return {mesh:plane,setPhase(p,d=0,dt=0,disasterLevel=.12){uniforms.phase.value=p;uniforms.darkness.value=d;uniforms.disaster.value=Math.max(0,Math.min(1,disasterLevel));uniforms.aspect.value=globalThis.innerWidth/Math.max(1,globalThis.innerHeight);uniforms.time.value+=dt}};
}

function pavementMaterial(THREE,color,kind){
 const mat=new THREE.MeshStandardMaterial({color,roughness:kind==='road'?.95:.89,metalness:0});
 mat.onBeforeCompile=(shader)=>{
  shader.vertexShader='varying vec3 vRoadPos;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
 vec4 roadLocal=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
 roadLocal=instanceMatrix*roadLocal;
 #endif
 vRoadPos=(modelMatrix*roadLocal).xyz;`);
  shader.fragmentShader='varying vec3 vRoadPos;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=fract(sin(dot(floor(vRoadPos.xz*20.),vec2(12.9898,78.233)))*43758.5453);
 float grain2=fract(sin(dot(floor(vRoadPos.xz*4.2),vec2(54.1,21.7)))*21457.1);
 diffuseColor.rgb*=mix(.82,1.12,grain)*mix(.88,1.10,grain2);
 ${kind==='road'?
 `float patch=step(.94,fract(vRoadPos.x*.17+floor(vRoadPos.z*.22)*.07)); diffuseColor.rgb*=1.-patch*.14;
  float oil=step(.985,fract(sin(dot(floor(vRoadPos.xz*1.3),vec2(2.3,7.1)))*418.2)); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.17,.18),oil*.10);`:
 `float joint=max(step(fract(vRoadPos.x*.58),.012),step(fract(vRoadPos.z*.55),.012)); diffuseColor.rgb*=1.-joint*.20;`}
 `);
 };
 mat.customProgramCacheKey=()=>`dragon-pavement-${kind}-v42`;
 return mat;
}
export function addStreetSurfaceDetail(THREE,root){
 const road=pavementMaterial(THREE,0x35383f,'road');
 const walk=pavementMaterial(THREE,0xb8b1a6,'walk');
 let roads=0,walks=0;
 root.traverse(o=>{if(!o.isMesh||!o.material||!o.geometry?.isBoxGeometry||!o.position)return;
 if(o.position.y<-.28&&o.position.y>-.58&&o.scale.y<.30){
  if(o.material.color?.getHex()===0x34373b && o.scale.x>9){o.material=road;roads++;}
  else if(o.material.color?.getHex()===0xa9a8a0&&o.scale.x>3){o.material=walk;walks++;}
 }
 });
 return {roads,walks};
}
