import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planSouthRoof,renderSouthRoof} from './south-broad-roofs.mjs';
import {renderPass19Church} from './broad-frontage-pass19.mjs';
import {renderPass20Clinic} from './broad-frontage-pass20.mjs';
const rows=JSON.parse(readFileSync(new URL('./mapped-data.json',import.meta.url),'utf8')).rows;
const out=[];
for(const id of ['1000951','1003022']){
 const row=rows.find(r=>String(r.id)===id),plan=planSouthRoof(row),before=JSON.stringify(row),blocks=[],boxes=[];
 const callbacks={block:(...p)=>blocks.push(p),box:(...p)=>boxes.push(p)};
 assert.equal((id==='1000951'?renderPass19Church:renderPass20Clinic)(row,callbacks),true);
 assert.equal(JSON.stringify(row),before);
 assert.equal(blocks.length,row.polys.length*2);
 for(let i=0;i<blocks.length;i+=2){const [poly,h,c]=blocks[i], [cap,thickness,color,base,options]=blocks[i+1];assert.strictEqual(poly,cap);assert.strictEqual(poly,row.polys[i/2]);assert.ok(Math.abs(base+thickness-plan.deck)<1e-9);assert.equal(options.aerialRoof,false);assert.equal(color,plan.color);assert.ok(base<h);}
 for(const [i,u] of plan.units.entries()){
  const [x,y,z,w,h,d]=boxes[i*2], [x2,y2,z2,w2,h2,d2]=boxes[i*2+1];
  assert.ok([x,y,z,w,h,d,x2,y2,z2,w2,h2,d2].every(Number.isFinite));
  assert.equal(x,u.x);assert.equal(z,u.z);assert.equal(x2,x);assert.equal(z2,z);
  assert.ok(y-h/2<plan.deck&&y+h/2>plan.deck);assert.ok(y2-h2/2<y+h/2);assert.ok(w2<w&&d2<d);
 }
 out.push({id,address:row.address,roofDeck:plan.deck,capColor:'#'+plan.color.toString(16).padStart(6,'0'),originalPolygons:row.polys.length,courtyardHoles:row.polys.reduce((s,p)=>s+p.length-1,0),equipment:plan.units.length,contactChecks:plan.units.length,units:plan.units});
}
console.log(JSON.stringify({pass:true,source:'city-aerial-1.jpg; acquisition date not independently confirmed',scope:'Actual Pass19/20 roof callbacks; unchanged polygon objects and cap elevations; nine sampled footprint points per equipment base outside holes; positive vertical roof and equipment overlap; no render or exact triangle intersection certification.',records:out},null,2));
