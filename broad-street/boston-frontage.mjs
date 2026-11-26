/** Boston Street: undated saved Review43 aerial + immutable city GIS.
 * Street-facing edges are selected geometrically. Openings, cornices and colors
 * are schematic rowhouse interpretations, not verified street photographs.
 */
const roofTones={1326:0x6f6d63,1327:0x645f55,1328:0x6d6b61,1329:0x6a665e,1330:0x77756a,1331:0x959184,1332:0xa6a59b,1336:0x625f56,1338:0x67665d,1339:0x68665e,1340:0xc1c0b7,1341:0xc1bfb6,1342:0xb5b4a9,1343:0x79766a,1344:0x68665c,1345:0x6e6c61,1346:0x646359};
export function bostonProfile(poly,name){
 const match=/^(\d+) W BOSTON ST$/.exec(name);if(!match)return null;
 const number=+match[1],r=poly[0],road=-573.6,side=r.reduce((s,p)=>s+p[0]/r.length,0)<road?1:-1;
 const area=r.slice(1).reduce((a,[x,z],i)=>a+r[i][0]*z-x*r[i][1],0),sign=area>=0?1:-1;
 const edges=r.slice(1).map(([x,z],i)=>{const [u,v]=r[i],len=Math.hypot(x-u,z-v),nx=sign*(z-v)/len;return {j:i+1,len,nx,dist:Math.abs((x+u)/2-road)};}).filter(e=>e.len>=2.8&&e.nx*side>.8).sort((a,b)=>a.dist-b.dist||b.len-a.len);
 if(!edges.length)return null;
 return {number,side,edge:edges[0].j,width:edges[0].len,roof:roofTones[number]??0x77746c,doorBay:number%4<2?0:1,stories:2};
}
