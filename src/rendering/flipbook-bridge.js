// Non-destructive A/B bridge for the established building-combustion pools.
// Two CC0 Houdini-simulated atlases shared by ALL building fires, no per-hit allocations.
import * as THREE from 'three';
import {PACKAGED_FLIPBOOKS,FLAME_ATLAS,SMOKE_ATLAS} from './flipbook-config.js';
const registry=new Set();
const state={started:false,ready:false,fire:null,smoke:null,error:null};
let mode='flipbook';
// Licensed CC0 smoke plume and RC17 smoke share the existing GPU sheets.
let smokeMode='rooted';
try{const params=new URLSearchParams(location.search);
 if(params.get('firevfx')==='procedural')mode='procedural';
 if(['legacy','plume'].includes(params.get('smokevfx')))smokeMode=params.get('smokevfx');
}catch{}
function apply(){
 for(const u of registry){
  u.useFlipbook.value=state.ready&&mode==='flipbook'?1:0;
  if(u.plumeMode)u.plumeMode.value=smokeMode!=='legacy'?1:0;
  if(u.rootMode)u.rootMode.value=smokeMode==='rooted'?1:0;
  if(state.ready){u.flameAtlas.value=state.fire;u.smokeAtlas.value=state.smoke;}
 }
}
function start(){
 if(!PACKAGED_FLIPBOOKS||state.started||typeof document==='undefined')return;
 state.started=true;
 const loader=new THREE.TextureLoader();
 const load=url=>new Promise((resolve,reject)=>loader.load(url,t=>{
  t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=false;
  t.minFilter=t.magFilter=THREE.LinearFilter;
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  resolve(t);
 },undefined,reject));
 Promise.all([load(FLAME_ATLAS),load(SMOKE_ATLAS)]).then(([fire,smoke])=>{
  state.fire=fire;state.smoke=smoke;state.ready=true;apply();
 }).catch(e=>{state.error=String(e);console.error('[Building VFX] CC0 textures did not load',e);});
}
if(typeof window!=='undefined')window.__DD_FIRE_VFX={
 get packaged(){return PACKAGED_FLIPBOOKS;},get ready(){return state.ready;},
 get mode(){return state.ready?mode:'procedural';},get smokeMode(){return smokeMode;},get error(){return state.error;},
 setMode(next){if(next!=='procedural'&&next!=='flipbook')throw Error('Invalid fire mode');
 mode=next;apply();return this.mode;},
 setSmokeMode(next){if(!['legacy','plume','rooted'].includes(next))throw Error('Invalid smoke mode');
 smokeMode=next;apply();return this.smokeMode;}
};
const helper=`
uniform sampler2D flameAtlas;
uniform sampler2D smokeAtlas;
uniform float useFlipbook;
vec4 readTile(sampler2D atlas,vec2 uv,float i){
 float col=mod(i,8.),row=floor(i/8.);
 return texture2D(atlas,(vec2(col,7.-row)+clamp(uv,vec2(.014),vec2(.986)))/8.);
}
vec4 flipbook(sampler2D atlas,vec2 uv,float time){
 float frame=mod(time,64.),i=floor(frame);
 return mix(readTile(atlas,uv,i),readTile(atlas,uv,mod(i+1.,64.)),fract(frame));
}
`;
export function prepareFlipbookMaterial(material,kind){
 if(kind===2)return;
 const u=material.uniforms;
 if(!u.useFlipbook){u.useFlipbook={value:0};u.flameAtlas={value:null};u.smokeAtlas={value:null};registry.add(u);}
 if(kind===1){
  if(!u.plumeMode)u.plumeMode={value:smokeMode!=='legacy'?1:0};
  if(!u.rootMode)u.rootMode={value:smokeMode==='rooted'?1:0};
 }
 if(kind===3){
  const marker='color=mix(color,vec3(.025,.013,.008),opening*.85);';
  if(!material.fragmentShader.includes(marker))throw Error('Opening shader changed; review flipbook contact glow');
  material.fragmentShader='uniform float useFlipbook;\n'+material.fragmentShader.replace(marker,
    marker+' if(useFlipbook>.5)color+=vec3(.28,.082,.009)*glow*min(1.,vPower);');
  return;
 }
 // Adjust only the licensed atlas presentation, preserving the original procedural A/B.
 // Three crossed flame cards and six smoke sheets remain preallocated per opening.
 const oldVertex=material.vertexShader;
 const vertexChanges=[
  ['float breadth=(1.24+.35*fract(vSeed*.23))*(1.-axial*.12);',
   'float breadth=(1.24+.35*fract(vSeed*.23))*(1.-axial*.12)*(useFlipbook>.5?1.15:1.);'],
  ['float height=.84+.34*fract(vSeed*.39);',
   'float height=(.84+.34*fract(vSeed*.39))*(useFlipbook>.5?1.95:1.);'],
  ['center+=vec3((sway+layer*.10)*w,h*(.90+.12*layer),w*(.22+.11*layer));',
   `if(useFlipbook>.5){
    // Independent age-dependent crosswind lanes advect the licensed
    // WispySmoke packets, without hit-time geometry or new particles.
    float lane=(fract(vSeed*.617)-.5)*2.;
    if(plumeMode>.5){
     // CC0 atlas packets form one wind-sheared, taller plume instead of
     // six short isolated wisps. Each packet retains independent age/phase.
     float gust=.82+.20*sin(clock*.31+layer*.55)+.11*sin(clock*.73+vSeed);
     // RC28: phase-separated counter-rotating eddies on existing CC0 sheets.
     float turbulentEddy=sin(vAge*12.4+clock*(.24+.09*fract(vSeed*.73))+vSeed*1.7)*
      cos(vAge*5.3-clock*.17+vSeed*.9);
     float curl=(.36+.62*vAge)*turbulentEddy*vAge;
     float crosswind=-gust*pow(vAge,1.34)*3.8;
     float dispersion=lane*pow(vAge,1.13)*2.15;
     center+=vec3((sway+crosswind+dispersion+curl)*w,
       h*(.12+vAge*8.9),w*(.32+.16*layer+.23*vAge*sin(vSeed)));
    }else{
     float drift=lane*pow(vAge,1.35)*(2.0+.8*fract(vSeed*.91));
     center+=vec3((sway+drift)*w,
       h*(.32+vAge*4.4),w*(.38+.1*layer));
    }
   }else{center+=vec3((sway+layer*.10)*w,h*(.90+.12*layer),w*(.22+.11*layer));}`],
  ['float scale=w*(1.02+.16*layer);',
   'float scale=w*(1.02+.16*layer)*(useFlipbook>.5?(plumeMode>.5?(.82+3.9*vAge):(.82+2.95*vAge)):1.);'],
  ['float stretch=2.65+.42*layer;',
   'float stretch=useFlipbook>.5?(plumeMode>.5?1.60:1.35):2.65+.42*layer;']
 ];
 let revised=oldVertex.replace('uniform float clock;','uniform float clock;\nuniform float useFlipbook;'+(kind===1?'\nuniform float plumeMode;\nuniform float rootMode;':''));
 // Two of six preallocated smoke sheets remain near the burning window;
 // the others rise as before. A stable lower stem eliminates detached puffs.
 if(kind===1){
  const anchor='vAge=fract(clock*(.16+fract(vSeed*.13)*.055)+particle*.1618+fract(vSeed));';
  if(!revised.includes(anchor))throw Error('Combustion particle age shader changed');
  revised=revised.replace(anchor,anchor+`\n if(useFlipbook>.5&&rootMode>.5&&particle<1.5){\n  vAge=.13+particle*.16+.022*sin(clock*1.17+vSeed);\n }`);
 }
 for(const [before,after] of vertexChanges){
  if(!revised.includes(before))throw Error('Combustion vertex changed; review bridge scale: '+before);
  revised=revised.replace(before,after);
 }
 if(kind===0){
  // RC24: three independent licensed flame tongues occupy different parts
  // of each broken window. Pivot near the same opening, then grow/flex at
  // different heights; never create particles, meshes, textures or draw calls.
  const anchor='center.z+=w*.17;';
  if(!revised.includes(anchor))throw Error('Missing flame root anchor');
  revised=revised.replace(anchor,`if(useFlipbook>.5){
   float tongueLane=particle-1.;
   // RC29: per-contact shear and staggered heights reduce repeated torches.
   float siteBias=fract(vSeed*.173)-.5;
   float tongueGust=.09*sin(clock*(.84+.34*fract(vSeed*.091))+vSeed*.53);
   center.x+=w*(tongueLane*(.20+.19*fract(vSeed*.117))+
    siteBias*.22+tongueGust);
   center.y+=h*(.025+.065*fract(vSeed*.221+particle*.67));
   p.y*=.82+.38*fract(vSeed*.211+particle*.19);
   p.x+=w*tongueLane*.07*axial;
   p.z+=w*tongueLane*.045;
  }
  `+anchor);
 }
 if(kind===1){
  // RC24: retain two source-fed vertical smoke stems, while four original
  // licensed packets travel upward. Stem cards start at the actual window,
  // taper outward and overlap the buoyant sheets without a new GPU batch.
  revised=revised.replace('varying float vSeed,vAge,vPower;',
   'varying float vSeed,vAge,vPower;\nvarying float vStem;');
  const root='vUv=uv;vSeed=settings.z+particle*7.13;vPower=settings.w;';
  if(!revised.includes(root))throw Error('Missing smoke varying anchor');
  revised=revised.replace(root,root+'\n vStem=(useFlipbook>.5&&rootMode>.5&&particle<1.5)?1.:0.;');
  const eye='vec4 eye=modelViewMatrix*vec4(center,1.);';
  if(!revised.includes(eye))throw Error('Missing smoke eye anchor');
  revised=revised.replace(eye,`if(vStem>.5){
   center=source+vec3((.09*sin(clock*.36+vSeed)+.05*(particle-.5))*w,
    h*(1.12+.12*particle),w*(.26+.04*particle));
  }
  `+eye);
  const scale='float scale=w*(1.02+.16*layer)*(useFlipbook>.5?(plumeMode>.5?(.82+3.9*vAge):(.82+2.95*vAge)):1.);';
  const stretch='float stretch=useFlipbook>.5?(plumeMode>.5?1.60:1.35):2.65+.42*layer;';
  if(!revised.includes(scale)||!revised.includes(stretch))throw Error('Missing smoke card size anchors');
  revised=revised.replace(scale,scale+'\n if(vStem>.5)scale=w*(1.08+.15*particle);');
  revised=revised.replace(stretch,stretch+'\n if(vStem>.5)stretch=h/max(.20,w)*(2.75+.20*particle);');
 }
 material.vertexShader=revised;
 const source=material.fragmentShader;
 // Patch only the flame and smoke branches; preserve embers/scorch/old fallback.
 if(!source.includes('vec2 q=vUv;vec3 color;float alpha;'))throw Error('Combustion shader changed; review flipbook bridge');
 let patched=source.replace('vec2 q=vUv;vec3 color;float alpha;',
  'vec2 q=vUv;vec3 color;float alpha;');
 if(kind===1)patched=patched.replace('varying float vSeed,vAge,vPower;',
  'varying float vSeed,vAge,vPower;\nvarying float vStem;');
 if(kind===0){
  const anchor=' #elif KIND == 1';
  if(!patched.includes(anchor))throw Error('Missing fire shader branch');
  patched=patched.replace(anchor,`
 if(useFlipbook>.5){
  float time=clock*(13.+fract(vSeed*.39)*5.)+fract(vSeed*.173)*64.;
  // RC29: source-seeded orientation and bend preserve the CC0 atlas.
  float sourcePhase=fract(vSeed*.113);
  float mirrored=step(.5,sourcePhase);
  float bend=(.038*sin(q.y*3.4+clock*.61+vSeed)+
   .035*(sourcePhase-.5))*q.y*q.y;
  vec2 uv=vec2(mix(q.x,1.-q.x,mirrored)+bend,
   pow(clamp(q.y,0.,1.),.86+.32*fract(vSeed*.37)));
  uv=clamp(uv,.014,.986);
  vec4 frame=flipbook(flameAtlas,uv,time);
  // CC0 Flame03 retains its original texture/alpha; spatial temperature
  // gives the rooted core a hot yellow center and exposed tongues orange edges.
  float hotCore=(1.-smoothstep(.18,.86,abs(q.x-.5)*2.))*
   (1.-smoothstep(.36,.98,q.y));
  float thermalFlicker=.86+.14*sin(clock*(2.2+.15*fract(vSeed))+vSeed+q.y*5.1);
  color=frame.rgb*mix(vec3(1.95,.89,.30),vec3(2.32,1.52,.74),hotCore)*thermalFlicker;
  // Reduce repeated bright ribbons while retaining CC0 interior detail.
  float edge=abs(q.x-.5)*2.;
  float contactTaper=1.-smoothstep(.55+.13*sourcePhase,.98,edge);
  float flameFoot=smoothstep(0.,.075,q.y);
  alpha=frame.a*vPower*(.96+.12*sin(clock*2.6+vSeed))*
   mix(1.,contactTaper,.26+.18*sourcePhase)*flameFoot;
 }
${anchor}`);
 }
 if(kind===1){
  const anchor=' #elif KIND == 2';
  if(!patched.includes(anchor))throw Error('Missing smoke shader branch');
  patched=patched.replace(anchor,`
 if(useFlipbook>.5){
  // Animate CC0 density within lower rooted sheets, avoiding static cutouts.
  float time=vAge*63.+(rootMode>.5?clock*(3.4+fract(vSeed*.19)*1.7):0.);
  vec2 uv=clamp(q+vec2(.026*sin(q.y*4.-clock*.18+vSeed),0.),.014,.986);
  vec4 frame=flipbook(smokeAtlas,uv,time);
  if(plumeMode>.5){
   // CC0 WispySmoke03 density drives dark, layered billows, not generated
   // smoke noise. Age fade prevents hard particle loop resets.
   vec2 flow=vec2(.024*sin(q.y*8.3-clock*.39+vSeed*1.1),
                  .018*sin(q.x*9.7+clock*.27+vSeed));
   vec4 detail=flipbook(smokeAtlas,clamp(uv+flow,.014,.986),
                        time+fract(vSeed*.731)*5.);
   float feather=1.-smoothstep(.67,1.,abs(q.x-.5)*2.);
   float soot=1.-smoothstep(.18,.88,vAge);
   float density=clamp(frame.a*.72+detail.a*.48,0.,1.);
   color=mix(vec3(.023,.025,.028),vec3(.073,.078,.084),vAge)*
    (.73+.27*frame.rgb);
   alpha=density*min(1.,vPower)*(1.34+.33*soot)*feather*
    smoothstep(0.,.085,vAge)*(1.-smoothstep(.76,1.,vAge));
   if(vStem>.5){
    // The lower two cards are actual continuous soot columns: a narrow
    // source-connected foot grows into a wind-ragged upper canopy.
    // Atlas alpha still drives interior turbulence and every visible flame
    // keeps its licensed CC0 animation and original A/B fallback.
    float stemY=clamp(q.y,0.,1.);
    float stemW=.24+.40*stemY+
     .07*sin(stemY*12.+clock*.48+vSeed)+.04*sin(stemY*23.-clock*.23);
    float stemX=abs((q.x-.5)*2.);
    float stemBody=1.-smoothstep(stemW*.74,stemW+.08,stemX);
    float stemTaper=smoothstep(0.,.08,stemY)*
     (1.-smoothstep(.84,1.,stemY));
    float stemDensity=stemBody*stemTaper*
     (.30+.38*frame.a+.25*detail.a);
    alpha=max(alpha,stemDensity*.85*min(1.,vPower));
    color=mix(color,vec3(.038,.041,.045),stemBody*.42);
   }
  }else{
   // Retain RC17 licensed smoke for controlled motion A/B.
   float soot=smoothstep(.19,.88,q.y);
   color=mix(vec3(.15,.145,.14),vec3(.075,.085,.095),soot)*
    (.78+.22*frame.rgb);
   alpha=frame.a*min(1.,vPower)*.64*
    smoothstep(0.,.12,vAge)*(1.-smoothstep(.65,1.,vAge));
  }
 }
${anchor}`);
 }
 material.fragmentShader=patched.replace('void main(){',
  (kind===1?'uniform float plumeMode;\nuniform float rootMode;\n':'')+helper+'\nvoid main(){');
 start();apply();
}
export function flipbookStatus(){return {packaged:PACKAGED_FLIPBOOKS,ready:state.ready,
 mode:state.ready?mode:'procedural',textures:state.ready&&mode==='flipbook'?2:0};}
