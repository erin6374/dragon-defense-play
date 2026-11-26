/** Review43: aerial-based roof massing only; exact heights approximate.
 * City-aerial-1.jpg (5 px/m, undated); 2210 assessment one-story masonry store/office.
 * Immutable source polygons and no undocumented facade claims.
 */
export const SECONDARY_ROOF_NAMES=new Set(['Society For Helping Church','2210 N PARK AVE']);
export function secondaryRoofPlan(poly,height,name){
 if(!SECONDARY_ROOF_NAMES.has(name))return null;
 const zs=poly[0].map(p=>p[1]);
 if(name==='Society For Helping Church')return {name,kind:'hip',eave:7.45,peak:height,rect:[-215.98,-188.33,-94.78,-81.34],ridge:[-209.2,-195.2],color:0x74796b};
 const lo=Math.min(...zs),hi=Math.max(...zs),north=hi<-95;
 return {name,kind:'gable',eave:height-1.48,peak:height,rect:[north?-223.18:-223.27,north?-217.85:-218.04,lo+.07,hi-.07],color:0x73695c};
}
export function makeSecondaryRoof(T,p){
 const [x0,x1,z0,z1]=p.rect,y=p.eave-.10,h=p.peak,cx=(x0+x1)/2,cz=(z0+z1)/2;
 const pts=[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]];
 let tris;
 if(p.kind==='hip'){
  pts.push([p.ridge[0],h,cz],[p.ridge[1],h,cz]);
  tris=[[0,1,2],[0,2,3],[0,4,5],[0,5,1],[1,5,2],[2,5,4],[2,4,3],[3,4,0]];
 }else{
  pts.push([cx,h,z0],[cx,h,z1]);
  tris=[[0,1,2],[0,2,3],[0,4,1],[1,4,5],[1,5,2],[2,5,3],[3,5,4],[3,4,0]];
 }
 const center=new T.Vector3(...pts.reduce((s,p)=>s.map((v,i)=>v+p[i]/pts.length),[0,0,0]));
 for(const f of tris){const [a,b,c]=f.map(i=>new T.Vector3(...pts[i]));const n=b.clone().sub(a).cross(c.clone().sub(a));const mid=a.clone().add(b).add(c).multiplyScalar(1/3);if(n.dot(mid.sub(center))<0)[f[1],f[2]]=[f[2],f[1]];}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));geo.setIndex(tris.flat());const out=geo.toNonIndexed();out.computeVertexNormals();return out;
}
export function renderSecondaryRoof(poly,height,name,{block,box,mesh,T},shade){
 const p=secondaryRoofPlan(poly,height,name);if(!p)return null;
 block(poly,p.eave,shade);
 block(poly,.14,p.color,p.eave-.08,{aerialRoof:false});
 const roof=mesh(makeSecondaryRoof(T,p),p.color);roof.name='Review43 '+name+' closed '+p.kind+' roof';
 return p.eave;
}
