// Non-destructive A/B bridge for the established building-combustion pools.
// Two CC0 Houdini-simulated atlases shared by ALL building fires, no per-hit allocations.
import * as THREE from 'three';
import {PACKAGED_FLIPBOOKS,FLAME_ATLAS,SMOKE_ATLAS} from './flipbook-config.js';
const registry=new Set();
const state={started:false,ready:false,fire:null,smoke:null,error:null};
let mode='flipbook';
// Licensed CC0 smoke plume and RC17 smoke share the existing GPU sheets.
let smokeMode='plume';
try{const params=new URLSearchParams(location.search);
 if(params.get('firevfx')==='procedural')mode='procedural';
 if(params.get('smokevfx')==='legacy')smokeMode='legacy';
}catch{}
function apply(){
 for(const u of registry){
  u.useFlipbook.value=state.ready&&mode==='flipbook'?1:0;
  if(u.plumeMode)u.plumeMode.value=smokeMode==='plume'?1:0;
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
 setSmokeMode(next){if(next!=='legacy'&&next!=='plume')throw Error('Invalid smoke mode');
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
 if(kind===1&&!u.plumeMode)u.plumeMode={value:smokeMode==='plume'?1:0};
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
   'float height=(.84+.34*fract(vSeed*.39))*(useFlipbook>.5?1.6:1.);'],
  ['center+=vec3((sway+layer*.10)*w,h*(.90+.12*layer),w*(.22+.11*layer));',
   `if(useFlipbook>.5){
    // Independent age-dependent crosswind lanes advect the licensed
    // WispySmoke packets, without hit-time geometry or new particles.
    float lane=(fract(vSeed*.617)-.5)*2.;
    if(plumeMode>.5){
     // CC0 atlas packets form one wind-sheared, taller plume instead of
     // six short isolated wisps. Each packet retains independent age/phase.
     float gust=.90+.18*sin(clock*.31+layer*.55+vSeed*.41);
     float crosswind=-gust*(.76+.40*fract(vSeed*.193))*pow(vAge,1.42)*3.8;
     float dispersion=lane*pow(vAge,1.16)*1.25;
     // Independent ascent and buoyancy break up same-height smoke columns.
     float ascent=6.25+3.1*fract(vSeed*.719);
     float buoyancy=.24*sin(clock*(.17+.09*fract(vSeed*.413))+vSeed*.83)*pow(vAge,1.25);
     center+=vec3((sway+crosswind+dispersion)*w,
       h*(.20+vAge*ascent+buoyancy),w*(.32+.16*layer));
    }else{
     float drift=lane*pow(vAge,1.35)*(2.0+.8*fract(vSeed*.91));
     center+=vec3((sway+drift)*w,
       h*(.32+vAge*4.4),w*(.38+.1*layer));
    }
   }else{center+=vec3((sway+layer*.10)*w,h*(.90+.12*layer),w*(.22+.11*layer));}`],
  ['float scale=w*(1.02+.16*layer);',
   'float scale=w*(1.02+.16*layer)*(useFlipbook>.5?(plumeMode>.5?((.82+3.9*vAge)*(.76+.5*fract(vSeed*.367))):(.82+2.95*vAge)):1.);'],
  ['float stretch=2.65+.42*layer;',
   'float stretch=useFlipbook>.5?(plumeMode>.5?1.60:1.35):2.65+.42*layer;'],
  ['eye.xy+=vec2(p.x+p.y*.12*sin(clock*.27+vSeed),p.y*stretch)*scale*length(modelMatrix[0].xyz);',
   `vec2 sheet=vec2(p.x+p.y*.12*sin(clock*.27+vSeed),p.y*stretch);
   if(useFlipbook>.5&&plumeMode>.5){
    // Each CC0 smoke sheet gently rolls independently. Break up parallel
    // vertical card edges without touching the legacy/procedural A/B modes.
    float roll=(fract(vSeed*.377)-.5)*.28+
     .07*sin(clock*(.14+.06*fract(vSeed*.257))+vSeed);
    float cs=cos(roll),sn=sin(roll);
    sheet=mat2(cs,sn,-sn,cs)*sheet;
   }
   eye.xy+=sheet*scale*length(modelMatrix[0].xyz);`]
 ];
 let revised=oldVertex.replace('uniform float clock;','uniform float clock;\nuniform float useFlipbook;'+(kind===1?'\nuniform float plumeMode;':''));
 for(const [before,after] of vertexChanges){
  if(!revised.includes(before))throw Error('Combustion vertex changed; review bridge scale: '+before);
  revised=revised.replace(before,after);
 }
 material.vertexShader=revised;
 const source=material.fragmentShader;
 // Patch only the flame and smoke branches; preserve embers/scorch/old fallback.
 if(!source.includes('vec2 q=vUv;vec3 color;float alpha;'))throw Error('Combustion shader changed; review flipbook bridge');
 let patched=source.replace('vec2 q=vUv;vec3 color;float alpha;',
  'vec2 q=vUv;vec3 color;float alpha;');
 if(kind===0){
  const anchor=' #elif KIND == 1';
  const proceduralStart=' #if KIND == 0\n float t=';
  if(!patched.includes(anchor)||!patched.includes(proceduralStart))throw Error('Missing fire shader branch');
  // Licensed flame atlases previously evaluated procedural FBM then discarded it.
  // Gate that work, preserving the exact fallback when the atlas is not ready.
  patched=patched.replace(proceduralStart,' #if KIND == 0\n if(useFlipbook<=.5){\n float t=');
  patched=patched.replace(anchor,`
 }

 if(useFlipbook>.5){
  float time=clock*(13.+fract(vSeed*.39)*5.)+fract(vSeed*.173)*64.;
  vec2 uv=clamp(q+vec2(.02*sin(q.y*5.+clock*.76+vSeed),0.),.014,.986);
  vec4 frame=flipbook(flameAtlas,uv,time);
  color=frame.rgb*vec3(2.4,1.65,1.1);
  alpha=frame.a*vPower*(.96+.12*sin(clock*2.6+vSeed));
 }
${anchor}`);
 }
 if(kind===1){
  const anchor=' #elif KIND == 2';
  const proceduralStart=' #elif KIND == 1\n vec2 xy=';
  if(!patched.includes(anchor)||!patched.includes(proceduralStart))throw Error('Missing smoke shader branch');
  // Licensed smoke previously evaluated six procedural FBM layers per fragment.
  // Gate that work, preserving the exact fallback when the atlas is not ready.
  patched=patched.replace(proceduralStart,' #elif KIND == 1\n if(useFlipbook<=.5){\n vec2 xy=');
  patched=patched.replace(anchor,`
 }

 if(useFlipbook>.5){
  // Source-seeded atlas phase and height-dependent shear break up
  // repeated billow silhouettes without extra sheets or texture reads.
  float time=clamp(vAge*63.+(fract(vSeed*.317)-.5)*5.,0.,63.);
  if(plumeMode>.5){
   // Six source-seeded atlas clocks desynchronize repeated smoke silhouettes.
   // flipbook() already wraps the time; no extra atlas samples or particles.
   time=clock*(5.8+2.4*fract(vSeed*.229))+fract(vSeed*.317)*64.;
  }
  float lean=(fract(vSeed*.283)-.5)*.12*(q.y-.2);
  // Seeded height-varying eddies change the atlas silhouette without extra sheets.
  // Legacy smoke remains unchanged for the A/B comparison.
  float eddy=plumeMode>.5 ? .045*sin(q.y*(6.3+3.*fract(vSeed*.257))-
   clock*(.23+.07*fract(vSeed*.491))+vSeed*.67) : 0.;
  vec2 uv=clamp(q+vec2(.026*sin(q.y*4.-clock*.18+vSeed)+lean+eddy,0.),.014,.986);
  float feather=1.,ageFade=1.;
  if(plumeMode>.5){
   // Calculate the already-used silhouette and age fade before sampling.
   // A CC0 alpha texel, min(1.,vPower), and feather are all <= 1;
   // the source-seeded gain (.78 + .16*fract(...)) is strictly < .94.
   // If this upper bound is below the existing .005 alpha discard,
   // two atlas reads can be skipped with no change to visible pixels.
   float edgeWarp=.11*sin(q.y*(7.1+3.4*fract(vSeed*.29))+
    clock*(.14+.09*fract(vSeed*.37))+vSeed*.73)
    +.055*sin(q.y*16.7-clock*.11+vSeed*1.19);
   float sideBias=(fract(vSeed*.611)-.5)*.20*(q.y-.2);
   feather=1.-smoothstep(.56,.99,abs((q.x-.5)*2.+edgeWarp+sideBias));
   ageFade=smoothstep(0.,.11,vAge)*(1.-smoothstep(.78,1.,vAge));
   if(ageFade*feather*.94<.005)discard;
  }
  vec4 frame=flipbook(smokeAtlas,uv,time);
  if(plumeMode>.5){
   // CC0 WispySmoke03 density drives dark, layered billows, not generated
   // smoke noise. Age fade prevents hard particle loop resets.
   float ashBlend=smoothstep(.12,.88,vAge);
   // Dense CC0 alpha reads as soot; diffuse packets aloft become cooler ash.
   // Source seed changes soot loading without additional sheets or samples.
   float sootVariation=.76+.36*fract(vSeed*.413);
   float densityShade=mix(1.10,.73,smoothstep(.24,.84,frame.a));
   color=mix(vec3(.033,.032,.031),vec3(.088,.099,.109),ashBlend)*
    sootVariation*densityShade*(.78+.22*frame.rgb);
   alpha=frame.a*min(1.,vPower)*(.78+.16*fract(vSeed*.271))*feather*ageFade;
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
  (kind===1?'uniform float plumeMode;\n':'')+helper+'\nvoid main(){');
 start();apply();
}
export function flipbookStatus(){return {packaged:PACKAGED_FLIPBOOKS,ready:state.ready,
 mode:state.ready?mode:'procedural',textures:state.ready&&mode==='flipbook'?2:0};}
