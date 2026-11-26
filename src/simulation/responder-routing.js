import {roads} from '../../broad-street/district.js';
import {CROSS_STREETS,BROAD_LANES,BROAD_X} from './road-corridors.js';
import {VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z} from './viewer-parcels.js';

// Build an immutable road graph from the Viewer municipal centerline segments.
// Routes use real mapped intersections and segments, not an invented rear lane.
const nodes=[],edges=[];
const node=(x,z)=>{let i=nodes.findIndex(n=>Math.hypot(n.x-x,n.z-z)<.12);if(i>=0)return i;nodes.push({x,z,links:[]});return nodes.length-1;};
for(const [name,[a,b]] of roads){
 const i=node(a[0]+VIEWER_TO_GAME_X,a[1]+VIEWER_TO_GAME_Z),j=node(b[0]+VIEWER_TO_GAME_X,b[1]+VIEWER_TO_GAME_Z);
 if(i===j)continue;
 const length=Math.hypot(nodes[i].x-nodes[j].x,nodes[i].z-nodes[j].z);
 nodes[i].links.push({to:j,length});nodes[j].links.push({to:i,length});edges.push({i,j,length,name});
}
const junctions=CROSS_STREETS.map(j=>{
 let best=-1,dist=Infinity;
 for(let i=0;i<nodes.length;i++){const n=nodes[i],d=Math.hypot(n.x-j.x,n.z-VIEWER_TO_GAME_Z);if(d<dist){dist=d;best=i;}}
 return {...j,node:dist<5?best:-1};
}).filter(j=>j.node>=0);
function shortestPaths(start){
 const dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),seen=new Set();dist[start]=0;
 while(true){let i=-1,best=Infinity;for(let j=0;j<nodes.length;j++)if(!seen.has(j)&&dist[j]<best){i=j;best=dist[j];}
  if(i<0)break;seen.add(i);for(const e of nodes[i].links){const next=best+e.length;if(next<dist[e.to]){dist[e.to]=next;prev[e.to]=i;}}
 }
 return {dist,prev};
}
const paths=new Map(junctions.map(j=>[j.node,shortestPaths(j.node)]));
export function forcedVehicleRole(type){
 if(type==='fireTruck'||type==='police'||type==='ambulance'||type==='bus')return type;
 return null;
}
export function hoseReach(position,fire,range=30){
 return Math.hypot(position.x-fire.x,(position.y??0)-(fire.y??0),position.z-fire.z)<=range;
}
export function planResponderRoute(position,dir,laneZ,fire,range=30){
 let best=null;
 const forward=x=>(x-position.x)*dir>=-2;
 const offer=(plan,cost)=>{if(!best||cost<best.cost)best={...plan,cost};};
 if(forward(fire.x)&&fire.x>=BROAD_X[0]&&fire.x<=BROAD_X[1]&&hoseReach({x:fire.x,y:position.y,z:laneZ},fire,range))
  offer({entryX:fire.x,waypoints:[],staging:{x:fire.x,z:laneZ}},Math.abs(fire.x-position.x));
 for(const j of junctions){
  if(!forward(j.x))continue;
  const {dist,prev}=paths.get(j.node);
  for(const e of edges){
   const a=nodes[e.i],b=nodes[e.j],dx=b.x-a.x,dz=b.z-a.z;
   const t=Math.max(0,Math.min(1,((fire.x-a.x)*dx+(fire.z-a.z)*dz)/(e.length*e.length)));
   const staging={x:a.x+t*dx,z:a.z+t*dz};
   if(!hoseReach({...staging,y:position.y},fire,range))continue;
   const viaA=dist[e.i]+t*e.length,viaB=dist[e.j]+(1-t)*e.length;
   const end=viaA<=viaB?e.i:e.j,d=Math.min(viaA,viaB);
   if(!Number.isFinite(d))continue;
   const chain=[];for(let at=end;at>=0;at=prev[at]){chain.push({x:nodes[at].x,z:nodes[at].z});if(at===j.node)break;}
   chain.reverse();chain.push(staging);
   // The first point joins the Broad travel lane at its mapped intersection.
   const waypoints=[{x:j.x,z:laneZ},...chain].filter((p,i,a)=>i===0||Math.hypot(p.x-a[i-1].x,p.z-a[i-1].z)>.05);
   offer({entryX:j.x,waypoints,staging},Math.abs(j.x-position.x)+Math.abs(laneZ-nodes[j.node].z)+d+8);
  }
 }
 return best;
}
