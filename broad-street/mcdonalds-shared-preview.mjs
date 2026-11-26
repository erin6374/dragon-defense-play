/** Reuse actual GIS geometry and the SAME commercial-source renderer for
 * the isolated RC86 building inspector, rather than an obsolete red-roof box.
 * This local recentering does not assert correct placement on the RC86 game
 * map; its city-grid mapping has its own unresolved QA gate.
 */
import * as T from 'three';
import {buildInterior} from './interiors.js';
import {renderCommercialFrontage} from './commercial-facades-20.mjs';
import {redRoofPlan} from './mcdonalds-roof-16.mjs';
import {renderMcDonaldsArches} from './landmark-fidelity-21.mjs';
import {MCD_GIS_SNAPSHOT} from './mcdonalds-gis-snapshot.mjs';
export function buildMcDonaldsSharedPreview(){
 const b=MCD_GIS_SNAPSHOT,world=new T.Group(),cube=new T.BoxGeometry(),materials=new Map();
 function material(col){if(!materials.has(col))materials.set(col,new T.MeshStandardMaterial({color:col,roughness:.81,side:T.DoubleSide}));return materials.get(col)}
 function box(x,y,z,w,h,d,c,angle=0){const o=new T.Mesh(cube,material(c));o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.y=angle;world.add(o);return o}
 function mesh(g,c){const o=new T.Mesh(g,material(c));world.add(o);return o}
 function path(ring,cls){const s=new cls();ring.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();return s}
 function block(poly,base,h,c){const s=path(poly[0],T.Shape);s.holes=poly.slice(1).map(r=>path(r,T.Path));
  const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);
  const m=mesh(g,c);m.position.y=base;return m}
 buildInterior(b,world,[0xe1dfd8,1,4],1,'restaurant');
 renderCommercialFrontage(b,{T,box,mesh,scene:world});
 const roof=redRoofPlan(b);
 for(const cap of roof.roofs)block(cap.poly,cap.base,cap.thickness,cap.color);
 for(const e of roof.edges)box(e.x,e.y,e.z,e.w,e.h,e.d,e.color,e.angle);
 renderMcDonaldsArches(T,world,b);
 // Keep the origin shift on a CHILD. The RC86 street map positions the
 // returned parent at its own approximate coordinate; assigning the offset
 // to the parent would be overwritten by street.js and displace the model.
 world.position.set(-b.x,0,-b.z);
 const local=new T.Group();local.add(world);
 local.name='mcdonalds-shared-gis-source-preview-2020-QA';
 local.userData={bsvFeature:'mcdonalds-GIS-source-reused-in-RC86-preview',sourceBuildingId:b.id,releaseApproved:false};
 return local;
}
