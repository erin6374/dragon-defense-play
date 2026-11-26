import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {buildings} from './district.js';
import {addDistrict} from './district-geometry.js';
import {bostonProfile} from './boston-frontage.mjs';
const results=[];let row=null;
addDistrict({T,box:()=>{},tree:()=>{},mesh:(g,c)=>new T.Mesh(g,new T.MeshBasicMaterial({color:c})),block:(poly,h,c,base=0,opts={})=>{if(row&&opts.aerialRoof===false)row.roofs.push({color:c,base,h,sourcePoly:row.polys.includes(poly)});},audit:e=>{
 if(e.type==='record'){row=null;if(!/ W BOSTON ST$/.test(e.name))return;row={name:e.name,record:e.record,polys:e.polys,height:e.height,roofs:[],fronts:[]};results.push(row);}
 else if(e.type==='secondary'&&row){let p=bostonProfile(e.poly,e.name);if(p.edge!==e.j)return;let kinds=e.plan.parts.reduce((a,v)=>(a[v.kind]=(a[v.kind]??0)+1,a),{});assert.equal(e.plan.skipped.length,0);assert.equal(kinds.door,1);assert.equal(kinds.window,3);assert.equal(kinds.stoop,1);assert.equal(kinds.cornice,1);assert.equal(kinds['cornice-band'],1);assert.ok(e.plan.parts.every(q=>q.nx*p.side>.8));row.fronts.push({edge:p.edge,width:p.width,side:p.side,kinds,parts:e.plan.parts.length});}
 else if(e.type==='public-realm')row=null;
}});
assert.equal(results.length,17);for(const r of results){assert.equal(r.fronts.length,1);assert.equal(r.roofs.length,1);assert.ok(r.roofs[0].sourcePoly);assert.equal(r.roofs[0].color,bostonProfile(r.polys[0],r.name).roof);assert.ok(r.roofs[0].base<r.height);delete r.polys;}
console.log(JSON.stringify({pass:true,scope:'17 street-oriented facade candidates with schematic openings; aerial-inspired roof tones; no photo-matched elevation certification. Companion district audit checks sampled wall and neighbor clearance and AABB reachability.',source:'Review43 undated aerial; existing district.js polygon and height records',records:results,totals:{buildings:results.length,facadeParts:results.reduce((n,r)=>n+r.fronts[0].parts,0)}},null,2));
