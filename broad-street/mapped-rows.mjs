import {stops,buildings} from './district.js';
// Inspection stops are UI selectors, not new source footprints.
export function appendInspectionStops(rows){
rows.push(...stops.map(r=>({...r,h:({'1546778':18.59,'1005509':12.19,'1001853':24.08,'1546648':23.47,'1001013':41.15})[r.id]||15})));
// Second retail footprint lacked an independent inspection stop. This is a
// viewer-only selector, not an invented municipal parcel ID.
const otherShop=buildings.find(([polys,h,name])=>name==='The Shops on Liacouras Walk'&&Math.min(...polys.flat(2).map(q=>q[0]))<250);
if(otherShop){const [polys,h]=otherShop,pts=polys.flat(2),xs=pts.map(q=>q[0]),zs=pts.map(q=>q[1]),left=Math.min(...xs),right=Math.max(...xs),back=Math.min(...zs),front=Math.max(...zs);rows.push({id:'shops-north-inspection',address:'Liacouras Walk shops — north section',name:'The Shops on Liacouras Walk',x:(left+right)/2,z:(back+front)/2,w:right-left,h,front,refs:[],context:true});}
rows.sort((a,b)=>a.x-b.x);
 return rows;
}
