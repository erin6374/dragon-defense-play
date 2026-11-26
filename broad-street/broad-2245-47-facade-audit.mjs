import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderPass15} from './six-building-pass15.mjs';
const {rows}=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8'));
const results=[];
for(const [id,address,L,R,z] of [['1519830','2245 N BROAD ST',-322.10,-316.74,-21.71],['1536712','2247 N BROAD ST',-327.96,-322.28,-21.72]]){
 const row=rows.find(r=>String(r.id)===id);assert.ok(row);const boxes=[],blocks=[];
 assert.equal(renderPass15(row,{box:(x,y,zz,w,h,d,c)=>boxes.push({x,y,z:zz,w,h,d,c}),block:(poly,h,c,base)=>blocks.push({poly,h,c,base})}),true);
 const first=id==='1519830',eave=row.h-.05;
 const dentils=boxes.filter(b=>b.c===(first?0x796356:0x86665e)&&b.h===.15);
 assert.equal(dentils.length,20);assert.ok(dentils.every(b=>b.z+b.d/2>z+.44));
 const brackets=boxes.filter(b=>b.h===.68&&b.d===.53);assert.equal(brackets.length,2);
 const joints=boxes.filter(b=>b.c===(first?0xa69a87:0xa2a9ab)&&b.h===1.75);assert.equal(joints.length,6);
 const skins=boxes.filter(b=>b.c===(first?0xb8ad99:0xb0b7bb)&&b.d===.18);assert.equal(skins.length,1);
 const windows=boxes.filter(b=>b.c===0x536e7a&&b.h===1.65);assert.equal(windows.length,4);
 for(const b of [...dentils,...brackets,...joints,...skins]){
  assert.ok([b.x,b.y,b.z,b.w,b.h,b.d].every(Number.isFinite));assert.ok(Math.min(b.w,b.h,b.d)>0);
  assert.ok(b.x-b.w/2>=L-1e-8&&b.x+b.w/2<=R+1e-8);
  assert.ok(b.y-b.h/2>=3.95-1e-8&&b.y+b.h/2<=eave+1e-8);
 }
 results.push({id,address,dentils:dentils.length,endBrackets:brackets.length,panelJoints:joints.length,upperWindows:windows.length,frontSkins:skins.length,blocks:blocks.length});
}
console.log(JSON.stringify({pass:true,results,scope:'Explicit facade components, upper opening inventory, finite bounds, address frontage containment and visible cornice projection. Not measured dimensions or GPU review.'},null,2));
