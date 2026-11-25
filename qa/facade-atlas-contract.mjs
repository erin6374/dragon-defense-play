import assert from 'node:assert/strict';
import {createFacadeAtlas} from '../src/rendering/facade-atlas.js';

// Canvas-only contract: no browser/WebGL context is required. The added
// occupied-window treatments must be deterministic and remain texture-baked.
function capture(seed){
 const operations=[];
 const context={fillStyle:null,strokeStyle:null,lineWidth:1,
  createLinearGradient(){const stops=[];return {addColorStop(at,color){stops.push([at,color]);}};},
  fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));operations.push([x,y,w,h,String(this.fillStyle)]);},
  strokeRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));operations.push([x,y,w,h,String(this.strokeStyle)]);}};
 const previous=globalThis.document;
 globalThis.document={createElement(name){assert.equal(name,'canvas');return {width:0,height:0,getContext(type){assert.equal(type,'2d');return context;}};}};
 try{
  const THREE={CanvasTexture:class{constructor(canvas){this.image=canvas;}},SRGBColorSpace:'srgb'};
  const texture=createFacadeAtlas(THREE,{seed,stories:3,bays:2,kind:'brick',color:'#9a5c4a'});
  assert.equal(texture.image.width,1024);
  assert.equal(texture.image.height,1536);
  return operations;
 }finally{globalThis.document=previous;}
}
const first=capture(41),repeat=capture(41),different=capture(63);
assert.deepEqual(first,repeat,'same facade seed must reproduce identical baked details');
assert.notDeepEqual(first,different,'different seeds must vary window treatments');
assert.ok(first.some(op=>op[4]==='rgba(203,199,185,.62)'),'blinds are painted into the atlas');
assert.ok(first.some(op=>op[4]==='rgba(29,25,23,.09)'),'lintel runoff is painted into the atlas');
console.log('Facade atlas deterministic blinds, curtains and masonry weathering PASS',first.length);
