// Polygon interior intersection area in local metre coordinates.
// Integrate cross-section intersection lengths over x-slabs split at every
// vertex and segment crossing. Between cuts the lengths are piecewise linear.
// Ring parity handles holes; union of intervals handles multipart footprints.
// No source vertex is moved, rounded, snapped, clipped or repaired.
const EPS=1e-8;
export const AREA_TOLERANCE=1e-5; // numerical noise only, square metres
const cross=(ax,ay,bx,by)=>ax*by-ay*bx;
function edgesOf(polys){
 const result=[];
 for(const poly of polys){
  if(!Array.isArray(poly)||!poly.length)throw Error('Missing polygon');
  const edges=[];
  for(const ring of poly){
   if(!Array.isArray(ring)||ring.length<4||ring.some(p=>p.length!==2||!p.every(Number.isFinite)))throw Error('Invalid ring');
   if(Math.hypot(ring[0][0]-ring.at(-1)[0],ring[0][1]-ring.at(-1)[1])>EPS)throw Error('Open ring');
   for(let i=1;i<ring.length;i++){
    const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dy=b[1]-a[1];
    if(Math.abs(dx)>EPS)edges.push({a,b,dx,dy,lo:Math.min(a[0],b[0]),hi:Math.max(a[0],b[0])});
   }
  }
  result.push(edges);
 }
 return result;
}
function intervals(polys,x){
 const spans=[];
 for(const edges of polys){
  const ys=edges.filter(e=>x>e.lo&&x<e.hi).map(e=>e.a[1]+(x-e.a[0])*e.dy/e.dx).sort((a,b)=>a-b);
  if(ys.length%2)throw Error('Odd cross-section: invalid polygon topology');
  for(let i=0;i<ys.length;i+=2)if(ys[i+1]-ys[i]>EPS)spans.push([ys[i],ys[i+1]]);
 }
 spans.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const merged=[];
 for(const s of spans){const last=merged.at(-1);if(last&&s[0]<=last[1]+EPS)last[1]=Math.max(last[1],s[1]);else merged.push(s.slice());}
 return merged;
}
function sharedLength(a,b){
 let i=0,j=0,len=0;
 while(i<a.length&&j<b.length){
  len+=Math.max(0,Math.min(a[i][1],b[j][1])-Math.max(a[i][0],b[j][0]));
  if(a[i][1]<b[j][1])i++;else j++;
 }
 return len;
}
function extent(polys){const p=polys.flat(2);return [Math.min(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[0])),Math.max(...p.map(q=>q[1]))];}
export function intersectionArea(a,b){
 const aa=extent(a),bb=extent(b),lo=Math.max(aa[0],bb[0]),hi=Math.min(aa[2],bb[2]);
 if(hi-lo<=EPS||Math.min(aa[3],bb[3])-Math.max(aa[1],bb[1])<=EPS)return 0;
 const ap=edgesOf(a),bp=edgesOf(b),edges=[...ap.flat(),...bp.flat()].filter(e=>e.hi>lo&&e.lo<hi);
 if(edges.length>3000)throw Error('Polygon intersection edge budget exceeded');
 const cuts=[lo,hi];
 for(const e of edges){if(e.lo>lo&&e.lo<hi)cuts.push(e.lo);if(e.hi>lo&&e.hi<hi)cuts.push(e.hi);}
 // Include intra-geometry crossings so interval union ordering cannot change
 // inside a slab even for multipart input with overlapping components.
 for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
  const p=edges[i],q=edges[j],l=Math.max(lo,p.lo,q.lo),h=Math.min(hi,p.hi,q.hi);
  if(h-l<=EPS)continue;
  const det=cross(p.dx,p.dy,q.dx,q.dy);
  if(Math.abs(det)<=EPS)continue;
  const t=cross(q.a[0]-p.a[0],q.a[1]-p.a[1],q.dx,q.dy)/det;
  const x=p.a[0]+t*p.dx;
  if(x>l+EPS&&x<h-EPS)cuts.push(x);
 }
 cuts.sort((a,b)=>a-b);
 let area=0,prev=cuts[0];
 for(const x of cuts.slice(1)){
  if(x-prev<=EPS)continue;
  const mid=(prev+x)/2;
  area+=(x-prev)*sharedLength(intervals(ap,mid),intervals(bp,mid));
  prev=x;
 }
 if(!Number.isFinite(area)||area<0)throw Error('Invalid overlap area');
 return area;
}
export function polygonConflict(a,b){return intersectionArea(a,b)>AREA_TOLERANCE;}
