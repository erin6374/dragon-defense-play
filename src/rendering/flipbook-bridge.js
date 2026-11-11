// Non-destructive A/B bridge for the established building-combustion pools.
// Two CC0 Houdini-simulated atlases shared by ALL building fires, no per-hit allocations.
import * as THREE from 'three';
import {PACKAGED_FLIPBOOKS,FLAME_ATLAS,SMOKE_ATLAS} from './flipbook-config.js';
const registry=new Set();
const state={started:false,ready:false,fire:null,smoke:null,error:null};
let mode='flipbook';
try{if(new URLSearchParams(location.search).get('firevfx')==='procedural')mode='procedural';}catch{}
function apply(){
 for(const u of registry){
  u.useFlipbook.value=state.ready&&mode==='flipbook'?1:0;
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
 get mode(){return state.ready?mode:'procedural';},get error(){return state.error;},
 setMode(next){if(next!=='procedural'&&next!=='flipbook')throw Error('Invalid fire mode');
 mode=next;apply();return this.mode;}
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
    center+=vec3((sway+vAge*(.35+fract(vSeed)*.55))*w,
      h*(.24+vAge*2.4),w*(.38+.1*layer));
   }else{center+=vec3((sway+layer*.10)*w,h*(.90+.12*layer),w*(.22+.11*layer));}`],
  ['float scale=w*(1.02+.16*layer);',
   'float scale=w*(1.02+.16*layer)*(useFlipbook>.5?(.65+2.1*vAge):1.);'],
  ['float stretch=2.65+.42*layer;',
   'float stretch=useFlipbook>.5?1.35:2.65+.42*layer;']
 ];
 let revised=oldVertex.replace('uniform float clock;','uniform float clock;\nuniform float useFlipbook;');
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
  if(!patched.includes(anchor))throw Error('Missing fire shader branch');
  patched=patched.replace(anchor,`
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
  if(!patched.includes(anchor))throw Error('Missing smoke shader branch');
  patched=patched.replace(anchor,`
 if(useFlipbook>.5){
  float time=vAge*63.;
  vec2 uv=clamp(q+vec2(.026*sin(q.y*4.-clock*.18+vSeed),0.),.014,.986);
  vec4 frame=flipbook(smokeAtlas,uv,time);
  // Warm gray smoke close to the burning facade, dark ash higher up;
  // prevents the previous pale wisps reading as floating white ghosts.
  float soot=smoothstep(.19,.88,q.y);
  color=mix(vec3(.15,.105,.07),vec3(.055,.065,.08),soot)*
   (.75+.25*frame.rgb);
  alpha=frame.a*min(1.,vPower)*.22*
   smoothstep(0.,.12,vAge)*(1.-smoothstep(.65,1.,vAge));
 }
${anchor}`);
 }
 material.fragmentShader=patched.replace('void main(){',helper+'\nvoid main(){');
 start();apply();
}
export function flipbookStatus(){return {packaged:PACKAGED_FLIPBOOKS,ready:state.ready,
 mode:state.ready?mode:'procedural',textures:state.ready&&mode==='flipbook'?2:0};}
