import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {buildings} from './district.js';
import {insidePoly} from './secondary-contact.mjs';
import {renderSouthDistrict} from './south-district-review25.mjs';
import {RESIDENCE_BANDS,RESIDENCE_UNITS,RESIDENCE_ROOF_COLOR} from './residence-roof.mjs';
const [polys,height,name]=buildings[1],saved=JSON.stringify(buildings[1]),boxes=[],blocks=[];
const ctx={T,box:(...args)=>boxes.push(args),block:(...args)=>blocks.push(args),mesh:(g,c,x,y,z)=>{const m=new T.Mesh(g);m.position.set(x,y,z);return m;}};
assert.equal(name,'Liacouras Walk Residence Hall');assert.equal(renderSouthDistrict(polys,height,name,ctx),true);assert.equal(JSON.stringify(buildings[1]),saved);
const caps=blocks.filter(b=>b[2]===RESIDENCE_ROOF_COLOR);assert.equal(caps.length,polys.length);for(const [poly,h,c,base,o] of caps){assert.ok(polys.includes(poly));assert.ok(Math.abs(base+h-height-.09)<1e-8);assert.equal(o.aerialRoof,false);}
const deck=height+.09;const out=[];
function check(id,x,z,w,d,h,base,c){
 const expectedY=base+h/2-.04;const matches=boxes.filter(b=>Math.abs(b[0]-x)<1e-8&&Math.abs(b[1]-expectedY)<1e-8&&Math.abs(b[2]-z)<1e-8&&Math.abs(b[3]-w)<1e-8&&Math.abs(b[4]-h)<1e-8&&Math.abs(b[5]-d)<1e-8&&b[6]===c);assert.equal(matches.length,1,id);
 const nX=Math.ceil(w/.1),nZ=Math.ceil(d/.1);assert.ok(polys.some(p=>{for(let i=0;i<=nX;i++)for(let j=0;j<=nZ;j++)if(!insidePoly(p,x-w/2+i*w/nX,z-d/2+j*d/nZ))return false;return true;}),id+' unsupported');return {id,x,z,w,d,bottom:expectedY-h/2,top:expectedY+h/2};
}
for(const [id,x,z,w,d] of RESIDENCE_BANDS){const b=check(id,x,z,w,d,.06,height+.08,0xa7a79a);assert.ok(b.bottom<deck&&b.top>deck);out.push(b);}
for(const [id,x,z,w,d,h] of RESIDENCE_UNITS){const b=check(id+' curb',x,z,w,d,.18,height+.08,0x91958b),u=check(id+' equipment',x,z,w*.79,d*.79,h,height+.22,0xb6b8ae);assert.ok(b.bottom<deck&&b.top>deck);assert.ok(u.bottom<b.top&&u.top>b.top);out.push(b,u);}
console.log(JSON.stringify({pass:true,name,height,deck,source:'Saved city-aerial-2.jpg; see 1940-ROOF-EVIDENCE.jpg; capture date unconfirmed',bands:RESIDENCE_BANDS.length,addedEquipment:RESIDENCE_UNITS.length,addedPrimitives:out.length,scope:'Actual renderSouthDistrict callbacks, roof overlap and 0.1m sampled footprint support; not exact mesh connectivity or photographic certification.',parts:out},null,2));
